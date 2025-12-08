# Local Testing Guide: Action Auto-Generation

**Last Updated:** 2025-12-08  
**Status:** Ready for Testing

---

## Overview

This guide covers testing the new action auto-generation features that were implemented for launch:
- FOLLOW_UP auto-creation
- Action generation limits
- Action cleanup (manual testing)

---

## Prerequisites

1. **Local environment running:**
   ```bash
   cd web && npm run dev
   ```

2. **Supabase local or remote connection configured**
   - Database schema up to date
   - User account created and logged in

3. **Test user account:**
   - At least 2-3 test leads
   - Some existing actions

---

## Test 1: FOLLOW_UP Auto-Creation

### Steps:

1. **Navigate to Actions page** (`/app/actions`)

2. **Find an OUTREACH action** that's in NEW state

3. **Click "Done - Got a reply"** button on the action card

4. **Expected Behavior:**
   - ✅ Action state immediately changes to REPLIED
   - ✅ Toast notification appears: "✓ Follow-up scheduled for [date]."
   - ✅ Toast has "Adjust" button
   - ✅ New FOLLOW_UP action appears in actions list
   - ✅ FOLLOW_UP has due date 2 days from today
   - ✅ FOLLOW_UP notes field contains: "Auto-created after reply on [date]"
   - ✅ No modal appears (zero-friction)

5. **Test "Adjust" button:**
   - Click "Adjust" in toast
   - Scheduling modal should open
   - Change the follow-up date
   - Save
   - Verify date was updated

6. **Test prevention logic:**
   - Try to mark another action as "Got a reply" for the same lead
   - If FOLLOW_UP already exists, should show info toast: "You already have a follow-up scheduled for this lead."

---

## Test 2: Action Generation Limits

### Setup:

1. **Create 15+ leads** to test the limit

### Steps:

1. **Add 15 new leads:**
   - Navigate to Leads page
   - Add 15 leads one by one
   - After each lead, check Actions page

2. **Expected Behavior:**
   - ✅ First 15 leads create OUTREACH actions
   - ✅ 16th lead and beyond: No OUTREACH action created (at limit)
   - ✅ Lead is still created successfully
   - ✅ Console logs: "User [id] is at action limit (15), skipping OUTREACH creation"

3. **Test FOLLOW_UP exception:**
   - Even at limit, mark an action as "Got a reply"
   - ✅ FOLLOW_UP should still be created (critical action, always allowed)

4. **Test limit clearing:**
   - Complete or archive some actions
   - Add another lead
   - ✅ OUTREACH should now be created (below limit)

---

## Test 3: Action Context Notes

### Steps:

1. **Check OUTREACH action notes:**
   - Navigate to Actions page
   - Find an OUTREACH action
   - Check the notes field
   - ✅ Should contain: "Auto-created when lead added on [date]"

2. **Check FOLLOW_UP action notes:**
   - Follow Test 1 to create a FOLLOW_UP
   - Check the notes field
   - ✅ Should contain: "Auto-created after reply on [date]"

3. **Verify UI displays notes:**
   - Action cards should show notes (if UI supports it)
   - Check that context is visible to users

---

## Test 4: Daily Plan Fallback Generation

### Steps:

1. **Clear all existing actions:**
   - Archive or complete all actions
   - Navigate to Daily Plan page

2. **Generate daily plan:**
   - Refresh or regenerate plan

3. **Expected Behavior:**
   - ✅ If no candidate actions exist, system creates OUTREACH actions from active leads
   - ✅ But stops if user is at 15 action limit
   - ✅ Created actions have notes: "Auto-created from daily plan generation on [date]"

---

## Test 5: Action Cleanup (Manual)

### Setup:

1. **Create a test stale action:**
   - Use database directly or create manually via API
   - Action should be:
     - `auto_created = true`
     - `state = 'NEW'`
     - `due_date = 8+ days ago`
     - `updated_at = created_at` (never modified)

### Steps:

1. **Call cleanup endpoint manually:**
   ```bash
   curl -X POST http://localhost:3000/api/cron/cleanup-stale-actions \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

2. **Expected Behavior:**
   - ✅ Stale action is archived (`state = 'ARCHIVED'`)
   - ✅ Notes updated: "Auto-archived: No user interaction within 7 days of due date"
   - ✅ Response shows count of archived actions

3. **Verify actions that should NOT be archived:**
   - Actions with `auto_created = false` (manual)
   - Actions that were snoozed or completed
   - Actions that were modified (updated_at != created_at)
   - Actions overdue by less than 7 days

---

## Expected Console Logs

### FOLLOW_UP Creation:
```
Error handling got reply: [any errors]
```

### Action Limits:
```
User [id] is at action limit (15), skipping OUTREACH creation for new lead [id]
```

### Daily Plan Fallback:
```
No candidate actions found, attempting to create actions from [N] active leads
Created [N] new actions from active leads
User [id] is at action limit, skipping OUTREACH creation from daily plan fallback
```

### Cleanup:
```
Successfully archived [N] stale actions
```

---

## Common Issues

### Issue: Toast notification doesn't appear
**Fix:** Check browser console for errors. Verify Toast component is imported and rendered.

### Issue: FOLLOW_UP not created
**Fix:** 
- Check browser console for errors
- Verify API endpoint `/api/actions` accepts `auto_created` parameter
- Check database constraints

### Issue: Action limit not working
**Fix:**
- Verify `getPendingActionCount` function works correctly
- Check that actions are in NEW or SNOOZED state
- Verify due_date filter is correct

### Issue: Cleanup endpoint returns 401
**Fix:**
- Set `CRON_SECRET` environment variable
- Verify Authorization header format: `Bearer ${CRON_SECRET}`

---

## Success Criteria

✅ **All tests pass:**
- FOLLOW_UP auto-creates without modal
- Toast notification appears with edit option
- Action limits prevent creating >15 actions
- FOLLOW_UP always allowed (exception)
- Context notes appear on all auto-created actions
- Cleanup endpoint archives stale actions correctly

---

## Next Steps After Local Testing

1. **If all tests pass:** Ready to push to staging
2. **If issues found:** Document and fix before staging
3. **Manual testing:** Follow same tests in staging environment
4. **Cron job setup:** Configure cleanup job in cron-job.org once in staging/production

