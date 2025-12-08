# Launch Hardening - Manual Testing Guide

**Last Updated:** December 8, 2025  
**Status:** 🚧 In Progress  
**Test Environment:** Production (`nextbestmove.app`) or Staging (`staging.nextbestmove.app`)

---

## Overview

This guide walks you through manual testing for launch hardening. Revenue critical paths were already tested with Playwright E2E tests. This covers the remaining areas that need manual verification.

**How to Use:**
1. Test each section in order
2. Check off items as you complete them
3. Note any bugs/issues you find
4. Report back when you complete each major section

---

## Pre-Testing Setup

### Test Accounts Needed

- [ ] **Premium Test Account** - Active Premium subscription
- [ ] **Standard Test Account** - Active Standard subscription  
- [ ] **Trial Test Account** - Currently in 14-day trial
- [ ] **Production Test Account** - Your real account (`mcddsl@icloud.com`)

### Test Environment

- [ ] Confirm you're testing on: `nextbestmove.app` (production) OR `staging.nextbestmove.app` (staging)
- [ ] Browser: Chrome (primary testing browser)
- [ ] Clear browser cache/cookies if needed

---

## Area 1: Additional Critical Flows

**Estimated Time:** 45-60 minutes  
**Priority:** High - These are core features users rely on daily

### 1.1 Lead Management Testing

**Goal:** Verify all lead CRUD operations work correctly

#### Test 1.1.1: Add New Lead
1. Navigate to `/app/leads`
2. Click "Add Lead" button (or similar CTA)
3. Fill in form:
   - Name: `Test Lead ${Date.now()}`
   - URL: `https://linkedin.com/in/test-lead`
   - Notes: `Test notes for manual testing`
4. Click Save/Submit
5. Verify:
   - [ ] Lead appears in the list
   - [ ] Name, URL, and notes display correctly
   - [ ] Status is "ACTIVE"
   - [ ] Success message shown (if applicable)

#### Test 1.1.2: Add Lead with Email
1. Click "Add Lead"
2. Fill in:
   - Name: `Email Lead Test`
   - URL/Email: `test@example.com` (without mailto:)
3. Click Save
4. Verify:
   - [ ] Email automatically converted to `mailto:test@example.com`
   - [ ] Lead saved successfully

#### Test 1.1.3: Edit Existing Lead
1. Find a lead you created
2. Click Edit (pencil icon or edit button)
3. Change:
   - Name: Update to "Edited Lead Name"
   - URL: Change to different URL
   - Notes: Update notes
4. Click Save
5. Verify:
   - [ ] Changes are saved
   - [ ] Updated values display in list
   - [ ] No errors shown

#### Test 1.1.4: Snooze Lead
1. Find an ACTIVE lead
2. Click Snooze (or status dropdown)
3. Set snooze date (e.g., 7 days from today)
4. Click Confirm/Save
5. Verify:
   - [ ] Lead status changes to "SNOOZED"
   - [ ] Lead disappears from ACTIVE view
   - [ ] Lead appears in SNOOZED filter view

#### Test 1.1.5: Archive Lead
1. Find an ACTIVE or SNOOZED lead
2. Click Archive
3. Confirm if prompted
4. Verify:
   - [ ] Lead status changes to "ARCHIVED"
   - [ ] Lead disappears from ACTIVE/SNOOZED views
   - [ ] Lead appears in ARCHIVED filter view

#### Test 1.1.6: Restore Archived Lead
1. Filter leads to show "ARCHIVED"
2. Find an archived lead
3. Click Restore (or change status to ACTIVE)
4. Verify:
   - [ ] Lead status changes to "ACTIVE"
   - [ ] Lead appears in ACTIVE view
   - [ ] Lead removed from ARCHIVED view

**Note:** Archive serves as the "delete" functionality for users. Archived leads are permanently removed from active use but retained for analytics/history purposes (per PRD Section 9.1: "ARCHIVED — no further use; used only for history/analytics"). There is no hard delete button in the UI - Archive is the correct pattern for v0.1.

#### Test 1.1.7: Filter Leads
1. Ensure you have leads in different statuses (at least 1 ACTIVE, 1 SNOOZED, 1 ARCHIVED)
2. Test each filter:
   - [ ] "All" - Shows all leads
   - [ ] "Active" - Shows only ACTIVE leads
   - [ ] "Snoozed" - Shows only SNOOZED leads
   - [ ] "Archived" - Shows only ARCHIVED leads
