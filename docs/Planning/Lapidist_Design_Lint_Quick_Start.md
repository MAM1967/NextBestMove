# Design Lint Quick Start Guide

**Status:** ⚠️ **BLOCKED - Node.js 22+ Required**  
**Last Updated:** December 9, 2025

---

## Prerequisite: Node.js Upgrade

**Current:** Node.js v20.19.2  
**Required:** Node.js >= 22.0.0

The package **will not run** until Node.js is upgraded.

---

## Quick Setup (After Node.js Upgrade)

### 1. Verify Node.js Version

```bash
node --version  # Should show v22.x.x
```

### 2. Test Design Linting

```bash
cd web
npm run lint:design
```

### 3. Review Configuration

Edit `web/designlint.config.json` to match your needs:
- Design tokens already mapped from `UI_Specifications.md`
- Adjust rules as needed
- Environment-based configuration ready

### 4. Enable in Staging Build

Uncomment design lint step in `scripts/deploy-staging.sh`:

```bash
# Find this section and uncomment:
echo "📋 Step 1.5/4: Running design lint..."
if ! npm run lint:design; then
    echo "⚠️  Design lint warnings found. Continuing deployment..."
fi
```

### 5. Deploy to Staging

```bash
./scripts/deploy-staging.sh "Enable design linting"
```

---

## What's Already Configured

✅ Package installed: `@lapidist/design-lint@6.0.6`  
✅ Configuration file created: `web/designlint.config.json`  
✅ Script added: `npm run lint:design`  
✅ Design tokens mapped from UI Specifications  
✅ Rollback plan documented  
✅ Deployment script prepared (commented out)

---

## Next Action Required

**Upgrade Node.js to v22+ in:**
1. Local development environment
2. Vercel staging environment (Project Settings → Node.js Version)

Once upgraded, you can proceed with testing on staging.

---

## Rollback

If issues occur, see: `docs/Planning/Lapidist_Design_Lint_Rollback_Plan.md`

---

**Ready to test once Node.js is upgraded!**

