# NextBestMove Backlog

This Markdown backlog mirrors the GitHub-ready stories so we can start executing without ticket overhead.  
Use the checkboxes to track progress (✅ = done, 🔄 = in progress, ⏱ = blocked/to-do).

---

## 0. Final Inputs Needed

- [x] Confirm Stripe pricing (plan name + amount) and launch date ✅  
       _Standard: $29/mo or $249/year | Premium: $79/mo or $649/year | 14-day free trial (no credit card)_
- [ ] Provision Google Cloud + Azure OAuth credentials for calendar access
- [ ] Supabase project + environment variables available (service role, anon key, Stripe secrets)

---

## 🔴 P0 – MVP Must-Haves

### Foundation & Billing

- [ ] **Project initialization & tooling**  
       _Next.js 14 + TypeScript, Tailwind tokens, ESLint/Prettier, React Query, Zustand scaffold_

- [ ] **Supabase schema & migrations**  
       _All core tables (users, leads, actions, plans, summaries, calendar, billing) + enums, RLS, helper functions_

- [x] **Stripe API routes (checkout & portal)** ✅  
       _`POST /api/billing/create-checkout-session` (support Standard/Premium plans, monthly/annual), `POST /api/billing/customer-portal`, env wiring. Support 14-day trial creation via Stripe API (no credit card required, `trial_period_days: 14`)_

- [x] **Stripe webhook + subscription sync** ✅  
       _Verify signature, store events, upsert `billing_customers` / `billing_subscriptions`, update session status. Handle trial expiration (via `customer.subscription.updated` when trial ends), payment failures, cancellations, and plan upgrades/downgrades. Stripe automatically manages trial status transitions_

- [x] **Supabase Auth pages & profile bootstrap** ✅  
       _Sign up / sign in, default timezone + streak info stored on user record_

- [x] **Paywall middleware & base overlay** ✅  
       _Read-only mode when subscription inactive, PaywallOverlay renders on gated pages. Support 14-day trial (full access), 7-day read-only grace period, and plan-based feature gating (Standard vs Premium). PaywallOverlay component created, subscription status checking implemented, plan page protected_

### Leads & Actions

- [x] **Lead management UI + API** ✅  
       _Lead CRUD endpoints, filters (All/Active/Snoozed/Archived), Add/Edit modals, Snooze/Archive/Restore_

- [x] **Action engine core** ✅  
       _Action card component, Done/Got reply/Snooze handlers, FollowUpFlowModal + scheduling defaults_

### Daily Plan

- [x] **Plan generation service** ✅  
       _Capacity calculation, Fast Win selection, priority scoring, `daily_plan_actions` writes_

- [x] **Daily Plan page UI** ✅  
       _Header, focus card, progress indicator, Fast Win card, action list, empty state_

- [x] **Make action priority ranking obvious to users** ✅  
       _Priority scoring works but ordering logic is not clear. Add visual indicators (priority badges, urgency indicators), tooltips explaining why actions are prioritized, or sorting options. Users should understand why actions appear in the order they do._

- [x] **Stale actions insight & algorithm v2** ✅  
       _Surface actions older than 7 days that remain in NEW state (not snoozed). Provide insight/report UI, and update plan-generation algorithm documentation to "v2" once implemented._

### Calendar Integration

- [x] **Google & Outlook OAuth flows** ✅  
       _Connect/disconnect endpoints, token storage, error handling, optional skip_

- [x] **Free/busy API + status indicators** ✅  
       _Cached free/busy fetch, fallback to default capacity, Settings status block, disconnect action_

- [x] **Customizable working hours (onboarding preference)** ✅  
       _Allow users to set their working hours (e.g., 9-5, 10-6, 8-8) during onboarding. Currently hardcoded to 9 AM - 5 PM. This is a STANDARD feature (not premium) because it's core functionality - the app won't work correctly for many users without it. Similar to timezone - a fundamental configuration setting. Store in `users` table as `work_start_time` and `work_end_time` (TIME type). Update capacity calculation and calendar events filtering to use custom hours. Implemented in onboarding Step 4 and Settings → Account Overview._

### Weekly Summary & Content

- [x] **Weekly summary metrics job** ✅  
       _Aggregate stats, placeholder narrative/insight/content prompts, schedule job. Implemented as cron job via cron-job.org, generates summaries and sends emails if enabled._

