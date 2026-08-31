# 🚀 PROFESSIONAL PRODUCTION & CLIENT-READINESS AUDIT PROMPT

I want you to perform a **complete professional audit of my entire web application** and prepare it for **real production/live deployment and client demonstration**.

Do NOT only check whether the application runs.

Act as a team of:

* Senior Full-Stack Developer
* Senior QA/Test Engineer
* Security Engineer
* UI/UX Designer
* Responsive Design Specialist
* Performance Engineer
* Database Engineer
* API Engineer
* DevOps/Deployment Engineer
* Product Manager
* Client Acceptance Tester

Your goal is to find **everything that could prevent this application from being considered professional, production-ready, secure, stable, responsive, and client-ready.**

---

# 1. FIRST — UNDERSTAND THE ENTIRE PROJECT

Before making changes, inspect the complete project.

Analyze:

* Frontend architecture
* Backend architecture
* Database
* APIs
* Authentication
* Authorization
* Admin functionality
* User functionality
* Components
* Pages
* Routes
* Forms
* Validation
* Error handling
* Loading states
* Empty states
* Database models
* API models/schemas
* Environment variables
* Configuration
* Dependencies
* Static assets
* Images
* 3D models
* CSS
* Responsive implementation
* Animations
* Search
* Filters
* Sorting
* Pagination
* CRUD operations
* Notifications
* Logging
* Security
* Deployment configuration
* Build configuration
* Production configuration

Read the README, documentation, environment files, package files, backend configuration, database configuration, and important source files before beginning the audit.

Do not assume anything.

---

# 2. CREATE A COMPLETE FEATURE INVENTORY

Create a list of every functionality currently implemented.

For each feature identify:

| Feature      | Location | Expected Behaviour | Current Behaviour | Status    |
| ------------ | -------- | ------------------ | ----------------- | --------- |
| Login        | ...      | ...                | ...               | PASS/FAIL |
| Registration | ...      | ...                | ...               | PASS/FAIL |
| Search       | ...      | ...                | ...               | PASS/FAIL |
| Product      | ...      | ...                | ...               | PASS/FAIL |
| Admin        | ...      | ...                | ...               | PASS/FAIL |

Also identify:

* Fully implemented features
* Partially implemented features
* Placeholder features
* Dummy data
* Hardcoded values
* Fake API responses
* TODOs
* FIXME comments
* Temporary solutions
* Development-only code
* Unused functionality
* Dead code

---

# 3. FUNCTIONAL TESTING

Test every user flow from beginning to end.

## Authentication

Test:

* Login
* Logout
* Registration
* Invalid credentials
* Empty fields
* Wrong password
* Password visibility
* Session handling
* Token expiration
* Refresh
* Unauthorized access
* Protected routes
* Admin authentication
* User/admin role separation

Try:

* Empty input
* Very long input
* Special characters
* Invalid email
* Invalid password
* SQL injection-like input
* XSS-like input

Verify that the application handles all cases safely.

---

# 4. USER FLOW TESTING

Test the complete journey as a real client/user would.

Example:

Home
→ Browse
→ Search
→ Filter
→ Open item/product
→ View details
→ Perform action
→ Submit form
→ Receive confirmation
→ Return/back navigation
→ Logout

Do not test isolated buttons only.

Test complete workflows.

---

# 5. ADMIN FLOW TESTING

Test the entire admin panel.

Check:

* Admin login
* Dashboard
* Create
* Read
* Update
* Delete
* Upload
* Edit
* Search
* Filter
* Pagination
* Validation
* Permissions
* Error handling
* Logout

Try invalid and malicious inputs.

Verify that a normal user cannot access admin functionality.

---

# 6. DATABASE TESTING

Inspect the database architecture.

Check:

* Tables
* Relationships
* Foreign keys
* Primary keys
* Indexes
* Constraints
* Nullable fields
* Duplicate records
* Data validation
* Cascading deletes
* Orphan records
* Migration system
* Connection handling
* Transaction handling

Look for:

* Missing indexes
* Incorrect relationships
* Data integrity problems
* Duplicate data
* Unsafe queries
* N+1 queries
* Hardcoded database values
* Development database configuration accidentally used in production

---

# 7. API TESTING

Test every API endpoint.

For each endpoint document:

* Method
* URL
* Authentication required?
* Request
* Response
* Status codes
* Validation
* Error handling

