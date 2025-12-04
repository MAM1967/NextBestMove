NextBestMove — Product Requirements Document (PRD v0.1)

Last updated: 11/25/2025

⸻

1. Summary

NextBestMove is an actions-first workflow app that helps solopreneurs and fractional executives maintain a consistent revenue rhythm.

Instead of being a CRM, NextBestMove does one practical thing:

Every day, it gives you a small set of your next best moves to drive revenue — sized to your real schedule.

Core loop in v0.1:
	1.	Pin people you don’t want to lose track of.
	2.	Get a short, calendar-aware daily plan (3–8 actions).
	3.	Mark actions as done / got reply / snooze.
	4.	Receive a weekly summary with a simple insight and 1–2 content prompts.

⸻

2. Problem Statement

Solopreneurs and fractional leaders struggle with:
	•	Inconsistent outreach and follow-up
	•	Stalled conversations and ghosted threads
	•	No clear answer to “What should I do today to move revenue?”
	•	Overbuilt CRMs that demand data entry
	•	Generic habit trackers not tied to pipeline
	•	AI tools that generate content but not real business activity

They don’t want “another system to maintain.”
They want a simple, trustworthy daily list of actions that:
	•	respects their calendar and capacity
	•	focuses on follow-ups and high-leverage outreach
	•	compounds into booked calls and deals.

⸻

3. Target User

Primary:
	•	Fractional CMOs, CFOs, CTOs, COOs
	•	Solo consultants, expert freelancers
	•	Early-stage founders doing their own outbound

Traits:
	•	High-ticket services, relationship-driven sales
	•	Use LinkedIn + email as main channels
	•	Prefer lightweight systems (notes/sheets) over heavy CRMs
	•	Want discipline without complexity

⸻

4. Goals & Non-Goals

Goals (v0.1)
	•	Help users show up consistently with 3–8 revenue-focused actions/day.
	•	Make warm conversations and follow-ups hard to forget.
	•	Provide weekly summaries that reinforce progress and suggest simple adjustments.
	•	Provide simple, template-based content prompts grounded in real activity.
	•	Be monetization-ready with Stripe-powered subscriptions even while pricing details evolve.

Non-Goals (v0.1)
	•	Replace CRMs or become a full lead database
	•	Scrape LinkedIn or automate outreach
	•	Act as a full content scheduler / social tool
	•	Support teams / multi-user workflows
	•	Predictive lead scoring or multi-step AI agents
	•	Launch with complex tiered billing or coupon logic (single paid plan first)

⸻

5. Success Criteria

48-Hour Activation

Within 48 hours of signup, user has:
	•	Pinned at least 1 person
	•	Completed a Fast Win + ≥ 2 additional actions
	•	Marked at least 1 action as “Got a reply” OR “Meaningful follow-up sent”

Target: ≥ 60% of new users.

Weekly Habit

By end of Week 2:
	•	≥ 50% of active users complete actions on ≥ 4 days/week.

Revenue Signal (Leading Indicator)

Within first 14 days:
	•	≥ 40% of active users log ≥ 1 booked call tied to actions tracked in NextBestMove (self-reported).

Content Behavior
	•	≥ 20% of active users publish ≥ 1 post/week based on prompts/templates from the app.

Track retention at Day 7, 14, 30.

⸻

6. Core Concepts

6.1 Actions-First

Core object: Action (e.g., “Follow up with Sarah,” “Send DM to Mark”).
Actions carry:
	•	type
	•	state
	•	due date
	•	link to a pinned person

6.2 Pins (PersonPin)

A Pin is a lightweight reference:
	•	name
	•	single primary URL (LinkedIn, CRM, mailto)
	•	optional notes
	•	status: ACTIVE / SNOOZED / ARCHIVED

No enrichment, scraping, or full contact record.

6.3 Calendar-Aware Capacity

Daily plan size is determined by:
	•	Today’s free/busy from calendar (if connected)
	•	Simple mapping: free time → # of actions
	•	Recent missed days / completion patterns

If no calendar connected → defaults to 5–6 actions/day, with a manual “Busy today” / “Light day” override planned for v0.2.

6.4 Weekly Focus

Each week has a one-line focus:

“This week: book 2 calls and revive 3 stalled conversations.”

