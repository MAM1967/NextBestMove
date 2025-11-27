# NextBestMove Implementation Guide
## From PRD to Production

---

## Overview

This guide provides a roadmap for implementing NextBestMove from the Product Requirements Document through UI/UX design to component architecture.

---

## Documentation Hierarchy

```
NextBestMove_PRD_v1.md
    ↓
Product_Screenshot_Mock_Copy_v2.md
    ↓
UI_Specifications.md
    ↓
Component_Specifications.md
    ↓
[Implementation]
```

For team-wide agreements (definition of done, environments, testing strategy), see `docs/decisions.md`.

---

## 1. Product Requirements Document (PRD)

**File:** `NextBestMove_PRD_v1.md`

**Purpose:** Defines the product vision, features, success criteria, and technical constraints.

**Key Sections:**
- Problem statement and target users
- Core concepts (Actions, Pins, Calendar-awareness)
- Success metrics (48-hour activation, weekly habits)
- Data models and state machines
- AI capabilities and constraints

**Status:** ✅ Complete

---

## 2. Mockup Copy

**File:** `Product_Screenshot_Mock_Copy_v2.md`

**Purpose:** Provides detailed screen-by-screen copy and content for all UI screens.

**Coverage:**
- 15 distinct screens
- All user flows
- Empty states
- Error/recovery states
- Onboarding sequence

**Key Updates from v1:**
- Added all missing action types
- Complete onboarding flow (6 steps)
- Notes functionality visibility
- Weekly summary enhancements
- Removed v0.2 features

**Status:** ✅ Complete and PRD-aligned

---

## 3. UI Specifications

**File:** `UI_Specifications.md`

**Purpose:** Defines the visual design system, layout specifications, and interaction patterns.

**Key Sections:**

### Design System
- **Color Palette:** Primary, semantic, and neutral colors with hex codes
- **Typography:** Font families, sizes, weights, and hierarchy
- **Spacing:** 4px base unit system
- **Border Radius:** Standard values
- **Shadows:** Elevation system
- **Animations:** Duration, easing, and transitions

### Screen Specifications
Detailed specs for:
1. Daily Plan Screen (header, focus card, progress, Fast Win, action cards)
2. Pin Management Screen (filters, pin rows, empty states)
3. Weekly Summary Screen (metrics grid, narrative, insights, prompts)
4. Modal specifications (overlay, container, header, body, footer)
5. Form inputs (text, textarea, select, date picker)
6. Buttons (primary, secondary, ghost, destructive, link)
7. Badges (status and type variants)

### Interaction Patterns
- Hover states
- Loading states
- Empty states
- Error handling
- Success feedback

### Responsive Design
- Breakpoints (mobile, tablet, desktop)
- Layout adaptations
- Touch target sizes

### Accessibility
- WCAG 2.1 AA compliance
- Color contrast ratios
- Keyboard navigation
- Screen reader support

**Status:** ✅ Complete

---

## 4. Component Specifications

**File:** `Component_Specifications.md`

**Purpose:** Defines the React + TypeScript component architecture, interfaces, props, and implementation patterns.

**Key Sections:**

### Type Definitions
- Complete TypeScript interfaces for:
  - User, PersonPin, Action, DailyPlan, WeeklySummary
  - Action types and states
  - Settings and notifications

### Component Architecture
- Component hierarchy tree
- Page-level components
- Shared/base components
- Modal components
- Onboarding components

### Component Specifications
Detailed specs for:

**Base Components:**
- Button (variants, sizes, states)
- Card (variants, hoverable)
- Badge (status and type variants)
- Input (validation, error states)
- TextArea
- Modal (sizes, animations, accessibility)

**Page Components:**
- DailyPlanPage (state management, data fetching)
- FastWinCard (special styling, completion flow)
- ActionCard (dynamic buttons, action types)
- PinManagementPage (filtering, CRUD operations)
- PinRow (status-aware rendering)
- WeeklySummaryPage

**Modal Components:**
- AddPersonModal (form validation, URL handling)
- EditPersonModal
- FollowUpFlowModal (completion options)
- FollowUpSchedulingModal
- ActionNoteModal
- SnoozeActionModal

**Onboarding:**
- OnboardingFlow (step management, progress tracking)
- Individual step components

### State Management
- React Query for server state
- Zustand for client state
- Store structure examples

### API Integration
- Endpoint structure
- API client patterns
- Error handling

### Testing Recommendations
- Unit tests
- Integration tests
- E2E tests

**Status:** ✅ Complete

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