Test:

* Valid request
* Invalid request
* Missing fields
* Wrong data types
* Empty values
* Very large values
* Unauthorized request
* Expired authentication
* Wrong role
* Duplicate request
* Malformed request

Check for:

* 500 errors
* Incorrect status codes
* Information leakage
* Missing validation
* Missing authentication
* Missing authorization
* Slow endpoints

---

# 8. SECURITY AUDIT

Perform a serious security review.

Check for:

### Authentication

* Weak passwords
* Password exposure
* Improper session handling
* Token storage problems
* Token expiration
* Authentication bypass

### Authorization

Check that:

* User cannot access admin APIs
* User cannot modify another user's data
* User cannot delete another user's data
* Hidden frontend buttons are not treated as security
* Backend permissions are enforced

### Input Security

Test for:

* XSS
* SQL injection
* Command injection
* Path traversal
* Malicious file upload
* Oversized requests
* Invalid MIME types

### Secrets

Search the entire repository for:

* API keys
* Passwords
* JWT secrets
* Database credentials
* SMTP credentials
* Cloud credentials
* Access tokens
* Private keys

IMPORTANT:

If any real secret is found, flag it immediately.

Do NOT expose the secret value in the final report.

---

# 9. FILE UPLOAD SECURITY

If the application supports file/model/image/document uploads, test:

* File type validation
* MIME validation
* File extension validation
* File size limits
* Filename sanitization
* Malicious filenames
* Duplicate files
* Invalid files
* Huge files
* Unsupported formats
* Storage permissions
* Public/private access

Check whether uploaded files can execute code or expose sensitive data.

---

# 10. UI/UX PROFESSIONAL REVIEW

Review the application as a professional UI/UX designer.

Check:

* Visual hierarchy
* Typography
* Font consistency
* Spacing
* Alignment
* Buttons
* Forms
* Cards
* Navigation
* Header
* Footer
* Modals
* Dropdowns
* Search
* Filters
* Icons
* Empty states
* Error states
* Success states
* Loading states
* Skeleton loaders
* Toasts
* Confirmation dialogs

Identify anything that looks:

* Basic
* Amateur
* Inconsistent
* Broken
* Too large
* Too small
* Crowded
* Empty
* Unprofessional
* Like a development/demo application

---

# 11. RESPONSIVE TESTING

Test the application at minimum at:

* 320 × 568
* 360 × 800
* 375 × 812
* 390 × 844
* 414 × 896
* 480 × 900
* 768 × 1024
* 820 × 1180
* 1024 × 768
* 1280 × 720
* 1366 × 768
* 1440 × 900
* 1536 × 864
* 1920 × 1080
* 2560 × 1440

Check:

* Horizontal scrolling
* Vertical overflow
* Text overflow
* Button overflow
* Card sizes
* Grid layout
* Navigation
* Images
* 3D models
* Forms
* Modals
* Tables
* Admin dashboard
* Product/detail pages

IMPORTANT:

The desktop version must actually look like a desktop application.

Do NOT allow desktop screens to look like an enlarged mobile layout.

Products/cards should have professional dimensions and spacing.

---

# 12. BROWSER TESTING

Test the application in:

* Chrome
* Edge
* Firefox
* Safari where possible

Check for:

* Layout differences
* JavaScript errors
* CSS problems
* 3D rendering problems
* Broken animations
* API issues
* Browser-specific failures

---

# 13. PERFORMANCE AUDIT

Measure:

* Initial page load
* API response time
* Database query performance
* JavaScript bundle size
* CSS size
* Image size
* 3D model size
* Lazy loading
* Code splitting
* Caching
* Rendering performance

Look for:

* Large assets
* Unnecessary API calls
* Duplicate API calls
* Unnecessary re-renders
* Memory leaks
* Slow database queries
* Blocking resources

Pay special attention to 3D models and animations.

The website should remain smooth on normal laptops and mobile devices.

---

# 14. CONSOLE & ERROR AUDIT

Open the browser console and check for:

* Errors
* Warnings
* Failed network requests
* 404s
* CORS errors
* Missing assets
* React errors
* Hydration errors
* API failures

The production application should have **zero unexplained critical console errors**.

---

# 15. NETWORK/API AUDIT

Inspect network requests.

Check:

* Failed requests
* Duplicate requests
* Slow requests
* Unnecessary requests
* Incorrect URLs
* localhost references
* Development endpoints
* Missing HTTPS
* Exposed API information

IMPORTANT:

Search the project for:

`localhost`

`127.0.0.1`

`http://`

development URLs

and determine whether any of them would break production.

---

# 16. ENVIRONMENT & PRODUCTION CONFIGURATION

Check:

* `.env`
* `.env.local`
* `.env.production`
* Backend environment configuration
* Frontend environment configuration
* Database URL
* API URL
* CORS
* Authentication secrets
* Storage configuration
* Email configuration

Make sure secrets are NOT committed to Git.

Check `.gitignore`.

Verify that production configuration is separate from development configuration.

---

# 17. DEPLOYMENT READINESS

Check whether the project can actually be deployed.

Verify:

* Production build
* Frontend build
* Backend startup
* Database migrations
* Environment variables
* CORS
* HTTPS
* Domain configuration
* API URL
* Static files
* Storage
* Logs
* Health checks
* Error handling

Run the production build.

If it fails, identify exactly why.

---

# 18. SEO AUDIT

Check:

* Page titles
* Meta descriptions
* Open Graph metadata
* Favicon
* Robots.txt
* Sitemap
* Canonical URLs
* Semantic HTML
* Heading hierarchy
* Image alt text
* Crawlability

Identify pages that need SEO improvement.

---

# 19. ACCESSIBILITY AUDIT

Check:

* Keyboard navigation
* Focus states
* Labels
* Form accessibility
* Color contrast
* Button accessibility
* ARIA usage
* Screen reader compatibility
* Image alt text
* Heading structure

Identify WCAG-related problems.

---

# 20. MOBILE UX

Test using real mobile-style interaction.

Check:

* Touch targets
* Swipe/scroll
* Mobile navigation
* Dropdowns
* Modals
* Forms
* Keyboard opening
* Sticky elements
* 3D interactions
* Product cards
* Checkout/contact actions if applicable

---

# 21. ERROR & EDGE-CASE TESTING

Intentionally break things.

Test:

* Backend unavailable
* Database unavailable
* Slow API
* Empty database
* No search results
* Invalid ID
* Deleted item
* Duplicate item
* Network disconnected
* Timeout
* Refresh during request
* Browser back button
* Multiple tabs
* Expired session

The application should show useful user-friendly messages instead of raw errors.

---

# 22. DATA VALIDATION

Check every form.

Verify:

* Required fields
* Minimum length
* Maximum length
* Email validation
* Phone validation
* Numeric validation
* Date validation
* File validation
* Duplicate validation

Validation must exist on the backend as well as frontend.

---

# 23. CODE QUALITY

Review the source code for:

* Duplicate code
* Huge components
* Bad naming
* Dead code
* Unused imports
* Unused dependencies
* Hardcoded values
* Magic numbers
* Poor error handling
* Poor architecture
* Missing types
* Inconsistent patterns
* Security issues
* Performance problems

Do not rewrite working code unnecessarily.

Only recommend/refactor where there is a real benefit.

---

# 24. DEPENDENCY AUDIT

Check all dependencies.

Identify:

* Outdated packages
* Vulnerable packages
* Unused packages
* Duplicate packages
* Development packages accidentally used in production
* Major-version compatibility problems

Do NOT blindly upgrade everything.

Only recommend upgrades when there is a clear reason.

---

# 25. BUSINESS/CLIENT READINESS

Pretend that I am presenting this application to a real client.

Ask:

> "Would I confidently sell/demo this application today?"

Check:

* Professional appearance
* Reliability
* Speed
* Usability
* Error handling
* Security
* Data quality
* Admin experience
* User experience
* Mobile experience
* Branding
* Content
* Empty states
* Demo data
* Documentation

Identify anything that could make a client say:

"Why does this look unfinished?"

---

# 26. REMOVE DEVELOPMENT/DEMO ARTIFACTS

Find:

* Lorem ipsum
* Placeholder images
* Dummy text
* Test users
* Test passwords
* Debug messages
* Console logs
* Development banners
* Fake statistics
* Mock APIs
* Hardcoded demo data
* TODO messages
* Developer comments visible to users

Separate legitimate demo data from accidental development artifacts.

---

# 27. TEST AUTOMATION

Where practical, create or improve automated tests.

Prioritize:

