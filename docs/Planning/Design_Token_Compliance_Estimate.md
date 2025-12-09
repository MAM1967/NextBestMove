# Design Token Compliance - Time Estimate

**Date:** December 9, 2025  
**Status:** ⚠️ Not Started  
**Priority:** Low (Post-Launch)

---

## Current Status

**Total Warnings:** 498  
**Informational Warnings:** ~450 (about missing shadow/font-weight tokens - expected, don't need fixing)  
**Actual Violations:** ~48 (hardcoded values that need to be replaced)

---

## Violation Breakdown

### 1. Border Radius Violations (~15 violations)
**Found in:**
- `src/app/app/page.tsx` - `border-radius: 100`, `border-radius: 0`
- `src/app/onboarding/OnboardingFlow.tsx` - `border-radius: 1`, `border-radius: 100`
- `src/app/app/plan/page.tsx` - `border-radius: 0`, `border-radius: 100`
- `src/app/app/settings/AccountOverviewSection.tsx` - `border-radius: 0.5`, `border-radius: 1` (multiple instances)

**Values Found:**
- `100` (likely `rounded-full` → should use `radius.full`)
- `0` (likely `rounded-none` → should use `radius.sm` or add `radius.none` token)
- `1` (likely `rounded` → should use `radius.base`)
- `0.5` (likely `rounded-sm` → should use `radius.sm`)

**Fix:** Replace Tailwind classes with design token references

---

### 2. Color Violations (~25 violations)
**Found in:**
- `src/app/app/actions/ActionCard.tsx` - Multiple colors:
  - `#16a34a` (green-600) → should use `success-green` or add darker green token
  - `white` → should use `white` token (already exists, just needs reference)
  - `#15803d` (green-700) → should use `success-green-hover` or add token
  - `rgba(0,0,0,0.1)` → should use shadow token or add opacity utility
- `src/app/app/actions/PriorityIndicator.tsx`:
  - `#0000CD` (medium blue) → should use `primary-blue` or add token
- `src/app/app/plan/page.tsx`:
  - `#9333ea` (purple-600) → should use `fast-win-accent` or add token
- `src/app/app/settings/PlanSelectionModal.tsx`:
  - `#9333ea` (purple-600) → should use `fast-win-accent`
  - `#7e22ce` (purple-700) → should add hover variant or use existing

**Values Found:**
- `#16a34a` - Darker green (not in tokens)
- `white` - Already in tokens, just needs proper reference
- `#15803d` - Darker green hover (not in tokens)
- `rgba(0,0,0,0.1)` - Shadow/overlay color
- `#0000CD` - Medium blue (not in tokens)
- `#9333ea` - Purple (close to `fast-win-accent` #8B5CF6)
- `#7e22ce` - Darker purple (not in tokens)

**Fix:** 
- Replace hardcoded colors with token references
- Add missing color tokens if needed (e.g., darker green variants, medium blue)

---

### 3. Spacing Violations (~8 violations)
**Found in:**
- `src/app/onboarding/OnboardingFlow.tsx` - `spacing: 1`
- `src/app/app/settings/AccountOverviewSection.tsx` - `spacing: 0.5`, `spacing: 1` (multiple instances)

**Values Found:**
- `1` (likely `1rem` = 16px) → should use `spacing.base`
- `0.5` (likely `0.5rem` = 8px) → should use `spacing.sm`

**Fix:** Replace Tailwind spacing classes with design token references

---

## Time Estimate

### Phase 1: Analysis & Planning (1-2 hours)
- [ ] Review all violations in detail
- [ ] Identify missing tokens that need to be added
- [ ] Create mapping of hardcoded values → tokens
- [ ] Prioritize violations by impact/visibility

**Estimated Time:** 1-2 hours

---

### Phase 2: Add Missing Tokens (1-2 hours)
**Missing tokens to add:**
- `radius.none` (0px) - for `border-radius: 0`
- Color variants:
  - `success-green-dark` (#16a34a or #15803d)
  - `primary-blue-medium` (#0000CD) - or decide if `primary-blue` is sufficient
  - `fast-win-accent-hover` (#7e22ce) - darker purple variant
- Shadow/overlay utilities:
  - Consider adding `overlay-light` token for `rgba(0,0,0,0.1)`

**Estimated Time:** 1-2 hours

---

### Phase 3: Fix Violations (4-6 hours)
**Per violation type:**

1. **Border Radius** (~15 violations)
   - Find/replace Tailwind classes with token references
   - Update ~5-6 files
   - **Time:** 1-1.5 hours

2. **Colors** (~25 violations)
   - Replace hardcoded hex colors with token references
   - Update ~5-6 files
   - May need to verify visual consistency
   - **Time:** 2-3 hours

3. **Spacing** (~8 violations)
   - Replace Tailwind spacing with token references
   - Update ~2 files
   - **Time:** 0.5-1 hour

**Total Fix Time:** 3.5-5.5 hours

---

### Phase 4: Testing & Verification (1-2 hours)
- [ ] Visual regression testing (ensure no visual changes)
- [ ] Run design lint to verify violations are fixed
- [ ] Test affected pages/components
- [ ] Verify design consistency

**Estimated Time:** 1-2 hours

---

## Total Time Estimate

| Phase | Time Estimate |
|-------|---------------|
| Analysis & Planning | 1-2 hours |
| Add Missing Tokens | 1-2 hours |
| Fix Violations | 3.5-5.5 hours |
| Testing & Verification | 1-2 hours |
| **Total** | **6.5-11.5 hours** |

**Recommended Approach:** 
- **Conservative:** 10-12 hours (1.5-2 days)
- **Optimistic:** 6-8 hours (1 day)
- **Realistic:** 8-10 hours (1-1.5 days)

---

## Approach Options

### Option 1: Incremental (Recommended)
**Fix violations incrementally by component/page:**
- Week 1: Fix ActionCard and PriorityIndicator (high visibility)
- Week 2: Fix settings pages
- Week 3: Fix onboarding flow
- Week 4: Fix remaining pages

**Pros:**
- Lower risk (can test incrementally)
- Can prioritize high-visibility components first
- Easier to review changes

**Cons:**
- Takes longer overall
- Design lint warnings remain during process

**Time:** Spread over 2-4 weeks, 2-3 hours per week

---

### Option 2: Bulk Fix (Faster)
**Fix all violations in one pass:**
- Add all missing tokens first
- Fix all violations in one session
- Test everything at once

**Pros:**
- Faster overall
- Clean slate (no lingering warnings)
- Complete compliance

**Cons:**
- Higher risk (more changes at once)
- Harder to review
- More testing needed

**Time:** 8-10 hours in one focused session

---

### Option 3: Critical Path Only
**Fix only high-visibility violations:**
- Fix ActionCard colors (most visible)
- Fix PriorityIndicator colors
- Defer spacing/border-radius violations

**Pros:**
- Fastest (2-3 hours)
- Addresses most visible issues
- Low risk

**Cons:**
- Doesn't achieve full compliance
- Warnings remain

**Time:** 2-3 hours

---

## Recommendations

### For Launch
**Recommendation:** **Defer to post-launch** (Option 3 if needed)

**Rationale:**
- Violations are mostly cosmetic (colors/spacing)
- No functional impact
- Design lint warnings don't block launch
- Can be fixed incrementally post-launch

### Post-Launch Priority
**Recommendation:** **Option 1 (Incremental)** - Fix over 2-4 weeks

**Rationale:**
- Lower risk than bulk fix
- Can prioritize by user visibility
- Easier to review and test
- Maintains design consistency over time

---

## Missing Tokens to Add

### High Priority (Needed for violations)
1. `radius.none` - `0px` (for `border-radius: 0`)
2. `success-green-dark` - `#16a34a` or `#15803d` (darker green variant)
3. `fast-win-accent-hover` - `#7e22ce` (darker purple for hover states)

### Medium Priority (Nice to have)
4. `primary-blue-medium` - `#0000CD` (or decide if existing `primary-blue` is sufficient)
5. `overlay-light` - `rgba(0, 0, 0, 0.1)` (for shadows/overlays)

### Low Priority (Can use existing)
- `white` - Already exists, just needs proper reference
- `fast-win-accent` - Already exists (#8B5CF6), close to #9333ea

---

## Files to Update

### High Priority (User-Facing)
1. `src/app/app/actions/ActionCard.tsx` - Multiple color violations
2. `src/app/app/actions/PriorityIndicator.tsx` - Color violations
3. `src/app/app/plan/page.tsx` - Border radius and color violations
4. `src/app/app/settings/AccountOverviewSection.tsx` - Multiple violations

### Medium Priority
5. `src/app/onboarding/OnboardingFlow.tsx` - Border radius and spacing violations
6. `src/app/app/settings/PlanSelectionModal.tsx` - Color violations
7. `src/app/app/page.tsx` - Border radius violations

---

## Next Steps

1. **Decide on approach** (incremental vs bulk vs critical path only)
2. **Add missing tokens** to `web/design.tokens.json`
3. **Update design lint config** if needed
4. **Fix violations** file by file
5. **Test and verify** no visual regressions
6. **Run design lint** to confirm compliance

---

**Last Updated:** December 9, 2025  
**Estimated Completion:** 8-10 hours (1-1.5 days) for full compliance

