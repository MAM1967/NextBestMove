# NextBestMove Automated Testing Strategy

_Date: 2025-12-24_  
_Status: Ready for Implementation_

## Executive Summary

This document outlines a practical, phased testing strategy for NextBestMove, focusing on automated coverage for recently completed features (NEX-5 through NEX-17) and establishing a sustainable testing foundation for launch.

**Key Principles:**
- **Test Pyramid**: Unit → Integration → E2E (more unit tests, fewer E2E)
- **Deterministic Data**: Every test run starts with a clean, seeded database
- **Staging-First**: E2E tests run against staging environment (already configured)
- **Pragmatic Scope**: Automate stable logic; manually verify external integrations

---

## Tooling Stack

### Primary Tools
- **Playwright** (v1.57+): E2E tests against staging.nextbestmove.app
- **Vitest**: Unit + integration tests (route handlers, pure logic, components)
- **React Testing Library**: Component tests (when needed)
- **MSW** (Mock Service Worker): Mock API calls in component tests

### Supporting Tools
- **Supabase Local** (optional): For local integration tests with DB
- **Stripe Test Mode**: For billing flow tests
- **GitHub Actions**: CI/CD pipeline

### Current Status
- ✅ Playwright configured for staging
- ✅ 4 critical path E2E tests exist
- ⚠️ Vitest not yet configured
- ⚠️ No unit/integration test suite
- ⚠️ No database reset/seed script for tests

---

## Test Pyramid (Enforce This)

```
        /\
       /E2E\        ← 5-10 critical user flows (Playwright)
      /------\
     /Integration\  ← API routes + DB writes (Vitest + Supabase)
    /------------\
   /    Unit      \ ← Pure logic, utilities, decision engine (Vitest)
  /----------------\
```

**Target Distribution:**
- **Unit**: 60-70% of tests (fast, deterministic)
- **Integration**: 20-30% of tests (API + DB)
- **E2E**: 10-15% of tests (critical paths only)

---

## Environments & Test Data

### Staging Environment (E2E)
- **URL**: `https://staging.nextbestmove.app`
- **Auth**: Basic Auth (username: `staging`, password: `Jer29:11esv`)
- **Database**: Shared staging DB (tests clean up after themselves)
- **OAuth**: Use email/password auth for Playwright (avoid OAuth in CI)

### Local Environment (Unit/Integration)
- **Database**: Supabase local (optional) or direct staging DB connection
- **Reset Strategy**: Before each test suite, reset + seed deterministic fixtures
- **Isolation**: Each test should be independent (no shared state)

### Hard Requirement: Deterministic Seeding
Every test run must:
1. Reset database to known state
2. Seed deterministic fixtures (users, relationships, actions)
3. Run tests
4. Clean up test data (or reset again)

**Why**: Without this, tests will be flaky and unreliable.

---

## Coverage by Feature (Prioritized)

### 🔴 P0 - Launch Critical (Must Have)

#### NEX-9: Reverse Trial & Tier Wiring
**Why Critical**: Billing bugs = lost revenue + customer trust issues

**Unit (Vitest)**
- [ ] `lib/billing/tier.ts`: Entitlement gating logic (Standard vs Premium)
- [ ] `lib/billing/tier.ts`: Reverse trial timer calculation (14 days)
- [ ] `lib/billing/tier.ts`: Downgrade to Free after day 14
- [ ] `lib/billing/tier.ts`: Read-only grace period rules

**Integration (Vitest + API)**
- [ ] `api/billing/webhook/route.ts`: Stripe webhook → subscription sync
- [ ] `api/middleware.ts`: Paywall middleware gates premium features
- [ ] Verify idempotency: duplicate webhook events don't duplicate state

**E2E (Playwright)**
- [ ] New user signup → Standard tier access during 14-day trial
- [ ] Premium features accessible during trial
- [ ] After trial expiration (simulated), premium UI locked
- [ ] Paywall overlay appears on gated features
- [ ] Upgrade flow: checkout → webhook → premium access

**Manual**
- [ ] Real Stripe purchase in production (smallest amount) after any billing change

---

#### NEX-16: Stripe Idempotency
**Why Critical**: Prevents duplicate charges (already happened once in test)

