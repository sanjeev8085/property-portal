#!/usr/bin/env bash
# Automated Test Runner for Property Portal (Linux/macOS/Git Bash)

# Color Codes
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}🏠 Property Marketplace Portal — Automated Test Runner${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Resolve workspace root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OVERALL_SUCCESS=true

# ── Step 1: Run Backend pytest suite ──────────────────────────────────────────
echo -e "\n${YELLOW}🧪 Running Backend Pytest Suite...${NC}"
export DATABASE_URL="sqlite+aiosqlite:///./test.db"
export APP_ENV="testing"

# Check virtual environment python paths (support Windows git bash, Linux, macOS)
VENV_PYTHON=""
if [ -f "$ROOT_DIR/backend/venv/bin/python" ]; then
    VENV_PYTHON="$ROOT_DIR/backend/venv/bin/python"
elif [ -f "$ROOT_DIR/backend/venv/Scripts/python" ]; then
    VENV_PYTHON="$ROOT_DIR/backend/venv/Scripts/python"
fi

if [ -z "$VENV_PYTHON" ]; then
    echo -e "${RED}❌ Backend virtualenv python not found. Please run setup first.${NC}"
    OVERALL_SUCCESS=false
else
    "$VENV_PYTHON" -m pytest -v --tb=short
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend tests PASSED${NC}"
    else
        echo -e "${RED}❌ Backend tests FAILED${NC}"
        OVERALL_SUCCESS=false
    fi
fi

# ── Step 2: Check Node/NPM ────────────────────────────────────────────────────
echo -e "\n${YELLOW}📦 Checking Node.js & NPM...${NC}"
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js or NPM not found. Skipping frontend validation.${NC}"
    OVERALL_SUCCESS=false
else
    NODE_VER=$(node --version)
    NPM_VER=$(npm --version)
    echo -e "${GREEN}✅ Node: $NODE_VER | NPM: $NPM_VER${NC}"

    # Run Frontend Unit Tests
    echo -e "\n${YELLOW}🧪 Running Frontend Unit Tests...${NC}"
    cd "$ROOT_DIR/frontend" || exit 1
    npm run test
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend unit tests PASSED${NC}"
    else
        echo -e "${RED}❌ Frontend unit tests FAILED${NC}"
        OVERALL_SUCCESS=false
    fi

    # Run Frontend TypeScript compilation check
    echo -e "\n${YELLOW}🔍 Running Frontend Type-Check...${NC}"
    npm run type-check
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend TypeScript check PASSED${NC}"
    else
        echo -e "${RED}❌ Frontend TypeScript check FAILED${NC}"
        OVERALL_SUCCESS=false
    fi

    # Run Frontend Linting (Non-blocking)
    echo -e "\n${YELLOW}🔍 Running Frontend Lint-Check...${NC}"
    npm run lint
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend Lint checks PASSED${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend Lint checks found issues (non-blocking for test runner)${NC}"
    fi
fi

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$OVERALL_SUCCESS" = true ]; then
    echo -e "${GREEN}🎉 OVERALL RESULTS: ALL TESTS PASSED SUCCESSFULLY! 🟢${NC}"
    exit 0
else
    echo -e "${RED}🚨 OVERALL RESULTS: SOME TESTS OR CHECKS FAILED! 🔴${NC}"
    exit 1
fi
