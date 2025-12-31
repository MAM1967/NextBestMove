# Deployment Checklist

> **Reference:** See `nextbestmove_cursor_guide.md` lines 209-303 for full deployment documentation.

## ⚠️ CRITICAL: Before Every Deployment

### Pre-Deployment Checklist

- [ ] **Read `nextbestmove_cursor_guide.md` deployment section** (lines 209-303)
- [ ] **DO NOT stash changes** - Keep them uncommitted
- [ ] **DO NOT commit manually** - Let the script handle it
- [ ] **Run type-check locally first**: `cd web && npm run type-check`
- [ ] **Fix any TypeScript errors** before running deployment script

### Staging Deployment

**Command:**
```bash
./scripts/deploy-staging.sh "Your commit message here"
```

**What the script does (in order):**
1. ✅ TypeScript type check (BLOCKS if errors)
2. ✅ Design lint (warnings only)
3. ✅ Sync Doppler secrets to Vercel Preview
4. ✅ **Automatically commits uncommitted changes** (this is why you don't stash!)
5. ✅ Creates deployment branch and pushes

**Workflow:**
1. Make your code changes
2. **Keep changes uncommitted** (don't `git add` or `git commit`)
3. Run `./scripts/deploy-staging.sh "message"`
4. Script commits and pushes automatically
5. Create PR from the link provided

### Production Deployment

**Command:**
```bash
./scripts/deploy-production.sh "Your commit message here"
```

**What the script does:**
1. ✅ Safety confirmation (type "yes")
2. ✅ TypeScript type check (BLOCKS if errors)
3. ✅ Design lint (warnings only)
4. ✅ Sync Doppler secrets to Vercel Production
5. ✅ **Automatically commits uncommitted changes**
6. ✅ Pushes to `main` branch

## ❌ NEVER DO THIS

- ❌ **Never stash before running deployment script** - Script needs uncommitted changes to commit them
- ❌ **Never commit manually before running script** - Script handles commits
- ❌ **Never push directly with `git push`** - Always use deployment scripts
- ❌ **Never skip type-check** - Fix TypeScript errors first
- ❌ **Never deploy to production without staging verification**

## ✅ ALWAYS DO THIS

- ✅ **Test on staging first** - Never deploy to production without staging verification
- ✅ **Use descriptive commit messages** - Include Linear issue IDs (e.g., "NEX-42: ...")
- ✅ **Check TypeScript errors locally** - Run `npm run type-check` in `web/` before deploying
- ✅ **Verify Doppler sync** - Check that environment variables are correctly synced
- ✅ **Monitor Vercel dashboard** - Watch for build/deployment errors after push

## Quick Reference

**Staging:**
- Branch: `staging`
- Domain: `https://staging.nextbestmove.app`
- Script: `./scripts/deploy-staging.sh`

**Production:**
- Branch: `main`
- Domain: `https://nextbestmove.app`
- Script: `./scripts/deploy-production.sh`

---

**Last Updated:** December 31, 2025  
**Full Guide:** See `nextbestmove_cursor_guide.md` lines 209-303

