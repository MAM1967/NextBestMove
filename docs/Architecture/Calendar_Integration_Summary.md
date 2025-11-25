# Calendar Integration Implementation Summary
## NextBestMove v0.1

---

## ✅ Completed Documentation

### 1. Calendar API Specifications
**File:** `Calendar_API_Specifications.md`

**Contents:**
- ✅ NextAuth.js OAuth configuration for Google & Outlook
- ✅ 7 API endpoints fully specified:
  - `GET /api/calendar/status` - Check connection status
  - `GET /api/calendar/connect/google` - Initiate Google OAuth
  - `GET /api/calendar/connect/outlook` - Initiate Outlook OAuth
  - `DELETE /api/calendar/disconnect` - Disconnect calendar
  - `GET /api/calendar/freebusy?date=YYYY-MM-DD` - Get free/busy data
  - `POST /api/calendar/refresh` - Refresh tokens (internal)
  - `POST /api/calendar/sync-status` - Background sync job
- ✅ OAuth flow diagrams
- ✅ Error handling strategy with graceful degradation
- ✅ Rate limiting considerations
- ✅ Token encryption guidance

### 2. Database Schema
**File:** `Database_Schema.md`

**Contents:**
- ✅ 9 complete table definitions:
  - `users` - User accounts
  - `person_pins` - Pinned people
  - `actions` - Action items
  - `daily_plans` - Generated daily plans
  - `daily_plan_actions` - Junction table (ordered actions)
  - `weekly_summaries` - Weekly summary reports
  - `content_prompts` - Saved content prompts
  - `calendar_connections` - OAuth calendar connections
  - `calendar_sync_logs` - Optional audit log
- ✅ All enums defined (pin_status, action_type, action_state, etc.)
- ✅ Comprehensive indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Helper functions (auto-archive, streak calculation, etc.)
- ✅ Triggers for data integrity

---

## Key Implementation Details

### Error Handling Philosophy

**Principle:** Fail gracefully, keep users moving

**Strategy:**
1. ✅ Never block users - Always provide fallbacks
2. ✅ Log errors with full context for debugging
3. ✅ Show clear, human-friendly messages when needed
4. ✅ Degrade gracefully (default capacity if calendar unavailable)
5. ✅ Handle background issues silently when possible

**Examples:**
- Calendar not connected → Default capacity (5-6 actions), no error shown
- Token expired → Auto-refresh, fallback if fails
- API errors → Use default capacity, log for debugging
- Network errors → Return fallback immediately, no retry delays

---

## API Endpoints Overview

### User-Facing Endpoints

| Endpoint | Method | Purpose | Fallback Behavior |
|----------|--------|---------|-------------------|
| `/api/calendar/status` | GET | Check connection | Returns `connected: false` |
| `/api/calendar/connect/google` | GET | Start Google OAuth | Redirects with error param |
| `/api/calendar/connect/outlook` | GET | Start Outlook OAuth | Redirects with error param |
| `/api/calendar/disconnect` | DELETE | Remove connection | Always succeeds, logs errors |
| `/api/calendar/freebusy` | GET | Get free/busy data | Returns default capacity |

### Internal/Background Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/calendar/refresh` | POST | Refresh expired tokens |
| `/api/calendar/sync-status` | POST | Background sync job |

---

## Database Schema Highlights

### Core Tables

1. **users** - User accounts with timezone, streak tracking
2. **person_pins** - Pinned contacts with status management
3. **actions** - Action items with state machine support
4. **daily_plans** - Daily plans with capacity tracking
5. **weekly_summaries** - Weekly reports with AI insights

### Calendar Integration

6. **calendar_connections** - OAuth tokens (encrypted)
   - Stores refresh tokens encrypted
   - Tracks connection status
   - Auto-updates `users.calendar_connected` flag

7. **calendar_sync_logs** (Optional) - Audit trail
   - Debugging and monitoring
   - 90-day retention recommended

### Key Features

