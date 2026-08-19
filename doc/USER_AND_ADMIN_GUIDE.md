# AuraHomes — Complete User & Admin Master Guide 🏠✨

Welcome to **AuraHomes**, a modern, mobile-first real estate portal designed for verified property discovery, instant owner-buyer connections, and comprehensive admin management.

---

## 📑 Table of Contents
1. [Project Overview & Live Links](#1-project-overview--live-links)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Buyer & Tenant Guide (Finding & Unlocking Properties)](#3-buyer--tenant-guide)
4. [Owner & Agent Guide (Listing Properties)](#4-owner--agent-guide)
5. [Cross-Device Synchronization Guide](#5-cross-device-synchronization)
6. [Admin Portal Guide (Management & Moderation)](#6-admin-portal-guide)
7. [Search & Max Budget Guide](#7-search--max-budget-guide)
8. [Form Validations & Security Rules](#8-form-validations--security-rules)
9. [Developer Guide (Running & Testing Locally)](#9-developer-guide)
10. [Updating This Project](#10-updating-this-project)

---

## 1. Project Overview & Live Links

| Component | Platform / URL | Details |
| :--- | :--- | :--- |
| **Frontend Portal** | `http://localhost:3000` / Vercel | Next.js 16 (Turbopack, TypeScript, Responsive CSS) |
| **Backend API** | `https://aurahomes-backend-tz1c.onrender.com` | FastAPI, PostgreSQL, Redis, JWT Auth |
| **API Docs (Swagger)**| `https://aurahomes-backend-tz1c.onrender.com/docs` | Interactive OpenAPI 3.0 Documentation |
| **GitHub Repository** | `https://github.com/sanjeev8085/property-portal.git` | Main branch |

---

## 2. User Roles & Permissions

AuraHomes provides distinct role-based permissions:

```
                  ┌────────────────────────┐
                  │    AuraHomes Users     │
                  └───────────┬────────────┘
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Buyer / Tenant  │ │  Owner / Agent   │ │   Super Admin    │
│  - Search & Buy  │ │  - Post Listings │ │  - Full Control  │
│  - Unlock Phone  │ │  - Manage Specs  │ │  - Moderate Ads  │
│  - Buy Credits   │ │  - Upload Photos │ │  - User RBAC     │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

1. **Buyer / Tenant (`user_type: buyer`)**:
   - Search across Buy, Rent, and Commercial properties.
   - Filter by Max Budget, BHK size, City, Locality, and Furnishing status.
   - Save properties to favorites wishlist.
   - Purchase Contact Credits or Subscriptions to reveal owner phone number & WhatsApp chat.
2. **Property Owner (`user_type: owner`)**:
   - Post free or premium listings with dynamic specifications.
   - Upload high-resolution photos with cover image selection.
   - Generate AI-powered SEO-friendly property descriptions.
   - Track listing views and interested buyers in the Owner Dashboard.
3. **Real Estate Agent / Broker (`user_type: agent`)**:
   - Post multiple builder floors, luxury penthouses, plots, shops, and commercial offices.
   - Manage multiple listings with real-time analytics and lead notifications.
4. **Super Admin (`user_type: admin`)**:
   - Protected behind authentication and role verification (`/admin/login`).
   - Full property approval, rejection, and featuring capabilities.
   - User account status management (activate/suspend/ban).
   - Subscription revenue and financial tracking.

---

## 3. Buyer & Tenant Guide

### How to Search & Filter Properties:
1. **From Homepage (`/`)**:
   - Select **Buy**, **Rent**, or **Commercial**.
   - Type your desired locality (e.g. *Arera Colony*, *MP Nagar*, *Vijay Nagar*).
   - Choose property type or leave as **All Property Types**.
   - Enter your budget limit (e.g. *₹25,000* or *₹80 Lakh*) and click **🔍 Search**.
2. **From Search Page (`/search`)**:
   - **Looking To**: Switch seamlessly between **All**, **Rent**, and **Buy**.
   - **Max Budget Controls**:
     - Drag the price slider.
     - Or tap one of the quick budget preset chips (e.g., `₹50 Lakh`, `₹1 Crore`, `₹2 Crore`, `Any Budget`).
   - **BHK Filters**: Tap `1 BHK`, `2 BHK`, `3 BHK`, or `4 BHK`.
   - **Property Type**: Select between *Apartment*, *Villa / House*, *Commercial*, *Shop*, *Office*, *Plot*, *Warehouse*, or *PG / Hostel*.

### How to View Details & Unlock Owner Contact:
1. Tap on any property card to open its **Details Page** (`/properties/[id]`).
2. Explore high-res photos, size in Sq Ft, Bathrooms, Furnishing status, and Parking amenities.
3. Tap **"Unlock Contact Details"**:
   - If logged in with active credits, the owner's verified phone number and a one-tap **WhatsApp Chat** button will immediately unlock.
   - If credits are 0, choose a credit pack or monthly subscription plan.

---

## 4. Owner & Agent Guide (Listing Properties)

### How to Post a Property (9-Step Wizard):
Navigate to `/dashboard/properties/new` and follow the guided wizard:

- **Step 1 — Purpose**: Choose **For Rent** or **For Sale (Buy)**.
- **Step 2 — Category & Type**:
  - Residential: *Apartment*, *Villa / House*, *Independent Floor*.
  - Commercial: *Shop / Retail*, *Office Space*, *Warehouse*.
  - Land / Other: *Plot / Land*, *PG / Hostel*.
- **Step 3 — Location**: Enter City (*Bhopal*, *Indore*, etc.), Area/Locality, Full Address, and 6-digit Pincode.
- **Step 4 — Dynamic Specifications**:
  - **For Residential**: Carpet Area (Sq Ft), BHK Configuration, Bathrooms, Furnishing (*Fully Furnished*, *Semi-Furnished*, *Unfurnished*), and **Parking Facility** (*1 Covered Car Parking*, *2 Covered*, *Open*, *2-Wheeler*).
  - **For Shop**: Carpet Area, Frontage width, Floor (Ground/1st/Basement), Road Facing, Washroom availability, and Suitable business types.
  - **For Office**: Carpet Area, Cabins, Workstations, Conference Room, Pantry, and 100% DG Power Backup.
  - **For Plot**: Plot Area, Dimensions (Length × Breadth), Boundary Wall, Corner Plot road width, and Facing Direction.
  - **For Warehouse**: Covered Area, Clear Ceiling Height, Loading Docks, and 40ft Container Truck Access.
- **Step 5 — Pricing**: Enter Monthly Rent (for rentals) or Total Expected Price (for sale) with deposit and maintenance details.
- **Step 6 — Photos Upload**:
  - Pick files from your device (JPG, PNG, WebP) or drag-and-drop.
  - Set any photo as the **⭐ Main Cover Photo** with 1 click.
  - Delete unwanted pictures or use **✨ Load Sample Photos** for instant testing.
- **Step 7 — AI Description Generator**: Tap **"✨ Generate AI Description"** to create a tailored, SEO-rich marketing description based on your exact specs.
- **Step 8 — Contact Details**: Add owner name, contact number, and WhatsApp number.
- **Step 9 — Preview & Publish**: Review the specification summary pills and tap **"Publish Property Listing"**.

Your listing immediately goes live across all search and buy lists with a **`⭐ Your Listed Property`** badge!

---

## 5. Cross-Device Synchronization

### How Mobile & Laptop Sync Works:
When you post a property from your mobile phone:
1. The property is saved to the **Cloud Backend Database** on Render (`POST /api/v1/properties/`).
2. The property status is set to `PUBLISHED` automatically.
3. When you or any other user open the website on a **laptop, desktop, or tablet**, the search page (`/search`) and homepage (`/`) automatically fetch the latest properties from the cloud API.
4. Your mobile-uploaded property will appear at the top of the search and buy listings on your laptop!

---

## 6. Admin Portal Guide

### Accessing the Admin Dashboard:
1. Navigate to `/admin/login`.
2. Login with your Admin credentials (`user_type: admin`).
3. If a non-admin attempts to access `/admin/*`, the system automatically blocks access and displays the **Access Restricted (RBAC)** security screen.

### Admin Features:
- **📊 Analytics Dashboard (`/admin/dashboard` & `/admin/analytics`)**: View total properties, active users, total inquiries, and monthly subscription revenue.
- **🏠 Properties Moderation (`/admin/properties`)**: View all submitted listings, approve pending entries, reject non-compliant posts, or toggle **Featured** badges.
- **👥 Users Management (`/admin/users`)**: View registered buyers, owners, and agents. Activate, suspend, or update user permissions.
- **💳 Payments & Subscriptions (`/admin/payments` & `/admin/subscriptions`)**: Audit transactions, credit purchases, and active subscription plans.
- **📍 Locations & Categories (`/admin/locations`, `/admin/categories`)**: Manage supported cities (Bhopal, Indore, etc.) and property categories.
- **🔔 Notifications (`/admin/notifications`)**: Broadcast announcements and system alerts.

---

## 7. Search & Max Budget Guide

The Search Engine provides real-time client & server filtering:

```
Search Input  ───►  Purpose Normalization (Buy/Sell/Rent)
              ───►  Max Budget Filter (Presets: ₹50L, ₹1Cr, ₹2Cr, Any Budget)
              ───►  BHK Filter (1, 2, 3, 4+ BHK)
              ───►  Locality & Keyword Matching
              ───►  Sorted Results (Your Listings first ──► Newest)
```

- **Buy Range**: Scales from ₹5 Lakhs up to ₹5 Crores with instant preview chips.
- **Rent Range**: Scales from ₹5,000 up to ₹2,00,000 / month.
- **Any Budget / No Limit**: Disables the upper ceiling to display all luxury and affordable spaces.

---

## 8. Form Validations & Security Rules

All client inputs are strictly validated before submission:

| Field | Rule / Regex | Example Valid Value |
| :--- | :--- | :--- |
| **Email** | Valid standard email format | `sanjeev@example.com` |
| **Mobile Number** | 10 Indian digits (optional `+91`) | `9893024190`, `+919893024190` |
| **Pincode** | Exactly 6 numeric digits | `462016`, `452010` |
| **Password** | Min 8 characters with letters & digits | `Password123!` |
| **OTP** | Exactly 6 numeric digits | `123456` |
| **Price** | Positive numeric value | `22000`, `8500000` |
| **Admin Access** | Requires valid JWT token & `user_type === 'admin'` | Enforced in middleware & API |

---

## 9. Developer Guide

### Running Frontend Locally:
```bash
cd frontend
npm install
npm run dev
# App opens at http://localhost:3000
```

### Running Backend Locally:
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# API docs at http://localhost:8000/docs
```

### Running Automated Test Suites:
```bash
cd frontend
npm test
# Executes all 18 Unit, Form Validation, Utility, and E2E Workflow tests
```

### Building for Production:
```bash
cd frontend
npm run build
# Compiles all 36 routes with 0 errors
```

---

## 10. Updating This Project

Whenever you add new features, update database models, or alter UI components:
1. **Update Code**: Make changes cleanly with TypeScript types and responsive CSS.
2. **Run Tests**: Ensure `npm test` passes 100%.
3. **Verify Production Build**: Confirm `npm run build` succeeds with 0 errors.
4. **Update Documentation**: Keep this file (`doc/USER_AND_ADMIN_GUIDE.md`) updated with any new routes or features.
5. **Commit & Push**:
   ```bash
   git add .
   git commit -m "Your descriptive commit message"
   git push origin main
   ```

---
*Created and maintained for AuraHomes Real Estate Portal.*
