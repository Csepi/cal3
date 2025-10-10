# Test Task 01: Setup Playwright

## Description
Install and configure Playwright test framework for end-to-end browser testing. This is the foundation for all subsequent testing tasks.

## Prerequisites
- None (first task in the sequence)
- Node.js and npm installed
- Frontend project at `frontend/` directory

## Implementation Steps

### 1. Install Playwright and Dependencies
```bash
cd frontend
npm install -D @playwright/test
npm install -D @faker-js/faker
```

### 2. Install Browser Binaries
```bash
npx playwright install
# Or install specific browsers with dependencies:
npx playwright install chromium firefox webkit --with-deps
```

### 3. Verify Installation
```bash
npx playwright --version
```

### 4. Create Test Directory Structure
```bash
mkdir -p e2e/setup
mkdir -p e2e/smoke
mkdir -p e2e/auth
mkdir -p e2e/calendar
mkdir -p e2e/profile
mkdir -p e2e/sync
mkdir -p e2e/reservations
mkdir -p e2e/automation
mkdir -p e2e/admin
mkdir -p e2e/api
mkdir -p e2e/ui-components
mkdir -p e2e/accessibility
mkdir -p e2e/performance
mkdir -p e2e/visual-regression
mkdir -p e2e/pages
```

### 5. Update package.json Scripts
Add these scripts to `frontend/package.json`:
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:chrome": "playwright test --project=chromium",
    "test:e2e:firefox": "playwright test --project=firefox",
    "test:e2e:safari": "playwright test --project=webkit",
    "test:e2e:smoke": "playwright test e2e/smoke/",
    "test:e2e:report": "playwright show-report",
    "test:e2e:codegen": "playwright codegen http://localhost:8080"
  }
}
```

### 6. Create .gitignore Entries
Add to `frontend/.gitignore`:
```
# Playwright
test-results/
playwright-report/
playwright/.cache/
```

## Files to Create/Modify
- `frontend/package.json` (modify - add scripts)
- `frontend/.gitignore` (modify - add Playwright ignore entries)
- `frontend/e2e/` (create directory structure)

## Expected Outcome
- Playwright installed successfully
- Browser binaries downloaded (Chromium, Firefox, WebKit)
- Test directory structure created
- NPM scripts available for running tests
- Can run `npm run test:e2e` (will report no tests found, which is expected)

## Testing the Implementation
```bash
# Verify installation
cd frontend
npx playwright --version

# Verify scripts
npm run test:e2e -- --help

# Test browser installation
npx playwright codegen http://localhost:8080
```

## Estimated Time
⏱️ **15-20 minutes**

## Next Task
[test_02_create_config.md](./test_02_create_config.md) - Create Playwright configuration file