### Critical

* Authentication
* Authorization
* Main user workflow
* Admin workflow
* CRUD
* API validation
* Database operations

### Important

* Search
* Filter
* Forms
* Responsive UI

### Nice to have

* Visual regression
* Performance testing
* Accessibility testing

---

# 28. CREATE A BUG/IMPROVEMENT REGISTER

Every problem must be recorded.

Use this structure:

| ID       | Category    | Issue | Severity | Location | Evidence | Recommended Fix | Status |
| -------- | ----------- | ----- | -------- | -------- | -------- | --------------- | ------ |
| BUG-001  | Security    | ...   | CRITICAL | ...      | ...      | ...             | OPEN   |
| UI-001   | UI/UX       | ...   | MEDIUM   | ...      | ...      | ...             | OPEN   |
| PERF-001 | Performance | ...   | HIGH     | ...      | ...      | ...             | OPEN   |

Severity:

🔴 CRITICAL
Application cannot safely go live.

🟠 HIGH
Major functionality/security/performance issue.

🟡 MEDIUM
Should be fixed before client delivery if possible.

🔵 LOW
Minor improvement.

🟢 ENHANCEMENT
Optional future improvement.

---

# 29. CREATE A PRODUCTION READINESS SCORE

Give scores from 0–100 for:

| Category         | Score |
| ---------------- | ----: |
| Functionality    |  /100 |
| UI/UX            |  /100 |
| Responsive       |  /100 |
| Security         |  /100 |
| Performance      |  /100 |
| API              |  /100 |
| Database         |  /100 |
| Accessibility    |  /100 |
| SEO              |  /100 |
| Code Quality     |  /100 |
| Deployment       |  /100 |
| Client Readiness |  /100 |

Then calculate an overall score.

---

# 30. GO-LIVE DECISION

At the end give one of:

### 🟢 GO LIVE

No critical/high issues.

### 🟡 GO LIVE AFTER FIXES

Some important issues remain but they must be fixed before launch.

### 🔴 DO NOT GO LIVE

Critical security/functionality/deployment issues exist.

Explain exactly why.

---

# 31. PRIORITIZED FIX PLAN

Create three lists.

## MUST FIX BEFORE LIVE

Only critical/high-priority issues.

## SHOULD FIX BEFORE CLIENT DEMO

Issues that make the application look unfinished or unprofessional.

## FUTURE IMPROVEMENTS

Nice-to-have features and optimizations that do not block launch.

---

# 32. DO NOT JUST REPORT — FIX WHERE SAFE

After completing the audit:

1. Do NOT immediately modify everything.
2. First create the audit report.
3. Identify the highest-priority issues.
4. For safe, obvious fixes, implement them.
5. Do not change business logic without understanding it.
6. Do not remove functionality just because it looks unnecessary.
7. Do not expose secrets.
8. Do not make destructive database changes without confirmation.
9. After fixes, run the tests again.
10. Compare before/after results.

---

# 33. FINAL REPORT

Create a professional report containing:

# Production Readiness Audit

## 1. Executive Summary

## 2. Current Application Architecture

## 3. Features Tested

## 4. Test Results

## 5. Critical Issues

## 6. High Priority Issues

## 7. Medium Priority Issues

## 8. Low Priority Issues

## 9. Security Findings

## 10. UI/UX Findings

## 11. Responsive Findings

## 12. Performance Findings

## 13. API Findings

## 14. Database Findings

## 15. Accessibility Findings

## 16. SEO Findings

## 17. Deployment Findings

## 18. Code Quality Findings

## 19. Production Readiness Score

## 20. MUST FIX Before Go-Live

## 21. SHOULD FIX Before Client Demo

## 22. Future Improvements

## 23. Final GO/NO-GO Decision

---

# MOST IMPORTANT RULE

Do not tell me:

> "Everything looks good."

unless you have actually tested it.

Be critical.

Assume that a professional client will try to break the application.

Find problems that a normal developer might miss.

I want an honest production-readiness audit, not a confirmation that the project works.

If something is uncertain, explicitly mark it as:

**NOT VERIFIED**

rather than assuming it works.

At the end, give me a concise:

# 🔴 MUST CHANGE

# 🟠 SHOULD CHANGE

# 🟡 NICE TO HAVE

# 🟢 READY

list so I know exactly what needs to be done before putting the application live.
