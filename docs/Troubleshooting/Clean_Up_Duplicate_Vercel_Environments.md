# Clean Up Duplicate Vercel Environments

## Problem
Vercel shows 3 environments when there should only be 2:
- Preview ✅
- Production ✅
- Production – next-best-move-j1ej ❌ (duplicate/extra)

## Solution
Delete the duplicate "Production – next-best-move-j1ej" environment.

---

## Steps to Fix

1. **Go to Vercel Dashboard:**
   - Your Project → **Settings** → **Environments**

2. **Delete the Duplicate:**
   - Find "Production – next-best-move-j1ej"
   - Click the trash can icon (🗑️) on the right
   - Confirm deletion

3. **Verify:**
   - You should now only see:
     - **Preview**
     - **Production**

---

## Why This Happened

This duplicate environment might have been created:
- During initial setup
- When configuring multiple production domains
- As a result of a misconfiguration

It's safe to delete as long as:
- The main "Production" environment exists
- Your production domain (`nextbestmove.app`) is assigned to the "Production" environment

---

## After Cleanup

1. **Verify Environment Variables:**
   - Go to Settings → Environment Variables
   - Filter by "Production" - should only show one "Production" option
   - Filter by "Preview" - should show "Preview" option

2. **Verify Domain Assignment:**
   - Go to Settings → Domains
   - Verify `nextbestmove.app` is assigned to "Production" environment
   - Verify `staging.nextbestmove.app` is assigned to "Preview" environment

---

## Quick Checklist

- [ ] Deleted "Production – next-best-move-j1ej" environment
- [ ] Only 2 environments remain: Preview and Production
- [ ] Environment variables are correctly scoped
- [ ] Domains are correctly assigned


