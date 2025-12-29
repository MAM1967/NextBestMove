# Tier Feature Implementation Checklist

**Last Updated:** 2025-12-28  
**Purpose:** Verify that all features advertised on the pricing page are properly implemented and gated by tier

---

## Legend

- ✅ **Complete/Deployed** - Feature is fully implemented and working as advertised
- ⚠️ **Partial/Deployed** - Feature is implemented but may need refinement or tier gating
- ❌ **Backlog** - Feature is not yet implemented or needs significant work

---

## FREE TIER - "Memory Relief"

### Core Features

| Feature                       | Advertised    | Status               | Notes                                                                                         |
| ----------------------------- | ------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| **Active relationships**      | 5             | ✅ Complete/Deployed | Lead limit enforced via `checkLeadLimit()` - Free tier: 5 active leads                        |
| **Archived relationships**    | ✓             | ✅ Complete/Deployed | Archive functionality available to all tiers                                                  |
| **Manual daily plan**         | ✓             | ✅ Complete/Deployed | Free tier can manually generate plans via `/api/daily-plans/generate`                         |
| **Automatic daily plan**      | -             | ✅ Complete/Deployed | Free tier blocked from automatic generation (cron job checks tier)                            |
| **Actions per day**           | 2-3           | ⚠️ Partial/Deployed  | Capacity calculation exists but not explicitly limited to 2-3 for Free tier                   |
| **Fast Win**                  | ✓             | ✅ Complete/Deployed | Fast Win selection works for all tiers                                                        |
| **Follow-up scheduling**      | Limited       | ⚠️ Partial/Deployed  | Follow-up creation works but "Limited" definition unclear (may need explicit limit)           |
| **Relationship history**      | ✓             | ✅ Complete/Deployed | Action history available to all tiers                                                         |
| **Weekly summary**            | Basic (no AI) | ⚠️ Partial/Deployed  | Weekly summaries generated but AI usage not tier-gated (currently uses placeholder functions) |
| **Weekly insights**           | -             | ✅ Complete/Deployed | Insights not generated for Free tier (only Standard/Premium)                                  |
| **Content generation**        | -             | ✅ Complete/Deployed | Content prompts only generated if ≥6 actions (Standard/Premium feature)                       |
| **Calendar free/busy sizing** | -             | ✅ Complete/Deployed | Calendar connection requires Standard/Premium (paywall gated)                                 |
| **Calendar event details**    | -             | ✅ Complete/Deployed | Calendar features require Standard/Premium                                                    |
| **Call briefs**               | -             | ✅ Complete/Deployed | Pre-call briefs require Standard/Premium                                                      |
| **Pre-call notes**            | -             | ✅ Complete/Deployed | Pre-call notes are Premium-only feature                                                       |
| **Pattern views & trends**    | -             | ✅ Complete/Deployed | Pattern detection is Premium-only (gated via `hasProfessionalFeature()`)                      |
| **Momentum & timeline views** | -             | ✅ Complete/Deployed | Performance timeline is Premium-only (gated via `hasProfessionalFeature()`)                   |
| **Data export**               | Basic         | ⚠️ Partial/Deployed  | Currently only JSON export exists - "Basic" vs "CSV" vs "Advanced" not differentiated         |
| **Support level**             | Standard      | ✅ Complete/Deployed | Support level is operational (no tier differentiation implemented yet)                        |

---

## STANDARD TIER - "Decision Automation"

### Core Features

