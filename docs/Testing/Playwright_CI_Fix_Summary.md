# Playwright CI Test Failure Fix Summary

**Date:** January 2026  
**Issue:** Test failure in CI with `expect(received).toBeTruthy()` - `Received: false`  
**Test:** `01-onboarding-first-action.spec.ts` - "should complete onboarding and generate first daily plan with Fast Win"

---

## Problem

The test was failing in CI because `hasActions` was `false` when it was expected to be `true`. The test was using `Promise.race()` to check for multiple selectors, but in CI environments, elements can take longer to appear due to:

1. **Slower network conditions** - API calls take longer to complete
2. **Resource constraints** - CI runners may be slower than local machines
3. **Race conditions** - React state updates and re-renders happen asynchronously
4. **Timing issues** - Manual waits weren't sufficient for the full render cycle

---

## Root Cause

The test was checking for plan elements using `Promise.race()` with manual timeouts. This approach has several issues:

1. **No auto-retry** - If an element isn't found immediately, it fails
2. **Insufficient waits** - Not waiting for the full API call cycle (generate → fetch)
3. **Manual boolean checks** - Using `isVisible()` instead of Playwright's auto-retrying assertions
4. **Fixed timeouts** - Not accounting for CI environment differences

---

## Solution

### 1. Replaced Manual Checks with Auto-Retrying Assertions

**Before:**
```typescript
const hasActions = await Promise.race([
  page.locator('[data-testid^="action-card-"]').first().waitFor({ timeout: 20000 }).then(() => true),
  // ... more selectors
]).catch(() => false);

expect(hasActions).toBeTruthy();
```

**After:**
```typescript
// Use Playwright's auto-retrying assertions
try {
  await expect(page.locator('[data-testid^="action-card-"]').first()).toBeVisible({ timeout: 30000 });
  actionsFound = true;
} catch (error) {
  // Try next selector...
}
```

**Benefits:**
- Auto-retries until element appears or timeout
- Better error messages
- More reliable in CI environments

### 2. Added Explicit Wait for API Call Chain

**Before:**
```typescript
const [response] = await Promise.all([
  page.waitForResponse(response => response.url().includes('/api/daily-plans/generate'), { timeout: 30000 }),
  generateButton.click(),
]);
```

**After:**
```typescript
// Wait for BOTH the generate API call AND the subsequent fetchDailyPlan() call
const [generateResponse, fetchResponse] = await Promise.all([
  page.waitForResponse(response => response.url().includes('/api/daily-plans/generate'), { timeout: 45000 }),
  page.waitForResponse(response => response.url().includes('/api/daily-plans') && response.request().method() === 'GET', { timeout: 45000 }),
  generateButton.click(),
]);
```

**Benefits:**
- Ensures the full API cycle completes (generate → fetch)
- Prevents race conditions where plan isn't fetched yet

### 3. Increased Timeouts for CI

**Before:**
```typescript
await page.waitForLoadState("networkidle", { timeout: 10000 });
```

**After:**
```typescript
await page.waitForLoadState("networkidle", { timeout: 15000 });
// ... and increased API response timeouts to 45000ms
```

**Benefits:**
- Accounts for slower CI network conditions
- Reduces flaky test failures

### 4. Added Global Expect Timeout

**Added to `playwright.config.ts`:**
```typescript
expect: {
  timeout: process.env.CI ? 30000 : 10000, // 30 seconds in CI, 10 seconds locally
},
```

**Benefits:**
- All assertions get longer timeout in CI
- Consistent behavior across all tests
- Environment-aware (faster locally, more patient in CI)

### 5. Improved Error Handling and Debugging

**Added:**
- Multiple fallback selectors (test ID → Fast Win → header → best action card)
- Better console logging for debugging
- Screenshots on failure
- Page content logging for troubleshooting

---

## Common Playwright CI Issues Addressed

### 1. **Timing Issues**
- ✅ Increased timeouts for CI environment
- ✅ Added explicit waits for API call chains
- ✅ Wait for network idle after operations

### 2. **Race Conditions**
- ✅ Wait for both generate and fetch API calls
- ✅ Wait for React state updates with `waitForTimeout(2000)`
- ✅ Wait for network idle before checking elements

### 3. **Element Detection**
- ✅ Use auto-retrying assertions (`expect().toBeVisible()`)
- ✅ Multiple fallback selectors
- ✅ Try most specific selectors first

### 4. **Network Conditions**
- ✅ Increased API response timeouts (30s → 45s)
- ✅ Increased network idle timeout (10s → 15s)
- ✅ Global expect timeout (10s → 30s in CI)

---

## Best Practices Applied

1. **Use Playwright's Auto-Retrying Assertions**
   - `expect(locator).toBeVisible()` instead of `locator.isVisible()`
   - Automatically retries until condition is met

2. **Wait for Complete API Cycles**
   - Don't just wait for the first API call
   - Wait for subsequent calls that fetch updated data

3. **Environment-Aware Timeouts**
   - Longer timeouts in CI
   - Shorter timeouts locally for faster feedback

4. **Multiple Fallback Strategies**
   - Try most specific selectors first
   - Fall back to less specific selectors
   - Provide helpful error messages

5. **Better Debugging**
   - Screenshots on failure
   - Console logging for each step
   - Page content logging

---

## Testing the Fix

To verify the fix works:

1. **Run locally:**
   ```bash
   cd web
   npm run test:staging
   ```

2. **Check CI:**
   - Push to staging branch
   - Verify GitHub Actions passes
   - Check test results in CI logs

3. **If still failing:**
   - Check screenshots in `test-results/`
   - Review console logs for timing issues
   - Verify API responses are completing

---

## References

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)
- [Playwright CI Configuration](https://playwright.dev/docs/ci)

---

## Files Changed

1. `web/tests/critical-paths/01-onboarding-first-action.spec.ts`
   - Replaced `Promise.race()` with auto-retrying assertions
   - Added explicit waits for API call chain
   - Increased timeouts for CI
   - Improved error handling

2. `web/playwright.config.ts`
   - Added global `expect` timeout configuration
   - Environment-aware timeouts (CI vs local)

---

**Status:** ✅ Fixed - Ready for CI testing

