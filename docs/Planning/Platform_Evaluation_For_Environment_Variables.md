# Platform Evaluation: Environment Variable Reliability

**Date:** December 9, 2025  
**Status:** 🔴 Critical Decision Required  
**Priority:** P0 - Blocks Production Launch

---

## Problem Statement

Vercel environment variables are not reliably propagating to production deployments despite:
- Correct configuration in Vercel Dashboard
- Proper variable scoping (Production vs Preview)
- Multiple force redeploys
- Following all documented troubleshooting steps

**Impact:**
- Production deployments use test/staging credentials instead of live credentials
- Requires hardcoded workarounds (security risk, maintenance burden)
- Unreliable deployment process
- Potential for production outages if workarounds fail

---

## Current Situation

### What We've Tried
1. ✅ Setting variables via Vercel Dashboard
2. ✅ Verifying Production scope vs Preview scope
3. ✅ Force redeploying multiple times
4. ✅ Checking for whitespace/corruption
5. ✅ Runtime workarounds (hardcoded fallbacks)

### Current Status
- **Google OAuth:** Working with hardcoded production secrets (workaround)
- **Stripe:** Still showing test keys despite live keys set in Vercel
- **Build Time:** Variables sometimes available, sometimes not
- **Runtime:** Unreliable access in serverless functions

### Workaround Code Locations
- `web/src/lib/calendar/providers.ts` - Google OAuth hardcoded secrets
- `web/src/lib/billing/stripe.ts` - Stripe hardcoded secrets (just added)

**Security Risk:** Secrets in source code (GitHub secret scanning blocks pushes)

---

## Platform Comparison

### Option 1: Continue with Vercel (Fix Issues)

**Pros:**
- ✅ Already set up and working for most features
- ✅ Excellent Next.js integration
- ✅ Fast edge deployment
- ✅ Good developer experience (generally)
- ✅ Free tier for small projects
- ✅ Good documentation (when it works)

**Cons:**
- ❌ Environment variable propagation is unreliable
- ❌ Requires hardcoded workarounds (security risk)
- ❌ No guarantee issues will be resolved
- ❌ Support may not address root cause quickly
- ❌ Workarounds add maintenance burden

**Actions Needed:**
1. Open Vercel support ticket with detailed evidence
2. Request escalation to engineering team
3. Document all issues with reproduction steps
4. Set deadline for resolution (e.g., 1 week)
5. If unresolved, plan migration

**Cost:** Continue free tier or current plan

---

### Option 2: Migrate to AWS (Amplify or ECS/Lambda)

**Pros:**
- ✅ Reliable environment variable system
- ✅ AWS Secrets Manager integration
- ✅ Better control over infrastructure
- ✅ Production-grade reliability
- ✅ Good for scaling
- ✅ Can use Systems Manager Parameter Store

**Cons:**
- ⚠️ More complex setup
- ⚠️ Higher learning curve
- ⚠️ More expensive (pay for what you use)
- ⚠️ Migration effort (1-2 days)
- ⚠️ Different deployment workflow

**Setup Options:**
- **Amplify:** Next.js optimized, similar to Vercel
- **ECS/Fargate:** Container-based, more control
- **Lambda:** Serverless, similar model to Vercel

**Cost:** ~$20-50/month for small production app

**Migration Effort:** 2-3 days

---

### Option 3: Migrate to Railway

**Pros:**
- ✅ Simple environment variable management
- ✅ Good Next.js support
- ✅ Similar DX to Vercel
- ✅ Reliable env var system
- ✅ Good pricing ($5/month starter)
- ✅ Easy secret management

**Cons:**
- ⚠️ Smaller ecosystem than AWS/Vercel
- ⚠️ Less battle-tested at scale
- ⚠️ Migration effort (1 day)

**Cost:** $5-20/month

**Migration Effort:** 1 day

---

### Option 4: Migrate to Render

**Pros:**
- ✅ Simple, reliable environment variables
- ✅ Good Next.js support
- ✅ Free tier available
- ✅ Easy setup

**Cons:**
- ⚠️ Free tier can spin down (cold starts)
- ⚠️ Smaller than AWS but good for MVP
- ⚠️ Migration effort (1 day)

**Cost:** Free tier or $7-25/month

**Migration Effort:** 1 day

---

### Option 5: Hybrid Approach (Keep Vercel, Use External Secrets)