Generated from last week’s behavior (see Section 8.3).

6.5 Fast Win

Each day starts with a Fast Win:
	•	Takes <5 minutes
	•	High probability of response or clear impact
	•	Reduces activation friction

6.6 Billing & Access Control

NextBestMove needs a simple way to accept payment and gate premium workflows:
	•	Stripe Checkout handles card capture; Stripe Billing Portal lets users update/cancel.
	•	App maintains `subscription_status` (TRIALING, ACTIVE, PAST_DUE, CANCELED) to toggle access to action engine + AI features.
	•	Pre-subscription users can pin people and preview the daily plan UX but see a paywall overlay when attempting core actions.
	•	Pricing (amount/plan name) is configured in Stripe so marketing can change it without redeploying.

See Section 21 for detailed pricing, subscription tiers, trial model, and churn prevention strategy.

⸻

7. Data Inputs (v0.1)

7.1 User-Provided Inputs
	•	Pins: name + url (+ optional notes)
	•	Action completion, per task:
	•	Done – got a reply
	•	Done – no reply yet
	•	Snooze
	•	Weekly Focus: approve or lightly edit the suggested focus
	•	Optional notes on actions (e.g., “asked to talk in March”)

7.2 System-Detected Inputs
	•	Today’s free/busy from connected calendar (Google/Outlook):
	•	event start/end
	•	busy status
	•	Day-of-week + basic holiday logic

7.3 Explicitly Not in v0.1
	•	No automatic email/LinkedIn reply detection
	•	No scraping of LinkedIn or websites
	•	No CRM sync beyond using URLs as links
	•	No enrichment APIs

All “replies” are user-marked via a one-tap “Got a reply” action.

7.4 Billing Signals
	•	Stripe Checkout session + webhook events (checkout.session.completed, invoice.paid, customer.subscription.updated) update subscription records.
	•	App reads subscription status + plan metadata to decide whether to show paywall overlays or allow action completion.
	•	Because pricing is TBD, amounts live exclusively in Stripe; product metadata (plan label, description) syncs on startup.

⸻

8. AI Capabilities (v0.1)

AI is narrow and explicit.

8.1 Weekly Summary Generation

Input:
	•	Actions completed (counts by type)
	•	Replies and calls (user-marked)
	•	Streak & days active
	•	Weekly Focus (previous week)

Output:
	•	2–3 sentence narrative summary
	•	1 simple insight (e.g., “When you followed up within 3 days, replies were higher.”)
	•	A suggested new Weekly Focus sentence

8.2 Content Prompts (Template + AI phrasing)

Content remains template-first; AI only helps phrasing.

Input:
	•	Summary metrics
	•	Detected win (calls booked, replies, revived threads)
	•	Insight text

Output:
	•	Up to 2 LinkedIn-style post drafts (short, 3–6 sentences max):
	•	1 “win” post
	•	1 “insight” or “process” post

User always edits; nothing auto-posted.

8.3 Weekly Focus Generation Logic

Input:
	•	Completion rate last week (days active, actions done)
	•	Calls booked vs simple target (e.g., at least 1)
	•	Replies on outreach vs follow-ups
	•	Number of Active Pins with recent activity

Patterns → Example Focus:
	•	Low completion / missing days:
“This week: build momentum with 4 solid days of action.”
	•	High actions, low replies:
“This week: revive 3 warm threads and tighten your follow-ups.”
	•	Good replies but few calls:
“This week: send clear CTAs and book at least 1 call.”
	•	High momentum last week:
“This week: close 2 warm opportunities and start 5 new conversations.”

User can always hit “Edit” and pick from basic levers (Book calls / Revive threads / Start new conversations / Move deals forward).

⸻

9. Pin Lifecycle (v0.1)

9.1 States
	•	ACTIVE — in play; used for action generation
	•	SNOOZED — hidden until a date; no daily actions until unsnoozed
	•	ARCHIVED — no further use; used only for history/analytics

9.2 Transitions
	•	ACTIVE → SNOOZED (user snoozes)
	•	ACTIVE → ARCHIVED (user explicitly archives)
	•	SNOOZED → ACTIVE (on snooze date)

No auto-archive in v0.1. Future: explicit “Cleanup mode” to review stale pins.

