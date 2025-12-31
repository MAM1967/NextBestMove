# Fix Action Details API and Email Signals Display Plan

**Date:** 2025-12-31  
**Priority:** 🔴 P0 - Critical  
**Related Issues:** Action details error, signals not showing AI fields

---

## Problem Summary

Three critical issues identified:

1. **Action Details API Error**: PostgREST join ambiguity causing API failures
2. **Email Signals Not Displaying AI Fields**: Sentiment, intent, and recommended actions not shown in UI
3. **Recommended Actions Not Being Created**: AI-recommended actions from emails not being stored or created

---

## Issue 1: Action Details API PostgREST Join Error

### Root Cause
The `/api/actions/[id]/route.ts` uses a nested PostgREST join syntax:
```typescript
.select(`
  *,
  leads (
    id,
    name,
    url,
    notes,
    status
  )
`)
```

PostgREST cannot resolve which foreign key relationship to use because there are **two** relationships between `actions` and `leads`:
- `actions_person_id_fkey`: `actions.person_id` → `leads.id` (many-to-one)
- `leads_next_move_action_id_fkey`: `leads.next_move_action_id` → `actions.id` (one-to-many)

Error from logs:
```
code: 'PGRST201',
message: "Could not embed because more than one relationship was found for 'actions' and 'leads'"
```

### Solution
Refactor to fetch action and lead separately (same pattern as daily plan API fix):

1. Fetch action first (without join)
2. If `action.person_id` exists, fetch lead separately
3. Combine in response

### Files to Modify
- `web/src/app/api/actions/[id]/route.ts`

### Implementation Steps
1. Remove nested `leads(...)` join from select query
2. Fetch action with `select("*")` only
3. After action fetch, conditionally fetch lead if `action.person_id` exists:
   ```typescript
   let lead: any = null;
   if (action.person_id) {
     const { data: fetchedLead, error: leadError } = await supabase
       .from("leads")
       .select("id, name, linkedin_url, email, phone_number, url, notes, status")
       .eq("id", action.person_id)
       .eq("user_id", user.id)
       .single();
     
     if (!leadError && fetchedLead) {
       lead = fetchedLead;
     }
   }
   ```
4. Return combined response: `{ ...action, leads: lead, history, relatedActions }`

---

## Issue 2: Email Signals Not Displaying AI Fields

### Root Cause Analysis

#### 2.1 Database Migration Incomplete
The migration `20251231092826_add_ai_email_fields.sql` is **missing** the recommended action fields:
- ❌ `recommended_action_type`
- ❌ `recommended_action_description`
- ❌ `recommended_due_date`

#### 2.2 API Routes Not Selecting AI Fields
- `/api/email/signals/relationship/[id]/route.ts`: Only selects basic fields, missing `sentiment`, `intent`, `recommended_action_*`
- `/api/email/signals/route.ts`: Only selects basic fields, missing AI fields

#### 2.3 TypeScript Types Missing AI Fields
- `web/src/lib/email/types.ts`: `EmailSignals` interface doesn't include AI fields

#### 2.4 UI Components Not Displaying AI Fields
- `web/src/app/app/leads/[id]/RelationshipSignals.tsx`: No UI for sentiment, intent, or recommended actions
- `web/src/app/app/signals/SignalsClient.tsx`: No UI for sentiment, intent, or recommended actions

#### 2.5 Email Ingestion Not Storing Recommended Actions
- `web/src/lib/email/ingestion.ts`: Stores `sentiment` and `intent` but **NOT** `recommended_action_type`, `recommended_action_description`, or `recommended_due_date`

### Solution

#### Step 1: Complete Database Migration
Create new migration to add missing recommended action fields:

**File:** `supabase/migrations/20251231180000_add_recommended_action_fields.sql`
```sql
-- Add recommended action fields to email_metadata table
-- Part of NEX-42: AI-Powered Email Signal Extraction

ALTER TABLE email_metadata
  ADD COLUMN IF NOT EXISTS recommended_action_type TEXT CHECK (recommended_action_type IN ('OUTREACH', 'FOLLOW_UP', 'NURTURE', 'CALL_PREP', 'POST_CALL', 'CONTENT', 'FAST_WIN')),
  ADD COLUMN IF NOT EXISTS recommended_action_description TEXT,
  ADD COLUMN IF NOT EXISTS recommended_due_date DATE;

-- Add index for recommended action type
CREATE INDEX IF NOT EXISTS idx_email_metadata_recommended_action ON email_metadata(recommended_action_type) WHERE recommended_action_type IS NOT NULL;

-- Add comments
COMMENT ON COLUMN email_metadata.recommended_action_type IS 'AI-recommended action type based on email content and attachments. Automatically creates action if enabled.';
COMMENT ON COLUMN email_metadata.recommended_action_description IS 'AI-generated description for the recommended follow-up action (e.g., "Follow up with sender on topic X").';
COMMENT ON COLUMN email_metadata.recommended_due_date IS 'AI-suggested due date for the recommended action based on email urgency and context.';
```

