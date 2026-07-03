import os
from flask import request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity
import bcrypt
from bson import ObjectId
from config.db import db

# Helper function to check if database is online
def check_db_online():
    return db is not None

# 1. Register User
def register_user():
    if not check_db_online():
        return jsonify({
            "success": False,
            "message": "Database offline. Please click the 'Live API' badge in the Navbar to switch to Demo Sandbox."
        }), 503

    try:
        data = request.get_json()
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        if not name or not email or not password:
            return jsonify({"success": False, "message": "Missing Details"}), 400

        # Check if email already exists
        existing_user = db.users.find_one({"email": email})
        if existing_user:
            return jsonify({"success": False, "message": "Email already exists"}), 400

        # Hash password using bcrypt
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        user_data = {
            "name": name,
            "email": email,
            "password": hashed_password,
            "creditBalance": 50, # Default 50 credits on signup
            "monthlyCreditLimit": 50,
            "plan": "starter",
            "subscriptionStatus": "inactive",
            "subscription": None
        }

        result = db.users.insert_one(user_data)
        user_id = str(result.inserted_id)

        # Create JWT access token
        token = create_access_token(identity=user_id)

        return jsonify({
            "success": True,
            "token": token,
            "user": {
                "name": name,
                "email": email,
                "plan": "starter",
                "subscriptionStatus": "inactive",
                "monthlyCreditLimit": 50
            }
        }), 201
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"success": False, "message": "Server error"}), 500

# 2. Login User
def login_user():
    if not check_db_online():
        return jsonify({
            "success": False,
            "message": "Database offline. Please click the 'Live API' badge in the Navbar to switch to Demo Sandbox."
        }), 503

    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"success": False, "message": "Missing Details"}), 400

        user = db.users.find_one({"email": email})
        if not user:
            return jsonify({"success": False, "message": "User doesn't exist"}), 404

        # Validate password using bcrypt
        if bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
            token = create_access_token(identity=str(user["_id"]))
            return jsonify({
                "success": True,
                "token": token,
                "user": {
                    "name": user.get("name"),
                    "email": user.get("email"),
                    "plan": user.get("plan", "starter"),
                    "subscriptionStatus": user.get("subscriptionStatus", "inactive"),
                    "monthlyCreditLimit": user.get("monthlyCreditLimit", 50)
                }
            }), 200
        else:
            return jsonify({"success": False, "message": "Invalid credentials"}), 400
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"success": False, "message": "Server error"}), 500

# 3. Get User Credits
def get_user_credits():
    if not check_db_online():
        return jsonify({
            "success": False,
            "message": "Database offline. Please click the 'Live API' badge in the Navbar to switch to Demo Sandbox."
        }), 503

    try:
        user_id = get_jwt_identity()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        return jsonify({
            "success": True,
            "credits": user.get("creditBalance", 0),
            "user": {
                "name": user.get("name"),
                "email": user.get("email"),
                "plan": user.get("plan", "starter"),
                "subscriptionStatus": user.get("subscriptionStatus", "inactive"),
                "monthlyCreditLimit": user.get("monthlyCreditLimit", 50),
                "subscription": user.get("subscription", None)
            }
        }), 200
    except Exception as e:
        print(f"Get credits error: {e}")
        return jsonify({"success": False, "message": "Server error"}), 500

# 4. Handle Payment Success and Update Credits
def handle_payment_success():
    if not check_db_online():
        return jsonify({
            "success": False,
            "message": "Database offline. Please click the 'Live API' badge in the Navbar to switch to Demo Sandbox."
        }), 503

    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        payment_amount = data.get("paymentAmount", 0)

        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        new_balance = user.get("creditBalance", 0) + payment_amount
        
        # Update user's credit balance in DB
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"creditBalance": new_balance}}
        )

        return jsonify({
            "success": True,
            "message": "Payment Successful",
            "creditBalance": new_balance
        }), 200
    except Exception as e:
        print(f"Payment success handler error: {e}")
        return jsonify({"success": False, "message": "Server error"}), 500