9.3 URL Handling
	•	Exactly one primary URL per pin:
	•	LinkedIn profile
	•	CRM record
	•	mailto: link

System never scrapes; URL is purely a destination to open.

⸻

10. Action Model & State Machine (v0.1)

10.1 Action Types
	•	OUTREACH (new conversation starter)
	•	FOLLOW_UP
	•	NURTURE (soft touch, non-CTA)
	•	CALL_PREP
	•	POST_CALL (capture or send next steps)
	•	CONTENT (draft/post)
	•	FAST_WIN (tag on an action that is very quick/high leverage)

10.2 States (Simplified)
	•	NEW — not yet executed
	•	SENT — user acted (“Done – no reply yet”)
	•	REPLIED — user marked “Got a reply”
	•	SNOOZED — deferred to a later date
	•	DONE — completed, no further action
	•	ARCHIVED — terminal

10.3 State Transitions

NEW
  -> SENT       (Done – no reply yet)
  -> REPLIED    (Done – got a reply)
  -> SNOOZED    (Snooze)
  -> ARCHIVED   (Discard)

SENT
  -> REPLIED    (user marks reply later)
  -> DONE       (user completes without reply or further steps)
  -> SNOOZED
  -> ARCHIVED

REPLIED
  -> NEW        (system creates next action after prompt, or user creates)
  -> DONE

SNOOZED
  -> NEW        (on snooze_until date)
  -> ARCHIVED

DONE
  -> ARCHIVED   (optional, via cleanup)

ARCHIVED
  (terminal)

10.4 “Got a reply” Follow-Up Flow

When user taps “Got a reply” on an action:
	1.	Action state → REPLIED.
	2.	System prompts:

“Great. What’s next?”
	•	Schedule a follow-up
	•	Snooze this
	•	Mark done

	3.	If Schedule a follow-up:
	•	System suggests a date (2–3 days out)
	•	Creates a new FOLLOW_UP action in NEW state.
	4.	If Snooze this:
	•	User selects date (see Snooze logic below)
	•	Action state → SNOOZED.
	5.	If Mark done:
	•	Action state → DONE (no further prompt).

⸻

11. Daily Plan & Capacity Logic

11.1 Calendar-Based Capacity

From calendar:
	•	Compute total free working minutes (e.g., 9–5, excluding busy slots).

Map free time → actions:

Free Time	Actions per day
< 30 min	1–2 (Micro)
30–60 min	3–4 (Light)
60–120 min	5–6 (Standard)
> 120 min	7–8 (Heavy)

If no calendar:
	•	Default: 5–6 actions/day.
	•	v0.1: fixed; v0.2: plan to add simple “Busy today / Light day” toggle.

11.2 Action Priority & Fast Win Logic

When generating a plan:
	1.	Collect all candidate actions in NEW or SNOOZED due today.
	2.	Compute a priority score for each based on:
	•	State/source:
	•	REPLIED → next action (highest)
	•	FOLLOW_UP due
	•	SNOOZED now due
	•	Recent OUTREACH (>3 days ago, no reply)
	•	NURTURE opportunities
	•	Recency of last contact
	•	Action type (FOLLOW_UP > OUTREACH > NURTURE > CONTENT)
	3.	Fast Win Selection (first slot):
Pick one action that:
	•	Can be done in <5 minutes, and
	•	Has high probability of impact.
Priority for Fast Win:
	1.	Respond to recent reply (<24h).
	2.	Snoozed FOLLOW_UP now due.
	3.	FOLLOW_UP on warm thread (last contact 3–7 days ago).
	4.	Simple nurture touch (like/comment/short DM).
	5.	Only if none exist: light OUTREACH to a recently pinned person.
	4.	Remaining slots: fill by priority score (descending), until capacity reached.

11.3 When Actions Exceed Capacity

If pending actions > daily capacity:
	•	Always reserve slot 1 for Fast Win.
	•	Fill remaining slots using priority score:
	1.	Next-step actions after REPLIED
	2.	FOLLOW_UP with due date today
	3.	FOLLOW_UP with due date in past 3 days
	4.	OUTREACH on recent Active Pins
	5.	NURTURE tasks
	6.	CONTENT tasks

