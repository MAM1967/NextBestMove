# Practical Approach: Getting Doppler Secrets to Vercel

**Problem:** Doppler-Vercel integration UI doesn't match instructions / isn't working  
**Solution:** Use practical alternatives that work regardless of UI changes

---

## Option 1: Manual Sync (Most Reliable - Works Right Now)

This bypasses the integration entirely and manually syncs secrets from Doppler to Vercel.

### Step 1: Export Secrets from Doppler

1. Go to Doppler Dashboard → Your project `nextbestmove-prd`
2. Select the config with production secrets (e.g., `prd`)
3. Click **"Export"** or look for download/export button
4. Choose format: **`.env`** or **`JSON`**
5. Copy all the secrets

### Step 2: Import to Vercel

1. Go to Vercel Dashboard → Your project
2. Settings → Environment Variables
3. For each secret:
   - Click **"Add"**
   - Key: `STRIPE_SECRET_KEY` (etc.)
   - Value: Paste from Doppler
   - Environment: **Production** (or Preview)
   - Click **"Save"**
4. Repeat for all secrets

**Pros:**

- ✅ Works immediately
- ✅ No UI dependencies
- ✅ Full control

**Cons:**

- ⚠️ Manual process
- ⚠️ Need to re-sync when secrets change

---

## Option 2: Doppler CLI + Vercel CLI Script (Automated)

This creates a script that syncs automatically.

### Step 1: Install CLI Tools

```bash
# Install Doppler CLI
brew install dopplerhq/cli/doppler
# or
npm install -g doppler-cli

# Install Vercel CLI
npm install -g vercel
```

### Step 2: Authenticate

```bash
# Login to Doppler
doppler login

# Login to Vercel
vercel login
```

### Step 3: Link Projects

```bash
cd /Users/michaelmcdermott/NextBestMove

# Link to Vercel project
vercel link
# Select your NextBestMove project when prompted
```

### Step 4: Create Sync Script

Create `scripts/sync-doppler-to-vercel.sh`:

```bash
#!/bin/bash
# Sync secrets from Doppler to Vercel

DOPPLER_PROJECT="nextbestmove-prd"
DOPPLER_CONFIG="prd"
VERCEL_ENV="production"

echo "📥 Fetching secrets from Doppler..."
doppler secrets download \
  --project "$DOPPLER_PROJECT" \
  --config "$DOPPLER_CONFIG" \
  --format env \
  --no-file | \
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  if [[ -z "$key" ]] || [[ "$key" =~ ^# ]]; then
    continue
  fi

  # Remove quotes from value if present
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')

  if [ -n "$key" ] && [ -n "$value" ]; then
    echo "📤 Syncing $key to Vercel ($VERCEL_ENV)..."
    echo "$value" | vercel env add "$key" "$VERCEL_ENV" --force
  fi
done

echo "✅ Sync complete!"
```

Make it executable:

```bash
chmod +x scripts/sync-doppler-to-vercel.sh
```

### Step 5: Run Sync

```bash
./scripts/sync-doppler-to-vercel.sh
```

**To sync Preview environment:**
Change `DOPPLER_CONFIG` and `VERCEL_ENV` in the script, or create separate scripts.

**Pros:**

- ✅ Automated
- ✅ Can run anytime
- ✅ Works regardless of UI

**Cons:**

- ⚠️ Requires CLI setup
- ⚠️ Need to run manually when secrets change

---

## Option 3: Use Doppler API Directly (Advanced)

If you want to build a custom sync tool.

### Step 1: Get Doppler Service Token

1. Doppler Dashboard → Project → Access → Service Tokens
2. Generate token for `prd` config
3. Copy token

### Step 2: Create Node.js Sync Script

Create `scripts/sync-doppler-api.js`:

```javascript
const https = require("https");
const { execSync } = require("child_process");

const DOPPLER_TOKEN = process.env.DOPPLER_TOKEN; // From service token
const DOPPLER_PROJECT = "nextbestmove-prd";
const DOPPLER_CONFIG = "prd";
const VERCEL_ENV = "production";

// Fetch secrets from Doppler API
function getSecretsFromDoppler() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.doppler.com",
      path: `/v3/configs/config/secrets/download?project=${DOPPLER_PROJECT}&config=${DOPPLER_CONFIG}&format=json`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${DOPPLER_TOKEN}`,
        Accept: "application/json",
      },
    };

    https
      .get(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

// Sync to Vercel
async function syncToVercel() {
  const secrets = await getSecretsFromDoppler();

  for (const [key, value] of Object.entries(secrets)) {
    console.log(`Syncing ${key}...`);
    try {
      execSync(
        `echo "${value}" | vercel env add "${key}" ${VERCEL_ENV} --force`,
        {
          stdio: "inherit",
        }
      );
    } catch (error) {
      console.error(`Failed to sync ${key}:`, error.message);
    }
  }

  console.log("✅ Sync complete!");
}

syncToVercel();
```

Run:

```bash
export DOPPLER_TOKEN="your-service-token"
node scripts/sync-doppler-api.js
```

---

## Option 4: Keep Current Workaround (Short-Term)

If the integration is too complicated right now, you can:

1. **Keep the hardcoded workarounds** in code (temporary)
2. **Set secrets directly in Vercel** manually
3. **Deal with integration later** when you have more time

This isn't ideal long-term, but it gets you unblocked for launch.

---

## Recommendation: Start with Option 2 (CLI Script)

**Why:**

- ✅ Reliable and works regardless of UI
- ✅ Can automate later
- ✅ Easy to verify it's working
- ✅ No UI dependency

**Steps:**

1. Install CLI tools (5 minutes)
2. Create sync script (5 minutes)
3. Run sync (2 minutes)
4. Test production deployment

---

## What Secrets Do You Need?

Make sure these are synced from Doppler to Vercel:

**Production:**

- `STRIPE_SECRET_KEY` (live key)
- `STRIPE_PRICE_ID_STANDARD_MONTHLY`
- `STRIPE_PRICE_ID_STANDARD_YEARLY`
- `STRIPE_PRICE_ID_PREMIUM_MONTHLY`
- `STRIPE_PRICE_ID_PREMIUM_YEARLY`
- `STRIPE_WEBHOOK_SECRET` (live)
- `GOOGLE_CLIENT_ID` (production)
- `GOOGLE_CLIENT_SECRET` (production)
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`

---

## Quick Start: Manual Sync (5 Minutes)

If you just want it working NOW:

1. **Doppler:** Export secrets as `.env` file
2. **Vercel:** Go to Environment Variables
3. **Copy-paste** each secret manually
4. **Redeploy** Vercel
5. **Test** production

This is the fastest path to working production.

---

## Next Steps

1. **Try Option 2 (CLI script)** - Most reliable
2. **Or use Option 1 (Manual)** - Fastest to get working
3. **Once working:** We can automate or revisit integration later

**Which option do you want to try first?**
