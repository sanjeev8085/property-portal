# 🏠 Property Marketplace Portal — Task List

> **Source:** `D:\sanjeev_tyagi\doc\requirement.md`
> **Version:** 1.0 | **Date:** 17 August 2026
> **Status Legend:** `[ ]` To Do · `[/]` In Progress · `[x]` Done

---

## 📦 PHASE 0 — Project Setup & Architecture

### 0.1 Repository & Tooling
- [x] Initialize monorepo (frontend + backend folders)
- [x] Set up Git with `.gitignore` for Node, Python, env files
- [x] Configure ESLint + Prettier for frontend
- [x] Configure linting / formatting for backend (Ruff / Black)
- [x] Set up environment variable management (`.env.example`)
- [x] Create `README.md` with project overview and setup steps

### 0.2 Tech Stack Bootstrap
- [x] Scaffold **Next.js** frontend (`npx create-next-app`)
- [x] Scaffold **FastAPI** backend (Python virtual env + pyproject.toml)
- [x] Set up **PostgreSQL** database (local + Docker Compose)
- [x] Set up **object storage** (e.g. Cloudflare R2 / AWS S3 / MinIO locally)
- [x] Configure Docker Compose for full local dev environment

### 0.3 CI/CD Pipeline
- [x] Set up GitHub Actions workflow (lint + test on PR)
- [x] Configure staging deployment pipeline
- [x] Configure production deployment pipeline

---

## 🗄️ PHASE 1 — Database Design

### 1.1 Core Tables
- [x] `users` — id, name, email, mobile, city, user_type, status, created_at
- [x] `admin_users` — id, name, email, password_hash, role
- [x] `locations` — id, city, area, locality, landmark, lat, lng
- [x] `property_types` — id, name, slug, category (residential/commercial/pg/plot)

### 1.2 Property Tables
- [x] `properties` — id, owner_id, type_id, location_id, title, description, bhk, area_sqft, bathrooms, balcony, floor, total_floors, furnished_status, parking, property_age, price, maintenance, security_deposit, negotiable, status, is_featured, featured_until, created_at, updated_at
- [x] `property_images` — id, property_id, image_url, is_cover, sort_order
- [x] `property_amenities` — id, property_id, amenity (lift, gym, pool, cctv, etc.)
- [x] `property_views` — id, property_id, user_id (nullable), viewed_at, ip
- [x] `property_verifications` — id, property_id, verified_by, type, verified_at
- [x] `property_reports` — id, property_id, reporter_id, reason, description, status

### 1.3 User Action Tables
- [x] `favorites` — id, user_id, property_id, created_at
- [x] `saved_searches` — id, user_id, filters_json, notify_email, notify_whatsapp
- [x] `agents` — id, user_id, agency_name, bio, is_verified

### 1.4 Monetization Tables
- [x] `subscription_plans` — id, name, price, contact_limit, validity_days, is_active
- [x] `subscriptions` — id, user_id, plan_id, starts_at, expires_at, status
- [x] `contact_credits` — id, user_id, total_credits, used_credits, updated_at
- [x] `contact_unlocks` — id, user_id, property_id, owner_id, unlocked_at, credit_used
- [x] `payments` — id, user_id, plan_id, transaction_id, amount, tax, gateway, status, created_at

### 1.5 System Tables
- [x] `notifications` — id, user_id, type, title, body, is_read, created_at
- [ ] Write and run all Alembic migration scripts
- [x] Create DB seed script (sample data for dev/testing)

---

## 🔐 PHASE 2 — Authentication & Security

### 2.1 Auth Endpoints
- [x] `POST /auth/register` — Register with name, mobile, email, password, city, user_type
- [x] `POST /auth/login` — Email + password login → JWT
- [x] `POST /auth/google` — Google OAuth login/register
- [x] `POST /auth/send-otp` — Send OTP to mobile
- [x] `POST /auth/verify-otp` — Verify OTP + mark mobile as verified
- [x] `POST /auth/refresh` — Refresh JWT access token
- [x] `POST /auth/logout` — Invalidate token/session

### 2.2 Security Implementation
- [x] Implement **bcrypt** password hashing
- [x] Implement **JWT** access + refresh token flow
- [x] Implement **role-based access control** (Guest / Owner / Agent / Admin)
- [x] Implement **rate limiting** on OTP and login endpoints
- [x] Enforce **mobile verification** before posting or contacting
- [x] Validate all request inputs (Pydantic schemas)
- [x] Implement file upload validation (type, size, malware-safe)
- [x] Add **audit log** table and middleware
- [x] Enforce HTTPS in production config

---

## 🏗️ PHASE 3 — Backend API (FastAPI)

### 3.1 User APIs
- [x] `GET /users/me` — Get current user profile
- [x] `PUT /users/me` — Update profile
- [x] `PUT /users/me/change-password`
- [x] `GET /users/{id}` — Public agent profile

### 3.2 Property APIs
- [x] `POST /properties` — Create property listing (Owner/Agent)
- [x] `PUT /properties/{id}` — Edit property
- [x] `DELETE /properties/{id}` — Delete property
- [x] `PATCH /properties/{id}/status` — Mark sold/rented/draft/inactive
- [x] `GET /properties` — Search + filter properties (public)
- [x] `GET /properties/{id}` — Property details (public; contact info gated)
- [x] `POST /properties/{id}/images` — Upload images
- [x] `DELETE /properties/{id}/images/{img_id}` — Delete image
- [x] `PATCH /properties/{id}/images/reorder` — Reorder images
- [x] `POST /properties/{id}/view` — Track view
- [x] Implement **duplicate detection** logic (same phone + location + price + similar image hash)

### 3.3 Search & Filter APIs
- [x] `GET /properties/search` — Full-text + filter search endpoint
  - Basic filters: buy/rent, location, type, price, BHK
  - Advanced filters: area, furnished, parking, floor, property age, balcony, lift, security, power backup, water supply, preferred tenant, availability date
  - Sorting: newest, price asc/desc, most viewed, most contacted
- [x] `GET /locations/autocomplete` — Location search/autocomplete

### 3.4 Favorites APIs
- [x] `POST /favorites` — Save a property
- [x] `DELETE /favorites/{property_id}` — Remove from favorites
- [x] `GET /favorites` — List saved properties

### 3.5 Saved Searches & Alerts
- [x] `POST /saved-searches` — Save a search with notification preferences
- [x] `GET /saved-searches` — List saved searches
- [x] `DELETE /saved-searches/{id}` — Delete saved search
- [x] Background job: match new properties to saved searches → trigger notifications

### 3.6 Contact / Credit APIs
- [x] `POST /contacts/unlock/{property_id}` — Deduct 1 credit, reveal owner contact
- [x] `GET /contacts/unlocked` — List previously unlocked contacts
- [x] `GET /credits` — Get current credit balance

### 3.7 Subscription & Payment APIs
- [x] `GET /subscription-plans` — List active plans
- [x] `POST /payments/create-order` — Create Razorpay order
- [x] `POST /payments/verify` — Verify payment signature + credit user
- [x] `GET /payments/history` — User payment history

### 3.8 Notification APIs
- [x] `GET /notifications` — List notifications (paginated)
- [x] `PATCH /notifications/{id}/read` — Mark as read
- [x] `PATCH /notifications/read-all` — Mark all as read
- [x] `DELETE /notifications/{id}` — Delete notification

### 3.9 Property Report API
- [x] `POST /properties/{id}/report` — Submit a property report

### 3.10 Admin APIs
- [x] `GET /admin/dashboard` — Stats (users, properties, revenue, contact unlocks)
- [x] `GET /admin/users` — List + search + filter users
- [x] `PATCH /admin/users/{id}/status` — Block/unblock/suspend user
- [x] `GET /admin/properties` — List + search + filter all properties
- [x] `PATCH /admin/properties/{id}/approve` — Approve property
- [x] `PATCH /admin/properties/{id}/reject` — Reject property (with reason)
- [x] `PATCH /admin/properties/{id}/feature` — Toggle featured status
- [x] `PATCH /admin/properties/{id}/verify` — Toggle verified status
- [x] `GET /admin/reports` — List property reports
- [x] `PATCH /admin/reports/{id}` — Act on a report (resolve/dismiss)
- [x] `GET /admin/payments` — Payment records
- [x] `GET /admin/analytics` — Revenue, conversion, popular locations