#### 1.1 Project Setup
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Supabase database
- [ ] Configure Tailwind CSS with design system tokens
- [ ] Set up ESLint, Prettier
- [ ] Configure React Query
- [ ] Set up Zustand stores

#### 1.2 Design System Implementation
- [ ] Create color system in Tailwind config
- [ ] Implement typography scale
- [ ] Create spacing utilities
- [ ] Build base components:
  - [ ] Button
  - [ ] Card
  - [ ] Badge
  - [ ] Input
  - [ ] TextArea
  - [ ] Modal
  - [ ] Toast

#### 1.3 Database Setup
- [ ] Create database schema (Users, PersonPins, Actions, DailyPlans, WeeklySummaries)
- [ ] Set up RLS (Row Level Security) policies
- [ ] Create database migrations
- [ ] Set up Supabase client

#### 1.4 Billing Foundation
- [ ] Configure Stripe account with placeholder Product/Price (amount can change later)
- [ ] Store `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` env vars
- [ ] Implement `/api/billing/create-checkout-session` (returns Checkout URL) and `/api/billing/customer-portal`
- [ ] Build webhook handler (`/api/billing/webhook`) that verifies signatures and upserts `billing_customers` + `billing_subscriptions`
- [ ] Add paywall-aware auth middleware (read-only experience until subscription status = active/trialing)

### Phase 2: Core Features (Week 3-4)

#### 2.1 Authentication
- [ ] Implement Supabase Auth
- [ ] Create auth pages (sign up, sign in)
- [ ] Set up protected routes
- [ ] User profile creation

#### 2.2 Pin Management
- [ ] PinManagementPage component
- [ ] AddPersonModal
- [ ] EditPersonModal
- [ ] PinRow component
- [ ] Pin filtering
- [ ] API endpoints for pins CRUD

#### 2.3 Daily Plan
- [ ] DailyPlanPage component
- [ ] FastWinCard component
- [ ] ActionCard component
- [ ] Daily plan generation logic
- [ ] Action completion flows
- [ ] Progress indicator
- [ ] API endpoints for daily plans

### Phase 3: Action Management (Week 5-6)

#### 3.1 Action Completion
- [ ] FollowUpFlowModal
- [ ] FollowUpSchedulingModal
- [ ] SnoozeActionModal
- [ ] ActionNoteModal
- [ ] Action state machine implementation
- [ ] API endpoints for action updates

#### 3.2 Calendar Integration
- [ ] Google Calendar API setup
- [ ] Calendar connection flow
- [ ] Free/busy data fetching
- [ ] Capacity calculation logic
- [ ] Calendar settings UI

### Phase 4: Weekly Features (Week 7-8)

#### 4.1 Weekly Summary
- [ ] WeeklySummaryPage component
- [ ] Metrics grid
- [ ] Narrative summary generation
- [ ] Insight generation (AI)
- [ ] Weekly focus management
- [ ] API endpoints for summaries

#### 4.2 Content Prompts
- [ ] Content prompt generation (AI)
- [ ] ContentPromptsSection component
- [ ] Content prompt actions (copy, save)
- [ ] Content Ideas List page
- [ ] API endpoints for content prompts

### Phase 5: Onboarding (Week 9)

#### 5.1 Onboarding Flow
- [ ] OnboardingFlow component
- [ ] WelcomeStep
- [ ] PinFirstPersonStep
- [ ] CalendarConnectStep
- [ ] WeeklyFocusSetupStep
- [ ] FirstPlanReadyStep
- [ ] CompleteFastWinStep
- [ ] Progress tracking
- [ ] Onboarding completion logic

### Phase 6: Polish & Launch Prep (Week 10)

#### 6.1 Recovery Flows
- [ ] Low completion detection
- [ ] Inactivity recovery banners
- [ ] High completion celebration
- [ ] Adaptive plan generation

#### 6.2 Settings
- [ ] SettingsPage component
- [ ] Notification preferences
- [ ] Timezone settings
- [ ] Data export functionality
- [ ] Streak display
- [ ] Billing & Subscription section (plan status, manage billing button, paywall copy)

#### 6.3 Notifications
- [ ] Push notification setup
- [ ] Email notification setup (v0.2)
- [ ] Notification preferences UI
- [ ] Notification scheduling

#### 6.4 Testing & QA
- [ ] Unit tests for components
- [ ] Integration tests for flows
- [ ] E2E tests for critical paths
- [ ] Performance optimization
- [ ] Accessibility audit

#### 6.5 Launch Preparation
- [ ] Error tracking (Sentry)
- [ ] Analytics setup
- [ ] Documentation
- [ ] User feedback mechanism
- [ ] Production deployment
- [ ] Stripe production smoke test (checkout + webhook + gating)

