# UI Changes After Email Signals Fix

**Date:** 2025-12-31  
**Related Plan:** `Fix_Action_Details_And_Email_Signals_Plan.md`

---

## Overview

When you click on a relationship with matched emails, you'll see **new AI-powered information** in the Email Signals section. The "Key Topics" section (from meeting notes) is separate and won't change.

---

## Relationship Detail Page Structure

When viewing a relationship (`/app/leads/[id]`), you'll see:

1. **Notes Summary Section** (top) - Shows meeting notes, momentum, pending actions
   - **Key Topics** section (from meeting notes) - **UNCHANGED** by this fix
2. **Email Signals Section** (middle) - Shows email analysis - **NEW AI FIELDS ADDED**
3. **Relationship Details Section** (bottom) - Shows cadence, tier, notes - **UNCHANGED**

---

## Email Signals Section - What You'll See

### Before Fix (Current State)

```
┌─────────────────────────────────────┐
│ Email Signals                        │
├─────────────────────────────────────┤
│ Last Email: 2 days ago               │
│                                      │
│ Recent Topics:                       │
│ [Project Update] [Budget Review]    │
│                                      │
│ Recent Asks:                         │
│ • Can you review the proposal?      │
│                                      │
│ Open Loops:                          │
│ ⚠️ Waiting for contract signature   │
└─────────────────────────────────────┘
```

### After Fix (New State)

```
┌─────────────────────────────────────┐
│ Email Signals                        │
├─────────────────────────────────────┤
│ Last Email: 2 days ago               │
│                                      │
│ Recent Topics:                       │
│ [Project Update] [Budget Review]     │
│                                      │
│ Recent Asks:                         │
│ • Can you review the proposal?      │
│                                      │
│ Open Loops:                          │
│ ⚠️ Waiting for contract signature   │
│                                      │
│ ─────────────────────────────────── │
│                                      │
│ Sentiment: [positive] 🟢            │
│                                      │
│ Intent: [request] 🔵                 │
│                                      │
│ Recommended Action:                  │
│ ┌─────────────────────────────────┐ │
│ │ FOLLOW UP                       │ │
│ │ Follow up with sender on        │ │
│ │ proposal review                 │ │
│ │ Suggested due: Jan 2, 2026     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Detailed UI Changes

### 1. Sentiment Badge (NEW)

**Location:** Email Signals section, after "Open Loops"

**Display:**

- **Positive** → Green badge: `bg-green-100 text-green-800`
- **Neutral** → Gray badge: `bg-zinc-100 text-zinc-800`
- **Negative** → Red badge: `bg-red-100 text-red-800`
- **Urgent** → Orange badge: `bg-orange-100 text-orange-800`

**Source:** AI analysis of email content (full body analysis)

**Example:**

```
Sentiment
[positive]
```

---

### 2. Intent Badge (NEW)

**Location:** Email Signals section, after "Sentiment"

**Display:**

- Badge showing intent type: `question`, `request`, `follow_up`, `introduction`, `meeting_request`, `proposal`, `complaint`, or `other`
- Blue badge: `bg-blue-100 text-blue-800`
- Underscores replaced with spaces (e.g., "follow_up" → "follow up")

**Source:** AI classification of email intent

**Example:**

```
Intent
[request]
```

---

### 3. Recommended Action Card (NEW)

**Location:** Email Signals section, after "Intent"

**Display:**

- Purple-themed card with border: `bg-purple-50 border border-purple-200`
- **Action Type:** Bold, uppercase (e.g., "FOLLOW UP", "OUTREACH", "NURTURE")
- **Description:** Specific action description from AI
- **Suggested Due Date:** Formatted date (e.g., "Jan 2, 2026")

**Source:** AI recommendation based on:

- Email content analysis
- Attachments mentioned (if any)
- Asks and open loops detected
- Urgency indicators

**Example:**

```
Recommended Action
┌─────────────────────────────────┐
│ FOLLOW UP                       │
│ Follow up with sender on        │
│ proposal review                 │
│ Suggested due: Jan 2, 2026     │
└─────────────────────────────────┘
```

**Visual Styling:**

- Light purple background (`bg-purple-50`)
- Purple border (`border-purple-200`)
- Action type in purple-900 (`text-purple-900`)
- Description in purple-700 (`text-purple-700`)
- Due date in smaller gray text

---

## How Topics Are Affected

### "Recent Topics" (Email Signals Section)

**Current Behavior:**

- Extracted from email `last_topic` field
- Shows up to 5 most recent topics
- Displayed as blue badges

**After Fix:**

- **Quality improves** - AI extraction is more accurate than rule-based
- **No display changes** - Still shows as blue badges, same location
- Topics come from AI analysis of full email body (not just subject/snippet)

**Example Topics:**

- "Project milestone review"
- "Budget approval needed"
- "Contract negotiation"

---

### "Key Topics" (Notes Summary Section)

**Location:** Notes Summary section (separate from Email Signals)

**Current Source:** Extracted from **meeting notes** (not emails)

**Status:** **UNCHANGED** by this fix, but **NEX-45** will integrate email topics

**Display:**

- Gray badges in "Key Topics" section
- Currently shows research topics from meeting notes AI extraction

**Future (NEX-45):**

- Will include topics from **both** meeting notes AND emails
- Unified view of all relationship topics
- Reduces cognitive load by showing single stream of information
- Email topics from `email_metadata.last_topic` will be merged with notes topics

**Note:** Currently, email topics are shown separately in "Recent Topics" (Email Signals section). NEX-45 will unify them into Key Topics for a single relationship view.

---

## How Actions Are Affected

### Automatic Action Creation (NEW)

**What Happens:**
When AI recommends an action from an email, a **new action is automatically created** in your actions list.

**Action Properties:**

- **Type:** Matches recommended action type (FOLLOW_UP, OUTREACH, NURTURE, etc.)
- **Description:** Uses AI's recommended description (e.g., "Follow up with sender on proposal review")
- **Due Date:** Based on AI's urgency calculation (defaults to tomorrow if no specific urgency)
- **State:** `NEW` (appears in your action list)
- **Auto-created:** `true` (marked as system-generated)
- **Notes:** Includes reference to source email: `"Auto-created from email signal (email_metadata_id: ...)"`
- **Person ID:** Linked to the relationship that received the email

**Where You'll See It:**

- In your **Actions tab** (`/app/actions`)
- In your **Daily Plan** (if due date matches)
- In the relationship's **Pending Actions** section (Notes Summary)

**Example:**

```
┌─────────────────────────────────────┐
│ Pending Actions (1)                  │
├─────────────────────────────────────┤
│ [FOLLOW UP]                          │
│ Follow up with sender on proposal   │
│ review                               │
│ Due Jan 2                            │
└─────────────────────────────────────┘
```

**Note:** The action description is based on the AI's analysis of:

- Email content
- Topics mentioned
- Asks detected
- Open loops identified
- **Attachments mentioned** (if any - see below)

---

## Attachments Handling

### Current State (v0.1)

**Attachments are NOT captured yet** - This is a backlog item (NEX-43).

**What the AI Sees:**

- The AI prompt mentions "attachments mentioned" in the email text
- The AI can infer from email content like "I've attached the proposal" or "See attached document"
- But we don't actually fetch or analyze attachment files

**What This Means:**

- AI can recommend actions based on **mentions** of attachments (e.g., "Review the attached proposal")
- But you won't see attachment files or their contents
- Recommended actions might say "Review attachment and provide feedback" based on email text

**Example AI Recommendation:**

```
Recommended Action
┌─────────────────────────────────┐
│ FOLLOW UP                       │
│ Review attached proposal and    │
│ provide feedback                │
│ Suggested due: Jan 2, 2026     │
└─────────────────────────────────┘
```

**Future (NEX-43):**

- Will capture attachment metadata (filename, size, type)
- Will analyze attachment contents (if text-based)
- Will show attachments in email signals UI
- Will create more specific actions based on attachment content

---

## Summary of Changes

### ✅ What You'll See (NEW)

1. **Sentiment badge** in Email Signals section
2. **Intent badge** in Email Signals section
3. **Recommended Action card** with purple styling
4. **Automatically created actions** in your Actions list
5. **Better topic extraction** (AI-powered, more accurate)

### ❌ What Won't Change

1. **Key Topics** section (from meeting notes) - separate system
2. **Recent Topics** display format - same badges, better quality
3. **Attachment files** - not captured yet (backlog)
4. **Action Details modal** - will work (bug fix), but no new fields

### 🔄 What Improves

1. **Topic quality** - AI extraction is more accurate
2. **Action recommendations** - AI suggests specific follow-ups
3. **Action automation** - Actions created automatically from email signals
4. **Action details** - Modal will load without errors

---

## Visual Comparison

### Email Signals Section - Side by Side

| Before        | After                          |
| ------------- | ------------------------------ |
| Last Email    | Last Email                     |
| Recent Topics | Recent Topics (better quality) |
| Recent Asks   | Recent Asks                    |
| Open Loops    | Open Loops                     |
|               | **Sentiment** ← NEW            |
|               | **Intent** ← NEW               |
|               | **Recommended Action** ← NEW   |

---

## Example Scenario

**Email Received:**

```
From: sarah@example.com
Subject: Proposal Review Needed
Body: "Hi, I've attached the Q1 proposal. Can you review
       it by Friday? We need to finalize the budget."