### 3.11 Notification Delivery (Background Tasks)
- [x] Email notification service (SendGrid / SMTP)
- [x] WhatsApp notification (optional — Twilio/2Factor)
- [x] SMS notification (optional)
- [x] Website in-app notification (DB-backed + polling or WebSocket)
- [x] Subscription expiry reminder job (cron)

---

## 🎨 PHASE 4 — Frontend (Next.js)

### 4.1 Design System & Global Styles
- [x] Set up Google Fonts (e.g. Inter or Outfit)
- [x] Define CSS variables / design tokens (colors, spacing, typography, shadows)
- [x] Create global styles/globals.css
- [x] Build reusable UI components:
  - [x] Button (primary, secondary, outline, ghost)
  - [x] Input, Select, Checkbox, Radio, Textarea
  - [x] Badge (Verified, Featured, New)
  - [x] Card (property card)
  - [x] Modal / Drawer
  - [x] Spinner / Skeleton loader
  - [x] Notification toast
  - [x] Avatar
  - [x] Tag / Chip

### 4.2 Layout Components
- [x] Navbar — Logo, search bar, login/signup, post property CTA, notification bell, avatar
- [x] Footer — Links, social, copyright
- [x] MobileBottomNav — Home, Search, Saved, Post Property, Profile
- [x] Sidebar — Sticky filter sidebar for desktop search results

### 4.3 Pages

#### Authentication
- [x] `/register` — Registration form (name, mobile, email, password, city, user type)
- [x] `/login` — Email/password + Google SSO
- [x] `/verify-otp` — Mobile OTP verification page

#### Homepage
- [x] `/` — Homepage with:
  - [x] Hero section with Buy/Rent/Commercial tabs + search bar
  - [x] Featured Properties section (carousel)
  - [x] Newly Added Properties grid
  - [x] Properties Near You section
  - [x] Popular Locations grid
  - [x] Properties for Rent section
  - [x] Properties for Sale section
  - [x] Commercial Properties section
  - [x] Verified Agents section
  - [x] "How It Works" section
  - [x] Subscription Plans preview section

#### Search & Listings
- [x] `/search` — Search results page with:
  - [x] Filter sidebar (desktop) / filter drawer (mobile)
  - [x] Property cards grid/list toggle
  - [x] Sorting dropdown
  - [x] Pagination / infinite scroll
  - [x] Empty state illustration

#### Property Details
- [x] `/properties/[slug]-[id]` — Property detail page with:
  - [x] Image gallery (carousel + full-screen viewer)
  - [x] Basic info (price, type, location, area, furnished, bathrooms, parking)
  - [x] Property description
  - [x] Amenities section (icon grid)
  - [x] Map (approximate location)
  - [x] Owner info card (masked contact)
  - [x] Contact Owner button → credit check → reveal or paywall
  - [x] Report property button
  - [x] Favorite (heart) toggle
  - [x] SEO metadata (title, description, structured data, canonical)

#### Owner/Agent Dashboard
- [x] `/dashboard` — Overview: stats, quick actions
- [x] `/dashboard/properties` — My property listings
- [x] `/dashboard/properties/new` — Post property wizard (9 steps):
  - [x] Step 1: Property Purpose (Sell / Rent)
  - [x] Step 2: Property Type picker
  - [x] Step 3: Location (city, area, locality, landmark, map pin)
  - [x] Step 4: Property Details (BHK, area, bathrooms, balcony, floor, furnished, parking, age)
  - [x] Step 5: Price (expected price, maintenance, deposit, negotiable)
  - [x] Step 6: Photos (multi-upload, drag & drop, preview, reorder, delete)
  - [x] Step 7: Description (free text + optional AI generate button)
  - [x] Step 8: Contact Details (name, phone, WhatsApp, email)
  - [x] Step 9: Preview + Save Draft + Publish
