#!/usr/bin/env pwsh
# Quick start script for Property Portal development environment

Write-Host "🏠 Property Marketplace Portal — Dev Setup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$root = $PSScriptRoot

# ── Step 1: Check Python ──────────────────────────────────────────────────────
Write-Host "`n[1/5] Checking Python..." -ForegroundColor Yellow
$pythonVer = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python not found. Please install Python 3.12+" -ForegroundColor Red
    exit 1
}
Write-Host "✅ $pythonVer" -ForegroundColor Green

# ── Step 2: Create .env if missing ────────────────────────────────────────────
Write-Host "`n[2/5] Checking .env file..." -ForegroundColor Yellow
if (-not (Test-Path "$root\.env")) {
    Copy-Item "$root\.env.example" "$root\.env"
    Write-Host "✅ .env created from .env.example — update values before production!" -ForegroundColor Green
} else {
    Write-Host "✅ .env already exists" -ForegroundColor Green
}

# ── Step 3: Backend venv ──────────────────────────────────────────────────────
Write-Host "`n[3/5] Setting up Python virtualenv..." -ForegroundColor Yellow
if (-not (Test-Path "$root\backend\venv")) {
    python -m venv "$root\backend\venv"
}
& "$root\backend\venv\Scripts\pip" install -r "$root\backend\requirements.txt" --quiet
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# ── Step 4: Docker services ───────────────────────────────────────────────────
Write-Host "`n[4/5] Starting Docker services (DB + Redis + MinIO)..." -ForegroundColor Yellow
$dockerCheck = docker version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Docker not found — skipping Docker services. Start PostgreSQL + Redis manually." -ForegroundColor Yellow
} else {
    docker compose up -d db redis minio adminer
    Write-Host "✅ Docker services started" -ForegroundColor Green
}

# ── Step 5: Run DB migrations ─────────────────────────────────────────────────
Write-Host "`n[5/5] Running database migrations..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
& "$root\backend\venv\Scripts\python" -m alembic -c "$root\backend\alembic.ini" upgrade head 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations applied" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migration failed — check DB connection in .env" -ForegroundColor Yellow
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 Setup complete! Start the backend with:" -ForegroundColor Green
Write-Host "   cd backend && ..\backend\venv\Scripts\uvicorn app.main:app --reload" -ForegroundColor White
Write-Host "`n🌐 API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "🗃️  DB GUI:   http://localhost:8080" -ForegroundColor White
