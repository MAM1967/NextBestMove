# Group 4.2 Phase 2: Test 7 - Person Pin Matching

## Test 7: Pre-Call Briefs - Person Pin Matching

**Goal:** Verify that pre-call briefs correctly match calendar events to person pins and include relevant history

### Prerequisites

- [ ] Premium user account (`mcddsl@icloud.com` or another Premium user)
- [ ] Calendar is connected (Google or Outlook)
- [ ] At least one person pin exists (e.g., "Peter", "Paul", "Mike Chen")
- [ ] Calendar event created in the next 24 hours with:
  - [ ] Title containing the person's name (e.g., "Call with Peter", "Meet Mike Chen")
  - [ ] Title containing "call", "meeting", "zoom", "Google Meet", "Teams", or similar keyword
  - [ ] OR event has video conferencing link
- [ ] At least one action exists for that person (optional, but recommended for full test)

### Test Steps

1. **Verify Person Pin Exists:**
   - [ ] Go to `/app/pins`
   - [ ] Note the name of an existing person pin (e.g., "Peter", "Mike Chen")
   - [ ] Verify the pin has status "ACTIVE"
   - [ ] Optional: Add notes to the pin for testing

2. **Create Calendar Event:**
   - [ ] In Google Calendar or Outlook, create an event for tomorrow (within 24 hours)
   - [ ] Title should include the person's name from step 1
   - [ ] Title examples:
     - "Call with Peter"
     - "Zoom with Mike Chen"
     - "Google Meet: Review with Paul"
     - "Teams sync with [Person Name]"
   - [ ] Add video conferencing if possible (Google Meet, Zoom, Teams)
   - [ ] Save the event

3. **Check Daily Plan Page:**
   - [ ] Navigate to `/app/plan`
   - [ ] Should see Pre-Call Brief card(s) in the carousel
   - [ ] Card should show:
     - [ ] Event title
     - [ ] Time (e.g., "2:00 PM")
     - [ ] Person name (should match the pin name)
     - [ ] Video conference icon (📹) if video conferencing detected
     - [ ] Or phone icon (📞) for regular calls

4. **View Full Brief (Premium User):**
   - [ ] Click on the brief card (or "View Brief" if available)
   - [ ] Modal should open with full brief content
   - [ ] Brief should include:
     - [ ] **Person name** (should match the pin name exactly)
     - [ ] **Last interaction date** (or "No previous interactions" if none)
     - [ ] **Follow-up history:**
       - Total actions count
       - Replies received count
       - Last reply date (if applicable)
     - [ ] **Suggested talking points** (based on interaction history)
     - [ ] **User notes** (if available from pin or actions)

5. **Verify Person Pin Matching:**
   - [ ] Check that the person name in the brief matches the pin name
   - [ ] Verify the brief includes history from actions linked to that person pin
   - [ ] If notes exist on the pin, they should appear in the brief

### Expected Results

- ✅ Pre-call brief card appears on daily plan page
- ✅ Person pin matched correctly (name appears in brief)
- ✅ Brief includes relevant action history for that person
- ✅ Brief shows last interaction date (if actions exist)
- ✅ Brief shows follow-up count and reply history
- ✅ Brief includes suggested talking points
- ✅ Brief includes user notes from pin or actions
- ✅ Brief is personalized to that specific contact
- ✅ Video conferencing detection works (if applicable)

### Verification Commands

```sql
-- Check person pins for user
SELECT 
  id, 
  name, 
  status, 
  notes,
  url
FROM person_pins
WHERE user_id = (
  SELECT id FROM users WHERE email = 'mcddsl@icloud.com'
)
AND status = 'ACTIVE'
ORDER BY name;

-- Check actions for a specific person (replace 'Peter' with actual name)
SELECT 
  a.action_type,
  a.state,
  a.description,
  a.notes,
  a.created_at,
  a.completed_at,
  a.replied_at
FROM actions a
JOIN person_pins pp ON pp.id = a.person_id
WHERE pp.name ILIKE '%Peter%'
  AND a.user_id = (SELECT id FROM users WHERE email = 'mcddsl@icloud.com')
ORDER BY a.created_at DESC;

-- Check pre-call briefs for user
SELECT 
  pcb.event_title,
  pcb.event_start,
  pcb.person_pin_id,
  pp.name as person_name,
  pcb.follow_up_count,
  pcb.last_interaction_date
FROM pre_call_briefs pcb
LEFT JOIN person_pins pp ON pp.id = pcb.person_pin_id
WHERE pcb.user_id = (SELECT id FROM users WHERE email = 'mcddsl@icloud.com')
ORDER BY pcb.event_start DESC
LIMIT 5;
```

### API Endpoint to Verify

```bash
# Test API endpoint directly (as Premium user with auth cookie)
curl -X GET "http://localhost:3000/api/pre-call-briefs" \
  -H "Cookie: premium-user-auth-cookie"

# Expected: Returns 200 with briefs array containing matched person info
```

### Test Scenarios

**Scenario 1: Person Pin with Actions**
- Person pin exists with name "Peter"
- Calendar event: "Call with Peter" (tomorrow)
- Actions exist for Peter
- **Expected:** Brief shows Peter's name, action history, last interaction date

**Scenario 2: Person Pin with Notes**
- Person pin exists with name "Mike Chen" and notes
- Calendar event: "Zoom with Mike Chen" (tomorrow)
- **Expected:** Brief shows Mike Chen's name and includes notes from pin

**Scenario 3: Person Pin with No History**
- Person pin exists with name "Paul"
- Calendar event: "Meet Paul" (tomorrow)
- No actions exist for Paul
- **Expected:** Brief shows Paul's name, "No previous interactions", but still generates brief

**Scenario 4: Multiple Matches**
- Multiple person pins exist (e.g., "John Smith", "John Doe")
- Calendar event: "Call with John" (tomorrow)
- **Expected:** Brief matches to the most relevant pin (or first match)

---

## Quick Test Summary

**What to verify:**

1. Person pin name appears in the brief
2. Brief includes action history for that person
3. Brief shows last interaction date
4. Brief includes suggested talking points
5. Brief includes user notes (if available)
6. Brief is personalized to the contact

**Time estimate:** 10-15 minutes

