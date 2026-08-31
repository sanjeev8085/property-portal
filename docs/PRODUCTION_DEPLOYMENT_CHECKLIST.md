# AuraHomes Production Deployment Checklist

This document details all required configurations, environment variables, and pre-flight validation steps required to successfully deploy AuraHomes in a production environment.

---

## ─── ENVIRONMENT CONFIGURATION VARIABLES ───

### 🔴 Backend Secrets
These variables must be kept strictly confidential. Configure them as hidden environment variables in your hosting provider (e.g. Render, Railway, Fly.io).

* **`APP_SECRET_KEY`**: 32-character hexadecimal key used for session encryption and signing.
  * *Generation*: `python -c "import secrets; print(secrets.token_hex(32))"`
* **`JWT_SECRET_KEY`**: 64-character hexadecimal key used for JWT access and refresh token authentication.
  * *Generation*: `python -c "import secrets; print(secrets.token_hex(64))"`
* **`ADMIN_INITIAL_PASSWORD`**: The password assigned to `admin@aurahomes.in` during first database seeding. Make this a strong random value.
* **`INSECURE_DEFAULTS_FAIL_FAST`**: Set to `true` to force the server to abort startup if default/unsafe development credentials are set.

---

### 🔵 Frontend Public Variables
These variables are exposed to the client browser and are compiled into the production frontend bundle. Configure them in your frontend host (e.g. Vercel, Netlify).

* **`NEXT_PUBLIC_API_URL`**: The fully qualified URL of your running backend server (e.g. `https://api.aurahomes.in`).
* **`NEXT_PUBLIC_SITE_URL`**: The canonical URL of your frontend application (e.g. `https://www.aurahomes.in`).
* **`NEXT_PUBLIC_APP_NAME`**: Set to `"AuraHomes"`.
* **`NEXT_PUBLIC_RAZORPAY_KEY_ID`**: The Razorpay Key ID used to initialize the frontend checkout modal.

---

### 🗄️ Database (PostgreSQL)
AuraHomes uses PostgreSQL for all production storage. 
* **`DATABASE_URL`**: Connection string with PostgreSQL asyncpg dialect:
  * *Format*: `postgresql+asyncpg://<username>:<password>@<host>:<port>/<dbname>`
  * *Provider Recommendation*: Supabase PostgreSQL, AWS RDS, Neon database.

---

### ⚡ Redis Caching & Rate Limiting
Required for resilient rate-limiting clusters and subscription cache management.
* **`REDIS_URL`**: Fully qualified Redis connection URL:
  * *Format*: `redis://[:password]@<host>:<port>/0`
  * *Provider Recommendation*: Upstash Redis (Free/Pay-as-you-go).

---

### 💳 Razorpay Live Settings
* **`RAZORPAY_KEY_ID`**: Razorpay Live API key ID (e.g., `rzp_live_XXXX`).
* **`RAZORPAY_KEY_SECRET`**: Razorpay Live API secret key. Keep this private.
* **`RAZORPAY_WEBHOOK_SECRET`**: Crypto secret used to verify incoming Webhook HTTP payloads.

---

### 💬 SMS Gateway (Fast2SMS / 2Factor)
Used to send OTPs during registration and password recoveries.
* **`SMS_PROVIDER`**: Set to `"fast2sms"` or `"2factor"`.
* **`SMS_API_KEY`**: Your SMS provider authentication token.
* **`SMS_SENDER_ID`**: Six-character DLT-approved Sender ID (e.g., `AURAHM`).

---

### ☁️ Cloudinary Asset Storage
Used for persistent property listings media hosting.
* **`STORAGE_PROVIDER`**: Set to `"cloudinary"`.
* **`CLOUDINARY_CLOUD_NAME`**: Your Cloudinary account name.
* **`CLOUDINARY_API_KEY`**: Your Cloudinary API Key.
* **`CLOUDINARY_API_SECRET`**: Your Cloudinary API Secret. Keep this private.

---

### 👁️ Sentry Error Monitoring
* **`SENTRY_DSN`**: The Sentry ingestion DSN URL to capture runtime crash logs.

---

### 🔒 CORS Policies
* **`BACKEND_CORS_ORIGINS`**: A comma-separated list of legitimate production frontend domains allowed to query the API.
  * *Format*: `https://aurahomes.vercel.app,https://www.aurahomes.in` (Do NOT include wildcard `*` or `localhost` in production).

---

## ─── PRE-FLIGHT CHECKS ───

- [ ] Verify that `.env` is listed in your project `.gitignore`.
- [ ] Confirm `APP_ENV` is set to `production`.
- [ ] Confirm `DEBUG` is set to `false`.
- [ ] Ensure `INSECURE_DEFAULTS_FAIL_FAST` is set to `true`.
- [ ] Run a test connection to the production PostgreSQL cluster.
- [ ] Verify S3/Cloudinary upload directories.
- [ ] Create and verify a test endpoint webhook on your Razorpay dashboard pointing to `https://api.yourdomain.com/api/v1/payments/webhook`.