**Unit (Vitest)**
- [ ] `lib/billing/idempotency.ts`: Key generation is stable for same operation
- [ ] `lib/billing/idempotency.ts`: DB guards prevent duplicate side effects

**Integration (Vitest + API)**
- [ ] Webhook replay: send same Stripe event twice → only one side effect
- [ ] Near-simultaneous checkout attempts → no duplicate subscriptions
- [ ] Idempotency key table prevents duplicate processing

**E2E (Playwright)**
- [ ] Replay webhook via test helper route
- [ ] Verify UI state remains consistent (no double banners, no duplicate state)

**Manual**
- [ ] Stripe dashboard spot-check: no duplicate charges for test users

---

#### NEX-6: Best Action on Today
**Why Critical**: Core value proposition - "If I do one thing, it's this"

**Unit (Vitest)**
- [ ] `lib/decision-engine/index.ts`: Best action selection from NextMoveScore
- [ ] `lib/decision-engine/index.ts`: Tie-breaking rules are deterministic
- [ ] `lib/decision-engine/scoring.ts`: Score calculation is stable

**Integration (Vitest + API)**
- [ ] `api/decision-engine/best-action/route.ts`: Returns exactly one action (or null)
- [ ] `api/decision-engine/best-action/route.ts`: Includes rationale fields

**E2E (Playwright)**
- [ ] Today shows highlighted Best Action above list
- [ ] Completing Best Action removes it and promotes next best
- [ ] No actions → no Best Action UI appears
- [ ] Best Action updates when actions change

**Manual**
- [ ] Accessibility: highlight styling, keyboard focus, screen reader labels

---

#### NEX-5: Relationship Cadence & Due Status
**Why Critical**: Core relationship management feature

**Unit (Vitest)**
- [ ] `lib/leads/relationship-status.ts`: Cadence → `next_touch_due_at` calculation
- [ ] `lib/leads/relationship-status.ts`: Status classification (Needs attention / In rhythm / Intentional low-touch)
- [ ] Edge cases: timezone boundaries, missing last-touch, cadence changes

**Integration (Vitest + API)**
- [ ] `api/leads/[id]/route.ts`: Updating cadence/tier recomputes `next_touch_due_at`
- [ ] `api/leads/route.ts`: Today query returns correct status + due ordering

**E2E (Playwright)**
- [ ] Update relationship cadence → Today reflects new due status
- [ ] Relationship with no last-touch shows as "Needs attention"
- [ ] Status badges appear correctly in Relationships list

**Manual**
- [ ] UX comprehension: labels/tooltips make status meaning obvious

---

### 🟠 P1 - High Value (Should Have)

#### NEX-8: "I have X minutes" Selector
**Unit (Vitest)**
- [ ] `lib/decision-engine/duration-filter.ts`: Filters actions by `estimated_minutes <= duration`
- [ ] `lib/decision-engine/duration-filter.ts`: Lane priority ordering (Priority > In Motion > On Deck)
- [ ] `lib/decision-engine/duration-filter.ts`: Graceful fallback when no actions fit

**Integration (Vitest + API)**
- [ ] `api/decision-engine/best-action/route.ts`: Duration parameter filters correctly
- [ ] `api/actions/[id]/estimated-minutes/route.ts`: Update endpoint works

**E2E (Playwright)**
- [ ] Select 5/10/15 min on Today → list filters to matching actions
- [ ] Single recommended action displayed for selected duration
- [ ] Completing action updates recommendation
- [ ] No actions fit → shows helpful message

**Manual**
- [ ] Copy/label sanity check: users understand what selector does

---

#### NEX-7: Promised Follow-up Flag
**Unit (Vitest)**
- [ ] `lib/utils/promiseUtils.ts`: Overdue detection logic
- [ ] `lib/utils/promiseUtils.ts`: Promise date calculation (EOD, end of week, custom)

**Integration (Vitest + API)**
- [ ] `api/actions/[id]/promise/route.ts`: Writes promised fields correctly
- [ ] `api/decision-engine/best-action/route.ts`: Overdue promises prioritized

**E2E (Playwright)**
- [ ] Mark action as promised by EOD
- [ ] Set clock past due → verify escalation appears on Today
- [ ] Complete promised action → escalation clears

**Manual**
- [ ] Email rendering/deliverability for promised follow-up nudges