3. Verify:
   - [ ] Correct leads shown for each filter
   - [ ] Counts are accurate (if shown)
   - [ ] No leads appear in wrong status filter

**Report Back:** ✅ Lead Management Testing Complete - [Any issues found: _____]

---

### 1.2 Action Management Testing

**Goal:** Verify action state changes and interactions work correctly

#### Test 1.2.1: View Action Details
1. Navigate to `/app/actions`
2. Click on an action card (or "View Details")
3. Verify:
   - [ ] Action details modal/page opens
   - [ ] Shows: description, lead name (if linked), due date, state, notes
   - [ ] All information is accurate

#### Test 1.2.2: Mark Action as "Done"
1. On `/app/actions`, find an action in "NEW" state
2. Click "Done" button
3. Verify:
   - [ ] Action state changes to "DONE"
   - [ ] Action shows completed badge/indicator
   - [ ] Completed timestamp recorded (if visible)
   - [ ] Action stays visible (not hidden)

#### Test 1.2.3: Mark Action as "Got Reply"
1. Find an action in "NEW" or "SENT" state
2. Click "Got Reply" button
3. Verify:
   - [ ] Follow-up flow modal opens (if applicable)
   - [ ] Can schedule follow-up or mark complete
   - [ ] Action state changes appropriately
   - [ ] If scheduling: Follow-up date saved correctly

#### Test 1.2.4: Snooze Action
1. Find an action
2. Click "Snooze"
3. Select a future date (e.g., tomorrow or next week)
4. Confirm
5. Verify:
   - [ ] Action state changes to "SNOOZED"
   - [ ] Snooze date saved
   - [ ] Action disappears from current view
   - [ ] Action appears in snoozed view (if available)

#### Test 1.2.5: Add Note to Action
1. Find an action
2. Click "Add Note" or "Notes"
3. Enter note: `Manual test note - ${new Date().toISOString()}`
4. Save
5. Verify:
   - [ ] Note is saved
   - [ ] Note displays in action details
   - [ ] Note persists after page refresh

#### Test 1.2.6: Action State Transitions
Test all valid state transitions:
- [ ] NEW → DONE (via "Done" button)
- [ ] NEW → SENT (if applicable)
- [ ] NEW → REPLIED (via "Got Reply")
- [ ] NEW → SNOOZED (via "Snooze")
- [ ] SENT → REPLIED
- [ ] REPLIED → DONE
- [ ] Verify invalid transitions are blocked (e.g., DONE → NEW)

**Report Back:** ✅ Action Management Testing Complete - [Any issues found: _____]

---

### 1.3 Daily Plan Testing

**Goal:** Verify daily plan view and interactions

#### Test 1.3.1: View Daily Plan
1. Navigate to `/app/plan`
2. Verify:
   - [ ] Plan for today loads
   - [ ] Shows Fast Win (if available)
   - [ ] Shows regular actions (3-8 actions typically)
   - [ ] Shows "Today's Focus" message or focus card
   - [ ] Shows progress indicator (X of Y actions completed)
   - [ ] No errors in console

#### Test 1.3.2: Fast Win Highlighting
1. On Daily Plan page
2. Verify:
   - [ ] Fast Win is visually distinct (badge, different styling, separate section)
   - [ ] Fast Win description shows
   - [ ] Fast Win actions work (Done, Got Reply, Snooze)
   - [ ] Fast Win marked clearly (icon, label, or section header)

#### Test 1.3.3: Action Priority Indicators
1. On Daily Plan page
2. Verify:
   - [ ] Actions appear in priority order
   - [ ] Priority indicators visible (if implemented: badges, numbers, icons)
   - [ ] Tooltips explain priority (if implemented)
   - [ ] High-priority actions (e.g., REPLIED follow-ups) appear first

#### Test 1.3.4: Generate New Plan Manually
1. On Daily Plan page
2. Look for "Generate Plan" or "Refresh Plan" button
3. Click it
4. Verify:
   - [ ] New plan generates
   - [ ] Actions update based on current state
   - [ ] Fast Win may change
   - [ ] No duplicate actions
   - [ ] Plan date remains today