- [x] **Weekly Summary page** ✅  
       _Metrics grid, narrative card, insight, focus confirmation, content prompts section_

- [x] **Content prompt generation** ✅  
       _Template + AI fallback for win/insight posts, saved to `content_prompts` table. OpenAI integration with BYOK support for premium users._

- [x] **Copy to clipboard for content prompts** ✅  
       _Add "Copy to clipboard" button for content prompts on Weekly Summary page_

### Onboarding

- [x] **Onboarding flow (8 steps)** ✅  
       _Welcome → add lead → optional calendar → working hours → weekend preference → weekly focus → first plan ready → start 14-day trial (no credit card). No early pricing screens - let rhythm sell the plan. Implemented with localStorage persistence for OAuth redirects, final step changed from "fast win coaching" to "start free trial"._

### Settings & Export

- [x] **Settings page framework** ✅  
       _Sections for calendar, notifications, timezone, content prompts, streak, data export_

- [x] **Billing section UI** ✅  
       _BillingSection component showing plan, status badge, renewal date, manage billing CTA_

- [x] **Data export endpoint** ✅  
       _Download JSON of leads/actions/plans/summaries + button in Settings_

- [x] **Email preferences & account deletion controls** ✅  
       _Email preferences UI with toggles for morning plan, fast win reminder, follow-up alerts, weekly summary. Unsubscribe from all emails option. Account deletion with full data removal and auth.users deletion. High P1 – required to meet compliance expectations._

### Background Jobs & Observability

- [x] **Background jobs** ✅  
       _Daily plan cron, weekly summary cron, auto-unsnooze, auto-archive. Implemented via cron-job.org (4 jobs total). Includes notification cron jobs: morning plan, fast win reminder, follow-up alerts._

- [x] **Observability setup** ✅  
       _GlitchTip for error tracking (Sentry-compatible SDK), Umami for privacy-focused analytics, structured logging utility with GlitchTip integration for billing + webhooks. See `docs/Observability.md` for details._

### Dashboard & Settings Data

- [x] **Dashboard data integration** ✅  
       _Dashboard now fetches and displays user-specific data: today's daily plan, fast win action, regular actions count, progress, streak count, and calendar availability. Removed placeholder tasks table query._

- [x] **Content prompts & streak data in settings** ✅  
       _Settings page now shows count of saved content prompts. Streak count displays correctly from user profile. Content prompts toggle remains disabled (coming soon feature)._

---

## 🟠 P1 – High Value Enhancements

**📋 Execution Plan:** See `docs/Planning/P1_Backlog_Execution_Plan.md` for detailed implementation plan, timeline, and prioritization.

- [x] **Optimize GitHub Actions env sync with change data capture** ✅  
       _Modified GitHub Actions workflow to only sync environment variables that don't already exist in Vercel. Fetches existing variables first using 'vercel env ls', compares with GitHub Secrets, and skips existing ones. Reduces API calls, speeds up execution, and provides clearer logs with sync statistics. See `docs/Environment_Variables_Sync_Optimization_Plan.md` for details._

- [x] **Account overview: Password change & timezone editing** ✅  
       _Allow users to change password and update timezone in Settings → Account overview. Timezone dropdown with common options for travelers/remote workers. Password change requires confirmation._

- [x] **Password reset / Forgot password flow** ✅  
       _Implement "Forgot password?" link on sign-in page, password reset email flow, and reset password page. Use Supabase `resetPasswordForEmail` and `updateUser` APIs. Includes forgot password page, reset password page with token validation, and proper session handling._

- [x] **Notification preferences wiring** ✅ (morning plan, fast win reminder, follow-up alerts, weekly summary)
      _Email templates created, API endpoints implemented, cron jobs configured via cron-job.org. Rate limiting protection added. DMARC configured for improved deliverability._
