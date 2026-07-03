# 🔌 PictoAI REST API Documentation

This document describes all API endpoints exposed by the PictoAI Flask backend.

All endpoints (except Authentication registration/login and Razorpay Webhook receivers) require a valid JWT Bearer Token in the headers:
```http
Authorization: Bearer <your_jwt_access_token>
```

---

## 🔐 Authentication Endpoints

### 1. `POST /api/auth/register`
* **Description**: Register a new user account.
* **Request Headers**: `Content-Type: application/json`
* **Request Payload**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "plan": "starter",
      "subscriptionStatus": "inactive",
      "monthlyCreditLimit": 50
    }
  }
  ```
* **Error Response (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "Email already exists"
  }
  ```

### 2. `POST /api/auth/login`
* **Description**: Authenticate a user and return a JWT access token.
* **Request Headers**: `Content-Type: application/json`
* **Request Payload**:
  ```json
  {
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "plan": "starter",
      "subscriptionStatus": "inactive",
      "monthlyCreditLimit": 50
    }
  }
  ```
* **Error Response (404 Not Found)**:
  ```json
  {
    "success": false,
    "message": "User doesn't exist"
  }
  ```

### 3. `GET /api/auth/credits`
* **Description**: Retrieve the authenticated user's current credit balance and plan status.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "credits": 49,
    "user": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "plan": "starter",
      "subscriptionStatus": "inactive",
      "monthlyCreditLimit": 50,
      "subscription": null
    }
  }
  ```

---

## 🎨 Image Generation Endpoints

### 1. `POST /api/image/generate-image`
* **Description**: Synthesize a digital image using the multi-provider failover routing pipeline.
* **Request Payload**:
  ```json
  {
    "prompt": "neon tiger in virtual reality",
    "model": "HD",
    "style": "Cyberpunk",
    "aspect": "16:9"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Image Generated",
    "creditBalance": 48,
    "resultImage": "data:image/png;base64,iVBORw0KGg...",
    "resultImageUrl": "http://localhost:3000/static/generated/92a7e4b9...png"
  }
  ```
* **Success Cache Response (200 OK - Served from Cache)**:
  ```json
  {
    "success": true,
    "message": "Image Generated (Cached)",
    "creditBalance": 48,
    "resultImage": "data:image/png;base64,iVBORw0KGg...",
    "resultImageUrl": "http://localhost:3000/static/generated/92a7e4b9...png"
  }
  ```
* **Error Response (200 OK - Insufficient Credits)**:
  ```json
  {
    "success": false,
    "message": "No Credit Balance",
    "creditBalance": 0
  }
  ```

### 2. `POST /api/image/upscale`
* **Description**: Simulate upscaling of a generated image.
* **Request Payload**:
  ```json
  {
    "amount": 2
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Image Upscaled"
  }
  ```

---

## 💳 Payment & Subscription Endpoints

### 1. `POST /api/payment/create-order`
* **Description**: Generate a Razorpay order ID to process credit purchases.
* **Request Payload**:
  ```json
  {
    "plan": "pro",
    "amount": 19900,
    "currency": "INR"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "orderId": "order_Hsp1k8sAx9z2b8",
    "amount": 19900,
    "currency": "INR",
    "plan": "pro",
    "keyId": "rzp_test_mockkeyid"
  }
  ```

### 2. `POST /api/payment/verify`
* **Description**: Validate Razorpay transaction signatures and activate user subscriptions.
* **Request Payload**:
  ```json
  {
    "razorpay_order_id": "order_Hsp1k8sAx9z2b8",
    "razorpay_payment_id": "pay_Hsp2h6fAp9z3c9",
    "razorpay_signature": "8a93c7890bf23d45e67a..."
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Payment verified and subscription activated successfully",
    "plan": "pro",
    "creditBalance": 150,
    "subscription": {
      "plan": "pro",
      "paymentId": "pay_Hsp2h6fAp9z3c9",
      "orderId": "order_Hsp1k8sAx9z2b8",
      "status": "active",
      "startDate": "2026-07-03T12:00:00Z",
      "endDate": "2026-08-02T12:00:00Z"
    }
  }
  ```

### 3. `GET /api/payment/subscription-status`
* **Description**: Fetch billing status and full transaction invoice list.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "plan": "pro",
    "subscriptionStatus": "active",
    "credits": 142,
    "monthlyCreditLimit": 150,
    "renewalDate": "02 Aug 2026",
    "subscription": { ... },
    "paymentHistory": [
      {
        "id": "64a2f8c...",
        "plan": "pro",
        "amount": 199.00,
        "currency": "INR",
        "orderId": "order_Hsp1k8sAx9z2b8",
        "paymentId": "pay_Hsp2h6fAp9z3c9",
        "status": "success",
        "createdAt": "03 Jul 2026, 17:50"
      }
    ]
  }
  ```

### 4. `POST /api/payment/webhook`
* **Description**: Asynchronous event receiver for Razorpay backend updates.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true
  }
  ```