- ✅ **RLS Policies:** Users can only access their own data
- ✅ **Auto-Archive:** Actions archived after 90 days
- ✅ **Auto-Unsnooze:** Automatic unsnooze on due date
- ✅ **Streak Calculation:** Helper functions for streak tracking
- ✅ **Performance Indexes:** Optimized for common queries

---

## Capacity Calculation Logic

**From PRD Section 11.1:**

```
Free Time          Capacity     Actions/Day
< 30 min          micro         1-2
30-60 min         light         3-4
60-120 min        standard      5-6
> 120 min         heavy         7-8
No calendar       default       5-6
```

**Implementation:**
1. Fetch free/busy for date (9 AM - 5 PM, user's timezone)
2. Calculate free minutes (total time - busy slots)
3. Map to capacity level
4. Fallback to default if calendar unavailable

---

## OAuth Flow Summary

### Google Calendar
1. User clicks "Connect Google Calendar"
2. Redirect to NextAuth.js Google OAuth
3. User authorizes access
4. Store refresh token (encrypted) in `calendar_connections`
5. Update `users.calendar_connected = true`
6. Redirect to callback URL

### Outlook Calendar
1. User clicks "Connect Outlook Calendar"
2. Redirect to NextAuth.js Azure AD OAuth
3. User authorizes access
4. Store refresh token (encrypted) in `calendar_connections`
5. Update `users.calendar_connected = true`
6. Redirect to callback URL

---

## Security Considerations

### Token Storage
- ✅ Refresh tokens encrypted before storing
- ✅ Access tokens temporary (not stored long-term)
- ✅ Use environment variables for encryption keys
- ✅ Application-level encryption recommended

### OAuth Scopes (Minimal)
- **Google:** `https://www.googleapis.com/auth/calendar.readonly`
- **Outlook:** `Calendars.Read offline_access`

### Data Protection
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only access own data
- ✅ Encrypted sensitive fields
- ✅ Audit logging for debugging

---

## Next Steps for Implementation

### Phase 1: Setup (Week 1)
- [ ] Set up NextAuth.js with Google & Outlook providers
- [ ] Create database schema (run migrations)
- [ ] Implement token encryption utilities
- [ ] Set up environment variables

### Phase 2: OAuth Implementation (Week 2)
- [ ] Implement connection endpoints
- [ ] Create OAuth callback handlers
- [ ] Store tokens securely
- [ ] Test connection flows

### Phase 3: Free/Busy API (Week 3)
- [ ] Implement free/busy fetching
- [ ] Create capacity calculation service
- [ ] Add caching layer
- [ ] Test with both providers

### Phase 4: Integration (Week 4)
- [ ] Integrate with daily plan generation
- [ ] Add calendar settings UI
- [ ] Implement disconnect functionality
- [ ] Error handling & fallbacks

### Phase 5: Polish (Week 5)
- [ ] Background sync jobs
- [ ] Token refresh automation
- [ ] Error monitoring
- [ ] Documentation

---

## Documentation Files Reference

1. **Calendar_Integration_Options.md** - Options analysis and recommendation
2. **Calendar_API_Specifications.md** - Detailed API endpoint specs
3. **Database_Schema.md** - Complete database schema
4. **Calendar_Integration_Summary.md** - This summary document

---

## Quick Reference

### Error Handling Pattern

```typescript
try {
  // Attempt calendar operation
  const freeBusy = await fetchFreeBusy(date);
  return { ...freeBusy, fallback: false };
} catch (error) {
  // Log error with full context
  logger.error('Calendar fetch failed', { error, userId, date });
  
  // Return graceful fallback
  return {
    date,
    freeMinutes: null,
    capacity: 'default',
    suggestedActionCount: 5,
    fallback: true,
    message: 'Using default capacity'
  };
}
```

### Capacity Calculation

```typescript
function calculateCapacity(freeMinutes: number | null): CapacityLevel {
  if (freeMinutes === null) return 'default';
  if (freeMinutes < 30) return 'micro';
  if (freeMinutes < 60) return 'light';
  if (freeMinutes < 120) return 'standard';
  return 'heavy';
}
```

---

*Calendar Integration Summary - Ready for implementation*

