# Calendar Integration Options & Recommendations
## For NextBestMove v0.1

---

## PRD Requirements Summary

**From PRD Section 7.2 & 11.1:**
- **Read-only free/busy data** from Google Calendar and Outlook Calendar
- **Needed data:** Event start/end times, busy status
- **Purpose:** Compute available time to determine daily action capacity
- **Not needed:** Event details, attendees, descriptions, etc.
- **Scope:** Single user's calendar (solopreneur use case)

**Technical Stack (PRD Section 17):**
- Next.js / Node.js API routes
- Supabase (Postgres database)
- Hosting: Vercel

---

## Integration Options

### Option 1: Direct API Integration (Recommended)

**Approach:** Integrate directly with Google Calendar API and Microsoft Graph API

**Pros:**
- ✅ Full control over implementation
- ✅ No third-party dependencies/costs
- ✅ Direct access to latest features
- ✅ Standard OAuth 2.0 flows
- ✅ Free (within API quotas)
- ✅ Well-documented APIs
- ✅ No vendor lock-in

**Cons:**
- ❌ Need to maintain two integrations (Google + Outlook)
- ❌ Need to handle OAuth flows for both providers
- ❌ Slightly more initial development time

**Implementation Details:**
- **Google Calendar:** Use official `googleapis` npm package
- **Microsoft Graph:** Use `@microsoft/microsoft-graph-client` npm package
- **OAuth:** Handle OAuth 2.0 flows for both (can use NextAuth.js or custom)
- **Rate Limits:** 
  - Google: 1,000,000 queries/day (plenty for our use case)
  - Microsoft Graph: 10,000 requests/10 minutes (more than sufficient)

**Cost:** $0 (both APIs are free within quotas)

---

### Option 2: Unified Calendar APIs (Third-Party)

**Approach:** Use a service that abstracts both Google and Outlook into a single API

**Services to Consider:**

#### A. **Unipile** (unipile.com)
- Unified API for Google, Outlook, and other services
- Handles OAuth flows
- Single endpoint structure

**Pros:**
- ✅ Single API for both providers
- ✅ Simplified implementation
- ✅ Handles OAuth complexity

**Cons:**
- ❌ Additional cost (pricing not publicly listed, likely $50+/month)
- ❌ Third-party dependency
- ❌ Potential vendor lock-in
- ❌ May not support all needed features
- ❌ Overkill for simple free/busy data

#### B. **OneCal** (onecal.io)
- Calendar sync and API service
- Focused on calendar synchronization

**Pros:**
- ✅ Unified interface
- ✅ Calendar-focused

**Cons:**
- ❌ Primary focus is sync, not API access
- ❌ Likely more expensive
- ❌ Less relevant for our read-only use case

#### C. **Nylas** (nylas.com)
- Email and calendar integration platform
- Well-established, used by many companies

**Pros:**
- ✅ Mature platform
- ✅ Good documentation
- ✅ Handles OAuth flows
- ✅ Supports Google, Outlook, and more

**Cons:**
- ❌ Cost: Free tier limited, then $49+/month
- ❌ Overkill for simple free/busy reads
- ❌ More features than we need

**Cost:** Typically $50-100+/month for production use

---

### Option 3: Open Source Calendar Libraries

**Approach:** Use open-source libraries that wrap calendar APIs

**Libraries to Consider:**

#### A. **node-ical** / **ics** (iCal format parsing)
- For parsing calendar feeds
- Not suitable for OAuth-based APIs

**Verdict:** ❌ Not applicable (requires calendar feed access)

#### B. **google-calendar-api** (npm packages)
- Multiple packages available
- Mostly wrappers around official `googleapis`

**Verdict:** ✅ Use official `googleapis` instead (better maintained)

#### C. **FullCalendar** / **react-big-calendar** (Frontend UI)
- Calendar UI components
- Not for API integration

**Verdict:** ❌ Not needed (we only need free/busy data, not calendar UI)

---

