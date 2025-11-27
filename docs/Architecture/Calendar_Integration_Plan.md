## Calendar Integration Plan (P0)

Last updated: Jan 27, 2025  
Status: Draft ready for implementation  
Owner: TBD

---

### 1. Scope & Goals

1. **OAuth flows** for Google Calendar & Microsoft Outlook (connect + callback + disconnect).
2. **Token storage** using `calendar_connections` table (encrypted refresh/access tokens, status, last sync).
3. **Calendar status endpoint** to power Settings UI.
4. **Free/busy fetch stub** returning default capacity (6 actions/day) until dynamic capacity is ready.
5. **Settings integration**: show connection state, connection/disconnect CTAs.

Out of scope (future): background sync jobs, actual free/busy parsing, auto-retry queue.

---

### 2. Architecture Overview

#### Routes (Next.js App Router)

| Route                              | Method | Purpose                                         |
| ---------------------------------- | ------ | ----------------------------------------------- |
| `/api/calendar/connect/:provider`  | GET    | Start OAuth (Google or Outlook)                 |
| `/api/calendar/callback/:provider` | GET    | Handle OAuth callback, exchange code for tokens |
| `/api/calendar/status`             | GET    | Return connection info + fallback capacity      |
| `/api/calendar/disconnect`         | DELETE | Remove connection & tokens                      |

#### Data Flow Summary

1. User clicks “Connect Google/Outlook”.
2. Frontend calls `/api/calendar/connect/google`.
3. API constructs authorization URL (state + PKCE), redirects user.
4. Provider calls back to `/api/calendar/callback/google`.
5. Server exchanges code for tokens, encrypts, stores in `calendar_connections`.
6. Trigger updates `users.calendar_connected`.
7. `/api/calendar/status` surfaces connection details for Settings.
8. `/api/calendar/disconnect` deletes the row; trigger updates user flag.

---

### 3. Libraries & Services