- [x] **Paywall analytics & copy polish** ✅ (trial/past-due variants, event tracking. Completed and tested - all variants implemented with analytics tracking.)
- [x] **Past-due & cancellation banners** ✅ (dashboard alerts with billing portal CTA. Completed - BillingAlertBanner component created and integrated into dashboard.)
- [x] **Adaptive recovery & celebration flows** ✅ (low completion micro-plan, 7+ day comeback, high completion boost. Completed and tested - all Group 3 tests passed: low completion detection, 7+ day inactivity comeback plan, high completion streak boost, celebration banner, Day 2-6 micro mode auto-enable, Day 3 email, Day 7 billing pause detection.)
- [x] **Content Ideas list page** ✅ (saved prompts CRUD + empty state. Page created with filtering, copy, archive, and delete functionality.)
- [x] **Trial expiration & read-only grace period** ✅ (Day 15-21: read-only mode, banner messaging, subscription prompts. Completed and tested - grace period banner, read-only mode, and subscription prompts working.)
- [x] **Trial reminders** ✅ (Day 12 + Day 14 email via Resend + push notifications. Completed and tested - cron job configured, emails sent correctly.)
- [x] **Plan upgrade triggers** ✅ (Lead limit hit, pattern detection access, pre-call brief prompts, content engine prompts. Completed and tested - lead limit detection working, upgrade modal appears correctly, API enforcement in place. All Group 4.1 tests passed.)
- [x] **Streak break detection & recovery** ✅ (Day 1-3 push notifications, Micro Mode on Day 2, personal email via Resend on Day 3, billing pause offer on Day 7. Completed - cron job detects streak breaks, sends Day 3 recovery email, Day 7 billing pause offer for active subscribers, tracks notifications in metadata to prevent duplicates. Day 2 Micro Mode handled by plan generation. Day 1 push notification logged (infrastructure not yet implemented). See `docs/Testing/Group5_Streak_Break_Recovery_Testing_Guide.md` for test plan.)
- [x] **Payment failure recovery flow** ✅ (Day 0 email via Resend, Day 3 modal + email, Day 7 read-only, Day 14 archive + 30-day reactivation window. Completed and tested - webhook tracks payment_failed_at, cron job handles Day 3/7/14 recovery stages, modal component created, read-only mode implemented. All Group 2 tests passed.)
- [x] **Win-back campaign automation** ✅ (Day 7, 30, 90, 180 post-cancellation emails via Resend. Completed and tested - cron job created, uses existing email templates, only sends to voluntary cancellations, skips payment failures. Feedback form created and working. All Group 2 tests passed.)
- [x] **Premium plan features (Group 4.2)** ✅ (Unlimited leads + premium features: 1) Pattern detection ✅, 2) Pre-call briefs ✅, 3) Performance timeline ✅, 4) Content engine with voice learning ✅. All phases implemented and tested. Testing guide: `docs/Testing/Group4.2_Professional_Features_Testing_Guide.md`)
- [x] **Plan downgrade handling** ✅ (Premium → Standard: lead limit warning, Standard → Cancel: 7-day read-only + 30-day reactivation. Completed and tested - downgrade warning modal appears for users with >10 leads, no warning for users within limit, read-only mode on cancellation. All Group 4.3 tests passed.)
- [x] **Display weekly focus on Daily Plan page** ✅ (Fetch `next_week_focus` from `weekly_summaries` table and display in focus card. Completed - Phase 1 implemented: fetches from API, displays in focus card with proper priority hierarchy (adaptive recovery > weekly focus > placeholder), graceful fallbacks. See `docs/Planning/Weekly_Focus_Display_Plan.md` for phased rollout plan.)

- [x] **UI Language Refactor: From CRM to "Do the Work" Language** ✅  
       _Refactor all user-facing language to align with new navigation labels (Today, Relationships, Daily Plan, Actions, Weekly Review, Signals, Settings) and eliminate CRM terminology. Scope: User-facing strings only (navigation, page headers, buttons, empty states, onboarding, emails, tooltips). No changes to API endpoints, database schema, or internal code. Completed: Navigation bar updated, all page headers/copy updated, email subject lines updated, onboarding language updated, Settings language updated, Weekly Review rename (from Weekly Summary), "streak" terminology changed to "consecutive days"/"activity", early access form dropdown updated, marketing page copy updated. Test plan created and executed. Reference: `docs/Planning/UI_Language_Refactor_Plan.md`_

- [x] **Actions Screen IA Refactor: Reduce Cognitive Load & Clarify Priority** ✅  
       _Redesign the Actions screen information architecture to remove cognitive overload and make "what to do next" obvious. Replace the 3-across card grid with a single-column list, group actions into four sections ("Needs attention now", "Conversations in motion", "Stay top of mind", "Optional / background"), and collapse each action into a single, verb-led line with clear due/status metadata. No backend changes; reuse existing action data and endpoints. Completed: Single-column layout, 4-section grouping, verb-led one-line format, color-coded card rows (rose/green/orange/blue), white section containers, clean demo data. Reference: `docs/Planning/Actions_Screen_IA_Refactor_Plan.md`_

