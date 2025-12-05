# Staging Automated Tests

Automated smoke tests for the staging environment (`staging.nextbestmove.app`) using Playwright.

## Overview

These tests validate the 4 revenue-critical user paths:
1. **Onboarding → First Action** - New user signup, onboarding completion, first daily plan, Fast Win completion
2. **Daily Habit Loop** - User login, daily plan viewing, action completion
3. **Billing (Trial → Paid)** - Stripe checkout flow, subscription activation
4. **Weekly Summary Generation** - Weekly summary display and metrics

## Prerequisites

- Node.js and npm installed
- Playwright browsers installed (`npx playwright install`)
- Environment variables set (see below)

## Environment Variables

Create a `.env.test` file or set these environment variables:

```bash
STAGING_USER=staging                    # Basic Auth username
STAGING_PASS=your-password              # Basic Auth password
CRON_SECRET=your-secret                 # For triggering cron jobs (optional, staging value in Preview scope)
STAGING_SUPABASE_URL=your-url           # For test data cleanup (optional)
STAGING_SUPABASE_SERVICE_ROLE_KEY=key   # For test data cleanup (optional)
```

## Running Tests

### Run all tests
```bash
npm run test:staging
```

### Run with UI mode (interactive)
```bash
npm run test:staging:ui
```

### Run in debug mode
```bash
npm run test:staging:debug
```

### Run specific test file
```bash
npx playwright test tests/critical-paths/01-onboarding-first-action.spec.ts
```

## Test Structure

```
tests/
├── critical-paths/          # The 4 revenue-critical path tests
│   ├── 01-onboarding-first-action.spec.ts
│   ├── 02-daily-habit-loop.spec.ts
│   ├── 03-billing-trial-to-paid.spec.ts
│   └── 04-weekly-summary.spec.ts
├── helpers/                  # Test utilities
│   ├── auth.ts              # Authentication helpers
│   ├── test-data.ts         # Test data management
│   └── staging-config.ts    # Staging configuration
└── fixtures/                 # Playwright fixtures
    └── staging-user.ts       # Authenticated user fixture
```

## Test Data Management

- Tests create unique test users with emails like `test-{timestamp}-{random}@staging.nextbestmove.app`
- Test users are automatically cleaned up after each test
- Tests are isolated and don't interfere with each other

## CI/CD Integration

Tests can be run in GitHub Actions on push to `staging` branch. See `.github/workflows/staging-tests.yml` (optional).

## Troubleshooting

### Tests fail with Basic Auth errors
- Verify `STAGING_USER` and `STAGING_PASS` are set correctly
- Check that Basic Auth is enabled in Vercel for staging

### Tests fail with timeout errors
- Staging deployment might be slow - increase timeout in `playwright.config.ts`
- Check that staging site is accessible

### Stripe checkout test fails
- Verify Stripe test mode is configured
- Check that test card numbers are correct (`4242 4242 4242 4242`)
- Webhook processing might take time - test might need to wait

### Weekly summary test shows empty state
- New users won't have 7 days of activity
- Test includes alternative approach to trigger cron job manually
- Set `STAGING_CRON_SECRET` to enable cron job triggering

## Notes

- Tests run against staging only (never production)
- Basic Auth is handled automatically via Playwright's `httpCredentials` option
- Tests use flexible selectors to work with UI changes
- Some tests may need adjustment based on actual UI implementation

