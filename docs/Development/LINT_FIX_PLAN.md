# Systematic Lint Error Fix Plan

## Problem Analysis

**Current State:**
- ~144 instances of `any` type across codebase
- 131 in `web/src` (60 files)
- 13 in `web/tests` (7 files)
- Primary rule violation: `@typescript-eslint/no-explicit-any`

**Root Cause:**
- No pre-commit hooks allowed errors to accumulate
- Missing type definitions for external APIs (Stripe, Supabase)
- Error handling using `any` instead of proper Error types
- Browser context code using `any` for window object

## Strategy: Fix by Category

### Phase 1: Create Shared Type Definitions (Foundation)
**Goal:** Establish reusable types to prevent duplication

1. **Create `/web/src/lib/types/common.ts`**
   - Error types: `ApiError`, `ValidationError`, `DatabaseError`
   - Generic response types: `ApiResponse<T>`, `PaginatedResponse<T>`
   - Utility types: `Maybe<T>`, `Result<T, E>`

2. **Create `/web/src/lib/types/stripe.ts`**
   - Re-export Stripe types: `Stripe.Event`, `Stripe.Customer`, etc.
   - Custom webhook event types: `WebhookEvent<T>`
   - Type guards: `isStripeEvent()`, `isCheckoutSessionCompleted()`

3. **Create `/web/src/lib/types/supabase.ts`**
   - Database response types
   - Query result types: `SupabaseResponse<T>`
   - Type guards for Supabase errors

### Phase 2: Fix Error Handling (High Impact, Low Risk)
**Pattern:** `catch (error: any)` → `catch (error: unknown)`

**Files to fix:**
- All API routes with try-catch blocks
- Cron jobs
- Background jobs

**Approach:**
```typescript
// Before
catch (error: any) {
  return { error: error.message };
}

// After
catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { error: message };
}
```

**Estimated:** ~40 files, 1-2 hours

### Phase 3: Fix Stripe Webhook Types (High Impact, Medium Risk)
**Pattern:** Use proper Stripe types from `stripe` package

**Files:**
- `web/src/app/api/billing/webhook/route.ts` (22 instances)
- `web/src/app/api/billing/create-checkout-session/route.ts`
- `web/src/app/api/billing/start-trial/route.ts`
- `web/src/app/api/billing/create-subscription-no-trial/route.ts`
- `web/src/app/api/billing/customer-portal/route.ts`
- `web/src/app/api/billing/sync-subscription/route.ts`

**Approach:**
```typescript
// Before
catch (err: any) {
  logError("Failed", err);
}

// After
catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  logError("Failed", error);
}

// For Stripe events
import Stripe from "stripe";
const event: Stripe.Event = stripe.webhooks.constructEvent(...);
```

**Estimated:** 6 files, 2-3 hours

### Phase 4: Fix Supabase Response Types (Medium Impact, Low Risk)
**Pattern:** Use Supabase's generated types or explicit types

**Files:**
- API routes using Supabase queries
- Database operations

**Approach:**
```typescript
// Before
const { data, error } = await supabase.from("users").select("*");
const user = data as any;

// After
type User = {
  id: string;
  email: string;
  // ... other fields
};
const { data, error } = await supabase.from("users").select("*");
const user = data as User[];
```

**Estimated:** ~30 files, 2-3 hours

### Phase 5: Fix API Request/Response Types (Medium Impact, Medium Risk)
**Pattern:** Define explicit types for request bodies and responses

**Files:**
- All API route handlers
- Client-side API calls

**Approach:**
```typescript
// Before
const body = await request.json();
const { userId } = body as any;

// After
interface CreateActionRequest {
  userId: string;
  actionType: string;
  // ...
}
const body = await request.json() as CreateActionRequest;
const { userId } = body;
```

**Estimated:** ~40 files, 3-4 hours

### Phase 6: Fix Browser Context Types (Low Impact, Low Risk)
**Pattern:** Use proper window type extensions or eslint-disable

**Files:**
- `web/tests/helpers/auth.ts` (already fixed)
- Any other browser context code

**Approach:**
```typescript
// For browser-only code where types are truly unknown
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const windowSupabase = (window as any).supabase;
```

**Estimated:** ~5 files, 30 minutes

### Phase 7: Fix Test Files (Low Impact, Low Risk)
**Pattern:** Use proper mock types

**Files:**
- All test files with `any` types

**Approach:**
```typescript
// Before
const mockSupabase: any = { ... };

// After
type MockSupabase = {
  from: (table: string) => MockQueryBuilder;
};
const mockSupabase: MockSupabase = { ... };
```

**Estimated:** ~7 files, 1-2 hours

## Implementation Order

1. ✅ **Phase 1:** Create shared type definitions (30 min)
2. **Phase 2:** Fix error handling (1-2 hours)
3. **Phase 3:** Fix Stripe types (2-3 hours)
4. **Phase 4:** Fix Supabase types (2-3 hours)
5. **Phase 5:** Fix API types (3-4 hours)
6. **Phase 6:** Fix browser context (30 min)
7. **Phase 7:** Fix test files (1-2 hours)

**Total Estimated Time:** 10-15 hours

## Quality Gates

After each phase:
1. Run `npm run lint` - should see reduction in errors
2. Run `npm run type-check` - should pass
3. Run `npm run test:unit` - should pass
4. Commit with clear message: `fix: Remove any types from [category]`

## Prevention

1. ✅ Pre-commit hooks (already implemented)
2. ✅ CI lint checks (already implemented)
3. Add type checking to pre-commit hooks
4. Document type patterns in `docs/Development/TypeScript_Patterns.md`

## Tools & Commands

```bash
# Find all any types
grep -r ": any\|as any" web/src --include="*.ts" --include="*.tsx"

# Count by file
grep -r ": any\|as any" web/src --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort | uniq -c | sort -rn

# Run lint on specific file
npm run lint -- web/src/app/api/billing/webhook/route.ts

# Auto-fix what can be auto-fixed
npm run lint -- --fix
```

## Notes

- **When to use `unknown` instead of `any`:**
  - Error handling: Always use `unknown`, then type guard
  - External API responses: Use `unknown`, then validate
  - Truly dynamic data: Use `unknown` with type guards

- **When eslint-disable is acceptable:**
  - Browser context (window, document) where types are truly dynamic
  - Third-party library limitations
  - Migration period (temporary, with TODO comment)

- **Priority:**
  - High: Error handling, Stripe webhooks (security/correctness)
  - Medium: API types, Supabase types (maintainability)
  - Low: Test mocks, browser context (less critical)

