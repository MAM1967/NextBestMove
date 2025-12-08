# Action Auto-Generation Implementation Plan
## NextBestMove v0.1 Launch - Jan 1, 2026

**Created:** 2025-12-08  
**Status:** Awaiting Approval  
**Target Launch:** Jan 1, 2026

---

## Executive Summary

This plan implements **critical auto-generation features** required for launch, focusing on actions that directly drive revenue. Non-essential enhancements are moved to post-launch backlog.

**Launch Requirements:**
- ✅ OUTREACH (already implemented)
- ⚠️ FOLLOW_UP (must have - core revenue driver)
- ✅ Basic flood protection (prevent user overload)
- ✅ Action cleanup (prevent list bloat)

**Post-Launch (P2 Backlog):**
- POST_CALL (requires calendar event detection)
- CALL_PREP (requires calendar event detection)
- NURTURE (enhancement, not critical)
- CONTENT actions (enhancement, not critical)

---

## Phase 1: Launch Requirements (Must Have)

### 1.1 FOLLOW_UP Auto-Creation ⚠️ CRITICAL

**Status:** Not implemented (TODO exists)  
**Priority:** P0 - Required for launch  
**Estimated Time:** 3-4 hours  
**Revenue Impact:** ⭐⭐⭐⭐⭐

**Requirements:**
- When user marks action as "Got a reply", automatically create FOLLOW_UP action
- No modal, no user decision required (zero friction)
- Smart default due date: 2-3 days out
- Show toast notification: "✓ Follow-up scheduled for [date]. [Adjust]"
- User can click "Adjust" to change date if needed

**Implementation Steps:**
1. Update `/app/app/actions/page.tsx` - Remove modal, auto-create on "Got a reply"
2. Create follow-up action via `/api/actions` endpoint
3. Add toast notification component
4. Store context in `notes`: "Auto-created after reply on [date]"

**Acceptance Criteria:**
- [ ] User clicks "Got a reply" → FOLLOW_UP action created immediately
- [ ] No modal appears
- [ ] Toast shows with follow-up date
- [ ] User can adjust date via toast link
- [ ] Action appears in daily plan on due date
- [ ] Only one FOLLOW_UP per lead at a time (prevention logic)

**Files to Modify:**
- `web/src/app/app/actions/page.tsx` - Remove TODO, implement auto-creation
- `web/src/app/api/actions/route.ts` - Verify POST endpoint supports auto-created actions
- Add toast component if not exists

---

### 1.2 Action Generation Limits (Flood Protection) ❌

**Status:** Not implemented  
**Priority:** P0 - Required for launch  
**Estimated Time:** 2-3 hours  
**Revenue Impact:** ⭐⭐⭐ (Prevents user churn)

**Requirements:**
- Maximum 15 pending actions per user
- Before creating new actions, check existing pending count
- If user has 15+ pending actions, skip generation (except critical: FOLLOW_UP)
- Prioritize action creation by revenue impact

**Implementation Steps:**
1. Create helper function `getPendingActionCount(userId)`
2. Add check before auto-creating OUTREACH actions (in `/api/leads/route.ts`)
3. Add check in daily plan generator (in `generate-daily-plan.ts`)
4. Add check before FOLLOW_UP creation (FOLLOW_UP always allowed - critical)

**Acceptance Criteria:**
- [ ] User with 15+ pending actions doesn't get new OUTREACH actions
- [ ] FOLLOW_UP actions always created (critical)
- [ ] System logs when limit reached
- [ ] Daily plan still generates correctly when at limit

**Files to Modify:**
- `web/src/app/api/leads/route.ts` - Add limit check before OUTREACH creation
- `web/src/lib/plans/generate-daily-plan.ts` - Add limit check in fallback generation
- Create helper: `web/src/lib/actions/limits.ts`

---

### 1.3 Action Cleanup Job ❌

**Status:** Not implemented  
**Priority:** P0 - Required for launch  
**Estimated Time:** 2-3 hours  
**Revenue Impact:** ⭐⭐⭐ (Prevents user churn)

**Requirements:**
- Daily cleanup job that archives stale auto-created actions
- Archive actions that are:
  - Auto-created (`auto_created = true`)
  - Overdue by 7+ days
  - Never interacted with (state = NEW, `updated_at = created_at`)
- Add note: "Auto-archived: No user interaction within 7 days of due date"

**Implementation Steps:**
1. Create `/api/cron/cleanup-stale-actions` endpoint
2. Configure Vercel cron in `vercel.json` (runs daily at 2 AM UTC)
3. Query and archive stale actions
4. Add logging for monitoring

**Acceptance Criteria:**
- [ ] Cron job runs daily
- [ ] Stale auto-created actions (7+ days overdue, no interaction) are archived
- [ ] Manually created actions are not archived
- [ ] Actions that were snoozed/completed are not archived
- [ ] System logs cleanup activity

**Files to Create/Modify:**
- `web/src/app/api/cron/cleanup-stale-actions/route.ts` - New file
- `vercel.json` - Add cron configuration