Unselected actions stay in backlog for future days.

11.4 Snooze Date Defaults

When user taps Snooze on an action:
	•	Default suggestions:
	•	FOLLOW_UP or OUTREACH:
	•	Default = 1 week
	•	Quick options: 3 days / 1 week / 2 weeks / 1 month / Custom
	•	CALL_PREP or POST_CALL:
	•	Default = 2 days
	•	Quick options: tomorrow / 2 days / 1 week / Custom
	•	NURTURE:
	•	Default = 2 weeks
	•	Quick options: 1 week / 2 weeks / 1 month / Custom
	•	snooze_until stored on Action; on that date, state returns to NEW.

⸻

12. Weekly Rhythm (User Experience)

Week themes are internal. User sees a simple “Today’s focus” line.
	•	Monday: set Weekly Focus + quick wins
	•	Midweek: mix of outreach, follow-ups, and prep
	•	Friday: lighter list + weekly summary prep
	•	Weekend: off by default (optional micro-mode later)

Weekly summary (AI-assisted) delivered Sunday night / Monday morning:
	•	Days active
	•	Actions completed
	•	Replies / calls booked
	•	Short narrative (2–3 sentences)
	•	1 actionable insight
	•	1 suggested Weekly Focus
	•	1–2 content prompts (if user did ≥ 6 actions in the week)

⸻

13. Onboarding Flow & Success Gates

13.1 Onboarding Steps (v0.1)
	1.	Welcome
	•	Explain core promise: "I'll give you a small, realistic list of revenue actions each day."
	2.	Pin your first person
	•	Ask: "Who's one person you don't want to lose track of?"
	•	Fields: Name + URL (+ optional notes)
	3.	Connect your calendar (optional, recommended)
	•	Explain: "I'll size your daily plan based on your schedule, so I don't overload you."
	4.	Working hours (optional, recommended)
	•	Ask: "When do you typically work?"
	•	Input: Start hour (default 9 AM) and End hour (default 5 PM)
	•	Presets: "9 AM - 5 PM", "10 AM - 6 PM", "8 AM - 8 PM", "Custom"
	•	Explanation: "We'll use this to calculate your daily action capacity. You can change this later in Settings."
	•	Default: 9 AM - 5 PM if skipped
	5.	Weekend preference (optional, recommended)
	•	Ask: "Do you work on weekends?"
	•	Toggle: "Exclude weekends from daily plans"
	•	Default: OFF (weekends included)
	•	Explanation: "I can exclude Saturday and Sunday from daily plan generation if you don't work weekends."
	6.	Weekly Focus proposal
	•	Suggest initial focus (generic starter if no history):
"This week: follow up with 3 people and start 2 new conversations."
	•	Options: Looks right / Edit.
	7.	First daily plan
	•	3 actions max for Day 1 (to ensure early win).
	•	Includes one Fast Win.
	8.	Complete Fast Win
	•	Guide user through executing the Fast Win.

13.2 Onboarding Success Criteria

Minimum:
	•	✅ 1 Pin created
	•	✅ Weekly Focus set (accepted/edited)
	•	✅ Fast Win completed

Calendar connection is optional but strongly encouraged.

⸻

14. Adaptive Recovery Logic

14.1 Low Completion (3 Days <50%)

If user completes <50% of actions for 3 days straight:
	•	Next day: auto-select Micro/Light (1–3 tasks).
	•	Focus on:
	•	1 Fast Win
	•	1–2 highest-priority follow-ups.
	•	Message:

“Let’s ease back in — here are your 3 highest-impact moves for today.”

14.2 Inactive 7+ Days

On next open:
	•	Plan = 1–2 actions total:
	•	Fast Win: simple follow-up or nurture
	•	One more follow-up if available
	•	Message:

“Welcome back. One small win to restart your momentum.”

14.3 High Completion (5 Days 100%)

If user completes 100% of actions 5 days in a row:
	•	Next day: suggestion (non-blocking):

“You’re on a roll. Want to try 1–2 extra actions tomorrow?”

User taps Yes/No. No mode system in v0.1; just a temporary capacity bump if accepted.

⸻

15. Content System (v0.1)

