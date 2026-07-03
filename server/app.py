import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

print("RAZORPAY_KEY_ID loaded:", bool(os.getenv("RAZORPAY_KEY_ID")))
print("RAZORPAY_KEY_SECRET loaded:", bool(os.getenv("RAZORPAY_KEY_SECRET")))

app = Flask(__name__)

# Configure CORS - allow frontend to connect
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
]
CORS(app, origins=allowed_origins)


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, token"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    return response

import datetime

# JWT Configuration
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "secret#text")
app.config["JWT_HEADER_NAME"] = "token"
app.config["JWT_HEADER_TYPE"] = ""
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(days=30)
jwt = JWTManager(app)

# Import blueprints
from routes.auth_routes import auth_bp
from routes.image_routes import image_bp
from routes.health_routes import health_bp
from routes.payment_routes import payment_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix="/api/user")
app.register_blueprint(image_bp, url_prefix="/api/image")
app.register_blueprint(payment_bp, url_prefix="/api/payment")
app.register_blueprint(health_bp)

# Root route for frontend health check compatibility
@app.route("/", methods=["GET"])
def index():
    return "API Working fine..."

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    print(f"[INFO] PictoAI Flask Backend booting on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