**Vercel Cron Config:**
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-stale-actions",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

### 1.4 Action Context in Notes ⚠️ PARTIAL

**Status:** Partially implemented (some actions have notes)  
**Priority:** P0 - Required for launch  
**Estimated Time:** 1-2 hours  
**Revenue Impact:** ⭐⭐ (Builds trust)

**Requirements:**
- Store context in action `notes` field for auto-created actions:
  - FOLLOW_UP: "Auto-created after reply on [date]"
  - OUTREACH: "Auto-created when lead added on [date]" (if not already present)
- Display context in UI (gray text below action description)
- Helps users understand why actions exist

**Implementation Steps:**
1. Update FOLLOW_UP creation to add context note
2. Verify OUTREACH creation includes context note
3. Update ActionCard component to display notes (if not already)

**Acceptance Criteria:**
- [ ] All auto-created actions have context in notes field
- [ ] Context is displayed in action cards
- [ ] Context helps users understand system behavior

**Files to Modify:**
- `web/src/app/app/actions/page.tsx` - Add context when creating FOLLOW_UP
- `web/src/app/api/leads/route.ts` - Verify OUTREACH includes context
- `web/src/app/app/actions/ActionCard.tsx` - Display notes if not already

---

## Phase 2: Post-Launch Backlog (P2)

The following features are **not required for launch** but provide value post-launch. They are moved to P2 backlog for implementation after Jan 1, 2026.

### 2.1 POST_CALL Auto-Creation ❌

**Status:** Not implemented  
**Priority:** P2 - Post-launch  
**Estimated Time:** 4-6 hours  
**Revenue Impact:** ⭐⭐⭐⭐

**Why Post-Launch:**
- Requires calendar event detection and real-time processing
- Calendar integration needs to be stable first
- Can be added in first post-launch sprint

**Requirements:**
- Real-time creation when call ends
- Detect ended calls from calendar events
- Create POST_CALL action immediately
- Invalidate daily plan cache

---

### 2.2 CALL_PREP Auto-Creation ❌

**Status:** Not implemented  
**Priority:** P2 - Post-launch  
**Estimated Time:** 4-6 hours  
**Revenue Impact:** ⭐⭐⭐⭐

**Why Post-Launch:**
- Requires hourly cron with timezone awareness
- Requires calendar event detection (24h before calls)
- More complex than FOLLOW_UP/OUTREACH
- Can be added after validating calendar integration works

**Requirements:**
- Hourly cron with timezone filtering
- Detect calls 24 hours in advance
- Create CALL_PREP action day before call
- Match calendar events to leads

---

### 2.3 NURTURE Auto-Creation ❌

**Status:** Not implemented  
**Priority:** P2 - Post-launch  
**Estimated Time:** 3-4 hours  
**Revenue Impact:** ⭐⭐⭐

**Why Post-Launch:**
- Enhancement, not critical for revenue
- Requires lead engagement history tracking
- Can wait until core flow is validated

**Requirements:**
- Daily cron to detect stale leads (21+ days)
- Create NURTURE actions (max 3 per day)
- Prioritize by engagement history
- Handle returning users gracefully

---

### 2.4 CONTENT Action Conversion ❌

**Status:** Not implemented  
**Priority:** P2 - Post-launch  
**Estimated Time:** 2-3 hours  
**Revenue Impact:** ⭐⭐

**Why Post-Launch:**
- Lowest revenue impact
- Content prompts already exist in weekly summaries
- Users can manually create CONTENT actions if needed

**Requirements:**
- Convert weekly summary content prompts to CONTENT actions
- Spread across week (Monday/Wednesday)
- Link to content_prompts table

---

## Implementation Timeline

### Week 1: Launch Requirements (3-4 days)

**Day 1-2: FOLLOW_UP Auto-Creation**
- Implement auto-creation logic
- Remove modal, add toast notification
- Test with real user flows

**Day 2-3: Action Generation Limits**
- Implement pending action count check
- Add limits to OUTREACH creation
- Add limits to daily plan fallback

**Day 3: Action Cleanup Job**
- Create cron endpoint
- Configure Vercel cron
- Test cleanup logic

**Day 4: Action Context & Polish**
- Add context notes to all auto-created actions
- Verify UI displays context
- End-to-end testing

**Total Estimated Time:** 8-12 hours

---

## Testing Requirements

### Automated Tests (Playwright)

**Test 1: FOLLOW_UP Auto-Creation**
```typescript
test('creates follow-up when user marks action as replied', async ({ page }) => {
  await addLead(page, 'Sarah Johnson');
  await completeAction(page, 'OUTREACH', 'Got a reply');
  
  // Should auto-create follow-up
  const followUp = await getActionByType(page, 'FOLLOW_UP');
  expect(followUp).toBeDefined();
  expect(followUp.dueDate).toBe(addDays(new Date(), 2));
  expect(followUp.notes).toContain('Auto-created after reply');
});
```

