# Google OAuth Verification FAQ
## Common Questions for NextBestMove Calendar Integration

---

## Q1: Why do you need calendar access?

**A:** NextBestMove generates personalized daily action plans with revenue-generating activities. To create realistic plans that users can actually complete, we need to know when they have free time available. Calendar free/busy data allows us to:
- Calculate available time between 9 AM - 5 PM
- Match action count to available time
- Increase completion rates by suggesting actions only when users have time

**Without calendar access:** We'd use a default capacity (5-6 actions) regardless of schedule, leading to lower completion rates and less revenue generation.

---

## Q2: What specific data do you access?

**A:** We only access **free/busy information** - start and end times of calendar events. We do NOT access:
- ❌ Event titles or descriptions
- ❌ Attendee information
- ❌ Event locations
- ❌ Any personal information from events
- ❌ Any data outside of free/busy times

**Example:** We know "user is busy from 10:00-11:00 AM" but not "meeting with John about Project X".

---

## Q3: How do you use this data to generate revenue?

**A:** Calendar data enables capacity-based planning:

1. **Calculate capacity:** Free time determines how many actions to suggest (behind the scenes)
   - 4 hours free → 7-8 revenue-generating actions
   - 1 hour free → 3-4 actions
   - 30 min free → 1-2 actions
   - Users see: "You have X actions planned for today" where X matches their availability

2. **Generate action plans:** Plans include revenue-generating activities:
   - Outreach to prospects
   - Follow-ups with leads
   - Sales call preparation
   - Post-call follow-ups
   - Content creation for lead generation

3. **Increase completions:** Realistic plans = more completed actions = more revenue opportunities

4. **Drive subscriptions:** Better experience = longer subscriptions = recurring revenue

---

## Q4: Why read-only access? Do you modify calendars?

**A:** We only need **read-only access** because:
- We only need to **read** free/busy data to calculate capacity
- We **never** create, modify, or delete calendar events
- We **never** send calendar invitations
- We **never** access event details beyond time slots

**We are a planning tool, not a calendar management tool.**

---

## Q5: How do you store and protect calendar data?

**A:** 
- **OAuth tokens:** Encrypted before storage using application-level encryption
- **Free/busy data:** Cached temporarily (5-10 minutes) for performance, then discarded
- **No event details stored:** We only store calculated metrics (free minutes, capacity level)
- **User control:** Users can disconnect calendar anytime, which immediately revokes access
- **Secure transmission:** All API calls use HTTPS

---

## Q6: What happens if a user disconnects their calendar?

**A:** 
- Access is immediately revoked
- We fall back to default capacity (5-6 actions/day)
- All cached calendar data is cleared
- User can reconnect anytime
- No data loss - action plans continue with default capacity

---

## Q7: How often do you access calendar data?

**A:**
- **Once per day:** When generating the daily action plan
- **On demand:** When user clicks "Refresh Calendar" button
- **Cached:** Results cached for 5-10 minutes to reduce API calls
- **Minimal usage:** We only fetch free/busy for the current day (9 AM - 5 PM)

**We do not continuously monitor or sync calendars.**

---

## Q8: Is calendar integration required to use NextBestMove?

**A:** No, calendar integration is **optional**:
- Users can use NextBestMove without connecting a calendar
- Without calendar: Default capacity of 5-6 actions/day
- With calendar: Personalized capacity based on available time
- Calendar integration is a **premium feature** that enhances the experience

---

## Q9: How does this comply with Google's OAuth policies?

**A:** We comply by:
- ✅ **Minimal scope:** Only requesting `calendar.readonly` (not full calendar access)
- ✅ **Clear purpose:** Calendar data is essential for core functionality
- ✅ **User benefit:** Significantly improves user experience
- ✅ **Privacy:** Minimal data access, encrypted storage, user control
- ✅ **Transparency:** Clear explanation in privacy policy and terms
- ✅ **Security:** Industry-standard OAuth 2.0 with PKCE

---

## Q10: What is your revenue model?

**A:**
- **Subscription-based:** Users pay monthly/yearly for Standard or Premium plans
- **Value proposition:** Calendar integration enables better plans = more completed actions = more revenue for users
- **Retention:** Better experience = longer subscriptions
- **Premium feature:** Calendar integration is a key differentiator for paid plans

---

## Q11: Can you provide examples of revenue-generating actions?

**A:** Yes, examples include:
- **Outreach:** Contacting new prospects via email or LinkedIn
- **Follow-up:** Following up with leads who expressed interest
- **Call prep:** Preparing for sales calls with potential customers
- **Post-call:** Following up after sales calls to close deals
- **Content:** Creating content to attract and convert leads
- **Nurture:** Maintaining relationships with existing customers

Each completed action has potential to generate revenue through sales, leads, or customer relationships.

---

## Q12: How do you ensure user privacy?

**A:**
- **Read-only access:** We can't modify or see event details
- **Minimal data:** Only free/busy times, no personal information
- **Encrypted storage:** All tokens encrypted at rest
- **User control:** Easy disconnect option
- **Transparent:** Clear privacy policy explaining data usage
- **No sharing:** Calendar data is never shared with third parties
- **Compliance:** Follows GDPR, CCPA, and Google's privacy requirements

---

## Q13: What happens if Google rejects the verification?

**A:** 
- Users can still use NextBestMove with default capacity (5-6 actions/day)
- Calendar integration would be unavailable until verification is approved
- We would work with Google to address any concerns and resubmit

**However, calendar integration is essential for our value proposition, so we're committed to getting approval.**

---

## Q14: Do you have a privacy policy and terms of service?

**A:** Yes:
- **Privacy Policy:** Available at `/privacy` (explains calendar data usage)
- **Terms of Service:** Available at `/terms`
- Both documents clearly explain how calendar data is used

---

## Q15: How can users contact you about privacy concerns?

**A:**
- **Support email:** [Your support email]
- **Privacy contact:** [Your privacy email]
- **In-app:** Settings page has disconnect option
- **Documentation:** Privacy policy explains all data usage

---

_Last updated: January 2025_