15.1 Triggers
	•	Content prompts generated once per week, as part of the Weekly Summary.
	•	Only generated if user completed ≥ 6 actions that week (avoid rewarding pure inactivity).
	•	Max 2 prompts per week to avoid noise.

15.2 Outputs
	•	Win post template (if any call/reply/win happened):
	•	“Small milestone: [X] this week. Here’s what changed…”
	•	Insight/process post template (based on weekly insight):
	•	“One thing I’ve been seeing with [topic] is [insight]. Here’s how I’m approaching it…”

User can:
	•	Save to a simple “Content ideas” list
	•	Copy to clipboard to edit/post elsewhere

⸻

16. Data Model (Condensed)

User
	•	id, email, name
	•	timezone
	•	calendar_connected (bool)
	•	streak_count
	•	created_at, updated_at

PersonPin
	•	id, user_id
	•	name
	•	url
	•	notes (optional)
	•	status: ACTIVE | SNOOZED | ARCHIVED
	•	snooze_until (optional)
	•	created_at, updated_at

Action
	•	id, user_id, person_id
	•	action_type (OUTREACH, FOLLOW_UP, etc.)
	•	state (NEW, SENT, REPLIED, SNOOZED, DONE, ARCHIVED)
	•	due_date
	•	completed_at (optional)
	•	snooze_until (optional)
	•	notes (optional)
	•	auto_created (bool)
	•	created_at, updated_at

DailyPlan
	•	id, user_id
	•	date
	•	focus_statement
	•	actions: ordered list of action_ids
	•	generated_at

WeeklySummary
	•	id, user_id
	•	week_start_date
	•	days_active
	•	actions_completed
	•	replies
	•	calls_booked
	•	insight_text
	•	next_week_focus
	•	content_prompts[]
	•	generated_at

Subscription
	•	id, user_id
	•	stripe_customer_id
	•	stripe_subscription_id
	•	status: TRIALING | ACTIVE | PAST_DUE | CANCELED
	•	current_plan (text label, e.g., SOLO)
	•	renewal_date (date)
	•	cancel_at_period_end (bool)
	•	created_at, updated_at

⸻

17. Technical Constraints & AI Costs

Stack (proposed):
	•	Frontend: React + TypeScript
	•	Backend: Next.js / Node.js API routes
	•	Database: Postgres (Supabase)
	•	Calendar: Google Calendar API (read-only free/busy)
	•	AI: OpenAI GPT-4 (or equivalent)
	•	Hosting: Vercel + Supabase
	•	Payments: Stripe Checkout + Billing Portal (webhook-verified)

Performance:
	•	Daily plan generation: < 500 ms
	•	Action state change: < 100 ms
	•	Weekly summary generation: < 2 s

AI usage (per user, v0.1):
	•	Weekly summary: 1 call/week (~500 tokens)
	•	Content phrasing help: 1 call/week (~300 tokens)
	•	Rough cost: O(~$0.03/user/month) at GPT-4 rates

Fallback if OpenAI fails:
	•	Use template-only weekly summaries (no AI phrasing)
	•	Use static content templates.
	•	No user-facing error, just simpler copy.

Billing Constraints:
	•	Webhook endpoint must verify Stripe signatures + enforce idempotency.
	•	App stores subscription + plan metadata locally so paywall can work offline if Stripe is delayed.
	•	Past-due status should show paywall but keep data accessible/read-only.

⸻

18. Data Retention & Export
	•	Actions in DONE state:
	•	Kept “live” for 90 days, then marked ARCHIVED.
	•	ARCHIVED items (pins, actions, summaries):
	•	Retained indefinitely for analytics and history.
	•	Weekly summaries:
	•	Retained indefinitely.

Export:
	•	v0.1: allow user to export all data as JSON (basic endpoint).
	•	v0.2+: CSV and more user-friendly export formats.

⸻

19. Open Questions / Decisions (v0.1 Answers)
	•	“Why this action?” explanation:
Not in v0.1. Keep UX simple. Add tooltips in v0.2 if requested.
	•	More than one Fast Win?
v0.1: Single Fast Win per day. If they complete it quickly, task #2 naturally follows.
	•	Daily email summaries?
v0.1: No. In-app only. Consider opt-in email in v0.2.
	•	Auto-archiving pins?