#### Test 1.3.5: Complete Actions from Daily Plan
1. From Daily Plan page
2. Complete a Fast Win:
   - [ ] Click "Done" or "Got Reply"
   - [ ] Verify action updates
   - [ ] Progress indicator updates
3. Complete regular actions:
   - [ ] Mark 2-3 actions as done
   - [ ] Verify progress updates
   - [ ] Completed actions show completion state

**Report Back:** ✅ Daily Plan Testing Complete - [Any issues found: _____]

---

### 1.4 Settings Testing

**Goal:** Verify all settings sections work correctly

#### Test 1.4.1: Update Timezone
1. Navigate to `/app/settings`
2. Find "Account Overview" section
3. Change timezone (e.g., from "America/New_York" to "America/Los_Angeles")
4. Save
5. Verify:
   - [ ] Timezone saves successfully
   - [ ] Success message shown
   - [ ] Daily plan times adjust (if applicable)
   - [ ] Setting persists after page refresh

#### Test 1.4.2: Update Email Preferences
1. In Settings, find "Email Preferences" section
2. Toggle email preferences:
   - [ ] Morning plan email: ON/OFF
   - [ ] Fast win reminder: ON/OFF
   - [ ] Follow-up alerts: ON/OFF
   - [ ] Weekly summary: ON/OFF
3. Save
4. Verify:
   - [ ] Toggles save correctly
   - [ ] Settings persist after refresh
   - [ ] "Unsubscribe from all emails" works if toggled

#### Test 1.4.3: Connect Calendar
1. In Settings, find "Calendar Connection" section
2. If not connected:
   - [ ] Click "Connect Google Calendar" (or Outlook)
   - [ ] Complete OAuth flow
   - [ ] Verify calendar connects successfully
   - [ ] Status shows "Connected" with green badge
3. If already connected:
   - [ ] Verify connection status displays
   - [ ] Verify last sync time shows

#### Test 1.4.4: Disconnect Calendar
1. If calendar is connected
2. Click "Disconnect" button
3. Confirm disconnection
4. Verify:
   - [ ] Calendar disconnects
   - [ ] Status shows "Disconnected"
   - [ ] Daily plan still works (falls back to default capacity)

#### Test 1.4.5: Update Working Hours
1. In Settings, find working hours fields
2. Change start time (e.g., 9:00 AM → 10:00 AM)
3. Change end time (e.g., 5:00 PM → 6:00 PM)
4. Save
5. Verify:
   - [ ] Working hours save
   - [ ] Daily plan capacity calculation uses new hours
   - [ ] Settings persist

#### Test 1.4.6: Export Data
1. In Settings, find "Data Export" section
2. Click "Export Data" or "Download JSON"
3. Verify:
   - [ ] JSON file downloads
   - [ ] File contains: leads, actions, plans, summaries
   - [ ] File is valid JSON
   - [ ] Sensitive data (tokens) are excluded
   - [ ] Data is complete and accurate

#### Test 1.4.7: Delete Account (⚠️ DANGEROUS - Use Test Account)
1. In Settings, find "Account Deletion" section
2. Read warnings carefully
3. Enter confirmation text if required
4. Click "Delete Account" or "Permanently Delete"
5. Verify:
   - [ ] Account deletion process initiates
   - [ ] User is signed out
   - [ ] User redirected to sign-in page
   - [ ] Account cannot be signed into after deletion
   - ⚠️ **IMPORTANT:** Only test this with a test account, not your production account!

**Report Back:** ✅ Settings Testing Complete - [Any issues found: _____]

---

### 1.5 Billing Details Testing

**Goal:** Verify billing management features

#### Test 1.5.1: View Current Plan
1. Navigate to `/app/settings`
2. Find "Billing & Subscription" section
3. Verify:
   - [ ] Plan name displays (Standard or Premium)
   - [ ] Status badge shows (active, trialing, etc.)
   - [ ] Renewal date shows (if applicable)
   - [ ] "Payments by Stripe" footnote shows

#### Test 1.5.2: Access Customer Portal
1. In Billing section, click "Manage Billing"
2. Verify:
   - [ ] Redirects to Stripe Customer Portal
   - [ ] Portal loads correctly
   - [ ] Can view: payment method, invoices, subscription details
   - [ ] Can navigate back to app

