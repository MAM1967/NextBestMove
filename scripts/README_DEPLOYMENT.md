# Deployment Scripts Documentation

This directory contains scripts for deploying NextBestMove to staging and production environments.

## Workflow Order

The deployment workflow follows this order for good reason:

1. **Type Check** - Fail fast if there are TypeScript errors (prevents pushing broken code)
2. **Doppler Sync** - Sync environment variables to Vercel (ensures builds have latest secrets)
3. **Git Push** - Push to git which triggers Vercel builds (builds use the env vars we just synced)

## Available Scripts

### Deployment Scripts (Recommended)

#### `deploy-staging.sh`
Complete workflow for deploying to **staging/preview**:
- Runs type check
- Syncs Doppler secrets to Vercel Preview
- Pushes to `staging` branch

**Usage:**
```bash
./scripts/deploy-staging.sh [optional commit message]
```

**Example:**
```bash
./scripts/deploy-staging.sh "Fix calendar OAuth issue"
```

#### `deploy-production.sh`
Complete workflow for deploying to **production**:
- Runs type check
- Syncs Doppler secrets to Vercel Production
- Pushes to `main` branch
- Includes confirmation prompt for safety

**Usage:**
```bash
./scripts/deploy-production.sh [optional commit message]
```

**Example:**
```bash
./scripts/deploy-production.sh "Launch v0.1"
```

### Individual Sync Scripts

#### `sync-doppler-to-vercel.sh`
Syncs Doppler secrets to Vercel **Production** environment only.

**Usage:**
```bash
./scripts/sync-doppler-to-vercel.sh
```

**What it does:**
- Fetches all secrets from Doppler project `nextbestmove-prd` config `prd`
- Syncs each secret to Vercel Production environment
- Skips Doppler metadata variables

#### `sync-doppler-to-vercel-preview.sh`
Syncs Doppler secrets to Vercel **Preview** environment (for staging/preview builds).

**Usage:**
```bash
./scripts/sync-doppler-to-vercel-preview.sh
```

**What it does:**
- Fetches all secrets from Doppler project `nextbestmove-prd` config `prd`
- Syncs each secret to Vercel Preview environment
- Skips Doppler metadata variables

## When to Use Each Script

### Use `deploy-staging.sh` when:
- Deploying feature branches or staging code
- Testing changes before production
- Regular development deployments

### Use `deploy-production.sh` when:
- Ready to deploy to production
- Merging staging to production
- Launching new versions

### Use individual sync scripts when:
- You only need to update environment variables (no code changes)
- Debugging environment variable issues
- Manually syncing secrets after changes in Doppler

## Prerequisites

- **Node.js 22+** required for design linting (local and Vercel)
  - Local: Install via `nvm install 22 && nvm use 22`
  - Vercel: Update in Project Settings → General → Node.js Version to 22.x

Before running these scripts, ensure you have:

1. **Doppler CLI** installed and authenticated
   ```bash
   # Install: https://docs.doppler.com/docs/install-cli
   doppler login
   ```

2. **Vercel CLI** installed and authenticated
   ```bash
   # Install
   npm install -g vercel
   
   # Link project (if not already linked)
   cd web
   vercel link
   ```

3. **Git** configured and repository set up
   ```bash
   git remote -v  # Should show your GitHub repo
   ```

## Environment Variables

### Doppler Configuration
- **Project:** `nextbestmove-prd`
- **Config:** `prd` (used for both staging and production)
- **Location:** All secrets stored in Doppler, synced to Vercel

### Vercel Environments
- **Preview:** All preview/staging builds (from `staging` branch)
- **Production:** Production builds (from `main` branch)

## Troubleshooting

### Type check fails
- Fix TypeScript errors before deploying
- Run `cd web && npm run type-check` manually to see errors

### Doppler sync fails
- Verify Doppler CLI is authenticated: `doppler login`
- Check you have access to project: `doppler projects`
- Verify config exists: `doppler configs --project nextbestmove-prd`

### Vercel sync fails
- Verify Vercel CLI is authenticated: `vercel login`
- Check project is linked: `cd web && vercel link`
- Verify you have access to the Vercel project

### Git push fails
- Check you're on the correct branch (staging or main)
- Verify you have uncommitted changes staged/committed
- Check git remote is configured correctly

## Best Practices

1. **Always test in staging first** before deploying to production
2. **Run type check manually** if you want to catch errors before the full workflow
3. **Review changes** before running deployment scripts
4. **Monitor deployments** in Vercel dashboard after pushing
5. **Verify environment variables** are correct in Vercel after syncing

## Workflow Example

### Typical Development Workflow

```bash
# 1. Make changes
# ... edit files ...

# 2. Test locally
cd web
npm run type-check
npm run dev

# 3. Deploy to staging
cd ..
./scripts/deploy-staging.sh "Add new feature X"

# 4. Test in staging/preview

# 5. Deploy to production (after testing)
./scripts/deploy-production.sh "Release feature X"
```

### Quick Environment Variable Update

```bash
# If you only need to update env vars (no code changes)
./scripts/sync-doppler-to-vercel-preview.sh  # For staging
./scripts/sync-doppler-to-vercel.sh          # For production
```

---

**Last Updated:** December 9, 2025

