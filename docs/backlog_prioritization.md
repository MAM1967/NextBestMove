# P0 Remaining Items - T-Shirt Sizing & Prioritization

## Quick Wins (XS-S) - Do These First

### XS - Data Export Endpoint
**Effort:** 2-4 hours  
**Complexity:** Low  
**Dependencies:** None  
**Why:** Simple API endpoint + button. Good user value, low risk.

**Tasks:**
- Create `/api/export` endpoint
- Query all user data (pins, actions, plans, summaries)
- Format as JSON
- Add "Export Data" button to Settings
- Test download

---

### S - Content Prompt Generation
**Effort:** 4-8 hours  
**Complexity:** Low-Medium  
**Dependencies:** OpenAI API key, weekly summary data  
**Why:** Template-based with AI fallback. Can start simple, enhance later.

**Tasks:**
- Create template system for win/insight posts
- Add OpenAI integration (GPT-4)
- Save to `content_prompts` table
- Integrate with weekly summary generation
- Test with sample data

---

## Medium Effort (M) - Important but Manageable

### M - Email Preferences & Account Deletion
**Effort:** 8-12 hours  
**Complexity:** Medium  
**Dependencies:** Resend setup (already done), compliance review  
**Why:** Required for compliance. Straightforward but needs careful handling.

**Tasks:**
- Add email preferences UI to Settings
- Create unsubscribe endpoints
- Add "Delete my account" flow
- Database cleanup on deletion
- Test compliance requirements

---

### M - Weekly Summary Metrics Job
**Effort:** 8-12 hours  
**Complexity:** Medium  
**Dependencies:** Database queries, AI integration (if narrative needed)  
**Why:** Core feature, but can start with basic metrics, add AI later.

**Tasks:**
- Create metrics aggregation queries
- Generate basic narrative (can be template-based initially)
- Create insight generation logic
- Integrate content prompt generation
- Set up Vercel Cron job (or Supabase function)
- Test end-to-end

---

## Large Effort (L) - Significant Work

### L - Background Jobs
**Effort:** 12-16 hours  
**Complexity:** Medium-High  
**Dependencies:** Vercel Cron or Supabase functions, database functions  
**Why:** Multiple jobs, scheduling complexity, testing overhead.

**Tasks:**
- Set up Vercel Cron (or Supabase scheduled functions)
- Daily plan generation cron
- Weekly summary cron
- Auto-unsnooze job (daily)
- Auto-archive old actions (daily)
- Error handling and retries
- Monitoring and alerts
- Test all jobs

---

### XL - Onboarding Flow (6 Steps)
**Effort:** 16-24 hours  
**Complexity:** High  
**Dependencies:** All core features working, state management  
**Why:** Complex multi-step flow, significant UI/UX work, state management.

**Tasks:**
- Design 6-step flow UI
- Welcome screen
- Pin creation step
- Optional calendar connection
- Weekly focus selection
- First plan generation
- Fast win coaching
- Trial start integration
- State management (localStorage or state machine)
- Progress indicators
- Skip/back navigation
- Mobile responsive
- Test all flows

---

## Recommended Order

### Phase 1: Quick Wins (This Week)
1. **Data Export** (XS) - 2-4 hours
2. **Content Prompt Generation** (S) - 4-8 hours

**Total:** ~6-12 hours, high value, low risk

### Phase 2: Compliance & Core Features (Next Week)
3. **Email Preferences & Account Deletion** (M) - 8-12 hours
4. **Weekly Summary Metrics Job** (M) - 8-12 hours

**Total:** ~16-24 hours, essential for launch

### Phase 3: Infrastructure (Week 3)
5. **Background Jobs** (L) - 12-16 hours

**Total:** ~12-16 hours, production readiness

### Phase 4: User Experience (Week 4)
7. **Onboarding Flow** (XL) - 16-24 hours

**Total:** ~16-24 hours, polish for launch

---

## Alternative: Parallel Work

If you have multiple developers or want to parallelize:

**Track 1 (Backend/Automation):**
- Weekly Summary Metrics Job
- Background Jobs

**Track 2 (User Features):**
- Data Export
- Content Prompt Generation
- Email Preferences & Account Deletion

**Track 3 (UX/Design):**
- Onboarding Flow (can start design/planning while others work)

---

## Risk Assessment

**Low Risk:**
- Data Export
- Content Prompt Generation (can start with templates)
- Email Preferences

**Medium Risk:**
- Weekly Summary Metrics Job (AI integration complexity)

**High Risk:**
- Background Jobs (scheduling, reliability, monitoring)
- Onboarding Flow (complex state, UX critical)

---

## Estimated Total Remaining P0 Effort

- XS: 2-4 hours
- S: 4-8 hours
- M: 16-24 hours (2 items)
- L: 12-16 hours
- XL: 16-24 hours

**Total: 50-76 hours** (~6-10 days of focused work)

---

## Recommendation

**Start with Data Export (XS)** - Quick win, builds momentum, low risk.

**Then Content Prompt Generation (S)** - Completes weekly summary feature, good user value.

**Then Email Preferences (M)** - Compliance requirement, straightforward.

This gives you 3 completed items in ~14-24 hours, then you can tackle the larger items.