**Test 2: Action Limits**
```typescript
test('respects pending action limit', async ({ page }) => {
  // Create 15 pending actions
  for (let i = 0; i < 15; i++) {
    await addLead(page, `Lead ${i}`);
  }
  
  // Try to add another lead
  await addLead(page, 'Should Not Create');
  
  // Should not create OUTREACH for 16th lead
  const actions = await getActions(page);
  expect(actions.filter(a => a.type === 'OUTREACH').length).toBe(15);
});
```

**Test 3: Action Cleanup**
```typescript
test('archives stale auto-created actions', async ({ page }) => {
  // Create auto-created action with old due date
  const oldAction = await createAction({
    type: 'OUTREACH',
    dueDate: subDays(new Date(), 8),
    autoCreated: true,
    state: 'NEW'
  });
  
  // Trigger cleanup job
  await triggerCleanupJob();
  
  // Action should be archived
  const action = await getAction(oldAction.id);
  expect(action.state).toBe('ARCHIVED');
});
```

### Manual Testing Checklist

**Scenario 1: Follow-Up Flow**
- [ ] Add lead → OUTREACH created
- [ ] Complete OUTREACH → mark "Got a reply"
- [ ] FOLLOW_UP auto-created immediately
- [ ] Toast notification appears
- [ ] Can adjust follow-up date
- [ ] Follow-up appears in daily plan on due date

**Scenario 2: Action Limits**
- [ ] Add 15 leads → 15 OUTREACH actions created
- [ ] Add 16th lead → no OUTREACH created (limit reached)
- [ ] Mark action "Got a reply" → FOLLOW_UP still created (exception)

**Scenario 3: Cleanup**
- [ ] Create auto-created action with old due date (8 days ago)
- [ ] Wait for cleanup cron (or trigger manually)
- [ ] Action is archived
- [ ] Manually created action is NOT archived

---

## Success Metrics

### Launch Criteria

- ✅ FOLLOW_UP auto-creation works for 100% of "Got a reply" events
- ✅ Action limits prevent users from having >15 pending actions
- ✅ Cleanup job runs daily and archives stale actions
- ✅ All auto-created actions have context notes
- ✅ Zero manual action creation needed for core flows

### Post-Launch Metrics (Week 1)

- **Follow-Up Completion Rate:** Target >70%
- **Action Generation Rate:** 1-2 new actions per day per active lead
- **Action Completion Rate:** Target >60% overall
- **User Engagement:** Days active per week, actions completed

---

## Risk Assessment

### High Risk

**None** - Launch requirements are straightforward implementations of existing patterns.

### Medium Risk

1. **Toast Notification Component**
   - Risk: May not exist, need to implement or use library
   - Mitigation: Use existing UI library (Tailwind UI, shadcn/ui, etc.)

2. **Vercel Cron Configuration**
   - Risk: Cron may not work as expected in production
   - Mitigation: Test thoroughly in staging, monitor first few runs

### Low Risk

1. **Action Limit Logic**
   - Risk: Edge cases with concurrent action creation
   - Mitigation: Use database transactions, add locks if needed

---

## Dependencies

### External Dependencies

- ✅ Vercel Cron (already available)
- ✅ Existing `/api/actions` endpoint (already exists)
- ✅ Supabase database (already configured)

### Internal Dependencies

- ✅ Action state machine (already implemented)
- ✅ Daily plan generator (already implemented)
- ⚠️ Toast notification component (may need to create)

---

## Approval Required

**This implementation plan requires approval before proceeding.**

**Launch Requirements (Must Approve):**
- [ ] FOLLOW_UP auto-creation
- [ ] Action generation limits
- [ ] Action cleanup job
- [ ] Action context notes

**Post-Launch Backlog (No Action Needed):**
- POST_CALL, CALL_PREP, NURTURE, CONTENT moved to P2

**Questions for Approval:**
1. Do you approve the launch requirements as sufficient for Jan 1, 2026 launch?
2. Are there any launch requirements you'd like to add or remove?
3. Should we proceed with implementation after approval?

---

## Appendix: P2 Backlog Items

### POST_CALL Implementation (Post-Launch)

**Estimated Time:** 4-6 hours  
**Complexity:** Medium  
**Dependencies:** Calendar integration stable

**Implementation Notes:**
- Real-time creation when call ends
- Calendar event detection
- Cache invalidation

---

### CALL_PREP Implementation (Post-Launch)

**Estimated Time:** 4-6 hours  
**Complexity:** Medium-High  
**Dependencies:** Calendar integration stable, hourly cron

**Implementation Notes:**
- Hourly cron with timezone filtering
- 24h pre-call detection
- Lead matching logic

---

### NURTURE Implementation (Post-Launch)

**Estimated Time:** 3-4 hours  
**Complexity:** Medium  
**Dependencies:** Lead engagement tracking

**Implementation Notes:**
- Daily cron for stale lead detection
- Max 3 per day limit
- Prioritization logic

---

### CONTENT Action Conversion (Post-Launch)

**Estimated Time:** 2-3 hours  
**Complexity:** Low  
**Dependencies:** Weekly summary generation

**Implementation Notes:**
- Convert prompts to actions
- Spread across week
- Link to content_prompts

