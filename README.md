# 🎨 PictoAI — AI-Powered Art Generation Platform

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-2.0+-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/React-18.0+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/MongoDB-5.0+-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License" />
</p>

**PictoAI** is an AI-powered art generation platform built with React, Flask, and Stable Diffusion, featuring automatic failover routing, prompt caching, and Razorpay subscription checkouts.

---

### 📊 Project Statistics

* **Stack**: React (Vite) + Flask Full Stack
* **Auth**: JWT Session Protection (Flask-JWT-Extended)
* **AI Pipelines**: Multi-Provider Routing (4 Failover Tiers)
* **Database**: MongoDB
* **Payments**: Razorpay checkout integration
* **Testing**: End-to-End API Integration tests
* **Resiliency**: DB-Offline local sandbox fallback mode

---

## 📸 Screenshots

| 🌟 Workspace (Generated) | ⚙️ Workbench (Empty) |
|:---:|:---:|
| [![Workspace Generated](screenshots/workspace_generated.png)](screenshots/workspace_generated.png) | [![Workspace Empty](screenshots/workspace_empty.png)](screenshots/workspace_empty.png) |
| *Click to enlarge* | *Click to enlarge* |

---

## 🚀 Live Demo & Links

* **Live Frontend Demo**: *Coming Soon*
* **Walkthrough Video**: *Coming Soon*
* **Local Sandbox Mode**: Instantly bootable locally without active MongoDB databases or external AI API keys.

---

## ⚡ Key Engineering Highlights

* **✅ Multi-Provider AI Inference**: Failover AI router that sequentially executes local CUDA GPU models, Hugging Face Serverless APIs, and Clipdrop before returning fallback canvas graphics.
* **✅ MD5 Prompt Caching**: Eliminates redundant GPU compute and third-party API costs by hashing prompts and checking database caches first.
* **✅ JWT Session Authorization**: Protects user credit transactions with bcrypt password hashing and Flask-JWT bearer tokens.
* **✅ Razorpay Webhook Receivers**: Fully integrated checkout workflows driven by signature-verified transaction event listeners.
* **✅ Integration Regression Tests**: End-to-end endpoint validations covering sessions, images, and payments.
* **✅ DB-Offline Fail-Safe**: Detects local DB statuses to run fully in offline sandbox simulator mode.

---

## 🛠 Tech Stack & Developer Role

### Technologies
* **Frontend**: React, Vite, Axios, HSL CSS Themes
* **Backend**: Flask, Flask-JWT-Extended, PyMongo, Pillow (PIL)
* **AI Inference**: Stable Diffusion, Hugging Face, Clipdrop
* **Database**: MongoDB
* **Payments**: Razorpay Gateway

### 👨‍💻 Role
**Sole Developer** responsible for system architecture, endpoint designs, frontend context models, failover logic, payment capture webhooks, testing suites, and local mock sandbox modes.

---

## ✨ Features

* **Multi-Provider Generation**: Try local GPU diffusers first, then cloud fallbacks.
* **Granular Options**: Custom art styles (Cyberpunk, Anime), aspect ratios, and prompt strengths.
* **Prompt Caching**: Match prompt hashes to serve cached images instantly.
* **Credit Purchases**: Multi-tier credit purchasing flows backed by Razorpay.
* **History drawers**: UI persistence showing recent creations surviving page reloads.

---

## 🧠 System Architecture Diagram

```mermaid
graph TD
    subgraph Client
        UI[Neon UI Workbench]
        Context[React AppState]
        AxiosClient[Axios Client]
    end

    subgraph Server
        API[Flask Endpoints]
        Auth[JWT Protection]
        Router[Failover Router]
    end

    subgraph AI
        LocalSD[1. Local CUDA SD]
        HF_API[2. HF Inference API]
        Clipdrop[3. Clipdrop API]
        Offline[4. Canvas Fallback]
    end

    subgraph Storage
        DB[(MongoDB)]
    end

    UI --> Context
    Context --> AxiosClient
    AxiosClient --> API
    API --> Auth
    Auth --> Router
    Router --> LocalSD
    Router --> HF_API
    Router --> Clipdrop
    Router --> Offline
    Router --> DB
```

---

## 📁 Folder Structure

