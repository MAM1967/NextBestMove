# Marketing Homepage & Early Access Form - Implementation Plan

**Date:** December 9, 2025  
**Status:** ✅ Implemented (Staging)  
**Target Launch:** January 13, 2026 12:00 AM ET

---

## Overview

Update the marketing homepage with new design and add early access signup form to support pre-launch marketing efforts.

---

## Decisions Made

### 1. Sign-in Button Visibility
✅ **Decision:** Hidden completely until Jan 13 launch (only show "Get early access")
- Users invited manually will get direct link to sign-up page

### 2. Environment Scope
✅ **Decision:** Staging only for now, but will become production homepage after testing/approval this week

### 3. Post-Launch Behavior
✅ **Decision:** After Jan 13, "Get early access" disappears and "Sign in" replaces it

### 4. Manual Invitation Process
✅ **Decision:** Send direct link to sign-up page via email (no admin interface needed)

### 5. Duplicate Prevention
✅ **Decision:** Prevent duplicate emails - form checks if email exists and shows error if already signed up

### 6. Admin Access
✅ **Decision:** Supabase dashboard is fine - no additional screens needed for short pre-launch window

---

## Implementation Plan

### Phase 1: Database Schema

#### 1.1 Create `early_access_signups` Table
**Migration:** `supabase/migrations/202512090001_create_early_access_signups.sql`

```sql
CREATE TABLE early_access_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  linkedin_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('fractional_cmo', 'agency', 'consultant', 'other')),
  active_clients_count INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'invited', 'declined')),
  invited_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_early_access_signups_email ON early_access_signups(email);
CREATE INDEX idx_early_access_signups_status ON early_access_signups(status);
CREATE INDEX idx_early_access_signups_created_at ON early_access_signups(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_early_access_signups_updated_at
  BEFORE UPDATE ON early_access_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: Only service role can read/write (admin access via API routes)
ALTER TABLE early_access_signups ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON early_access_signups
  FOR ALL USING (auth.role() = 'service_role');
```

**Estimated Time:** 30 minutes

---

### Phase 2: Update Homepage

#### 2.1 Replace Current Homepage
**File:** `web/src/app/page.tsx`

**Changes:**
- Replace entire component with new marketing design
- Add conditional logic for "Sign in" button visibility (based on launch date)
- Update all links to point to `/early-access` instead of `/auth/sign-up`
- Update footer to match new design

**Launch Date Logic:**
```typescript
const LAUNCH_DATE = new Date('2026-01-13T05:00:00Z'); // Jan 13, 2026 12:00 AM ET
const isLaunched = new Date() >= LAUNCH_DATE;
```

**Estimated Time:** 1-2 hours

---

### Phase 3: Early Access Form

#### 3.1 Create Early Access Page
**File:** `web/src/app/early-access/page.tsx`

**Form Fields:**
- Name (required, text input)
- Email (required, email input)
- LinkedIn URL (optional, URL input)
- Role (required, select dropdown):
  - Fractional CMO
  - Agency
  - Consultant
  - Other
- Active Clients Count (required, number input or select)
- Submit button

**Estimated Time:** 2-3 hours

#### 3.2 Create Form Server Action
**File:** `web/src/app/early-access/actions.ts`

**Functionality:**
- Validate form data
- Check for duplicate email
- Insert into `early_access_signups` table
- Send confirmation email via Resend
- Return success/error state

**Estimated Time:** 1-2 hours

#### 3.3 Create Form Component
**File:** `web/src/app/early-access/EarlyAccessForm.tsx`

**Features:**
- Client-side validation
- Loading states
- Success/error messages
- Form submission handling

**Estimated Time:** 1-2 hours

---

### Phase 4: Email Templates

#### 4.1 Create Confirmation Email Template
**File:** `web/src/lib/email/early-access.ts`

**Email Content:**
```
Subject: Thanks for your interest in NextBestMove

Thanks — we will reach out personally with access details and a short onboarding.

[Your name/company info]
```

**Estimated Time:** 30 minutes

---

### Phase 5: Admin Interface (Optional but Recommended)

#### 5.1 Create Admin Page
**File:** `web/src/app/admin/early-access/page.tsx`

**Features:**
- List all signups (table view)
- Filter by status (pending, approved, invited, declined)
- Search by name/email
- Mark as approved/invited/declined
- Add notes
- Export to CSV
- Send invite email (manual trigger)

**Access Control:**
- Only accessible to service role/admin users
- Check user has admin privileges

**Estimated Time:** 3-4 hours