---

#### NEX-10: Decision Engine (Priority/In Motion/On Deck)
**Unit (Vitest)**
- [ ] `lib/decision-engine/lanes.ts`: Lane assignment from relationship signals
- [ ] `lib/decision-engine/scoring.ts`: NextMoveScore calculation
- [ ] `lib/decision-engine/scoring.ts`: Stability (same inputs → same output)

**Integration (Vitest + API)**
- [ ] `api/decision-engine/actions-by-lane/route.ts`: Returns actions grouped by lane
- [ ] `api/decision-engine/best-action/route.ts`: Includes lane + score fields
- [ ] Engine persistence: per-relationship next move written correctly

**E2E (Playwright)**
- [ ] Seed relationships for each lane → verify UI grouping
- [ ] Complete action that changes momentum → next move recalculates

**Manual**
- [ ] Scoring calibration review using real account data

---

#### NEX-17: Multi-calendar Settings UI
**Unit (Vitest)**
- [ ] `app/settings/CalendarConnectionSection.tsx`: Multiple calendars list rendering
- [ ] `app/settings/CalendarConnectionSection.tsx`: Per-calendar disconnect state

**Integration (Vitest + API)**
- [ ] `api/calendar/disconnect/[id]/route.ts`: Updates DB correctly
- [ ] `api/calendar/disconnect/[id]/route.ts`: User `calendar_connected` flag updates on DELETE

**E2E (Playwright)**
- [ ] Settings → Calendars: verify list shows all connected calendars
- [ ] Disconnect one calendar → list updates, confidence label changes
- [ ] Connect additional calendar → appears in list

**Manual**
- [ ] Production rollout: confirm DELETE-trigger migration applied

---

### 🟡 P2 - Nice to Have (Can Defer)

#### NEX-11: Signals v1 (Email Metadata)
**Unit (Vitest)**
- [ ] Email metadata extraction from sample threads (fixtures + snapshots)
- [ ] Privacy constraints: only metadata fields stored/returned

**Integration (Vitest + API)**
- [ ] `api/email/signals/route.ts`: Reads `email_metadata` correctly
- [ ] Decision engine consumes email metadata without failing when absent

**E2E (Playwright)**
- [ ] Open Signals tab → verify email context appears for seeded relationships

**Manual**
- [ ] OAuth consent flow review (scopes least-privilege)
- [ ] Provider rate-limit behavior spot-check

---

#### NEX-12: Notes Summary
**Unit (Vitest)**
- [ ] `lib/leads/notes-summary.ts`: Rollup logic (last/next interaction, pending items)
- [ ] Ordering rules for what appears in topline

**Integration (Vitest + API)**
- [ ] `api/leads/[id]/notes-summary/route.ts`: Returns computed summary
- [ ] Updates when new interaction/action added

**E2E (Playwright)**
- [ ] Open relationship detail → Notes Summary renders
- [ ] Create action → summary updates

**Manual**
- [ ] Readability check: summary is concise and not noisy

---

#### NEX-13: Meeting Notes Ingestion
**Unit (Vitest)**
- [ ] `lib/leads/interaction-extraction.ts`: Extraction produces expected structure
- [ ] Validation: empty input, huge input, weird encoding

**Integration (Vitest + API)**
- [ ] `api/leads/[id]/meeting-notes/route.ts`: Stores metadata + writes extracted actions
- [ ] Idempotency: re-upload same doc doesn't duplicate actions

**E2E (Playwright)**
- [ ] Upload sample transcript → actions appear in Actions and Notes Summary

**Manual**
- [ ] Extraction quality review across 5-10 real transcripts

---

#### NEX-14: Multi-calendar Free/Busy Aggregation
**Unit (Vitest)**
- [ ] `lib/calendar/aggregate-freebusy.ts`: Merges busy slots across calendars
- [ ] `lib/calendar/aggregate-freebusy.ts`: Confidence rules (based on N calendars)

**Integration (Vitest + API)**
- [ ] `api/calendar/freebusy/route.ts`: Returns merged availability + calendar count

**E2E (Playwright)**
- [ ] Seed 2 calendars → verify capacity reflects aggregation

**Manual**
- [ ] Connect/disconnect real Google + Outlook accounts in staging

---

