# Implementation Checklist for Backlog Items

**Purpose:** Standard checklist to follow when implementing any backlog item to ensure quality, security, and maintainability.

**Last Updated:** December 28, 2025

---

## Pre-Implementation

- [ ] Read `nextbestmove_cursor_guide.md` for project context
- [ ] Read `docs/backlog.md` to understand current priorities
- [ ] Fetch and review the Linear issue (use Linear MCP tools)
- [ ] Review relevant PRD sections from `docs/PRD/NextBestMove_PRD_v1.md`
- [ ] Review relevant architecture docs if applicable

---

## Implementation Phase

### Product/Spec Agent

- [ ] Clarify acceptance criteria if ambiguous
- [ ] Update PRD or architecture docs if behavior changes meaningfully
- [ ] Add comment to Linear issue summarizing clarifications

### Backend Agent

- [ ] Design database schema changes (if needed)
- [ ] Create migrations in `supabase/migrations/`
- [ ] Implement API routes in `web/src/app/api/`
- [ ] Implement business logic in `web/src/lib/`
- [ ] Update Row Level Security (RLS) policies if schema changes
- [ ] **Add unit tests (Vitest)** in `web/tests/unit/` for new business logic
- [ ] **Add integration tests** in `web/tests/integration/` for new API endpoints
- [ ] **Update security tests** if new endpoints or authentication logic added
- [ ] Add comment to Linear issue summarizing implementation

### UI/Integration Agent

- [ ] Wire backend APIs into Next.js pages and components
- [ ] Ensure UX matches language refactor (Today, Relationships, Daily Plan, Weekly Review, Signals, Insights)
- [ ] Add React Query hooks for data fetching
- [ ] Implement server actions where needed (`web/src/app/actions/`)
- [ ] **Add unit tests (Vitest)** in `web/tests/unit/` for new React components/utilities
- [ ] **Add E2E tests (Playwright)** in `web/tests/critical-paths/` or `web/tests/e2e/` for new user flows
- [ ] **Update security tests** if new user-facing features added
- [ ] Add comment to Linear issue summarizing implementation

---

## Post-Implementation

### Testing

- [ ] **Unit tests pass:** Run `npm run test:unit` in `web/` directory
- [ ] **Integration tests pass:** Run `npm run test:integration` in `web/` directory
- [ ] **E2E tests pass:** Run `npm run test:staging` in `web/` directory (if applicable)
- [ ] **Security tests pass:** CI security scans (SAST, dependency scanning) pass
- [ ] **Type check passes:** Run `npm run type-check` in `web/` directory
- [ ] **Design lint passes:** Run `npm run lint:design` in `web/` directory

### CI/CD

- [ ] **Update CI scripts:** Ensure new tests are included in `.github/workflows/ci.yml`
  - Add new test commands to appropriate jobs (unit-tests, integration-tests, e2e-tests)
  - Ensure test files are discovered by test runners
- [ ] **Verify CI passes:** Check that GitHub Actions workflow runs successfully
- [ ] **Update test documentation:** Document new test files in `web/tests/README.md` if applicable

### Security

- [ ] **Security tests updated:** If new endpoints added, ensure:
  - Authentication/authorization is tested
  - Input validation is tested
  - SQL injection prevention is verified
  - RLS policies are tested
- [ ] **Security scans pass:** Semgrep SAST and npm audit pass in CI
- [ ] **No secrets exposed:** Verify no API keys, tokens, or secrets in code

### Documentation

- [ ] **Update backlog:** Mark item as complete in `docs/backlog.md` with ✅ and Linear issue ID
- [ ] **Update Linear:** Move issue to "Done" status
- [ ] **Add Linear comment:** Summarize what was implemented, including test coverage
- [ ] **Update API docs:** If new endpoints added, update `docs/Architecture/API_Documentation.md`
- [ ] **Update component specs:** If new components added, update `docs/Architecture/Component_Specifications.md`

---

## Test File Locations

### Unit Tests (Vitest)

- **Location:** `web/tests/unit/`
- **Pattern:** `*.test.ts` or `*.test.tsx`
- **Examples:**
  - `web/tests/unit/billing/idempotency.test.ts`
  - `web/tests/unit/decision-engine/scoring.test.ts`
