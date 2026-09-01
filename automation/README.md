# Automated Test Suite — AuraHomes Property Portal

This folder contains the complete end-to-end automation test runners for AuraHomes Property Portal.

## Test Scripts

* **`test-project.ps1`**: Automated test suite for Windows PowerShell / pwsh.
* **`test-project.sh`**: Automated test suite for Linux, macOS, and Git Bash.

## What is tested?

1. **Backend Integration & Unit Tests** (`pytest`):
   * 65 automated tests covering Authentication, RBAC, IDOR protection, Razorpay webhook idempotency, Contact unlocks, Subscriptions, Property creation, Amenities, and Search.
2. **Frontend E2E & Flow Tests** (`frontend/tests/frontend.test.mjs`):
   * 25 automated tests verifying page navigation, user interactions, local property store persistence, and search filters.
3. **Frontend TypeScript Type Checking** (`npm run type-check`).
4. **Frontend Code Quality & Lint Validation** (`npm run lint`).

## How to Run

From project root:
```bash
npm test
```

Or run directly:

**PowerShell (Windows):**
```powershell
powershell -ExecutionPolicy Bypass -File automation/test-project.ps1
```

**Bash (Linux / macOS):**
```bash
bash automation/test-project.sh
```