#### Step 2: Update Email Ingestion to Store Recommended Actions
**File:** `web/src/lib/email/ingestion.ts`

In both `ingestGmailMetadata` and `ingestOutlookMetadata` functions:

1. After AI extraction, calculate `recommendedDueDate`:
   ```typescript
   let recommendedDueDate: string | null = null;
   if (signals.recommendedAction?.due_date_days !== null && signals.recommendedAction?.due_date_days !== undefined) {
     const dueDate = new Date();
     dueDate.setDate(dueDate.getDate() + signals.recommendedAction.due_date_days);
     recommendedDueDate = dueDate.toISOString().split("T")[0]; // YYYY-MM-DD format
   } else if (signals.recommendedAction?.action_type) {
     // Default to tomorrow if action is recommended but no specific due_date_days
     const tomorrow = new Date();
     tomorrow.setDate(tomorrow.getDate() + 1);
     recommendedDueDate = tomorrow.toISOString().split("T")[0];
   }
   ```

2. Add to insert statement:
   ```typescript
   recommended_action_type: signals.recommendedAction?.action_type || null,
   recommended_action_description: signals.recommendedAction?.description || null,
   recommended_due_date: recommendedDueDate,
   ```

#### Step 3: Update API Routes to Select AI Fields

**File:** `web/src/app/api/email/signals/relationship/[id]/route.ts`

Update select query (line 56-58):
```typescript
.select(
  "id, subject, snippet, received_at, last_topic, ask, open_loops, priority, person_id, from_email_hash, sentiment, intent, recommended_action_type, recommended_action_description, recommended_due_date"
)
```

**File:** `web/src/app/api/email/signals/route.ts`

Update select query (line 27-29):
```typescript
.select(
  "id, subject, snippet, received_at, last_topic, ask, open_loops, priority, person_id, sentiment, intent, recommended_action_type, recommended_action_description, recommended_due_date"
)
```

Update aggregation logic to include AI fields from most recent email (around line 120-124):
```typescript
// Update last email received if this is more recent
if (new Date(email.received_at) > new Date(signal.last_email_received || 0)) {
  signal.last_email_received = email.received_at;
  // Include AI fields from most recent email
  signal.last_email_sentiment = email.sentiment;
  signal.last_email_intent = email.intent;
  signal.recommended_action_type = email.recommended_action_type;
  signal.recommended_action_description = email.recommended_action_description;
  signal.recommended_due_date = email.recommended_due_date;
}
```

#### Step 4: Update TypeScript Types

**File:** `web/src/lib/email/types.ts`

Add AI fields to `EmailSignals` interface:
```typescript
export type Sentiment = "positive" | "neutral" | "negative" | "urgent";
export type Intent = "question" | "request" | "follow_up" | "introduction" | "meeting_request" | "proposal" | "complaint" | "other";
export type ActionType = "OUTREACH" | "FOLLOW_UP" | "NURTURE" | "CALL_PREP" | "POST_CALL" | "CONTENT" | "FAST_WIN";

export interface EmailSignals {
  relationship_id: string | null;
  relationship_name?: string | null;
  last_email_received: string | null;
  recent_topics: string[];
  recent_asks: string[];
  recent_open_loops: string[];
  unread_count: number;
  recent_labels: string[];
  // AI-powered fields
  last_email_sentiment: Sentiment | null;
  last_email_intent: Intent | null;
  recommended_action_type: ActionType | null;
  recommended_action_description: string | null;
  recommended_due_date: string | null;
}
```

#### Step 5: Update UI Components

**File:** `web/src/app/app/leads/[id]/RelationshipSignals.tsx`

