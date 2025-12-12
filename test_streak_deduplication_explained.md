# How Streak Recovery Cron Job Determines Which Day

## How It Works

The cron job runs **once per day** and processes **all users** with broken streaks. It determines which "day" each user is on by calculating how many days they've been inactive.

### The Process:

1. **Cron job runs daily** (e.g., at 3:00 AM UTC)
2. **Finds all users** with `streak_count = 0` and `last_action_date >= 1 day ago`
3. **For each user**, calculates `daysInactive` using `getDaysSinceLastAction()`:
   ```typescript
   const daysInactive = await getDaysSinceLastAction(supabase, user.id);
   // Returns: 1, 2, 3, 7, etc. based on last_action_date
   ```
4. **Checks metadata** to see if notification already sent:
   ```typescript
   const lastNotificationDay = streakNotifications.last_day || 0;
   ```
5. **Sends notification** based on `daysInactive`:
   - `daysInactive === 1` → Day 1 notification (if `lastNotificationDay < 1`)
   - `daysInactive === 2` → Day 2 notification (if `lastNotificationDay < 2`)
   - `daysInactive === 3` → Day 3 notification (if `lastNotificationDay < 3`)
   - `daysInactive === 7` → Day 7 notification (if `lastNotificationDay < 7`)

## Example Timeline

**Day 0 (User completes last action):**
- `last_action_date = 2025-12-01`
- `streak_count = 5`

**Day 1 (2025-12-02):**
- Cron runs → `daysInactive = 1`
- Sends Day 1 notification
- Sets `metadata.streak_notifications = { day1_sent: true, last_day: 1 }`

**Day 2 (2025-12-03):**
- Cron runs → `daysInactive = 2`
- Sends Day 2 notification (or just logs, since Micro Mode is handled by plan generation)
- Sets `metadata.streak_notifications = { ..., day2_detected: true, last_day: 2 }`

**Day 3 (2025-12-04):**
- Cron runs → `daysInactive = 3`
- Sends Day 3 email
- Sets `metadata.streak_notifications = { ..., day3_sent: true, last_day: 3 }`

**Day 4 (2025-12-05):**
- Cron runs → `daysInactive = 4`
- No notification (only Day 1, 2, 3, 7 are handled)
- Metadata unchanged

**Day 5 (2025-12-06):**
- Cron runs → `daysInactive = 5`
- No notification
- Metadata unchanged

**Day 6 (2025-12-07):**
- Cron runs → `daysInactive = 6`
- No notification
- Metadata unchanged

**Day 7 (2025-12-08):**
- Cron runs → `daysInactive = 7`
- Sends Day 7 billing pause email (if user has active subscription)
- Sets `metadata.streak_notifications = { ..., day7_sent: true, last_day: 7 }`

## For Deduplication Test

To test deduplication for Day 3:

1. **Set user to 3 days inactive:**
   ```sql
   UPDATE users
   SET last_action_date = CURRENT_DATE - INTERVAL '3 days'
   WHERE email = 'mcddsl@icloud.com';
   ```

2. **First cron run:**
   - `daysInactive = 3`
   - `lastNotificationDay = 0` (or < 3)
   - ✅ Sends Day 3 email
   - Sets `last_day: 3, day3_sent: true`

3. **Second cron run (same day or next day, still 3 days inactive):**
   - `daysInactive = 3`
   - `lastNotificationDay = 3` (already sent)
   - ❌ Skips sending (because `lastNotificationDay >= 3`)
   - No duplicate email

4. **If user becomes 4 days inactive:**
   - `daysInactive = 4`
   - `lastNotificationDay = 3`
   - ❌ No notification (Day 4 is not handled)
   - Metadata unchanged

5. **If user becomes 7 days inactive:**
   - `daysInactive = 7`
   - `lastNotificationDay = 3` (Day 3 was sent, but Day 7 is different)
   - ✅ Sends Day 7 email (because `lastNotificationDay < 7`)
   - Sets `last_day: 7, day7_sent: true`

## Key Points

- **One cron job** handles all days (1, 2, 3, 7)
- **Day is determined** by `daysInactive` calculation, not by separate jobs
- **Deduplication** works by checking `lastNotificationDay` in metadata
- **Different days** can trigger different notifications (Day 3 then Day 7 is allowed)