---

## Technical Stack Summary

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components based on design system
- **State Management:** 
  - React Query (server state)
  - Zustand (client state)
- **Forms:** React Hook Form
- **Validation:** Zod

### Backend
- **API:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage (if needed)

### External Services
- **Calendar:** Google Calendar API
- **AI:** OpenAI GPT-4
- **Payments:** Stripe Checkout + Billing Portal
- **Hosting:** Vercel
- **Error Tracking:** Sentry (recommended)
- **Analytics:** PostHog or Mixpanel (recommended)

---

## File Structure

```
nextbestmove/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── daily-plan/
│   │   ├── pins/
│   │   ├── weekly-summary/
│   │   └── settings/
│   ├── onboarding/
│   ├── api/                      # API routes
│   │   ├── daily-plans/
│   │   ├── pins/
│   │   ├── actions/
│   │   ├── weekly-summaries/
│   │   └── billing/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # Base components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── pages/                    # Page components
│   │   ├── DailyPlanPage.tsx
│   │   ├── PinManagementPage.tsx
│   │   └── ...
│   ├── modals/                   # Modal components
│   │   ├── AddPersonModal.tsx
│   │   └── ...
│   └── onboarding/               # Onboarding components
│       └── ...
├── lib/
│   ├── api/                      # API clients
│   ├── hooks/                    # Custom hooks
│   ├── utils/                    # Utilities
│   └── validations/              # Zod schemas
├── stores/                       # Zustand stores
│   ├── uiStore.ts
│   └── ...
├── types/                        # TypeScript types
│   ├── index.ts
│   └── ...
├── supabase/
│   ├── migrations/
│   └── ...
└── public/
    └── ...
```

---

## Key Implementation Notes

### 1. Action State Machine
Implement the state machine from PRD Section 10.3 strictly:
- Handle all state transitions
- Validate transitions (e.g., can't go from ARCHIVED to SENT)
- Update related actions when state changes

### 2. Daily Plan Generation
- Must respect calendar capacity (Section 11.1)
- Priority scoring (Section 11.2)
- Fast Win selection (Section 11.2)
- Snooze date defaults (Section 11.4)

### 3. Weekly Summary AI
- Use OpenAI GPT-4 for:
  - Narrative summary generation
  - Insight generation
  - Weekly focus suggestion
  - Content prompt phrasing
- Fallback to templates if AI fails (Section 17)

### 4. Calendar Integration
- Read-only free/busy (Section 7.2)
- No event details, just busy slots
- Respect timezone (Section 16)

### 5. Onboarding Success Gates
Track and enforce (Section 13.2):
- 1 Pin created
- Weekly Focus set
- Fast Win completed

### 6. Billing & Access Control
- Stripe Checkout + Portal endpoints live under `/api/billing/*` and require auth.
- Webhook handler should upsert `billing_customers` / `billing_subscriptions` and mark `subscription_status` on the user session payload.
- Core workflows (daily plan, weekly summary) check subscription status; unpaid users see a consistent paywall overlay but keep read-only access to their data.

---

## Success Metrics Implementation

### 48-Hour Activation
- Track: Pin creation, Fast Win completion, action completions
- Analytics: PostHog or custom tracking
- Threshold: ≥ 60% of new users

### Weekly Habit
- Track: Days active, actions completed
- Analytics: Daily activity tracking
- Threshold: ≥ 50% active ≥ 4 days/week by Week 2

### Revenue Signal
- Track: Self-reported booked calls tied to actions
- UI: "Log booked call" button on actions
- Threshold: ≥ 40% log ≥ 1 call within 14 days

### Content Behavior
- Track: Content prompts saved/published
- Analytics: Content prompt interactions
- Threshold: ≥ 20% publish ≥ 1 post/week

---

## Next Steps

1. **Review all documentation** - Ensure alignment between PRD, mockups, UI specs, and components
2. **Set up development environment** - Follow Phase 1.1
3. **Start with base components** - Follow Phase 1.2
4. **Iterate on implementation** - Build incrementally, test frequently
5. **Reference documentation** - Keep PRD, UI specs, and component specs close during development

---

## Questions or Issues?

Refer to:
- **Product Questions:** `NextBestMove_PRD_v1.md`
- **Design Questions:** `UI_Specifications.md`
- **Implementation Questions:** `Component_Specifications.md`
- **Gap Analysis:** `PRD_Mockup_Gap_Analysis.md`

---

*Implementation Guide v1.0 - Ready for development*