#### Test 1.5.3: Upgrade Plan (Standard → Premium)
**Prerequisites:** Must have Standard plan account
1. In Stripe Customer Portal (accessed via Settings)
2. Find "Upgrade" or "Change Plan" option
3. Select Premium plan
4. Complete upgrade flow
5. Verify:
   - [ ] Upgrade processes successfully
   - [ ] Webhook updates subscription in database
   - [ ] Settings page shows Premium plan
   - [ ] Premium features unlock (unlimited leads, etc.)
   - [ ] Plan change reflected immediately

#### Test 1.5.4: Downgrade Plan (Premium → Standard)
**Prerequisites:** Must have Premium plan account with ≤10 leads
1. In Stripe Customer Portal
2. Find "Downgrade" or "Change Plan" option
3. Select Standard plan
4. Complete downgrade flow
5. Verify:
   - [ ] Downgrade processes successfully
   - [ ] Settings shows Standard plan
   - [ ] Downgrade warning shown if >10 leads
   - [ ] Premium features locked

#### Test 1.5.5: Cancel Subscription
1. In Stripe Customer Portal
2. Find "Cancel Subscription" option
3. Cancel subscription
4. Verify:
   - [ ] Cancellation processes
   - [ ] Status shows "Canceled" or "Cancels on [date]"
   - [ ] Access continues until period end
   - [ ] "Reactivate" CTA shown in app (if applicable)

#### Test 1.5.6: Reactivate Subscription
1. If subscription is canceled but not yet expired
2. In Stripe Customer Portal or app
3. Click "Reactivate" or "Resume Plan"
4. Verify:
   - [ ] Subscription reactivates
   - [ ] Status returns to "Active"
   - [ ] Access restored immediately

**Report Back:** ✅ Billing Details Testing Complete - [Any issues found: _____]

---

## Area 2: Security Testing

**Estimated Time:** 30-45 minutes  
**Priority:** Critical - Security issues can block launch

### 2.1 Authentication/Authorization Testing

#### Test 2.1.1: Unauthenticated Access Prevention
1. Sign out (or use incognito window)
2. Try to access protected routes:
   - [ ] `/app` → Redirects to `/auth/sign-in`
   - [ ] `/app/leads` → Redirects to `/auth/sign-in`
   - [ ] `/app/plan` → Redirects to `/auth/sign-in`
   - [ ] `/app/actions` → Redirects to `/auth/sign-in`
   - [ ] `/app/settings` → Redirects to `/auth/sign-in`
3. Verify:
   - [ ] All protected routes redirect to sign-in
   - [ ] Redirect preserves intended destination (redirect param)
   - [ ] After sign-in, user lands on intended page

#### Test 2.1.2: User Data Isolation (RLS)
1. Sign in as User A
2. Note: User A's lead count, action count
3. Sign out
4. Sign in as User B (different account)
5. Verify:
   - [ ] User B cannot see User A's leads
   - [ ] User B cannot see User A's actions
   - [ ] User B sees only their own data
   - [ ] API calls return only User B's data

#### Test 2.1.3: Direct API Access (Unauthenticated)
1. Sign out
2. Open browser DevTools → Network tab
3. Try direct API calls:
   ```javascript
   // In browser console:
   fetch('/api/leads').then(r => r.json()).then(console.log)
   fetch('/api/actions').then(r => r.json()).then(console.log)
   ```
4. Verify:
   - [ ] API returns 401 Unauthorized
   - [ ] No data returned
   - [ ] Error message appropriate

#### Test 2.1.4: Direct API Access (Wrong User)
1. Sign in as User A
2. In browser console, try to access User B's data:
   ```javascript
   // This should fail even if you know User B's ID
   fetch('/api/leads').then(r => r.json()).then(console.log)
   // Check response - should only contain User A's leads
   ```
3. Verify:
   - [ ] Only your own data returned
   - [ ] Cannot access other users' data even with direct API calls

**Report Back:** ✅ Authentication/Authorization Testing Complete - [Any issues found: _____]

---

### 2.2 API Route Security Testing

#### Test 2.2.1: Cron Job Secret Protection
1. Try to access cron endpoints without secret:
   ```bash
   curl https://nextbestmove.app/api/cron/daily-plans
   ```
