# NEX-16 Idempotency Test Implementation Plan

## What Needs to Be Done

The current test at `web/tests/integration/api/billing-idempotency.test.ts` is a placeholder. Here's what needs to be implemented:

### 1. Unit Tests (Move to `web/tests/unit/billing/idempotency.test.ts`)

**Test: `generateIdempotencyKey` stability**
- Same inputs should produce same key
- Different inputs should produce different keys
- Keys should be deterministic (no randomness)

**Test: `checkIdempotency`**
- Returns `{ exists: false }` when key doesn't exist
- Returns `{ exists: true, result: ... }` when key exists
- Handles database errors gracefully (fail open)

**Test: `storeIdempotencyResult`**
- Stores result successfully
- Handles duplicate key insertion (unique constraint violation)
- Returns success/failure boolean

**Test: `executeWithIdempotency`**
- First call executes operation and stores result
- Second call with same key returns cached result
- Operation is not executed twice

### 2. Integration Tests (Complete `web/tests/integration/api/billing-idempotency.test.ts`)

**Test: Webhook event idempotency**
- Simulate processing same Stripe webhook event twice
- Verify only one subscription/charge is created
- Verify `billing_events` table prevents duplicate processing

**Test: Checkout session idempotency**
- Create checkout session with idempotency key
- Retry same operation with same key
- Verify only one session is created

**Test: Subscription creation idempotency**
- Create subscription with idempotency key
- Retry same operation
- Verify only one subscription is created

### 3. Test Data Setup

**Required:**
- Test user with email/password
- Supabase service role key (for admin operations)
- Clean test environment (reset between tests)

**Test Fixtures:**
- Use `test-users.ts` to create test users
- Create billing customer records
- Clean up after tests

### 4. Mocking Strategy

**For Unit Tests:**
- Mock Supabase client
- Mock Stripe API calls
- Test pure logic without external dependencies

**For Integration Tests:**
- Use real Supabase connection (staging DB)
- Use Stripe test mode
- Clean up test data after each test

## Implementation Steps

1. **Create unit test file** (`web/tests/unit/billing/idempotency.test.ts`)
   - Test `generateIdempotencyKey` function
   - Test `checkIdempotency` with mocked Supabase
   - Test `storeIdempotencyResult` with mocked Supabase
   - Test `executeWithIdempotency` end-to-end

2. **Complete integration test** (`web/tests/integration/api/billing-idempotency.test.ts`)
   - Set up test user and billing customer
   - Test webhook event idempotency
   - Test checkout session idempotency
   - Test subscription creation idempotency
   - Clean up test data

3. **Add test helpers** (if needed)
   - Helper to create test billing customer
   - Helper to simulate Stripe webhook events
   - Helper to clean up test billing data

## Files to Create/Modify

1. ✅ `web/tests/unit/billing/idempotency.test.ts` (NEW)
2. ✅ `web/tests/integration/api/billing-idempotency.test.ts` (UPDATE existing)
3. ⚠️ `web/tests/helpers/billing.ts` (NEW - optional, for test utilities)

## Dependencies

- `@supabase/supabase-js` - Already installed
- `vitest` - Already installed
- `stripe` - Already installed (for test mode)
- Test environment variables:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `STRIPE_SECRET_KEY` (test mode)

## Success Criteria

✅ All unit tests pass  
✅ All integration tests pass  
✅ Tests verify idempotency prevents duplicate charges  
✅ Tests verify idempotency prevents duplicate subscriptions  
✅ Tests verify webhook events are not processed twice  
✅ Test cleanup removes all test data  

