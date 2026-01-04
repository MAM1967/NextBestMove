# Pre-Launch Readiness Workstream Prompts

**Purpose:** These prompts provide AI engineers with complete context and specific instructions for implementing pre-launch readiness improvements.

**Target Launch Date:** January 13, 2026  
**Timeline:** 5-7 days  
**Team Size:** 3+ engineers working in parallel

---

## Workstream 1: Security & Monitoring Engineer Prompt

### Context Reading (Required Before Starting)

**Read these files in order:**

1. **Project Overview:**

   - `nextbestmove_cursor_guide.md` - Complete project context, architecture, deployment procedures
   - `docs/PRD/NextBestMove_PRD_v1.md` - Product requirements and core features
   - `docs/Pre_Launch_Readiness_Report.md` - Full readiness audit (focus on Security & Vulnerability section)

2. **Architecture & Security:**

   - `docs/Architecture/Database_Schema.md` - Database structure and RLS policies
   - `web/src/middleware.ts` - Current middleware implementation
   - `web/src/lib/utils/logger.ts` - Current logging infrastructure
   - `web/src/app/api/billing/webhook/route.ts` - Webhook security implementation (reference)

3. **Implementation Plan:**

   - `.cursor/plans/pre-launch_readiness_address_blockers_&_reach_8+_10_b717e679.plan.md` - Full plan (focus on Workstream 1)

4. **Safety & Standards:**
   - `docs/decisions.md` - Development standards and Definition of Done
   - `DEPLOYMENT_CHECKLIST.md` - Deployment procedures

### Your Mission

You are responsible for **Workstream 1: Security & Monitoring**. Your goal is to implement all security and monitoring improvements to raise the Security & Vulnerability score from 8.5 to 9.0.

### Tasks (In Priority Order)

#### Task 1: B-1 - Application-level Rate Limiting (NEX-62) - 3 hours

**Status:** 🔴 BLOCKER - Must complete before launch

**What to do:**

1. Install dependencies: `@upstash/ratelimit` and `@upstash/redis` (or use Vercel Edge Config)
2. Create `web/src/lib/middleware/rate-limit.ts` with:

   - Feature flag: `ENABLE_RATE_LIMITING` (default: false)
   - Per-IP rate limiting for public endpoints
   - Per-user rate limiting for authenticated endpoints
   - Generous initial limits (10x expected):
     - Auth endpoints: 50 req/min
     - API endpoints: 600 req/min
     - Daily plan generation: 10 req/hour
   - Whitelist critical endpoints: `/api/billing/webhook`, `/api/health`, `/api/cron/*`
   - Return 429 with Retry-After header on limit exceeded
   - Log all rate limit hits for analysis

3. Update `web/src/middleware.ts`:
   - Add rate limiting check (returns null if disabled or whitelisted)
   - Apply rate limiting before other middleware
   - Ensure webhooks, health checks, and cron jobs are never rate limited

**Safety Requirements:**

- Feature flag MUST default to `false` in production
- Test extensively on staging before enabling
- Monitor error rates after enabling
- Can disable instantly via environment variable

**Testing:**

- Test in staging with realistic traffic patterns
- Verify legitimate users not blocked
- Verify webhooks/health/cron not rate limited
- Test rollback (disable feature flag)

**Files to Create/Modify:**

- `web/src/lib/middleware/rate-limit.ts` (new)
- `web/src/middleware.ts` (modify)
- `web/package.json` (add dependencies)

---

#### Task 2: B-2 - Environment Variable Audit (NEX-63) - 1.5 hours

**Status:** 🔴 BLOCKER - Must complete before launch

**What to do:**

1. Scan codebase for all `NEXT_PUBLIC_*` variables:
   ```bash
   grep -r "NEXT_PUBLIC_" web/src
   ```
2. Verify no secrets in client-side code:
   - Check each `NEXT_PUBLIC_*` variable usage
   - Ensure no API keys, secrets, or sensitive data
   - Document any concerns
3. Document all environment variables:
   - Create `docs/Environment_Variables_Audit.md`
   - List each variable, its scope (client/server), and purpose
   - Update `.env.example` with documentation

**Deliverables:**

- `docs/Environment_Variables_Audit.md` with complete list
- Updated `.env.example` with documentation
- Verification that no secrets are exposed

---

#### Task 3: B-3 - Health Check Endpoint (NEX-64) - 2 hours