- **Google:** [`openid-client`](https://github.com/panva/node-openid-client) (MIT) for OAuth or official `googleapis` client.
- **Microsoft:** [`msal-node`](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node) (MIT).
- **Encryption:** Node `crypto` + environment secrets (e.g., `ENCRYPTION_KEY` via `crypto.createCipheriv`). Consider Supabase Vault if available.
- **HTTP:** native `fetch` (Next.js polyfill). For token exchange use `fetch`.
- **Storage:** `calendar_connections` (already defined in schema) with RLS.
- **Environment:** Add provider client IDs/secret, redirect URIs, encryption key, allowed origins.

---

### 4. Detailed Flow

#### 4.1 Connect Endpoint (`/api/calendar/connect/:provider`)

1. Validate provider ∈ {google, outlook}.
2. Generate `state` + `code_verifier` (PKCE). Store in encrypted cookie or short-lived KV (TBD).
3. Build auth URL with scopes:
   - Google: `https://www.googleapis.com/auth/calendar.readonly`
   - Microsoft: `https://graph.microsoft.com/Calendars.Read`
4. Redirect user to provider URL.

#### 4.2 Callback Endpoint (`/api/calendar/callback/:provider`)

1. Validate `state` + PKCE.
2. Exchange authorization code for tokens.
3. Encrypt refresh/access tokens.
4. Upsert into `calendar_connections` (provider, status=active, calendar_id=primary/default).
5. Trigger updates `users.calendar_connected`.
6. Redirect back to `/app/settings?connected=success`.

#### 4.3 Status Endpoint (`/api/calendar/status`)

Return payload:

```jsonc
{
  "connected": true,
  "provider": "google",
  "status": "active",
  "last_sync_at": "2025-01-26T15:04:00Z",
  "capacity": {
    "level": "default",
    "actions_per_day": 6,
    "source": "fallback"
  }
}
```

#### 4.4 Disconnect Endpoint (`/api/calendar/disconnect`)

1. Delete all `calendar_connections` rows for user (or specific provider).
2. Trigger updates `users.calendar_connected=false`.
3. Optional: revoke tokens via provider API (future).

---

### 5. Security & Privacy

- **Token encryption:** AES-256-GCM using key from env. Store IV & auth tag.
- **Secrets management:** `.env.local` (development) / Project settings (production).
- **State + PKCE:** required to prevent CSRF/code interception.
- **Logging:** never log tokens or refresh codes. Use request IDs for tracing.
- **Scopes:** read-only minimal scopes.
- **RLS:** `calendar_connections` already has RLS; ensure policies allow user to manage own rows.

---

### 6. Free/Busy & Capacity (Phase 1 stub)

- Immediately return `{ level: "default", actions_per_day: 6 }` via `/api/calendar/status`.
- Provide a helper module `lib/calendar/capacity.ts` with:
  ```ts
  export async function getCapacityForDate(userId: string, date: string) {
    return { level: "default", actions_per_day: 6, source: "fallback" };
  }
  ```
- Later, replace fallback with real free/busy fetch (Google Calendar API `freebusy.query`, Microsoft Graph `/me/calendar/getSchedule`).
- Add TODO notes referencing backlog item for dynamic capacity.

---

### 7. Settings UI Integration

- Update Settings page to:
  - Call `/api/calendar/status` (server-side) instead of direct Supabase read if necessary.
  - Surface provider, status, last sync, and connection/disconnect buttons (disabled until flows ready).
  - Show fallback capacity description.

---

### 8. Background Jobs (Future)

- Scheduled job (Vercel Cron/Supabase cron) to:
  - Refresh tokens before expiry.
  - Fetch free/busy for upcoming days.
  - Update `last_sync_at` & handle errors.
- Logging to `calendar_sync_logs` for debugging.

---

### 9. Testing Plan

1. Unit tests for token encryption/decryption helpers.
2. Integration tests for each API route (mock provider responses).
3. Manual verification using Google/Outlook sandbox accounts.
4. Ensure `/api/calendar/status` gracefully handles no connection.

---

### 10. Open Questions / TODOs

- Where to store PKCE verifier? (options: encrypted cookie, Supabase table, KV).
- Should we support multiple calendars per provider in MVP? (assume single `primary` for now).
- Decide on encryption key rotation strategy.
- Determine how capacity fallback will be replaced (tie into backlog item for dynamic capacity).

---

### 11. Environment Variables Setup

#### Required Environment Variables

**OAuth Credentials (from providers):**

- `GOOGLE_CLIENT_ID` - From Google Cloud Console OAuth client
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console OAuth client
- `OUTLOOK_CLIENT_ID` - From Azure App Registration (Application ID)
- `OUTLOOK_CLIENT_SECRET` - From Azure App Registration (Client Secret)
- `OUTLOOK_TENANT_ID` - From Azure App Registration (Directory/Tenant ID, e.g., "common" or your specific tenant)

**Self-Generated (NOT from providers):**

- `CALENDAR_ENCRYPTION_KEY` - **You must generate this yourself** (see below)

#### Generating the Encryption Key

The `CALENDAR_ENCRYPTION_KEY` is **not provided by Google or Microsoft**. It's a key you generate locally to encrypt tokens before storing them in the database.

**Generate a secure 32-byte key:**

```bash
openssl rand -base64 32
```

**Example output:**

```
Fo16o0bIenkHEed/QCTxbxXaNHnJD1oM2EKnNZXI+Mo=
```

**Important:**

- Store this key securely in your `.env.local` (development) and production environment variables
- Never commit this key to git
- Use the same key across all environments, or implement key rotation if needed
- This key is used to encrypt/decrypt refresh tokens and access tokens stored in `calendar_connections`

#### Redirect URIs Configuration

**Google Cloud Console:**

- Add authorized redirect URI: `https://your-domain.com/api/calendar/callback/google`
- For local dev: `http://localhost:3000/api/calendar/callback/google`

**Azure App Registration:**

- Add redirect URI: `https://your-domain.com/api/calendar/callback/outlook`
- For local dev: `http://localhost:3000/api/calendar/callback/outlook`

---

### 12. Implementation Checklist

1. ✅ Add env vars (see section 11 above)

2. Create helper utilities:

   - `encryptToken`, `decryptToken`
   - `buildGoogleAuthUrl`, `exchangeGoogleCode`
   - Similar for Outlook

3. Implement `/api/calendar/connect/:provider`.
4. Implement `/api/calendar/callback/:provider`.
5. Implement `/api/calendar/status`.
6. Implement `/api/calendar/disconnect`.
7. Update Settings page to consume `/api/calendar/status`.
8. Document usage & add README section for env setup.

---

This plan should keep implementation predictable while allowing incremental upgrades (dynamic capacity, background sync) later.  
Once dynamic capacity and stale actions insight launch, update `docs/Planning/daily_plan_algorithm.md` to “Algorithm v2.”