| Feature                       | Advertised   | Status               | Notes                                                                                          |
| ----------------------------- | ------------ | -------------------- | ---------------------------------------------------------------------------------------------- |
| **Active relationships**      | 20           | ✅ Complete/Deployed | Lead limit enforced via `checkLeadLimit()` - Standard tier: 20 active leads                    |
| **Archived relationships**    | ✓            | ✅ Complete/Deployed | Archive functionality available to all tiers                                                   |
| **Manual daily plan**         | ✓            | ✅ Complete/Deployed | Manual generation available to all tiers                                                       |
| **Automatic daily plan**      | ✓            | ✅ Complete/Deployed | Automatic generation enabled for Standard/Premium (cron job checks tier)                       |
| **Actions per day**           | 5-6          | ⚠️ Partial/Deployed  | Capacity calculation exists (standard = 5-6) but not explicitly tier-gated                     |
| **Fast Win**                  | ✓            | ✅ Complete/Deployed | Fast Win selection works for all tiers                                                         |
| **Follow-up scheduling**      | Unlimited    | ✅ Complete/Deployed | Follow-up creation unlimited for Standard/Premium                                              |
| **Relationship history**      | ✓            | ✅ Complete/Deployed | Action history available to all tiers                                                          |
| **Weekly summary**            | AI-assisted  | ⚠️ Partial/Deployed  | Weekly summaries use placeholder functions - AI integration not fully tiered (needs AI gating) |
| **Weekly insights**           | 1/week       | ⚠️ Partial/Deployed  | Insights generated but frequency not explicitly limited to 1/week for Standard                 |
| **Content generation**        | Limited      | ⚠️ Partial/Deployed  | Content prompts generated (max 2) but "Limited" vs "High" differentiation not implemented      |
| **Calendar free/busy sizing** | ✓            | ✅ Complete/Deployed | Calendar connection available for Standard/Premium                                             |
| **Calendar event details**    | ✓            | ✅ Complete/Deployed | Calendar event details available for Standard/Premium                                          |
| **Call briefs**               | ✓ (no notes) | ⚠️ Partial/Deployed  | Pre-call briefs available but "no notes" vs "with notes" differentiation needs verification    |
| **Pre-call notes**            | -            | ✅ Complete/Deployed | Pre-call notes correctly blocked for Standard (Premium-only)                                   |
| **Pattern views & trends**    | -            | ✅ Complete/Deployed | Pattern detection correctly blocked for Standard (Premium-only)                                |
| **Momentum & timeline views** | -            | ✅ Complete/Deployed | Performance timeline correctly blocked for Standard (Premium-only)                             |
| **Data export**               | CSV          | ⚠️ Partial/Deployed  | Currently only JSON export exists - CSV export not implemented                                 |
| **Support level**             | Standard     | ✅ Complete/Deployed | Support level is operational (no tier differentiation implemented yet)                         |

---

## PREMIUM TIER - "Intelligence & Leverage"

### Core Features

| Feature                       | Advertised     | Status               | Notes                                                                                                       |
| ----------------------------- | -------------- | -------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Active relationships**      | Unlimited      | ✅ Complete/Deployed | Lead limit enforced via `checkLeadLimit()` - Premium tier: Infinity (unlimited)                             |
| **Archived relationships**    | ✓              | ✅ Complete/Deployed | Archive functionality available to all tiers                                                                |
| **Manual daily plan**         | ✓              | ✅ Complete/Deployed | Manual generation available to all tiers                                                                    |
| **Automatic daily plan**      | ✓              | ✅ Complete/Deployed | Automatic generation enabled for Standard/Premium                                                           |
| **Actions per day**           | 8-10           | ⚠️ Partial/Deployed  | Capacity calculation exists (heavy = 7-8) but not explicitly set to 8-10 for Premium                        |
| **Fast Win**                  | ✓              | ✅ Complete/Deployed | Fast Win selection works for all tiers                                                                      |
| **Follow-up scheduling**      | Unlimited      | ✅ Complete/Deployed | Follow-up creation unlimited for Standard/Premium                                                           |
| **Relationship history**      | ✓              | ✅ Complete/Deployed | Action history available to all tiers                                                                       |
| **Weekly summary**            | Advanced AI    | ⚠️ Partial/Deployed  | Weekly summaries use placeholder functions - "Advanced AI" vs "AI-assisted" differentiation not implemented |
| **Weekly insights**           | Multiple       | ⚠️ Partial/Deployed  | Insights generated but "Multiple" vs "1/week" differentiation not implemented                               |
| **Content generation**        | High           | ⚠️ Partial/Deployed  | Content prompts generated (max 2) but "High" vs "Limited" differentiation not implemented                   |
| **Calendar free/busy sizing** | ✓              | ✅ Complete/Deployed | Calendar connection available for Standard/Premium                                                          |
| **Calendar event details**    | ✓              | ✅ Complete/Deployed | Calendar event details available for Standard/Premium                                                       |
| **Call briefs**               | ✓ (with notes) | ⚠️ Partial/Deployed  | Pre-call briefs available - need to verify Premium gets notes while Standard doesn't                        |
| **Pre-call notes**            | ✓              | ⚠️ Partial/Deployed  | Pre-call briefs exist but need to verify Premium-specific notes feature                                     |
| **Pattern views & trends**    | ✓              | ✅ Complete/Deployed | Pattern detection gated via `hasProfessionalFeature("pattern_detection")` - Premium only                    |
| **Momentum & timeline views** | ✓              | ✅ Complete/Deployed | Performance timeline gated via `hasProfessionalFeature("performance_timeline")` - Premium only              |
| **Data export**               | Advanced       | ⚠️ Partial/Deployed  | Currently only JSON export exists - "Advanced" export format not implemented                                |
| **Support level**             | Priority       | ⚠️ Partial/Deployed  | Support level is operational but "Priority" vs "Standard" differentiation not implemented                   |