#### NEX-15: Channel Awareness & Nudges
**Unit (Vitest)**
- [ ] `lib/leads/channel-nudges.ts`: Stall detection + escalation suggestion rules

**Integration (Vitest + API)**
- [ ] `api/leads/stalled-conversations/route.ts`: Returns stalled relationships
- [ ] Decision engine uses preferred channel in recommendations

**E2E (Playwright)**
- [ ] Set preferred channel → simulate stall → verify UI suggests escalation

**Manual**
- [ ] Copy review: suggestions feel appropriate and not spammy

---

## Implementation Plan

### Phase 1: Foundation (Day 1 - Tomorrow)
**Goal**: Set up testing infrastructure and run first automated tests

1. **Install Vitest**
   ```bash
   cd web
   npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
   ```

2. **Create Vitest config**
   - `web/vitest.config.ts`
   - Configure for TypeScript, React, path aliases

3. **Add database reset/seed script**
   - `scripts/test-db-reset.sh`
   - Resets staging test DB and seeds fixtures

4. **Add test data attributes**
   - Add `data-testid` to critical UI elements (Today, Relationships, Settings)
   - See "Test IDs to Add" section below

5. **Create Playwright setup project**
   - `web/tests/setup/auth.setup.ts`
   - Logs in and saves `storageState.json` for reuse

6. **Write first critical tests**
   - NEX-9: Reverse trial + paywall (E2E)
   - NEX-16: Idempotency (Integration)
   - NEX-6: Best Action (Unit + E2E)

### Phase 2: Core Features (Day 2-3)
**Goal**: Cover all P0 features with automated tests

1. Complete P0 test suite
2. Set up CI pipeline (GitHub Actions)
3. Add test reporting (Playwright HTML, Vitest coverage)

### Phase 3: Extended Coverage (Day 4-5)
**Goal**: Add P1 tests and polish

1. Complete P1 test suite
2. Add component tests for complex UI
3. Document manual testing checklist

---

## Test IDs to Add

Add `data-testid` attributes to these critical UI elements:

### Today Page
- `data-testid="best-action-card"`
- `data-testid="duration-selector"`
- `data-testid="duration-5min"`, `duration-10min`, `duration-15min`
- `data-testid="best-action-{action-id}"`

### Relationships Page
- `data-testid="relationship-row-{id}"`
- `data-testid="relationship-status-{id}"`
- `data-testid="add-relationship-button"`

### Settings Page
- `data-testid="calendar-list"`
- `data-testid="calendar-item-{id}"`
- `data-testid="disconnect-calendar-{id}"`
- `data-testid="connect-google-calendar"`
- `data-testid="connect-outlook-calendar"`

### Actions Page
- `data-testid="action-row-{id}"`
- `data-testid="set-time-estimate-{id}"`
- `data-testid="action-lane-{id}"`

### Billing/Paywall
- `data-testid="paywall-overlay"`
- `data-testid="upgrade-button"`
- `data-testid="trial-status"`

---

## Database Reset & Seeding Strategy

### For Staging Tests
Create `scripts/test-db-reset.sh`:
1. Connect to staging Supabase (via service role)
2. Delete test users (email pattern: `test+*@example.com` or `playwright+*@*`)
3. Seed deterministic fixtures:
   - Test user with Standard trial
   - Test user with Premium subscription
   - Test user with Free tier
   - Sample relationships with different cadences
   - Sample actions in different lanes
   - Sample calendar connections

### For Local Tests (Optional)
Use Supabase local:
1. `supabase db reset` (applies all migrations)
2. Run seed script: `supabase db seed`

---

## CI Pipeline (GitHub Actions)

### On Every PR
```yaml
- Lint + typecheck (already exists)
- Unit tests (Vitest) - fast, no DB needed
- Integration tests (Vitest + Supabase) - requires DB reset/seed
- Playwright smoke (5-10 critical tests) - against staging
```

### Nightly
```yaml
- Full Playwright suite (all browsers)
- Upload HTML report + traces on failure
- Coverage report (Vitest)
```

---

## Manual Testing Checklist

Keep this disciplined. Automate what's stable; manually verify what's inherently external:

1. **OAuth Consent Flows**
   - Gmail/Outlook/Google/Azure consent screens
   - Refresh token behavior
   - Provider-specific quirks

