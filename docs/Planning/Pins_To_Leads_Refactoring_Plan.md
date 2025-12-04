# Pins to Leads: Comprehensive Refactoring Plan

**Status:** 📋 Ready for Implementation  
**Priority:** P1 (Critical branding/clarity improvement)  
**Estimated Time:** 2-3 days

---

## Overview

This plan covers the complete refactoring from "pins" to "leads" terminology throughout the NextBestMove application. This change affects:

- Database schema (table names, enums, columns)
- API endpoints
- UI components and copy
- TypeScript types
- Documentation
- Variable names and code comments

**Rationale:** "Leads" is more intuitive for users (fractional executives) and aligns with their mental model. Differentiation comes from behavior, not terminology.

---

## Implementation Strategy

**Approach:** Phased rollout to minimize risk and allow testing at each stage.

**Order:**

1. Database schema (migrations)
2. TypeScript types and interfaces
3. API endpoints
4. UI components and copy
5. Documentation

---

## Phase 1: Database Schema Changes (2-3 hours)

### 1.1 Create Migration for Table Rename

**File:** `supabase/migrations/YYYYMMDDHHMMSS_rename_pins_to_leads.sql`

**Changes:**

- Rename `person_pins` table → `leads`
- Rename `pin_status` enum → `lead_status`
- Update all foreign key references
- Update all indexes
- Update RLS policies

**Migration Script:**

```sql
-- Step 1: Rename enum
ALTER TYPE pin_status RENAME TO lead_status;

-- Step 2: Rename table
ALTER TABLE person_pins RENAME TO leads;

-- Step 3: Rename indexes
ALTER INDEX idx_person_pins_user_id RENAME TO idx_leads_user_id;
ALTER INDEX idx_person_pins_status RENAME TO idx_leads_status;
ALTER INDEX idx_person_pins_user_status RENAME TO idx_leads_user_status;
ALTER INDEX idx_person_pins_snooze_until RENAME TO idx_leads_snooze_until;

-- Step 4: Update foreign key in actions table
-- (The foreign key constraint name may need updating)
ALTER TABLE actions
  DROP CONSTRAINT IF EXISTS actions_person_id_fkey,
  ADD CONSTRAINT actions_lead_id_fkey
    FOREIGN KEY (person_id) REFERENCES leads(id) ON DELETE SET NULL;

-- Step 5: Rename column in actions table (optional - can keep person_id for now)
-- ALTER TABLE actions RENAME COLUMN person_id TO lead_id;

-- Step 6: Update RLS policies
DROP POLICY IF EXISTS "Users can view own pins" ON leads;
DROP POLICY IF EXISTS "Users can manage own pins" ON leads;

CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own leads" ON leads
  FOR ALL USING (auth.uid() = user_id);

-- Step 7: Update any functions that reference person_pins
-- (Check for SQL functions that use person_pins)
```

**⚠️ Important:**

- Test migration on staging first
- Backup production database before running
- Consider keeping `person_id` column name in `actions` table for backward compatibility (can rename later)

### 1.2 Update All SQL References

**Files to update:**

- All migration files that reference `person_pins`
- All SQL functions that reference `person_pins`
- Test data scripts

**Search and replace:**

- `person_pins` → `leads`
- `pin_status` → `lead_status`
- `person_id` → `lead_id` (in actions table, if renaming)

---

## Phase 2: TypeScript Types & Interfaces (1 hour)

### 2.1 Create New Type Definitions

**File:** `web/src/lib/leads/types.ts` (new file, or update existing)

**Changes:**

- Rename `PersonPin` → `Lead`
- Rename `PinStatus` → `LeadStatus`
- Update all type exports

**Example:**

```typescript
export type LeadStatus = "ACTIVE" | "SNOOZED" | "ARCHIVED";

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  url: string;
  notes: string | null;
  status: LeadStatus;
  snooze_until: string | null;
  created_at: string;
  updated_at: string;
}
```

### 2.2 Update All Type Imports

**Files to update:**

- All files importing `PersonPin` → `Lead`
- All files importing `PinStatus` → `LeadStatus`
- All files using `personPin` variable → `lead`

**Search pattern:**

- `PersonPin` → `Lead`
- `personPin` → `lead`
- `personPins` → `leads`
- `PinStatus` → `LeadStatus`

---

## Phase 3: API Endpoints (2-3 hours)

