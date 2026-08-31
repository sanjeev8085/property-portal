# 🔥 FINAL PRE-LAUNCH AUDIT — AURAHOMES

You have already completed a production-readiness audit of AuraHomes.

The previous audit reported:

* 57 backend tests passing
* 25 frontend E2E tests passing
* Next.js production build successful
* Critical security vulnerabilities fixed
* Overall score: 96/100

DO NOT simply accept that result.

Perform a **SECOND, INDEPENDENT FINAL PRE-LAUNCH AUDIT**.

Your job is now to determine whether AuraHomes can safely be deployed to a REAL production environment and presented to a REAL CLIENT.

Do not assume something is working because the previous report says it is working.

Every important production capability must be either:

**VERIFIED**

or

**NOT VERIFIED**

---

# 1. PRODUCTION ENVIRONMENT

Verify:

* Production frontend URL
* Production backend URL
* HTTPS
* DNS
* CORS
* Environment variables
* Database URL
* Redis URL
* Storage configuration
* Email configuration
* SMS configuration
* Razorpay configuration
* JWT secrets
* Application secrets

Search the entire repository for:

* localhost
* 127.0.0.1
* development URLs
* test URLs
* hardcoded credentials
* test API keys
* mock services
* demo configuration

Report every occurrence and whether it is safe.

---

# 2. REAL PAYMENT FLOW

Test the complete payment lifecycle.

Test:

SUCCESS:
User → Plan → Razorpay order → Payment → Verification → Webhook → Credits → Database

FAILURE:
Payment failed → Correct application state

DUPLICATE:
Same webhook received twice → Credits must NOT be added twice

MANIPULATION:
Modified payment response → Must be rejected

REPLAY:
Old webhook/payment data reused → Must be rejected

TIMEOUT:
Payment succeeds but webhook is delayed → System must recover correctly

Verify database consistency after every scenario.

---

# 3. AUTHENTICATION SECURITY

Test:

* Registration
* Login
* Logout
* Refresh token
* Access token expiration
* Refresh token expiration
* Password reset
* OTP
* Invalid OTP
* Expired OTP
* OTP brute force
* Login brute force
* Session reuse
* Token reuse
* Password change

Verify that an attacker cannot:

* Bypass authentication
* Become another user
* Become admin
* Reuse expired tokens
* Reset another user's password
* Enumerate sensitive account information

---

# 4. COMPLETE RBAC MATRIX

Create a permission matrix for:

* Unauthenticated user
* Normal user
* Agent
* Admin

Test EVERY protected API.

For every endpoint verify:

* Authentication
* Authorization
* Object ownership
* Role permissions

Pay special attention to:

* Delete property
* Update property
* Admin moderation
* User management
* Database reset
* Payment
* Contact unlock
* Profile modification

Do not rely on frontend hiding buttons.

Backend authorization must enforce everything.

---

# 5. DATABASE SAFETY

Verify:

* PostgreSQL production configuration
* Migrations
* Foreign keys
* Unique constraints
* Indexes
* Transactions
* Race conditions
* Duplicate records
* Orphan records
* Cascade behaviour

Test concurrent contact-credit deduction.

Example:

100 simultaneous unlock requests with only 1 credit.

Expected result:

**Exactly one successful deduction.**

No negative balance.

---

# 6. BACKUP & DISASTER RECOVERY

This is mandatory.

Determine:

* Is automatic database backup configured?
* How frequently?
* How long are backups retained?
* Can a backup actually be restored?
* Has restore been tested?
* What happens after database corruption?
* What happens after accidental deletion?

If no tested recovery process exists:

mark:

🔴 **NOT PRODUCTION READY**

---

# 7. RATE LIMITING & ABUSE

Test:

* Login
* Registration
* OTP
* Password reset
* Search
* Property posting
* Contact unlock
* Payment creation

Attempt rapid repeated requests.

Record:

* Rate limit
* HTTP response
* Retry behaviour
* Lockout behaviour

Check whether rate limits can be bypassed using:

* Different IP
* Different headers
* Parallel requests

---

# 8. FILE & IMAGE SECURITY

Test uploads with:

* Valid image
* Invalid extension
* Wrong MIME type
* Fake MIME type
* Oversized file
* Malicious filename
* Path traversal filename
* Empty file
* Corrupted image
* Duplicate file

Verify that uploaded files cannot execute code.

Verify private files cannot be accessed by unauthorized users.

---

# 9. API SECURITY

Test every API for:

* Authentication
* Authorization
* Input validation
* SQL injection
* XSS payloads
* Excessive input size
* Missing required fields
* Invalid types
* Invalid IDs
* Object-level authorization

Look specifically for:

**IDOR / Broken Object Level Authorization**

Example:

User A must not be able to modify User B's property by changing:

`property_id`

in the request.

---

# 10. PRODUCTION ERROR HANDLING

Intentionally cause:

* Database failure
* Redis failure
* Storage failure
* API timeout
* Payment timeout
* Invalid request
* Missing record
* Network failure

Verify that users receive:

* Friendly error
* Correct HTTP status
* No stack trace
* No database details
* No secrets
* No internal file paths

---

# 11. FRONTEND QUALITY

Check:

* Console errors
* Console warnings
* Network failures
* Hydration errors
* Broken images
* Broken links
* 404 pages
* Loading states
* Empty states
* Error states
* Success states

Production target:

**ZERO unexplained critical console errors.**

---

# 12. RESPONSIVE TEST

Test:

320
360
375
390
414
480
768
820
1024
1280
1366
1440
1536
1920
2560

Check:

* Header
* Navigation
* Search
* Filters
* Property cards
* Property detail
* Gallery
* Forms
* Dashboard
* Admin panel
* Tables
* Modals

Check for horizontal overflow at every viewport.

---

# 13. REAL MOBILE TEST

Test using mobile-style interaction:

* Touch
* Swipe
* Keyboard
* Back button
* Scroll
* Drawer
* Modal
* Dropdown
* Image gallery

Check whether the website is actually comfortable to use on mobile.

---

# 14. PERFORMANCE / LOAD TEST

Perform realistic load testing.

Minimum:

10 concurrent users
50 concurrent users
100 concurrent users

Measure:

* p50
* p95
* p99
* Error rate
* CPU
* Memory
* Database connections

Test:

* Homepage
* Search
* Property details
* Login
* Property posting
* Contact unlock
* Payment creation

Identify the first bottleneck.

---

# 15. SEO

Verify:

* Title
* Description
* Canonical
* Sitemap
* Robots
* Open Graph
* Favicon
* Structured headings
* Property URLs
* 404 handling

Verify property pages are indexable where intended.

---

# 16. ACCESSIBILITY

Test:

* Keyboard navigation
* Tab order
* Focus states
* Labels
* Forms
* Buttons
* Contrast
* Screen reader semantics

Identify WCAG violations.

---

# 17. CLIENT ACCEPTANCE TEST

Pretend you are a real customer.

Complete these journeys:

### User

Register
→ Login
→ Search
→ Filter
→ Open property
→ View gallery
→ Save/favorite
→ Contact owner
→ Purchase credits
→ Unlock contact
→ Logout

### Seller

Register
→ Login
→ Post property
→ Upload images
→ Submit
→ View property
→ Edit
→ Delete

### Admin

Login
→ Dashboard
→ Review property
→ Approve
→ Reject
→ Manage users
→ Review payments
→ Review reports
→ Logout

Record every problem.

---

# 18. CLIENT PRESENTATION REVIEW

Ask:

> If a paying client saw this application today, would anything make it look unfinished?

Look for:

* Placeholder content
* Dummy data
* Poor wording
* Broken alignment
* Missing pages
* Empty dashboard
* Fake statistics
* Test accounts
* Debug text
* Unprofessional errors
* Inconsistent terminology
* Missing loading states

---

# 19. PRODUCTION MONITORING

Verify whether the application has:

* Health check
* Application logs
* Error monitoring
* Database monitoring
* Server monitoring
* Payment failure monitoring
* Backup monitoring
* Uptime monitoring

If these do not exist, classify them separately as:

**POST-LAUNCH REQUIRED**

or

**PRE-LAUNCH REQUIRED**

depending on severity.

---

# 20. FINAL BUG REGISTER

Create:

| ID | Category | Problem | Severity | Evidence | Fix | Verified |
| -- | -------- | ------- | -------- | -------- | --- | -------- |

Severity:

🔴 CRITICAL
🟠 HIGH
🟡 MEDIUM
🔵 LOW
🟢 ENHANCEMENT

---

# 21. FINAL PRODUCTION CHECKLIST

Create exactly these sections:

## 🔴 MUST FIX BEFORE LIVE

Only blockers.

## 🟠 SHOULD FIX BEFORE CLIENT DEMO

Important professional-quality issues.

## 🟡 POST-LAUNCH

Useful improvements that don't block launch.

## 🟢 VERIFIED READY

Things actually tested successfully.

---

# 22. FINAL SCORE

Give:

Functionality /100
Security /100
UI/UX /100
Responsive /100
Performance /100
API /100
Database /100
Payments /100
Authentication /100
Accessibility /100
SEO /100
Deployment /100
Monitoring /100
Backup & Recovery /100
Client Readiness /100

Calculate the overall score.

---

# 23. FINAL DECISION

Choose ONLY one:

🟢 **PRODUCTION READY**

🟡 **PRODUCTION READY AFTER FIXES**

🔴 **NOT PRODUCTION READY**

IMPORTANT:

Do NOT give "PRODUCTION READY" merely because automated tests pass.

Production-ready means:

**Code + Infrastructure + Security + Database + Payments + Backups + Monitoring + Real User Flows + Deployment are all verified.**

If something cannot be tested because production infrastructure is not available, explicitly write:

**NOT VERIFIED — REQUIRES STAGING/PRODUCTION TEST**

Do not assume it works.

At the very end give me a short list containing ONLY the actual changes I need to make before launching AuraHomes.
