# Google OAuth Verification Script
## How NextBestMove Uses Calendar Data to Generate Revenue Action Plans

**App Name:** NextBestMove  
**OAuth Scopes Requested:** `https://www.googleapis.com/auth/calendar.readonly`  
**Purpose:** Generate personalized daily action plans based on calendar availability

---

## Executive Summary

NextBestMove uses Google Calendar data to calculate a user's available time and generate personalized daily action plans that drive revenue-generating activities. The calendar integration enables capacity-based planning, ensuring users focus on high-value actions when they have time available.

---

## How Calendar Data is Used

### 1. **Capacity Calculation**
- **What we access:** Free/busy information for the current day (9 AM - 5 PM in user's timezone)
- **How we use it:** Calculate available free minutes by subtracting busy slots from working hours
- **Purpose:** Determine how many revenue-generating actions a user can realistically complete

### 2. **Action Plan Generation**
- **What we generate:** Daily action plans with a specific number of revenue-generating activities
- **Capacity mapping (behind the scenes):**
  - < 30 min free time → 1-2 actions (micro plan)
  - 30-60 min free time → 3-4 actions (light plan)
  - 60-120 min free time → 5-6 actions (standard plan)
  - > 120 min free time → 7-8 actions (heavy plan)
- **User sees:** "You have X actions planned for today" (where X matches their available time)
- **Purpose:** Match action volume to available time, ensuring users complete their plans

### 3. **Revenue-Generating Activities**
The action plans include activities that directly generate revenue:
- **Outreach actions:** Contacting prospects and leads
- **Follow-up actions:** Following up with potential customers
- **Call preparation:** Preparing for revenue-generating calls
- **Post-call actions:** Following up after sales calls
- **Content creation:** Creating content to attract and convert customers

### 4. **Personalization**
- **What we use:** Calendar events to understand user's schedule patterns
- **How we use it:** Adjust action timing and volume based on availability
- **Purpose:** Increase completion rates by only suggesting actions when users have time

---

## Revenue Model

### Direct Revenue Generation
1. **Premium Subscriptions:** Users pay for NextBestMove subscriptions (Standard and Professional plans)
2. **Value Proposition:** Calendar integration is a core feature that:
   - Increases action completion rates (users complete more revenue-generating activities)
   - Improves user satisfaction (plans match their actual availability)
   - Reduces churn (better experience = longer subscriptions)

### How Calendar Data Drives Revenue
- **Better Plans = More Completions:** When plans match available time, users complete more actions
- **More Actions = More Revenue:** Each completed action (outreach, follow-up, etc.) has revenue potential
- **Higher Satisfaction = Longer Subscriptions:** Users who see value stay subscribed longer

---

## Data Usage Details

### What Data We Access
- **Read-only access** to calendar free/busy information
- **Time ranges only:** We access start/end times of events, not event details, titles, or attendees
- **Limited scope:** Only for the current day (9 AM - 5 PM) to calculate today's capacity
- **No storage of event details:** We only store calculated free minutes and busy time slots

### What We Store
- **Encrypted OAuth tokens:** Refresh and access tokens (encrypted at rest)
- **Calculated metrics:** Free minutes, busy slots, capacity level
- **No event details:** We do NOT store event titles, descriptions, attendees, or any personal information from calendar events

### Privacy & Security
- **Read-only access:** We never create, modify, or delete calendar events
- **Encrypted storage:** All OAuth tokens are encrypted before storage
- **User control:** Users can disconnect their calendar at any time
- **Data minimization:** We only access the minimum data needed (free/busy times)

---

## Technical Implementation

### OAuth Flow
1. User clicks "Connect Google Calendar" in settings
2. User authorizes NextBestMove to access calendar (read-only)
3. We store encrypted refresh token
4. We fetch free/busy data for capacity calculation
5. We generate personalized action plans based on availability

### API Usage
- **Endpoint used:** `https://www.googleapis.com/calendar/v3/freebusy`
- **Frequency:** Once per day when generating daily plans, or when user clicks "Refresh Calendar"
- **Caching:** Results are cached for 5-10 minutes to reduce API calls
- **Error handling:** If calendar is unavailable, we fall back to default capacity (5-6 actions)

---

## User Benefits

### For Users
1. **Realistic Plans:** Action counts match their actual available time
2. **Higher Completion Rates:** Users complete more actions when plans are achievable
3. **Better Time Management:** See when they have time for revenue-generating activities
4. **Personalized Experience:** Plans adapt to their schedule automatically

### For Revenue
1. **More Completed Actions:** Users complete more revenue-generating activities
2. **Better Outcomes:** Higher completion rates lead to more sales, follow-ups, and revenue
3. **User Retention:** Satisfied users stay subscribed longer
4. **Premium Feature:** Calendar integration is a key differentiator for paid plans

---

## Verification Requirements Compliance

### Scope Justification
- **Why read-only:** We only need to read calendar data to calculate availability
- **Why calendar scope:** Free/busy data is only available through calendar API
- **Why not full access:** We don't need to create or modify events

### Data Handling
- **Minimal data access:** Only free/busy times, no event details
- **Secure storage:** All tokens encrypted
- **User control:** Easy disconnect option
- **Transparency:** Clear explanation of data usage in privacy policy

### Business Justification
- **Core feature:** Calendar integration is essential for the product's value proposition
- **Revenue impact:** Directly enables revenue-generating action plans
- **User benefit:** Significantly improves user experience and outcomes

---

## Sample User Flow

1. **User connects calendar:** Authorizes NextBestMove to access Google Calendar (read-only)
2. **System calculates capacity:** Fetches free/busy data for today (9 AM - 5 PM)
3. **System generates plan:** Creates daily action plan with appropriate number of revenue-generating actions
4. **User completes actions:** Follows the plan, completing outreach, follow-ups, and other revenue activities
5. **Revenue generated:** Each completed action has potential to generate revenue (sales, leads, etc.)

---

## Supporting Documentation

- **Privacy Policy:** [Link to privacy policy explaining calendar data usage]
- **Terms of Service:** [Link to terms of service]
- **User Documentation:** [Link to user guide explaining calendar integration]

---

## Contact Information

**Developer Contact:** [Your email]  
**Support Email:** [Support email]  
**Privacy Contact:** [Privacy email]

---

## Video Demonstration Script

### Introduction (0:00 - 0:15)
"NextBestMove is a productivity app that helps users generate revenue through personalized daily action plans. Today I'll show you how we use Google Calendar data to create these plans."

### Calendar Connection (0:15 - 0:30)
"First, users connect their Google Calendar. We request read-only access to calculate their available time. Notice we only request calendar.readonly scope - we never create or modify events."

### Capacity Calculation (0:30 - 0:45)
"Based on their calendar, we calculate how much free time they have between 9 AM and 5 PM. If they have 2 hours free, we suggest 5-6 revenue-generating actions. If they have 30 minutes, we suggest 1-2 actions."

### Action Plan Generation (0:45 - 1:00)
"Here's the daily plan we generated. It includes outreach actions, follow-ups, and call preparation - all activities that can generate revenue. The number of actions matches their available time."

### Revenue Impact (1:00 - 1:15)
"Users complete more actions when plans match their schedule. More completed actions mean more sales calls, follow-ups, and revenue opportunities. This drives subscription value and retention."

### Privacy & Security (1:15 - 1:30)
"We only access free/busy times, never event details. All tokens are encrypted. Users can disconnect anytime. This read-only access is essential for our core functionality."

---

## Key Points for Verification Review

1. ✅ **Read-only access:** We never create, modify, or delete calendar events
2. ✅ **Minimal data:** Only free/busy times, no event details or personal information
3. ✅ **Core functionality:** Calendar integration is essential for the product
4. ✅ **Revenue generation:** Enables revenue-generating action plans
5. ✅ **User benefit:** Significantly improves user experience
6. ✅ **Privacy compliant:** Encrypted storage, user control, transparent usage
7. ✅ **Secure implementation:** Industry-standard OAuth 2.0 with PKCE

---

_Last updated: January 2025_