2. Verify:
   - [ ] Returns 401 or 403
   - [ ] Requires authentication/secret
   - [ ] Cannot trigger cron jobs manually

#### Test 2.2.2: Webhook Signature Verification
**Note:** This is harder to test manually. Verify in code review:
- [ ] Stripe webhook verifies signature
- [ ] Invalid signatures are rejected
- [ ] Webhook endpoint logs verification failures

#### Test 2.2.3: API Route Authentication Checks
Test each API endpoint:
- [ ] `/api/leads` - Requires auth
- [ ] `/api/actions` - Requires auth
- [ ] `/api/daily-plans` - Requires auth
- [ ] `/api/weekly-summaries` - Requires auth
- [ ] `/api/billing/subscription` - Requires auth

Verify all return 401 when unauthenticated.

**Report Back:** ✅ API Route Security Testing Complete - [Any issues found: _____]

---

### 2.3 Input Validation Testing

#### Test 2.3.1: SQL Injection Prevention
Test with SQL injection attempts:
1. Try adding a lead with malicious input:
   - Name: `'; DROP TABLE users; --`
   - URL: `https://example.com'; DELETE FROM leads; --`
2. Verify:
   - [ ] Input is sanitized
   - [ ] No SQL errors
   - [ ] Data saved as literal text (not executed)
   - [ ] Database remains intact

#### Test 2.3.2: XSS Prevention
Test with XSS attempts:
1. Try adding lead with:
   - Name: `<script>alert('XSS')</script>`
   - Notes: `<img src=x onerror=alert('XSS')>`
2. Verify:
   - [ ] Script tags are escaped/removed
   - [ ] No JavaScript executes
   - [ ] Content displays as text only
   - [ ] No alerts pop up

#### Test 2.3.3: URL Validation
Test invalid URLs:
- [ ] `javascript:alert('xss')` - Should be rejected
- [ ] `file:///etc/passwd` - Should be rejected
- [ ] `not-a-url` - Should be rejected
- [ ] Valid URLs (`https://`, `mailto:`) - Should be accepted

#### Test 2.3.4: Email Validation
Test email inputs:
- [ ] `test@example.com` - Should work
- [ ] `not-an-email` - Should be rejected or converted to mailto:
- [ ] `test@` - Should be rejected
- [ ] `@example.com` - Should be rejected

**Report Back:** ✅ Input Validation Testing Complete - [Any issues found: _____]

---

### 2.4 Environment Variable Security

#### Test 2.4.1: No Secrets in Client Code
1. Open browser DevTools → Sources tab
2. Search bundled JavaScript for:
   - [ ] `GOCSPX-` (Google OAuth secret) - Should NOT be found
   - [ ] `sk_live_` (Stripe secret key) - Should NOT be found
   - [ ] `SUPABASE_SERVICE_ROLE_KEY` - Should NOT be found
3. Verify:
   - [ ] No secrets exposed in client-side code
   - [ ] Only public keys/environment variables visible

#### Test 2.4.2: Production vs Staging Secrets
1. Verify in production:
   - [ ] Production OAuth client ID used (not staging)
   - [ ] Production Stripe keys used (not test keys)
   - [ ] Production Supabase project ID used

**Report Back:** ✅ Environment Variable Security Testing Complete - [Any issues found: _____]

---

## Area 3: Cross-Browser Testing

**Estimated Time:** 45-60 minutes  
**Priority:** High - Users may use different browsers

### 3.1 Desktop Browsers

**Test Each Browser:** Sign up → Add lead → View plan → Complete action → Check settings

#### Test 3.1.1: Chrome (Primary)
- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly
- [ ] Forms submit correctly

#### Test 3.1.2: Safari
- [ ] Sign up/sign in works
- [ ] Daily plan displays correctly
- [ ] Action completion works
- [ ] Settings save correctly
- [ ] No Safari-specific issues

#### Test 3.1.3: Firefox
- [ ] All core features work
- [ ] Forms function correctly
- [ ] OAuth flows work
- [ ] No Firefox-specific issues

#### Test 3.1.4: Edge
- [ ] All features work
- [ ] UI consistent with Chrome
- [ ] No Edge-specific issues

**Report Back:** ✅ Desktop Browser Testing Complete - [Issues found: _____]

---

### 3.2 Mobile Browsers

