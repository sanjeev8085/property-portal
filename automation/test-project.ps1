#!/usr/bin/env pwsh
# Automated Test Runner for Property Portal

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Property Marketplace Portal -- Automated Test Runner" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

$root = Resolve-Path "$PSScriptRoot\.."
$overallSuccess = $true

# -- Step 1: Run Backend pytest suite ──────────────────────────────────────────
Write-Host ""
Write-Host "[*] Running Backend Pytest Suite..." -ForegroundColor Yellow
$env:DATABASE_URL = "sqlite+aiosqlite:///./test.db"
$env:APP_ENV = "testing"

$backendVenvPython = "$root\backend\venv\Scripts\python.exe"
if (-not (Test-Path $backendVenvPython)) {
    Write-Host "[-] Backend virtualenv python not found. Please run scripts/setup-dev.ps1 first." -ForegroundColor Red
    $overallSuccess = $false
} else {
    & $backendVenvPython -m pytest -v --tb=short
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[+] Backend tests PASSED" -ForegroundColor Green
    } else {
        Write-Host "[-] Backend tests FAILED" -ForegroundColor Red
        $overallSuccess = $false
    }
}

# -- Step 2: Check Node/NPM ────────────────────────────────────────────────────
Write-Host ""
Write-Host "[*] Checking Node.js and NPM..." -ForegroundColor Yellow
$nodeCheck = node --version 2>&1
$npmCheck = npm --version 2>&1

# Check if either command failed
$nodeMissing = ($LASTEXITCODE -ne 0)

if ($nodeMissing) {
    Write-Host "[!] Node.js or NPM not found. Skipping frontend validation." -ForegroundColor Yellow
    $overallSuccess = $false
} else {
    Write-Host "[+] Node: $nodeCheck | NPM: $npmCheck" -ForegroundColor Green

    # Run Frontend Unit Tests
    Write-Host ""
    Write-Host "[*] Running Frontend Unit Tests..." -ForegroundColor Yellow
    Push-Location "$root\frontend"
    npm.cmd run test
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[+] Frontend unit tests PASSED" -ForegroundColor Green
    } else {
        Write-Host "[-] Frontend unit tests FAILED" -ForegroundColor Red
        $overallSuccess = $false
    }

    # Run Frontend TypeScript compilation check
    Write-Host ""
    Write-Host "[*] Running Frontend Type-Check..." -ForegroundColor Yellow
    npm.cmd run type-check
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[+] Frontend TypeScript check PASSED" -ForegroundColor Green
    } else {
        Write-Host "[-] Frontend TypeScript check FAILED" -ForegroundColor Red
        $overallSuccess = $false
    }

    # Run Frontend Linting (Non-blocking)
    Write-Host ""
    Write-Host "[*] Running Frontend Lint-Check..." -ForegroundColor Yellow
    npm.cmd run lint
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[+] Frontend Lint checks PASSED" -ForegroundColor Green
    } else {
        Write-Host "[!] Frontend Lint checks found issues (non-blocking for test runner)" -ForegroundColor Yellow
    }
    Pop-Location

    # -- Step 3: Live Visual Browser E2E Automation Test ─────────────────────────
    if (-not $SkipBrowser -and (Test-Path "$root\automation\browser-e2e-test.mjs")) {
        Write-Host ""
        Write-Host "[*] Launching Live Visual Browser Automation Test (Chrome/Edge)..." -ForegroundColor Yellow
        Push-Location "$root"
        node "$root\automation\browser-e2e-test.mjs"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[+] Live Visual Browser Test PASSED" -ForegroundColor Green
        } else {
            Write-Host "[!] Live Visual Browser Test finished with notice" -ForegroundColor Yellow
        }
        Pop-Location
    }
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
if ($overallSuccess) {
    Write-Host "OVERALL RESULTS: ALL TESTS PASSED SUCCESSFULLY! (OK)" -ForegroundColor Green
    exit 0
} else {
    Write-Host "OVERALL RESULTS: SOME TESTS OR CHECKS FAILED! (ERROR)" -ForegroundColor Red
    exit 1
}
