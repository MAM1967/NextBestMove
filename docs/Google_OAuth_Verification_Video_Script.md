# Google OAuth Verification Video Script

## NextBestMove Calendar Integration Demo

**Duration:** 2-3 minutes  
**Purpose:** Demonstrate how NextBestMove uses Google Calendar data to generate revenue action plans

---

## Scene 1: Introduction (0:00 - 0:20)

**[Screen: NextBestMove Dashboard]**

**Narration:**
"NextBestMove helps professionals generate revenue through personalized daily action plans. Today I'll show you how we use Google Calendar data to create these plans."

**[Screen: Settings page]**

**Narration:**
"Users connect their Google Calendar through our settings page. We request read-only access - notice we only request the calendar.readonly scope. We never create, modify, or delete calendar events."

---

## Scene 2: Calendar Connection (0:20 - 0:40)

**[Screen: Click "Connect Google Calendar" button]**

**Narration:**
"When users click 'Connect Google Calendar', they're taken to Google's authorization screen. We request read-only access to calculate their available time."

**[Screen: Google OAuth consent screen]**

**Narration:**
"Users see exactly what we're requesting - read-only calendar access. They can review and approve."

**[Screen: Return to settings, calendar shows as connected]**

**Narration:**
"Once connected, the calendar status shows as active. We can now calculate their daily capacity."

---

## Scene 3: Capacity Calculation (0:40 - 1:00)

**[Screen: Dashboard showing calendar connection status]**

**Narration:**
"Based on their calendar, we calculate free time between 9 AM and 5 PM. The system automatically determines how many actions they can realistically complete based on their schedule."

**[Screen: Dashboard showing "You have 7 actions planned for today"]**

**Narration:**
"If they have 4 hours free, we suggest 7 revenue-generating actions. If they only had 30 minutes free, we'd suggest 1-2 actions instead. The action count automatically adjusts based on their calendar availability - users see 'You have X actions planned for today' where X matches their available time."

---

## Scene 4: Action Plan Generation (1:00 - 1:30)

**[Screen: Daily plan page showing action list]**

**Narration:**
"Here's the daily action plan we generated. It includes outreach to prospects, follow-ups with leads, call preparation, and content creation - all activities that can generate revenue."

**[Screen: Scroll through action list]**

**Narration:**
"Each action is designed to drive revenue - contacting prospects, following up with potential customers, preparing for sales calls. The number of actions matches their available time, ensuring they can actually complete them."

---

## Scene 5: Revenue Impact (1:30 - 2:00)

**[Screen: Completed actions, showing revenue outcomes]**

**Narration:**
"Users complete more actions when plans match their schedule. Here, the user completed 7 out of 8 actions because the plan was realistic. More completed actions mean more sales calls, more follow-ups, and more revenue opportunities."

**[Screen: Subscription dashboard or billing page]**

**Narration:**
"This drives subscription value - users see real results and stay subscribed longer. Calendar integration is a core premium feature that directly enables revenue generation."

---

## Scene 6: Privacy & Security (2:00 - 2:20)

**[Screen: Settings page, privacy section or code view]**

**Narration:**
"We take privacy seriously. We only access free/busy times - never event titles, descriptions, or attendees. All OAuth tokens are encrypted before storage. Users can disconnect their calendar anytime."

**[Screen: Disconnect button or privacy policy]**

**Narration:**
"Read-only access is essential for our core functionality - we couldn't generate personalized plans without knowing when users have time available."

---

## Scene 7: Closing (2:20 - 2:30)

**[Screen: NextBestMove logo or dashboard]**

**Narration:**
"NextBestMove uses Google Calendar data responsibly to help users generate more revenue through better time management. Thank you for your consideration."

---

## Key Visual Elements to Show

1. ✅ **OAuth consent screen** - Show the exact scopes requested
2. ✅ **Calendar connection status** - Show "Connected" state
3. ✅ **Calendar events view** - Show actual events (if user has any)
4. ✅ **Capacity calculation** - Show how free time maps to action count
5. ✅ **Daily action plan** - Show the generated plan with revenue-generating actions
6. ✅ **Completed actions** - Show user completing actions
7. ✅ **Settings/privacy** - Show disconnect option and privacy controls

---

## Talking Points to Emphasize

- **Read-only access only** - We never modify calendars
- **Minimal data** - Only free/busy times, no event details
- **Core functionality** - Essential for the product to work
- **Revenue generation** - Directly enables revenue-generating activities
- **User benefit** - Significantly improves user experience
- **Privacy compliant** - Encrypted, user-controlled, transparent

---

## Technical Details to Mention (If Asked)

- **API endpoint:** `https://www.googleapis.com/calendar/v3/freebusy`
- **Scope:** `https://www.googleapis.com/auth/calendar.readonly`
- **Frequency:** Once per day for plan generation
- **Caching:** 5-10 minutes to reduce API calls
- **Error handling:** Graceful fallback to default capacity
- **Security:** OAuth 2.0 with PKCE, encrypted token storage

---

_Last updated: January 2025_
