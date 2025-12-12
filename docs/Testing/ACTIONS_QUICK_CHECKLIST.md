# Action Engine - Quick Test Checklist

**Component:** Action engine core  
**Quick smoke test for rapid validation**

---

## Prerequisites

- ✅ User signed in
- ✅ Test actions created (see ACTIONS_SMOKE_TEST.md Setup section)

---

## Quick Tests (5 min)

1. **View Actions Page**
   - Navigate to `/app/actions`
   - ✅ Page loads, shows actions list

2. **Action Card Display**
   - ✅ Action cards show type badges
   - ✅ Buttons display correctly (FOLLOW_UP has "Got reply", CONTENT has "View prompt", etc.)

3. **Complete Action**
   - Click "Done" on any action
   - ✅ Action state updates, disappears from list

4. **Follow-Up Flow**
   - Click "Done - Got reply" on FOLLOW_UP action
   - ✅ Modal opens with 3 options
   - ✅ Click "Schedule follow-up"
   - ✅ Scheduling modal opens, defaults to 3 days
   - ✅ Submit works

5. **Snooze Action**
   - Click "Snooze" on any action
   - ✅ Modal opens, defaults to 7 days
   - ✅ Submit works

6. **Add Note**
   - Click "Add note" on any action
   - ✅ Modal opens
   - ✅ Save works, note appears on card

---

## All Tests Pass? ✅

If all quick tests pass, the Action engine core is working correctly!