**Test Each Browser on Actual Device or Browser DevTools Mobile Mode**

#### Test 3.2.1: Mobile Safari (iOS)
- [ ] Sign in works
- [ ] Navigation works (tap targets large enough)
- [ ] Forms are usable (keyboard appears, fields accessible)
- [ ] Daily plan displays correctly
- [ ] Action cards are tappable
- [ ] Settings page is usable

#### Test 3.2.2: Chrome Mobile (Android)
- [ ] All features work
- [ ] Touch interactions work
- [ ] Forms function correctly
- [ ] OAuth flows work on mobile
- [ ] No mobile-specific bugs

**Report Back:** ✅ Mobile Browser Testing Complete - [Issues found: _____]

---

## Area 4: Responsive Design Testing

**Estimated Time:** 30 minutes  
**Priority:** Medium - Important for mobile users

### 4.1 Desktop Breakpoints

**Use Browser DevTools → Responsive Design Mode**

#### Test 4.1.1: Full HD (1920x1080)
- [ ] Layout looks good
- [ ] No horizontal scrolling
- [ ] Content is centered/appropriately sized
- [ ] Navigation sidebar appropriate width

#### Test 4.1.2: MacBook (1440x900)
- [ ] All features visible
- [ ] No layout breaking
- [ ] Forms are accessible

#### Test 4.1.3: Small Desktop (1280x720)
- [ ] Layout adapts correctly
- [ ] No content cut off
- [ ] Navigation remains usable

---

### 4.2 Tablet Breakpoints

#### Test 4.2.1: iPad (768x1024)
- [ ] Layout adapts to tablet size
- [ ] Touch targets are appropriate
- [ ] Forms are usable
- [ ] Navigation works

#### Test 4.2.2: iPad Pro (1024x1366)
- [ ] Similar to iPad but larger
- [ ] No wasted space
- [ ] Content scales appropriately

---

### 4.3 Mobile Breakpoints

#### Test 4.3.1: iPhone 12/13/14 (390x844)
- [ ] Layout is mobile-friendly
- [ ] Text is readable
- [ ] Buttons are tappable
- [ ] Forms work correctly
- [ ] Navigation menu works (if hamburger menu)

#### Test 4.3.2: iPhone SE (375x667)
- [ ] Smaller screen works
- [ ] No content cut off
- [ ] Scrollable areas work

#### Test 4.3.3: Android (360x640)
- [ ] Layout works on smaller Android screens
- [ ] All features accessible

**Report Back:** ✅ Responsive Design Testing Complete - [Issues found: _____]

---

## Area 5: Performance Testing

**Estimated Time:** 20-30 minutes  
**Priority:** Medium - Performance affects user experience

### 5.1 Page Load Times

**Use Browser DevTools → Network tab → Disable cache → Reload**

#### Target: < 3 seconds for initial page load

#### Test 5.1.1: Homepage (Marketing)
- [ ] Load time: _____ seconds
- [ ] Meets < 3 second target: [ ] Yes [ ] No

#### Test 5.1.2: Sign Up Page
- [ ] Load time: _____ seconds
- [ ] Meets < 3 second target: [ ] Yes [ ] No

#### Test 5.1.3: Dashboard (`/app`)
- [ ] Load time: _____ seconds
- [ ] Meets < 3 second target: [ ] Yes [ ] No

#### Test 5.1.4: Daily Plan Page
- [ ] Load time: _____ seconds
- [ ] Meets < 3 second target: [ ] Yes [ ] No

#### Test 5.1.5: Leads Page
- [ ] Load time: _____ seconds
- [ ] Meets < 3 second target: [ ] Yes [ ] No

#### Test 5.1.6: Settings Page
- [ ] Load time: _____ seconds
- [ ] Meets < 3 second target: [ ] Yes [ ] No

---

### 5.2 API Response Times

**Use Browser DevTools → Network tab → Filter: Fetch/XHR**

#### Target: < 500ms for API responses

#### Test 5.2.1: GET /api/leads
- [ ] Response time: _____ ms
- [ ] Meets < 500ms target: [ ] Yes [ ] No

#### Test 5.2.2: GET /api/actions
- [ ] Response time: _____ ms
- [ ] Meets < 500ms target: [ ] Yes [ ] No

