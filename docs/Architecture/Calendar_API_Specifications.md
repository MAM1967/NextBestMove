# Calendar API Endpoint Specifications
## NextBestMove v0.1 - Direct OAuth Integration

> ⚠️ **NOTE:** This document is partially outdated. The implementation uses direct OAuth 2.0 with `openid-client` library, NOT NextAuth.js. The endpoint specifications are still accurate, but the OAuth flow details need updating to match the actual implementation. See `/web/src/app/api/calendar/` for current implementation.

---

## Overview

This document specifies the API endpoints for Google Calendar and Outlook Calendar integration using direct OAuth 2.0 integration.

**Approach:** Direct OAuth 2.0 Integration  
**OAuth Library:** `openid-client` (NOT NextAuth.js)  
**Error Strategy:** Graceful degradation with clear user messaging

---

## Table of Contents

1. [OAuth Flow & NextAuth.js Configuration](#oauth-flow--nextauthjs-configuration)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Implementation Notes](#implementation-notes)

---

## OAuth Flow & NextAuth.js Configuration

### NextAuth.js Setup

#### Required Environment Variables

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000  # or production URL
NEXTAUTH_SECRET=your-secret-key     # Generate with: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common  # or your tenant ID
```

#### NextAuth.js Providers Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
          access_type: 'offline',
          prompt: 'consent', // Force consent to get refresh token
        },
      },
    }),
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID,
      authorization: {
        params: {
          scope: 'openid email profile Calendars.Read offline_access',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Store provider-specific tokens
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      // Make tokens available to client
      session.accessToken = token.accessToken;
      session.provider = token.provider;
      return session;
    },
  },
};

export const handler = NextAuth(authOptions);
```

### OAuth Flow Diagrams

#### Google Calendar Connection Flow

```
User clicks "Connect Google Calendar"
    ↓
Redirect to NextAuth.js Google OAuth endpoint
    ↓
User authenticates with Google
    ↓
Google redirects to callback with authorization code
    ↓
NextAuth.js exchanges code for tokens
    ↓
Store refresh token in database
    ↓
Create calendar_connection record
    ↓
Redirect user back to app with success
```

#### Outlook Calendar Connection Flow

```
User clicks "Connect Outlook Calendar"
    ↓
Redirect to NextAuth.js Azure AD OAuth endpoint
    ↓
User authenticates with Microsoft
    ↓
Microsoft redirects to callback with authorization code
    ↓
NextAuth.js exchanges code for tokens
    ↓
Store refresh token in database
    ↓
Create calendar_connection record
    ↓
Redirect user back to app with success
```

---

## API Endpoints

### Base URL
- **Development:** `http://localhost:3000/api`
- **Production:** `https://your-domain.com/api`

### Authentication
All endpoints (except OAuth callbacks) require authentication via NextAuth.js session.

---

### 1. Get Calendar Connection Status

**Endpoint:** `GET /api/calendar/status`

**Description:** Returns the current calendar connection status for the authenticated user.

**Request:**
```http
GET /api/calendar/status
Authorization: Bearer {session_token}
```

**Response Success (200 OK):**
```json
{
  "connected": true,
  "provider": "google" | "outlook" | null,
  "calendarId": "primary",
  "connectedAt": "2025-01-15T10:30:00Z",
  "lastSyncAt": "2025-01-20T08:00:00Z",
  "status": "active" | "expired" | "error"
}
```

**Response Not Connected (200 OK):**
```json
{
  "connected": false,
  "provider": null,
  "calendarId": null,
  "connectedAt": null,
  "lastSyncAt": null,
  "status": "disconnected"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to check calendar status",
  "message": "Unable to retrieve connection status. Please try again.",
  "code": "CALENDAR_STATUS_ERROR",
  "retryable": true
}
```

**Implementation Notes:**
- Check `calendar_connections` table for user
- Validate refresh token is still valid
- Return graceful error if check fails (don't block user)

---

### 2. Initiate Google Calendar Connection

**Endpoint:** `GET /api/calendar/connect/google`

**Description:** Initiates OAuth flow for Google Calendar connection. Redirects user to Google OAuth consent screen.

**Request:**
```http
GET /api/calendar/connect/google?callbackUrl=/settings
```

**Query Parameters:**
- `callbackUrl` (optional): URL to redirect to after connection. Default: `/settings`

**Response:** HTTP 302 Redirect to NextAuth.js Google OAuth endpoint

**NextAuth.js Callback Handling:**
After successful OAuth, NextAuth.js callback will:
1. Receive tokens from Google
2. Call internal API to store connection
3. Redirect to `callbackUrl`

**Internal Endpoint (Called by NextAuth callback):**
```
POST /api/calendar/connect/google/callback
Body: {
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
  calendarId: string
}
```

**Error Handling:**
- If OAuth fails, redirect to `callbackUrl?error=connection_failed`
- Log error for debugging
- Show user-friendly message: "Unable to connect Google Calendar. Please try again."

---

### 3. Initiate Outlook Calendar Connection

**Endpoint:** `GET /api/calendar/connect/outlook`

**Description:** Initiates OAuth flow for Outlook Calendar connection. Redirects user to Microsoft OAuth consent screen.

**Request:**
```http
GET /api/calendar/connect/outlook?callbackUrl=/settings
```

**Query Parameters:**
- `callbackUrl` (optional): URL to redirect to after connection. Default: `/settings`

**Response:** HTTP 302 Redirect to NextAuth.js Azure AD OAuth endpoint

**Error Handling:**
- If OAuth fails, redirect to `callbackUrl?error=connection_failed`
- Log error for debugging
- Show user-friendly message: "Unable to connect Outlook Calendar. Please try again."

---

### 4. Disconnect Calendar

**Endpoint:** `DELETE /api/calendar/disconnect`

**Description:** Disconnects the user's calendar connection and removes stored tokens.

**Request:**
```http
DELETE /api/calendar/disconnect
Authorization: Bearer {session_token}
```

**Response Success (200 OK):**
```json
{
  "success": true,
  "message": "Calendar disconnected successfully"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to disconnect calendar",
  "message": "Unable to disconnect calendar. Please try again.",
  "code": "CALENDAR_DISCONNECT_ERROR",
  "retryable": true
}
```

**Implementation Notes:**
- Delete `calendar_connection` record
- Optionally revoke tokens with provider (best practice)
- Always succeed from user perspective (log errors but return success)
- Graceful: If deletion fails, log but don't block user

---

### 5. Get Free/Busy Data

**Endpoint:** `GET /api/calendar/freebusy`

**Description:** Retrieves free/busy information for a specific date. Used to calculate daily plan capacity.

**Request:**
```http
GET /api/calendar/freebusy?date=2025-01-20
Authorization: Bearer {session_token}
```

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Response Success (200 OK):**
```json
{
  "date": "2025-01-20",
  "freeMinutes": 420,
  "busySlots": [
    {
      "start": "2025-01-20T09:00:00Z",
      "end": "2025-01-20T10:30:00Z"
    },
    {
      "start": "2025-01-20T14:00:00Z",
      "end": "2025-01-20T15:00:00Z"
    }
  ],
  "workingHours": {
    "start": "09:00",
    "end": "17:00"
  },
  "capacity": "standard",  // micro | light | standard | heavy
  "suggestedActionCount": 6
}
```

**Response Not Connected (200 OK - Graceful Fallback):**
```json
{
  "date": "2025-01-20",
  "freeMinutes": null,
  "busySlots": [],
  "workingHours": null,
  "capacity": "default",
  "suggestedActionCount": 5,
  "fallback": true,
  "message": "Calendar not connected. Using default capacity."
}
```

**Error Response (500 Internal Server Error - Graceful Fallback):**
```json
{
  "date": "2025-01-20",
  "freeMinutes": null,
  "busySlots": [],
  "workingHours": null,
  "capacity": "default",
  "suggestedActionCount": 5,
  "fallback": true,
  "error": "CALENDAR_FETCH_ERROR",
  "message": "Unable to access calendar. Using default capacity."
}
```

**Implementation Notes:**
- Always return 200 OK (never fail)
- Calculate free minutes from 9 AM - 5 PM (user's timezone)
- Exclude busy slots from free time calculation
- Map to capacity: < 30 min = micro, 30-60 = light, 60-120 = standard, > 120 = heavy
- If calendar not connected or error: return default capacity (5-6 actions)
- Log errors for debugging but never block user

**Capacity Mapping (per PRD Section 11.1):**
```
Free Time          Capacity     Actions
< 30 min          Micro         1-2
30-60 min         Light         3-4
60-120 min        Standard      5-6
> 120 min         Heavy         7-8
No calendar       Default       5-6
```

---

### 6. Refresh Calendar Connection (Internal)

**Endpoint:** `POST /api/calendar/refresh`

**Description:** Refreshes expired access tokens using stored refresh tokens. Called internally when tokens expire.

**Request:**
```http
POST /api/calendar/refresh
Authorization: Bearer {session_token}
```

**Response Success (200 OK):**
```json
{
  "success": true,
  "refreshed": true
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to refresh calendar connection",
  "message": "Calendar connection expired. Please reconnect.",
  "code": "CALENDAR_REFRESH_ERROR",
  "requiresReconnect": true
}
```

**Implementation Notes:**
- Called automatically when free/busy request fails with 401
- Update `calendar_connection` record with new tokens
- If refresh fails, mark connection as expired but don't block user
- User can continue with default capacity until they reconnect

---

### 7. Calendar Token Maintenance (Background Job)

**Endpoint:** `GET /api/cron/calendar-token-maintenance`

**Description:** Background job to proactively refresh calendar tokens expiring within 24 hours. Runs daily via cron-job.org to prevent token expiration for inactive users.

**Request:**
```http
GET /api/cron/calendar-token-maintenance
Authorization: Bearer {CRON_SECRET}
```

**Response Success (200 OK):**
```json
{
  "success": true,
  "message": "Calendar token maintenance completed",
  "total": 45,
  "refreshed": 42,
  "expired": 2,
  "skipped": 1,
  "errors": 0
}
```

**Implementation Notes:**
- Configured in cron-job.org (see Architecture_Summary.md)
- Finds all active calendar connections
- Identifies tokens expiring within 24 hours
- Proactively refreshes them
- Marks connections as expired if refresh fails
- Updates `last_sync_at` on successful refresh
- Runs silently (no user-facing errors)

---

## Data Models

### Calendar Connection

```typescript
type CalendarProvider = 'google' | 'outlook';

type CalendarConnectionStatus = 'active' | 'expired' | 'error' | 'disconnected';

interface CalendarConnection {
  id: string;
  user_id: string;
  provider: CalendarProvider;
  refresh_token: string; // Encrypted
  access_token?: string; // Encrypted, temporary
  expires_at?: number; // Unix timestamp
  calendar_id: string; // Provider's calendar identifier (e.g., "primary")
  status: CalendarConnectionStatus;
  last_sync_at?: string; // ISO 8601
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  error_message?: string; // Last error if status is "error"
}
```

### Free/Busy Response

```typescript
interface FreeBusySlot {
  start: string; // ISO 8601
  end: string; // ISO 8601
}

type CapacityLevel = 'micro' | 'light' | 'standard' | 'heavy' | 'default';

interface FreeBusyResponse {
  date: string; // YYYY-MM-DD
  freeMinutes: number | null;
  busySlots: FreeBusySlot[];
  workingHours: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  } | null;
  capacity: CapacityLevel;
  suggestedActionCount: number;
  fallback?: boolean; // true if using default due to error
  message?: string; // User-friendly message if fallback
  error?: string; // Error code if applicable (for logging)
}
```

---

## Error Handling Strategy

### Principle: Fail Gracefully, Keep Users Moving

All calendar endpoints should:
1. **Never block the user** - Always provide a fallback
2. **Log errors** - Capture detailed error info for debugging
3. **Show clear messages** - User-friendly error messages when needed
4. **Degrade gracefully** - Fall back to default capacity if calendar unavailable

### Error Types & Handling

#### 1. Calendar Not Connected

**User Experience:**
- Show default capacity (5-6 actions)
- Display subtle message: "Connect your calendar to personalize your daily plan"
- Don't block or interrupt workflow

**Technical:**
- Return fallback response with `fallback: true`
- Log info level (not error)

---

#### 2. Token Expired

**User Experience:**
- Automatically attempt token refresh (background)
- If refresh succeeds: Continue seamlessly
- If refresh fails: Show default capacity + prompt to reconnect

**Technical:**
- Try refresh automatically
- If fails, mark connection as expired
- Return fallback response
- Log error with context

---

#### 3. Rate Limit Exceeded

**User Experience:**
- Use cached data if available
- Fall back to default capacity
- Show no error (transparent to user)

**Technical:**
- Implement caching (5-10 minute cache for free/busy)
- Return cached data if available
- Log warning for monitoring
- Return fallback if no cache

---

#### 4. Network/API Errors

**User Experience:**
- Use default capacity immediately
- Show no error message (happens in background)
- Allow user to continue working

**Technical:**
- Catch all errors
- Log with full context
- Return fallback response immediately
- Don't retry (prevents delays)

---

#### 5. Permission Revoked

**User Experience:**
- Detect on next sync
- Mark connection as expired
- Show message: "Calendar connection expired. Please reconnect."
- Offer reconnect button

**Technical:**
- Detect 403/401 errors
- Mark connection as expired in DB
- Log for monitoring
- Show reconnection prompt (non-blocking)

---

### Error Response Format

All errors should follow this format:

```typescript
interface ErrorResponse {
  error: string; // Error code for logging
  message: string; // User-friendly message
  code: string; // Machine-readable error code
  retryable?: boolean; // Whether retry makes sense
  requiresReconnect?: boolean; // Whether user needs to reconnect
  fallback?: any; // Fallback data if applicable
}
```

### Error Codes

```typescript
const ERROR_CODES = {
  CALENDAR_NOT_CONNECTED: 'CALENDAR_NOT_CONNECTED',
  CALENDAR_TOKEN_EXPIRED: 'CALENDAR_TOKEN_EXPIRED',
  CALENDAR_REFRESH_FAILED: 'CALENDAR_REFRESH_FAILED',
  CALENDAR_RATE_LIMIT: 'CALENDAR_RATE_LIMIT',
  CALENDAR_NETWORK_ERROR: 'CALENDAR_NETWORK_ERROR',
  CALENDAR_PERMISSION_DENIED: 'CALENDAR_PERMISSION_DENIED',
  CALENDAR_STATUS_ERROR: 'CALENDAR_STATUS_ERROR',
  CALENDAR_DISCONNECT_ERROR: 'CALENDAR_DISCONNECT_ERROR',
  CALENDAR_FETCH_ERROR: 'CALENDAR_FETCH_ERROR',
} as const;
```

---

## Rate Limiting

### Provider Limits

#### Google Calendar API
- **Quota:** 1,000,000 queries/day (free)
- **Per user:** ~50 queries/day (well within limit)
- **Caching:** Cache free/busy data for 5-10 minutes

#### Microsoft Graph API
- **Limit:** 10,000 requests per 10 minutes
- **Per user:** ~50 requests/day (well within limit)
- **Caching:** Cache free/busy data for 5-10 minutes

### Implementation Strategy

1. **Cache free/busy responses:**
   - Cache key: `freebusy:${userId}:${date}`
   - TTL: 10 minutes
   - Store in Redis or in-memory cache

2. **Batch requests:**
   - Fetch multiple days at once if needed
   - Reduce API calls

3. **Background sync:**
   - Sync calendar status periodically
   - Don't impact user-facing requests

---

## Implementation Notes

### Token Encryption

Store refresh tokens encrypted in database:

```typescript
// Use environment variable for encryption key
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

function encryptToken(token: string): string {
  // Use AES-256-GCM encryption
  // Implementation depends on encryption library
}

function decryptToken(encryptedToken: string): string {
  // Decrypt using same key
}
```

### Working Hours Detection

For free/busy calculation:
- Default: 9 AM - 5 PM (user's timezone)
- Can be enhanced in v0.2 to detect from calendar settings

### Timezone Handling

- Store user timezone in `users` table
- Convert all times to user's timezone
- Use ISO 8601 format with timezone info

### Testing Strategy

1. **Unit Tests:**
   - Capacity calculation logic
   - Free/busy parsing
   - Error handling paths

2. **Integration Tests:**
   - OAuth flow end-to-end
   - Free/busy fetching
   - Token refresh

3. **Error Scenarios:**
   - Token expiration
   - Network failures
   - Rate limiting
   - Permission revocation

---

## Next Steps

1. ✅ API endpoint specifications (this document)
2. ⏳ Database schema (next document)
3. ⏳ Implementation guide
4. ⏳ OAuth callback handlers
5. ⏳ Free/busy calculation service

---

*Calendar API Specifications v1.0 - Ready for implementation*

