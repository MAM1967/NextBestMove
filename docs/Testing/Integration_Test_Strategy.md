# Integration Test Strategy for Launch

## Why Integration Tests Were Deferred

The integration tests for `/api/actions/[id]` and cron endpoints were initially marked as placeholders because:

1. **Next.js Request Context Issue**: The `createClient()` function from `@/lib/supabase/server` uses Next.js's `cookies()` API, which only works within a request context. This makes it difficult to test API routes directly in Vitest.

2. **Testing Pattern Mismatch**: The existing integration test (`billing-idempotency.test.ts`) uses a **direct Supabase client with service role key**, not the Next.js server client. This is the correct pattern for integration tests.

## Recommendation for Launch

**For launch readiness, we have three options:**

### Option 1: Test Business Logic Directly (RECOMMENDED for Launch) ⭐

**Pros:**
- Fast to implement (30-60 minutes)
- Tests the core business logic
- Uses existing pattern (same as `billing-idempotency.test.ts`)
- No Next.js mocking complexity

**Cons:**
- Doesn't test the full API route (authentication, request parsing)
- But E2E tests already cover the full flow

**Implementation:**
- Extract business logic from route handlers into testable functions
- Test those functions using service role Supabase client
- E2E tests already verify the full API route works end-to-end

### Option 2: E2E Tests Only (ACCEPTABLE for Launch)

**Pros:**
- Already implemented and working
- Tests the full stack (API routes, authentication, database)
- More realistic than integration tests

**Cons:**
- Slower to run
- Requires staging environment
- Less granular error messages

**Current Status:**
- ✅ E2E tests for action detail modal are implemented
- ✅ E2E tests cover the full user flow

### Option 3: Full API Route Testing (POST-LAUNCH)

**Pros:**
- Tests complete API route including authentication
- Catches integration issues early

**Cons:**
- Requires Next.js request context mocking (complex)
- 2-4 hours to implement properly
- Not critical for launch if E2E tests pass

**Implementation (Post-Launch):**
- Use `@edge-runtime/jest-environment` or similar
- Mock Next.js request/response objects
- Test routes with proper authentication headers

## Recommendation: Option 1 + Option 2

**For launch:**
1. ✅ **Keep E2E tests** - They already test the full flow
2. ✅ **Add business logic integration tests** - Test core functions with service role client
3. ⏸️ **Defer full API route tests** - Can be added post-launch

**Why this works:**
- E2E tests verify the API routes work end-to-end (authentication, request handling, response)
- Integration tests verify business logic correctness (data fetching, transformations, RLS)
- Together they provide comprehensive coverage without blocking launch

## Implementation Plan

### Immediate (Pre-Launch)

1. **Extract business logic from `/api/actions/[id]/route.ts`:**
   - Create `getActionDetails(userId, actionId)` function
   - Move history derivation logic to separate function
   - Move related actions fetching to separate function

2. **Create integration tests using service role client:**
   - Test `getActionDetails()` with real Supabase client
   - Test RLS (users can only access their own actions)
   - Test history derivation logic
   - Test related actions fetching

3. **Keep existing E2E tests:**
   - They already verify the full API route works

### Post-Launch (Nice to Have)

1. Add full API route integration tests with Next.js mocking
2. Add integration tests for cron endpoints (test business logic, not routes)
3. Add performance tests for action detail queries

## Example: Business Logic Integration Test

```typescript
// web/src/lib/actions/get-action-details.ts
export async function getActionDetails(
  supabase: SupabaseClient,
  userId: string,
  actionId: string
) {
  // Business logic extracted from route handler
  // ...
}

// web/tests/integration/api/actions-detail.test.ts
import { createClient } from "@supabase/supabase-js";
import { getActionDetails } from "@/lib/actions/get-action-details";

describe("getActionDetails", () => {
  let supabase: ReturnType<typeof createClient>;
  
  beforeEach(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  });
  
  it("should return action details with lead relationship", async () => {
    // Test business logic directly
    const result = await getActionDetails(supabase, userId, actionId);
    expect(result.action).toBeDefined();
    expect(result.action.leads).toBeDefined();
  });
  
  it("should enforce RLS - users can only access own actions", async () => {
    // Test RLS by trying to access another user's action
    // ...
  });
});
```

## Conclusion

**For launch:** Option 1 (business logic tests) + Option 2 (E2E tests) provides sufficient coverage. The E2E tests already verify the API routes work correctly, and business logic tests ensure the core functionality is correct.

**Post-launch:** Option 3 (full API route tests) can be added for more granular testing, but it's not blocking for launch.

