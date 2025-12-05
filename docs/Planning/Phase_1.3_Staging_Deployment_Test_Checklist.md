# Staging Deployment Test Checklist

**Date:** January 2025  
**Staging URL:** https://staging.nextbestmove.app

---

## Pre-Test Verification

- [ ] DNS CNAME record added and propagated
- [ ] Environment variables added to Vercel (Preview scope)
- [ ] Staging branch exists and is up to date
- [ ] Domain configured in Vercel (Preview environment)

---

## Test 1: Site Accessibility

- [ ] Navigate to: https://staging.nextbestmove.app
- [ ] Site loads without errors
- [ ] No SSL certificate errors
- [ ] Page renders correctly

**Expected:** Site should load (may show sign-in page or marketing page)

---

## Test 2: Authentication

- [ ] Click "Sign In" or navigate to sign-in page
- [ ] Try signing in with staging user:
  - Email: `mcddsl@icloud.com`
  - Password: `TestPass123!`
- [ ] Sign-in succeeds
- [ ] Redirects to dashboard/app

**Expected:** Should sign in successfully and redirect to `/app`

---

## Test 3: Database Connection

- [ ] After signing in, check browser console (F12)
- [ ] No Supabase connection errors
- [ ] Dashboard loads user data
- [ ] Can see user profile/name in UI

**Expected:** No errors, data loads correctly

---

## Test 4: Basic Functionality

- [ ] Navigate to different pages (if accessible):
  - Dashboard (`/app`)
  - Daily Plan (`/app/plan`)
  - Leads (`/app/leads`)
  - Settings (`/app/settings`)
- [ ] Pages load without errors
- [ ] No 404 errors for expected routes

**Expected:** All pages accessible and functional

---

## Test 5: Environment Variables

Check that staging-specific variables are being used:

- [ ] Open browser DevTools → Console
- [ ] Check for any environment-related errors
- [ ] Verify API calls go to staging Supabase (check Network tab)
- [ ] Verify `NEXT_PUBLIC_APP_URL` is correct (should be staging URL)

**Expected:** All API calls use staging endpoints

---

## Test 6: Deployment Status in Vercel

- [ ] Go to Vercel → Deployments
- [ ] Find latest deployment from `staging` branch
- [ ] Verify deployment status: ✅ Ready
- [ ] Check deployment logs for errors
- [ ] Verify domain assignment: `staging.nextbestmove.app`

**Expected:** Deployment successful, assigned to staging domain

---

## Common Issues & Fixes

### Issue: Site not loading / DNS error
**Fix:** Wait for DNS propagation (can take up to 24 hours), or check DNS records

### Issue: SSL certificate error
**Fix:** Vercel should auto-provision SSL, may take a few minutes

### Issue: "Invalid Configuration" in Vercel
**Fix:** Verify domain is assigned to Preview environment and staging branch

### Issue: Sign-in fails / Database errors
**Fix:** Check environment variables are scoped to Preview and values are correct

### Issue: 404 errors on routes
**Fix:** Check deployment logs, may need to redeploy

---

## Next Steps After Successful Test

1. ✅ Mark Phase 1.3 as complete
2. ✅ Continue with Phase 1.4 (Staging Security) or Phase 1.5 (Stripe Test Mode)
3. ✅ Document any issues found

---

**Last Updated:** January 2025

