# Quick Test Checklist - Phase 4: UI Components

## ✅ Automated Checks (Completed)
- [x] Leads directory exists with all components
- [x] Navigation link updated to /app/leads
- [x] No old /app/pins references
- [x] All component files renamed correctly
- [x] No 'pin' terminology in leads components
- [x] API endpoints use /api/leads

## 🧪 Manual Testing Steps

### 1. Start the Application
```bash
cd web
npm run dev
```

### 2. Navigate to Leads Page
- Open browser: http://localhost:3000/app/leads
- **Expected**: Page loads without errors
- **Check**: Page title says "Leads" (not "Pinned People")

### 3. Check Navigation
- Look at the sidebar navigation
- **Expected**: Link says "Leads" (not "Pins")
- Click the "Leads" link
- **Expected**: Routes to /app/leads

### 4. Test Add Lead
- Click the floating "+" button (bottom right)
- **Expected**: Button label says "Add Lead"
- **Expected**: Modal title says "Add Lead" (not "Pin a Person")
- Fill in:
  - Name: "Test Lead"
  - URL: "https://linkedin.com/in/test"
  - Notes: "Test notes"
- Click "Save Lead"
- **Expected**: Modal closes, lead appears in list
- **Expected**: Button text says "Save Lead" (not "Save Pin")

### 5. Test Edit Lead
- Click "View/Edit" on a lead
- **Expected**: Modal title says "Edit Lead" (not "Edit Person")
- Update the name
- Click "Save Changes"
- **Expected**: Changes saved, list updates

### 6. Test Filtering
- Click filter buttons: All, Active, Snoozed, Archived
- **Expected**: List filters correctly
- **Expected**: Filter labels use proper terminology

### 7. Test Snooze
- Click "Snooze" on an active lead
- **Expected**: Modal title says "Snooze Lead" (not "Snooze Pin")
- Select a future date
- Click "Snooze"
- **Expected**: Lead status changes to "SNOOZED"
- **Expected**: Status badge shows snooze date

### 8. Test Archive
- Click "Archive" on a lead
- **Expected**: Lead moves to archived status
- **Expected**: Lead appears dimmed/opacity reduced

### 9. Test Restore
- Click "Restore" on an archived lead
- **Expected**: Lead status changes to "ACTIVE"

### 10. Check Browser Console
- Open DevTools (F12)
- Check Console tab
- **Expected**: No errors related to "pins" or missing components
- **Expected**: No TypeScript errors

### 11. Check Network Tab
- Open DevTools → Network tab
- Perform actions (add, edit, filter)
- **Expected**: API calls go to `/api/leads` (not `/api/pins`)
- **Expected**: Responses use `leads` property (not `pins`)

### 12. Test Lead Limit (Standard Plan)
- If you're on Standard plan, add 10 leads
- Try to add 11th lead
- **Expected**: Upgrade modal appears
- **Expected**: Modal says "lead limit" (not "pin limit")
- **Expected**: Description uses "leads" terminology

### 13. Test Empty State
- Filter to show no leads (or delete all leads)
- **Expected**: Message says "No leads yet. Add your first lead to get started."
- **Expected**: Does NOT say "No pins found"

### 14. Test Loading State
- Refresh page while watching
- **Expected**: Loading text says "Loading leads..." (not "Loading pins...")

## 🐛 Common Issues to Watch For

### Issue: Page Not Found
- **Fix**: Verify route is `/app/leads` not `/app/pins`
- **Fix**: Check that `page.tsx` exists in `web/src/app/app/leads/`

### Issue: Components Not Found
- **Fix**: Verify all component files exist in `web/src/app/app/leads/`
- **Fix**: Check imports in `page.tsx` are correct

### Issue: API Errors
- **Fix**: Verify API routes exist at `/api/leads`
- **Fix**: Check browser console for specific error messages

### Issue: Old Terminology Still Showing
- **Fix**: Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- **Fix**: Clear browser cache
- **Fix**: Restart dev server

## ✅ Success Criteria
- [ ] Page loads at /app/leads
- [ ] All UI text uses "leads" terminology
- [ ] All modals use "lead" terminology
- [ ] All API calls use /api/leads
- [ ] All CRUD operations work
- [ ] Filtering works correctly
- [ ] No console errors
- [ ] No TypeScript errors

## 📝 Notes
Document any issues found during testing here:

