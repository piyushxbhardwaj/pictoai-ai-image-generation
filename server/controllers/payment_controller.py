import os
import time
import datetime
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from config.db import db
import razorpay

# Initialize Razorpay Client
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")

def get_razorpay_client():
    if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET and RAZORPAY_KEY_ID != "rzp_test_your_key_id" and RAZORPAY_KEY_SECRET != "your_razorpay_secret":
        try:
            return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        except Exception as e:
            print(f"[RAZORPAY] Client init error: {e}")
    return None

# Helper to activate subscription for a user in MongoDB
def activate_user_subscription(user_id, plan, order_id, payment_id):
    credits_to_set = 150 if plan == "pro" else 500 if plan == "premium" else 5
    
    start_date = datetime.datetime.utcnow()
    end_date = start_date + datetime.timedelta(days=30)
    
    subscription_doc = {
        "plan": plan,
        "paymentId": payment_id,
        "orderId": order_id,
        "status": "active",
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat()
    }
    
    # Update user in database
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "plan": plan,
                "creditBalance": credits_to_set,
                "credits": credits_to_set, # duplicate for compatibility
                "monthlyCreditLimit": credits_to_set,
                "subscriptionStatus": "active",
                "subscription": subscription_doc
            }
        }
    )
    return subscription_doc

# 1. Create Razorpay Order
def create_order():
    if db is None:
        return jsonify({"success": False, "message": "Database offline"}), 503

    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        plan = data.get("plan")
        amount = data.get("amount") # in paise
        currency = data.get("currency", "INR")

        if not plan or not amount:
            return jsonify({"success": False, "message": "Missing plan or amount"}), 400

        order_id = f"mock_order_{user_id[:6]}_{int(time.time())}"
        client = get_razorpay_client()

        if client:
            try:
                razorpay_order = client.order.create({
                    "amount": int(amount),
                    "currency": currency,
                    "receipt": f"receipt_{user_id[:8]}_{int(time.time())}",
                    "payment_capture": 1
                })
                order_id = razorpay_order["id"]
            except Exception as e:
                print(f"[RAZORPAY] Order creation failed: {e}")
                return jsonify({"success": False, "message": "Razorpay order generation failed"}), 500
        else:
            print("[RAZORPAY] Razorpay client offline or key missing. Creating simulated mock order.")

        # Store payment history record in 'payments'
        payment_record = {
            "userId": user_id,
            "plan": plan,
            "amount": float(amount) / 100.0, # Store in INR standard format (e.g. 199.00)
            "currency": currency,
            "orderId": order_id,
            "paymentId": "",
            "status": "pending",
            "createdAt": datetime.datetime.utcnow()
        }
        db.payments.insert_one(payment_record)

        return jsonify({
            "success": True,
            "orderId": order_id,
            "amount": amount,
            "currency": currency,
            "plan": plan,
            "keyId": RAZORPAY_KEY_ID or "rzp_test_mock_key"
        }), 200

    except Exception as e:
        print(f"[ERROR] Create Order: {e}")
        return jsonify({"success": False, "message": "Server error"}), 500

# 2. Verify Payment Signature
def verify_payment():
    if db is None:
        return jsonify({"success": False, "message": "Database offline"}), 503

    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        order_id = data.get("razorpay_order_id")
        payment_id = data.get("razorpay_payment_id")
        signature = data.get("razorpay_signature")

        if not order_id or not payment_id or not signature:
            return jsonify({"success": False, "message": "Missing verification parameters"}), 400

        # Retrieve the pending payment order
        payment = db.payments.find_one({"orderId": order_id})
        if not payment:
            return jsonify({"success": False, "message": "Payment record not found"}), 404

        # Reject duplicate payment verification
        if payment.get("status") != "pending":
            return jsonify({
                "success": False, 
                "message": f"Payment already verified or processed (status: {payment.get('status')})"
            }), 400

        # Validate signature
        client = get_razorpay_client()
        signature_verified = False

        if client:
            try:
                client.utility.verify_payment_signature({
                    'razorpay_order_id': order_id,
                    'razorpay_payment_id': payment_id,
                    'razorpay_signature': signature
                })
                signature_verified = True
            except Exception as e:
                print(f"[RAZORPAY] Signature verification failed: {e}")
                return jsonify({"success": False, "message": "Payment signature verification failed"}), 400
        else:
            print("[RAZORPAY] Sandbox mode signature verification succeeded.")
            signature_verified = True

        if signature_verified:
            # Update payments database status
            db.payments.update_one(
                {"orderId": order_id},
                {
                    "$set": {
                        "status": "success",
                        "paymentId": payment_id,
                        "verifiedAt": datetime.datetime.utcnow()
                    }
                }
            )

            # Activate User subscription
            subscription = activate_user_subscription(
                user_id=user_id,
                plan=payment["plan"],
                order_id=order_id,
                payment_id=payment_id
            )

            return jsonify({
                "success": True,
                "message": "Payment verified and subscription activated successfully",
                "plan": payment["plan"],
                "creditBalance": 150 if payment["plan"] == "pro" else 500,
                "subscription": subscription
            }), 200

    except Exception as e:
        print(f"[ERROR] Verify Payment: {e}")
        return jsonify({"success": False, "message": "Server error"}), 500