---

## Summary by Status

### ✅ Complete/Deployed (13 features)

- Lead limits (Free: 5, Standard: 20, Premium: unlimited)
- Archived relationships
- Manual daily plan
- Automatic daily plan (tier-gated)
- Fast Win
- Relationship history
- Calendar features (tier-gated)
- Premium feature gates (pattern detection, timeline)
- Call briefs (tier-gated)
- Pre-call notes (Premium-only gate)
- Weekly insights (tier-gated)
- Content generation (tier-gated)

### ⚠️ Partial/Deployed (6 features need refinement)

1. **Actions per day** - Capacity calculation exists but not explicitly tier-limited (Free: 2-3, Standard: 5-6, Premium: 8-10)
2. **Follow-up scheduling** - "Limited" for Free tier needs explicit definition/implementation
3. **Weekly summary AI levels** - Currently uses placeholder functions; needs tier-based AI gating (Free: basic, Standard: AI-assisted, Premium: advanced)
4. **Weekly insights frequency** - "1/week" vs "Multiple" differentiation not implemented
5. **Content generation limits** - "Limited" vs "High" differentiation not implemented
6. **Call briefs notes** - Need to verify Standard gets briefs without notes, Premium gets briefs with notes
7. **Data export levels** - Only JSON exists; need CSV (Standard) and Advanced (Premium) formats
8. **Support level** - "Priority" vs "Standard" differentiation not implemented

### ❌ Backlog (0 features)

- All advertised features have at least partial implementation

---

## Action Items

### High Priority (Feature Parity)

1. **Implement tier-based AI for weekly summaries**

   - Free: Basic (placeholder functions only)
   - Standard: AI-assisted (use AI for narrative/insight)
   - Premium: Advanced AI (enhanced prompts, multiple insights)

2. **Differentiate call briefs by tier**

   - Standard: Pre-call briefs without AI-generated notes
   - Premium: Pre-call briefs with AI-generated notes (verify implementation)

3. **Implement data export tiers**

   - Free: Basic JSON (current)
   - Standard: CSV export format
   - Premium: Advanced export (CSV + JSON + additional metadata)

4. **Clarify "Limited" follow-up scheduling for Free tier**
   - Define what "Limited" means (e.g., max 3 follow-ups per week)
   - Implement enforcement if needed

### Medium Priority (Enhancement)

5. **Explicit actions per day limits**

   - Free: Cap at 2-3 actions
   - Standard: Cap at 5-6 actions
   - Premium: Cap at 8-10 actions (or remove cap)

6. **Weekly insights frequency**

   - Standard: Limit to 1 insight per week
   - Premium: Allow multiple insights

7. **Content generation differentiation**

   - Standard: "Limited" (e.g., 1 prompt per week)
   - Premium: "High" (e.g., 2 prompts per week, enhanced quality)

8. **Support level implementation**
   - Standard: Standard support (email response within 48h)
   - Premium: Priority support (email response within 24h, dedicated channel)

---

## Implementation Plans

### NEX-34: Tier-Based AI for Weekly Summaries