## Recommended Approach: Direct API Integration (Option 1)

### Why This Approach?

1. **Cost-Effective:** Free within API quotas (which are very generous)
2. **Simple Requirements:** We only need free/busy data, not complex features
3. **Control:** Full control over implementation and error handling
4. **Standard:** Both APIs are industry-standard and well-documented
5. **Future-Proof:** Easy to extend if we need more calendar features later

### Implementation Strategy

#### Phase 1: OAuth Setup
- Google: Set up OAuth 2.0 in Google Cloud Console
- Outlook: Set up Azure App Registration
- Store refresh tokens securely in database
- Use NextAuth.js or similar for OAuth flows

#### Phase 2: API Integration
- Create unified service layer (`CalendarService`)
- Abstract provider differences behind common interface
- Implement free/busy fetching for both providers
- Handle errors and rate limiting

#### Phase 3: Capacity Calculation
- Fetch free/busy data for given date
- Calculate available time slots
- Map to action capacity (per PRD Section 11.1)

### Libraries to Use

1. **Google Calendar:**
   - `googleapis` (official Google client library)
   - Version: Latest stable
   - Package: `npm install googleapis`

2. **Microsoft Graph:**
   - `@microsoft/microsoft-graph-client` (official Microsoft SDK)
   - Package: `npm install @microsoft/microsoft-graph-client`

3. **OAuth Handling:**
   - `next-auth` (recommended) OR
   - Custom OAuth implementation using `googleapis` and MSAL
   - Package: `npm install next-auth`

---

## Proposed API Endpoint Structure

### Internal API Endpoints (Next.js API Routes)

```
POST   /api/calendar/connect/google        # Initiate Google OAuth
POST   /api/calendar/connect/outlook       # Initiate Outlook OAuth
GET    /api/calendar/status                # Get connection status
DELETE /api/calendar/disconnect            # Disconnect calendar
GET    /api/calendar/freebusy?date=YYYY-MM-DD  # Get free/busy data
```

### Data Flow

1. User clicks "Connect Calendar" in onboarding/settings
2. Redirects to OAuth provider (Google/Microsoft)
3. User authorizes access
4. Callback stores refresh token in database
5. System can fetch free/busy data using stored token
6. Daily plan generation uses free/busy to calculate capacity

---

## Security Considerations

1. **Token Storage:**
   - Store refresh tokens encrypted in database
   - Never expose tokens to frontend
   - Use environment variables for client secrets

2. **Scopes (Minimal):**
   - Google: `https://www.googleapis.com/auth/calendar.readonly`
   - Outlook: `Calendars.Read` (minimum required)

3. **Error Handling:**
   - Handle expired tokens gracefully
   - Provide clear error messages
   - Log errors without exposing sensitive data

---

## Database Schema Needs

### Calendar Connection Table
```sql
calendar_connections
- id
- user_id (foreign key)
- provider (google | outlook)
- refresh_token (encrypted)
- access_token (encrypted, temporary)
- expires_at
- calendar_id (primary calendar identifier)
- created_at
- updated_at
```

---

## Questions for Approval

1. **Do you approve Option 1 (Direct API Integration)?**
   - [ ] Yes, proceed with direct API integration
   - [ ] No, prefer unified API service (which one?)
   - [ ] Other approach?

2. **OAuth Library Preference:**
   - [ ] NextAuth.js (recommended, handles both providers)
   - [ ] Custom implementation
   - [ ] Other?

3. **Token Storage:**
   - [ ] Encrypted in database (recommended)
   - [ ] Other method?

4. **Error Handling:**
   - Should we show users if calendar connection fails?
   - Should we allow manual capacity override as fallback?

---

## Next Steps (After Approval)

1. ✅ Create detailed API endpoint specifications
2. ✅ Create database schema for calendar connections
3. ✅ Document OAuth flow diagrams
4. ✅ Create implementation guide for calendar service
5. ✅ Define error handling strategy

---

*Please review and approve before proceeding with detailed API specifications.*

