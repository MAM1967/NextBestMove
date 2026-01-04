# NextBestMove Help & FAQ

Welcome to NextBestMove! This guide will help you understand how the app works and answer common questions.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Concepts](#core-concepts)
3. [Daily Plans & Capacity](#daily-plans--capacity)
4. [Actions](#actions)
5. [Relationships](#relationships)
6. [Calendar Integration](#calendar-integration)
7. [Email Signals](#email-signals)
8. [Weekly Reviews](#weekly-reviews)
9. [Settings](#settings)
10. [Frequently Asked Questions](#frequently-asked-questions)

---

## Getting Started

### Onboarding

When you first sign up, NextBestMove will guide you through a simple setup:

1. **Add Your First Relationship** - Add someone you don't want to lose track of (name + contact info)
2. **Connect Your Calendar** (optional but recommended) - This helps us size your daily plan to your actual schedule
3. **Set Working Hours** (optional) - Tell us when you typically work (default: 9 AM - 5 PM)
4. **Weekend Preference** - Choose whether to include weekends in your daily plans
5. **Set Your Weekly Focus** - Approve or edit a suggested focus for the week
6. **Generate Your First Plan** - Get your first daily plan with a Fast Win

**Success Criteria:**
- ✅ Add at least 1 relationship
- ✅ Set your Weekly Focus
- ✅ Complete your first Fast Win

---

## Core Concepts

### What is NextBestMove?

NextBestMove is an **actions-first workflow app** that helps you maintain a consistent revenue rhythm. Instead of managing a complex CRM, you get a small, realistic list of high-impact actions each day.

### Relationships

**Relationships** (formerly called "Leads" or "Pins") are people you don't want to lose track of. Each relationship includes:
- **Name** - The person's name
- **Contact Info** - LinkedIn URL, email address, or phone number
- **Optional Notes** - Any context you want to remember
- **Cadence** - How often you want to stay in touch (Frequent: 7-14 days, Moderate: 30-90 days, Infrequent: 180-365 days, or Ad-hoc)
- **Tier** - Relationship importance (Inner, Active, Warm, Background)
- **Status** - ACTIVE (in play), SNOOZED (hidden until a date), or ARCHIVED (no longer active)

**Important:** NextBestMove is **not a CRM**. Relationships exist to support the decision engine and help surface your next best moves. We don't track pipeline stages, lead scores, or require heavy data entry.

### Daily Plans

Each day, NextBestMove generates a **Daily Plan** with a small set of actions (typically 3-8) sized to your calendar availability. The plan includes:
- **One Fast Win** - A quick, high-impact action that takes less than 5 minutes
- **Regular Actions** - Additional follow-ups, outreach, or nurture tasks prioritized by urgency and value

### Fast Wins

A **Fast Win** is a special type of action that:
- Takes less than 5 minutes to complete
- Has a high probability of response or clear impact
- Helps build momentum and reduce activation friction

Every daily plan starts with one Fast Win to help you get started quickly.

---

## Daily Plans & Capacity

### How Daily Plans Are Sized

Your daily plan size is determined by:

1. **Calendar Availability** (if connected) - We check your free/busy calendar data and calculate how much time you have
2. **Manual Override** - You can manually set your capacity for any day
3. **Adaptive Recovery** - If you've been inactive or had low completion, we'll automatically reduce your plan size to help you ease back in

### Capacity Levels

Your daily plan can be set to different capacity levels:

- **Auto** - Automatically calculated from your calendar (default if calendar is connected)
  - Maps free time to actions:
    - < 30 min free → 1-2 actions (Busy Day)
    - 30-60 min free → 3-4 actions (Light Day)
    - 60-120 min free → 5-6 actions (Standard)
    - > 120 min free → 7-8 actions (Heavy Day)
- **Busy Day** - 1-2 actions (for very busy days)
- **Light Day** - 3-4 actions (for lighter days)
- **Standard** - 5-6 actions (default if no calendar connected)
- **Heavy Day** - 7-8 actions (for days with lots of availability)

**Note:** If you don't have a calendar connected, the default is Standard (5-6 actions per day).

### Adaptive Recovery

**Adaptive Recovery** is a feature that automatically adjusts your daily plan size based on your activity patterns. This helps you ease back into your routine without feeling overwhelmed.

**When Adaptive Recovery Activates:**

1. **After 7+ Days Inactive**
   - If you haven't completed any actions for 7+ days, your next plan will be very light (1-2 actions total)
   - Message: "Welcome back. One small win to restart your momentum."
   - Focus: One Fast Win + one follow-up if available

2. **After 2-6 Days Inactive (Streak Break)**
   - If you break a streak of 2-6 days, your next plan will be light (2 actions)
   - Helps you get back on track without overwhelming you

3. **Low Completion Pattern (3+ Days <50%)**
   - If you complete less than 50% of your actions for 3 days straight, your next plan will be lighter (3-4 actions)
   - Message: "Let's ease back in — here are your 3 highest-impact moves for today."
   - Focus: One Fast Win + 1-2 highest-priority follow-ups

4. **High Completion Streak (7+ Days >80%)**
   - If you complete 80%+ of your actions for 7+ days straight, we may suggest increasing your capacity
   - This is a positive reinforcement to keep your momentum going

**Important:** Adaptive Recovery only applies when you haven't manually set a capacity override. Manual overrides always take precedence.

### Manual Capacity Override

You can manually override your daily capacity on the Daily Plan page:
1. Go to the Daily Plan page
2. Find the "Daily Capacity" card
3. Select your desired capacity level (Busy Day, Light Day, Standard, Heavy Day, or Auto)
4. Your plan will regenerate with the new capacity

You can also set a default capacity in Settings that will be used unless you override it for a specific day.

---

## Actions

### Action Types

Actions are the core unit of work in NextBestMove. Each action has a **type** that indicates what kind of work it is:

- **OUTREACH** - Starting a new conversation (e.g., "Send LinkedIn message to Sarah")
- **FOLLOW_UP** - Following up on a previous conversation (e.g., "Follow up with John about the proposal")
- **NURTURE** - A soft touch without a specific call-to-action (e.g., "Share an article with Maria")
- **CALL_PREP** - Preparing for an upcoming call (e.g., "Review notes before call with Alex")
- **POST_CALL** - Capturing notes or sending next steps after a call (e.g., "Send follow-up email after call with Sarah")
- **CONTENT** - Drafting or posting content (e.g., "Draft LinkedIn post about recent win")
- **FAST_WIN** - A quick, high-impact action (tagged on other action types)

### Action States

Actions move through different **states** as you work with them:

- **NEW** - Not yet executed (default state)
- **SENT** - You completed the action but haven't received a reply yet
- **REPLIED** - You marked the action as "Got a reply" (triggers follow-up flow)
- **SNOOZED** - Deferred to a later date (action will return to NEW on the snooze date)
- **DONE** - Completed with no further action needed
- **ARCHIVED** - No longer active (terminal state)

### Action State Transitions

**From NEW:**
- → **SENT** (Done – no reply yet)
- → **REPLIED** (Done – got a reply)
- → **SNOOZED** (Snooze to a later date)
- → **ARCHIVED** (Discard)

**From SENT:**
- → **REPLIED** (Mark reply later)
- → **DONE** (Complete without reply)
- → **SNOOZED**
- → **ARCHIVED**

**From REPLIED:**
- → **NEW** (System creates next action, or you create one)
- → **DONE**

**From SNOOZED:**
- → **NEW** (Automatically on snooze date)
- → **ARCHIVED**

### "Got a Reply" Flow

When you mark an action as "Got a reply":
1. The action state changes to **REPLIED**
2. The system prompts: "Great. What's next?"
3. You can choose:
   - **Schedule a follow-up** - System suggests a date (2-3 days out) and creates a new FOLLOW_UP action
   - **Snooze this** - Defer the action to a later date
   - **Mark done** - Complete the action with no further steps

### Snoozing Actions

You can snooze any action to defer it to a later date. Default snooze suggestions:

- **FOLLOW_UP or OUTREACH:** Default = 1 week
  - Quick options: 3 days / 1 week / 2 weeks / 1 month / Custom
- **CALL_PREP or POST_CALL:** Default = 2 days
  - Quick options: Tomorrow / 2 days / 1 week / Custom
- **NURTURE:** Default = 2 weeks
  - Quick options: 1 week / 2 weeks / 1 month / Custom

When the snooze date arrives, the action automatically returns to **NEW** state.

### Promised Follow-Ups

You can mark actions as **"promised"** to track explicit commitments you've made in conversations (e.g., "I'll send that by EOD" or "I'll follow up this week").

**Marking a Promise:**
- Options:
  - "By end of today (EOD)" - Sets promise deadline to end of your working day
  - "By end of this week" - Sets promise deadline to Sunday 11:59 PM in your timezone
  - "By specific date" - Custom date picker

**Overdue Promise Escalation:**
- Actions with overdue promises are visually escalated (stronger color, warning icon)
- They're ordered above non-promised items with similar scores
- "Overdue promise" badge is displayed
- Decision engine boosts urgency score for promised actions

**Clearing Promises:**
- Automatically cleared when action state → DONE or SENT
- You can manually unmark a promise
- Promise persists through snooze (deferred but still tracked)

### Action Duration Filter

On the Daily Plan page, you can filter actions by estimated duration:
- **Any** - Show all actions
- **5 minutes** - Show only actions that take 5 minutes or less
- **10 minutes** - Show only actions that take 10 minutes or less
- **15 minutes** - Show only actions that take 15 minutes or less

This helps you find actions that fit into small time windows.

---

## Relationships

### Relationship States

Relationships can be in different states:

- **ACTIVE** - In play; used for action generation
- **SNOOZED** - Hidden until a date; no daily actions until unsnoozed
- **ARCHIVED** - No longer active; used only for history/analytics

### Relationship State Machine

Relationships can transition through different relationship states (separate from status):

- **Unengaged/Cold** - No recent interaction
- **Active Conversation** - Currently engaged in conversation
- **Opportunity/Evaluation** - Potential business opportunity
- **Warm but Passive** - Warm relationship but not actively pursuing
- **Dormant** - Relationship has gone quiet

These states help the decision engine prioritize which relationships need attention.

### Relationship Cadence

**Cadence** defines how often you want to stay in touch with a relationship:

- **Frequent** - 7-14 days between touches
- **Moderate** - 30-90 days between touches
- **Infrequent** - 180-365 days between touches
- **Ad-hoc** - No regular cadence (touch when needed)

You can set specific days within each range (e.g., "Every 10 days" for Frequent).

### Relationship Tiers

**Tiers** help you categorize relationships by importance:

- **Inner** - Your closest, most important relationships
- **Active** - Actively engaged relationships
- **Warm** - Warm but less active relationships
- **Background** - Relationships you want to keep in touch with but aren't a priority

### Next Touch Due

The system calculates when each relationship is **due for a touch** based on:
- Last interaction date
- Relationship cadence
- Overdue status

Relationships that are overdue for a touch are highlighted in the Today page and Relationships page.

### Notes Summary

The **Notes Summary** uses AI to organize notes from various sources (onboarding, emails, meeting notes) into usable topics. It includes:
- Key topics discussed
- Last discussion date for each topic
- Associated action items (pending and overdue)
- Interaction counts (total and last 30 days)

The summary updates automatically when new notes are added.

---

## Calendar Integration

### Connecting Your Calendar

NextBestMove supports connecting your calendar to automatically size your daily plans:

1. Go to **Settings** → **Calendar**
2. Click "Connect Google Calendar" or "Connect Outlook Calendar"
3. Complete the OAuth flow
4. Your calendar connection will be saved

**What We Access:**
- We only read your **free/busy** data (when you're available vs. busy)
- We do **not** read event details, titles, or attendees
- We use this data to calculate how much time you have available for actions

### How Calendar Data Is Used

1. **Calculate Free Time** - We check your calendar for the day and calculate free minutes between 9 AM - 5 PM (or your custom working hours)
2. **Map to Capacity** - Free time is mapped to action capacity:
   - < 30 min free → Busy Day (1-2 actions)
   - 30-60 min free → Light Day (3-4 actions)
   - 60-120 min free → Standard (5-6 actions)
   - > 120 min free → Heavy Day (7-8 actions)
3. **Generate Plan** - Your daily plan is sized based on this capacity

### Working Hours

You can set your working hours in Settings:
- **Default:** 9 AM - 5 PM
- **Presets:** 9 AM - 5 PM, 10 AM - 6 PM, 8 AM - 8 PM, or Custom
- Used to calculate free time from your calendar

### Weekend Preference

You can choose whether to include weekends in your daily plans:
- **Include weekends** (default) - Plans are generated for Saturday and Sunday
- **Exclude weekends** - Plans are not generated on weekends

---

## Email Signals

### What Are Email Signals?

**Email Signals** are AI-powered insights extracted from emails that match your relationships. When you connect your email (Gmail or Outlook), NextBestMove:

1. **Matches Emails to Relationships** - Automatically matches incoming/outgoing emails to your relationships based on email addresses
2. **Extracts Signals** - Uses AI to analyze email content and extract:
   - **1-line summary** - Quick overview of the email thread
   - **Detailed summary** - More comprehensive analysis
   - **Primary category** - Main purpose of the email (e.g., "Follow-up", "Introduction", "Request")
   - **Topics** - Key topics discussed
   - **Asks from sender** - What the sender is asking for
   - **Value to capture** - Opportunities or value in the email
   - **Suggested next actions** - Recommended actions based on the email
   - **Attachments** - Files mentioned or attached
   - **Links** - URLs mentioned in the email
   - **Sentiment** - Overall tone of the email
   - **Relationship signal** - Strength of the relationship signal (weak, moderate, strong)

3. **Creates Actions** - Automatically creates FOLLOW_UP actions if the AI recommends them

### Email Connection

To enable email signals:

1. Go to **Settings** → **Email**
2. Click "Connect Gmail" or "Connect Outlook"
3. Complete the OAuth flow
4. Your email connection will be saved

**What We Access:**
- We read email metadata (subject, sender, snippet, full body) for emails matching your relationships
- We do **not** send emails on your behalf
- We do **not** read emails that don't match your relationships

### Email Signals Display

Email signals are displayed in:
- **Relationship Detail Page** - See signals for a specific relationship
- **Signals Page** - See all email signals across relationships

Each signal shows:
- 1-line summary
- Asks from sender
- Topics discussed
- Suggested next actions
- Attachments to review
- Signal strength

---

## Weekly Reviews

### What Is a Weekly Review?

Each week, NextBestMove generates a **Weekly Review** that summarizes your activity and provides insights.

### Weekly Review Contents

1. **Metrics Summary**
   - Days active
   - Actions completed
   - Replies received
   - Calls booked

2. **Narrative Summary** (AI-assisted)
   - 2-3 sentence summary of your week
   - Highlights key wins and patterns

3. **Insight**
   - One actionable insight based on your activity
   - Example: "When you followed up within 3 days, replies were higher."

4. **Suggested Weekly Focus**
   - A one-line focus for the next week
   - Example: "This week: book 2 calls and revive 3 stalled conversations."
   - You can approve or edit this focus

5. **Content Prompts** (if you completed ≥ 6 actions)
   - Up to 2 LinkedIn-style post drafts:
     - 1 "win" post (if you had any wins)
     - 1 "insight" or "process" post
   - You can edit these before posting (nothing is auto-posted)

### Weekly Focus

Your **Weekly Focus** is a one-line statement that guides your week. It's:
- Generated based on your last week's activity
- Suggested on Sunday night / Monday morning
- Editable - you can always change it
- Used by the decision engine to prioritize actions

**Example Focuses:**
- "This week: build momentum with 4 solid days of action."
- "This week: revive 3 warm threads and tighten your follow-ups."
- "This week: send clear CTAs and book at least 1 call."
- "This week: close 2 warm opportunities and start 5 new conversations."

---

## Settings

### Account Overview

- **Name** - Your display name
- **Email** - Your account email
- **Timezone** - Your timezone (used for date calculations and plan generation)
- **Working Hours** - When you typically work (used for capacity calculation)

### Calendar Settings

- **Calendar Connection** - Connect/disconnect Google Calendar or Outlook
- **Working Hours** - Set your working hours (9 AM - 5 PM default)
- **Weekend Preference** - Include or exclude weekends from daily plans

### Email Settings

- **Email Connection** - Connect/disconnect Gmail or Outlook
- **Sync Status** - See when emails were last synced
- **Manual Sync** - Trigger a manual email sync

### Default Capacity

Set your default daily capacity:
- **Auto** (from calendar) - Automatically calculated from your calendar
- **Busy Day** - 1-2 actions
- **Light Day** - 3-4 actions
- **Standard** - 5-6 actions
- **Heavy Day** - 7-8 actions

**Note:** This is your default. You can override it for any specific day on the Daily Plan page.

The Settings page also shows your **today's effective capacity** if it differs from your default (e.g., due to adaptive recovery).

### Notification Preferences

Control which emails you receive:
- **Morning Plan** - Daily email with your plan
- **Fast Win Reminder** - Reminder to complete your Fast Win
- **Follow-Up Alerts** - Alerts for overdue follow-ups
- **Weekly Summary** - Weekly review email

### Data Export

Download all your data as JSON:
- Relationships
- Actions
- Daily Plans
- Weekly Summaries
- Content Prompts

### Account Deletion

You can delete your account at any time. This will:
- Permanently delete all your data
- Cancel any active subscriptions
- Remove your account from the system

---

## Frequently Asked Questions

### General

**Q: Is NextBestMove a CRM?**  
A: No. NextBestMove is an actions-first workflow app. We don't track pipeline stages, lead scores, or require heavy data entry. Relationships exist to support the decision engine and help surface your next best moves.

**Q: How is NextBestMove different from other productivity apps?**  
A: NextBestMove is specifically designed for revenue-focused actions. It's not a generic habit tracker or task manager. It focuses on helping you maintain consistent outreach and follow-up to drive revenue.

**Q: Do I need to connect my calendar?**  
A: No, but it's highly recommended. Connecting your calendar allows NextBestMove to automatically size your daily plans based on your actual availability. Without a calendar, you'll get a default plan size (Standard: 5-6 actions).

**Q: Do I need to connect my email?**  
A: No, but it's recommended. Connecting your email enables email signals, which help you stay on top of important conversations and automatically create follow-up actions.

### Daily Plans

**Q: How many actions will I get each day?**  
A: It depends on your calendar availability and settings:
- **Busy Day:** 1-2 actions
- **Light Day:** 3-4 actions
- **Standard:** 5-6 actions (default if no calendar)
- **Heavy Day:** 7-8 actions
- **Auto:** Calculated from your calendar (1-8 actions based on free time)

**Q: Why did my plan size change?**  
A: Your plan size can change due to:
- Calendar availability (if using Auto capacity)
- Manual override (you changed it)
- Adaptive Recovery (you've been inactive or had low completion)

**Q: Can I change my plan size for a specific day?**  
A: Yes! On the Daily Plan page, you can select a different capacity level (Busy Day, Light Day, Standard, Heavy Day, or Auto) for that day.

**Q: What is a Fast Win?**  
A: A Fast Win is a quick, high-impact action that takes less than 5 minutes. Every daily plan starts with one Fast Win to help you build momentum.

**Q: Why am I seeing "Busy Day" or "Light Day" when I didn't set it?**  
A: This is likely due to **Adaptive Recovery**. If you've been inactive for 7+ days, broken a streak, or had low completion for 3+ days, NextBestMove automatically reduces your plan size to help you ease back in.

### Actions

**Q: What's the difference between "Done – no reply yet" and "Got a reply"?**  
A: 
- **"Done – no reply yet"** (SENT state) - You completed the action but haven't received a reply. The action is marked as sent.
- **"Got a reply"** (REPLIED state) - You received a reply. This triggers the follow-up flow to help you decide what's next.

**Q: What happens when I snooze an action?**  
A: The action is deferred to the date you select. On that date, it automatically returns to NEW state and can appear in your daily plan again.

**Q: Can I edit an action?**  
A: Yes, you can edit action details, notes, and due dates from the action detail view.

**Q: What are "promised follow-ups"?**  
A: Promised follow-ups are actions where you've made an explicit commitment (e.g., "I'll send that by EOD"). These are visually escalated when overdue and get priority in the decision engine.

### Relationships

**Q: How do I add a relationship?**  
A: Go to the **Relationships** page and click "Add Relationship". Enter the name and at least one contact method (LinkedIn URL, email, or phone number). Optional: add notes, set cadence, and assign a tier.

**Q: What's the difference between relationship status and relationship state?**  
A: 
- **Status** (ACTIVE, SNOOZED, ARCHIVED) - Controls whether the relationship appears in your active list
- **State** (Unengaged, Active Conversation, Opportunity, etc.) - Describes the relationship's current stage, used by the decision engine to prioritize actions

**Q: What is "Next Touch Due"?**  
A: This is calculated based on your last interaction date and the relationship's cadence. If a relationship is overdue for a touch, it will be highlighted in the Today page and Relationships page.

**Q: How does the Notes Summary work?**  
A: The Notes Summary uses AI to organize notes from various sources (onboarding, emails, meeting notes) into key topics. It shows the last discussion date for each topic and associated action items.

### Calendar

**Q: What calendar data does NextBestMove access?**  
A: We only read your **free/busy** data (when you're available vs. busy). We do **not** read event details, titles, or attendees.

**Q: Can I use multiple calendars?**  
A: Currently, NextBestMove connects to one calendar account (Google or Outlook). Support for multiple calendars may be added in the future.

**Q: How often is calendar data refreshed?**  
A: Calendar data is refreshed when you generate a daily plan. We also proactively refresh calendar tokens to prevent expiration.

### Email Signals

**Q: What emails does NextBestMove analyze?**  
A: NextBestMove only analyzes emails that match your relationships (based on email addresses). We don't analyze emails from people who aren't in your relationships list.

**Q: Does NextBestMove send emails?**  
A: No. NextBestMove only reads emails to extract signals. We never send emails on your behalf.

**Q: How often are emails synced?**  
A: Emails are synced automatically when you connect your email account. You can also trigger a manual sync from Settings → Email.

**Q: What if an email signal is incorrect?**  
A: Email signals are AI-powered and may not always be perfect. You can always edit or ignore suggested actions created from email signals.

### Weekly Reviews

**Q: When are weekly reviews generated?**  
A: Weekly reviews are generated on Sunday night / Monday morning for the previous week.

**Q: Can I edit the weekly focus?**  
A: Yes! You can always edit the suggested weekly focus. Go to the Weekly Review page and click "Edit" on the focus statement.

**Q: Are content prompts auto-posted?**  
A: No. Content prompts are drafts that you can edit before posting. Nothing is ever auto-posted.

### Adaptive Recovery

**Q: What is Adaptive Recovery?**  
A: Adaptive Recovery is a feature that automatically adjusts your daily plan size based on your activity patterns. It helps you ease back into your routine without feeling overwhelmed.

**Q: When does Adaptive Recovery activate?**  
A: 
- After 7+ days inactive → Very light plan (1-2 actions)
- After 2-6 days inactive (streak break) → Light plan (2 actions)
- After 3+ days with <50% completion → Lighter plan (3-4 actions)
- After 7+ days with >80% completion → May suggest increasing capacity

**Q: Can I disable Adaptive Recovery?**  
A: Adaptive Recovery only applies when you haven't manually set a capacity override. If you manually set your capacity, it takes precedence over adaptive recovery.

**Q: How do I get back to normal capacity after Adaptive Recovery?**  
A: Simply complete your actions for a day or two, and the system will automatically return to your normal capacity.

### Billing & Subscriptions

**Q: How do I manage my subscription?**  
A: Go to **Settings** → **Billing** and click "Manage Billing" to access the Stripe Billing Portal.

**Q: Can I cancel my subscription?**  
A: Yes, you can cancel your subscription at any time from the Billing Portal.

**Q: What happens if I cancel?**  
A: You'll continue to have access until the end of your current billing period. After that, you'll lose access to premium features.

### Technical

**Q: What timezone does NextBestMove use?**  
A: NextBestMove uses the timezone you set in Settings → Account Overview. All dates and times are calculated based on your timezone.

**Q: Can I export my data?**  
A: Yes! Go to **Settings** → **Data Export** to download all your data as JSON.

**Q: How do I delete my account?**  
A: Go to **Settings** → **Account Deletion** and follow the instructions. This will permanently delete all your data.

**Q: Is my data secure?**  
A: Yes. NextBestMove uses industry-standard security practices, including:
- Encrypted data transmission (HTTPS)
- Secure authentication (Supabase Auth)
- Row-level security (RLS) in the database
- Regular security audits

---

## Still Have Questions?

If you have questions that aren't answered here, please contact support or check the documentation.

---

*Last updated: January 2025*