v0.1: No auto-archive. Only explicit user archive. Add “Cleanup mode” later.
	•	Pricing / plans?
	See Section 21 for complete pricing model: 14-day free trial (no credit card), Standard ($29/mo or $249/year), Premium ($79/mo or $649/year), with detailed churn prevention and upgrade triggers.

⸻

20. MVP Scope (v0.1)

Must-have:
	•	Pin creation + basic management (Active/Snoozed/Archived)
	•	Action engine: daily plan generation from pins + states
	•	Calendar-aware capacity (read-only free/busy)
	•	Daily plan UI with Fast Win and action list
	•	Focus Mode with “Got reply / No reply / Snooze”
	•	Weekly summary (AI-assisted)
	•	Weekly Focus suggestion
	•	1–2 content prompts per week (template + optional AI phrasing)
	•	Onboarding: first pin, optional calendar connect, first Fast Win
	•	Stripe-powered checkout + webhook to activate subscriptions and gate access

Deferred (v0.2+):
	•	Manual “Busy today / Light day” override
	•	“Why this action?” explanations
	•	Email integration for reply detection
	•	Browser extension for pinning
	•	More detailed deal/proposal states
	•	Email summaries, deeper analytics, and reporting

⸻

21. Pricing, Subscription Tiers & Churn Model

21.1 Pricing Philosophy

NextBestMove is a behavior-change product, not a SaaS dashboard. Pricing must reinforce:

Free → Quick Wins → Rhythm → Paid → Retained

The product's value emerges only after:
	•	2 Weekly Summaries
	•	5–7 days of consistent actions
	•	1–2 revived conversations
	•	1 booked call

So the pricing architecture must move the user toward those moments.

21.2 Subscription Tiers

21.2.1 Free Trial — 14 Days (No credit card)

Full access. All features. No paywall.

Why 14 days?
	•	Captures two Weekly Summaries → the strongest "aha" moment
	•	Users experience calendar sizing + follow-up cycles
	•	Short enough to create urgency
	•	Long enough to feel the rhythm

Trial Messaging (built-in):
	•	"No commitment. You'll know in 48 hours if this works."

21.2.2 What Happens on Day 15 (Critical)

Read-Only Grace Period — 7 Days

Not a hard lock. Not a forced downgrade.

User can:
	•	View Pins
	•	View past actions
	•	View Weekly Summaries
	•	Export data
	•	Browse settings

User cannot:
	•	Generate a new daily plan
	•	Add new pins
	•	Schedule follow-ups
	•	Access insights
	•	Use content prompts

Banner shown everywhere:

"Your trial has ended. Subscribe to resume your rhythm. Your data is safe and nothing is lost."

Why read-only is perfect:
	•	No loss aversion trauma
	•	Creates urgency
	•	Ethical and user-friendly
	•	Prevents "the app locked me out" anger
	•	Engineers love it (simple permissions flag)

21.2.3 Paid Plans

STANDARD — $29/mo or $249/year
(Save $99 — 2 months free)

For fractional executives who need a simple, consistent daily rhythm.

Includes:
	•	Daily plan (Fast Win + 3–8 actions/day)
	•	Calendar-aware action sizing
	•	Smart follow-up engine
	•	Up to 10 active Pins
	•	Weekly Summary + single actionable insight
	•	2 content prompts per week
	•	Consistency score
	•	Data export
	•	Email/push reminders
	•	Read-only access during inactivity
	•	Light analytic patterns (consistency + action count)

This is the foundational "habit plan." 80% of users belong here.

PREMIUM — $79/mo or $649/year
(Save $299 — 4 months free)

Hero Value Proposition: "A smart intelligence layer for complex pipelines."

Fractional CMOs, CFOs, CTOs, and multiproject operators who manage dozens of warm relationships benefit the most.

Includes everything in Standard plus:

1. Unlimited Pins
Never prune relationships again.

2. Pattern Detection
	•	"Your Tuesday outreach converts 2x better than Thursday"
	•	"Follow-ups after 48 hours have higher reply rates"
	•	"Most of your booked calls come from warm re-engagements"

3. Pre-Call Briefs
Auto-generated summaries of:
	•	last interactions
	•	follow-up history
	•	next-step suggestions
	•	user notes

10-second prep = 10x better calls.

