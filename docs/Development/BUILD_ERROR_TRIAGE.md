# Build Error Triage: TypeScript Error Cascade Analysis

## Incident Summary

**Date:** 2025-01-27  
**Issue:** Multiple TypeScript build errors discovered during Vercel deployment after a series of commits  
**Impact:** Build failures requiring 8+ sequential fixes  
**Root Cause:** Multiple contributing factors (see below)

---

## Error Cascade Timeline

1. **Stripe Invoice.subscription type error** - TypeScript types don't include all API properties
2. **generateContentPrompts supabase parameter** - Next.js 15+ Promise return type
3. **ActionNoteModal props mismatch** - Wrong prop names (`onSaved` vs `onSave`, missing `isOpen`)
4. **SnoozeActionModal props mismatch** - Wrong prop name (`onSnoozed` vs `onSnooze`)
5. **Duplicate StaleAction type definitions** - Same type defined differently in two files
6. **person_pins array vs object** - Supabase returns array, type expects object
7. **Stripe API version mismatch** - TypeScript types expect newer API version
8. **Stripe client initialization** - Module-level initialization fails during build

---

## Root Causes

### 1. **Lack of Local Type Checking Before Push**

**Problem:** TypeScript errors were only discovered during Vercel builds, not locally.

**Why it happened:**
- No pre-commit hooks to run TypeScript checks
- Developers may have been running `npm run dev` which doesn't catch all type errors
- TypeScript errors in unused code paths may not be caught by dev server

**Impact:** Errors accumulate across multiple commits before discovery.

### 2. **Inconsistent Component Interface Usage**

**Problem:** Components were used with incorrect prop names/types without TypeScript catching it.

**Why it happened:**
- Copy-paste from similar components without checking interface
- Component interfaces changed but usages weren't updated
- No systematic review of component prop usage

**Examples:**
- `onSaved` vs `onSave` in ActionNoteModal
- `onSnoozed` vs `onSnooze` in SnoozeActionModal
- Missing `isOpen` prop in modal components

### 3. **Duplicate Type Definitions**

**Problem:** Same type (`StaleAction`) defined differently in multiple files.

**Why it happened:**
- No centralized type definitions for shared types
- Types created inline instead of importing from shared location
- No linting rule to prevent duplicate type names

### 4. **Third-Party Library Type Limitations**

**Problem:** Stripe TypeScript definitions don't match actual API structure.

**Why it happened:**
- Third-party type definitions may be incomplete
- API evolves faster than type definitions
- No validation that types match runtime behavior

### 5. **Build-Time vs Runtime Environment Differences**

**Problem:** Code that works at runtime fails during build.

**Why it happened:**
- Environment variables not available during build
- Module-level initialization runs during build
- No distinction between build-time and runtime code paths

---

## Mitigation Strategies

### 1. **Pre-Commit Type Checking**

**Action:** Add pre-commit hooks to run TypeScript checks before allowing commits.

**Implementation:**
```bash
# Install husky and lint-staged
npm install --save-dev husky lint-staged

# Add to package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "bash -c 'tsc --noEmit'"
    ]
  }
}
```

**Benefits:**
- Catches type errors before they reach CI/CD
- Prevents broken code from being committed
- Faster feedback loop

### 2. **CI/CD Type Checking**

**Action:** Add explicit TypeScript check step in CI/CD pipeline.

**Implementation:**
```yaml
# .github/workflows/ci.yml
- name: Type Check
  run: npm run type-check

# package.json
{
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

**Benefits:**
- Catches errors before deployment
- Provides clear error messages
- Prevents deployment of broken code

### 3. **Component Interface Documentation**

**Action:** Create a component interface registry or use TypeScript's JSDoc.

**Implementation:**
```typescript
/**
 * @component ActionNoteModal
 * @props {boolean} isOpen - Whether modal is visible
 * @props {() => void} onClose - Callback when modal closes
 * @props {string | null} actionId - ID of action to add note to
 * @props {string | null} existingNote - Existing note content
 * @props {(actionId: string, note: string) => Promise<void>} onSave - Callback when note is saved
 */
export function ActionNoteModal({ ... }: ActionNoteModalProps) {
  // ...
}
```

**Benefits:**
- Clear documentation of expected props
- IDE autocomplete shows prop descriptions
- Easier to verify correct usage

### 4. **Centralized Type Definitions**

**Action:** Create a shared types directory and enforce its use.

**Implementation:**
```
src/
  types/
    actions.ts      # Action, StaleAction, etc.
    billing.ts      # Stripe-related types
    calendar.ts     # Calendar types
    index.ts        # Re-exports
