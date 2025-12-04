# Phase 3: API Endpoints - Test Guide

## Overview

This guide helps you test the new `/api/leads` endpoints and verify they work correctly after the migration from `/api/pins`.

---

## Prerequisites

- [ ] Application is running (`npm run dev` in the `web` directory)
- [ ] You have a test user account logged in
- [ ] Browser DevTools open (Network tab)
- [ ] You have some existing leads in the database (or can create new ones)

---

## Test Checklist

### Test 1: GET /api/leads - List All Leads

**Steps:**
1. Open browser DevTools → Network tab
2. Navigate to the Leads page (`/app/pins` - will be renamed in Phase 4)
3. Check the network request to `/api/leads`

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Response contains `{ leads: [...] }` (not `pins`)
- ✅ Each lead has: `id`, `name`, `url`, `status`, `created_at`, etc.
- ✅ Leads are ordered by `created_at` descending

**Manual Test:**
```bash
# Using curl (replace YOUR_AUTH_TOKEN with actual token)
curl -X GET http://localhost:3000/api/leads \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json"
```

---

### Test 2: GET /api/leads?status=ACTIVE - Filter by Status

**Steps:**
1. Add query parameter: `/api/leads?status=ACTIVE`
2. Check response

**Expected Results:**
- ✅ Only returns leads with `status: "ACTIVE"`
- ✅ No SNOOZED or ARCHIVED leads

**Test Other Statuses:**
- `/api/leads?status=SNOOZED` - Should return only snoozed leads
- `/api/leads?status=ARCHIVED` - Should return only archived leads
- `/api/leads?status=ALL` - Should return all leads (same as no filter)

---

### Test 3: POST /api/leads - Create New Lead

**Steps:**
1. Open the "Add Lead" modal (or use onboarding)
2. Fill in:
   - Name: "Test Lead"
   - URL: "https://linkedin.com/in/test-lead"
   - Notes: (optional)
3. Submit

**Expected Results:**
- ✅ Status: 201 Created
- ✅ Response contains `{ lead: {...} }` with the new lead
- ✅ Lead has `status: "ACTIVE"`
- ✅ An OUTREACH action is automatically created for the new lead
- ✅ Lead appears in the list after creation

**Manual Test:**
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "url": "https://linkedin.com/in/test-lead",
    "notes": "Test notes"
  }'
