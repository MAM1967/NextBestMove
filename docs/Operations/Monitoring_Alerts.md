# Monitoring Alerts Configuration

**Date:** January 3, 2026  
**Status:** ✅ Configured  
**Monitoring Service:** GlitchTip (Sentry-compatible)

## Overview

This document describes the monitoring alerts configured for NextBestMove. Alerts are managed through GlitchTip (Sentry-compatible error tracking) and are designed to notify the team of critical issues without causing alert fatigue.

---

## Alert Philosophy

**Conservative Thresholds:** Alerts are configured with conservative thresholds to prevent alert fatigue. We prioritize actionable alerts over noise.

**Fail-Safe Design:** All logging and alerting is designed to fail gracefully. If GlitchTip is unavailable, the application continues to function normally.

---

## Configured Alerts

### 1. Error Rate Alert

**Purpose:** Detect spikes in application errors

**Configuration:**
- **Trigger:** >50 errors/hour (not 10 - prevents alert fatigue)
- **Window:** 1 hour rolling window
- **Tags:** `error_type: application_error`
- **Notification:** Email to team

**Rationale:**
- 50 errors/hour is a significant spike that indicates a real problem
- Lower thresholds (e.g., 10/hour) would trigger during normal development/debugging
- Focuses on production issues, not development noise

**How to Adjust:**
1. Log into GlitchTip dashboard
2. Navigate to Alerts → Error Rate Alert
3. Adjust threshold as needed
4. Consider environment (staging vs production) when setting thresholds

---

### 2. Webhook Failure Alert

**Purpose:** Detect Stripe webhook processing failures

**Configuration:**
- **Trigger:** Any error with tag `error_type: webhook_error`
- **Window:** Immediate (no aggregation)
- **Tags:** `error_type: webhook_error`, `component: webhook`
- **Notification:** Email to team + Slack (if configured)

**Rationale:**
- Webhook failures are critical - they affect billing and subscription status
- Immediate alerts ensure quick response to payment issues
- No threshold needed - any webhook error is worth investigating

**How to Adjust:**
1. Log into GlitchTip dashboard
2. Navigate to Alerts → Webhook Failure Alert
3. Adjust notification channels as needed

**Code Integration:**
- Webhook errors are automatically tagged via `logWebhookEvent()` in `web/src/lib/utils/logger.ts`
- Errors are sent to GlitchTip with `error_type: webhook_error` tag

---

### 3. Cron Job Failure Alert

**Purpose:** Detect background job failures

**Configuration:**
- **Trigger:** Any error with tag `error_type: cron_job_error`
- **Window:** Immediate (no aggregation)
- **Tags:** `error_type: cron_job_error`, `component: cron`
- **Notification:** Email to team

**Rationale:**
- Cron jobs are critical for daily operations (plan generation, summaries, etc.)
- Immediate alerts ensure background jobs are monitored
- No threshold needed - any cron job error is worth investigating

**How to Adjust:**
1. Log into GlitchTip dashboard
2. Navigate to Alerts → Cron Job Failure Alert
3. Adjust notification channels as needed

**Code Integration:**
- Cron job errors are automatically tagged via `logCronEvent()` in `web/src/lib/utils/logger.ts`
- Errors are sent to GlitchTip with `error_type: cron_job_error` tag

---

### 4. Database Connection Failure Alert

**Purpose:** Detect database connectivity issues

**Configuration:**
- **Trigger:** Any error with tag `error_type: database_error`
- **Window:** Immediate (no aggregation)
- **Tags:** `error_type: database_error`, `component: database`
- **Notification:** Email to team + PagerDuty (if configured)

**Rationale:**
- Database failures are critical - they affect all application functionality
- Immediate alerts ensure quick response to infrastructure issues
- No threshold needed - any database error is worth investigating

**How to Adjust:**
1. Log into GlitchTip dashboard
2. Navigate to Alerts → Database Error Alert
3. Adjust notification channels as needed

**Code Integration:**
- Database errors are automatically tagged via `logDatabaseError()` in `web/src/lib/utils/logger.ts`
- Errors are sent to GlitchTip with `error_type: database_error` tag

---

## Alert Recipients

**Primary Recipients:**
- Engineering team email list
- On-call engineer (if rotation configured)

**Notification Channels:**
- Email (primary)
- Slack (optional, if configured)
- PagerDuty (optional, for critical alerts)

**How to Update Recipients:**
1. Log into GlitchTip dashboard
2. Navigate to Settings → Teams & Members
3. Add/remove team members
4. Configure notification preferences per team member

---

## Alert Thresholds Rationale

### Why 50 Errors/Hour (Not 10)?

**Reasoning:**
- **Development Environment:** During development and debugging, error rates can spike temporarily. A threshold of 10/hour would trigger false positives.
- **Normal Operations:** Some errors are expected (e.g., user input validation errors, rate limiting). A threshold of 50/hour filters out normal operational noise.
- **Real Issues:** 50 errors/hour indicates a systemic problem that requires investigation.

**When to Lower Threshold:**
- If you notice legitimate issues are being missed
- After establishing baseline error rates in production
- For specific error types that are always critical

**When to Raise Threshold:**
- If alerts are too noisy and causing alert fatigue
- If false positives are common
- If team is being overwhelmed by non-critical alerts

---

## Testing Alerts

### How to Test Alerts

