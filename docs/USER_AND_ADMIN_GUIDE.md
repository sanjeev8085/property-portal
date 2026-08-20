# AuraHomes — Complete User & Admin Master Guide 🏠✨

Welcome to **AuraHomes**, a modern real estate marketplace designed for verified property discovery, instant owner-buyer connections, and comprehensive admin management.

---

## 📑 Table of Contents
1. [Project Overview & Verified URLs](#1-project-overview--verified-urls)
2. [User Roles & Access Rules](#2-user-roles--access-rules)
3. [Buyer & Tenant Guide (Finding & Unlocking Properties)](#3-buyer--tenant-guide)
4. [Owner & Agent Guide (Listing & Managing Properties)](#4-owner--agent-guide)
5. [Cross-Device Synchronization & Gating](#5-cross-device-synchronization--gating)
6. [Admin Portal Guide (Management & Moderation)](#6-admin-portal-guide)
7. [Search & Budget Filtering Guide](#7-search--budget-filtering-guide)
8. [Form Validations & Security Rules](#8-form-validations--security-rules)
9. [Developer Guide (Running & Testing Locally)](#9-developer-guide)
10. [Known Limitations & Current Integration Status](#10-known-limitations--current-integration-status)

---

## 1. Project Overview & Verified URLs

| Component | Platform / URL | Details |
| :--- | :--- | :--- |
| **Frontend Portal** | `http://localhost:3000` / Vercel | Next.js 16.3.1 (React 19.2.8, TypeScript, Custom CSS) |
| **Backend API** | `https://aurahomes-backend-tz1c.onrender.com` | FastAPI 0.115.0, SQLAlchemy 2.0 Async, JWT Auth |
| **API Docs (Swagger)**| `https://aurahomes-backend-tz1c.onrender.com/docs` | Interactive OpenAPI Documentation |
| **GitHub Repository** | `https://github.com/sanjeev8085/property-portal.git` | `main` branch |

---

## 2. User Roles & Access Rules

- 🌍 **Public Visitor (No Login Needed)**:
  - Browse homepage, perform full-text and parametric searches, filter by budget/BHK/city, and view property photo galleries and specifications.
- 🔐 **Posting a Property (Login Required)**:
  - Clicking "+ Post Property" redirects unauthenticated visitors to login.
  - Any registered user (Owner, Agent, or Buyer) can create listings with full photos and dynamic specifications.
- 🛡️ **Super Admin (`user_type: admin`)**:
  - Full access to the Admin Portal (`/admin/dashboard`).
  - Moderate property listings (Approve, Reject, Verify, Feature, Delete).
  - Manage user accounts (Activate, Suspend, Block, Grant credits).

---

## 3. Buyer & Tenant Guide

### How to Search & Filter Properties:
1. **From Homepage (`/`)**:
   - Select **Buy**, **Rent**, or **Commercial**.
   - Type your desired locality (e.g. *Arera Colony*, *MP Nagar*, *Vijay Nagar*).
   - Filter by budget and click **🔍 Search**.
2. **From Search Page (`/search`)**:
   - **Purpose Filter**: Switch between **All**, **Rent**, and **Buy**.
   - **Max Budget Slider**: Drag the slider or click quick preset chips (`₹25,000`, `₹50 Lakh`, `₹1 Crore`, `Any Budget`).
   - **BHK Chips**: Tap `1 BHK`, `2 BHK`, `3 BHK`, or `4+ BHK`.
   - **Property Type**: Select between *Apartment*, *Villa / House*, *Commercial*, *Shop*, *Office*, *Plot*, *Warehouse*, or *PG / Hostel*.

### How to View Details & Unlock Owner Contact:
1. Tap on any property card to open its **Details Page** (`/properties/[id]`).
2. Review high-resolution photos, carpet area, configuration, bathrooms, furnishing status, and parking amenities.
3. Tap **"Unlock Owner Contact (1 Credit)"**:
   - If logged in with active credits, 1 credit is deducted and the owner's verified phone number and direct **WhatsApp Chat** button are revealed.
   - If credits are 0, you are redirected to choose a package at `/plans` and complete sandbox/live checkout at `/checkout/[plan_id]`.

---

## 4. Owner & Agent Guide (Listing & Managing Properties)

### How to Post a Property (9-Step Wizard at `/dashboard/properties/new`):
1. **Step 1: Purpose** — Select *Rent* or *Sell*.
2. **Step 2: Category & Property Type** — Choose Apartment, House, Villa, Commercial Shop, Office, Plot, Warehouse, or PG/Hostel.
3. **Step 3: Location Details** — Enter City, Locality, and Landmark.
4. **Step 4: Specifications** — Dynamic specs based on property type (BHK, bathrooms, floor, frontage for shops, cabins for offices, dimensions for plots).
5. **Step 5: Pricing & Financials** — Monthly Rent / Price, Security Deposit, Maintenance.
6. **Step 6: Photos & Gallery** — Upload multiple photos via drag & drop or file picker, select sample presets, and set cover image.
7. **Step 7: Description & Highlights** — Use the **Smart Description Generator** to synthesize structured listing copy from your chosen specs.
8. **Step 8: Contact Information** — Automatically pre-filled with your verified name and mobile number.
9. **Step 9: Review & Instant Publish** — Inspect summary and click **"🚀 Publish Property Listing"** (protected by double-click lock).
   - Newly created listings are assigned `status: PUBLISHED` and are immediately searchable and visible in your Owner Dashboard (`/dashboard/properties`).

---

## 5. Cross-Device Synchronization & Gating

- **Owner View Recognition:**
  - When viewing your own property on `/properties/[id]`, the system recognizes your active session and displays `👤 This is your property listing (Owner View)` with full unmasked phone and email, without requiring contact credits.
- **Buyer View Gating:**
  - Buyers view masked details (`+91 98930 XXXXX`, `sa***@gmail.com`) until unlocked via credit.
- **Atomic Session Switch:**
  - Logging in with another account flushes cached identity keys cleanly, allowing seamless multi-user switching on shared devices.

---

## 6. Admin Portal Guide (Management & Moderation)

### Accessing the Admin Portal:
1. Navigate to `/admin/login` (or `/account/profile` when logged in as admin).
2. The super admin account (`admin@aurahomes.in`) is automatically seeded upon backend startup.

### Admin Operations Suite:

| Module | URL Path | Primary Actions |
| :--- | :--- | :--- |
| **Executive Dashboard** | `/admin/dashboard` | High-level metrics: Active listings, Pending queue, Users, Revenue. |
| **Property Moderation**| `/admin/properties`| Filter by status; **Approve**, **Reject**, **Verify**, **Feature**, or **Delete** listings. |
| **User Directory** | `/admin/users` | View users; **Block**, **Suspend**, **Activate**, or **Grant Bonus Credits**. |
| **Featured Listings** | `/admin/featured` | Manage priority promoted listings on the homepage. |
| **Locations & Cities** | `/admin/locations` | Configure supported Indian cities and localities. |
| **Categories & Types** | `/admin/categories` | Manage taxonomy for residential and commercial categories. |
| **Subscription Plans** | `/admin/subscriptions`| Configure contact credit packages and pricing. |
| **Payment Ledger** | `/admin/payments` | Audit transaction logs and gateway order IDs. |
| **Content Reports** | `/admin/reports` | Resolve user-flagged fake listings or content disputes. |
| **Notifications** | `/admin/notifications`| Dispatch platform-wide broadcast alerts. |
| **Analytics** | `/admin/analytics` | View city distribution and listing growth charts. |

---

## 7. Search & Budget Filtering Guide

- **Dynamic Indian Price Formatting:**
  - Rent `< ₹1 Lakh`: Formats as `₹10,000 / Month` or `₹10,000` (eliminating confusing `₹0 Lakh` displays).
  - Buy `>= ₹1 Lakh`: Formats as `₹25.00 Lakh`.
  - Buy `>= ₹1 Crore`: Formats as `₹1.50 Cr`.
- **Responsive Mobile Specs:**
  - Quick specs grid uses `minmax(0, 1fr)` columns to prevent right-edge clipping on narrow mobile screens.

---

## 8. Form Validations & Security Rules

- **Email:** Standard RFC 5322 regex validation.
- **Mobile Number:** 10-digit Indian numeric format with optional `+91` prefix.
- **PIN Code:** Exactly 6 numeric digits.
- **Password:** Minimum 8 characters with numbers and letters.
- **Duplicate Protection:** Button disables immediately upon submission (`isPublishing = true`). Backend deduplicates matching listings submitted within the same session.

---

## 9. Developer Guide (Running & Testing Locally)

### Prerequisites
- Node.js 20+
- Python 3.12+

### Running Frontend:
```bash
cd frontend
npm install
npm run dev
# Starts on http://localhost:3000
```

### Running Backend:
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# OpenAPI Swagger UI: http://localhost:8000/docs
```

### Running Automated Test Suites:
```bash
# Frontend Unit & E2E Validation Tests (25/25 Passing)
cd frontend
npm run type-check
npm run test

# Backend Pytest Suite
cd backend
pytest tests/ -v
```

---

## 10. Known Limitations & Current Integration Status

| Component | Status | Implementation Details |
| :--- | :---: | :--- |
| **Property Search & Post Wizard** | **LIVE** | 100% functional with async database backing. |
| **Contact Unlocking & Gating** | **LIVE** | 1 credit deduction with permanent unlock persistence. |
| **WhatsApp Direct Chat** | **LIVE** | Universal Click-to-Chat protocol (`https://wa.me/...`). |
| **Payment Gateway** | **SANDBOX**| Razorpay SDK supported; simulated sandbox verification active. |
| **SMS OTP Gateway** | **MOCK** | Logs OTPs to application output (`SMS_PROVIDER=mock`). |
| **Cloud Storage** | **HYBRID** | Cloudinary/Supabase supported; Base64 Data URI fallback guarantees zero broken images. |

---

*AuraHomes Property Marketplace Portal Documentation.*