**Status**: Backlog  
**Priority**: High  
**Linear Ticket**: [NEX-34](https://linear.app/nextbestmove/issue/NEX-34)

**File to modify**: `web/src/lib/summaries/generate-weekly-summary.ts`

**Current state**: All tiers use placeholder functions (`generateNarrativeSummary`, `generateInsight`, `generateNextWeekFocus`)

**Implementation steps**:

1. Import `getUserTier` from `@/lib/billing/tier` in `generate-weekly-summary.ts`
2. In `generateWeeklySummaryForUser`, fetch user tier before generating summary:
   ```typescript
   const tier = await getUserTier(supabase, userId);
   ```
3. **Free tier**: Keep existing placeholder functions (no changes)
4. **Standard tier**:
   - Replace `generateNarrativeSummary` call with AI call using existing AI helper functions
   - Replace `generateInsight` call with AI call
   - Keep `generateNextWeekFocus` as placeholder (or add basic AI)
5. **Premium tier**:
   - Use enhanced AI prompts for narrative (more context, better prompts)
   - Use enhanced AI prompts for insights (allow multiple insights)
   - Use AI for next week focus with enhanced prompts
6. Add tier check before AI calls:
   ```typescript
   if (tier === "free") {
     // Use placeholder functions
   } else if (tier === "standard") {
     // Use basic AI
   } else if (tier === "premium") {
     // Use enhanced AI
   }
   ```

**AI Integration**: Use existing AI helper functions from `@/lib/ai/content-prompts` or create new helpers in `@/lib/ai/weekly-summary`

**Testing**:

- Verify Free tier gets placeholders
- Verify Standard gets basic AI-generated narrative and insight
- Verify Premium gets enhanced AI with multiple insights

---

### NEX-35: Differentiate Call Briefs by Tier

**Status**: Backlog  
**Priority**: High  
**Linear Ticket**: [NEX-35](https://linear.app/nextbestmove/issue/NEX-35)

**File to modify**: `web/src/app/api/pre-call-briefs/route.ts` and `web/src/lib/pre-call-briefs/generation.ts`

**Current state**: Line 29-35 checks if user is Premium, but all users get same brief generation via `generatePreCallBrief()`

**Implementation steps**:

1. Verify current implementation: Check if `generatePreCallBrief()` in `web/src/lib/pre-call-briefs/generation.ts` generates AI notes
2. **Standard tier**:
   - Modify `generatePreCallBrief()` to accept a `includeAINotes: boolean` parameter
   - For Standard: Pass `includeAINotes: false` - only include event context, lead info, action history
   - Skip AI-generated notes and suggestions
3. **Premium tier**:
   - Pass `includeAINotes: true` - include full AI-generated notes, suggestions, context
   - Keep existing full brief generation
4. Update API route to pass tier-based flag to `generatePreCallBrief()`:
   ```typescript
   const includeAINotes = isPremium;
   const brief = await generatePreCallBrief(
     adminSupabase,
     user.id,
     call,
     includeAINotes
   );
   ```
5. Update brief content structure to clearly separate "event context" (Standard) from "AI notes" (Premium)

**Testing**:

- Verify Standard users see basic briefs with event context only
- Verify Premium users see enhanced briefs with AI-generated notes and suggestions

---

### NEX-36: Tier-Based Data Export Formats

**Status**: Backlog  
**Priority**: High  
**Linear Ticket**: [NEX-36](https://linear.app/nextbestmove/issue/NEX-36)

**File to modify**: `web/src/app/api/export/route.ts`

**Current state**: Only returns JSON format for all tiers

**Implementation steps**:

1. Import `getUserTier` from `@/lib/billing/tier`
2. Add query parameter or Accept header support for format selection (optional enhancement)
3. **Free tier**:
   - Return JSON only (current implementation)
   - Keep existing response format
4. **Standard tier**:
   - Add CSV export functionality
   - Create helper function `generateCSVExport(data)` to convert JSON to CSV
   - Export main tables: leads, actions, daily_plans, weekly_summaries as separate CSV files or combined
   - Return CSV with proper headers: `Content-Type: text/csv`
5. **Premium tier**:
   - Return both CSV and JSON formats
   - Add enhanced metadata: export statistics, tier info, export version
   - Create ZIP file containing: `data.json`, `data.csv`, `metadata.json`
   - Use a library like `jszip` or `archiver` for ZIP creation
   - Return ZIP with headers: `Content-Type: application/zip`
6. Add tier check: `const tier = await getUserTier(supabase, user.id)`
7. Route to appropriate export format based on tier:
   ```typescript
   if (tier === "free") {
     return NextResponse.json(exportData, { headers: {...} });
   } else if (tier === "standard") {
     return new NextResponse(csvData, { headers: { "Content-Type": "text/csv", ...} });
   } else if (tier === "premium") {
     return new NextResponse(zipBuffer, { headers: { "Content-Type": "application/zip", ...} });
   }
   ```

**Dependencies**: May need to add `jszip` or similar for Premium tier ZIP export

**Testing**:

- Verify Free tier gets JSON only
- Verify Standard tier gets CSV format
- Verify Premium tier gets ZIP containing JSON, CSV, and metadata files

---

### NEX-37: Limited Follow-Up Scheduling for Free Tier

**Status**: Backlog  
**Priority**: Medium  
**Linear Ticket**: [NEX-37](https://linear.app/nextbestmove/issue/NEX-37)

**Files to modify**:

- `web/src/app/app/actions/page.tsx` (handleGotReply function)
- `web/src/app/api/actions/route.ts` (POST endpoint for creating actions)

**Current state**: Follow-up creation is unlimited for all tiers

**Implementation steps**:

1. **Define limit**: Decide on limit (suggest: 3 follow-ups per week for Free tier)
2. **Backend enforcement**:
   - In `POST /api/actions`, check user tier before creating FOLLOW_UP actions
   - For Free tier: Count existing FOLLOW_UP actions created this week (Monday 00:00 to Sunday 23:59 in user timezone)
   - If limit reached, return 403 with message: "Free tier allows 3 follow-ups per week. Upgrade to Standard for unlimited follow-ups."
3. **Frontend enforcement**:
   - In `handleGotReply` in `page.tsx`, check limit before creating follow-up
   - Show warning toast if approaching limit (e.g., "2 of 3 follow-ups used this week")
   - Show error toast if limit reached with upgrade CTA
4. **UI indicator**:
   - Add limit indicator in actions page header for Free tier users
   - Show: "Follow-ups: 2/3 this week" or similar
   - Make it clickable to show upgrade modal
5. **Weekly reset**: Limit resets weekly (Monday 00:00 user timezone)

**Implementation details**:

- Create helper function `checkFollowUpLimit(userId, tier)` that:
  - Returns `{ canCreate: boolean, currentCount: number, limit: number }`
  - Calculates week start (Monday) based on user timezone
  - Counts FOLLOW_UP actions created this week
- In API route, check limit before creating action:
  ```typescript
  if (action_type === "FOLLOW_UP") {
    const limitCheck = await checkFollowUpLimit(user.id, tier);
    if (!limitCheck.canCreate) {
      return NextResponse.json(
        { error: "Follow-up limit reached" },
        { status: 403 }
      );
    }
  }
  ```

**Testing**:

- Verify Free tier users can't create more than 3 follow-ups per week
- Verify Standard/Premium users have unlimited follow-ups
- Verify limit resets weekly on Monday
- Verify UI shows limit indicator for Free tier users

---

## Verification Commands

To verify feature gates are working:

```bash
# Check lead limits
curl -H "Authorization: Bearer <token>" /api/billing/check-lead-limit

# Check premium features
curl -H "Authorization: Bearer <token>" /api/billing/check-premium-feature?feature=pattern_detection
curl -H "Authorization: Bearer <token>" /api/billing/check-premium-feature?feature=performance_timeline
curl -H "Authorization: Bearer <token>" /api/billing/check-premium-feature?feature=pre_call_briefs

# Check tier
curl -H "Authorization: Bearer <token>" /api/billing/tier
```

---

## Notes

- Most core features are properly gated by tier
- AI features need tier-based differentiation (currently all use same logic)
- Data export needs format differentiation (CSV, Advanced)
- Some "Limited" vs "Unlimited" features need explicit enforcement
- Support level differentiation is operational but not feature-gated