### 3.1 Rename API Routes

**File Structure Changes:**

- `web/src/app/api/pins/route.ts` → `web/src/app/api/leads/route.ts`
- `web/src/app/api/pins/[id]/route.ts` → `web/src/app/api/leads/[id]/route.ts`
- `web/src/app/api/pins/[id]/status/route.ts` → `web/src/app/api/leads/[id]/status/route.ts`

**Changes in each file:**

- Update table references: `person_pins` → `leads`
- Update enum references: `pin_status` → `lead_status`
- Update variable names: `pin` → `lead`, `pins` → `leads`
- Update error messages and responses

### 3.2 Update Other API Endpoints

**Files that reference pins:**

- `web/src/app/api/actions/route.ts` - Update `person_id` references
- `web/src/app/api/daily-plans/route.ts` - Update pin references
- `web/src/app/api/export/route.ts` - Update export logic
- `web/src/app/api/pre-call-briefs/route.ts` - Update `person_pin_id` references
- `web/src/app/api/billing/webhook/route.ts` - Update pin limit checks
- `web/src/app/api/billing/check-pin-limit/route.ts` → `check-lead-limit`
- `web/src/app/api/billing/check-downgrade-warning/route.ts` - Update pin references
- All cron job endpoints that reference pins

**Search and replace:**

- `person_pins` → `leads`
- `person_id` → `lead_id` (or keep as `person_id` for now)
- `personPin` → `lead`
- `pins` → `leads` (in variable names)

---

## Phase 4: UI Components & Copy (3-4 hours)

### 4.1 Rename Component Files

**File Renames:**

- `web/src/app/app/pins/page.tsx` → `web/src/app/app/leads/page.tsx`
- `web/src/app/app/pins/PinList.tsx` → `web/src/app/app/leads/LeadList.tsx`
- `web/src/app/app/pins/PinRow.tsx` → `web/src/app/app/leads/LeadRow.tsx`
- `web/src/app/app/pins/AddPersonModal.tsx` → `web/src/app/app/leads/AddLeadModal.tsx`
- `web/src/app/app/pins/EditPersonModal.tsx` → `web/src/app/app/leads/EditLeadModal.tsx`
- `web/src/app/app/pins/SnoozeModal.tsx` → `web/src/app/app/leads/SnoozeModal.tsx` (or keep name if generic)

### 4.2 Update Component Code

**In each component file:**

- Update component names: `PinList` → `LeadList`, etc.
- Update props: `PersonPin` → `Lead`
- Update variable names: `pin` → `lead`, `pins` → `leads`
- Update API calls: `/api/pins` → `/api/leads`
- Update all UI copy (see copy guide below)

### 4.3 Update Navigation & Routes

**Files:**

- `web/src/app/app/layout.tsx` - Update navigation links
- Any routing configuration files
- Update route: `/app/pins` → `/app/leads`

### 4.4 Update Onboarding

**File:** `web/src/app/onboarding/steps/PinFirstPersonStep.tsx`

**Rename to:** `AddFirstLeadStep.tsx`

**Copy Updates:**

- "Pin your first person" → "Add your first lead"
- "Add a pin" → "Add a lead"
- Update all onboarding copy to use "lead" terminology

**File:** `web/src/app/onboarding/OnboardingFlow.tsx`

- Update step references
- Update copy

### 4.5 Update All UI Copy

**Key Copy Changes:**

**Page Headers:**

- "Pin Management" → "Leads"
- "Your Pins" → "Your Leads"
- "Add Pin" → "Add Lead"

**Empty States:**

- "No pins yet" → "No leads yet"
- "Add your first pin" → "Add your first lead"

**Buttons:**

- "Add Pin" → "Add Lead"
- "Pin a Person" → "Add Lead"

**Modals:**

- "Pin a Person" → "Add Lead"
- "Edit Pin" → "Edit Lead"

**Status Labels:**

- Keep: "Active", "Snoozed", "Archived" (these are fine)

**Onboarding:**

- "Pin your first person" → "Add your first lead"
- "Just a name and a link. No forms to fill out." (keep this)

**Settings:**

- "Pin limit" → "Lead limit"
- Update billing section references

**Upgrade Modals:**

- "Pin limit hit (10)" → "Lead limit hit (10)"
- "Add unlimited Pins with Premium" → "Add unlimited Leads with Premium"

---