```

**Test URL Normalization:**
- Email without `mailto:` → Should auto-add `mailto:`
- LinkedIn URL → Should work as-is
- Invalid URL → Should return 400 error

---

### Test 4: POST /api/leads - Lead Limit Check

**Steps:**
1. For a Standard user with 10 active leads, try to create an 11th lead
2. Check response

**Expected Results:**
- ✅ Status: 403 Forbidden
- ✅ Error message: "Lead limit reached"
- ✅ Response includes `limitInfo` with `canAdd: false`, `currentCount: 10`, `limit: 10`

**For Premium User:**
- ✅ Should be able to create unlimited leads

---

### Test 5: GET /api/leads/[id] - Get Single Lead

**Steps:**
1. Get a lead ID from the list
2. Make request to `/api/leads/[id]`

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Response contains `{ lead: {...} }` with full lead data
- ✅ Only returns leads owned by the authenticated user

**Test Non-Existent Lead:**
- ✅ Status: 404 Not Found
- ✅ Error: "Lead not found"

---

### Test 6: PUT /api/leads/[id] - Update Lead

**Steps:**
1. Edit an existing lead
2. Change name, URL, or notes
3. Save

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Response contains updated `{ lead: {...} }`
- ✅ Changes are reflected in the database
- ✅ URL normalization works (email → mailto:)

**Test Validation:**
- Missing name or URL → Status: 400 Bad Request
- Invalid URL format → Status: 400 Bad Request

---

### Test 7: PATCH /api/leads/[id]/status - Update Status

**Test 7a: Snooze Lead**

**Steps:**
1. Select a lead
2. Click "Snooze"
3. Set snooze date (e.g., 7 days from now)
4. Submit

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Lead `status` changes to `"SNOOZED"`
- ✅ `snooze_until` is set to the specified date
- ✅ Lead disappears from active list

**Test 7b: Unsnooze Lead**

**Steps:**
1. Find a snoozed lead
2. Click "Unsnooze" or "Restore"

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Lead `status` changes to `"ACTIVE"`
- ✅ `snooze_until` is set to `null`
- ✅ Lead appears in active list

**Test 7c: Archive Lead**

**Steps:**
1. Select a lead
2. Click "Archive"

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Lead `status` changes to `"ARCHIVED"`
- ✅ Lead disappears from active list

**Test 7d: Restore Archived Lead**

**Steps:**
1. Filter to show archived leads
2. Select an archived lead
3. Click "Restore"

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Lead `status` changes to `"ACTIVE"`
- ✅ Lead appears in active list

**Test Validation:**
- Missing `status` → Status: 400 Bad Request
- Invalid status value → Status: 400 Bad Request
- SNOOZED without `snooze_until` → Status: 400 Bad Request

---

### Test 8: DELETE /api/leads/[id] - Delete Lead

**Steps:**
1. Select a lead
2. Delete it (if delete functionality exists)

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Response: `{ success: true }`
- ✅ Lead is removed from database
- ✅ Associated actions are set to `person_id: null` (due to ON DELETE SET NULL)

**Note:** Check if delete functionality exists in UI. If not, test via API directly.

---

### Test 9: GET /api/billing/check-lead-limit - Check Limit

**Steps:**
1. Navigate to leads page
2. Check network request when opening "Add Lead" modal

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Response contains:
  ```json
  {
    "canAdd": true/false,
    "currentCount": 5,
    "limit": 10,
    "plan": "standard" | "premium"
  }
  ```

**For Standard User:**
- ✅ `limit: 10`
- ✅ `canAdd: false` when `currentCount >= 10`

**For Premium User:**
- ✅ `limit: Infinity` (or very large number)
- ✅ `canAdd: true` always

---

### Test 10: Auto-Create Action on Lead Creation

**Steps:**
1. Create a new lead
2. Check the actions table/API

**Expected Results:**
- ✅ An OUTREACH action is automatically created
- ✅ Action has `person_id` set to the new lead's ID
- ✅ Action has `auto_created: true`
- ✅ Action has `state: "NEW"`
- ✅ Action description: "Reach out to [Lead Name]"

---

### Test 11: Database Table References

**Verify all API endpoints use `leads` table:**

**Check these files use `.from("leads")`:**
- ✅ `/api/leads/route.ts`
- ✅ `/api/leads/[id]/route.ts`
- ✅ `/api/leads/[id]/status/route.ts`
- ✅ `/api/actions/route.ts`
- ✅ `/api/billing/webhook/route.ts`
- ✅ `/api/cron/auto-unsnooze/route.ts`
- ✅ All notification routes
- ✅ All other API routes that reference leads

**Manual Verification:**
```bash
# Search for any remaining person_pins references in API files
grep -r "person_pins" web/src/app/api/
```

Should only find references in:
- Old `/api/pins` routes (deprecated, can be removed)
- Comments

---

### Test 12: Supabase Relations

**Verify relation queries use `leads`:**

**Check these files use `leads (` in relation queries:**
- ✅ `/api/daily-plans/route.ts`
- ✅ `/api/notifications/*/route.ts`
- ✅ `/api/insights/stale-actions/route.ts`
- ✅ `/lib/plans/generate-daily-plan.ts`

**Expected:**
- ✅ Relation queries use `leads (` not `person_pins (`
- ✅ Response objects have `leads` property (not `person_pins`)
- ✅ Code accessing the relation uses `action.leads` (not `action.person_pins`)

---

## Common Issues & Solutions

### Issue: "relation 'person_pins' does not exist"

**Cause:** API endpoint still references old table name.

**Solution:** Check the API file and update `.from("person_pins")` to `.from("leads")`.

---

### Issue: "Cannot read property 'leads' of undefined"

**Cause:** Code expects `action.leads` but Supabase returns `action.person_pins`.

**Solution:** Update relation query to use `leads (` instead of `person_pins (`.

---

### Issue: Response has `pins` instead of `leads`

**Cause:** GET endpoint still returns `{ pins: [...] }`.

**Solution:** Update `/api/leads/route.ts` to return `{ leads: [...] }`.

---

### Issue: 404 on `/api/leads`

**Cause:** Route file doesn't exist or Next.js hasn't picked up the new route.

**Solution:**
1. Verify file exists: `web/src/app/api/leads/route.ts`
2. Restart Next.js dev server
3. Check file structure matches Next.js App Router conventions

---

## Success Criteria

✅ All GET requests return `{ leads: [...] }`  
✅ All POST requests return `{ lead: {...} }`  
✅ All database queries use `leads` table  
✅ All relation queries use `leads (`  
✅ Lead limit check works for Standard users  
✅ Auto-create action works on lead creation  
✅ Status updates (snooze/archive/restore) work  
✅ URL normalization works (email → mailto:)  
✅ No errors in browser console  
✅ No errors in server logs  

---

## Quick Test Script

Run this in your browser console while on the leads page:

```javascript
// Test GET /api/leads
fetch('/api/leads')
  .then(r => r.json())
  .then(data => {
    console.log('✅ GET /api/leads:', data);
    console.log('Has leads property:', 'leads' in data);
    console.log('Lead count:', data.leads?.length || 0);
  })
  .catch(err => console.error('❌ Error:', err));

// Test POST /api/leads (create new lead)
fetch('/api/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Lead ' + Date.now(),
    url: 'https://linkedin.com/in/test-lead',
    notes: 'Test from console'
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('✅ POST /api/leads:', data);
    console.log('Has lead property:', 'lead' in data);
  })
  .catch(err => console.error('❌ Error:', err));

// Test check-lead-limit
fetch('/api/billing/check-lead-limit')
  .then(r => r.json())
  .then(data => {
    console.log('✅ GET /api/billing/check-lead-limit:', data);
    console.log('Can add:', data.canAdd);
    console.log('Current count:', data.currentCount);
    console.log('Limit:', data.limit);
  })
  .catch(err => console.error('❌ Error:', err));
```

---

**Test Date:** 2025-12-04  
**Status:** Ready for Testing

