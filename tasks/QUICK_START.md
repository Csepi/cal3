# Quick Start Guide - E2E Testing

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Playwright
```bash
cd frontend
npm install -D @playwright/test @faker-js/faker
npx playwright install chromium --with-deps
```

### Step 2: Create Basic Structure
```bash
mkdir -p e2e/{setup,smoke,auth,pages}
```

### Step 3: Run First Test
Create `frontend/e2e/smoke/quick-test.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('app loads without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('http://localhost:8080');

  expect(errors).toHaveLength(0);
});
```

### Step 4: Run It
```bash
# Start backend (in separate terminal)
cd backend-nestjs && PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev

# Start frontend (in separate terminal)
cd frontend && npm run dev -- --port 8080

# Run test (in another terminal)
cd frontend && npx playwright test
```

## 📚 Task Execution Order

**Week 1: Foundation**
1. test_01 → test_02 → test_03 → test_04 → test_05 ⚠️

**Week 2: Core Features**
6. test_06 → test_07 → test_08

**Week 3: Advanced Features**
9. test_09 → test_10 → test_11 → test_12

**Week 4: Quality & CI/CD**
10. test_13 → test_14 → test_15 → test_16 → test_17 → test_18

## 🎯 Priority Tests

### Must Have (Week 1)
- ✅ Task 05: Smoke Tests - **Catches browser syntax errors!**
- ✅ Task 06: Auth Tests
- ✅ Task 07: Calendar Tests (basic)

### Should Have (Week 2-3)
- ✅ Task 11: Automation Tests
- ✅ Task 13: API Tests

### Nice to Have (Week 4)
- ✅ Task 15: Accessibility
- ✅ Task 16: Performance
- ✅ Task 17: Visual Regression

## 🔥 Most Important Test

**Task 05: Smoke Tests** answers your original question:

> "How would you test against browser syntax errors?"

This test catches ALL JavaScript errors that only appear in browsers:

```typescript
test('catches browser syntax errors', async ({ page }) => {
  const jsErrors: Error[] = [];
  page.on('pageerror', (err) => jsErrors.push(err));

  await page.goto('/');
  await page.click('button:has-text("Automation")');
  await page.click('button:has-text("Profile")');

  // If there are ANY syntax errors, this fails
  expect(jsErrors).toHaveLength(0);
});
```

## 📝 Quick Commands

```bash
# Run all tests
npm run test:e2e

# Run smoke tests only (FAST - use this often!)
npm run test:e2e:smoke

# Run in UI mode (interactive debugging)
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed

# Run specific test file
npm run test:e2e e2e/smoke/app-loads.spec.ts

# Update visual snapshots
npm run test:e2e -- --update-snapshots
```

## 🐛 Debug Failing Test

```bash
# Run single test in headed mode with trace
npx playwright test e2e/smoke/app-loads.spec.ts --headed --trace on

# View trace
npx playwright show-trace trace.zip
```

## 💡 Common Issues

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

### Servers Not Starting
Make sure both servers are running:
```bash
# Backend
curl http://localhost:8081/api/docs

# Frontend
curl http://localhost:8080
```

### Browser Not Installed
```bash
npx playwright install chromium --with-deps
```

## 📊 What Gets Tested

- ✅ All 76 React components
- ✅ All 60+ API endpoints
- ✅ All user workflows
- ✅ Browser syntax errors ⚠️
- ✅ Console errors
- ✅ Network failures
- ✅ Accessibility (WCAG AA)
- ✅ Performance benchmarks
- ✅ Visual appearance

## 🎓 Learning Path

### Day 1: Setup (2-3 hours)
- Complete tasks 01-02
- Run first smoke test
- Understand Page Objects

### Day 2: Smoke Tests (2-3 hours)
- Complete task 05
- Add console error detection
- Test all main routes

### Day 3-4: Core Features (4-6 hours)
- Complete tasks 06-08
- Test login, calendar, profile

### Week 2: Advanced Features (10-15 hours)
- Complete tasks 09-12
- Full feature coverage

### Week 3: Quality (10-15 hours)
- Complete tasks 13-17
- APIs, accessibility, performance

### Week 4: Automation (2-3 hours)
- Complete task 18
- CI/CD integration

## 🏆 Success Checklist

After setup, you should be able to:
- [ ] Run `npm run test:e2e:smoke` successfully
- [ ] See all pages load without console errors
- [ ] Catch syntax errors automatically
- [ ] Run tests in multiple browsers
- [ ] View HTML test reports
- [ ] Debug tests in UI mode

## 🆘 Need Help?

1. Check [README.md](./README.md) for full documentation
2. Review specific task file (test_XX_*.md)
3. Check Playwright docs: https://playwright.dev
4. Review test examples in task files

---

**Next Step:** Open [test_01_setup_playwright.md](./test_01_setup_playwright.md) and start implementing!