```

**What You'll See:**

1. **Email Signals Section:**

   - Sentiment: `[positive]` 🟢
   - Intent: `[request]` 🔵
   - Recommended Action:
     ```
     FOLLOW UP
     Review attached proposal and provide feedback
     Suggested due: Jan 3, 2026
     ```

2. **Actions List:**

   - New action created:
     - Type: `FOLLOW_UP`
     - Description: "Review attached proposal and provide feedback"
     - Due: Jan 3, 2026
     - Auto-created: Yes

3. **Recent Topics:**

   - "Proposal review"
   - "Budget finalization"

4. **Recent Asks:**

   - "Can you review it by Friday?"

5. **Open Loops:**
   - "Waiting for proposal review"

---

## Technical Notes

- All AI fields come from the most recent email for that relationship
- If multiple emails exist, only the latest email's AI analysis is shown
- Sentiment and intent are from the most recent email
- Recommended action is from the most recent email
- Topics are aggregated from all recent emails (last 30 days)
- Actions are created immediately when email is ingested (if AI recommends)

---

## Related Files

- `web/src/app/app/leads/[id]/RelationshipSignals.tsx` - Email Signals UI
- `web/src/app/app/leads/[id]/NotesSummary.tsx` - Key Topics (unchanged)
- `web/src/app/app/leads/[id]/RelationshipDetailClient.tsx` - Page layout
- `web/src/app/api/email/signals/relationship/[id]/route.ts` - API endpoint