## Phase 5: Documentation Updates (2-3 hours)

### 5.1 Update PRD

**File:** `docs/PRD/NextBestMove_PRD_v1.md`

**Search and replace:**

- "pin" → "lead" (case-sensitive, context-aware)
- "Pin" → "Lead"
- "PIN" → "LEAD" (if used)
- "pins" → "leads"
- "Pins" → "Leads"

**Key sections:**

- All feature descriptions
- User stories
- Terminology sections

### 5.2 Update User Stories

**File:** `docs/Planning/User_Stories.md`

**Changes:**

- "Epic 3: Pin Management" → "Epic 3: Lead Management"
- All user stories about pins → leads
- Update acceptance criteria

### 5.3 Update Architecture Docs

**Files:**

- `docs/Architecture/Database_Schema.md`
- `docs/Architecture/Component_Specifications.md`
- `docs/Architecture/Implementation_Guide.md`

**Changes:**

- Table name: `person_pins` → `leads`
- Enum: `pin_status` → `lead_status`
- All references to "pins" → "leads"

### 5.4 Update Testing Guides

**Files:**

- All testing guides that mention pins
- Update test scenarios
- Update test data setup scripts

### 5.5 Update Backlog

**File:** `docs/backlog.md`

**Changes:**

- "Pin management" → "Lead management"
- "Pin limit" → "Lead limit"
- All references to pins

---

## Phase 6: Code Cleanup (1-2 hours)

### 6.1 Variable Names

**Search and replace across codebase:**

- `pin` → `lead` (variable names)
- `pins` → `leads` (variable names)
- `personPin` → `lead`
- `personPins` → `leads`
- `pinId` → `leadId`
- `pinLimit` → `leadLimit`

**⚠️ Be careful:** Only replace in variable names, not in:

- File paths (handle separately)
- Comments (update manually for context)
- String literals (update manually for UI copy)

### 6.2 Function Names

**Update function names:**

- `getPins` → `getLeads`
- `createPin` → `createLead`
- `updatePin` → `updateLead`
- `deletePin` → `deleteLead`
- `pinLimitReached` → `leadLimitReached`

### 6.3 Comments

**Update code comments:**

- Review all comments mentioning "pin"
- Update to "lead" where appropriate
- Keep context clear

---

## Implementation Checklist

### Database

- [ ] Create migration to rename `person_pins` → `leads`
- [ ] Create migration to rename `pin_status` → `lead_status`
- [ ] Update all indexes
- [ ] Update all foreign keys
- [ ] Update RLS policies
- [ ] Update SQL functions
- [ ] Test migration on staging

### TypeScript Types

- [ ] Create/update `web/src/lib/leads/types.ts`
- [ ] Rename `PersonPin` → `Lead`
- [ ] Rename `PinStatus` → `LeadStatus`
- [ ] Update all type imports

### API Endpoints

- [ ] Rename `/api/pins` → `/api/leads`
- [ ] Update all endpoint implementations
- [ ] Update all API calls in frontend
- [ ] Update error messages
- [ ] Test all endpoints

### UI Components

- [ ] Rename component files
- [ ] Update component code
- [ ] Update navigation routes
- [ ] Update onboarding flow
- [ ] Update all UI copy
- [ ] Update modals and forms

### Documentation

- [ ] Update PRD
- [ ] Update User Stories
- [ ] Update Architecture docs
- [ ] Update Testing guides
- [ ] Update Backlog

### Code Cleanup

- [ ] Update variable names
- [ ] Update function names
- [ ] Update comments
- [ ] Run linter
- [ ] Run type check

---

## Testing Plan

### After Each Phase

1. **Database Migration:**

   - [ ] Test migration on staging
   - [ ] Verify table renamed
   - [ ] Verify data integrity
   - [ ] Verify foreign keys work

2. **API Endpoints:**

   - [ ] Test all CRUD operations
   - [ ] Test error handling
   - [ ] Verify responses correct

3. **UI Components:**

   - [ ] Test lead list page
   - [ ] Test add/edit modals
   - [ ] Test filtering
   - [ ] Test onboarding flow

4. **End-to-End:**
   - [ ] Create lead
   - [ ] Edit lead
   - [ ] Delete lead
   - [ ] Snooze lead
   - [ ] Archive lead
   - [ ] Generate daily plan (should reference leads)
   - [ ] Complete onboarding

---

