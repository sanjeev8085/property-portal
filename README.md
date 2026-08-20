# 🏠 Property Marketplace Portal

A modern, full-stack property listing platform for Rent and Sale listings in India.

> 📖 **Comprehensive System Manual & Architecture Guide:** [`docs/SYSTEM_DOCUMENTATION.md`](file:///d:/sanjeev_tyagi/property-portal/docs/SYSTEM_DOCUMENTATION.md)  
> 👥 **User & Admin Operations Guide:** [`docs/USER_AND_ADMIN_GUIDE.md`](file:///d:/sanjeev_tyagi/property-portal/docs/USER_AND_ADMIN_GUIDE.md)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Backend | FastAPI (Python 3.12+) |
| Database | PostgreSQL 16 |
| Storage | AWS S3 / MinIO (local) |
| Auth | JWT + OTP + Google OAuth |
| Payments | Razorpay |
| Cache | Redis |
| Container | Docker + Docker Compose |

---

## Project Structure

```
property-portal/
├── frontend/         # Next.js application
├── backend/          # FastAPI application
├── nginx/            # Reverse proxy config
├── scripts/          # Dev & deployment scripts
├── .github/          # CI/CD workflows
└── docker-compose.yml
```

---

## Quick Start (Development)

### Prerequisites

- [Node.js 20+](https://nodejs.org/en/download)
- Python 3.12+
- Docker Desktop
- Git

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd property-portal
cp .env.example .env
# Edit .env with your values
```

### 2. Start all services (Docker)

```bash
docker-compose up -d
```

### 3. Run backend (local development)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
alembic upgrade head          # Run DB migrations
python -m uvicorn app.main:app --reload --port 8000
```

### 4. Run frontend (after installing Node.js)

```bash
cd frontend
npm install
npm run dev
```

### 5. Seed development data

```bash
cd backend
python scripts/seed.py
```

---

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (Redoc) | http://localhost:8000/redoc |
| Adminer (DB GUI) | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |

---

## Running Tests

```bash
# Backend tests
cd backend
pytest --cov=app tests/ -v

# Frontend tests (after Node.js install)
cd frontend
npm run test
npm run test:e2e
```

---

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

---

## License

Private & Proprietary.
