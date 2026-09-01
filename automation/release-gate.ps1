#!/usr/bin/env pwsh
# AuraHomes Production Release Gate Runner

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "        AURAHOMES AUTOMATED RELEASE QA          " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$root = Resolve-Path "$PSScriptRoot\.."
$gateSuccess = $true

# 1. Backend Integration Tests
Write-Host "`n[*] Executing Backend Pytest Suite..." -ForegroundColor Yellow
$env:DATABASE_URL = "sqlite+aiosqlite:///./test.db"
$env:APP_ENV = "testing"
$backendPython = "$root\backend\venv\Scripts\python.exe"

& $backendPython -m pytest -v --tb=short
if ($LASTEXITCODE -eq 0) {
    Write-Host "[+] Backend Tests: PASS 🟢" -ForegroundColor Green
} else {
    Write-Host "[-] Backend Tests: FAIL 🔴" -ForegroundColor Red
    $gateSuccess = $false
}

# 2. Frontend Type-Check
Write-Host "`n[*] Executing Frontend TypeScript Type-Check..." -ForegroundColor Yellow
Push-Location "$root\frontend"
npm.cmd run type-check
if ($LASTEXITCODE -eq 0) {
    Write-Host "[+] Frontend Type-Check: PASS 🟢" -ForegroundColor Green
} else {
    Write-Host "[-] Frontend Type-Check: FAIL 🔴" -ForegroundColor Red
    $gateSuccess = $false
}
Pop-Location

# 3. Playwright Browser E2E Suite
Write-Host "`n[*] Executing Playwright Browser E2E Test Suite..." -ForegroundColor Yellow
Push-Location "$root"
npx.cmd playwright test
if ($LASTEXITCODE -eq 0) {
    Write-Host "[+] Playwright E2E Suite: PASS 🟢" -ForegroundColor Green
} else {
    Write-Host "[-] Playwright E2E Suite: FAIL 🔴" -ForegroundColor Red
    $gateSuccess = $false
}
Pop-Location

Write-Host "`n================================================" -ForegroundColor Cyan
if ($gateSuccess) {
    Write-Host "FINAL STATUS: 🟢 READY FOR PRODUCTION" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "FINAL STATUS: 🔴 DO NOT GO LIVE" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Cyan
    exit 1
}