1. Update state transformation to include AI fields (around line 32-48):
   ```typescript
   const lastEmail = data.emails[0];
   setSignals({
     relationship_id: data.relationship_id,
     relationship_name: data.relationship_name,
     last_email_received: lastEmail.received_at,
     unread_count: 0,
     recent_topics: data.emails.map((e: any) => e.last_topic).filter((t: string | null) => t !== null),
     recent_asks: data.emails.map((e: any) => e.ask).filter((a: string | null) => a !== null),
     recent_open_loops: Array.isArray(lastEmail.open_loops) ? lastEmail.open_loops : [],
     recent_labels: [],
     // AI fields from most recent email
     last_email_sentiment: lastEmail.sentiment || null,
     last_email_intent: lastEmail.intent || null,
     recommended_action_type: lastEmail.recommended_action_type || null,
     recommended_action_description: lastEmail.recommended_action_description || null,
     recommended_due_date: lastEmail.recommended_due_date || null,
   });
   ```

2. Add UI sections to display AI fields (after line 159, before closing div):
   ```typescript
   {/* Sentiment */}
   {signals.last_email_sentiment && (
     <div>
       <div className="text-xs font-medium text-zinc-600">Sentiment</div>
       <div className="mt-1">
         <span className={`rounded-full px-2 py-1 text-xs font-medium ${
           signals.last_email_sentiment === 'positive' ? 'bg-green-100 text-green-800' :
           signals.last_email_sentiment === 'negative' ? 'bg-red-100 text-red-800' :
           signals.last_email_sentiment === 'urgent' ? 'bg-orange-100 text-orange-800' :
           'bg-zinc-100 text-zinc-800'
         }`}>
           {signals.last_email_sentiment}
         </span>
       </div>
     </div>
   )}

   {/* Intent */}
   {signals.last_email_intent && (
     <div>
       <div className="text-xs font-medium text-zinc-600">Intent</div>
       <div className="mt-1">
         <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
           {signals.last_email_intent.replace('_', ' ')}
         </span>
       </div>
     </div>
   )}

   {/* Recommended Action */}
   {signals.recommended_action_type && (
     <div>
       <div className="text-xs font-medium text-purple-700">Recommended Action</div>
       <div className="mt-1 space-y-1">
         <div className="text-sm font-medium text-purple-900">
           {signals.recommended_action_type.replace('_', ' ')}
         </div>
         {signals.recommended_action_description && (
           <p className="text-sm text-zinc-700">{signals.recommended_action_description}</p>
         )}
         {signals.recommended_due_date && (
           <p className="text-xs text-zinc-600">
             Suggested due: {new Date(signals.recommended_due_date).toLocaleDateString()}
           </p>
         )}
       </div>
     </div>
   )}
   ```

**File:** `web/src/app/app/signals/SignalsClient.tsx`

Add similar UI sections in the signal card (around line 175, before closing div):
```typescript
{/* AI-Powered Signals */}
{(signal.last_email_sentiment || signal.last_email_intent || signal.recommended_action_type) && (
  <div className="md:col-span-2 border-t border-zinc-200 pt-3 mt-3">
    <div className="text-xs font-medium text-zinc-600 mb-2">AI Analysis</div>
    <div className="flex flex-wrap gap-2">
      {signal.last_email_sentiment && (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
          signal.last_email_sentiment === 'positive' ? 'bg-green-100 text-green-800' :
          signal.last_email_sentiment === 'negative' ? 'bg-red-100 text-red-800' :
          signal.last_email_sentiment === 'urgent' ? 'bg-orange-100 text-orange-800' :
          'bg-zinc-100 text-zinc-800'
        }`}>
          {signal.last_email_sentiment}
        </span>
      )}
      {signal.last_email_intent && (
        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
          {signal.last_email_intent.replace('_', ' ')}
        </span>
      )}
    </div>
    {signal.recommended_action_type && (
      <div className="mt-2 p-2 rounded-lg bg-purple-50 border border-purple-200">
        <div className="text-xs font-medium text-purple-900">
          Recommended: {signal.recommended_action_type.replace('_', ' ')}
        </div>
        {signal.recommended_action_description && (
          <p className="text-xs text-purple-700 mt-1">{signal.recommended_action_description}</p>
        )}
      </div>
    )}
  </div>
)}
```

---

## Issue 3: Recommended Actions Not Being Created

### Root Cause
The ingestion code stores recommended action fields in `email_metadata` but **does not create actual actions** from them. The `createActionFromEmailSignal` function was referenced but never implemented.

### Solution

#### Step 1: Implement Action Creation Function

**File:** `web/src/lib/email/ingestion.ts`

Add function after `matchEmailToRelationship`:
```typescript
/**
 * Create an action from an AI-recommended email signal
 */
