from flask import Blueprint
from flask_jwt_extended import jwt_required
from controllers.payment_controller import (
    create_order,
    verify_payment,
    get_subscription_status,
    handle_webhook
)

payment_bp = Blueprint("payment", __name__)

# Payment & Subscription endpoints
payment_bp.route("/create-order", methods=["POST"])(jwt_required()(create_order))
payment_bp.route("/verify", methods=["POST"])(jwt_required()(verify_payment))
payment_bp.route("/subscription-status", methods=["GET"])(jwt_required()(get_subscription_status))

# Webhook receiver from Razorpay (unprotected because signature verification is done on the request body)
payment_bp.route("/webhook", methods=["POST"])(handle_webhook)