2. **Email Deliverability**
   - DMARC/DKIM configuration
   - Spam placement testing
   - Mobile email rendering

3. **Real Stripe Transactions**
   - One small live purchase after any billing change
   - Verify webhook delivery
   - Check for duplicate charges

4. **Cross-Device UX**
   - Mobile Safari testing
   - Accessibility spot checks (keyboard navigation, screen readers)

5. **Decision Engine Calibration**
   - "Does this feel right?" using real account data
   - Score distribution review
   - Lane assignment sanity check

---

## Minimum Launch-Ready Suite

**Non-negotiable automated tests before launch:**

1. ✅ Reverse trial + paywall gating (NEX-9)
2. ✅ Stripe webhook replay/idempotency (NEX-16)
3. ✅ Today Best Action selection + completion (NEX-6)
4. ✅ Relationship cadence → due status (NEX-5)
5. ✅ Calendar disconnect doesn't corrupt state (NEX-17)
6. ✅ Duration selector filters correctly (NEX-8)

**Estimated Time**: 2-3 days to implement all P0 tests

---

## Next Steps (Tomorrow)

1. **Morning**: Set up Vitest + write first unit tests
2. **Afternoon**: Add test IDs + write first E2E tests for NEX-9 (billing)
3. **End of Day**: Run full test suite against staging, document any failures

---

## Appendix: Test File Structure

```
web/
├── tests/
│   ├── unit/                    # Vitest unit tests
│   │   ├── decision-engine/
│   │   │   ├── scoring.test.ts
│   │   │   ├── lanes.test.ts
│   │   │   └── duration-filter.test.ts
│   │   ├── billing/
│   │   │   ├── tier.test.ts
│   │   │   └── idempotency.test.ts
│   │   └── leads/
│   │       └── relationship-status.test.ts
│   ├── integration/             # Vitest integration tests
│   │   ├── api/
│   │   │   ├── decision-engine.test.ts
│   │   │   ├── billing.test.ts
│   │   │   └── leads.test.ts
│   │   └── db/
│   │       └── migrations.test.ts
│   ├── e2e/                     # Playwright E2E tests
│   │   ├── critical-paths/      # (already exists)
│   │   ├── features/
│   │   │   ├── nex-5-cadence.spec.ts
│   │   │   ├── nex-6-best-action.spec.ts
│   │   │   ├── nex-8-duration-selector.spec.ts
│   │   │   ├── nex-9-billing.spec.ts
│   │   │   └── nex-17-multi-calendar.spec.ts
│   │   └── setup/
│   │       └── auth.setup.ts
│   ├── fixtures/                # Test data fixtures
│   │   ├── users.ts
│   │   ├── relationships.ts
│   │   └── actions.ts
│   └── helpers/                 # Test utilities
│       ├── auth.ts              # (already exists)
│       ├── db-reset.ts
│       └── test-data.ts         # (already exists)
├── vitest.config.ts
└── playwright.config.ts         # (already exists)
```

---

## Notes & Considerations

### Staging Environment Constraints
- **Basic Auth**: Tests must include credentials in `httpCredentials`
- **Shared DB**: Tests must clean up after themselves or use unique test data
- **Rate Limits**: Supabase email sending has rate limits (run tests sequentially)

### Test Data Isolation
- Use unique email patterns: `playwright+{timestamp}@example.com`
- Clean up test users after each test run
- Use deterministic fixtures for predictable test results

### Performance
- Unit tests: < 1 second each
- Integration tests: < 5 seconds each
- E2E tests: < 30 seconds each (target)

### Flakiness Prevention
- **Never** rely on timing (use `waitFor` instead of `sleep`)
- **Always** wait for elements to be visible before interacting
- **Always** reset DB state between tests
- **Never** share state between tests

---

## Success Metrics

After implementation, we should have:
- ✅ 20+ unit tests (decision engine, billing, utilities)
- ✅ 10+ integration tests (API routes, DB operations)
- ✅ 10+ E2E tests (critical user flows)
- ✅ CI pipeline running tests on every PR
- ✅ Test coverage report (aim for 60%+ on critical paths)
- ✅ < 5 minute test suite runtime (unit + integration)
- ✅ < 15 minute E2E suite runtime

---

_Last Updated: 2025-12-24_