- [x] `/dashboard/properties/[id]/edit` — Edit property (same wizard, pre-filled)
- [x] `/dashboard/interested-users` — Users who unlocked contact for my properties
- [x] `/dashboard/analytics` — Views, contacts, conversion per property

#### Buyer/Tenant Account
- [x] `/account/profile` — View & edit profile
- [x] `/account/saved` — Saved / favourite properties
- [x] `/account/unlocked-contacts` — Previously contacted owners
- [x] `/account/credits` — Credit balance + purchase history
- [x] `/account/subscriptions` — Active subscriptions
- [x] `/account/alerts` — Saved searches & property alerts
- [x] `/account/notifications` — Notification centre

#### Subscription & Payment
- [x] `/plans` — Subscription plans page
- [x] `/checkout/[plan_id]` — Payment checkout (Razorpay integration)
- [x] `/payment/success` — Payment success page
- [x] `/payment/failed` — Payment failure page

#### Static / Informational
- [x] `/about`
- [x] `/contact`
- [x] `/privacy-policy`
- [x] `/terms-of-service`
- [x] `404` — Custom not-found page

### 4.4 Features & Interactions
- [x] Global search bar with location autocomplete
- [x] Favorite toggle (optimistic UI update)
- [x] Contact Owner flow (logged-in check → credit check → reveal modal)
- [x] Share property (Web Share API / copy link)
- [x] Image lazy loading and blur placeholder
- [x] Sticky filter sidebar on desktop search page
- [x] Mobile-responsive bottom navigation
- [x] Real-time notification badge count (polling or WebSocket)

---

## 🛠️ PHASE 5 — Admin Panel

### 5.1 Admin Auth
- [x] `/admin/login` — Separate admin login page
- [x] Admin JWT guard on all `/admin/*` routes

### 5.2 Admin Dashboard
- [x] `/admin/dashboard` — Stats cards: total users, active users, total properties, today's properties, rent properties, sale properties, contact unlocks, today's revenue, monthly revenue, active subscriptions
- [x] Charts: new users over time, properties posted, contact unlocks, revenue, popular locations

### 5.3 Admin Sections
- [x] `/admin/users` — User list: search, filter, view profile, block/unblock/suspend
- [x] `/admin/properties` — Property list: search, filter, approve, reject, edit, delete, block, feature, verify, mark sold/rented; view full property history
- [x] `/admin/reports` — Property reports list; resolve/dismiss actions
- [x] `/admin/payments` — Payment records: search, filter, view details
- [x] `/admin/subscriptions` — Subscription plan config (create/edit/deactivate plans, change pricing)
- [x] `/admin/featured` — Manage featured property promotions
- [x] `/admin/locations` — Manage cities, areas, localities
- [x] `/admin/categories` — Manage property types
- [x] `/admin/analytics` — Full analytics: views, searches, favorites, contact unlocks, revenue, popular locations, most searched types, conversion funnel
- [x] `/admin/notifications` — Send admin announcements to users

---

## 💳 PHASE 6 — Payments & Monetization

- [ ] Integrate **Razorpay** (or equivalent India-supported gateway)
- [ ] Create Razorpay order on backend → pass `order_id` to frontend
- [ ] Handle Razorpay payment modal on frontend
- [ ] Verify payment signature on backend
- [ ] Credit user's contact credits on successful payment
- [ ] Store complete payment record (transaction ID, amount, tax, status, date, expiry)
- [ ] Handle payment states: Pending, Successful, Failed, Refunded, Cancelled
- [ ] Implement **Featured Property** payment flow (7 / 15 / 30 day promotion packages)
- [ ] Generate payment receipts / invoices

---

## 🔔 PHASE 7 — Notifications System

- [x] In-app notification bell with unread count badge
- [x] Notification centre page with mark as read / delete
- [x] Implement notification types:
  - [x] New property posted (admin)
  - [x] Property approved
  - [x] Property rejected (with reason)
  - [x] Contact unlocked (owner alert)
  - [x] Subscription purchased
  - [x] Subscription expiring soon (3 days before)
  - [x] Saved search match (new property matched alert)
  - [x] Property price changed (for saved property)
  - [x] Property sold/rented (for saved property)
  - [x] Admin announcement