4. Content Engine (Your Voice)
	•	Learns the user's tone
	•	Provides weekly content drafts
	•	Curates insights from actual actions ("based on your week…")

5. Full Performance Timeline
	•	Month-over-month progress
	•	Consistency arcs
	•	Pipeline movement
	•	Warm contact revival patterns

This is "fractional revops" for one person.

21.3 Upgrade Triggers (Behavior-Based)

Upsells must appear ONLY when the user is succeeding.

1. Pin Limit (Standard hits 10)
Modal: "You've built a strong network of 10 relationships. Add unlimited Pins with Premium."

2. Weekly Summary Insight (Standard)
"Want deeper insights next week? Try the Intelligence Layer."

3. Attempting to view pattern detection
"Pattern detection is part of Premium. See when your outreach performs best."

4. Before important call
"Pre-call brief available. Upgrade to prepare in 10 seconds."

5. Content drafting moment
"The Content Engine tailors posts to your voice. Try Premium."

21.4 Churn Prevention (Active, Not Passive)

21.4.1 Streak Break Detection

Missed 1 day:
Push: "Your Fast Win is waiting. Takes 3 minutes."

Missed 2 days:
System shifts to Micro Mode — 2 actions only.

Missed 3 days:
Send a personal-style email: "Everything okay? Reply and tell me what broke — I read every message."

Missed 7 days:
Offer real billing pause (30 days):
	•	Pauses subscription
	•	Keeps data
	•	No payments during pause

Do NOT offer fake pauses.

21.4.2 Payment Failure Handling (Involuntary Churn Fix)

Day 0:
Soft email: "Your payment failed. Update to keep your rhythm."

Day 3:
Blocking modal in app + Email reminder #2

Day 7:
Account moves to read-only + "Update to reactivate"

Day 14:
Data archived + 30-day window to reactivate

This can recover 20–40% of lost subscribers.

21.4.3 Downgrade Policy (Clarity to Reduce Anxiety)

Premium → Standard:
Effective next billing cycle. Warning: "You have 87 active Pins. Standard supports 10. Archive 77 or stay on Premium."

Standard → Cancel:
	•	7-day read-only
	•	30-day one-click reactivation
	•	Data export anytime

No surprises. No traps.

21.4.4 Win-Back Campaign (High ROI)

Day 7 post-cancellation:
"What didn't work for you?"

Day 30:
"We shipped updates since you left. One of them solves the issue you mentioned…"

Day 90:
"Your past data is still here. Reactivate in one click."

Day 180 (final):
"Should we delete your data or keep it?"

This sequence reliably reactivates 15–25%.

21.5 Pricing Page Copy

Simple Pricing. No Tricks.
Try free for 14 days. No credit card.

STANDARD — $29/mo or $249/year
"All you need to build a daily revenue rhythm."

PREMIUM — $79/mo or $649/year
"An intelligence layer for complex pipelines."

Pricing page includes:
	•	Clear value
	•	Annual savings
	•	Risk reversal
	•	Behavioral differentiators

21.6 Onboarding Flow (Subscription-Aware)

Step 1: Email + Password
Step 2: Calendar Connect
Step 3: Pin 3 people
Step 4: First daily plan
Step 5: Start 14-day trial
Step 6: "You'll know in 48 hours if this works."

No early pricing screens. Let the rhythm sell the plan.

21.7 Subscription Model Summary

Trial:
	•	14 days
	•	No credit card
	•	Full access
	•	7-day read-only grace
	•	Strong Day 12 + Day 14 reminders

Plans:
	•	Standard: $29/mo | $249/year
	•	Premium: $79/mo | $649/year

Highlights:
	•	Standard = Habit Layer
	•	Premium = Intelligence Layer

Behavioral Upsells:
	•	Pin limit
	•	Weekly summaries
	•	Premium insights
	•	Pre-call briefs
	•	Content engine

Churn Prevention:
	•	Day 1–3 rescue flow
	•	Micro Mode
	•	Real billing pause

Payment Failure:
	•	3-touch retry
	•	Grace window
	•	Archive + recover

Win-Back:
	•	Day 7
	•	Day 30
	•	Day 90
	•	Day 180

⸻

End of NextBestMove PRD v0.1

⸻
