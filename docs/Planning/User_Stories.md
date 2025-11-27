# NextBestMove User Stories
## Sprint Planning & Development

**Version:** v0.1 MVP  
**Last Updated:** Based on PRD v0.1

---

## Table of Contents

1. [Epic Overview](#epic-overview)
2. [Epic 1: Foundation & Setup](#epic-1-foundation--setup)
3. [Epic 2: Authentication & User Management](#epic-2-authentication--user-management)
4. [Epic 3: Pin Management](#epic-3-pin-management)
5. [Epic 4: Action Management](#epic-4-action-management)
6. [Epic 5: Daily Plan Generation](#epic-5-daily-plan-generation)
7. [Epic 6: Calendar Integration](#epic-6-calendar-integration)
8. [Epic 7: Weekly Summary](#epic-7-weekly-summary)
9. [Epic 8: Onboarding](#epic-8-onboarding)
10. [Epic 9: Settings & Preferences](#epic-9-settings--preferences)
11. [Epic 10: Background Jobs & Automation](#epic-10-background-jobs--automation)
12. [Epic 11: Billing & Monetization](#epic-11-billing--monetization)
13. [Sprint Recommendations](#sprint-recommendations)

---

## Epic Overview

### Priority Legend
- 🔴 **P0 (Critical)** - MVP blocker, must have
- 🟠 **P1 (High)** - Important for MVP success
- 🟡 **P2 (Medium)** - Nice to have, can defer
- 🟢 **P3 (Low)** - Future enhancement

### Story Size Guide
- **XS:** < 2 days
- **S:** 2-3 days
- **M:** 3-5 days
- **L:** 5-8 days
- **XL:** > 8 days

---

## Epic 1: Foundation & Setup

### US-1.1: Project Initialization
**Epic:** Foundation & Setup  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** developer  
**I want** the project infrastructure set up with Next.js, TypeScript, Supabase, and Tailwind CSS  
**So that** we can begin building features

**Acceptance Criteria:**
- [ ] Next.js 14+ project initialized with App Router
- [ ] TypeScript configured with strict mode
- [ ] Tailwind CSS configured with design system tokens
- [ ] Supabase project created and connected
- [ ] ESLint and Prettier configured
- [ ] Environment variables setup documented
- [ ] Git repository initialized with .gitignore
- [ ] README with setup instructions

**Technical Notes:**
- Use `npx create-next-app@latest` with TypeScript
- Configure Tailwind with custom colors from UI_Specifications.md
- Set up Supabase client library

---

### US-1.2: Design System Base Components
**Epic:** Foundation & Setup  
**Priority:** 🔴 P0  
**Size:** L  
**Story Points:** 8

**As a** developer  
**I want** base UI components (Button, Card, Badge, Input, Modal) built  
**So that** we can reuse them across all features

**Acceptance Criteria:**
- [ ] Button component with all variants (primary, secondary, ghost, destructive, link)
- [ ] Card component with variants and hover states
- [ ] Badge component with status variants
- [ ] Input component with error states and help text
- [ ] TextArea component
- [ ] Modal component with overlay, animations, keyboard navigation
- [ ] All components match UI_Specifications.md
- [ ] All components have TypeScript interfaces
- [ ] Components are accessible (WCAG 2.1 AA)
- [ ] Storybook documentation (optional but recommended)

**Technical Notes:**
- Reference Component_Specifications.md for props and interfaces
- Use design tokens from UI_Specifications.md
- Test keyboard navigation and screen readers

---

### US-1.3: Database Schema Migration
**Epic:** Foundation & Setup  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** developer  
**I want** all database tables created with migrations  
**So that** we can store and retrieve application data

**Acceptance Criteria:**
- [ ] All tables from Database_Schema.md created
- [ ] All enums defined
- [ ] All indexes created
- [ ] All foreign keys and constraints added
- [ ] Helper functions (update_updated_at_column, etc.) created
- [ ] RLS policies enabled and configured
- [ ] Migration files organized and documented
- [ ] Can run migrations up and down

**Technical Notes:**
- Use Supabase migrations or Prisma migrations
- Test RLS policies work correctly
- Seed data for development (optional)

---

### US-1.4: State Management Setup
**Epic:** Foundation & Setup  
**Priority:** 🔴 P0  
**Size:** S  
**Story Points:** 3

**As a** developer  
**I want** React Query and Zustand configured  
**So that** we can manage server and client state effectively

**Acceptance Criteria:**
- [ ] React Query configured with provider
- [ ] Zustand stores structure created
- [ ] Example store for UI state (modals, filters)
- [ ] API client utilities setup
- [ ] Error handling utilities
- [ ] TypeScript types for stores

**Technical Notes:**
- React Query for all server data
- Zustand for UI state (modals, filters, selected items)
- Create example stores as templates

---

## Epic 2: Authentication & User Management

### US-2.1: User Authentication with Supabase Auth
**Epic:** Authentication & User Management  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** user  
**I want** to sign up and sign in with email/password  
**So that** I can access my NextBestMove account

**Acceptance Criteria:**
- [ ] Sign up page with email/password fields
- [ ] Sign in page with email/password fields
- [ ] Password validation (min length, requirements)
- [ ] Email verification flow (optional for v0.1)
- [ ] Protected routes redirect to sign in
- [ ] Session management works correctly
- [ ] Sign out functionality
- [ ] Error messages are user-friendly

**Technical Notes:**
- Use Supabase Auth
- Handle auth errors gracefully
- Show clear validation messages

---

### US-2.2: User Profile Creation
**Epic:** Authentication & User Management  
**Priority:** 🔴 P0  
**Size:** S  
**Story Points:** 3

**As a** user  
**I want** my user profile created automatically on signup  
**So that** the system can track my data

**Acceptance Criteria:**
- [ ] User record created in `users` table on signup
- [ ] Default timezone set (can be changed in settings)
- [ ] Email and name stored
- [ ] Initial streak_count = 0
- [ ] calendar_connected = false
- [ ] Database trigger or function handles creation

**Technical Notes:**
- Use Supabase database trigger or API route
- Handle edge cases (duplicate emails, etc.)

---

## Epic 3: Pin Management

### US-3.1: Pin a Person
**Epic:** Pin Management  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** user  
**I want** to pin a person with name, URL, and optional notes  
**So that** I don't lose track of important contacts

**Acceptance Criteria:**
- [ ] "Pin a Person" modal/form accessible from Pin Management page
- [ ] Fields: Name (required), URL (required), Notes (optional)
- [ ] URL validation (LinkedIn, CRM, or mailto:)
- [ ] Help text explains URL formats
- [ ] Form validation with clear error messages
- [ ] Pin saved to database with ACTIVE status
- [ ] Success message shown after saving
- [ ] Modal closes and list refreshes
- [ ] User redirected to Pin Management page if from onboarding

**Technical Notes:**
- Reference AddPersonModal from Component_Specifications.md
- Validate URLs match expected patterns
- Store encrypted if sensitive (not needed for v0.1)

---

### US-3.2: View Pinned People List
**Epic:** Pin Management  
**Priority:** 🔴 P0  
**Size:** S  
**Story Points:** 3

**As a** user  
**I want** to view all my pinned people  
**So that** I can see who I'm tracking

**Acceptance Criteria:**
- [ ] Pin Management page displays all pins
- [ ] Pins shown with name, URL type, date added
- [ ] Status badges visible (Active, Snoozed, Archived)
- [ ] Notes displayed if present
- [ ] Empty state shown when no pins
- [ ] List loads quickly (< 500ms)
- [ ] Responsive layout (mobile, tablet, desktop)

**Technical Notes:**
- Use React Query for data fetching
- Implement pagination if > 50 pins (unlikely for v0.1)
- Show loading state while fetching

---

### US-3.3: Filter Pins by Status
**Epic:** Pin Management  
**Priority:** 🟠 P1  
**Size:** XS  
**Story Points:** 2

**As a** user  
**I want** to filter pins by status (All, Active, Snoozed, Archived)  
**So that** I can focus on relevant pins

**Acceptance Criteria:**
- [ ] Filter toggle/buttons at top of Pin Management page
- [ ] Options: All | Active | Snoozed | Archived
- [ ] Active filter highlighted
- [ ] List updates immediately on filter change
- [ ] Empty state shows appropriate message when filter yields no results
- [ ] Filter state persists in URL (optional)

**Technical Notes:**
- Use Zustand or URL params for filter state
- Filter in database query for performance

---

### US-3.4: Edit Pin
**Epic:** Pin Management  
**Priority:** 🟠 P1  
**Size:** S  
**Story Points:** 3

**As a** user  
**I want** to edit a pin's name, URL, notes, and status  
**So that** I can update contact information

**Acceptance Criteria:**
- [ ] "View/Edit" button on each pin row
- [ ] Edit modal opens with pre-filled data
- [ ] All fields editable (name, URL, notes, status)
- [ ] Status dropdown shows all options (Active, Snoozed, Archived)
- [ ] Snooze date picker appears if status = Snoozed
- [ ] Validation same as create pin
- [ ] Changes saved to database
- [ ] List refreshes after save

**Technical Notes:**
- Reuse AddPersonModal component with edit mode
- Validate URL format on edit

---

### US-3.5: Snooze Pin
**Epic:** Pin Management  
**Priority:** 🟠 P1  
**Size:** XS  
**Story Points:** 2

**As a** user  
**I want** to snooze a pin until a specific date  
**So that** I can temporarily hide pins I don't need now

**Acceptance Criteria:**
- [ ] "Snooze" button on active pins
- [ ] Date picker modal opens
- [ ] User selects snooze date
- [ ] Pin status changes to SNOOZED
- [ ] snooze_until date stored
- [ ] Pin disappears from Active filter
- [ ] Pin auto-unsnoozes on snooze_until date

**Technical Notes:**
- Use daily job/trigger to auto-unsnooze
- Reference PRD Section 9.2 for state transitions

---

### US-3.6: Archive Pin
**Epic:** Pin Management  
**Priority:** 🟠 P1  
**Size:** XS  
**Story Points:** 1

**As a** user  
**I want** to archive a pin  
**So that** I can remove it from active use but keep history

**Acceptance Criteria:**
- [ ] "Archive" button on pin rows
- [ ] Confirmation dialog (optional but recommended)
- [ ] Pin status changes to ARCHIVED
- [ ] Pin dimmed/disabled in list
- [ ] Pin no longer appears in Active filter
- [ ] Pin can be restored later (future story)

**Technical Notes:**
- Soft delete (status change, not hard delete)
- Keep archived pins for analytics

---

## Epic 4: Action Management

### US-4.1: Create Action State Machine
**Epic:** Action Management  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** developer  
**I want** action state transitions implemented according to PRD  
**So that** actions can move through proper states

**Acceptance Criteria:**
- [ ] All action states defined (NEW, SENT, REPLIED, SNOOZED, DONE, ARCHIVED)
- [ ] State transition logic validates allowed transitions
- [ ] Transition from NEW → SENT (Done - no reply yet)
- [ ] Transition from NEW → REPLIED (Done - got reply)
- [ ] Transition from SENT → REPLIED (mark reply later)
- [ ] Transition to SNOOZED from any state
- [ ] Transition from SNOOZED → NEW on snooze_until date
- [ ] Transition to ARCHIVED
- [ ] Invalid transitions rejected with clear error

**Technical Notes:**
- Reference PRD Section 10.3 for state machine
- Create utility functions for state transitions
- Add validation in API routes

---

### US-4.2: Add Note to Action
**Epic:** Action Management  
**Priority:** 🟠 P1  
**Size:** XS  
**Story Points:** 2

**As a** user  
**I want** to add notes to actions  
**So that** I can remember important context

**Acceptance Criteria:**
- [ ] "Add note" button on action cards
- [ ] Note modal opens with text area
- [ ] User can enter note text
- [ ] Note saved to action.notes field
- [ ] Note displayed on action card if present
- [ ] Note can be edited later
- [ ] Note visible in action detail view

**Technical Notes:**
- Simple text field, no rich text needed
- Store in actions.notes column

---

### US-4.3: Complete Action - Got Reply Flow
**Epic:** Action Management  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** user  
**I want** to mark an action as "Got a reply" and choose next steps  
**So that** I can continue the conversation

**Acceptance Criteria:**
- [ ] "Done - Got reply" button on FOLLOW_UP actions
- [ ] Modal opens: "Got a reply — what's next?"
- [ ] Options: Schedule follow-up (recommended), Snooze, Mark complete
- [ ] Action state changes to REPLIED
- [ ] If Schedule follow-up: opens scheduling modal
- [ ] If Snooze: opens snooze modal
- [ ] If Mark complete: action state → DONE
- [ ] Follow-up action created if scheduled

**Technical Notes:**
- Reference PRD Section 10.4 for follow-up flow
- FollowUpFlowModal component
- Create new FOLLOW_UP action if scheduled

---

### US-4.4: Schedule Follow-Up Action
**Epic:** Action Management  
**Priority:** 🔴 P0  
**Size:** S  
**Story Points:** 3

**As a** user  
**I want** to schedule a follow-up after getting a reply  
**So that** I don't forget to continue the conversation

**Acceptance Criteria:**
- [ ] Follow-up scheduling modal opens from "Got reply" flow
- [ ] System suggests date (2-3 days out)
- [ ] Quick options: 2 days, 3 days, Next week, Pick a date
- [ ] Recommended date highlighted
- [ ] Optional note field
- [ ] New FOLLOW_UP action created with due_date
- [ ] Action linked to same person_pin
- [ ] Action state = NEW

**Technical Notes:**
- Default to 2-3 days from today
- Calculate next business day if needed
- Store in actions table

---

### US-4.5: Snooze Action
**Epic:** Action Management  
**Priority:** 🔴 P0  
**Size:** S  
**Story Points:** 3

**As a** user  
**I want** to snooze an action to a later date  
**So that** I can defer it when appropriate

**Acceptance Criteria:**
- [ ] "Snooze" button on all action cards
- [ ] Snooze modal opens with date options
- [ ] Default suggestions based on action type (per PRD 11.4):
  - FOLLOW_UP/OUTREACH: Default 1 week, options: 3 days / 1 week / 2 weeks / 1 month
  - CALL_PREP/POST_CALL: Default 2 days, options: tomorrow / 2 days / 1 week
  - NURTURE: Default 2 weeks, options: 1 week / 2 weeks / 1 month
- [ ] Custom date picker available
- [ ] Action state → SNOOZED
- [ ] snooze_until date stored
- [ ] Action auto-unsnoozes (state → NEW) on snooze_until date

**Technical Notes:**
- Reference PRD Section 11.4 for snooze defaults
- Use daily job/trigger to auto-unsnooze

---

### US-4.6: Auto-Unsnooze Actions and Pins
**Epic:** Action Management  
**Priority:** 🔴 P0  
**Size:** S  
**Story Points:** 3

**As a** system  
**I want** to automatically unsnooze items when snooze_until date arrives  
**So that** users see them again when appropriate

**Acceptance Criteria:**
- [ ] Daily job/function checks snooze_until dates
- [ ] Actions with state=SNOOZED and snooze_until <= today change to NEW
- [ ] Pins with status=SNOOZED and snooze_until <= today change to ACTIVE
- [ ] Job runs daily (via cron or scheduled function)
- [ ] Logs unsnooze operations
- [ ] Handles edge cases (timezone, etc.)

**Technical Notes:**
- Use Supabase cron job or Vercel cron
- Reference Database_Schema.md for trigger function

---

### US-4.7: Action Detail View
**Epic:** Action Management  
**Priority:** 🟡 P2  
**Size:** S  
**Story Points:** 3

**As a** user  
**I want** to view full details of an action  
**So that** I can see all context and information

**Acceptance Criteria:**
- [ ] Click action card opens detail view/modal
- [ ] Shows: action type, description, person, due date, status, notes
- [ ] Person name and link displayed
- [ ] All action buttons available
- [ ] Edit note button
- [ ] Close/back button

**Technical Notes:**
- Modal or separate page
- Reuse action buttons from card

---

## Epic 5: Daily Plan Generation

### US-5.1: Calculate Calendar Capacity
**Epic:** Daily Plan Generation  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** system  
**I want** to calculate user's daily capacity from calendar free/busy data  
**So that** I can generate appropriate-sized daily plans

**Acceptance Criteria:**
- [ ] Fetch free/busy data for date (if calendar connected)
- [ ] Calculate free minutes from 9 AM - 5 PM (user's timezone)
- [ ] Exclude busy slots from free time
- [ ] Map to capacity level per PRD Section 11.1:
  - < 30 min → micro (1-2 actions)
  - 30-60 min → light (3-4 actions)
  - 60-120 min → standard (5-6 actions)
  - > 120 min → heavy (7-8 actions)
- [ ] Return default capacity (5-6 actions) if no calendar
- [ ] Handle errors gracefully (fallback to default)

**Technical Notes:**
- Reference Calendar_API_Specifications.md
- Use calendar free/busy endpoint
- Cache results for 5-10 minutes

---

### US-5.2: Generate Daily Plan
**Epic:** Daily Plan Generation  
**Priority:** 🔴 P0  
**Size:** L  
**Story Points:** 8

**As a** system  
**I want** to generate a daily plan with Fast Win and regular actions  
**So that** users have their daily action list

**Acceptance Criteria:**
- [ ] Collect all candidate actions (NEW or SNOOZED due today)
- [ ] Calculate priority score for each action (per PRD 11.2)
- [ ] Select Fast Win (highest priority, < 5 min, high impact)
- [ ] Fill remaining slots by priority until capacity reached
- [ ] Priority order:
  1. Next-step actions after REPLIED (highest)
  2. FOLLOW_UP with due date today
  3. FOLLOW_UP with due date in past 3 days
  4. OUTREACH on recent Active Pins
  5. NURTURE tasks
  6. CONTENT tasks
- [ ] Create daily_plan record
- [ ] Link actions via daily_plan_actions junction table
- [ ] Mark Fast Win with is_fast_win flag

**Technical Notes:**
- Reference PRD Section 11.2-11.3
- Performance: < 500ms generation time
- Store in daily_plans and daily_plan_actions tables

---

### US-5.3: Daily Plan Page UI
**Epic:** Daily Plan Generation  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** user  
**I want** to view my daily plan with Fast Win and action list  
**So that** I know what actions to take today

**Acceptance Criteria:**
- [ ] Daily Plan page displays today's plan
- [ ] Header: "Your NextBestMove for Today"
- [ ] Today's Focus card (weekly focus statement)
- [ ] Progress indicator (X of Y actions completed)
- [ ] Fast Win card (purple accent, "under 5 minutes" badge)
- [ ] Action cards list (ordered by priority)
- [ ] Each action card shows: type badge, title, description, person link
- [ ] Action buttons on each card (Done, Snooze, etc.)
- [ ] Empty state if no actions
- [ ] Footer: "Stay consistent. Small actions move everything forward."
- [ ] Responsive design (mobile, tablet, desktop)

**Technical Notes:**
- Reference Product_Screenshot_Mock_Copy_v2.md
- Use React Query to fetch daily plan
- Show loading state while generating

---

### US-5.4: Complete Action from Daily Plan
**Epic:** Daily Plan Generation  
**Priority:** 🔴 P0  
**Size:** S  
**Story Points:** 3

**As a** user  
**I want** to mark actions as complete from the daily plan  
**So that** I can track progress

**Acceptance Criteria:**
- [ ] Click action button on action card
- [ ] Action state updates based on button clicked:
  - "Done" → state = SENT or DONE
  - "Done - Got reply" → opens follow-up flow
  - "Done - No reply yet" → state = SENT
- [ ] Progress indicator updates immediately
- [ ] Completed actions visually marked (strikethrough, dimmed, or removed)
- [ ] Action persists in database with updated state
- [ ] If all actions complete, show celebration message (optional)

**Technical Notes:**
- Optimistic UI updates for better UX
- Update via API, then refresh React Query cache

---

### US-5.5: Adaptive Recovery - Low Completion
**Epic:** Daily Plan Generation  
**Priority:** 🟠 P1  
**Size:** M  
**Story Points:** 5

**As a** user  
**I want** smaller daily plans when I've missed multiple days  
**So that** I can ease back into the routine

**Acceptance Criteria:**
- [ ] System detects if user completes < 50% actions for 3 days straight
- [ ] Next day: Auto-select Micro/Light capacity (1-3 tasks)
- [ ] Show message: "Let's ease back in — here are your 3 highest-impact moves for today."
- [ ] Focus on: 1 Fast Win + 1-2 highest-priority follow-ups
- [ ] Override capacity calculation for this day
- [ ] Return to normal capacity after successful day

**Technical Notes:**
- Reference PRD Section 14.1
- Track completion rate in database
- Check on daily plan generation

---

### US-5.6: Adaptive Recovery - Inactive 7+ Days
**Epic:** Daily Plan Generation  
**Priority:** 🟠 P1  
**Size:** S  
**Story Points:** 3

**As a** user  
**I want** a very light plan when returning after 7+ days inactive  
**So that** I can restart my momentum

**Acceptance Criteria:**
- [ ] System detects user inactive 7+ days (no actions completed)
- [ ] On next open: Plan = 1-2 actions total
- [ ] Show message: "Welcome back. One small win to restart your momentum."
- [ ] Fast Win: simple follow-up or nurture
- [ ] One more follow-up if available
- [ ] Minimal, achievable plan

**Technical Notes:**
- Reference PRD Section 14.2
- Check last_action_date from users table
- Generate minimal plan

---

### US-5.7: High Completion Celebration
**Epic:** Daily Plan Generation  
**Priority:** 🟡 P2  
**Size:** XS  
**Story Points:** 2

**As a** user  
**I want** recognition when I complete all actions 5 days in a row  
**So that** I feel motivated to continue

**Acceptance Criteria:**
- [ ] System detects user completes 100% actions for 5 days straight
- [ ] Show banner: "You're on a roll! 🎉"
- [ ] Message: "You've completed all actions for 5 days straight. Want to try 1–2 extra actions tomorrow?"
- [ ] Options: "Yes, add 1–2 more" or "No, keep current plan"
- [ ] If Yes: Temporarily increase capacity next day
- [ ] Non-blocking (can dismiss)

**Technical Notes:**
- Reference PRD Section 14.3
- Store user preference temporarily
- One-time increase, not permanent

---

## Epic 6: Calendar Integration

### US-6.1: NextAuth.js OAuth Setup
**Epic:** Calendar Integration  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** developer  
**I want** NextAuth.js configured for Google and Outlook OAuth  
**So that** users can connect their calendars

**Acceptance Criteria:**
- [ ] NextAuth.js installed and configured
- [ ] Google OAuth provider configured
- [ ] Azure AD (Outlook) OAuth provider configured
- [ ] Required scopes requested:
  - Google: `calendar.readonly`
  - Outlook: `Calendars.Read offline_access`
- [ ] OAuth callbacks handled correctly
- [ ] Refresh tokens stored securely
- [ ] Environment variables configured
- [ ] Test OAuth flows work end-to-end

**Technical Notes:**
- Reference Calendar_API_Specifications.md
- Set up Google Cloud Console project
- Set up Azure AD app registration

---

### US-6.2: Connect Google Calendar
**Epic:** Calendar Integration  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** user  
**I want** to connect my Google Calendar  
**So that** my daily plans adjust to my schedule

**Acceptance Criteria:**
- [ ] "Connect Calendar" button in Settings/Onboarding
- [ ] Clicking redirects to Google OAuth
- [ ] User authorizes access
- [ ] Refresh token stored encrypted in calendar_connections table
- [ ] calendar_connection record created with status=active
- [ ] users.calendar_connected flag updated to true
- [ ] Success message shown
- [ ] User redirected back to app

**Technical Notes:**
- Reference Calendar_API_Specifications.md endpoint specs
- Encrypt tokens before storing
- Handle OAuth errors gracefully

---

### US-6.3: Connect Outlook Calendar
**Epic:** Calendar Integration  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** user  
**I want** to connect my Outlook Calendar  
**So that** my daily plans adjust to my schedule

**Acceptance Criteria:**
- [ ] "Connect Outlook Calendar" option available
- [ ] Clicking redirects to Microsoft OAuth
- [ ] User authorizes access
- [ ] Refresh token stored encrypted in calendar_connections table
- [ ] calendar_connection record created with status=active
- [ ] users.calendar_connected flag updated to true
- [ ] Success message shown
- [ ] User redirected back to app

**Technical Notes:**
- Same as Google flow but for Microsoft Graph
- Handle tenant-specific vs multi-tenant auth

---

### US-6.4: Fetch Free/Busy Data
**Epic:** Calendar Integration  
**Priority:** 🔴 P0  
**Size:** L  
**Story Points:** 8

**As a** system  
**I want** to fetch free/busy data from connected calendars  
**So that** I can calculate daily capacity

**Acceptance Criteria:**
- [ ] API endpoint: `GET /api/calendar/freebusy?date=YYYY-MM-DD`
- [ ] Fetches events for date from user's calendar
- [ ] Filters to 9 AM - 5 PM (user's timezone)
- [ ] Identifies busy slots (event start/end times)
- [ ] Calculates free minutes
- [ ] Returns structured response with busy slots
- [ ] Handles token refresh automatically
- [ ] Caches results for 5-10 minutes
- [ ] Falls back to default capacity on error
- [ ] Never blocks or errors (always returns data)

**Technical Notes:**
- Reference Calendar_API_Specifications.md
- Use googleapis library for Google
- Use @microsoft/microsoft-graph-client for Outlook
- Implement caching layer

---

### US-6.5: Refresh Expired Tokens
**Epic:** Calendar Integration  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** system  
**I want** to automatically refresh expired calendar tokens  
**So that** calendar integration continues working

**Acceptance Criteria:**
- [ ] Detect 401/403 errors from calendar API
- [ ] Attempt token refresh using refresh_token
- [ ] Update access_token and expires_at in database
- [ ] Retry original request with new token
- [ ] If refresh fails, mark connection as expired
- [ ] Log errors for debugging
- [ ] User sees graceful fallback (default capacity)

**Technical Notes:**
- Automatic refresh on API calls
- Handle refresh token expiration
- Mark connection expired if refresh fails

---

### US-6.6: Disconnect Calendar
**Epic:** Calendar Integration  
**Priority:** 🟠 P1  
**Size:** S  
**Story Points:** 3

**As a** user  
**I want** to disconnect my calendar  
**So that** I can stop calendar integration if needed

**Acceptance Criteria:**
- [ ] "Disconnect" button in Settings
- [ ] Confirmation dialog
- [ ] calendar_connection record deleted or status=disconnected
- [ ] users.calendar_connected flag updated to false
- [ ] Optionally revoke tokens with provider
- [ ] Success message shown
- [ ] Daily plans revert to default capacity

**Technical Notes:**
- Soft delete recommended (status change)
- Revoke tokens for security best practice

---

### US-6.7: Calendar Status Indicator
**Epic:** Calendar Integration  
**Priority:** 🟠 P1  
**Size:** XS  
**Story Points:** 2

**As a** user  
**I want** to see my calendar connection status  
**So that** I know if calendar integration is active

**Acceptance Criteria:**
- [ ] Settings page shows calendar status
- [ ] Display: "Connected" or "Not Connected"
- [ ] Show provider name (Google/Outlook)
- [ ] Show last sync time if connected
- [ ] Visual indicator (green dot, etc.)
- [ ] API endpoint: `GET /api/calendar/status`

**Technical Notes:**
- Quick status check endpoint
- Denormalized flag for fast checks

---

## Epic 7: Weekly Summary

### US-7.1: Generate Weekly Summary Data
**Epic:** Weekly Summary  
**Priority:** 🔴 P0  
**Size:** L  
**Story Points:** 8

**As a** system  
**I want** to calculate weekly summary metrics  
**So that** users can see their progress

**Acceptance Criteria:**
- [ ] Calculate days_active (days with completed actions)
- [ ] Calculate actions_completed (total actions in DONE/REPLIED states)
- [ ] Count replies (actions marked as REPLIED)
- [ ] Count calls_booked (user-reported, future story)
- [ ] Calculate streak_count (consecutive days)
- [ ] Store in weekly_summaries table
- [ ] One summary per user per week
- [ ] Generated Sunday night / Monday morning

**Technical Notes:**
- Query actions table for week date range
- Use week_start_date = Monday of week
- Reference PRD Section 8.1

---

### US-7.2: Generate Weekly Summary Narrative
**Epic:** Weekly Summary  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** system  
**I want** to generate a 2-3 sentence narrative summary using AI  
**So that** users get personalized feedback

**Acceptance Criteria:**
- [ ] Input to AI: actions_completed, replies, calls_booked, days_active, streak
- [ ] Output: 2-3 sentence narrative summary
- [ ] Narrative is positive and encouraging
- [ ] Mentions key achievements
- [ ] Uses OpenAI GPT-4 API
- [ ] Fallback to template if AI fails
- [ ] Store in weekly_summaries.narrative_summary

**Technical Notes:**
- Reference PRD Section 8.1
- Use OpenAI API with proper prompt engineering
- Handle API errors gracefully

---

### US-7.3: Generate Weekly Insight
**Epic:** Weekly Summary  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** system  
**I want** to generate one actionable insight using AI  
**So that** users learn from their patterns

**Acceptance Criteria:**
- [ ] Analyze last week's behavior patterns
- [ ] Input: completion rate, reply rates, timing patterns, action types
- [ ] Generate insight (e.g., "Your follow-ups convert best within 3 days")
- [ ] Insight is specific and actionable
- [ ] Uses OpenAI GPT-4 API
- [ ] Fallback to template if AI fails
- [ ] Store in weekly_summaries.insight_text

**Technical Notes:**
- Reference PRD Section 8.1 and 8.3
- Pattern matching examples in PRD
- AI prompt engineering important

---

### US-7.4: Generate Next Week Focus
**Epic:** Weekly Summary  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** system  
**I want** to suggest a weekly focus for next week  
**So that** users have a clear goal

**Acceptance Criteria:**
- [ ] Analyze last week's metrics (per PRD 8.3)
- [ ] Generate focus based on patterns:
  - Low completion → "build momentum with 4 solid days"
  - High actions, low replies → "revive 3 warm threads"
  - Good replies, few calls → "send clear CTAs and book at least 1 call"
  - High momentum → "close 2 warm opportunities and start 5 new conversations"
- [ ] Uses OpenAI GPT-4 or rule-based logic
- [ ] Store in weekly_summaries.next_week_focus
- [ ] User can edit focus

**Technical Notes:**
- Reference PRD Section 8.3 for pattern logic
- Can be rule-based or AI-generated
- User approval step before saving

---

### US-7.5: Weekly Summary Page UI
**Epic:** Weekly Summary  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** user  
**I want** to view my weekly summary  
**So that** I can see my progress and insights

**Acceptance Criteria:**
- [ ] Weekly Summary page displays current week's summary
- [ ] Metrics grid: Active days, Actions completed, Replies, Calls booked, Streak
- [ ] Narrative summary section (2-3 sentences)
- [ ] Insight card with highlighted text
- [ ] Next Week Focus card with "Confirm Focus" button
- [ ] Content Prompts section (if ≥ 6 actions completed)
- [ ] "View past summaries" link
- [ ] Responsive design
- [ ] Empty state if no summary yet

**Technical Notes:**
- Reference Product_Screenshot_Mock_Copy_v2.md
- Use React Query to fetch summary
- Show loading state while generating

---

### US-7.6: Confirm Weekly Focus
**Epic:** Weekly Summary  
**Priority:** 🔴 P0  
**Size:** S  
**Story Points:** 3

**As a** user  
**I want** to confirm or edit the suggested weekly focus  
**So that** I set my goal for the week

**Acceptance Criteria:**
- [ ] "Confirm Focus" button on Weekly Summary
- [ ] Focus saved to user preferences or weekly record
- [ ] "Edit Focus" option available
- [ ] Edit modal with focus text
- [ ] User can type custom focus
- [ ] Focus displayed on Daily Plan page
- [ ] Focus used for context in daily plan generation

**Technical Notes:**
- Store in weekly_summaries or user preferences
- Display on Daily Plan page as "Today's Focus"

---

### US-7.7: Generate Content Prompts
**Epic:** Weekly Summary  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** system  
**I want** to generate 1-2 content prompts based on the week  
**So that** users can create LinkedIn posts

**Acceptance Criteria:**
- [ ] Only generate if user completed ≥ 6 actions in week
- [ ] Generate up to 2 prompts:
  1. Win post (if calls/replies happened)
  2. Insight/process post (based on insight)
- [ ] Uses template + AI phrasing (per PRD 8.2)
- [ ] Max 2 prompts to avoid noise
- [ ] Prompts are 3-6 sentences max
- [ ] Store in content_prompts table
- [ ] Link to weekly_summary_id
- [ ] Display in Weekly Summary page

**Technical Notes:**
- Reference PRD Section 8.2 and 15.1-15.2
- Use templates as base, AI for phrasing
- User always edits before posting (nothing auto-posted)

---

### US-7.8: Save Content Prompt
**Epic:** Weekly Summary  
**Priority:** 🟠 P1  
**Size:** XS  
**Story Points:** 2

**As a** user  
**I want** to save content prompts to a list  
**So that** I can use them later

**Acceptance Criteria:**
- [ ] "Save to Content Ideas" button on prompt card
- [ ] Prompt saved to content_prompts table
- [ ] Status = DRAFT
- [ ] Success feedback shown
- [ ] Prompt appears in Content Ideas list page

**Technical Notes:**
- Simple save operation
- Link to Content Ideas List page

---

### US-7.9: View Past Weekly Summaries
**Epic:** Weekly Summary  
**Priority:** 🟡 P2  
**Size:** S  
**Story Points:** 3

**As a** user  
**I want** to view past weekly summaries  
**So that** I can track my progress over time

**Acceptance Criteria:**
- [ ] "View past summaries" link on Weekly Summary page
- [ ] Past Weekly Summaries page lists all summaries
- [ ] Summary cards show: week date, key metrics, insight preview
- [ ] Click card opens full summary
- [ ] Sorted by date (most recent first)
- [ ] Pagination if many summaries

**Technical Notes:**
- Simple list view
- Reuse Weekly Summary component in view mode

---

## Epic 8: Onboarding

### US-8.1: Onboarding Flow Framework
**Epic:** Onboarding  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** developer  
**I want** an onboarding flow framework  
**So that** new users can complete setup

**Acceptance Criteria:**
- [ ] OnboardingFlow component tracks current step
- [ ] Progress indicator (Step X of 6)
- [ ] Step navigation (next, back, skip where allowed)
- [ ] Step completion tracking
- [ ] Redirect to app after completion
- [ ] Store onboarding completion in database

**Technical Notes:**
- Use state machine or step array
- Persist progress (optional, can be in-memory)
- Reference Component_Specifications.md

---

### US-8.2: Welcome Step
**Epic:** Onboarding  
**Priority:** 🔴 P0  
**Size:** XS  
**Story Points:** 2

**As a** new user  
**I want** to see a welcome screen explaining NextBestMove  
**So that** I understand what the app does

**Acceptance Criteria:**
- [ ] Welcome screen with header: "Welcome to NextBestMove"
- [ ] Subheader: "Small actions. Every day. Predictable revenue."
- [ ] Bullet points: What you'll get
- [ ] "Get Started" button
- [ ] Progress: Step 1 of 6

**Technical Notes:**
- Simple static screen
- Reference Product_Screenshot_Mock_Copy_v2.md

---

### US-8.3: Pin First Person Step
**Epic:** Onboarding  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** new user  
**I want** to pin my first person during onboarding  
**So that** I can immediately start using the app

**Acceptance Criteria:**
- [ ] Onboarding step: "Pin someone you don't want to lose track of"
- [ ] Same form as regular Pin Person modal
- [ ] Fields: Name, URL, Notes (optional)
- [ ] Validation and help text
- [ ] Pin saved and marked as ACTIVE
- [ ] Progress: Step 2 of 6
- [ ] Can't skip (required step)

**Technical Notes:**
- Reuse AddPersonModal component
- Mark as onboarding step for context

---

### US-8.4: Calendar Connect Step
**Epic:** Onboarding  
**Priority:** 🔴 P0  
**Size:** S  
**Story Points:** 3

**As a** new user  
**I want** to connect my calendar during onboarding  
**So that** my daily plans are personalized

**Acceptance Criteria:**
- [ ] Step: "Connect your calendar (optional, recommended)"
- [ ] Explanation: "I'll size your daily plan based on your schedule"
- [ ] Benefits listed: Daily plans adjust, respects busy days, etc.
- [ ] "Connect Calendar" button (Google or Outlook)
- [ ] "Skip for now" secondary option
- [ ] Progress: Step 3 of 6
- [ ] OAuth flow same as Settings

**Technical Notes:**
- Optional step, can skip
- Same OAuth flow as US-6.2/6.3

---

### US-8.5: Weekly Focus Setup Step
**Epic:** Onboarding  
**Priority:** 🔴 P0  
**Size:** S  
**Story Points:** 3

**As a** new user  
**I want** to set my first weekly focus  
**So that** I have a goal for the week

**Acceptance Criteria:**
- [ ] Step: "Set your weekly focus"
- [ ] Suggested focus: "This week: follow up with 3 people and start 2 new conversations."
- [ ] Options: "Looks right" or "Edit"
- [ ] If Edit: modal opens with focus text
- [ ] Focus saved
- [ ] Progress: Step 4 of 6

**Technical Notes:**
- Generic starter focus (no history yet)
- User can edit before confirming

---

### US-8.6: First Daily Plan Ready Step
**Epic:** Onboarding  
**Priority:** 🔴 P0  
**Size:** S  
**Story Points:** 3

**As a** new user  
**I want** to know my first daily plan is ready  
**So that** I can start taking action

**Acceptance Criteria:**
- [ ] Step: "Your first NextBestMove is ready"
- [ ] Subheader: "We've created a light plan with 3 actions to get you started."
- [ ] "See My Plan" button
- [ ] Progress: Step 5 of 6
- [ ] Generate daily plan for today before showing this step

**Technical Notes:**
- Trigger daily plan generation in background
- Show loading if generation takes time

---

### US-8.7: Complete Fast Win Step
**Epic:** Onboarding  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** new user  
**I want** to complete my first Fast Win with guidance  
**So that** I understand how to use the app

**Acceptance Criteria:**
- [ ] Step: "Let's start with your Fast Win"
- [ ] Fast Win card displayed
- [ ] Instructions: "1. Open the link... 2. Send a message... 3. Mark as done"
- [ ] "Mark as Done" button
- [ ] "I'll do this later" alternative
- [ ] Success message: "Great start! You've completed your first action."
- [ ] Progress: Step 6 of 6
- [ ] On completion, redirect to Daily Plan page

**Technical Notes:**
- Interactive step with action completion
- Reference PRD Section 13.1 step 6

---

### US-8.8: Onboarding Success Tracking
**Epic:** Onboarding  
**Priority:** 🔴 P0  
**Size:** S  
**Story Points:** 3

**As a** product manager  
**I want** to track onboarding completion metrics  
**So that** I can measure success

**Acceptance Criteria:**
- [ ] Track: Pin created (✅/❌)
- [ ] Track: Weekly Focus set (✅/❌)
- [ ] Track: Fast Win completed (✅/❌)
- [ ] Track: Calendar connected (optional)
- [ ] Store completion flags in database or analytics
- [ ] Report on 48-hour activation rate (≥ 60% target)

**Technical Notes:**
- Reference PRD Section 5 (Success Criteria)
- Can use analytics tool or database flags

---

## Epic 9: Settings & Preferences

### US-9.1: Settings Page UI
**Epic:** Settings & Preferences  
**Priority:** 🟠 P1  
**Size:** M  
**Story Points:** 5

**As a** user  
**I want** a settings page to manage my preferences  
**So that** I can customize my experience

**Acceptance Criteria:**
- [ ] Settings page accessible from navigation
- [ ] Sections:
  - Calendar (connection status)
  - Notification Preferences
  - Timezone
  - Content Prompts toggle
  - Streak Display
  - Data Export
  - Account (email, timezone)
- [ ] Clean, organized layout
- [ ] Save changes buttons where needed
- [ ] Success/error feedback

**Technical Notes:**
- Reference Product_Screenshot_Mock_Copy_v2.md
- Settings stored in database or user preferences

---

### US-9.2: Notification Preferences
**Epic:** Settings & Preferences  
**Priority:** 🟡 P2  
**Size:** S  
**Story Points:** 3

**As a** user  
**I want** to control which notifications I receive  
**So that** I'm not overwhelmed

**Acceptance Criteria:**
- [ ] Toggle for each notification type:
  - Morning Plan
  - Fast Win Reminder
  - Follow-Up Alerts
  - Weekly Summary
- [ ] Toggles save immediately
- [ ] Preferences stored in database
- [ ] Notification system respects preferences

**Technical Notes:**
- Store in user preferences or separate table
- Reference PRD notifications section

---

### US-9.3: Timezone Setting
**Epic:** Settings & Preferences  
**Priority:** 🟠 P1  
**Size:** S  
**Story Points:** 3

**As a** user  
**I want** to set my timezone  
**So that** daily plans and times are correct

**Acceptance Criteria:**
- [ ] Timezone selector in Settings
- [ ] Default to detected timezone on signup
- [ ] List of IANA timezone identifiers
- [ ] Searchable dropdown
- [ ] Save updates users.timezone
- [ ] Affects all time-based calculations

**Technical Notes:**
- Use timezone library for list
- Update all time calculations

---

### US-9.4: Streak Display
**Epic:** Settings & Preferences  
**Priority:** 🟡 P2  
**Size:** XS  
**Story Points:** 2

**As a** user  
**I want** to see my current streak  
**So that** I stay motivated

**Acceptance Criteria:**
- [ ] Display current streak count
- [ ] Display best streak (all-time)
- [ ] "View streak history" link (future)
- [ ] Visual indicator (fire icon, etc.)
- [ ] Updates automatically

**Technical Notes:**
- Streak calculated from actions
- Reference Database_Schema.md streak functions

---

### US-9.5: Data Export
**Epic:** Settings & Preferences  
**Priority:** 🟠 P1  
**Size:** M  
**Story Points:** 5

**As a** user  
**I want** to export all my data as JSON  
**So that** I have a backup

**Acceptance Criteria:**
- [ ] "Export JSON" button in Settings
- [ ] Export includes:
  - All pins
  - All actions
  - All daily plans
  - All weekly summaries
  - User preferences
- [ ] Downloadable JSON file
- [ ] Sensitive data (tokens) excluded
- [ ] File named: `nextbestmove-export-YYYY-MM-DD.json`

**Technical Notes:**
- Reference PRD Section 18
- Generate JSON server-side
- Stream download to user

---

## Epic 10: Background Jobs & Automation

### US-10.1: Daily Plan Generation Job
**Epic:** Background Jobs & Automation  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** system  
**I want** to generate daily plans automatically  
**So that** users have fresh plans each day

**Acceptance Criteria:**
- [ ] Cron job runs daily (early morning, user's timezone)
- [ ] Generates daily plan for all active users
- [ ] Skips users without pins or recent activity
- [ ] Handles errors gracefully (log, continue)
- [ ] Sends notification (if enabled)
- [ ] Performance: Can handle all users in reasonable time

**Technical Notes:**
- Use Vercel Cron or Supabase Cron
- Batch processing for multiple users
- Reference daily plan generation logic

---

### US-10.2: Weekly Summary Generation Job
**Epic:** Background Jobs & Automation  
**Priority:** 🔴 P0  
**Size:** L  
**Story Points:** 8

**As a** system  
**I want** to generate weekly summaries automatically  
**So that** users get insights every week

**Acceptance Criteria:**
- [ ] Cron job runs Sunday night / Monday morning
- [ ] Generates summary for previous week
- [ ] Calculates all metrics
- [ ] Generates narrative, insight, focus using AI
- [ ] Generates content prompts if applicable
- [ ] Sends notification (if enabled)
- [ ] Handles AI API failures gracefully (fallback templates)
- [ ] Logs generation for monitoring

**Technical Notes:**
- Use Vercel Cron or Supabase Cron
- Batch AI calls efficiently
- Cache results

---

### US-10.3: Auto-Archive Old Actions Job
**Epic:** Background Jobs & Automation  
**Priority:** 🟠 P1  
**Size:** XS  
**Story Points:** 2

**As a** system  
**I want** to automatically archive actions older than 90 days  
**So that** the database doesn't grow indefinitely

**Acceptance Criteria:**
- [ ] Daily job checks actions in DONE state
- [ ] Archives actions where completed_at > 90 days ago
- [ ] Changes state from DONE → ARCHIVED
- [ ] Logs archived count
- [ ] Runs silently (no user notification)

**Technical Notes:**
- Reference PRD Section 18
- Use database function from Database_Schema.md
- Can run via cron or scheduled function

---

### US-10.4: Auto-Unsnooze Job
**Epic:** Background Jobs & Automation  
**Priority:** 🔴 P0  
**Size:** XS  
**Story Points:** 2

**As a** system  
**I want** to automatically unsnooze items when dates arrive  
**So that** users see items again when appropriate

**Acceptance Criteria:**
- [ ] Daily job checks snooze_until dates
- [ ] Actions: state SNOOZED → NEW when snooze_until <= today
- [ ] Pins: status SNOOZED → ACTIVE when snooze_until <= today
- [ ] Clears snooze_until field
- [ ] Runs daily early morning
- [ ] Logs unsnooze operations

**Technical Notes:**
- Reference Database_Schema.md auto_unsnooze function
- Use cron job or scheduled function

---

## Epic 11: Billing & Monetization

### US-11.1: Stripe Checkout Session
**Epic:** Billing & Monetization  
**Priority:** 🔴 P0  
**Size:** S  
**Story Points:** 3

**As a** prospective subscriber  
**I want** to start a Stripe Checkout session from inside the app  
**So that** I can pay for the Solo plan without leaving the flow

**Acceptance Criteria:**
- [ ] API endpoint `POST /api/billing/create-checkout-session` returns checkout URL
- [ ] Endpoint verifies user auth and uses configured `price_id`
- [ ] Success & cancel URLs return user to app with messaging
- [ ] Errors are surfaced via toast (“Checkout unavailable, try again”)
- [ ] Works in test and production Stripe modes (env driven)

**Technical Notes:**
- Use Stripe SDK server-side; never expose secret key to client.
- Include metadata (user_id) on session for webhook correlation.

---

### US-11.2: Billing Webhook & Subscription Sync
**Epic:** Billing & Monetization  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** system  
**I want** to update subscription status whenever Stripe sends events  
**So that** the app knows who should have access

**Acceptance Criteria:**
- [ ] Webhook endpoint `POST /api/billing/webhook` verifies Stripe signature
- [ ] Handles events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Upserts `billing_customers` and `billing_subscriptions` tables
- [ ] Stores raw event payload in `billing_events` for auditing
- [ ] Idempotent: duplicate events do not create duplicates
- [ ] Updates user session/metadata with subscription status

**Technical Notes:**
- Use Stripe `event.id` for idempotency.
- Webhook handler runs with Supabase service key (server-only).

---

### US-11.3: Paywall & Feature Gating
**Epic:** Billing & Monetization  
**Priority:** 🔴 P0  
**Size:** M  
**Story Points:** 5

**As a** product owner  
**I want** daily plan + weekly summary to require an active subscription  
**So that** core value is tied to paid access

**Acceptance Criteria:**
- [ ] When subscription status ≠ active/trialing, show PaywallOverlay on Daily Plan and Weekly Summary pages
- [ ] Pins + onboarding remain available (freemium preview)
- [ ] Past due state blocks actions and shows warning copy
- [ ] Paywall CTA triggers checkout or billing portal depending on status
- [ ] Analytics event logged when paywall displayed and CTA clicked

**Technical Notes:**
- Read subscription status from user session or `/api/billing/subscription`.
- Ensure paywall gating also enforced server-side (API returns 402-style error).

---

### US-11.4: Billing Settings Section
**Epic:** Billing & Monetization  
**Priority:** 🔴 P0  
**Size:** S  
**Story Points:** 3

**As a** subscriber  
**I want** to view my plan status and manage billing from Settings  
**So that** I can update cards or cancel without contacting support

**Acceptance Criteria:**
- [ ] Settings screen shows plan name, status badge, renewal date, and footnote (“Payments by Stripe”)
- [ ] “Manage billing” button opens Stripe customer portal URL via `POST /api/billing/customer-portal`
- [ ] Past due state surfaces “Update payment method” CTA
- [ ] Canceled state shows “Reactivate plan” CTA leading to checkout
- [ ] Loading skeleton displayed while fetching subscription data

**Technical Notes:**
- Cache portal/checkout URLs server-side (short-lived) to avoid exposing secrets.
- Use BillingSection component spec from Architecture docs.

---

### US-11.5: Past Due & Cancelation Nudges
**Epic:** Billing & Monetization  
**Priority:** 🟠 P1  
**Size:** XS  
**Story Points:** 2

**As a** user returning after a payment issue  
**I want** clear messaging and next steps  
**So that** I know how to restore access quickly

**Acceptance Criteria:**
- [ ] Banner appears on dashboard when status = past_due (“Payment failed — Update card”)
- [ ] Banner CTA opens billing portal directly
- [ ] If cancel_at_period_end = true, show reminder banner (“Access ends Mar 21 — Resume plan”)
- [ ] Banners dismissible once per session but reappear if status unchanged

**Technical Notes:**
- Use shared notification component.
- Track dismiss state in local store (not persisted) to avoid noisy loops.

---

## Sprint Recommendations

### Sprint 1: Foundation (Weeks 1-2)
**Goal:** Project setup and base infrastructure

- US-1.1: Project Initialization
- US-1.2: Design System Base Components
- US-1.3: Database Schema Migration
- US-1.4: State Management Setup
- US-2.1: User Authentication
- US-2.2: User Profile Creation
- US-11.1: Stripe Checkout Session
- US-11.2: Billing Webhook & Subscription Sync

**Deliverable:** Working authentication, base components, database

---

### Sprint 2: Pin Management (Week 3)
**Goal:** Users can manage pinned contacts

- US-3.1: Pin a Person
- US-3.2: View Pinned People List
- US-3.3: Filter Pins by Status
- US-3.4: Edit Pin
- US-3.5: Snooze Pin
- US-3.6: Archive Pin

**Deliverable:** Complete pin management functionality

---

### Sprint 3: Action Management (Week 4)
**Goal:** Actions can be created and managed

- US-4.1: Create Action State Machine
- US-4.2: Add Note to Action
- US-4.3: Complete Action - Got Reply Flow
- US-4.4: Schedule Follow-Up Action
- US-4.5: Snooze Action
- US-4.6: Auto-Unsnooze Actions and Pins
- US-4.7: Action Detail View (P2, optional)

**Deliverable:** Action state machine working, completion flows

---

### Sprint 4: Calendar Integration (Week 5)
**Goal:** Calendar connection and free/busy fetching

- US-6.1: NextAuth.js OAuth Setup
- US-6.2: Connect Google Calendar
- US-6.3: Connect Outlook Calendar
- US-6.4: Fetch Free/Busy Data
- US-6.5: Refresh Expired Tokens
- US-6.6: Disconnect Calendar
- US-6.7: Calendar Status Indicator

**Deliverable:** Full calendar integration working

---

### Sprint 5: Daily Plan Generation (Week 6)
**Goal:** System generates daily plans

- US-5.1: Calculate Calendar Capacity
- US-5.2: Generate Daily Plan
- US-5.3: Daily Plan Page UI
- US-5.4: Complete Action from Daily Plan
- US-5.5: Adaptive Recovery - Low Completion
- US-5.6: Adaptive Recovery - Inactive 7+ Days

**Deliverable:** Users can view and complete daily plans

---

### Sprint 6: Weekly Summary (Week 7)
**Goal:** Weekly summaries generated and displayed

- US-7.1: Generate Weekly Summary Data
- US-7.2: Generate Weekly Summary Narrative
- US-7.3: Generate Weekly Insight
- US-7.4: Generate Next Week Focus
- US-7.5: Weekly Summary Page UI
- US-7.6: Confirm Weekly Focus
- US-7.7: Generate Content Prompts
- US-7.8: Save Content Prompt

**Deliverable:** Weekly summaries working end-to-end

---

### Sprint 7: Onboarding (Week 8)
**Goal:** New users can complete setup

- US-8.1: Onboarding Flow Framework
- US-8.2: Welcome Step
- US-8.3: Pin First Person Step
- US-8.4: Calendar Connect Step
- US-8.5: Weekly Focus Setup Step
- US-8.6: First Daily Plan Ready Step
- US-8.7: Complete Fast Win Step
- US-8.8: Onboarding Success Tracking

**Deliverable:** Complete onboarding experience

---

### Sprint 8: Settings & Automation (Week 9)
**Goal:** Settings page and background jobs

- US-9.1: Settings Page UI
- US-9.2: Notification Preferences (P2, optional)
- US-9.3: Timezone Setting
- US-9.4: Streak Display (P2, optional)
- US-9.5: Data Export
- US-10.1: Daily Plan Generation Job
- US-10.2: Weekly Summary Generation Job
- US-10.3: Auto-Archive Old Actions Job
- US-10.4: Auto-Unsnooze Job
- US-11.3: Paywall & Feature Gating
- US-11.4: Billing Settings Section
- US-11.5: Past Due & Cancelation Nudges

**Deliverable:** Settings page complete, automation working

---

### Sprint 9: Polish & Launch (Week 10)
**Goal:** Bug fixes, testing, launch prep

- Testing & QA
- Performance optimization
- Accessibility audit
- Error tracking setup (Sentry)
- Analytics setup
- Documentation
- Final bug fixes

**Deliverable:** Production-ready application

---

## Story Estimation Summary

**Total Story Points:** ~198-218 points

**By Priority:**
- 🔴 P0 (Critical): ~156 points
- 🟠 P1 (High): ~32 points
- 🟡 P2 (Medium): ~20 points

**By Epic:**
- Epic 1 (Foundation): ~21 points
- Epic 2 (Auth): ~8 points
- Epic 3 (Pins): ~16 points
- Epic 4 (Actions): ~21 points
- Epic 5 (Daily Plans): ~24 points
- Epic 6 (Calendar): ~28 points
- Epic 7 (Weekly Summary): ~36 points
- Epic 8 (Onboarding): ~24 points
- Epic 9 (Settings): ~12 points
- Epic 10 (Automation): ~17 points
- Epic 11 (Billing & Monetization): ~18 points

---

*User Stories v1.0 - Ready for sprint planning*