- [ ] **Fix consecutive days display in Today and Settings** 🔴 **BUG FIX**  
       _Investigate and fix why "Consecutive days" value (streak_count) is not displaying correctly in Today page and Settings page. Ensure streak_count is properly fetched from users table and displayed._

- [x] **Fix Weekly Summary date calculation** ✅  
       _Fixed weekly summary past week calculation bug (was showing 2 weeks behind). Updated cron job, test endpoint, and generate endpoint to correctly calculate previous week's Sunday (Sunday-Saturday week structure). If today is Sunday, previous week's Sunday is 7 days ago. If today is Monday-Saturday, previous week's Sunday is (dayOfWeek + 7) days ago. Created SQL script `scripts/fix-weekly-summary-dates.sql` to delete old summaries with incorrect dates - users can regenerate using "Generate Review" button._

- [x] **Fix account overview email to use login credentials** ✅  
       _Fixed email display in account overview section to use user.email from auth.users (login credentials) instead of profile.email from users table (which may be from calendar OAuth)._

- [x] **Fix calendar_connected trigger to handle DELETE operations** ✅  
       _Fixed database trigger `update_user_calendar_status()` to properly handle DELETE operations. The original trigger only used `NEW.user_id` which doesn't exist on DELETE - now correctly uses `OLD.user_id` for DELETE and `NEW.user_id` for INSERT/UPDATE. This ensures the `calendar_connected` flag updates correctly when calendars are disconnected. Migration: `supabase/migrations/202512160001_fix_calendar_connected_trigger.sql`_  
       ⚠️ **PRODUCTION DEPLOYMENT PENDING:** This migration has been applied to staging only. Must be applied to production database before deploying calendar disconnect fixes to production.

---

## 🟡 P2 – Nice-to-Have / v0.2 Candidates

**Priority Order (January 2026):**

1. **Help/FAQ System** 🔴 **TOP PRIORITY - JANUARY 2026**
2. **Jira Integration Form** 🔴 **HIGH PRIORITY - JANUARY 2026**
3. Company research & enrichment (Phase 2)
4. Other P2 items (order TBD)

- [ ] **Help/FAQ System** 🔴 **TOP PRIORITY - JANUARY 2026**

  - Help center page with searchable FAQ
  - Common questions organized by category
  - Contact support form (integrated with Jira)
  - In-app contextual help tooltips
  - Estimated: 2-3 days
  - Reference: `docs/Planning/Help_FAQ_System_Plan.md`

- [ ] **Jira Integration Form** 🔴 **HIGH PRIORITY - JANUARY 2026**

  - Simple form with attachment capability
  - Sends bug reports and enhancement requests to Jira
  - User-facing feedback form
  - Estimated: 1-2 days
  - Reference: `docs/Planning/Jira_Integration_Plan.md`

- [ ] **Company research & enrichment for pre-call briefs** 🟡 **MEDIUM PRIORITY**  
       _Automatically enrich pre-call briefs with company information, news, and SEC filings. Extract company domain from email/LinkedIn URL, fetch company details (name, industry, size), recent news/press releases, and SEC 10Q filings for public companies. Display in pre-call briefs to provide "junior analyst"-level prep. Gate behind Premium plan. Reference: `docs/Features/Company_Research_Enrichment.md`_
- [ ] **Design token compliance (incremental)** ⏱ **POST-LAUNCH**  
       _Fix design token violations incrementally over 2-4 weeks. Replace hardcoded colors, spacing, and border radius values with design tokens. Add missing tokens (radius.none, success-green-dark, fast-win-accent-hover). Fix ~498 violations across ActionCard, PriorityIndicator, settings pages, and onboarding flow. Estimated: 8-10 hours total, 2-3 hours/week. Reference: `docs/Planning/Design_Token_Compliance_Estimate.md`_
- [ ] Manual "Busy / Light day" capacity override
- [ ] Action detail modal / history view
- [ ] Additional login providers (Apple, LinkedIn, etc.)
- [ ] Deeper analytics (deal progression metric, more insights)
- [ ] Notification delivery channels (email/push) beyond toggles
- [ ] Pricing page UI (Standard vs Premium comparison, annual savings, clear value props)
- [ ] Billing pause feature (30-day pause for users inactive 7+ days)
- [ ] **Cancellation feedback analytics page**  
       _Admin/internal page to view and analyze cancellation feedback from win-back campaign. Display cancellation reasons breakdown (pie/bar chart), read individual feedback responses, filter by date range, export data. Helps identify product improvement opportunities and common churn reasons. Accessible only to admins/service role._
