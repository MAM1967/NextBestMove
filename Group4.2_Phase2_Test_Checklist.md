# Group 4.2 Phase 2: Pre-Call Briefs Test Checklist

## Test 4: Pre-Call Briefs - Premium User with Calendar Event

### Prerequisites
- [ ] Logged in as Premium user (`mcddsl@icloud.com`)
- [ ] Calendar is connected (Google or Outlook)
- [ ] At least one person pin exists (e.g., "Peter", "Paul")
- [ ] Calendar event created in the next 24 hours with:
  - [ ] Title containing "call", "meeting", "zoom", "Google Meet", "Teams", or similar keyword
  - [ ] OR event has video conferencing link (Google Meet, Zoom, Teams)
  - [ ] Event should match a person pin name (for best results)

### Test Steps

1. **Create Calendar Event:**
   - [ ] In Google Calendar or Outlook, create an event for tomorrow (within 24 hours)
   - [ ] Title examples:
     - "Call with Peter"
     - "Zoom with Paul"
     - "Google Meet: Project Review"
     - "Teams sync with John"
   - [ ] If person pin exists, include their name in the title
   - [ ] Add video conferencing if possible (Google Meet, Zoom, Teams)

2. **Check Daily Plan Page:**
   - [ ] Navigate to `/app/plan`
   - [ ] Should see Pre-Call Brief card(s) if calls detected
   - [ ] Card should show:
     - [ ] Event title
     - [ ] Time (e.g., "2:00 PM")
     - [ ] Person name (if matched to pin)
     - [ ] "View Brief" button

3. **View Full Brief:**
   - [ ] Click "View Brief" button
   - [ ] Modal should open with full brief content
   - [ ] Brief should include:
     - [ ] Person name (if matched)
     - [ ] Last interaction date (or "No previous interactions")
     - [ ] Follow-up history (Total actions, Replies received)
     - [ ] Suggested talking points
     - [ ] User notes (if available from pin or actions)

### Expected Results
- ✅ Pre-call brief card appears on daily plan page
- ✅ Brief content is relevant and helpful
- ✅ Modal displays full brief correctly
- ✅ Person pin matching works (if applicable)
- ✅ Video conferencing detection works (Google Meet, Zoom, Teams)

### API Endpoint to Verify
```
GET /api/pre-call-briefs
```
**Expected:** Returns 200 with briefs array

---

## Test 5: Pre-Call Briefs - Standard User Upgrade Prompt

### Prerequisites
- [ ] Logged in as Standard user (different account)
- [ ] Calendar is connected
- [ ] Calendar event with "call" keyword exists

### Test Steps
1. **Check Daily Plan Page:**
   - [ ] Navigate to `/app/plan`
   - [ ] Should NOT see pre-call brief cards
   - [ ] API should return 402 (Upgrade Required)

### Expected Results
- ✅ Standard users don't see briefs
- ✅ No errors (graceful handling)
- ✅ Upgrade prompt if they try to access

### API Endpoint to Verify
```
GET /api/pre-call-briefs
```
**Expected:** Returns 402 with `UPGRADE_REQUIRED`

---

## Test 6: Pre-Call Briefs - No Calendar Connected

### Prerequisites
- [ ] Logged in as Premium user
- [ ] Calendar is NOT connected
- [ ] Navigate to `/app/plan`

### Test Steps
1. **Check API Response:**
   - [ ] API should return success with empty briefs array
   - [ ] Message: "Connect your calendar to get pre-call briefs" (if displayed)

### Expected Results
- ✅ No errors
- ✅ Helpful message (if displayed)
- ✅ Feature doesn't break without calendar

---

## Test 7: Pre-Call Briefs - Person Pin Matching

### Prerequisites
- [ ] Logged in as Premium user
- [ ] Person pin exists (e.g., "Peter")
- [ ] Calendar event titled "Call with Peter" (or similar)
- [ ] Event is in next 24 hours
- [ ] Action exists for that person (optional, for history)

### Test Steps
1. **Check Brief:**
   - [ ] Brief should show person name
   - [ ] Brief should include action history for that person (if actions exist)
   - [ ] Brief should reference previous interactions
   - [ ] Brief should show notes from pin or actions

### Expected Results
- ✅ Person pin matched correctly
- ✅ Brief includes relevant history
- ✅ Brief is personalized to that contact

---

## Quick Verification Commands

### Check calendar connection:
```sql
-- Check if user has calendar connected
SELECT 
  u.email,
  u.calendar_connected,
  cc.provider,
  cc.status
FROM users u
LEFT JOIN calendar_connections cc ON cc.user_id = u.id
WHERE u.email = 'mcddsl@icloud.com';
```

### Check person pins:
```sql
-- List person pins for user
SELECT id, name, status, notes
FROM person_pins
WHERE user_id = (
  SELECT id FROM users WHERE email = 'mcddsl@icloud.com'
)
AND status = 'ACTIVE';
```

### Check actions for a person:
```sql
-- Check actions for a specific person (replace 'Peter' with actual name)
SELECT 
  a.action_type,
  a.state,
  a.description,
  a.notes,
  a.created_at,
  a.completed_at
FROM actions a
JOIN person_pins pp ON pp.id = a.person_id
WHERE pp.name ILIKE '%Peter%'
  AND a.user_id = (SELECT id FROM users WHERE email = 'mcddsl@icloud.com')
ORDER BY a.created_at DESC;
```

### Test API endpoint directly:
```bash
# As Premium user (with auth cookie)
curl -X GET "http://localhost:3000/api/pre-call-briefs" \
  -H "Cookie: your-auth-cookie"

# Should return briefs array or empty array
```

---

## Event Naming Tips

For best results, name calendar events with:
- **Keywords:** "call", "zoom", "Google Meet", "Teams", "meeting", "sync"
- **Person name:** Include the person's name if you have them pinned
- **Examples:**
  - ✅ "Call with Peter"
  - ✅ "Zoom with Paul"
  - ✅ "Google Meet: Project Review"
  - ✅ "Teams sync with John"
  - ❌ "Coffee chat" (no keyword)
  - ❌ "Lunch" (no keyword)

**Note:** The system now automatically detects video conferencing from calendar event fields (Google Meet links, Zoom links, Teams links), so even if the title doesn't have keywords, it will still be detected if video conferencing is enabled on the event.

