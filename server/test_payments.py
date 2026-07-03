import unittest
import json
import time
import datetime
from bson import ObjectId
from app import app
from config.db import db

class TestPaymentsAPI(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.db = db
        self.test_email = f"tester_payment_{int(time.time())}@example.com"
        self.test_password = "password123"
        self.test_name = "Payment Test User"
        self.token = None
        self.user_id = None
        self.created_order_id = None
        
        # Register and login to retrieve a token
        if self.db is not None:
            # Create user
            reg_res = self.app.post("/api/user/register", json={
                "name": self.test_name,
                "email": self.test_email,
                "password": self.test_password
            })
            data = json.loads(reg_res.data)
            self.token = data.get("token")
            # Find the user id
            user = self.db.users.find_one({"email": self.test_email})
            if user:
                self.user_id = str(user["_id"])

    def tearDown(self):
        # Cleanup test documents
        if self.db is not None:
            if self.user_id:
                self.db.users.delete_one({"_id": ObjectId(self.user_id)})
            self.db.payments.delete_many({"userId": self.user_id})

    def test_payment_flow(self):
        if self.db is None:
            print("[SKIP] Database offline. Skipping payments integration tests.")
            return

        # Headers with JWT token
        headers = {"token": self.token}

        # 1. Create order
        order_payload = {
            "plan": "pro",
            "amount": 19900,
            "currency": "INR"
        }
        
        print("\n--- Running Test: Create Payment Order ---")
        order_res = self.app.post("/api/payment/create-order", json=order_payload, headers=headers)
        self.assertEqual(order_res.status_code, 200)
        order_data = json.loads(order_res.data)
        self.assertTrue(order_data["success"])
        self.assertIn("orderId", order_data)
        self.assertEqual(order_data["plan"], "pro")
        self.created_order_id = order_data["orderId"]

        # Check DB to confirm pending status
        payment_rec = self.db.payments.find_one({"orderId": self.created_order_id})
        self.assertIsNotNone(payment_rec)
        self.assertEqual(payment_rec["status"], "pending")

        # 2. Verify Payment (Mock Signature Validation)
        import hmac
        import hashlib
        import os
        
        key_secret = os.getenv("RAZORPAY_KEY_SECRET", "your_razorpay_secret")
        message = f"{self.created_order_id}|pay_mock_verified123"
        sig_data = hmac.new(
            key_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        verify_payload = {
            "razorpay_order_id": self.created_order_id,
            "razorpay_payment_id": "pay_mock_verified123",
            "razorpay_signature": sig_data
        }
        
        print("\n--- Running Test: Verify Payment Signature & Upgrade Plan ---")
        verify_res = self.app.post("/api/payment/verify", json=verify_payload, headers=headers)
        self.assertEqual(verify_res.status_code, 200)
        verify_data = json.loads(verify_res.data)
        self.assertTrue(verify_data["success"])
        self.assertEqual(verify_data["plan"], "pro")

        # Check user database to ensure credits and plan are updated
        user_rec = self.db.users.find_one({"_id": ObjectId(self.user_id)})
        self.assertEqual(user_rec["plan"], "pro")
        self.assertEqual(user_rec["subscriptionStatus"], "active")
        self.assertEqual(user_rec["creditBalance"], 150)
        self.assertEqual(user_rec["monthlyCreditLimit"], 150)
        self.assertEqual(user_rec["subscription"]["plan"], "pro")

        # Check payment record is marked success
        payment_rec_updated = self.db.payments.find_one({"orderId": self.created_order_id})
        self.assertEqual(payment_rec_updated["status"], "success")
        self.assertEqual(payment_rec_updated["paymentId"], "pay_mock_verified123")

        # 3. Reject duplicate payment verification
        print("\n--- Running Test: Reject Duplicate Verification ---")
        verify_dup_res = self.app.post("/api/payment/verify", json=verify_payload, headers=headers)
        self.assertEqual(verify_dup_res.status_code, 400)
        verify_dup_data = json.loads(verify_dup_res.data)
        self.assertFalse(verify_dup_data["success"])
        self.assertIn("already verified", verify_dup_data["message"])

        # 4. Fetch subscription status and billing history
        print("\n--- Running Test: Get Subscription Status & Payment History ---")
        status_res = self.app.get("/api/payment/subscription-status", headers=headers)
        self.assertEqual(status_res.status_code, 200)
        status_data = json.loads(status_res.data)
        self.assertTrue(status_data["success"])
        self.assertEqual(status_data["plan"], "pro")
        self.assertEqual(status_data["subscriptionStatus"], "active")
        self.assertEqual(status_data["credits"], 150)
        self.assertEqual(status_data["monthlyCreditLimit"], 150)
        self.assertTrue(len(status_data["paymentHistory"]) > 0)
        self.assertEqual(status_data["paymentHistory"][0]["orderId"], self.created_order_id)
        
        # 5. Webhook processing test: payment.failed
        print("\n--- Running Test: Webhook Payment Failure Callback ---")
        # Create a new order to fail
        fail_order_id = f"mock_order_fail_{int(time.time())}"
        self.db.payments.insert_one({
            "userId": self.user_id,
            "plan": "premium",
            "amount": 499.00,
            "currency": "INR",
            "orderId": fail_order_id,
            "paymentId": "",
            "status": "pending",
            "createdAt": datetime.datetime.utcnow()
        })
        
        # Webhook failed payload
        webhook_payload = {
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_failed_xyz",
                        "order_id": fail_order_id,
                        "status": "failed"
                    }
                }
            }
        }
        
        # Call webhook route without JWT headers (unprotected)
        webhook_res = self.app.post("/api/payment/webhook", 
                                    json=webhook_payload, 
                                    headers={"X-Razorpay-Signature": "sandbox_mode_signature"})
        self.assertEqual(webhook_res.status_code, 200)
        
        # Confirm DB updates
        payment_failed_rec = self.db.payments.find_one({"orderId": fail_order_id})
        self.assertEqual(payment_failed_rec["status"], "failed")
        self.assertEqual(payment_failed_rec["paymentId"], "pay_failed_xyz")
        
        # User subscription status should be set to inactive
        user_failed_rec = self.db.users.find_one({"_id": ObjectId(self.user_id)})
        self.assertEqual(user_failed_rec["subscriptionStatus"], "inactive")

if __name__ == "__main__":
    unittest.main()
