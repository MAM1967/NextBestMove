# Coding Lessons Learned

This document captures coding lessons, best practices, and solutions to common problems encountered during development. Use this for code reviews and to prevent similar issues in the future.

## Table of Contents

- [TypeScript Type Safety](#typescript-type-safety)
- [Next.js 15+ API Changes](#nextjs-15-api-changes)
- [Stripe TypeScript Types](#stripe-typescript-types)
- [React Component Props](#react-component-props)
- [Supabase Client Types](#supabase-client-types)
- [Avoid Duplicate Type Definitions](#avoid-duplicate-type-definitions)
- [Timezone and Date Handling](#timezone-and-date-handling)

---

## TypeScript Type Safety

### Lesson: Always Check Component Interfaces Before Using Props

**Problem:** Passing props that don't match the component's interface causes TypeScript build errors.

**Solution:**

1. Always check the component's interface/type definition before passing props
2. Use your IDE's "Go to Definition" feature to see the exact prop types
3. Look at how the component is used elsewhere in the codebase for reference

**Example:**

```typescript
// ❌ Wrong - passing props that don't exist
<ActionNoteModal
  action={noteAction}  // This prop doesn't exist!
  onSaved={handleNoteSaved}  // Should be 'onSave'
/>

// ✅ Correct - matching the interface
<ActionNoteModal
  isOpen={noteActionId !== null}
  actionId={noteActionId}
  existingNote={noteAction?.notes || null}
  onSave={handleSaveNote}  // Correct prop name
/>
```

**Validation:** Fixed `StaleActionsSection.tsx` by checking `ActionNoteModal` interface and matching props exactly.

---

## Next.js 15+ API Changes

### Lesson: `createClient()` Returns a Promise in Next.js 15+

**Problem:** `createClient()` from Supabase now returns `Promise<SupabaseClient>` instead of `SupabaseClient` directly.

**Solution:** Use `Awaited<ReturnType<typeof createClient>>` to extract the resolved type.

**Example:**

```typescript
// ❌ Wrong - using ReturnType directly
async function myFunction(
  supabase: ReturnType<typeof createClient> // This is Promise<SupabaseClient>
) {
  // Type error!
}

// ✅ Correct - using Awaited to get resolved type
async function myFunction(
  supabase: Awaited<ReturnType<typeof createClient>> // This is SupabaseClient
) {
  // Works correctly
}
```

**Validation:** Fixed `generateContentPrompts` function in `weekly-summaries/generate/route.ts`.

---

### Lesson: `cookies()` and `params` are Promises in Next.js 15+

**Problem:** In Next.js 15+, `cookies()` and route handler `params` are now Promises.

**Solution:** Always await these values before using them.

**Example:**

```typescript
// ❌ Wrong - Next.js 14 style
export async function GET(request: Request) {
  const cookies = cookies(); // Not a Promise in Next.js 14
  const token = cookies.get("token");
}

// ✅ Correct - Next.js 15+ style
export async function GET(request: Request) {
  const cookieStore = await cookies(); // Must await
  const token = cookieStore.get("token");
}
```

**Validation:** Fixed in calendar OAuth routes (`connect/[provider]/route.ts` and `callback/[provider]/route.ts`).

---

## Stripe TypeScript Types

### Lesson: Stripe Types May Not Include All API Properties

**Problem:** Stripe's TypeScript definitions may not include all properties that exist in the actual API. For example, `Invoice.subscription` exists in the API but may not be in the base TypeScript type.

**Solution:** Use intersection types to extend the base type with additional properties.

**Example:**

```typescript
// ❌ Wrong - TypeScript doesn't recognize subscription property
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription; // Type error!
}

// ✅ Correct - Use intersection type to extend
async function handleInvoicePaid(
  invoice: Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  }
) {
  if (!invoice.subscription) return;
  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription.id;
}
```

**Alternative Approach (if intersection types don't work):**

```typescript
// Use 'as any' as a last resort, but document why
const subscription = (invoice as any).subscription;
```

**Validation:** Fixed in `webhook/route.ts` for `invoice.paid` and `invoice.payment_failed` handlers.

---

### Lesson: Stripe Subscription Properties May Need Type Guards

**Problem:** Some Stripe subscription properties like `current_period_end` may not be recognized by TypeScript even though they exist in the API.

**Solution:** Use type guards to safely access properties.

**Example:**

```typescript
// ✅ Safe approach with type guards
if (subscription && typeof subscription.current_period_end === "number") {
  const periodEnd = new Date(subscription.current_period_end * 1000);
}
```

**Validation:** Fixed in `sync-subscription/route.ts` and `webhook/route.ts`.

---

## React Component Props

### Lesson: Function Signatures Must Match Exactly

**Problem:** When passing callback functions as props, the signature must match exactly what the component expects.

**Solution:**

1. Check the component's prop interface for the exact signature
2. Ensure parameter types and return types match
3. Look at how the component is used elsewhere in the codebase

**Example:**

```typescript
// Component expects:
onAddNote: (actionId: string) => void;

// ❌ Wrong - extra parameter
const handleAddNote = (actionId: string, action: Action) => {
  // ...
};

// ✅ Correct - match the signature exactly
const handleAddNote = (actionId: string) => {
  const action = actions.find(a => a.id === actionId);
  // ...
};
```

**Validation:** Fixed `handleAddNote` in `StaleActionsSection.tsx` to match `ActionCard`'s expected signature.

---

### Lesson: Always Include Required Props

**Problem:** Missing required props causes TypeScript errors.

**Solution:**

1. Check the component interface for all required props
2. Use conditional rendering with `isOpen` prop for modals
3. Ensure all required callbacks are provided

**Example:**

```typescript
// ❌ Wrong - missing isOpen prop
{
  snoozeActionId && (
    <SnoozeActionModal
      actionId={snoozeActionId}
      onClose={() => setSnoozeActionId(null)}
      onSnooze={handleSnooze}
    />
  );
}

// ✅ Correct - include all required props
<SnoozeActionModal
  isOpen={snoozeActionId !== null}
  actionId={snoozeActionId}
  onClose={() => setSnoozeActionId(null)}
  onSnooze={handleSnooze}
/>;
```

**Validation:** Fixed `SnoozeActionModal` and `ActionNoteModal` usage in `StaleActionsSection.tsx`.

---

## Supabase Client Types

### Lesson: Use Awaited for Promise Return Types

**Problem:** When a function returns a Promise, using `ReturnType<typeof function>` gives you the Promise type, not the resolved type.

**Solution:** Use TypeScript's `Awaited` utility type to extract the resolved type.

**Example:**

```typescript
// createClient() returns Promise<SupabaseClient>
const supabase = await createClient();

// ❌ Wrong
function myFunction(supabase: ReturnType<typeof createClient>) {
  // Type is Promise<SupabaseClient>, not SupabaseClient
}

// ✅ Correct
function myFunction(supabase: Awaited<ReturnType<typeof createClient>>) {
  // Type is SupabaseClient
}
```

**Validation:** Fixed in `generateContentPrompts` function.

---

## Avoid Duplicate Type Definitions

### Lesson: Don't Define the Same Type in Multiple Files

**Problem:** Defining the same type in multiple files with different structures causes TypeScript errors: "Two different types with this name exist, but they are unrelated."

**Solution:**

1. Define types in a shared location (e.g., `types.ts` file)
2. Import and extend shared types rather than redefining them
3. Use intersection types (`&`) to add additional properties

**Example:**

```typescript
// ❌ Wrong - duplicate type definitions
// page.tsx
type StaleAction = {
  id: string;
  action_type: string;
  // ... minimal fields
};

// StaleActionsSection.tsx
type StaleAction = Action & {
  days_old: number;
};
// TypeScript error: Two different types with this name exist

// ✅ Correct - use shared type definition
// page.tsx
import type { Action } from "../actions/types";
type StaleAction = Action & {
  days_old: number;
};

// StaleActionsSection.tsx
import type { Action } from "../actions/types";
type StaleAction = Action & {
  days_old: number;
};
// Both files use the same type definition
```

**Validation:** Fixed duplicate `StaleAction` type definitions in `insights/page.tsx` and `insights/StaleActionsSection.tsx` by using the shared `Action` type from `actions/types.ts`.

---

## General Best Practices

### 1. Always Check Type Definitions First

Before using a component or function, check its type definition to understand the exact interface.

### 2. Look for Similar Usage Patterns

When fixing a type error, check how the same component/function is used elsewhere in the codebase.

### 3. Use TypeScript's Utility Types

- `Awaited<T>` - Extract resolved type from Promise
- `ReturnType<T>` - Extract return type from function
- Intersection types (`&`) - Extend types with additional properties

### 4. Document Workarounds

When using type assertions (`as any`) or intersection types to work around type system limitations, add comments explaining why.

### 5. Test Builds Early and Often

Run `npm run build` locally before pushing to catch TypeScript errors early.

---

## Supabase / Postgres Schema Gotchas

### Lesson: Always Cast Enum and Date/Timestamp Literals in Raw SQL

**Problem:** Supabase uses Postgres enums and date/timestamp types for several columns.  
When writing raw SQL (especially in seed scripts or CTEs with `UNION`), string
or `NULL` literals are inferred as `text`, which causes errors like:

- `column "status" is of type lead_status but expression is of type text`
- `column "action_type" is of type action_type but expression is of type text`
- `column "completed_at" is of type timestamp with time zone but expression is of type text`

**Solution:**

1. **Always cast enum literals explicitly:**

```sql
-- leads.status is lead_status
'ACTIVE'::lead_status

-- actions.action_type is action_type
'FOLLOW_UP'::action_type

-- actions.state is action_state
'NEW'::action_state
```

2. **Always cast NULLs for DATE / TIMESTAMPTZ in seed scripts:**

```sql
-- leads.snooze_until is DATE
null::date

-- actions.completed_at is TIMESTAMPTZ
null::timestamptz
```

3. **Pattern to follow in future SQL:**

- If the column is an enum, use `'VALUE'::enum_type_name`.
- If the column is DATE/TIMESTAMPTZ and you pass `NULL` or a literal, cast it.
- Check `supabase/migrations/*initial_schema.sql` for the actual type names.

**Validation:**  
Applied in `scripts/create-staging-actions-for-mcddsl.sql` to:

- `leads.status` (`lead_status`)
- `leads.snooze_until` (`DATE`)
- `actions.action_type` (`action_type`)
- `actions.state` (`action_state`)
- `actions.completed_at` (`TIMESTAMPTZ`)

This avoids a whole class of “expression is of type text” errors in future SQL.

---

## Research Validation

### Stripe Invoice.subscription Property

**Research Finding:** The `invoice.subscription` property exists in Stripe's API but may not be included in the base TypeScript type definition. This is a known issue with Stripe's type definitions.

**Solution Validated:** Using intersection types (`Stripe.Invoice & { subscription?: ... }`) is the recommended approach for extending types with properties that exist in the API but not in the type definitions.

### Next.js 15+ Breaking Changes

**Research Finding:** Next.js 15+ introduced breaking changes where `cookies()`, `params`, and `createClient()` return Promises instead of direct values.

**Solution Validated:** Always await these values and use `Awaited<ReturnType<...>>` for function parameters that expect the resolved type.

---

## Preventing Error Cascades

### Lesson: Always Run Type Check Before Pushing

**Problem:** Multiple TypeScript errors can accumulate across commits, causing a cascade of build failures that are difficult to debug.

**Solution:**

1. Add `type-check` script to `package.json`: `"type-check": "tsc --noEmit"`
2. Run `npm run type-check` before every commit/push
3. Set up pre-commit hooks to automatically run type checks
4. Add type checking to CI/CD pipeline before build step

**Example:**

```json
// package.json
{
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

**Why it matters:**

- Catches errors locally before they reach CI/CD
- Prevents error cascades where one error masks others
- Faster feedback loop (seconds vs minutes)
- Reduces debugging time

**Validation:** Created `BUILD_ERROR_TRIAGE.md` documenting the error cascade and mitigation strategies.

---

## Timezone and Date Handling

### Lesson: Always Consider Timezone When Working with Dates

**Problem:** JavaScript's `Date` object and date string parsing can cause subtle timezone-related bugs, especially when comparing dates or calculating day differences. For example:

- `new Date('2025-11-29')` is interpreted as UTC midnight, which may be a different day in the user's local timezone
- Creating dates from strings like `"2025-11-29T00:00:00"` uses the server's local timezone, causing off-by-one errors
- Calendar events from different timezones can be incorrectly compared

**Solution:**

1. **Use `date-fns` library** for reliable date parsing and comparison
2. **Always parse dates explicitly** using timezone-aware methods
3. **Use UTC dates at noon** (12:00 UTC) when calculating day differences to avoid DST/timezone edge cases
4. **Format dates in the user's timezone** using `Intl.DateTimeFormat` with explicit timezone parameter
5. **Centralize date utilities** in `web/src/lib/utils/dateUtils.ts` to ensure consistent handling

**Example:**

```typescript
// ❌ Wrong - timezone issues
const dueDate = new Date(action.due_date); // Interprets as UTC midnight
const today = new Date(); // Uses local time
const daysDiff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)); // Can be off by 1 day

// ❌ Wrong - creating dates from strings
const eventDate = new Date(eventDateStr + "T00:00:00"); // Uses server timezone
const todayAtMidnight = new Date(todayStr + "T00:00:00"); // Different timezone interpretation

// ✅ Correct - using date-fns for local date parsing
import { parse, startOfDay, differenceInDays } from "date-fns";

function parseLocalDate(dateString: string): Date {
  const dateOnly = dateString.split("T")[0]; // Get YYYY-MM-DD part
  const parsed = parse(dateOnly, "yyyy-MM-dd", new Date());
  return startOfDay(parsed); // Normalize to local midnight
}

const dueDate = parseLocalDate(action.due_date);
const today = startOfDay(new Date());
const daysDiff = differenceInDays(today, dueDate); // Accurate day difference

// ✅ Correct - UTC dates at noon for day calculations
const [year, month, day] = dateStr.split("-").map(Number);
const dateAtNoonUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
// Using noon UTC avoids DST transitions and timezone edge cases

// ✅ Correct - formatting in user's timezone
const todayStr = new Intl.DateTimeFormat("en-CA", {
  timeZone: userTimezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(now);
```

**Key Principles:**

1. **Parse dates as local dates** when comparing with "today" in the user's timezone
2. **Use UTC dates at noon** when calculating day differences to avoid DST issues
3. **Always specify timezone** when formatting dates for display
4. **Use `date-fns` utilities** (`parse`, `startOfDay`, `differenceInDays`, `format`) instead of raw Date operations
5. **Test with different timezones** to catch edge cases

**Package Used:** `date-fns` - A lightweight, modular date utility library that provides timezone-aware date operations.

**Validation:** Fixed date comparison bugs in:

- `ActionCard.tsx` - Fixed overdue date calculations
- `PriorityIndicator.tsx` - Fixed snooze date comparisons
- `app/page.tsx` - Fixed all-day calendar event date calculations showing "tomorrow" instead of correct day
- Created `dateUtils.ts` with centralized date handling functions

**Common Pitfalls:**

- ❌ Don't use `new Date('YYYY-MM-DD')` - it's interpreted as UTC midnight
- ❌ Don't create dates from strings without timezone context
- ❌ Don't calculate day differences using millisecond math without timezone consideration
- ✅ Always use `date-fns` functions for date operations
- ✅ Always format dates in the user's timezone when displaying
- ✅ Use UTC dates at noon for day difference calculations

---

## Environment Variable Handling

### Lesson: Always Trim Whitespace from Environment Variables

**Problem:** Environment variables in deployment platforms (Vercel, Heroku, etc.) can contain trailing whitespace, newlines, or other invisible characters. This causes subtle bugs like:

- API keys with trailing newlines failing authentication (`"sk_test_...\n"` → `invalid_client`)
- Price IDs with newlines causing Stripe errors (`"price_123\n"` → `No such price`)
- Database connection strings with spaces breaking connections
- URLs with trailing spaces causing 404 errors

**Solution:** Always trim and sanitize environment variables when reading them, especially for:

- API keys (Stripe, Supabase, etc.)
- Database connection strings
- URLs
- Price IDs
- Any string that will be used in API calls or database queries

**Example:**

```typescript
// ❌ Wrong - using environment variable directly
const stripeKey = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_PRICE_ID_STANDARD_MONTHLY;

// Stripe API fails with "invalid_client" or "No such price"
await stripe.customers.create({ ... }); // Uses key with trailing \n
await stripe.checkout.sessions.create({
  line_items: [{ price: priceId }] // priceId has trailing \n
});

// ✅ Correct - trim and sanitize environment variables
function getStripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  // Trim whitespace and remove all whitespace characters (including newlines)
  const sanitized = key.trim().replace(/\s+/g, "");

  // Validate format
  if (!sanitized.match(/^sk_(test|live)_[a-zA-Z0-9]+$/)) {
    throw new Error(`Invalid STRIPE_SECRET_KEY format`);
  }

  return sanitized;
}

function getPriceId(plan: string, interval: string): string | null {
  const envVar = process.env[`STRIPE_PRICE_ID_${plan.toUpperCase()}_${interval.toUpperCase()}`];
  if (!envVar) return null;

  // Trim whitespace and newlines
  const cleaned = envVar.trim().replace(/\s+/g, "");
  return cleaned || null;
}

// Use sanitized values
const stripeKey = getStripeKey();
const priceId = getPriceId("standard", "month");
```

**Best Practice Pattern:**

```typescript
// Create a utility function for reading environment variables
function getEnvVar(key: string, required = false): string | null {
  const value = process.env[key];
  if (!value) {
    if (required) {
      throw new Error(`${key} is required but not set`);
    }
    return null;
  }
  // Always trim whitespace and newlines
  return value.trim().replace(/\s+/g, "");
}

// Use it everywhere
const stripeKey = getEnvVar("STRIPE_SECRET_KEY", true);
const priceId = getEnvVar("STRIPE_PRICE_ID_STANDARD_MONTHLY");
```

**Key Principles:**

1. **Always trim** environment variables before use
2. **Remove all whitespace** (spaces, tabs, newlines) with `.replace(/\s+/g, "")`
3. **Validate format** after sanitization (e.g., API key format, URL format)
4. **Log sanitized values** (first few characters only) for debugging
5. **Create utility functions** to centralize environment variable reading

**Common Issues:**

- Vercel environment variables can have trailing newlines when copied/pasted
- Environment files (`.env.local`) can have trailing spaces
- CI/CD platforms may add whitespace when setting variables
- Multi-line values can introduce hidden characters

**Validation:** Fixed in:

- `web/src/lib/billing/stripe.ts` - Stripe API key and price ID sanitization
- Prevents "invalid_client" errors from trailing newlines in API keys
- Prevents "No such price" errors from trailing newlines in price IDs

**When to Apply:**

- ✅ API keys (Stripe, Supabase, OAuth secrets)
- ✅ Database connection strings
- ✅ URLs (webhook URLs, redirect URIs)
- ✅ Price IDs, customer IDs, subscription IDs
- ✅ Any string used in external API calls
- ❌ Don't trim if whitespace is intentional (rare, but possible)

---

### Lesson: Always Trim Secrets When Comparing for Authentication

**Problem:** When comparing secrets for authentication (e.g., `CRON_SECRET`, `TEST_ENDPOINT_SECRET`), environment variables may contain trailing whitespace, newlines, or carriage returns. This causes authentication failures even when the secret is correct.

**Example Issue:**
- Secret stored in Vercel: `"my-secret-key\n"` (with trailing newline)
- Secret provided in request: `"my-secret-key"` (without newline)
- Comparison: `providedSecret !== testSecret` → `true` (fails even though secret is correct)

**Solution:** Always trim and normalize both the stored secret and the provided secret before comparison.

**Example:**

```typescript
// ❌ Wrong - direct comparison without trimming
const testSecret = process.env.TEST_ENDPOINT_SECRET || process.env.CRON_SECRET;
const providedSecret = authHeader?.replace("Bearer ", "") || 
                      new URL(request.url).searchParams.get("secret");

if (providedSecret !== testSecret) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
// Fails if testSecret has trailing newline: "secret\n" !== "secret"

// ✅ Correct - trim and normalize both values
const testSecret = (process.env.TEST_ENDPOINT_SECRET || process.env.CRON_SECRET)
  ?.trim()
  .replace(/\r?\n/g, ''); // Remove all newlines and carriage returns

const providedSecret = (authHeader?.replace("Bearer ", "") || 
                       new URL(request.url).searchParams.get("secret"))
  ?.trim();

if (providedSecret !== testSecret) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
// Works correctly: "secret" === "secret"
```

**Best Practice Pattern:**

```typescript
// Normalize secret from environment variable
function getSecret(): string | undefined {
  const secret = process.env.TEST_ENDPOINT_SECRET || process.env.CRON_SECRET;
  if (!secret) return undefined;
  // Trim whitespace and remove all newlines/carriage returns
  return secret.trim().replace(/\r?\n/g, '');
}

// Normalize provided secret
function normalizeProvidedSecret(
  authHeader: string | null,
  queryParam: string | null
): string | null {
  const secret = authHeader?.replace("Bearer ", "") || queryParam;
  if (!secret) return null;
  return secret.trim();
}

// Compare normalized values
const testSecret = getSecret();
const providedSecret = normalizeProvidedSecret(
  request.headers.get("authorization"),
  new URL(request.url).searchParams.get("secret")
);

if (!testSecret || providedSecret !== testSecret) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Key Principles:**

1. **Always trim** both the stored secret and provided secret
2. **Remove newlines and carriage returns** with `.replace(/\r?\n/g, '')`
3. **Normalize before comparison** - don't compare raw environment variables
4. **Apply consistently** - use the same normalization pattern across all auth checks
5. **Handle undefined/null** - check for existence before trimming

**Common Issues:**

- Vercel environment variables can have trailing newlines when copied/pasted
- Environment files (`.env.local`) can have trailing spaces or newlines
- CI/CD platforms may add whitespace when setting variables
- Multi-line secrets can introduce hidden characters

**Validation:** Fixed in:

- `web/src/app/api/test/send-payment-failure-email/route.ts` - Added secret trimming for auth comparison
- `web/src/app/api/test/send-win-back-email/route.ts` - Already had trimming (reference implementation)
- Prevents 401 Unauthorized errors when secrets are correct but have whitespace differences

**When to Apply:**

- ✅ Secret comparison in authentication middleware
- ✅ API key validation
- ✅ Webhook signature verification
- ✅ Cron job secret validation
- ✅ Test endpoint authentication
- ✅ Any string comparison where one value comes from environment variables

---

## Future Considerations

- Consider creating a shared types file for commonly used extended types (e.g., `StripeInvoiceWithSubscription`)
- Set up stricter TypeScript configuration to catch these issues earlier
- Add pre-commit hooks with husky and lint-staged
- Set up CI/CD type checking step before builds
- Document any third-party library type limitations in this file
- Regular type audits to catch duplicate definitions and inconsistencies
- Add timezone testing to CI/CD pipeline to catch date-related bugs