**Status:** 🔴 BLOCKER - Must complete before launch

**What to do:**

1. Create `web/src/app/api/health/route.ts`:

   ```typescript
   GET /api/health
   Response: {
     status: "healthy" | "degraded" | "unhealthy",
     checks: {
       database: { status: "ok" | "error", responseTime: number },
       stripe: { status: "ok" | "error", responseTime: number },
       env: { status: "ok" | "error", missingVars: string[] }
     },
     timestamp: string
   }
   ```

2. Implement checks (all wrapped in try-catch):
   - Database: Simple SELECT 1 query (fast ping)
   - Stripe: Test API key with minimal read-only call
   - Environment: Check critical variables synchronously
   - Track response time for each check

**Safety Requirements:**

- Lightweight implementation (<100ms target)
- Non-blocking checks (individual failures don't break endpoint)
- Read-only operations only
- Return "degraded" if any check fails, not "unhealthy"

**Testing:**

- Verify doesn't impact other endpoints
- Test with database down (should return degraded)
- Test with Stripe API down (should return degraded)
- Load test to ensure no performance degradation

---

#### Task 4: B-4 - Automated Monitoring Alerts (NEX-65) - 5 hours

**Status:** 🔴 BLOCKER - Must complete before launch

**What to do:**

1. Configure GlitchTip alerts (conservative thresholds):

   - Error rate: >50 errors/hour (not 10 - prevent alert fatigue)
   - Webhook failures: Alert on any webhook error
   - Cron job failures: Alert on cron job errors
   - Database connection failures: Alert on connection errors

2. Enhance `web/src/lib/utils/logger.ts`:

   - Add alert threshold tracking
   - Add webhook-specific error tracking
   - Add cron job error tracking
   - Ensure failures don't break app (fail gracefully)

3. Create `docs/Operations/Monitoring_Alerts.md`:
   - Document all alerts configured
   - Document alert thresholds and rationale
   - Document how to adjust thresholds
   - Document alert recipients

**Safety Requirements:**

- Conservative thresholds initially
- Non-blocking implementation
- Fail gracefully if GlitchTip unavailable
- Test alerts before production

**Testing:**

- Trigger test alerts to verify delivery
- Verify alert recipients correct
- Test alert thresholds

---

#### Task 5: H-1 - CORS Configuration (NEX-71) - 1 hour

**Status:** 🟠 HIGH PRIORITY - Fix within first week

**What to do:**

1. Create `web/src/lib/middleware/cors.ts`:

   - Feature flag: `ENABLE_CORS_RESTRICTION` (default: false)
   - Default to allowing all origins (backward compatible)
   - Only restrict if explicitly configured
   - Whitelist production + staging domains

2. Apply to middleware:
   - Check origin header
   - Apply CORS headers based on configuration
   - Handle OPTIONS preflight requests

**Safety Requirements:**

- Preserve existing behavior if not configured
- Default to allowing all (maintains backward compatibility)
- Test all frontend API calls still work

**Testing:**

- Test all API calls from frontend
- Verify preflight requests work
- Test from different origins

---

### Success Criteria

- [ ] Rate limiting implemented with feature flag (disabled by default)
- [ ] Environment variables audited and documented
- [ ] Health check endpoint returns proper status
- [ ] Monitoring alerts configured and tested
- [ ] CORS configured with safe defaults
- [ ] All changes tested on staging
- [ ] All safety measures implemented
- [ ] Documentation completed

### Important Notes

- **NEVER enable features in production without staging testing**
- **ALWAYS use feature flags for risky changes**
- **ALWAYS test rollback procedures**
- **ALWAYS preserve existing behavior when possible**
- **Follow staging-first deployment strategy**

### Questions?

- Reference: `docs/Pre_Launch_Readiness_Report.md`
- Plan: `.cursor/plans/pre-launch_readiness_address_blockers_&_reach_8+_10_b717e679.plan.md`
- Linear tickets: NEX-62, NEX-63, NEX-64, NEX-65, NEX-71

---

## Workstream 2: Operations & Critical Path Engineer Prompt

### Context Reading (Required Before Starting)

**Read these files in order:**

1. **Project Overview:**

   - `nextbestmove_cursor_guide.md` - Complete project context, architecture, deployment procedures
   - `docs/PRD/NextBestMove_PRD_v1.md` - Product requirements (focus on onboarding flow, Section 13)
   - `docs/Pre_Launch_Readiness_Report.md` - Full readiness audit (focus on Critical Path Analysis and Production Readiness sections)

2. **Operations & Deployment:**

   - `DEPLOYMENT_CHECKLIST.md` - Current deployment procedures
   - `scripts/deploy-staging.sh` - Staging deployment script
   - `scripts/deploy-production.sh` - Production deployment script
   - `docs/Cron_Job_Configuration.md` - Cron job setup

3. **Critical Paths:**

   - `web/src/app/app/page.tsx` - Today page (onboarding redirect logic)
   - `web/src/app/api/daily-plans/generate/route.ts` - Daily plan generation
   - `web/src/app/api/billing/webhook/route.ts` - Webhook implementation (reference)
   - `web/src/app/onboarding/page.tsx` - Onboarding flow (if exists)

4. **Implementation Plan:**

   - `.cursor/plans/pre-launch_readiness_address_blockers_&_reach_8+_10_b717e679.plan.md` - Full plan (focus on Workstream 2)

5. **Safety & Standards:**
   - `docs/decisions.md` - Development standards and Definition of Done

### Your Mission

You are responsible for **Workstream 2: Operations & Critical Path**. Your goal is to:

- Improve Production Readiness score from 6.5 to 8.0
- Improve Critical Path Analysis score from 7.5 to 8.0

### Tasks (In Priority Order)

#### Task 1: B-5 - Rollback Procedures Documentation (NEX-66) - 2 hours

**Status:** 🔴 BLOCKER - Must complete before launch

**What to do:**

1. Document Vercel rollback procedures:

   - How to rollback deployment via Vercel dashboard
   - How to rollback via CLI (`vercel rollback`)
   - How to identify which deployment to rollback to
   - When to rollback (error rates, user reports, etc.)

2. Document database migration rollback:

   - When migrations can be rolled back
   - How to create rollback scripts for critical migrations
   - Procedure for rolling back migrations
   - Which migrations are safe to rollback

3. Document environment variable rollback:

   - How to revert via Doppler
   - How to revert via Vercel dashboard
   - How to identify which env var change caused issues

4. Create `docs/Operations/Rollback_Procedures.md`:
   - Step-by-step procedures for each rollback type
   - Decision tree for when to rollback
   - Testing procedures after rollback
   - Communication procedures

**Deliverables:**

- Complete rollback procedures document
- Test rollback procedures on staging
- Document any limitations or gotchas

---

#### Task 2: B-6 - Database Backup Verification (NEX-67) - 3 hours

**Status:** 🔴 BLOCKER - Must complete before launch

**What to do:**

1. Verify Supabase backup settings:

   - Log into Supabase dashboard
   - Check backup frequency (should be daily)
   - Verify retention policy (should be at least 7 days)
   - Document backup schedule
   - Check backup storage location

2. Test restore procedure:

   - Create test restore from backup (use staging database)
   - Verify data integrity after restore:
     - Check user count matches
     - Check critical tables have data
     - Verify relationships between tables
   - Document time taken for restore
   - Document steps in `docs/Operations/Backup_Restore_Procedures.md`

3. Set up backup monitoring:
   - Add alert if backups fail (check Supabase dashboard alerts)
   - Document verification process
   - Create checklist for monthly backup verification

**Deliverables:**

- Backup settings documented
- Restore procedure tested and documented
- Backup monitoring configured

**Important:** Use staging database for restore testing, never production.

---

#### Task 3: B-7 - Onboarding Error Handling (NEX-68) - 2.5 hours

**Status:** 🔴 BLOCKER - Must complete before launch

**What to do:**

1. Review current onboarding flow:

   - Read `web/src/app/app/page.tsx` (onboarding redirect logic)
   - Read `web/src/app/api/daily-plans/generate/route.ts` (plan generation)
   - Understand current error handling (or lack thereof)

2. Add error handling for plan generation failures:

   ```typescript
   // In web/src/app/api/daily-plans/generate/route.ts
   try {
     const plan = await generateDailyPlanForUser(...);
     return NextResponse.json({ success: true, plan });
   } catch (error) {
     logError("Plan generation failed", error, { userId });
     // Return graceful error - status 200 with error flag
     return NextResponse.json({
       success: false,
       error: "Could not generate plan. You can continue without it.",
       allowContinue: true,
     }, { status: 200 });
   }
   ```

3. Update frontend to handle errors gracefully:

   - In `web/src/app/app/page.tsx` or onboarding page:
     - Check for `success: false` in response
     - Show user-friendly warning message
     - Allow user to continue to next step
     - Provide "Retry" option

4. Add fallback for calendar connection failures:
   - Wrap calendar connection in try-catch
   - Show warning but don't block progression
   - Provide "Skip for now" option in UI
   - Log for monitoring

**Safety Requirements:**

- Only add error handling, don't change happy path
- Preserve existing behavior for success cases
- Graceful degradation (users can continue even if plan fails)
- Test error scenarios don't break flows

**Testing:**

- Test database connection failure (mock Supabase error)
- Test calendar API failure (mock calendar error)
- Test plan generation timeout
- Verify users can still complete onboarding

**Files to Modify:**

- `web/src/app/app/page.tsx`
- `web/src/app/api/daily-plans/generate/route.ts`
- `web/src/app/onboarding/page.tsx` (if exists)

---

#### Task 4: B-8 - Webhook Failure Recovery (NEX-69) - 2.5 hours

**Status:** 🔴 BLOCKER - Must complete before launch

**What to do:**

1. Review current webhook implementation:

   - Read `web/src/app/api/billing/webhook/route.ts`
   - Understand idempotency handling (already implemented)
   - Understand error handling

2. Document manual webhook retry process:

   - How to identify failed webhooks in Stripe dashboard
   - How to manually trigger webhook replay in Stripe
   - How to verify webhook processed correctly:
     - Check `billing_events` table for event ID
     - Check `billing_subscriptions` table for status updates
     - Check user tier in `users` table
   - Create `docs/Operations/Webhook_Recovery_Procedures.md`

3. Add webhook status monitoring:

   - Track webhook processing time (add timing logs)
   - Alert on webhook failures (integrate with B-4 alerts)
   - Add webhook status dashboard query:
     ```sql
     -- Query to check recent webhook processing
     SELECT stripe_event_id, type, processed_at, created_at
     FROM billing_events
     WHERE created_at > NOW() - INTERVAL '24 hours'
     ORDER BY created_at DESC;
     ```

4. Create webhook recovery script (optional):
   - Script to manually process missed webhooks
   - Verify idempotency handling works
   - Test on staging first

**Files to Modify:**

- `web/src/app/api/billing/webhook/route.ts` (add monitoring)
- `docs/Operations/Webhook_Recovery_Procedures.md` (new)

---

### Success Criteria

- [ ] Rollback procedures documented and tested
- [ ] Database backup verified and restore tested
- [ ] Onboarding error handling improved (users can continue on failures)
- [ ] Webhook failure recovery documented
- [ ] All documentation completed
- [ ] All changes tested on staging
- [ ] All safety measures implemented

### Important Notes

- **NEVER test restore on production database**
- **ALWAYS preserve existing happy path behavior**
- **ALWAYS test error scenarios**
- **ALWAYS document procedures clearly**
- **Follow staging-first deployment strategy**

### Questions?

- Reference: `docs/Pre_Launch_Readiness_Report.md`
- Plan: `.cursor/plans/pre-launch_readiness_address_blockers_&_reach_8+_10_b717e679.plan.md`
- Linear tickets: NEX-66, NEX-67, NEX-68, NEX-69

---

## Workstream 3: Performance & Testing Engineer Prompt

### Context Reading (Required Before Starting)

**Read these files in order:**

1. **Project Overview:**

   - `nextbestmove_cursor_guide.md` - Complete project context, architecture, performance targets
   - `docs/PRD/NextBestMove_PRD_v1.md` - Product requirements (focus on performance targets, Section 17)
   - `docs/Pre_Launch_Readiness_Report.md` - Full readiness audit (focus on Performance & Scale section)

2. **Performance & Database:**

   - `docs/Architecture/Database_Schema.md` - Database structure and indexes
   - `web/src/lib/plans/generate-daily-plan.ts` - Daily plan generation logic
   - `web/src/app/api/cron/weekly-summaries/route.ts` - Weekly summary generation
   - `web/src/app/api/decision-engine/best-action/route.ts` - Decision engine queries

3. **Testing Infrastructure:**

   - `web/vitest.config.ts` - Test configuration
   - `web/tests/` - Existing test structure
   - `web/package.json` - Test scripts

4. **Implementation Plan:**

   - `.cursor/plans/pre-launch_readiness_address_blockers_&_reach_8+_10_b717e679.plan.md` - Full plan (focus on Workstream 3)

5. **Safety & Standards:**
   - `docs/decisions.md` - Development standards and Definition of Done

### Your Mission

You are responsible for **Workstream 3: Performance & Testing**. Your goal is to:

- Improve Performance & Scale score from 6.0 to 8.0
- Improve Code Health score from 7.0 to 8.0

### Tasks (In Priority Order)

#### Task 1: B-9 - Load Testing (NEX-70) - 5 hours

**Status:** 🔴 BLOCKER - Must complete before launch

**What to do:**

1. Set up load testing tool:

   - Choose tool: k6 (recommended), Artillery, or similar
   - Install and configure
   - Create test scripts for:
     - Daily plan generation (100 concurrent users)
     - Action state changes (200 concurrent)
     - Weekly summary generation (50 concurrent)

2. Create test scenarios:

   ```javascript
   // Example k6 script structure
   import http from 'k6/http';
   import { check } from 'k6';

   export const options = {
     stages: [
       { duration: '1m', target: 10 },   // Ramp up
       { duration: '2m', target: 50 },  // Stay at 50
       { duration: '1m', target: 100 },  // Peak
       { duration: '1m', target: 0 },    // Ramp down
     ],
   };

   export default function() {
     // Test daily plan generation
     const res = http.post('https://staging.nextbestmove.app/api/daily-plans/generate', ...);
     check(res, { 'status is 200': (r) => r.status === 200 });
   }
   ```

3. Run baseline tests on staging:

   - Measure response times under load
   - Identify bottlenecks:
     - Database query times
     - API response times
     - Error rates
   - Document results in `docs/Testing/Load_Test_Results.md`

4. Optimize based on findings:
   - Database query optimization (if needed)
   - Caching where needed
   - Connection pooling adjustments

**Safety Requirements:**

- Use staging environment ONLY (never production)
- Coordinate testing windows
- Gradual ramp-up (start with 10 users, increase gradually)
- Stop if errors spike or resource limits approached
- Monitor database CPU/memory during tests

**Deliverables:**

- Load testing scripts
- Test results document
- Optimization recommendations
- Performance baseline established

---

#### Task 2: H-2 - Database Query Performance Analysis (NEX-72) - 5 hours

**Status:** 🟠 HIGH PRIORITY - Fix within first week

**What to do:**

1. Identify critical queries:

   - Daily plan generation queries (in `generate-daily-plan.ts`)
   - Decision engine queries (best action selection)
   - Weekly summary aggregation queries
   - Actions filtering queries

2. Run `EXPLAIN ANALYZE` on each critical query:

   ```sql
   EXPLAIN ANALYZE
   SELECT ... -- Your query here
   ```

   - Document execution plan
   - Identify slow operations (Seq Scan, expensive joins)
   - Note query execution time

3. Create `docs/Performance/Critical_Queries_Analysis.md`:

   - Document each query analyzed
   - Document execution time
   - Document slow queries (>500ms)
   - Document optimization opportunities:
     - Missing indexes
     - Unnecessary joins
     - Inefficient WHERE clauses
     - N+1 query patterns

4. Add query timing logs:

   - Enhance `web/src/lib/utils/logger.ts` with query timing
   - Log slow queries (>500ms) automatically
   - Add query timing to response headers in dev mode

5. Optimize identified slow queries:
   - Add missing indexes (use `CREATE INDEX CONCURRENTLY`)
   - Refactor complex queries
   - Add query result caching where appropriate
   - Create migration for new indexes

**Safety Requirements:**

- Read-only analysis first (EXPLAIN ANALYZE is safe)
- Add indexes during low-traffic periods
- Use `CREATE INDEX CONCURRENTLY` to avoid locks
- Test on staging first
- Use feature flags for query switching if needed

**Deliverables:**

- Query analysis document
- Query timing logs implemented
- Optimized queries (if needed)
- Database migration for indexes (if needed)

---

#### Task 3: H-3 - API Response Time Monitoring (NEX-73) - 2 hours

**Status:** 🟠 HIGH PRIORITY - Fix within first week

**What to do:**

1. Create `web/src/lib/middleware/response-time.ts`:

   ```typescript
   export function withResponseTime(handler: Function) {
     return async (request: Request) => {
       const start = Date.now();
       const response = await handler(request);
       const duration = Date.now() - start;

       // Log response time
       logInfo(`API ${request.url} took ${duration}ms`);

       // Add to response headers (dev mode only)
       if (process.env.NODE_ENV === "development") {
         response.headers.set("X-Response-Time", `${duration}ms`);
       }

       return response;
     };
   }
   ```

2. Apply to API routes:

   - Wrap critical API routes with response time tracking
   - Track p50, p95, p99 response times
   - Log slow requests (>1s)

3. Set up performance dashboard:

   - Use Vercel Analytics (if available)
   - Or create custom performance monitoring endpoint
   - Track metrics over time

4. Add alerting:
   - Alert on slow endpoints (>1s p95)
   - Integrate with monitoring alerts (B-4)

**Deliverables:**

- Response time middleware
- Performance metrics logging
- Performance dashboard/endpoint
- Alerting for slow endpoints

---

#### Task 4: M-3 - Critical Path Test Coverage (NEX-76) - 4 hours

**Status:** 🟡 MEDIUM PRIORITY - Address in first month

**What to do:**

1. Review existing test infrastructure:

   - Read `web/vitest.config.ts`
   - Review existing tests in `web/tests/`
   - Understand test patterns used

2. Add unit tests for critical functions:

   - `web/src/lib/billing/webhook-handlers.ts`:
     - Test webhook processing logic
     - Test idempotency handling
     - Test error handling
   - `web/src/lib/plans/generate-daily-plan.ts`:
     - Test plan generation logic
     - Test capacity calculation
     - Test Fast Win selection
   - `web/src/lib/billing/tier.ts`:
     - Test tier calculation logic
     - Test upgrade/downgrade logic

3. Target: 60%+ coverage for critical billing and plan generation code

4. Use existing test infrastructure (Vitest)

**Deliverables:**

- Unit tests for critical functions
- Test coverage report showing >60% for critical paths
- Tests passing in CI

---

### Success Criteria

- [ ] Load testing completed with results documented
- [ ] Critical queries analyzed and optimized
- [ ] Response time monitoring implemented
- [ ] Test coverage >60% for critical paths
- [ ] All optimizations tested on staging
- [ ] Performance baseline established
- [ ] All documentation completed

### Important Notes

- **NEVER load test production environment**
- **ALWAYS use staging for performance testing**
- **ALWAYS test query optimizations on staging first**
- **ALWAYS use `CREATE INDEX CONCURRENTLY` for indexes**
- **ALWAYS document performance improvements**

### Questions?

- Reference: `docs/Pre_Launch_Readiness_Report.md`
- Plan: `.cursor/plans/pre-launch_readiness_address_blockers_&_reach_8+_10_b717e679.plan.md`
- Linear tickets: NEX-70, NEX-72, NEX-73, NEX-76

---

## General Instructions for All Engineers

### Before Starting Work

1. **Read the context files** listed in your workstream prompt
2. **Understand the safety measures** - They are non-negotiable
3. **Review the Linear ticket** for your task
4. **Check the implementation plan** for detailed steps

### Development Workflow

1. **Create feature branch:**

   ```bash
   git checkout -b nex-XX-task-name
   ```

2. **Implement with safety measures:**

   - Use feature flags where specified
   - Preserve existing behavior
   - Add comprehensive error handling
   - Add logging for monitoring

3. **Test thoroughly:**

   - Unit tests for new code
   - Integration tests for critical paths
   - Manual testing on staging
   - Verify rollback works

4. **Deploy to staging:**

   ```bash
   ./scripts/deploy-staging.sh "NEX-XX: Description"
   ```

5. **Monitor staging:**

   - Watch for errors
   - Monitor performance
   - Verify functionality
   - Wait 24-48 hours before production

6. **Update documentation:**
   - Update relevant docs
   - Update backlog with Linear ticket ID
   - Document any gotchas

### Safety Checklist (Before Each Deployment)

- [ ] Feature flag created (if risky change)
- [ ] Feature flag defaults to disabled
- [ ] Code reviewed (self-review acceptable)
- [ ] Unit tests written and passing
- [ ] Manual testing completed on staging
- [ ] Rollback procedure documented
- [ ] Monitoring/alerting configured
- [ ] No breaking changes

### Communication

- Update Linear ticket with progress
- Comment on any blockers
- Document decisions in ticket
- Link to PR when ready

### Questions or Blockers?

- Check the plan document first
- Check the readiness report
- Ask in Linear ticket comments
- Reference existing code patterns

---

**Good luck! Let's get this to 8+/10 across the board! 🚀**
