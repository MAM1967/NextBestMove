# P2 Backlog Prioritization - January 2026

**Date:** December 10, 2025  
**Status:** 📋 Planning  
**Development Start:** January 2026  
**Code Freeze:** December 10-11, 2025 (48-hour monitoring period)

---

## Overview

This document prioritizes P2 backlog items for development starting in January 2026, with a focus on user support and feedback systems.

---

## Top Priority: Help & Support System

### 1. Help/FAQ System 🔴 **HIGHEST PRIORITY**

**Why:** Critical for launch - users need self-service help and a way to get support.

**Scope:**
- Help center page with searchable FAQ
- Common questions and answers
- Video tutorials/guides
- Contact support form (links to Jira integration)
- In-app help tooltips/contextual help

**Estimated Effort:** 2-3 days

**Dependencies:** None

**Success Criteria:**
- Users can find answers to common questions
- Support ticket volume reduced by 30%+
- Clear path to contact support for complex issues

---

## Priority Order for January 2026

### Phase 1: Support & Feedback (Weeks 1-2)

1. **Help/FAQ System** 🔴 **TOP PRIORITY**
   - Help center page
   - Searchable FAQ
   - Contact support form
   - Estimated: 2-3 days

2. **Jira Integration Form** 🔴 **HIGH PRIORITY**
   - Simple form with attachment capability
   - Sends bug reports and enhancement requests to Jira
   - User-facing feedback form
   - Estimated: 1-2 days

### Phase 2: Design & UX Improvements (Weeks 3-4)

3. **Design Token Compliance (Incremental)** 🟡 **MEDIUM PRIORITY**
   - Fix design token violations incrementally
   - Replace hardcoded values with tokens
   - Estimated: 8-10 hours total, 2-3 hours/week
   - **Status:** ⏱ POST-LAUNCH (can be done incrementally)

4. **Pricing Page UI** 🟡 **MEDIUM PRIORITY**
   - Standard vs Premium comparison
   - Annual savings calculator
   - Clear value propositions
   - Estimated: 2-3 days

### Phase 3: Feature Enhancements (Weeks 5-6)

5. **Company Research & Enrichment** 🟡 **MEDIUM PRIORITY**
   - Automatically enrich pre-call briefs
   - Company information, news, SEC filings
   - Premium feature
   - Estimated: 3-4 days

6. **Manual "Busy / Light day" Capacity Override** 🟢 **LOW PRIORITY**
   - Allow users to manually override capacity
   - Estimated: 1 day

7. **Action Detail Modal / History View** 🟢 **LOW PRIORITY**
   - View detailed history of an action
   - Estimated: 2 days

### Phase 4: Advanced Features (Weeks 7-8)

8. **Enhanced Pre-Call Brief Detection** 🟢 **LOW PRIORITY**
   - Recognize Zoom, Google Meet, Teams meetings
   - Estimated: 1 day

9. **POST_CALL Auto-Generation** 🟢 **LOW PRIORITY**
   - Auto-create POST_CALL actions when calls end
   - Estimated: 4-6 hours

10. **CALL_PREP Auto-Generation** 🟢 **LOW PRIORITY**
    - Auto-create CALL_PREP actions 24h before calls
    - Estimated: 4-6 hours

11. **NURTURE Auto-Generation** 🟢 **LOW PRIORITY**
    - Auto-create NURTURE actions for stale leads
    - Estimated: 3-4 hours

12. **CONTENT Action Conversion** 🟢 **LOW PRIORITY**
    - Convert weekly summary prompts to CONTENT actions
    - Estimated: 2-3 hours

### Phase 5: Nice-to-Have (Future)

13. **Additional Login Providers** 🟢 **LOW PRIORITY**
    - Apple, LinkedIn, etc.
    - Estimated: 2-3 days

14. **Deeper Analytics** 🟢 **LOW PRIORITY**
    - Deal progression metric, more insights
    - Estimated: 3-4 days

15. **Notification Delivery Channels** 🟢 **LOW PRIORITY**
    - Email/push beyond toggles
    - Estimated: 2-3 days

16. **Billing Pause Feature** 🟢 **LOW PRIORITY**
    - 30-day pause for inactive users
    - Estimated: 1-2 days

17. **Cancellation Feedback Analytics Page** 🟢 **LOW PRIORITY**
    - Admin page to analyze cancellation feedback
    - Estimated: 2-3 days

18. **Industry/Work Type Selection** 🟢 **LOW PRIORITY**
    - Trend-based content generation
    - Estimated: 3-4 days

---

## Detailed Plans

### 1. Help/FAQ System (Top Priority)

**Components:**
- `/help` page with searchable FAQ
- Common questions organized by category:
  - Getting Started
  - Daily Plans
  - Actions & Follow-ups
  - Calendar Integration
  - Billing & Subscriptions
  - Troubleshooting
- Contact support form (integrated with Jira)
- In-app contextual help tooltips

**Implementation:**
- Static FAQ content (markdown or JSON)
- Search functionality (client-side filtering)
- Contact form component
- Help center navigation

**Success Metrics:**
- FAQ page views
- Support ticket volume reduction
- User satisfaction with help content

---

### 2. Jira Integration Form (High Priority)

**Components:**
- Feedback form (`/feedback` or `/support`)
- Fields:
  - Type (Bug Report / Enhancement Request / Question)
  - Title
  - Description
  - Priority (User-selected or auto-determined)
  - Attachment support (screenshots, logs)
  - User email (auto-filled if logged in)
- Jira API integration
- Confirmation message

**Implementation:**
- Next.js API route to create Jira issues
- Jira REST API client
- File upload handling
- Error handling and retries

**Jira Setup Required:**
- API token
- Project key
- Issue type mapping
- Field mapping

**Success Metrics:**
- Tickets created successfully
- Response time to ticket creation
- User satisfaction with feedback process

---

## Timeline Estimate

**January 2026 (4 weeks):**

- **Week 1:** Help/FAQ System (2-3 days) + Jira Integration Form (1-2 days)
- **Week 2:** Design Token Compliance (incremental, 2-3 hours) + Pricing Page UI (2-3 days)
- **Week 3:** Company Research & Enrichment (3-4 days)
- **Week 4:** Manual capacity override + Action detail modal (3 days)

**Total Estimated Effort:** ~15-20 days

---

## Dependencies & Prerequisites

1. **Jira Account Setup:**
   - API token created
   - Project configured
   - Issue types defined
   - Field mapping documented

2. **FAQ Content:**
   - Common questions identified
   - Answers written
   - Screenshots/videos prepared

3. **Design Tokens:**
   - Missing tokens identified
   - Token values finalized

---

## Success Criteria

- Help/FAQ system reduces support ticket volume by 30%+
- Jira integration successfully creates tickets with attachments
- Users can easily find answers to common questions
- Feedback form is accessible and user-friendly
- Design token compliance improves consistency

---

**Next Steps:**
1. ✅ Prioritization complete
2. Set up Jira API access
3. Gather FAQ content
4. Begin development January 2026

