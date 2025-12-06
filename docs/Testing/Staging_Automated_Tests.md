# Staging Automated Tests Guide

## Overview

Automated smoke tests for the staging environment using Playwright. These tests validate the 4 revenue-critical user paths to ensure staging is working before production deployments.

## Why Automated Testing on Staging?

- **Fast feedback** - Catch issues before they reach production
- **Revenue protection** - Validate critical conversion paths
- **Confidence** - Know staging works before deploying to production
- **Regression prevention** - Catch breaking changes early

## The 4 Critical Paths

### 1. Onboarding → First Action
**Why:** If this breaks, you get zero conversions.

**What it tests:**
- User signup
- Onboarding flow completion
- First daily plan generation
- Fast Win action completion

### 2. Daily Habit Loop
**Why:** If this breaks, users churn immediately.

**What it tests:**
- User login
- Daily plan display
- Action completion ("Got reply")
- UI state updates

### 3. Billing (Trial → Paid)
**Why:** If this breaks, you don't make money.

**What it tests:**
- Stripe Checkout flow (test mode)
- Payment submission
- Subscription activation
- Access retention

### 4. Weekly Summary Generation
**Why:** This is your retention hook. If it fails, users don't see progress.

**What it tests:**
- Weekly summary page loads
- Summary contains metrics (days active, actions completed)
- Summary includes insight and next week focus
- Summary is readable (not error state)

## Setup

### 1. Install Dependencies

```bash
cd web
npm install
npx playwright install chromium
```

### 2. Configure Environment Variables

Set these environment variables (or create `.env.test`):

```bash
export STAGING_USER="staging"
export STAGING_PASS="your-basic-auth-password"
export CRON_SECRET="your-cron-secret"  # Optional, for weekly summary test (staging value in Preview scope)

# For Supabase credentials, tests check both naming conventions:
# - STAGING_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL (Vercel Preview uses NEXT_PUBLIC_SUPABASE_URL)
# - STAGING_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY (Vercel Preview uses SUPABASE_SERVICE_ROLE_KEY)
# These are already set in Vercel Preview scope, so no need to set locally unless running tests outside CI
```

### 3. Run Tests

```bash
# Run all tests
npm run test:staging

# Run with UI (interactive)
npm run test:staging:ui

# Run in debug mode
npm run test:staging:debug
```

## Test Execution

Tests run against `https://staging.nextbestmove.app` (behind Basic Auth).

**Test Flow:**
1. Tests automatically handle Basic Auth via Playwright's `httpCredentials`
2. Each test creates a unique test user
3. Tests execute the critical path
4. Test user is cleaned up after test completes

## CI/CD Integration

### GitHub Actions (Optional)

Create `.github/workflows/staging-tests.yml`:

```yaml
name: Staging Tests

on:
  push:
    branches: [staging]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd web && npm ci
      - run: cd web && npx playwright install --with-deps chromium
      - run: cd web && npm run test:staging
        env:
          STAGING_USER: ${{ secrets.STAGING_USER }}
          STAGING_PASS: ${{ secrets.STAGING_PASS }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}  # Staging value in Preview scope
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: web/playwright-report/
```

## Test Maintenance

### When to Update Tests

- UI changes (button text, form fields, page structure)
- New onboarding steps
- Billing flow changes
- Weekly summary format changes

### Test Selectors

Tests use flexible selectors to work with UI changes:
- Text-based selectors (e.g., `button:has-text("Sign up")`)
- Data attributes (e.g., `[data-testid="action-card"]`)
- Class-based selectors (e.g., `.action-card`)

**Best Practice:** Add `data-testid` attributes to critical UI elements for more reliable tests.

## Troubleshooting

### Common Issues

**1. Basic Auth fails**
- Verify `STAGING_USER` and `STAGING_PASS` are correct
- Check Vercel staging environment variables

**2. Tests timeout**
- Staging might be slow - increase timeout in `playwright.config.ts`
- Check staging deployment status

**3. Stripe checkout test fails**
- Verify Stripe test mode is configured
- Check test card number (`4242 4242 4242 4242`)
- Webhook processing may take time

**4. Weekly summary is empty**
- New users won't have 7 days of activity
- Test includes cron job trigger as alternative
- Set `CRON_SECRET` to enable (staging value in Preview scope)

**5. Test user cleanup fails**
- Verify `STAGING_SUPABASE_SERVICE_ROLE_KEY` is set
- Check service role key has admin permissions

## Success Criteria

- All 4 critical path tests pass
- Tests complete in < 5 minutes
- Tests are isolated (don't interfere with each other)
- Test data is cleaned up after runs

## Next Steps

- Add more test coverage as needed
- Integrate with CI/CD pipeline
- Add visual regression testing (optional)
- Add performance testing (optional)