async function createActionFromEmailSignal(
  userId: string,
  personId: string,
  actionType: string,
  description: string,
  dueDate: string,
  emailMetadataId: string
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    
    const { data: action, error } = await supabase
      .from("actions")
      .insert({
        user_id: userId,
        person_id: personId,
        action_type: actionType,
        description: description,
        due_date: dueDate,
        state: "NEW",
        auto_created: true,
        notes: `Auto-created from email signal (email_metadata_id: ${emailMetadataId})`,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`[Email Ingestion] Error creating action from signal:`, error);
      return null;
    }

    console.log(`[Email Ingestion] ✅ Created action ${action.id} from email signal`);
    return action.id;
  } catch (error) {
    console.error(`[Email Ingestion] Error creating action from signal:`, error);
    return null;
  }
}
```

#### Step 2: Call Function After Email Insert

In both `ingestGmailMetadata` and `ingestOutlookMetadata`, after successful email metadata insert:

```typescript
if (!error && insertedEmail) {
  ingestedCount++;
  
  // If AI recommended an action, create it
  if (signals.recommendedAction?.action_type && recommendedDueDate) {
    await createActionFromEmailSignal(
      userId,
      personId,
      signals.recommendedAction.action_type,
      signals.recommendedAction.description || `Follow up on: ${signals.topic}`,
      recommendedDueDate,
      insertedEmail.id
    );
  }
}
```

**Note:** The insert statement needs to return the inserted row. Update to:
```typescript
const { error, data: insertedEmail } = await supabase
  .from("email_metadata")
  .insert({...})
  .select()
  .single();
```

---

## Implementation Order

1. ✅ **Fix Action Details API** (Issue 1) - Quick fix, unblocks action details
2. ✅ **Complete Database Migration** (Issue 2.1) - Required for storing recommended actions
3. ✅ **Update Email Ingestion** (Issue 2.5, Issue 3) - Store and create recommended actions
4. ✅ **Update API Routes** (Issue 2.2) - Return AI fields to frontend
5. ✅ **Update TypeScript Types** (Issue 2.3) - Type safety
6. ✅ **Update UI Components** (Issue 2.4) - Display AI fields

---

## Testing Checklist

- [ ] Action details modal opens without errors
- [ ] Action details shows relationship information correctly
- [ ] Email signals API returns `sentiment`, `intent`, `recommended_action_*` fields
- [ ] Relationship signals page displays sentiment badge
- [ ] Relationship signals page displays intent badge
- [ ] Relationship signals page displays recommended action section
- [ ] Global signals page displays AI analysis section
- [ ] New email sync creates actions when AI recommends them
- [ ] Created actions have `auto_created: true` and reference email_metadata_id in notes

---

## Deployment Notes

1. Apply database migration first: `supabase/migrations/20251231180000_add_recommended_action_fields.sql`
2. Deploy code changes
3. Trigger email sync to test action creation
4. Verify signals display in UI

---

## Related Files

- `web/src/app/api/actions/[id]/route.ts`
- `web/src/app/api/email/signals/route.ts`
- `web/src/app/api/email/signals/relationship/[id]/route.ts`
- `web/src/lib/email/ingestion.ts`
- `web/src/lib/email/types.ts`
- `web/src/app/app/leads/[id]/RelationshipSignals.tsx`
- `web/src/app/app/signals/SignalsClient.tsx`
- `supabase/migrations/20251231092826_add_ai_email_fields.sql` (existing)
- `supabase/migrations/20251231180000_add_recommended_action_fields.sql` (new)

---

## Follow-Up: Integrate Email Topics into Key Topics (NEX-45)

**Status:** Created Linear ticket NEX-45

**Requirement:** Key Topics should include topics discovered from emails, not just meeting notes. Notes and emails are part of the same relationship stream, and users shouldn't need to mentally separate them.

**Implementation:**
1. Update `/api/leads/[id]/summary` to fetch email topics from `email_metadata.last_topic`
2. Merge email topics with notes-based topics
3. Deduplicate and return unified list in `researchTopics` field

**See:** Linear ticket NEX-45 for full details