## Rollback Plan

If issues arise:

1. **Database:** Revert migration (rename back to `person_pins`)
2. **Code:** Revert git commits
3. **API:** Revert endpoint changes
4. **UI:** Revert component changes

**Note:** Keep backups before starting migration.

---

## Sample Copy Updates

### Onboarding

**Before:**

> "Pin your first person"

**After:**

> "Add your first lead"

**Subtext:**

> "Just paste their LinkedIn URL or email—that's it. No forms, no friction."

### Page Headers

**Before:**

> "Pin Management"  
> "Your Pins"

**After:**

> "Leads"  
> "Your Leads"

### Empty States

**Before:**

> "No pins yet. Add your first pin to get started."

**After:**

> "No leads yet. Add your first lead to get started."

### Buttons

**Before:**

> "Add Pin"  
> "Pin a Person"

**After:**

> "Add Lead"

### Upgrade Modals

**Before:**

> "You've built a strong network of 10 relationships. Add unlimited Pins with Premium."

**After:**

> "You've built a strong network of 10 relationships. Add unlimited Leads with Premium."

### Settings

**Before:**

> "Pin limit: 10 (Standard plan)"

**After:**

> "Lead limit: 10 (Standard plan)"

---

## File-by-File Changes

### Critical Files (Must Update)

1. **Database:**

   - `supabase/migrations/YYYYMMDDHHMMSS_rename_pins_to_leads.sql` (new)

2. **Types:**

   - `web/src/lib/leads/types.ts` (create or update)

3. **API:**

   - `web/src/app/api/pins/route.ts` → `web/src/app/api/leads/route.ts`
   - `web/src/app/api/pins/[id]/route.ts` → `web/src/app/api/leads/[id]/route.ts`
   - `web/src/app/api/pins/[id]/status/route.ts` → `web/src/app/api/leads/[id]/status/route.ts`
   - `web/src/app/api/actions/route.ts`
   - `web/src/app/api/daily-plans/route.ts`
   - `web/src/app/api/pre-call-briefs/route.ts`
   - `web/src/app/api/billing/check-pin-limit/route.ts` → `check-lead-limit`
   - All cron job endpoints

4. **UI Components:**

   - `web/src/app/app/pins/page.tsx` → `web/src/app/app/leads/page.tsx`
   - `web/src/app/app/pins/PinList.tsx` → `LeadList.tsx`
   - `web/src/app/app/pins/PinRow.tsx` → `LeadRow.tsx`
   - `web/src/app/app/pins/AddPersonModal.tsx` → `AddLeadModal.tsx`
   - `web/src/app/app/pins/EditPersonModal.tsx` → `EditLeadModal.tsx`
   - `web/src/app/onboarding/steps/PinFirstPersonStep.tsx` → `AddFirstLeadStep.tsx`
   - `web/src/app/app/components/UpgradeModal.tsx`
   - `web/src/app/app/components/DowngradeWarningModal.tsx`

5. **Documentation:**
   - `docs/PRD/NextBestMove_PRD_v1.md`
   - `docs/Planning/User_Stories.md`
   - `docs/Architecture/Database_Schema.md`
   - `docs/backlog.md`
   - All testing guides

---

## Estimated Timeline

- **Phase 1 (Database):** 2-3 hours
- **Phase 2 (Types):** 1 hour
- **Phase 3 (API):** 2-3 hours
- **Phase 4 (UI):** 3-4 hours
- **Phase 5 (Docs):** 2-3 hours
- **Phase 6 (Cleanup):** 1-2 hours
- **Testing:** 2-3 hours

**Total:** 13-19 hours (2-3 days)

---

## Risk Mitigation

1. **Database Migration:**

   - Test on staging first
   - Backup production before migration
   - Run during low-traffic period

2. **API Changes:**

   - Update frontend and backend simultaneously
   - Or maintain backward compatibility temporarily

3. **Breaking Changes:**
   - Consider API versioning if needed
   - Or coordinate frontend/backend deployment

---

## Success Criteria

- [ ] All database tables/columns renamed
- [ ] All API endpoints updated
- [ ] All UI components updated
- [ ] All copy uses "lead" terminology
- [ ] All documentation updated
- [ ] All tests pass
- [ ] No broken references
- [ ] Onboarding flow works
- [ ] Lead management works end-to-end

---

**End of Pins to Leads Refactoring Plan**