```

**Benefits:**
- Single source of truth for types
- Prevents duplicate definitions
- Easier to maintain and update

### 5. **Type Validation Utilities**

**Action:** Create runtime type validators for critical types.

**Implementation:**
```typescript
// types/validators.ts
import { z } from 'zod';

export const ActionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  // ... other fields
  person_pins: z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().nullable(),
    notes: z.string().nullable(),
  }).nullable(),
});

export function validateAction(data: unknown): Action {
  return ActionSchema.parse(data);
}
```

**Benefits:**
- Catches type mismatches at runtime
- Validates data from external sources (Supabase, APIs)
- Provides better error messages

### 6. **Lazy Initialization Pattern**

**Action:** Use lazy initialization for modules that depend on environment variables.

**Implementation:**
```typescript
// ✅ Good - Lazy initialization
let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {...});
  }
  return stripeInstance;
}

// ❌ Bad - Module-level initialization
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {...});
```

**Benefits:**
- Allows module to be imported during build
- Error only occurs when actually used
- Works with environment variables that aren't available at build time

### 7. **Type-Safe Component Props**

**Action:** Use TypeScript's strict mode and ensure all component props are properly typed.

**Implementation:**
```typescript
// Use satisfies operator for prop validation
const props = {
  isOpen: true,
  onClose: () => {},
  // ...
} satisfies ActionNoteModalProps;
```

**Benefits:**
- Catches prop mismatches at compile time
- Ensures all required props are provided
- Prevents typos in prop names

### 8. **Regular Type Audits**

**Action:** Schedule periodic reviews of type definitions and their usage.

**Checklist:**
- [ ] All shared types are in centralized location
- [ ] No duplicate type definitions
- [ ] Component interfaces match their usage
- [ ] Third-party types are up to date
- [ ] Environment variable dependencies are lazy-loaded

---

## Immediate Actions

### High Priority

1. **Add pre-commit TypeScript check**
   - Install husky and lint-staged
   - Configure to run `tsc --noEmit` on staged files
   - Test with a sample commit

2. **Add CI/CD type check step**
   - Add `npm run type-check` to GitHub Actions
   - Ensure it runs before build step
   - Fail build if type check fails

3. **Create centralized types directory**
   - Move all shared types to `src/types/`
   - Update imports across codebase
   - Add linting rule to prevent duplicate type names

### Medium Priority

4. **Document component interfaces**
   - Add JSDoc comments to all component props
   - Create component interface reference document
   - Review and update as needed

5. **Add runtime type validation**
   - Install zod or similar
   - Create validators for critical types
   - Use in API routes and data fetching

6. **Review and fix lazy initialization**
   - Audit all module-level initializations
   - Convert to lazy initialization where needed
   - Test build process

### Low Priority

7. **Set up type coverage reporting**
   - Install type-coverage tool
   - Track type coverage over time
   - Aim for >90% coverage

8. **Create type testing utilities**
   - Helper functions to validate types
   - Unit tests for type transformations
   - Integration tests for type safety

---

## Lessons Learned

1. **Type errors compound quickly** - One error can mask others, making debugging harder
2. **Local testing isn't enough** - Must run full type check before pushing
3. **Component interfaces need documentation** - Easy to use wrong props without clear docs
4. **Third-party types aren't perfect** - May need workarounds or extensions
5. **Build-time vs runtime matters** - Code that works locally may fail in CI/CD
6. **Centralized types prevent duplication** - Single source of truth is critical
7. **Lazy initialization is essential** - For code that depends on environment variables

---

## Prevention Checklist

Before pushing code, verify:

- [ ] `npm run type-check` passes locally
- [ ] All component props match their interfaces
- [ ] No duplicate type definitions
- [ ] Environment variable dependencies are lazy-loaded
- [ ] Third-party type issues are documented
- [ ] All imports use centralized type definitions
- [ ] Build process works locally (`npm run build`)

---

## References

- [Coding Lessons Learned](./CODING_LESSONS_LEARNED.md) - Detailed solutions to specific issues
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Next.js TypeScript Guide](https://nextjs.org/docs/app/building-your-application/configuring/typescript)
