**Pros:**
- ✅ Keep Vercel's Next.js integration
- ✅ Use external secret management (AWS Secrets Manager, Doppler, etc.)
- ✅ Best of both worlds
- ✅ Secrets not in code or Vercel

**Cons:**
- ⚠️ Additional service to manage
- ⚠️ API calls to fetch secrets (latency, cost)
- ⚠️ More complex architecture
- ⚠️ Still relies on Vercel for other issues

**Services:**
- **Doppler:** $12/month (developer-friendly)
- **AWS Secrets Manager:** ~$0.40/secret/month
- **HashiCorp Vault:** Free (self-hosted) or HCP pricing
- **Infisical:** Free tier available

**Cost:** Vercel + $10-20/month for secret management

**Migration Effort:** 1 day to set up, ongoing maintenance

---

## Recommendation

### Short Term (This Week)
1. **Contact Vercel Support** with:
   - Detailed evidence of env var issues
   - Reproduction steps
   - Request engineering escalation
   - Set expectation: resolve within 1 week or we migrate

2. **Keep workarounds** (with security caveats documented)

3. **Test production** thoroughly to ensure workarounds work

### Medium Term (If Vercel Doesn't Fix)
**Recommended:** Migrate to **Railway** or **Render**
- Similar DX to Vercel
- Reliable env var system
- Quick migration (1 day)
- Affordable pricing
- Good for MVP/early stage

### Long Term (Scale Stage)
**Consider:** **AWS Amplify** or **Hybrid with AWS Secrets Manager**
- Production-grade reliability
- Better secret management
- More control
- Scales better

---

## Decision Framework

### Stay with Vercel if:
- [ ] Vercel support resolves env var issues within 1 week
- [ ] You're comfortable with current workarounds
- [ ] Other Vercel features outweigh this issue
- [ ] Budget constraints prevent migration

### Migrate if:
- [ ] Vercel support cannot resolve within 1 week
- [ ] You need reliable secret management for launch
- [ ] Security concerns with hardcoded secrets
- [ ] You want production-grade reliability

### Hybrid (External Secrets) if:
- [ ] You want to keep Vercel's Next.js features
- [ ] You're okay with added complexity
- [ ] Budget allows for secret management service

---

## Migration Checklist (If Deciding to Migrate)

### Pre-Migration
- [ ] Choose target platform
- [ ] Set up account and project
- [ ] Document current Vercel configuration
- [ ] Backup all environment variables
- [ ] Test deployment on new platform (staging)

### Migration Day
- [ ] Set up domain/DNS
- [ ] Configure environment variables on new platform
- [ ] Deploy application
- [ ] Verify all features work
- [ ] Test production workflows
- [ ] Update CI/CD if applicable

### Post-Migration
- [ ] Monitor for 48 hours
- [ ] Remove Vercel deployments (or keep as backup)
- [ ] Update documentation
- [ ] Remove hardcoded workarounds from code
- [ ] Rotate any secrets that were hardcoded

---

## Cost Comparison (Monthly)

| Platform | Free Tier | Starter | Growth | Notes |
|----------|-----------|---------|--------|-------|
| **Vercel** | Yes | $20 | $20+ | Current, env var issues |
| **Railway** | No | $5 | $20 | Reliable, similar DX |
| **Render** | Yes* | $7 | $25 | *Spins down on free tier |
| **AWS Amplify** | No | ~$20 | $50+ | Production-grade |
| **Hybrid (Vercel + Secrets)** | No | $30 | $40+ | Keep Vercel + secret service |

---

## Next Steps

1. **Today:** Deploy current workaround and test
2. **This Week:** Contact Vercel support with evidence
3. **Decision Point:** 1 week from support contact
4. **If Migration:** Begin planning and execution

---

## Questions to Answer

1. **Timeline:** Can we wait 1 week for Vercel support?
2. **Risk Tolerance:** Acceptable to have hardcoded secrets temporarily?
3. **Budget:** Can we afford migration if needed?
4. **Team Capacity:** Do we have time for migration?
5. **Launch Date:** Does this block Jan 1, 2026 launch?

---

## References

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- `docs/Troubleshooting/Vercel_Environment_Variables_Solutions.md`

---

**Last Updated:** December 9, 2025  
**Next Review:** After Vercel support response (within 1 week)


