# Test IDs & Branch Protection Guide

## 1. Test IDs: Should We Add More?

**Answer: Yes, but strategically.**

### Current Coverage ✅

- **Today Page**: `best-action-card`, `duration-selector`, `duration-{X}min`
- **Actions Page**: `set-time-estimate-{id}`
- **Settings Page**: `billing-section`
- **Paywall**: `paywall-overlay`, `upgrade-button`
- **Free Tier Banner**: `free-tier-banner`

### Just Added ✅

- **Settings → Calendar**:
  - `calendar-list` (container)
  - `calendar-item-{id}` (each calendar)
  - `disconnect-calendar-{id}` (disconnect button)
  - `connect-google-calendar` (connect button)
  - `connect-outlook-calendar` (connect button)
- **Relationships Page**:
  - `relationship-row-{id}` (each relationship)
  - `relationship-status-{id}` (status badge)
  - `relationship-filter-toggle` (filter container)
  - `filter-{all|active|snoozed|archived}` (filter buttons)

### Benefits of Test IDs

1. **Reliability**: Tests won't break when CSS classes change
2. **Maintainability**: Clear intent - "I'm testing the calendar list, not styling"
3. **Speed**: Faster test execution (no need to parse complex selectors)
4. **Debugging**: Easy to identify which element failed in test reports

### When to Add Test IDs

**Add test IDs for:**

- ✅ Interactive elements (buttons, links, inputs)
- ✅ Dynamic lists (rows, cards that repeat)
- ✅ Critical UI components (paywall, modals, forms)
- ✅ Elements that tests need to find reliably

**Don't add test IDs for:**

- ❌ Static text (use text content)
- ❌ Decorative elements
- ❌ Elements that won't be tested

### Recommendation

**Current coverage is good for critical paths.** We can add more as needed when writing specific E2E tests. The test IDs we've added cover:

- Billing/trial flows (NEX-9)
- Calendar management (NEX-14, NEX-17)
- Relationship management (NEX-5)

---

## 2. Branch Protection: Benefits Explained

### What Is Branch Protection?

GitHub branch protection rules enforce requirements before code can be merged into protected branches (like `main` or `staging`).

### Key Benefits

#### 1. **Prevents Broken Code from Reaching Production**

- **Without protection**: Developer merges PR → tests fail → broken code in production
- **With protection**: Tests must pass → merge blocked if tests fail → production stays healthy

#### 2. **Enforces Quality Gates**

- All required checks must pass (lint, type-check, tests)
- No force-push to protected branches
- Requires PR reviews (optional but recommended)

#### 3. **Reduces Production Bugs**

- Catches issues before they reach users
- Prevents "it works on my machine" problems
- Ensures consistent code quality across team

#### 4. **Team Confidence**

- Developers can merge with confidence
- No need to manually verify tests passed
- Clear feedback when something fails

#### 5. **Protects Critical Branches**

- `main` branch: Production code
- `staging` branch: Pre-production testing
- Prevents accidental direct commits

### How It Works

```
Developer creates PR
    ↓
GitHub runs CI checks (lint, tests, build)
    ↓
All checks pass?
    ├─ Yes → Merge allowed ✅
    └─ No → Merge blocked ❌
```

### Recommended Settings

For `staging` and `main` branches:

1. **Require status checks to pass before merging**

   - ✅ `lint-and-typecheck`
   - ✅ `unit-tests`
   - ✅ `integration-tests`
   - ✅ `e2e-tests` (optional - can be slower)
   - ✅ `build`

2. **Require branches to be up to date**

   - Ensures PR is based on latest code
   - Prevents merge conflicts

3. **Require pull request reviews** (optional)

   - At least 1 approval
   - Prevents self-merging

4. **Do not allow force pushes**

   - Prevents history rewriting
   - Maintains audit trail

5. **Do not allow deletions**
   - Prevents accidental branch deletion

### Setup Instructions

1. Go to GitHub repository → **Settings** → **Branches**
2. Click **Add rule** or edit existing rule
3. Branch name pattern: `staging` or `main`
4. Enable:
   - ✅ Require status checks to pass before merging
   - ✅ Select the checks from our CI workflow
   - ✅ Require branches to be up to date before merging
   - ✅ Do not allow force pushes
   - ✅ Do not allow deletions

### Example Configuration

```
Branch: staging
├─ Require status checks: ✅
│  ├─ lint-and-typecheck
│  ├─ unit-tests
│  ├─ integration-tests
│  └─ build
├─ Require up to date: ✅
├─ Require PR reviews: ⚠️ (optional)
├─ No force push: ✅
└─ No deletion: ✅
```

### Cost/Benefit Analysis

**Cost:**

- Slight delay in merging (wait for CI to finish)
- Can't merge if tests are flaky (but that's a good thing!)

**Benefit:**

- Prevents production bugs
- Saves debugging time
- Improves code quality
- Team confidence

### Recommendation

**Enable branch protection for `staging` and `main`** with:

- Required status checks (all test jobs)
- Require branches to be up to date
- No force push
- No deletion

This is a **high-value, low-risk** change that will prevent many future issues.

---

## Summary

1. **Test IDs**: ✅ Added for critical paths. Add more as needed when writing new E2E tests.
2. **Branch Protection**: ✅ **Highly recommended** - prevents broken code from reaching production.

Both are best practices that will save time and prevent bugs in the long run.