```text
client/         # React Frontend (Vite, AppContext)
server/         # Flask Backend (routes, controllers, models)
screenshots/    # Clickable project preview screenshots
.env.example    # Root setup variable template
LICENSE         # MIT Open-source license file
README.md       # Project developer guide
```

---

## 🧠 Engineering Challenges & Core Solutions

### 1. Handling Long and Flaky AI Inference Times
* **Challenge**: Local AI models require massive VRAM and take 30s+ on standard machines, while cloud APIs are prone to rate limits and downtime.
* **Solution**: Developed a sequential failover pipeline in the AI router. When local GPUs are unavailable or cloud APIs fail, the backend catches the error and executes alternative endpoints, significantly improving reliability during provider failures.

### 2. Eliminating Duplicate GPU Computes
* **Challenge**: Users entering the exact same prompts with matching aspect ratios repeatedly drain developer credits and load servers.
* **Solution**: Generated MD5 hashes of prompt, style, model, and aspect parameters. Duplicate hashes serve the pre-rendered image path directly from MongoDB in milliseconds.

### 3. Verification of Multi-Provider Binary Payloads
* **Challenge**: Failover APIs can succeed but return truncated or corrupted binary packages.
* **Solution**: Integrated Pillow (PIL) image verification on incoming bytes, validating file structures before storage or credit subtraction.

---

## 💡 Lessons Learned

* **Fault-Tolerant Architectures**: Designing robust sequential failovers ensuring high service availability.
* **Authentication Security**: Protecting billing features using cryptographically signed JWT tokens and salted bcrypt hashes.
* **Latency Management**: Implementing metadata caching algorithms to bypass heavy inference pipelines.
* **Signature Verification**: Developing secure backend listeners to process financial status updates from third-party payment gateways.

---

## 🔌 REST API Overview

Detailed request/response JSON schemas can be found in [docs/API.md](file:///d:/Project/PICTOAI-main/docs/API.md).

| Verb | Endpoint | Authentication | Description |
|:---|:---|:---:|:---|
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user and issue JWT |
| `GET` | `/api/auth/credits` | Required | Retrieve session balance & plans |
| `POST` | `/api/image/generate-image` | Required | Run failover AI image generator |
| `POST` | `/api/image/upscale` | Required | Request upscale simulation |
| `POST` | `/api/payment/create-order` | Required | Generate Razorpay order details |
| `POST` | `/api/payment/verify` | Required | Validate payment and activate plan |
| `POST` | `/api/payment/webhook` | Public | Capture Razorpay transaction events |

---

## 🧪 Testing Coverage

The codebase contains end-to-end integration tests (located in [test_endpoints.py](file:///d:/Project/PICTOAI-main/server/test_endpoints.py)) verifying:
* API Endpoint path checks and HTTP codes.
* JWT secure routes access controls.
* Razorpay payment signature verifier outputs.
* Multi-provider fallback loops.
* MD5 hash caching matches.

Execute tests locally with:
```bash
python server/test_endpoints.py
```

---

## 🚀 Deployment Ready Configuration

* **Frontend**: Host-ready Vite build assets designed for static hosting platforms (Vercel, Netlify).
* **Backend**: WSGI compliant script ready to run via Gunicorn on Render, AWS ECS, or Heroku.
* **Database**: MongoDB Atlas cloud cluster connections.
* **Payments**: Razorpay test/production environment variables.
* **Environment Variables**: Configure values securely using host provider environment panels.

---

## 🗺 Future Roadmap

- [ ] **Docker Containers**: Combine client, server, and DB in a single `docker-compose` definition.
- [ ] **Redis Memory Caching**: Relieve MongoDB connections by mapping credit checking to Redis.
- [ ] **Asynchronous Workers**: Shift long-running local GPU Stable Diffusion executions to Celery.
- [ ] **Content Classification**: Hook prompt fields to lightweight CLIP-NSFW filters.

---

## ⚙️ Local Setup Instructions

See the detailed configuration steps in the [Local Setup section](file:///d:/Project/PICTOAI-main/README.md#1-backend-configuration) or refer to [.env.example](file:///d:/Project/PICTOAI-main/server/.env.example).

---

## 📄 License
This project is licensed under the **MIT License** - see the [LICENSE](file:///d:/Project/PICTOAI-main/LICENSE) file for details.