#### Test 5.2.3: GET /api/daily-plans
- [ ] Response time: _____ ms
- [ ] Meets < 500ms target: [ ] Yes [ ] No

#### Test 5.2.4: POST /api/leads (Create lead)
- [ ] Response time: _____ ms
- [ ] Meets < 500ms target: [ ] Yes [ ] No

#### Test 5.2.5: PATCH /api/actions/[id]/state
- [ ] Response time: _____ ms
- [ ] Meets < 500ms target: [ ] Yes [ ] No

---

### 5.3 Bundle Size Analysis

**Use Browser DevTools → Network tab → Load page → Check JS bundle sizes**

1. Open DevTools → Network
2. Reload page
3. Filter by "JS"
4. Check largest JavaScript files:
   - [ ] Main bundle size: _____ KB
   - [ ] Total JS loaded: _____ KB
   - [ ] Target: < 500KB total JS (reasonable for Next.js app)

---

### 5.4 Database Query Performance

**Check Supabase Dashboard → Logs → Database queries**

1. Perform common actions (load leads, load plan, complete action)
2. Check Supabase logs for slow queries:
   - [ ] No queries > 1 second
   - [ ] Most queries < 100ms
   - [ ] Indexes are being used (check query plans)

**Report Back:** ✅ Performance Testing Complete - [Slow pages/APIs: _____]

---

## Area 6: Accessibility Audit

**Estimated Time:** 45-60 minutes  
**Priority:** High - WCAG 2.1 AA compliance required

### 6.1 Automated Testing Tools

#### Test 6.1.1: axe DevTools
1. Install axe DevTools browser extension
2. Run on each major page:
   - [ ] Homepage: _____ issues found
   - [ ] Dashboard: _____ issues found
   - [ ] Daily Plan: _____ issues found
   - [ ] Leads: _____ issues found
   - [ ] Settings: _____ issues found
3. Fix critical/high issues

#### Test 6.1.2: WAVE (Web Accessibility Evaluation Tool)
1. Use WAVE browser extension
2. Test same pages as above
3. Check for:
   - [ ] Missing alt text
   - [ ] Missing form labels
   - [ ] Color contrast issues
   - [ ] Heading structure issues

---

### 6.2 Manual Accessibility Checks

#### Test 6.2.1: Keyboard Navigation
1. Disconnect mouse/trackpad (or just use keyboard)
2. Navigate entire app using only:
   - `Tab` - Move forward
   - `Shift+Tab` - Move backward
   - `Enter/Space` - Activate buttons
   - `Arrow keys` - Navigate menus/lists
3. Verify:
   - [ ] All interactive elements are reachable
   - [ ] Focus indicators are visible
   - [ ] Logical tab order
   - [ ] Can complete all major flows (sign in, add lead, complete action)

#### Test 6.2.2: Screen Reader Testing
**Use VoiceOver (Mac) or NVDA (Windows)**

1. Enable screen reader
2. Navigate through app
3. Verify:
   - [ ] All buttons/links have accessible names
   - [ ] Form inputs have labels
   - [ ] Error messages are announced
   - [ ] Navigation landmarks are identified
   - [ ] Content is read in logical order

#### Test 6.2.3: Color Contrast
**Use Browser DevTools or online contrast checker**

Check text contrast on:
- [ ] Headings (should be 4.5:1 minimum)
- [ ] Body text (should be 4.5:1 minimum)
- [ ] Buttons (should be 4.5:1 minimum)
- [ ] Links (should be 4.5:1 minimum)

#### Test 6.2.4: Form Labels
- [ ] All form inputs have `<label>` elements
- [ ] Labels are associated with inputs (`for` attribute or wrapping)
- [ ] Placeholder text is not the only label
- [ ] Error messages are associated with inputs

#### Test 6.2.5: Image Alt Text
- [ ] All images have `alt` attributes
- [ ] Decorative images have empty `alt=""`
- [ ] Informative images have descriptive `alt` text

#### Test 6.2.6: Zoom Testing
1. Zoom browser to 200%
2. Verify:
   - [ ] Content remains usable
   - [ ] No horizontal scrolling required
   - [ ] Text remains readable
   - [ ] Interactive elements remain accessible

**Report Back:** ✅ Accessibility Audit Complete - [Critical issues: _____]

---

## Area 7: Production Stripe Smoke Test

