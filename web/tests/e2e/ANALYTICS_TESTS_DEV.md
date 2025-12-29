# Analytics E2E Tests - Development Workflow

## Overview

Analytics E2E tests are being developed incrementally in an isolated file that is **NOT run in CI**. This allows us to debug and fix each test one at a time without blocking deployments.

## File Structure

- **`analytics-pages-dev.spec.ts`** - Development test file (NOT in CI)
- **`analytics-pages.spec.ts`** - Production test file (disabled, will be enabled when all tests pass)

## Workflow

### Step 1: Run TEST 1
```bash
# Run only TEST 1
npx playwright test tests/e2e/analytics-pages-dev.spec.ts -g "TEST 1"
```

### Step 2: Debug TEST 1
- If it fails, fix the issues
- Run again until it passes
- Once it passes consistently, move to Step 3

### Step 3: Enable TEST 2
1. Remove `.skip()` from TEST 2 in `analytics-pages-dev.spec.ts`
2. Implement the test logic
3. Run: `npx playwright test tests/e2e/analytics-pages-dev.spec.ts -g "TEST 2"`
4. Debug until it passes

### Step 4: Repeat for Tests 3 and 4
- Enable TEST 3, debug until it passes
- Enable TEST 4, debug until it passes

### Step 5: Move to CI
Once ALL tests pass consistently:
1. Copy working tests from `analytics-pages-dev.spec.ts` to `analytics-pages.spec.ts`
2. Remove `.skip()` from `analytics-pages.spec.ts`
3. Tests will now run in CI

## Current Status

- ✅ **TEST 1**: Basic page rendering - Ready for debugging
- ⏸️ **TEST 2**: Error handling - Placeholder (skip)
- ⏸️ **TEST 3**: Admin cancellation analytics - Placeholder (skip)
- ⏸️ **TEST 4**: Date filters - Placeholder (skip)

## Running Tests

### Run all dev tests
```bash
npx playwright test tests/e2e/analytics-pages-dev.spec.ts
```

### Run specific test
```bash
npx playwright test tests/e2e/analytics-pages-dev.spec.ts -g "TEST 1"
```

### Run with UI (for debugging)
```bash
npx playwright test tests/e2e/analytics-pages-dev.spec.ts --ui
```

### Run with trace (for debugging)
```bash
npx playwright test tests/e2e/analytics-pages-dev.spec.ts --trace on
```

## Important Notes

- **Dev tests are excluded from CI** via `testIgnore` in `playwright.config.ts`
- **Original analytics tests are disabled** (all skipped) to prevent CI failures
- **Only enable one test at a time** - debug until it works before moving to the next
- **Don't mix working and non-working tests** - keep them separate until all pass