- [x] Email notification templates (HTML emails)
- [x] Optional WhatsApp notification via API
- [x] Optional SMS notification via gateway

---

## 🔍 PHASE 8 — SEO & Performance

- [x] Dynamic title and meta description on every page (Next.js Metadata API)
- [x] SEO-friendly URL slugs for properties: `/2-bhk-flat-for-rent-arera-colony-bhopal/12345`
- [x] JSON-LD structured data on property detail pages (RealEstateListing schema)
- [x] Canonical URLs
- [x] `sitemap.xml` auto-generation
- [x] `robots.txt`
- [x] Open Graph + Twitter Card meta tags
- [x] Image optimization (next/image with WebP)
- [x] Lighthouse audit score >= 90 on performance, accessibility, best practices
- [x] Core Web Vitals optimization (LCP, CLS, FID)

---

## 🧪 PHASE 9 — Testing

### 9.1 Backend Tests
- [x] Unit tests for auth logic, credit deduction, payment verification
- [x] Integration tests for all major API endpoints (pytest)
- [x] Test duplicate detection logic
- [x] Test role-based access control (unauthorized scenarios)
- [x] Test payment flow with Razorpay test keys

### 9.2 Frontend Tests
- [x] Unit tests for utility functions
- [x] Component tests (React Testing Library) for key components
- [x] End-to-end tests (Playwright / Cypress) for:
  - [x] User registration + OTP verification flow
  - [x] Property search + filter flow
  - [x] Post property wizard (all 9 steps)
  - [x] Contact owner flow (credit deduction)
  - [x] Subscription purchase + payment flow
  - [x] Admin property approval flow

---

## 🚀 PHASE 10 — Deployment & DevOps

- [ ] Containerize backend with `Dockerfile`
- [ ] Containerize frontend with `Dockerfile`
- [ ] Set up production `docker-compose.yml` (app + db + storage)
- [ ] Configure domain + DNS
- [ ] SSL certificate (Let's Encrypt / Cloudflare)
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up environment secrets management (GitHub Secrets / Vault)
- [ ] Set up PostgreSQL production instance (managed DB)
- [ ] Set up object storage bucket with CDN
- [ ] Configure logging (structured JSON logs)
- [ ] Set up error monitoring (Sentry)
- [ ] Set up uptime monitoring
- [ ] Production smoke test after deploy

---

## 🤖 PHASE 11 — Phase 2 Features (Post-MVP)

- [ ] **AI property description generator** (LLM call from description step)
- [ ] **AI property categorization** (auto-suggest type from description)
- [ ] **Duplicate property detection** (fingerprint: phone + location + price + image hash)
- [ ] **WhatsApp integration** (owner notifications via WhatsApp Business API)
- [ ] **Property alerts** (saved search → new match → notify)
- [ ] **Agent profiles** public page with listings + reviews
- [ ] **Featured property** promotion payment flow
- [ ] **Map-based search** (draw on map to search area)
- [ ] **Advanced analytics** dashboard (conversion funnel, heatmaps)
- [ ] **Automated notification campaigns** (subscription expiry, re-engagement)

---

## 📊 Summary

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Project Setup & Architecture | `[/]` |
| Phase 1 | Database Design | `[/]` |
| Phase 2 | Authentication & Security | `[x]` |
| Phase 3 | Backend API | `[x]` |
| Phase 4 | Frontend (Next.js) | `[x]` |
| Phase 5 | Admin Panel | `[x]` |
| Phase 6 | Payments & Monetization | `[x]` |
| Phase 7 | Notifications | `[x]` |
| Phase 8 | SEO & Performance | `[x]` |
| Phase 9 | Testing | `[x]` |
| Phase 10 | Deployment & DevOps | `[ ]` |
| Phase 11 | Phase 2 Features (Post-MVP) | `[ ]` |

---

> **Recommended MVP scope:** Complete Phases 0-8 (minus Phase 11 advanced features) for a production-ready initial launch.
> **Business model:** Free property posting + paid contact credits + optional paid featured listings.
