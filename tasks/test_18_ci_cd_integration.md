# Test Task 18: CI/CD Integration

## Description
Set up automated test execution in CI/CD pipeline (GitHub Actions) to run tests on every commit, PR, and deployment.

## Prerequisites
- ✅ Completed test_01-17
- All test suites working locally
- GitHub repository configured

## Implementation Steps

### 1. Create GitHub Actions Workflow

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop, task_automation]
  pull_request:
    branches: [main, develop]
  workflow_dispatch: # Manual trigger

jobs:
  test:
    name: Run E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30

    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
      fail-fast: false # Continue other browsers if one fails

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies (backend)
        run: |
          cd backend-nestjs
          npm ci

      - name: Install dependencies (frontend)
        run: |
          cd frontend
          npm ci

      - name: Install Playwright browsers
        run: |
          cd frontend
          npx playwright install --with-deps ${{ matrix.browser }}

      - name: Setup database
        run: |
          cd backend-nestjs
          npm run migration:run
          npm run seed

      - name: Start backend server
        run: |
          cd backend-nestjs
          PORT=8081 JWT_SECRET="test-secret-key" npm run start:dev &
          npx wait-on http://localhost:8081/api/docs --timeout 120000

      - name: Start frontend server
        run: |
          cd frontend
          npm run dev -- --port 8080 &
          npx wait-on http://localhost:8080 --timeout 120000

      - name: Run E2E tests
        run: |
          cd frontend
          npm run test:e2e -- --project=${{ matrix.browser }}
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.browser }}
          path: frontend/test-results/
          retention-days: 7

      - name: Upload HTML report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.browser }}
          path: frontend/playwright-report/
          retention-days: 7

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: screenshots-${{ matrix.browser }}
          path: frontend/test-results/**/*.png
          retention-days: 7

      - name: Comment PR with results
        if: github.event_name == 'pull_request' && always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const resultsPath = 'frontend/test-results/results.json';

            if (fs.existsSync(resultsPath)) {
              const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
              const passed = results.stats.expected;
              const failed = results.stats.unexpected;
              const total = passed + failed;

              const body = `## 🧪 E2E Test Results (${{ matrix.browser }})

              ✅ **Passed:** ${passed}/${total}
              ❌ **Failed:** ${failed}/${total}

              ${failed > 0 ? '⚠️ Some tests failed. Check the workflow logs for details.' : '🎉 All tests passed!'}`;

              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: body
              });
            }

  smoke-tests:
    name: Quick Smoke Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend-nestjs && npm ci

      - name: Install Playwright
        run: |
          cd frontend
          npx playwright install chromium --with-deps

      - name: Start servers
        run: |
          cd backend-nestjs && PORT=8081 JWT_SECRET="test-key" npm run start:dev &
          cd frontend && npm run dev -- --port 8080 &
          npx wait-on http://localhost:8081/api/docs http://localhost:8080

      - name: Run smoke tests only
        run: |
          cd frontend
          npm run test:e2e:smoke

  accessibility-tests:
    name: Accessibility Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend-nestjs && npm ci

      - name: Install Playwright
        run: |
          cd frontend
          npx playwright install chromium --with-deps

      - name: Start servers
        run: |
          cd backend-nestjs && PORT=8081 JWT_SECRET="test-key" npm run start:dev &
          cd frontend && npm run dev -- --port 8080 &
          npx wait-on http://localhost:8081/api/docs http://localhost:8080

      - name: Run accessibility tests
        run: |
          cd frontend
          npm run test:e2e e2e/accessibility/

      - name: Upload accessibility report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: accessibility-report
          path: frontend/test-results/
          retention-days: 7
```

### 2. Add wait-on dependency

Update `frontend/package.json`:
```json
{
  "devDependencies": {
    "wait-on": "^7.2.0"
  }
}
```

### 3. Create PR Template

Create `.github/pull_request_template.md`:

```markdown
## Description
<!-- Describe your changes -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All E2E tests pass locally
- [ ] Added new tests for new features
- [ ] Visual regression tests reviewed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors in browser

## Screenshots (if applicable)
<!-- Add screenshots of UI changes -->

## Related Issues
<!-- Link related issues: Fixes #123 -->
```

### 4. Create Test Summary Script

Create `frontend/scripts/generate-test-summary.js`:

```javascript
const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, '../test-results/results.json');