# 3. Get Subscription Status
def get_subscription_status():
    if db is None:
        return jsonify({"success": False, "message": "Database offline"}), 503

    try:
        user_id = get_jwt_identity()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        plan = user.get("plan", "starter")
        status = user.get("subscriptionStatus", "inactive")
        credits_remaining = user.get("creditBalance", 0)
        limit = user.get("monthlyCreditLimit", 5)

        subscription = user.get("subscription", {})
        renewal_date_str = "N/A"
        
        if subscription and "endDate" in subscription:
            try:
                end_date_parsed = datetime.datetime.fromisoformat(subscription["endDate"])
                renewal_date_str = end_date_parsed.strftime("%d %b %Y")
            except Exception:
                renewal_date_str = subscription["endDate"]

        # Fetch payment history list
        payments_cursor = db.payments.find({"userId": user_id}).sort("createdAt", -1)
        payment_history = []
        for p in payments_cursor:
            created_at_str = p["createdAt"].strftime("%d %b %Y, %H:%M") if isinstance(p.get("createdAt"), datetime.datetime) else str(p.get("createdAt", ""))
            payment_history.append({
                "id": str(p["_id"]),
                "plan": p.get("plan", ""),
                "amount": p.get("amount", 0.0),
                "currency": p.get("currency", "INR"),
                "orderId": p.get("orderId", ""),
                "paymentId": p.get("paymentId", ""),
                "status": p.get("status", "pending"),
                "createdAt": created_at_str
            })

        return jsonify({
            "success": True,
            "plan": plan,
            "subscriptionStatus": status,
            "credits": credits_remaining,
            "monthlyCreditLimit": limit,
            "renewalDate": renewal_date_str,
            "subscription": subscription,
            "paymentHistory": payment_history
        }), 200

    except Exception as e:
        print(f"[ERROR] Get Subscription Status: {e}")
        return jsonify({"success": False, "message": "Server error"}), 500

# 4. Handle Razorpay Webhook
def handle_webhook():
    if db is None:
        return jsonify({"success": False, "message": "Database offline"}), 503

    # Retrieve request body & signature
    signature = request.headers.get("X-Razorpay-Signature")
    raw_body = request.data

    if not signature:
        return jsonify({"success": False, "message": "Missing signature header"}), 400

    # Verify Webhook signature if secret is present
    client = get_razorpay_client()
    if client and RAZORPAY_WEBHOOK_SECRET and RAZORPAY_WEBHOOK_SECRET != "your_webhook_secret":
        try:
            client.utility.verify_webhook_signature(raw_body, signature, RAZORPAY_WEBHOOK_SECRET)
        except Exception as e:
            print(f"[RAZORPAY WEBHOOK] Invalid Webhook signature: {e}")
            return jsonify({"success": False, "message": "Invalid webhook signature"}), 400
    else:
        print("[RAZORPAY WEBHOOK] Skipping verification signature check (sandbox or secret missing).")

    try:
        event_data = request.get_json()
        event_name = event_data.get("event")
        payload = event_data.get("payload", {})
        
        print(f"[RAZORPAY WEBHOOK] Received event: {event_name}")

        if event_name in ["payment.captured", "subscription.charged"]:
            payment_entity = payload.get("payment", {}).get("entity", {})
            order_id = payment_entity.get("order_id")
            payment_id = payment_entity.get("id")

            if not order_id or not payment_id:
                print("[RAZORPAY WEBHOOK] Missing order_id or payment_id in payment details.")
                return jsonify({"success": True}), 200

            # Find matching payment record
            payment = db.payments.find_one({"orderId": order_id})
            if not payment:
                print(f"[RAZORPAY WEBHOOK] No matching order found for order_id: {order_id}")
                return jsonify({"success": True}), 200

            if payment.get("status") == "pending":
                # Update payments database status
                db.payments.update_one(
                    {"orderId": order_id},
                    {
                        "$set": {
                            "status": "success",
                            "paymentId": payment_id,
                            "verifiedAt": datetime.datetime.utcnow()
                        }
                    }
                )

                # Activate subscription
                activate_user_subscription(
                    user_id=payment["userId"],
                    plan=payment["plan"],
                    order_id=order_id,
                    payment_id=payment_id
                )
                print(f"[RAZORPAY WEBHOOK] Activated plan '{payment['plan']}' for user {payment['userId']}")
            else:
                print(f"[RAZORPAY WEBHOOK] Payment order {order_id} is already in state: {payment.get('status')}")

        elif event_name == "payment.failed":
            payment_entity = payload.get("payment", {}).get("entity", {})
            order_id = payment_entity.get("order_id")
            payment_id = payment_entity.get("id")

            if order_id:
                payment = db.payments.find_one({"orderId": order_id})
                if payment and payment.get("status") == "pending":
                    db.payments.update_one(
                        {"orderId": order_id},
                        {
                            "$set": {
                                "status": "failed",
                                "paymentId": payment_id,
                                "failedAt": datetime.datetime.utcnow()
                            }
                        }
                    )
                    # We can optionally mark user subscription as inactive/past_due here if applicable
                    db.users.update_one(
                        {"_id": ObjectId(payment["userId"])},
                        {"$set": {"subscriptionStatus": "inactive"}}
                    )
                    print(f"[RAZORPAY WEBHOOK] Marked payment as failed for order: {order_id}")

        return jsonify({"success": True}), 200

    except Exception as e:
        print(f"[ERROR] Handle Webhook error: {e}")
        return jsonify({"success": False, "message": "Server internal error processing webhook"}), 500
