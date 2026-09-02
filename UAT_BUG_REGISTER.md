# AuraHomes UAT Bug Register

**Environment:** https://property-portal-rncp.vercel.app/  
**Test date:** 2026-09-02  
**Method:** Manual browser walkthrough (desktop and 390px mobile), supplemented by source review.  
**Test state:** Anonymous visitor; no production data was created, edited, deleted, or paid for. Admin actions and authenticated owner/buyer workflows remain pending a dedicated UAT account.

## Release recommendation

**Do not approve for UAT sign-off until P0 defects are fixed and re-tested.** The owner-contact paywall can be bypassed and a client-side admin credential is present in the shipped source.

## Defects

| ID | Severity | Area | Summary | Status |
|---|---|---|---|---|
| UAT-001 | P0 / Blocker | Contact unlock | Direct WhatsApp contact is exposed before credit unlock | Open |
| UAT-002 | P0 / Blocker | Security | Frontend bundle contains a hard-coded admin login attempt | Open |
| UAT-003 | P1 / Critical | Home / inventory | Homepage says no listings while search returns live listings | Open |
| UAT-004 | P1 / Critical | Session / profile | Anonymous visitor is shown as logged in and can open profile-edit UI | Open |
| UAT-005 | P2 / Major | Dashboard session handling | Anonymous dashboard shows a retryable error instead of redirecting to login | Open |
| UAT-006 | P2 / Major | Routing | `/pricing` is a deployed 404 although the automated golden journey uses it | Open |
| UAT-007 | P2 / Major | Automation | Browser regression suite cannot run in this environment because Chromium launch is denied | Open |

### UAT-001 — Direct WhatsApp bypasses the contact-credit gate

**Severity:** P0 / Blocker  
**Affected page:** `/properties/<listing-slug>`  
**Precondition:** Logged out / no credits.

**Steps to reproduce**

1. Open a public listing, for example a Bhopal result from `/search?location=Bhopal`.
2. Confirm the page says owner contact is locked and shows **Unlock Owner Contact (1 Credit)**.
3. Inspect the same page’s fixed contact area.

**Actual result:** A **WhatsApp** link is rendered with a `https://wa.me/91<owner-phone>` URL before unlock. The owner number is therefore present in the DOM and can be opened without authentication or a credit.

**Expected result:** Before a successful server-side unlock, no call, WhatsApp, `tel:`, or raw owner-contact URL must be rendered or derivable by the browser. The API must also withhold owner contact fields from its unauthenticated listing response.

**Evidence:** Deployed listing detail exposed a WhatsApp URL while simultaneously displaying the locked-contact controls. Source: [frontend/src/app/properties/[id]/page.tsx](frontend/src/app/properties/[id]/page.tsx), especially the unconditional WhatsApp URL construction and locked mobile action around lines 443-446 and 1090-1092.

**Suggested fix:** Render every contact action only when `isUnlocked || isOwner`; remove raw phone from the unauthenticated client payload; enforce this in the API response, not only in React.

### UAT-002 — Hard-coded admin credentials in client-side code

**Severity:** P0 / Blocker  
**Affected area:** All browsers loading the frontend bundle.

**Steps to reproduce**

1. Review the deployed frontend source bundle or repository API client.
2. Trigger a `401` for an admin endpoint.

**Actual result:** The API client contains an administrator email and password literal and attempts an automatic admin login after certain 401 responses.

**Expected result:** No privileged credential may exist in browser-delivered code. Authentication must only use a user-supplied session/token; service credentials must remain server-only.

**Evidence:** [frontend/src/lib/api.ts](frontend/src/lib/api.ts), `apiFetch` 401 handling near lines 25-49.

**Suggested fix:** Immediately rotate the affected admin password, remove this fallback completely, invalidate any exposed sessions, and add secret scanning to CI. Investigate deployment history because the credential has been committed in a client file.

### UAT-003 — Homepage inventory is empty despite published search results

**Severity:** P1 / Critical  
**Affected pages:** `/`, `/search?location=Bhopal`.

**Steps to reproduce**

1. Open the homepage and wait for it to finish loading.
2. Observe **Featured Listings**.
3. Search for `Bhopal` from the hero search or visit `/search?location=Bhopal`.