if (!fs.existsSync(resultsPath)) {
  console.log('No test results found');
  process.exit(0);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

const summary = {
  total: results.stats.expected + results.stats.unexpected,
  passed: results.stats.expected,
  failed: results.stats.unexpected,
  skipped: results.stats.skipped,
  duration: results.stats.duration,
};

console.log('\n📊 Test Summary:');
console.log('================');
console.log(`Total:    ${summary.total}`);
console.log(`✅ Passed:  ${summary.passed}`);
console.log(`❌ Failed:  ${summary.failed}`);
console.log(`⏭️  Skipped: ${summary.skipped}`);
console.log(`⏱️  Duration: ${(summary.duration / 1000).toFixed(2)}s`);
console.log('================\n');

if (summary.failed > 0) {
  console.log('❌ Some tests failed. Check logs above.\n');
  process.exit(1);
} else {
  console.log('🎉 All tests passed!\n');
  process.exit(0);
}
```

Update `frontend/package.json`:
```json
{
  "scripts": {
    "test:e2e:summary": "node scripts/generate-test-summary.js"
  }
}
```

### 5. Add Status Badges to README

Update `README.md`:

```markdown
# Cal3 Calendar Application

[![E2E Tests](https://github.com/Csepi/cal3/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/Csepi/cal3/actions/workflows/e2e-tests.yml)
[![Smoke Tests](https://github.com/Csepi/cal3/actions/workflows/e2e-tests.yml/badge.svg?job=smoke-tests)](https://github.com/Csepi/cal3/actions/workflows/e2e-tests.yml)

## Testing

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test Suite
```bash
npm run test:e2e:smoke      # Quick smoke tests
npm run test:e2e e2e/auth/  # Auth tests only
```

### View Test Report
```bash
npm run test:e2e:report
```
```

### 6. Configure Test Notifications (Optional)

For Slack notifications, add to workflow:

```yaml
      - name: Notify Slack on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "E2E Tests Failed on ${{ github.ref }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "❌ E2E tests failed\n*Branch:* ${{ github.ref }}\n*Commit:* ${{ github.sha }}"
                  }
                }
              ]
            }
```

## Files to Create/Modify

### Create:
- `.github/workflows/e2e-tests.yml` ✨ Main workflow
- `.github/pull_request_template.md`
- `frontend/scripts/generate-test-summary.js`

### Modify:
- `README.md` (add badges and testing section)
- `frontend/package.json` (add wait-on dependency)

## Expected Outcome

✅ **Automated testing on every commit**
✅ **Multi-browser testing (Chrome, Firefox, Safari)**
✅ **PR comments with test results**
✅ **Test artifacts uploaded (screenshots, reports)**
✅ **Status badges in README**
✅ **Smoke tests run in under 10 minutes**
✅ **Full test suite completes in under 30 minutes**

## Testing the CI/CD Setup

### 1. Local Test
```bash
cd frontend
npm run test:e2e
```

### 2. Push to Branch
```bash
git checkout -b test/ci-cd-setup
git add .github/workflows/e2e-tests.yml
git commit -m "Add E2E test CI/CD pipeline"
git push origin test/ci-cd-setup
```

### 3. Create PR
- Open PR on GitHub
- Watch workflow execute
- Check for PR comment with results

### 4. Review Artifacts
- Download test reports from workflow
- Review screenshots of failures
- Check HTML report

## Maintenance

### Weekly Tasks
- Review failed test trends
- Update test data as needed
- Check for flaky tests

### Monthly Tasks
- Update Playwright to latest version
- Review and update test timeouts
- Optimize slow tests

## Estimated Time
⏱️ **2-3 hours**

## Completion
🎉 **ALL 18 TASKS COMPLETE!** You now have a comprehensive E2E testing framework covering every page, component, API endpoint, and function call in your application.

## Summary of What Was Built

✅ **Infrastructure** (Tasks 1-4): Setup, config, test data, page objects
✅ **Core Tests** (Tasks 5-8): Smoke, auth, calendar, profile
✅ **Feature Tests** (Tasks 9-12): Sync, reservations, automation, admin
✅ **Advanced Tests** (Tasks 13-17): APIs, components, a11y, performance, visual
✅ **CI/CD** (Task 18): Automated testing pipeline

**Total Test Coverage:**
- 100+ test files
- 500+ individual tests
- All 76 React components
- All 60+ API endpoints
- All user flows and features
- Multi-browser support
- Accessibility compliance
- Performance benchmarks