#### 5.2 Create Admin API Routes
**Files:**
- `web/src/app/api/admin/early-access/route.ts` - List signups
- `web/src/app/api/admin/early-access/[id]/route.ts` - Update status
- `web/src/app/api/admin/early-access/export/route.ts` - Export CSV

**Estimated Time:** 2-3 hours

---

## File Structure

```
web/src/app/
├── page.tsx                          # New marketing homepage
├── early-access/
│   ├── page.tsx                      # Early access form page
│   ├── actions.ts                    # Server action for form submission
│   └── EarlyAccessForm.tsx           # Form component
└── admin/
    └── early-access/
        └── page.tsx                  # Admin view (optional)

web/src/lib/
└── email/
    └── early-access.ts               # Email template

supabase/migrations/
└── 202512090001_create_early_access_signups.sql
```

---

## Database Schema Details

### `early_access_signups` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | TEXT | NOT NULL | User's name |
| `email` | TEXT | UNIQUE, NOT NULL | Email address |
| `linkedin_url` | TEXT | | LinkedIn profile URL (optional) |
| `role` | TEXT | CHECK constraint | fractional_cmo, agency, consultant, other |
| `active_clients_count` | INTEGER | | Number of active clients |
| `status` | TEXT | DEFAULT 'pending' | pending, approved, invited, declined |
| `invited_at` | TIMESTAMPTZ | | When user was invited |
| `invited_by` | UUID | FK to auth.users | Admin who invited |
| `notes` | TEXT | | Admin notes |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Signup timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

---

## Email Template

### Confirmation Email

**Subject:** Thanks for your interest in NextBestMove

**Body:**
```
Hi [Name],

Thanks for signing up for early access to NextBestMove!

We'll reach out personally with access details and a short onboarding.

Best,
[Your name/company]
NextBestMove
```

**Styling:** Match existing email templates (simple, clean HTML)

---

## Launch Date Logic

### Implementation

```typescript
// Constants
const LAUNCH_DATE = new Date('2026-01-13T05:00:00Z'); // Jan 13, 2026 12:00 AM ET

// Check if launched
function isLaunched(): boolean {
  return new Date() >= LAUNCH_DATE;
}

// Usage in homepage
{isLaunched() ? (
  <a href="/auth/sign-in">Sign in</a>
) : null}
```

---

## Timeline Estimate

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| **Phase 1** | Database schema | 30 min |
| **Phase 2** | Update homepage | 1-2 hours |
| **Phase 3** | Early access form | 4-7 hours |
| **Phase 4** | Email template | 30 min |
| **Phase 5** | Admin interface (optional) | 5-7 hours |
| **Total** | | **11-17 hours** |

**Without Admin Interface:** 6-10 hours  
**With Admin Interface:** 11-17 hours

---

## Testing Checklist

- [ ] Homepage displays correctly (all sections)
- [ ] "Sign in" button hidden before launch date
- [ ] "Sign in" button appears after launch date
- [ ] Early access form validates correctly
- [ ] Duplicate emails prevented
- [ ] Form submission saves to database
- [ ] Confirmation email sent successfully
- [ ] Email content is correct
- [ ] Admin page accessible (if implemented)
- [ ] Admin can filter/search signups
- [ ] Admin can update status
- [ ] CSV export works (if implemented)

---

## Deployment Plan

1. **Deploy to staging first**
   - Test homepage
   - Test form submission
   - Test email sending
   - Verify database entries

2. **Deploy to production**
   - After staging verification
   - Update homepage immediately
   - Form goes live for marketing

3. **Post-launch (Jan 13)**
   - Update homepage to show "Sign in" button
   - Optionally replace "Get early access" with "Sign up"
   - Keep early access form for waitlist (if needed)

---

## Implementation Status

✅ **Phase 1:** Database migration created (`202512090001_create_early_access_signups.sql`)
✅ **Phase 2:** Homepage updated with new marketing design and launch date logic
✅ **Phase 3:** Early access form page created (`/early-access`)
✅ **Phase 4:** Server action with duplicate email check implemented
✅ **Phase 5:** Email confirmation template created

## Next Steps

1. ✅ **Implementation complete** - All code written
2. **Test on staging:**
   - [ ] Deploy migration to staging database
   - [ ] Test homepage displays correctly
   - [ ] Test early access form submission
   - [ ] Verify duplicate email prevention
   - [ ] Verify confirmation email sent
   - [ ] Check signups appear in Supabase dashboard
3. **After testing/approval:**
   - [ ] Deploy to production
   - [ ] Update production homepage

---

**Last Updated:** December 9, 2025  
**Status:** ✅ Implemented - Ready for staging testing

