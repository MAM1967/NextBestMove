# Fix: Doppler Vercel Integration Sync Direction

**Problem:** Integration is syncing FROM Vercel → TO Doppler (wrong direction)  
**Solution:** Set up FROM Doppler side to sync TO Vercel (correct direction)

---

## The Issue

When you install the Doppler integration from the **Vercel Marketplace**, it defaults to:

- **Importing** existing Vercel environment variables into Doppler
- Creating a new Doppler project
- Syncing FROM Vercel → TO Doppler

**But you want the opposite:**

- Use your **existing** Doppler project (`nextbestmove-prd`)
- Sync secrets FROM Doppler → TO Vercel

---

## Solution: Set Up Integration FROM Doppler Side

### Step 1: Remove Wrong Integration

1. Go to **Doppler Dashboard**
2. Find the auto-created project `next-best-move`
3. Go to **"Integrations"** → Find Vercel integration
4. Click **"Remove"** or **"Disconnect"**
5. (Optional) Delete the `next-best-move` project if you don't need it

### Step 2: Set Up Correct Integration FROM Doppler

**Do this from Doppler, NOT from Vercel Marketplace:**

1. Go to **Doppler Dashboard**
2. Select your **existing project**: `nextbestmove-prd`
3. Click **"Integrations"** in the left sidebar
4. Click **"+ Add Integration"** or find **"Vercel"**
5. Click **"Connect Vercel"** or **"Setup Vercel Integration"**
6. **Authorize** Doppler to access your Vercel account (if prompted)
7. **Configure the sync:**
   - **Source:** Doppler (should be pre-selected since you're in Doppler)
   - **Destination:** Vercel
   - **Doppler Project:** `nextbestmove-prd` (should be pre-selected)
   - **Doppler Config:** Select the config with production secrets (e.g., `prd`)
   - **Vercel Project:** Select your NextBestMove Vercel project
   - **Vercel Environment:** Production
8. **Verify sync direction:** Make sure it says **"Doppler → Vercel"** (not "Vercel → Doppler")
9. Click **"Save"** or **"Enable Sync"**

### Step 3: Verify It's Working

1. Check Vercel Dashboard → Project → Settings → Environment Variables
2. You should see secrets appearing from Doppler
3. Update a secret in Doppler
4. Check if it syncs to Vercel (may take a minute)

---

## Alternative: Use Doppler CLI Sync

If the dashboard integration still doesn't work correctly:

### Option A: Manual Sync Script

```bash
# Install Doppler CLI (if not installed)
brew install dopplerhq/cli/doppler

# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to both
doppler login
vercel login

# Link to your project
cd /Users/michaelmcdermott/NextBestMove
vercel link  # Select your Vercel project

# Sync secrets from Doppler to Vercel
doppler secrets download --project nextbestmove-prd --config prd --format env --no-file | \
  while IFS='=' read -r key value; do
    if [ -n "$key" ] && [ -n "$value" ]; then
      echo "$value" | vercel env add "$key" production
    fi
  done
```

### Option B: One-Time Sync Script

Create a script to sync all secrets:

```bash
#!/bin/bash
# sync-doppler-to-vercel.sh

DOPPLER_PROJECT="nextbestmove-prd"
DOPPLER_CONFIG="prd"
VERCEL_ENV="production"

# Download secrets from Doppler
doppler secrets download \
  --project "$DOPPLER_PROJECT" \
  --config "$DOPPLER_CONFIG" \
  --format env \
  --no-file | \
while IFS='=' read -r key value; do
  if [ -n "$key" ] && [ -n "$value" ]; then
    echo "Syncing $key to Vercel..."
    echo "$value" | vercel env add "$key" "$VERCEL_ENV"
  fi
done

echo "Sync complete!"
```

Run it:

```bash
chmod +x sync-doppler-to-vercel.sh
./sync-doppler-to-vercel.sh
```

---

## Why This Happens

The Vercel Marketplace integration is designed for teams that:

- Already have secrets in Vercel
- Want to import them into Doppler for centralized management

But you:

- Already have secrets in Doppler
- Want to sync them TO Vercel

**Solution:** Always set up the integration FROM Doppler side to ensure correct direction.

---

## After Setup

Once working correctly:

- ✅ Secrets flow FROM Doppler → TO Vercel
- ✅ Updates in Doppler automatically sync to Vercel
- ✅ Vercel deployments get synced secrets
- ✅ No need to manually manage Vercel env vars

---

## Troubleshooting

**If secrets still don't sync:**

1. Check Doppler integration logs
2. Verify Vercel project permissions
3. Check if secrets exist in both places (conflicts)
4. Try removing existing secrets from Vercel and let Doppler populate them

**If sync direction is still wrong:**

1. Remove integration completely
2. Set up FROM Doppler dashboard (not Vercel marketplace)
3. Double-check sync direction before saving

---

**Key Takeaway:** Set up integrations FROM the source system (Doppler) not the destination (Vercel) to control sync direction.