**Actual result:** Homepage displays **“No properties listed yet.”** Search returns three live verified Bhopal properties.

**Expected result:** Homepage should show eligible featured/recent listings when searchable published listings exist, or the section should accurately state that no *featured* listings are available.

**Business impact:** The landing page signals an empty marketplace to first-time users while inventory is available, materially reducing enquiry/conversion.

**Evidence:** Deployed browser result on 2026-09-02. Source loading is in [frontend/src/app/page.tsx](frontend/src/app/page.tsx) near lines 17-145.

### UAT-004 — Profile treats anonymous visitor as authenticated

**Severity:** P1 / Critical  
**Affected page:** `/account/profile`.

**Steps to reproduce**

1. Use a fresh browser with no AuraHomes token.
2. Navigate directly to `/account/profile`.

**Actual result:** The page opens and displays **“Currently Logged In”**, a default **AuraHomes User** buyer account, editable personal/contact fields, **Save Profile Changes**, **Change Password**, and **Log Out** controls.

**Expected result:** Redirect to `/login?next=/account/profile` before rendering account data or any account-management controls.

**Business impact:** Misleading session state, confusing actions that cannot succeed, and elevated risk that a future client/API change turns this into an authorization vulnerability.

### UAT-005 — Dashboard gives an error instead of an authentication redirect

**Severity:** P2 / Major  
**Affected page:** `/dashboard`.

**Steps to reproduce**

1. Open `/dashboard` while logged out.
2. Wait for loading to finish.

**Actual result:** Page remains at `/dashboard` and shows **Error Loading Dashboard — Not authenticated** with **Retry Loading**.

**Expected result:** Redirect to login with a safe `next=/dashboard` value, as `/dashboard/properties/new` already does.

### UAT-006 — Pricing route is missing

**Severity:** P2 / Major  
**Affected page:** `/pricing`.

**Steps to reproduce**

1. Open `https://property-portal-rncp.vercel.app/pricing`.

**Actual result:** AuraHomes renders **Page Not Found**.

**Expected result:** Redirect to `/plans`, or preserve `/pricing` as a supported alias.

**Evidence:** [tests/browser/smoke/critical-user-journey.spec.ts](tests/browser/smoke/critical-user-journey.spec.ts) navigates to `/pricing`, so current automated coverage targets a non-existent product route.

### UAT-007 — Browser regression suite is not executable in this environment

**Severity:** P2 / Major (test readiness)  
**Affected command:** `npm run test:browser`.

**Actual result:** All 18 Playwright tests fail in 2–4 ms with `browserType.launch: spawn EPERM`; none executes an application scenario.

**Expected result:** CI/UAT test environment can launch the configured browser, and failures are reported as test assertions rather than setup errors.

**Note:** This does not prove 18 product defects. It is an environment/tooling blocker. The manual browser pass above used the available in-app browser.

## Coverage completed

| Area | Result |
|---|---|
| Homepage hero tabs, search form, links, desktop/mobile layout | Search works on deployed site; homepage inventory defect logged |
| Mobile navigation at 390×844 | Drawer opens, closes, and fits without horizontal overflow |
| Search filters, result cards, sorting controls | Live Bhopal results load; listing detail reachable |
| Property detail, images, masked contact, unlock controls | Detail loads; P0 WhatsApp bypass logged |
| Public pages: About, Contact, Privacy, Terms | Rendered without browser-console errors |
| Plans | Packages load after async response; no purchase was attempted |
| Login, registration, password-reset forms | Rendered; no account/reset request submitted |
| Anonymous owner dashboard/profile routes | Session-handling defects logged |
| Admin routes | Correctly redirect to admin login when anonymous; no admin login attempted |

## Pending before sign-off

- Provide disposable buyer, owner, and admin UAT accounts plus a non-production payment gateway/test key.
- Re-test registration, login/logout, OTP, reset password, profile save, listing wizard, image upload, listing edit/deactivate, favorite persistence, contact unlock, checkout/webhook, notifications, reports, and every admin action.
- Re-run desktop and mobile Playwright in an environment permitted to launch Chromium.
- Security test the API directly: confirm unauthenticated property responses never contain raw owner phone/email and that protected endpoints reject a missing/invalid token.

