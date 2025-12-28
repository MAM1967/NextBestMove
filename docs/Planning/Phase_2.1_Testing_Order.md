# Phase 2.1: Recommended Testing Order

## Overview

This document outlines the recommended order for QA testing based on:
- **Risk/Impact** - Test high-risk items first
- **Dependencies** - Can't test responsive if functional doesn't work
- **Efficiency** - Test once, verify everywhere
- **Launch Readiness** - Focus on what blocks launch

---

## Recommended Order

### 1. Functional Testing (Primary Browser) - **START HERE**

**Why First:**
- Foundation for all other testing
- If core features don't work, no point testing elsewhere
- Fix critical bugs before investing time in cross-browser/responsive

**Approach:**
- Test on **Chrome Desktop** (your primary browser)
- Test all functional flows systematically
- Document bugs as you find them
- Fix critical bugs before moving on

**What to Test:**
1. Lead management (add, edit, snooze, archive, delete)
2. Action management (mark done, add notes, snooze)
3. Daily plan (view, generate, Fast Win)
4. Weekly summary (view, content prompts)
5. Settings (timezone, email prefs, calendar, export, delete account)
6. Billing (upgrade, downgrade, cancel, customer portal)

**Time:** 2-3 hours

---

### 2. Security Testing - **DO IN PARALLEL**

**Why Early:**
- Security issues are high-risk and need immediate fixes
- Can be tested alongside functional testing
- Critical for launch readiness

**Approach:**
- Test authentication/authorization as you test functional flows
- Test API route security
- Test input validation (SQL injection, XSS)
- Test environment variable security

**What to Test:**
- Unauthenticated access prevention
- User data isolation (RLS)
- API route authentication
- Input sanitization
- SQL injection prevention
- XSS prevention
- No secrets in client code

**Time:** 1-2 hours (can overlap with functional testing)

---

### 3. Cross-Browser Testing - **AFTER FUNCTIONAL WORKS**

**Why After Functional:**
- Once you know features work, verify they work everywhere
- Many issues are browser-specific
- Fix browser bugs before testing responsive (overlaps)

**Approach:**
- Test same functional flows on each browser
- Start with Chrome (baseline), then Safari, Firefox, Edge
- Mobile browsers last (often similar issues)

**Order:**
1. Chrome Desktop (already tested in step 1)
2. Safari Desktop
3. Firefox Desktop
4. Edge Desktop
5. Mobile Safari (iOS)
6. Chrome Mobile (Android)

**What to Test:**
- Sign up/sign in
- Daily plan view
- Action completion
- Billing checkout
- Settings page
- Any features that broke in functional testing

**Time:** 2-3 hours

---

### 4. Responsive Design Testing - **AFTER CROSS-BROWSER**

**Why After Cross-Browser:**
- Similar to cross-browser but for screen sizes
- Many issues overlap
- Test systematically across breakpoints

**Approach:**
- Test same functional flows on different screen sizes
- Use browser DevTools responsive mode
- Test actual devices when possible

**Order:**
1. Desktop (1920x1080, 1440x900)
2. Tablet (iPad - 768x1024, iPad Pro - 1024x1366)
3. Mobile (iPhone - 390x844, Android - 360x640)

**What to Test:**
- Navigation menu
- Forms (sign up, add lead, etc.)
- Action cards
- Daily plan layout
- Settings page
- Modals/dialogs

**Time:** 1-2 hours

---

### 5. Performance Testing - **DO LAST**

**Why Last:**
- Measure after everything works
- Performance issues are usually optimization, not blockers
- Can be done in parallel with other testing

**Approach:**
- Use browser DevTools (Lighthouse, Performance tab)
- Measure page load times
- Measure API response times
- Check bundle sizes

**What to Test:**
- Page load times (< 3 seconds)
- API response times (< 500ms)
- Database query performance
- Bundle size analysis
- Image optimization

**Time:** 1 hour

---

## Efficient Testing Strategy

### Option A: Sequential (Recommended for Solo Testing)
1. Functional (Chrome) → Fix bugs
2. Security → Fix bugs
3. Cross-browser → Fix bugs
4. Responsive → Fix bugs
5. Performance → Optimize

**Pros:** Focused, thorough, catch issues early  
**Cons:** Takes longer

### Option B: Parallel (Faster, but riskier)
- Test functional on Chrome
- Test security in parallel
- Test cross-browser while fixing functional bugs
- Test responsive while fixing cross-browser bugs
- Measure performance throughout

**Pros:** Faster, efficient  
**Cons:** Can miss dependencies, harder to track

---

## Critical Path Focus

Based on the "Refined Critique" focus areas:

### Priority 1: Core Flows (Already Tested ✅)
- Onboarding → First Action
- Daily Habit Loop
- Billing (Trial → Paid)
- Weekly Summary

### Priority 2: Data Safety
- User data isolation (RLS)
- API route security
- Input validation
- **Test during functional + security phases**

### Priority 3: Billing Correctness
- Plan upgrades/downgrades
- Subscription management
- Payment failure handling
- **Test during functional phase**

### Priority 4: Observability
- Error logging
- Performance monitoring
- **Test during performance phase**

---

## Time Estimates

- **Functional Testing:** 2-3 hours
- **Security Testing:** 1-2 hours (parallel)
- **Cross-Browser Testing:** 2-3 hours
- **Responsive Testing:** 1-2 hours
- **Performance Testing:** 1 hour

**Total:** 7-11 hours (can be done in 1-2 days)

---

## Quick Start

**Today:**
1. Start with functional testing on Chrome (2-3 hours)
2. Do security checks as you go (1-2 hours)
3. Fix critical bugs found

**Tomorrow:**
4. Cross-browser testing (2-3 hours)
5. Responsive testing (1-2 hours)
6. Performance testing (1 hour)
7. Fix remaining bugs

---

## Notes

- **Don't skip steps** - Each builds on the previous
- **Fix bugs as you find them** - Don't accumulate a huge list
- **Document everything** - Use the bug tracking template
- **Test on staging** - Never test on production
- **Focus on critical paths** - Don't get lost in edge cases