- [ ] **Enhanced pre-call brief detection for video conferencing**  
       _Improve calendar event detection to recognize Zoom, Google Meet, Microsoft Teams meetings (not just "call"). Update detection logic to check for platform-specific keywords and phrases. Document event naming best practices for users (e.g., "Call with John", "Zoom with Sarah", "Google Meet: Project Review"). This ensures pre-call briefs work for all types of online meetings, not just phone calls._

- [ ] **POST_CALL auto-generation**  
       _Automatically create POST_CALL actions when calendar events (calls) end. Real-time creation when call ends, detect ended calls from calendar events, match to leads, create action immediately. Requires calendar event detection and real-time processing. Estimated: 4-6 hours. Reference: `docs/Planning/Action_Auto_Generation_Strategy.md`_

- [ ] **CALL_PREP auto-generation**  
       _Automatically create CALL_PREP actions 24 hours before detected calls. Hourly cron with timezone filtering, detect calls 24 hours in advance, match calendar events to leads, create action day before call. Requires hourly cron with timezone awareness. Estimated: 4-6 hours. Reference: `docs/Planning/Action_Auto_Generation_Strategy.md`_

- [ ] **NURTURE auto-generation**  
       _Automatically create NURTURE actions for leads that haven't been contacted in 21+ days. Daily cron to detect stale leads, create actions (max 3 per day), prioritize by engagement history, handle returning users gracefully. Estimated: 3-4 hours. Reference: `docs/Planning/Action_Auto_Generation_Strategy.md`_

- [ ] **CONTENT action conversion from weekly summaries**  
       _Convert weekly summary content prompts to CONTENT actions. Spread across week (Monday/Wednesday), link to content_prompts table, create actions when prompts are generated. Estimated: 2-3 hours. Reference: `docs/Planning/Action_Auto_Generation_Strategy.md`_

- [ ] **Industry/work type selection & trend-based content generation**  
       _Add onboarding/settings field for users to select their industry/work type (e.g., marketing, finance, recruiting, sales, operations, etc.). Implement weekly scraping of headlines and trends for each industry category. Use this data to enhance content generation, making content prompts more on-trend and industry-relevant. Store user's industry in `users` table, create scraping service/API integration for trend data, update content generation logic to incorporate industry trends. Lowest priority P2 item - nice-to-have enhancement for content personalization._

- [ ] **Merge Insights content into Weekly Review** 🔴 **HIGH PRIORITY P2 - POST-LANGUAGE-REFACTOR**  
       _Move Insights screen content (stale actions, pattern detection, performance timeline) into Weekly Review page. Remove "Insights" from navigation. Update Insights components to be part of Weekly Review. Focus on reflection, hygiene, and behavior feedback. This completes the Weekly Review section by consolidating all reflection/hygiene content. Estimated: 1-2 days. Reference: `docs/Planning/UI_Language_Refactor_Plan.md` (Part 2)._

- [ ] **Code Refactor: Align Internal Code with New Language** 🟡 **LOWER PRIORITY P2 - POST-LANGUAGE-REFACTOR**  
       _Refactor internal code (API endpoints, TypeScript types, variable names, function names) to align with new UI language. This is a follow-up to the user-facing language refactor. Scope: API endpoint names (e.g., `/api/leads` → `/api/relationships`), TypeScript types, variable names, internal comments. No changes to database schema. Estimated: 2-3 days. Reference: `docs/Planning/UI_Language_Refactor_Plan.md` (Part 2). Priority: P2 - can be done after user-facing language is stable._

---

## Launch Hardening

- [ ] Full QA + accessibility sweep
- [ ] Production Stripe smoke test (checkout → webhook → paywall release)
- [ ] Documentation cleanup & release checklist

---

## 💡 Future Ideas

Ideas to consider for future versions beyond MVP and initial enhancements.

- [ ] **View past summaries**  
       _Page or modal to browse historical weekly summaries, compare weeks, track progress over time_

---

_Update this file as the source of truth until we transition to GitHub Issues or another tracker._