1. **Trigger Test Alert:**
   ```typescript
   // In any API route or cron job
   import { logError } from "@/lib/utils/logger";
   
   logError("Test alert - please ignore", new Error("Test error"), {
     test: true,
   });
   ```

2. **Verify Alert Delivery:**
   - Check email inbox for alert notification
   - Verify alert appears in GlitchTip dashboard
   - Confirm alert has correct tags and context

3. **Test Webhook Alert:**
   ```typescript
   import { logWebhookEvent } from "@/lib/utils/logger";
   
   logWebhookEvent("Test webhook error", {
     status: "error",
     webhookType: "stripe",
     eventId: "test-event",
   });
   ```

4. **Test Cron Job Alert:**
   ```typescript
   import { logCronEvent } from "@/lib/utils/logger";
   
   logCronEvent("Test cron job error", {
     status: "error",
     cronJobName: "test-job",
     error: new Error("Test error"),
   });
   ```

---

## Monitoring Best Practices

### 1. Regular Review

**Weekly:**
- Review error trends in GlitchTip dashboard
- Check for recurring errors that might need fixes
- Verify alert thresholds are appropriate

**Monthly:**
- Analyze error patterns and trends
- Adjust thresholds based on actual error rates
- Review and update alert recipients

### 2. Alert Response

**When Alert Triggers:**
1. **Acknowledge:** Confirm receipt of alert
2. **Investigate:** Check GlitchTip dashboard for error details
3. **Assess:** Determine severity and impact
4. **Respond:** Fix issue or escalate as needed
5. **Document:** Update runbook if new issue type

### 3. Alert Fatigue Prevention

**Signs of Alert Fatigue:**
- Team members ignoring alerts
- Too many false positives
- Alerts for non-critical issues

**Solutions:**
- Increase thresholds for non-critical alerts
- Use alert grouping/aggregation
- Review and remove unnecessary alerts
- Use different severity levels (warning vs error)

---

## GlitchTip Configuration

### Accessing GlitchTip

- **Dashboard URL:** [Configure in environment variables]
- **DSN:** Set via `NEXT_PUBLIC_GLITCHTIP_DSN` environment variable

### Setting Up Alerts

1. **Log into GlitchTip Dashboard**
2. **Navigate to:** Alerts → Create Alert
3. **Configure Alert:**
   - **Name:** Descriptive name (e.g., "Error Rate > 50/hour")
   - **Conditions:** Set trigger conditions (error count, tags, etc.)
   - **Actions:** Configure notifications (email, Slack, etc.)
   - **Filters:** Add tag filters (e.g., `error_type: webhook_error`)

### Alert Conditions

**Error Rate Alert:**
```
Condition: Error count > 50
Window: 1 hour
Filter: error_type: application_error
```

**Webhook Failure Alert:**
```
Condition: Error count > 0
Window: Immediate
Filter: error_type: webhook_error
```

**Cron Job Failure Alert:**
```
Condition: Error count > 0
Window: Immediate
Filter: error_type: cron_job_error
```

**Database Error Alert:**
```
Condition: Error count > 0
Window: Immediate
Filter: error_type: database_error
```

---

## Code Integration

### Logger Functions

All monitoring is integrated through the centralized logger (`web/src/lib/utils/logger.ts`):

- `logError()` - General application errors
- `logWebhookEvent()` - Webhook-specific errors (auto-tagged)
- `logCronEvent()` - Cron job errors (auto-tagged)
- `logDatabaseError()` - Database errors (auto-tagged)

### Tagging Strategy

Errors are automatically tagged based on their source:
- `error_type: application_error` - General application errors
- `error_type: webhook_error` - Webhook processing errors
- `error_type: cron_job_error` - Cron job errors
- `error_type: database_error` - Database connection errors
- `component: webhook` - Webhook component
- `component: cron` - Cron component
- `component: database` - Database component

---

## Troubleshooting

### Alerts Not Firing

**Check:**
1. GlitchTip DSN is correctly configured
2. Errors are being sent to GlitchTip (check dashboard)
3. Alert conditions are correctly configured
4. Notification channels are properly set up

### Too Many Alerts

**Solutions:**
1. Increase alert thresholds
2. Add filters to exclude non-critical errors
3. Use alert grouping/aggregation
4. Review and adjust alert conditions

### Missing Alerts

**Check:**
1. Error tags are correct in code
2. Alert filters match error tags
3. GlitchTip is receiving errors (check dashboard)
4. Notification channels are working

---

## Future Improvements

### Potential Enhancements

1. **Performance Monitoring:**
   - Add alerts for slow API endpoints (>1s response time)
   - Monitor database query performance
   - Track daily plan generation time

2. **Business Metrics:**
   - Alert on subscription conversion rate drops
   - Monitor daily plan generation success rate
   - Track weekly summary generation failures

3. **Infrastructure:**
   - Health check endpoint monitoring
   - Vercel deployment failure alerts
   - Supabase connection pool alerts

---

## References

- **GlitchTip Documentation:** [GlitchTip Docs](https://glitchtip.com/documentation)
- **Sentry-Compatible API:** GlitchTip uses Sentry-compatible API
- **Logger Implementation:** `web/src/lib/utils/logger.ts`
- **Health Check Endpoint:** `/api/health`

---

**Last Updated:** January 3, 2026  
**Maintained By:** Engineering Team