**Estimated Time:** 30 minutes  
**Priority:** Critical - Billing must work in production

**⚠️ WARNING:** Use Stripe test mode even in production. Never use real credit cards.

### 7.1 Pre-Production Setup Verification

#### Test 7.1.1: Verify Stripe Configuration
- [ ] Stripe is in Live Mode (or Test Mode for testing)
- [ ] Live API keys are in production env vars
- [ ] Live price IDs are correct (check Stripe dashboard)
- [ ] Production webhook endpoint configured in Stripe

---

### 7.2 Test Checkout Flow

#### Test 7.2.1: Create Checkout Session (Standard Monthly)
1. Sign in with test account
2. Navigate to billing/checkout
3. Select Standard Monthly plan
4. Click "Subscribe" or "Start Trial"
5. Verify:
   - [ ] Redirects to Stripe Checkout
   - [ ] Correct plan shown
   - [ ] Correct price shown ($29/month)
   - [ ] Can complete payment with test card

#### Test 7.2.2: Complete Payment with Test Card
**Use Stripe Test Card:** `4242 4242 4242 4242`
1. In Stripe Checkout
2. Enter test card details:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
3. Complete checkout
4. Verify:
   - [ ] Payment processes successfully
   - [ ] Redirects back to app
   - [ ] Subscription created in database
   - [ ] User has access to features
   - [ ] Webhook received (check Supabase logs)

---

### 7.3 Test Subscription Management

#### Test 7.3.1: Access Customer Portal
1. In Settings → Billing, click "Manage Billing"
2. Verify:
   - [ ] Portal loads correctly
   - [ ] Shows current subscription
   - [ ] Shows payment method
   - [ ] Shows billing history

#### Test 7.3.2: Test Plan Upgrade (Standard → Premium)
1. In Customer Portal
2. Upgrade to Premium
3. Verify:
   - [ ] Upgrade processes
   - [ ] Webhook updates subscription
   - [ ] Premium features unlock
   - [ ] Settings shows Premium plan

#### Test 7.3.3: Test Plan Downgrade (Premium → Standard)
1. In Customer Portal (with Premium plan)
2. Downgrade to Standard
3. Verify:
   - [ ] Downgrade processes
   - [ ] Changes at period end (or immediately)
   - [ ] Standard features apply
   - [ ] Warning shown if >10 leads

#### Test 7.3.4: Test Cancellation
1. In Customer Portal
2. Cancel subscription
3. Verify:
   - [ ] Cancellation processes
   - [ ] Status updates correctly
   - [ ] Access continues until period end
   - [ ] "Reactivate" option available

---

### 7.4 Test Payment Failure Handling

#### Test 7.4.1: Use Declined Test Card
**Stripe Test Card for Decline:** `4000 0000 0000 0002`
1. Try to subscribe with declined card
2. Verify:
   - [ ] Payment fails gracefully
   - [ ] Error message shown
   - [ ] User can retry
   - [ ] No subscription created

#### Test 7.4.2: Verify Webhook Security
- [ ] Webhook verifies Stripe signature
- [ ] Invalid signatures are rejected
- [ ] Webhook events are idempotent (duplicate events don't create duplicates)

**Report Back:** ✅ Production Stripe Smoke Test Complete - [Issues found: _____]

---

## Testing Summary Template

After completing each area, fill out:

```
## Area X: [Area Name] - COMPLETE ✅

**Date Completed:** _____

**Issues Found:**
1. [Issue description] - [Severity: Critical/High/Medium/Low]
2. [Issue description] - [Severity: Critical/High/Medium/Low]

**Status:** All tests passed / Issues found (see above)

**Notes:**
[Any additional observations]
```

---

## Next Steps After Testing

1. **Fix Critical Issues** - Address all Critical/High severity issues
2. **Document Issues** - Create bug reports for tracking
3. **Re-test After Fixes** - Verify fixes don't break other areas
4. **Final Review** - Review all test results before launch

---

## Questions?

If you encounter issues or need clarification on any test:
- Check the main QA checklist: `docs/Planning/Phase_2.1_QA_Sweep_Checklist.md`
- Review PRD for expected behavior: `docs/PRD/NextBestMove_PRD_v1.md`
- Check architecture docs: `docs/Architecture/`

---

**Good luck with testing! Report back as you complete each area.**

