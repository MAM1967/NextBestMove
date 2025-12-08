# Phase 2.1: Full QA Sweep Checklist

**Goal:** Comprehensive quality assurance testing before launch  
**Estimated Time:** 4-6 hours  
**Priority:** Focus on revenue-critical paths and core functionality

---

## Recommended Testing Order

**Priority Order (Risk-Based Approach):**

1. **Functional Testing** (Do first - foundation for everything else)
   - If core features don't work, no point testing elsewhere
   - Test on your primary browser (Chrome) first
   - Fix critical bugs before moving on

2. **Security Testing** (Do early - critical for launch)
   - Can be done in parallel with functional testing
   - Security issues are high-risk and need immediate fixes
   - Test authentication/authorization as you test functional flows

3. **Cross-Browser Testing** (Do after functional works)
   - Once you know features work, verify they work everywhere
   - Start with Chrome (primary), then Safari, Firefox, Edge
   - Mobile browsers last (often similar issues to desktop)

4. **Responsive Design** (Do after cross-browser)
   - Similar to cross-browser but for screen sizes
   - Test desktop → tablet → mobile
   - Many issues overlap with cross-browser testing

5. **Performance Testing** (Do last - optimization phase)
   - Measure after everything works
   - Performance issues are usually optimization, not blockers
   - Can be done in parallel with other testing

**Efficient Approach:**
- Test functional flows on Chrome desktop first
- As you test, note any responsive/performance issues
- Do security checks as you go (don't wait)
- Then systematically test other browsers/devices
- Finally, measure and optimize performance

---

## 1. Functional Testing - Revenue Critical Paths

### ✅ Onboarding → First Action (Already Tested via Playwright)
- [x] User signs up
- [x] Connects calendar (or skips)
- [x] Adds first lead
- [x] Gets first daily plan
- [x] Completes first Fast Win
- [x] Marks action complete

### Daily Habit Loop (Already Tested via Playwright)
- [x] User logs in
- [x] Sees "Today's Focus" message
- [x] Views daily plan (3-8 actions)
- [x] Completes action (marks "Got reply")
- [x] Sees success confirmation

### Billing (Trial → Paid) (Already Tested via Playwright)
- [x] User enters payment info
- [x] Trial converts to paid
- [x] Subscription activates
- [x] User retains access

### Weekly Summary Generation (Already Tested via Playwright)
- [x] User completes actions for 7 days
- [x] Sunday night: summary generates
- [x] Summary includes: days active, actions, insight, next week focus
- [x] User sees summary on Monday

### Additional Critical Flows to Test Manually:

#### Lead Management
- [ ] Add new lead (name + URL/email)
- [ ] Edit existing lead
- [ ] Snooze lead
- [ ] Archive lead (Archive serves as "delete" - removes from active use, retains for analytics)
- [ ] Restore archived lead
- [ ] Filter leads (All/Active/Snoozed/Archived)

**Note:** There is no hard delete functionality. Archive is the intended way to remove leads from active use while preserving data for analytics/history (per PRD Section 9.1).

#### Action Management
- [ ] View action details
- [ ] Mark action as "Done"
- [ ] Mark action as "Got reply"
- [ ] Snooze action
- [ ] Add note to action
- [ ] View action history

#### Daily Plan
- [ ] View daily plan
- [ ] See Fast Win highlighted
- [ ] See action priority indicators
- [ ] Generate new plan manually
- [ ] View plan history

#### Weekly Summary
- [ ] View weekly summary
- [ ] See metrics (days active, actions completed)
- [ ] See insights
- [ ] See content prompts
- [ ] Copy content prompt to clipboard

#### Settings
- [ ] Update timezone
- [ ] Update email preferences
- [ ] Connect/disconnect calendar
- [ ] Update working hours
- [ ] Export data
- [ ] Delete account

#### Billing (Additional Tests)
- [ ] View current plan
- [ ] Upgrade plan (Standard → Premium)
- [ ] Downgrade plan (Premium → Standard)
- [ ] Access customer portal
- [ ] Cancel subscription
- [ ] Reactivate subscription

---

## 2. Cross-Browser Testing

Test on staging environment: `https://staging.nextbestmove.app`

### Desktop Browsers
- [ ] Chrome (latest) - Primary
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Test Focus:**
- [ ] Sign up flow
- [ ] Sign in flow
- [ ] Daily plan view
- [ ] Action completion
- [ ] Billing checkout
- [ ] Settings page

---

## 3. Responsive Design Testing

### Desktop
- [ ] 1920x1080 (Full HD)
- [ ] 1440x900 (MacBook)
- [ ] 1280x720 (Small desktop)

### Tablet
- [ ] iPad (768x1024)
- [ ] iPad Pro (1024x1366)

### Mobile
- [ ] iPhone 12/13/14 (390x844)
- [ ] iPhone SE (375x667)
- [ ] Android (360x640)

**Test Focus:**
- [ ] Navigation menu
- [ ] Forms (sign up, add lead, etc.)
- [ ] Action cards
- [ ] Daily plan layout
- [ ] Settings page
- [ ] Modals/dialogs

---

## 4. Performance Testing

### Page Load Times (Target: < 3 seconds)
- [ ] Homepage (marketing)
- [ ] Sign up page
- [ ] Sign in page
- [ ] App dashboard
- [ ] Daily plan page
- [ ] Leads page
- [ ] Settings page

### API Response Times (Target: < 500ms)
- [ ] `/api/leads` (GET)
- [ ] `/api/leads` (POST)
- [ ] `/api/actions` (GET)
- [ ] `/api/daily-plans` (GET)
- [ ] `/api/daily-plans/generate` (POST)
- [ ] `/api/weekly-summaries` (GET)
- [ ] `/api/billing/subscription` (GET)

### Database Query Performance
- [ ] Check slow queries in Supabase dashboard
- [ ] Verify indexes are in place
- [ ] Test with larger datasets (if possible)

### Bundle Size
- [ ] Check Next.js build output
- [ ] Verify code splitting works
- [ ] Check for large dependencies

---

## 5. Security Testing

### Authentication/Authorization
- [ ] Unauthenticated users can't access `/app/*`
- [ ] Users can only see their own data
- [ ] RLS policies enforced
- [ ] Session expires correctly
- [ ] Password reset works

### API Route Security
- [ ] Cron jobs require secret
- [ ] Webhooks verify signatures
- [ ] API routes check authentication
- [ ] No sensitive data in responses

### Input Validation
- [ ] SQL injection prevention (test with `'; DROP TABLE users; --`)
- [ ] XSS prevention (test with `<script>alert('xss')</script>`)
- [ ] CSRF protection (if applicable)
- [ ] File upload validation (if applicable)

### Environment Variables
- [ ] No secrets in client-side code
- [ ] All secrets in environment variables
- [ ] Production secrets different from staging

---

## 6. Error Handling

### Network Errors
- [ ] Offline mode handling
- [ ] Slow network handling
- [ ] API timeout handling

### User Errors
- [ ] Invalid form inputs
- [ ] Duplicate entries
- [ ] Missing required fields

### Server Errors
- [ ] 500 errors show user-friendly message
- [ ] Errors logged to monitoring
- [ ] Error boundaries catch React errors

---

## 7. Edge Cases

### Data Edge Cases
- [ ] User with no leads
- [ ] User with no actions
- [ ] User with many leads (100+)
- [ ] User with many actions (1000+)
- [ ] Very long names/URLs
- [ ] Special characters in inputs

### Time Edge Cases
- [ ] Weekend preference handling
- [ ] Timezone changes
- [ ] Daylight saving time
- [ ] Midnight boundary conditions

### Subscription Edge Cases
- [ ] Trial expiration
- [ ] Payment failure
- [ ] Subscription cancellation
- [ ] Plan upgrade/downgrade
- [ ] Grace period handling

---

## Testing Tools

### Browser DevTools
- Chrome DevTools (Network, Performance, Console)
- Firefox DevTools
- Safari Web Inspector

### Performance
- Lighthouse (Chrome DevTools)
- WebPageTest
- Chrome Performance Profiler

### Security
- OWASP ZAP (optional)
- Browser console for XSS testing
- Manual SQL injection tests

### Accessibility (Phase 2.2)
- axe DevTools
- WAVE
- Screen readers

---

## Bug Tracking

**Template for Bugs Found:**

```
**Bug #X: [Title]**
- **Severity:** Critical / High / Medium / Low
- **Page/Feature:** [Where it occurs]
- **Steps to Reproduce:**
  1. ...
  2. ...
- **Expected:** [What should happen]
- **Actual:** [What actually happens]
- **Browser/Device:** [Chrome Desktop, Safari Mobile, etc.]
- **Screenshot:** [If applicable]
```

---

## Acceptance Criteria

- [ ] All critical user flows work
- [ ] No critical bugs found
- [ ] Performance acceptable (< 3s page load, < 500ms API)
- [ ] Security vulnerabilities addressed
- [ ] Cross-browser compatibility verified
- [ ] Responsive design verified
- [ ] Error handling works correctly

---

## Notes

- Focus on revenue-critical paths first (already covered by Playwright tests)
- Test on staging environment, not production
- Document all bugs found
- Prioritize fixes by severity
- Re-test after fixes

