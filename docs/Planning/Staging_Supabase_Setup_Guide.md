# Staging Supabase Setup Guide

**Phase:** 1.2 - Supabase Staging Project  
**Status:** 📋 Ready for Implementation

---

## Overview

This guide walks through setting up a separate Supabase project for staging environment.

---

## Step 1: Create Staging Supabase Project

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Click "New Project"

2. **Project Configuration:**
   - **Name:** `nextbestmove-staging`
   - **Database Password:** Generate a strong password (save it securely)
   - **Region:** Choose the same region as production (for consistency)
   - **Pricing Plan:** Free tier is fine for staging

3. **Wait for Project Creation:**
   - This takes 2-3 minutes
   - Note the project reference ID (you'll need this)

4. **Get Project Credentials:**
   - Go to Project Settings → API
   - Copy the following:
     - **Project URL:** `https://[project-ref].supabase.co`
     - **Anon/Public Key:** `eyJhbGc...`
     - **Service Role Key:** `eyJhbGc...` (keep this secret!)

---

## Step 2: Apply All Migrations

### Option A: Using Supabase CLI (Recommended)

If you have the Supabase CLI installed and linked to your staging project:

```bash
# Link to staging project (if not already linked)
supabase link --project-ref <staging-project-ref>

# Apply all migrations
supabase db push
```

### Option B: Manual Migration via SQL Editor

1. **Go to SQL Editor in Supabase Dashboard:**
   - Navigate to: SQL Editor → New Query

2. **Apply migrations in order:**
   - Copy and paste each migration file from `supabase/migrations/` in chronological order
   - Start with: `202511260001_initial_schema.sql`
   - Then apply all others in order (sorted by filename)

3. **Quick migration script:**
   ```bash
   # List all migrations in order
   ls -1 supabase/migrations/*.sql | sort
   ```

**Migration Order:**
1. `202511260001_initial_schema.sql` (base schema)
2. `202501270001_create_tasks_table.sql`
3. `202501270002_add_users_insert_policy.sql`
4. ... (all others in chronological order)
5. `202512050003_add_manual_voice_samples.sql` (latest)

---

## Step 3: Configure Staging Auth Settings

1. **Go to Authentication → Settings:**

2. **Email Settings:**
   - ✅ **Enable email confirmations:** OFF (for easier testing)
   - Or use test email domains for staging

3. **OAuth Providers:**
   - **Google:** Keep enabled if testing OAuth, or disable
   - **Outlook/Azure:** Keep enabled if testing OAuth, or disable
   - **Redirect URLs:** Add `https://staging.nextbestmove.app/auth/callback`

4. **URL Configuration:**
   - **Site URL:** `https://staging.nextbestmove.app`
   - **Redirect URLs:** 
     - `https://staging.nextbestmove.app/auth/callback`
     - `https://staging.nextbestmove.app/**`

5. **Disable Invite Users:**
   - Go to Authentication → Providers
   - Disable any invite functionality

---

## Step 4: Create Test Users

Run this SQL in the SQL Editor to create test users:

```sql
-- Test users will be created via sign-up flow, but you can also create them manually:

-- Premium test user (create via sign-up, then upgrade in Stripe test mode)
-- Email: test+premium@example.com
-- Password: TestPass123!

-- Standard test user
-- Email: test+standard@example.com  
-- Password: TestPass123!

-- Trial user (will be created via onboarding)
-- Email: test+trial@example.com
-- Password: TestPass123!

-- Canceled user (for testing win-back flows)
-- Email: test+canceled@example.com
-- Password: TestPass123!
```

**Note:** It's better to create users via the sign-up flow to ensure proper auth.users records are created.

---

## Step 5: Verify RLS Policies

Test that Row Level Security is working:

```sql
-- Test RLS policies
-- Run as different users to verify data isolation

-- Check that users can only see their own data
SELECT COUNT(*) FROM leads WHERE user_id = auth.uid();
SELECT COUNT(*) FROM actions WHERE user_id = auth.uid();
SELECT COUNT(*) FROM daily_plans WHERE user_id = auth.uid();
```

---

## Step 6: Document Staging Credentials

**⚠️ Important:** Store these securely (use password manager or secure notes):

```
Staging Supabase Project:
- Project Name: nextbestmove-staging
- Project Ref: [your-project-ref]
- Project URL: https://[project-ref].supabase.co
- Database Password: [saved securely]
- Anon Key: eyJhbGc...
- Service Role Key: eyJhbGc... (KEEP SECRET!)
```

**Add to Vercel Environment Variables (Phase 1.3):**
- `NEXT_PUBLIC_SUPABASE_URL` = `https://[project-ref].supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `[anon-key]`
- `SUPABASE_SERVICE_ROLE_KEY` = `[service-role-key]` (staging)

---

## Step 7: Verify Setup

1. **Test Database Connection:**
   ```bash
   # Using Supabase CLI
   supabase db remote list
   ```

2. **Test Auth:**
   - Try signing up a test user
   - Verify user record created in `users` table

3. **Test RLS:**
   - Create two test users
   - Verify they can't see each other's data

---

## Troubleshooting

### Migration Errors

- **Error: "relation already exists"** → Some migrations may have already been applied. Skip those.
- **Error: "permission denied"** → Check that you're using the service role key for admin operations.
- **Error: "function does not exist"** → Ensure migrations are applied in order.

### Auth Issues

- **Redirect URL errors** → Make sure redirect URLs are configured in Supabase dashboard
- **Email confirmation required** → Disable email confirmations for staging, or use test email service

### RLS Issues

- **Users can see all data** → Check RLS policies are enabled on tables
- **Users can't see their data** → Check RLS policies allow SELECT for authenticated users

---

## Next Steps

After completing this setup:
1. ✅ Document all credentials securely
2. ✅ Move to Phase 1.3: Vercel Staging Configuration
3. ✅ Add staging environment variables to Vercel

---

**Last Updated:** January 2025

