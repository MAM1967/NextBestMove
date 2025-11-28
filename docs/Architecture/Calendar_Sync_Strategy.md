# Calendar Sync Strategy

Last updated: Jan 27, 2025  
Status: Implemented

---

## Problem Statement

Calendars are dynamic and change frequently. Users add, modify, or delete events throughout the day. For the app to be useful, calendar data must be kept fresh and reflect the user's current schedule.

---

## Sync Strategy Overview

We use a **multi-layered sync approach** that balances freshness with API rate limits and performance:

### 1. **On-Demand Sync** (Primary)
- **When**: Triggered when user generates a daily plan or views the plan page
- **What**: Fetches fresh free/busy data for the requested date
- **Caching**: Results cached for 5-10 minutes to avoid excessive API calls
- **User Experience**: Always shows current calendar state when user actively uses the app

### 2. **Smart Caching**
- **Today's date**: 5-minute TTL (most likely to change)
- **Future dates**: 10-minute TTL (less likely to change, but still fresh)
- **Past dates**: 1-hour TTL (historical data, rarely changes)
- **Cache invalidation**: On-demand refresh button in Settings, or when user explicitly requests new plan

### 3. **Automatic Token Refresh**
- **Proactive refresh**: Check token expiry before API calls, refresh if < 5 minutes remaining
- **Reactive refresh**: On 401/403 errors, automatically refresh token and retry request
- **Graceful degradation**: If refresh fails, fall back to default capacity (never block user)

### 4. **Background Sync** (Future Enhancement)
- **Scheduled job**: Cron job to refresh tokens and sync calendar data
- **Frequency**: Every 15-30 minutes for active users
- **Scope**: Only refresh tokens, not full free/busy (that's on-demand)
- **Note**: Not implemented in MVP, but architecture supports it

---

## Implementation Details

### Cache Storage

**Option 1: In-Memory Cache (MVP)**
- Simple Map/object in server memory
- Key: `userId:date` (e.g., `user123:2025-01-27`)
- Value: `{ freeMinutes, busySlots, capacity, timestamp }`
- TTL: Based on date (today vs future)
- **Limitation**: Lost on server restart, not shared across instances

**Option 2: Database Cache (Future)**
- Store in `calendar_freebusy_cache` table
- Key: `user_id + date`
- TTL: Automatic cleanup via database triggers
- **Benefit**: Persistent, shared across instances

**MVP Decision**: Use in-memory cache for simplicity. Can upgrade to database cache later if needed.

### Token Refresh Logic

```typescript
async function getValidAccessToken(connection) {
  // Check if token expires soon (< 5 minutes)
  if (connection.expires_at && connection.expires_at < Date.now() + 5 * 60 * 1000) {
    // Refresh proactively
    return await refreshToken(connection);
  }
  return connection.access_token;
}
```

### Free/Busy Fetch Flow

```
1. Check cache for userId:date
2. If cached and fresh (< TTL), return cached data
3. If not cached or stale:
   a. Get valid access token (refresh if needed)
   b. Fetch free/busy from provider API
   c. Calculate capacity
   d. Store in cache
   e. Return fresh data
4. On error: return default capacity (never fail)
```

---

## API Endpoints

### `GET /api/calendar/freebusy?date=YYYY-MM-DD`
- **Purpose**: Get free/busy data for a specific date
- **Caching**: Automatic (5-10 min TTL based on date)
- **Token refresh**: Automatic (proactive + reactive)
- **Fallback**: Always returns data (default capacity on error)

### `POST /api/calendar/refresh` (Internal)
- **Purpose**: Manually refresh calendar connection tokens
- **Usage**: Called automatically on 401 errors, or by background job
- **Returns**: New access token or error

### `POST /api/calendar/sync-status` (Future)
- **Purpose**: Background job to refresh tokens for all active connections
- **Frequency**: Every 15-30 minutes (cron job)
- **Scope**: Token refresh only, not free/busy fetching

---

## User Experience

### Settings Page
- **Last sync time**: Shows when calendar was last successfully synced
- **Refresh button**: Manual refresh to invalidate cache and fetch fresh data
- **Status indicator**: Green (active), Yellow (needs refresh), Red (error)

### Plan Generation
- **Automatic sync**: Fetches fresh free/busy data when generating plan
- **No user action needed**: Happens transparently
- **Fast response**: Uses cache when possible, fresh data when needed

---

## Rate Limiting Considerations

### Google Calendar API
- **Quota**: 1,000,000 queries per day (per project)
- **Per-user limit**: 1,000 queries per 100 seconds per user
- **Our usage**: ~10-20 queries per user per day (generating plan + viewing plan)
- **Safety margin**: Well within limits

### Microsoft Graph API
- **Quota**: 10,000 requests per 10 minutes (per app)
- **Per-user limit**: Not explicitly stated, but generous
- **Our usage**: Similar to Google
- **Safety margin**: Well within limits

### Caching Strategy
- **Reduces API calls**: 5-10 minute cache means max 12-24 calls per user per day
- **Even with 1000 users**: ~24,000 calls/day (well within limits)

---

## Error Handling

### Calendar Not Connected
- **Behavior**: Return default capacity (5-6 actions)
- **User sees**: No error, just default capacity
- **Log**: Info-level log (not error)

### Token Expired
- **Behavior**: Auto-refresh token, retry request
- **If refresh fails**: Fall back to default capacity
- **User sees**: No error, default capacity
- **Log**: Warning-level log

### API Error (Network, 500, etc.)
- **Behavior**: Fall back to default capacity
- **User sees**: No error, default capacity
- **Log**: Error-level log for debugging

### Rate Limit Exceeded
- **Behavior**: Fall back to default capacity
- **User sees**: No error, default capacity
- **Log**: Warning-level log
- **Future**: Implement exponential backoff retry

---

## Future Enhancements

1. **Database Cache**: Move from in-memory to persistent cache
2. **Background Sync Job**: Scheduled token refresh and free/busy pre-fetching
3. **Webhook Integration**: Real-time calendar updates (Google Calendar push notifications)
4. **Multi-Calendar Support**: Sync multiple calendars per user
5. **Smart Pre-fetching**: Pre-fetch free/busy for next 7 days during off-peak hours

---

## Summary

**Current Implementation (MVP):**
- ✅ On-demand sync when user generates/views plan
- ✅ Smart caching (5-10 min TTL based on date)
- ✅ Automatic token refresh (proactive + reactive)
- ✅ Graceful error handling (always returns data)

**Future Enhancements:**
- ⏱ Background sync job (token refresh)
- ⏱ Database cache (persistent, shared)
- ⏱ Webhook integration (real-time updates)

This strategy ensures calendar data stays fresh while respecting API limits and providing excellent user experience.