- **Run:** `npm run test:unit` in `web/` directory

### Integration Tests (Vitest)

- **Location:** `web/tests/integration/`
- **Pattern:** `*.test.ts`
- **Examples:**
  - `web/tests/integration/api/billing-idempotency.test.ts`
- **Run:** `npm run test:integration` in `web/` directory

### E2E Tests (Playwright)

- **Location:** `web/tests/critical-paths/` or `web/tests/e2e/`
- **Pattern:** `*.spec.ts`
- **Examples:**
  - `web/tests/critical-paths/01-onboarding-first-action.spec.ts`
  - `web/tests/e2e/nex-9-reverse-trial-paywall.spec.ts`
- **Run:** `npm run test:staging` in `web/` directory

---

## CI Workflow Structure

The CI workflow (`.github/workflows/ci.yml`) includes:

1. **lint-and-typecheck:** ESLint, design lint, TypeScript type check
2. **unit-tests:** Runs `npm run test:unit`
3. **integration-tests:** Runs `npm run test:integration`
4. **e2e-tests:** Runs `npm run test:staging` (Playwright)
5. **build:** Builds the Next.js application
6. **security-deps:** Runs `npm audit` for dependency scanning
7. **security-sast:** Runs Semgrep for static analysis

**When adding new tests:**
- Unit tests are automatically discovered by Vitest (pattern: `**/*.{test,spec}.{ts,tsx}`)
- Integration tests are automatically discovered by Vitest
- E2E tests are automatically discovered by Playwright (pattern: `*.spec.ts`)
- No changes needed to CI workflow unless adding new test commands or environments

---

## Security Test Guidelines

### For New API Endpoints

1. **Authentication:** Test that unauthenticated requests are rejected (401)
2. **Authorization:** Test that users can only access their own data (RLS)
3. **Input Validation:** Test that invalid inputs are rejected (400)
4. **SQL Injection:** Test with SQL-like strings in inputs
5. **Rate Limiting:** Test that rate limits are enforced (if applicable)

### For New User-Facing Features

1. **XSS Prevention:** Test that user inputs are properly sanitized
2. **CSRF Protection:** Verify CSRF tokens are used (if applicable)
3. **Session Management:** Test that sessions expire correctly
4. **Data Privacy:** Verify user data is not exposed to other users

---

## Example: Adding Tests for a New API Endpoint

### 1. Create Unit Test

```typescript
// web/tests/unit/actions/create-action.test.ts
import { describe, it, expect } from 'vitest';
import { createAction } from '@/lib/actions/create-action';

describe('createAction', () => {
  it('should create action with valid input', () => {
    // Test implementation
  });
});
```

### 2. Create Integration Test

```typescript
// web/tests/integration/api/actions.test.ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@/lib/supabase/server';

describe('POST /api/actions', () => {
  it('should create action for authenticated user', async () => {
    // Test implementation
  });
});
```

### 3. Create E2E Test (if user-facing)

```typescript
// web/tests/e2e/actions/create-action.spec.ts
import { test, expect } from '@playwright/test';

test('user can create action from UI', async ({ page }) => {
  // Test implementation
});
```

### 4. Update CI (if needed)

The CI workflow automatically discovers tests, but if you add new test commands, update `.github/workflows/ci.yml`:

```yaml
- name: Run new test suite
  run: npm run test:new-suite
```

---

## Checklist Summary

**Before marking an issue as Done:**

- [ ] All code implemented and tested
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing (if applicable)
- [ ] Security tests updated and passing
- [ ] CI workflow passes all checks
- [ ] Type check passes
- [ ] Design lint passes
- [ ] Backlog updated with ✅
- [ ] Linear issue moved to "Done"
- [ ] Linear issue has summary comment

---

**Reference Documents:**

- `docs/Planning/Agent_Role_Prompts.md` - Agent role prompts
- `docs/Planning/Agent_Workflow.md` - Agent workflow process
- `.github/workflows/ci.yml` - CI workflow configuration
- `web/vitest.config.ts` - Vitest configuration
- `web/playwright.config.ts` - Playwright configuration
- `web/tests/README.md` - Test documentation

