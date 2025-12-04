# Phase 4: UI Components - Test Guide

## Overview
This guide tests the UI component refactoring from "pins" to "leads" terminology.

## Prerequisites
- User account (Standard or Premium)
- Browser with developer console open
- Access to the application

## Test Checklist

### 1. Navigation & Routing
- [ ] Navigate to `/app/leads` - should load successfully
- [ ] Check navigation menu - should show "Leads" link (not "Pins")
- [ ] Click "Leads" in navigation - should route to `/app/leads`
- [ ] Verify old `/app/pins` route (if it exists) - should redirect or show 404

### 2. Leads Page - Display
- [ ] Page title shows "Leads" (not "Pinned People")
- [ ] Page description uses "leads" terminology
- [ ] Loading state shows "Loading leads..." (not "Loading pins...")
- [ ] Empty state shows "No leads yet. Add your first lead to get started."
- [ ] Lead list displays correctly with all leads

### 3. Lead Filtering
- [ ] Filter toggle shows: All, Active, Snoozed, Archived
- [ ] Click "All" - shows all leads
- [ ] Click "Active" - shows only active leads
- [ ] Click "Snoozed" - shows only snoozed leads
- [ ] Click "Archived" - shows only archived leads

### 4. Add Lead Modal
- [ ] Click floating action button - should show "Add Lead" label
- [ ] Modal opens with title "Add Lead" (not "Pin a Person")
- [ ] Form fields: Name, URL or Email, Notes (optional)
- [ ] Submit button shows "Save Lead" (not "Save Pin")
- [ ] Successfully create a new lead
- [ ] Modal closes after successful creation
- [ ] New lead appears in the list

### 5. Edit Lead Modal
- [ ] Click "View/Edit" on a lead
- [ ] Modal opens with title "Edit Lead" (not "Edit Person")
- [ ] Form is pre-filled with lead data
- [ ] Update lead information
- [ ] Click "Save Changes"
- [ ] Changes are saved and reflected in the list

### 6. Snooze Lead
- [ ] Click "Snooze" on an active lead
- [ ] Modal opens with title "Snooze Lead" (not "Snooze Pin")
- [ ] Select a future date
- [ ] Click "Snooze"
- [ ] Lead status changes to "SNOOZED"
- [ ] Lead shows snooze date in status badge

### 7. Unsnooze Lead
- [ ] Click "Unsnooze" on a snoozed lead
- [ ] Lead status changes to "ACTIVE"
- [ ] Lead appears in active filter

### 8. Archive Lead
- [ ] Click "Archive" on an active or snoozed lead
- [ ] Lead status changes to "ARCHIVED"
- [ ] Lead appears in archived filter
- [ ] Archived lead shows reduced opacity

### 9. Restore Lead
- [ ] Click "Restore" on an archived lead
- [ ] Lead status changes to "ACTIVE"
- [ ] Lead appears in active filter

### 10. Lead Limit (Standard Plan)
- [ ] As Standard user, add leads up to limit (10)
- [ ] Try to add 11th lead
- [ ] Upgrade modal should appear
- [ ] Modal title: "You've reached your lead limit" (not "pin limit")
- [ ] Modal description uses "leads" terminology
- [ ] Shows current count and limit correctly

### 11. Error Messages
- [ ] Try to create lead with invalid data
- [ ] Error messages use "lead" terminology (not "pin")
- [ ] Network errors show appropriate "lead" messaging

### 12. Console & Network
- [ ] Open browser console - check for errors
- [ ] Open Network tab
- [ ] Verify API calls go to `/api/leads` (not `/api/pins`)
- [ ] Check API responses use `leads` property (not `pins`)

### 13. Downgrade Warning (if applicable)
- [ ] As Premium user with >10 leads, downgrade to Standard
- [ ] Downgrade warning modal should appear
- [ ] Modal uses "leads" terminology throughout
- [ ] Button says "Manage Leads Now" (not "Manage Pins Now")

### 14. Onboarding Flow
- [ ] Complete onboarding as new user
- [ ] Step 2 should reference "leads" (not "pins")
- [ ] Onboarding completion works correctly

## Expected Results

### API Endpoints
- `GET /api/leads` - Returns `{ leads: [...] }`
- `POST /api/leads` - Creates lead, returns `{ lead: {...} }`
- `PUT /api/leads/[id]` - Updates lead, returns `{ lead: {...} }`
- `PATCH /api/leads/[id]/status` - Updates status, returns `{ lead: {...} }`
- `GET /api/billing/check-lead-limit` - Returns lead limit info

### UI Text
All user-facing text should use "lead" or "leads" terminology:
- ✅ "Leads" (not "Pins")
- ✅ "Add Lead" (not "Pin a Person")
- ✅ "Edit Lead" (not "Edit Person")
- ✅ "Snooze Lead" (not "Snooze Pin")
- ✅ "Save Lead" (not "Save Pin")
- ✅ "Loading leads..." (not "Loading pins...")
- ✅ "No leads yet..." (not "No pins found...")

## Troubleshooting

### Issue: Page not loading
- Check browser console for errors
- Verify `/app/leads` route exists
- Check network tab for failed requests

### Issue: API errors
- Verify API routes are updated to `/api/leads`
- Check that database table is `leads` (not `person_pins`)
- Verify authentication is working

### Issue: Old terminology still showing
- Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
- Clear browser cache
- Check that new components are being used

### Issue: Navigation not working
- Verify `layout.tsx` has updated navigation link
- Check route structure matches `/app/leads`

## Test Data

### Create Test Leads
1. Active lead with LinkedIn URL
2. Active lead with email address
3. Snoozed lead (snooze until future date)
4. Archived lead
5. Lead with notes
6. Lead without notes

## Success Criteria
- ✅ All UI text uses "leads" terminology
- ✅ All API calls use `/api/leads` endpoints
- ✅ All modals use "lead" terminology
- ✅ Navigation works correctly
- ✅ All CRUD operations work
- ✅ Filtering works correctly
- ✅ Lead limits enforced correctly
- ✅ No console errors
- ✅ No TypeScript errors

