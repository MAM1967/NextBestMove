# Coding Lessons Learned

This document captures coding lessons, best practices, and solutions to common problems encountered during development. Use this for code reviews and to prevent similar issues in the future.

## Table of Contents
- [TypeScript Type Safety](#typescript-type-safety)
- [Next.js 15+ API Changes](#nextjs-15-api-changes)
- [Stripe TypeScript Types](#stripe-typescript-types)
- [React Component Props](#react-component-props)
- [Supabase Client Types](#supabase-client-types)
- [Avoid Duplicate Type Definitions](#avoid-duplicate-type-definitions)

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
  supabase: ReturnType<typeof createClient>  // This is Promise<SupabaseClient>
) {
  // Type error!
}

// ✅ Correct - using Awaited to get resolved type
async function myFunction(
  supabase: Awaited<ReturnType<typeof createClient>>  // This is SupabaseClient
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
  const cookies = cookies();  // Not a Promise in Next.js 14
  const token = cookies.get('token');
}

// ✅ Correct - Next.js 15+ style
export async function GET(request: Request) {
  const cookieStore = await cookies();  // Must await
  const token = cookieStore.get('token');
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
  const subscriptionId = invoice.subscription;  // Type error!
}

// ✅ Correct - Use intersection type to extend
async function handleInvoicePaid(
  invoice: Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
) {
  if (!invoice.subscription) return;
  const subscriptionId = typeof invoice.subscription === 'string' 
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
if (subscription && typeof subscription.current_period_end === 'number') {
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
{snoozeActionId && (
  <SnoozeActionModal
    actionId={snoozeActionId}
    onClose={() => setSnoozeActionId(null)}
    onSnooze={handleSnooze}
  />
)}

// ✅ Correct - include all required props
<SnoozeActionModal
  isOpen={snoozeActionId !== null}
  actionId={snoozeActionId}
  onClose={() => setSnoozeActionId(null)}
  onSnooze={handleSnooze}
/>
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

## Future Considerations

- Consider creating a shared types file for commonly used extended types (e.g., `StripeInvoiceWithSubscription`)
- Set up stricter TypeScript configuration to catch these issues earlier
- Add pre-commit hooks with husky and lint-staged
- Set up CI/CD type checking step before builds
- Document any third-party library type limitations in this file
- Regular type audits to catch duplicate definitions and inconsistencies

