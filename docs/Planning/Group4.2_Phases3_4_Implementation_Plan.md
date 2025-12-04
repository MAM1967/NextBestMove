# Group 4.2 Phases 3 & 4: Implementation Plan

## Overview

This document provides a detailed implementation plan for:
- **Phase 3: Performance Timeline** - Historical performance visualization
- **Phase 4: Content Engine with Voice Learning** - AI-driven content generation learning user's tone

Both features are Premium plan features and should be gated accordingly.

---

## Phase 3: Performance Timeline

### Goal
Provide Premium users with a visual timeline of their historical performance metrics, helping them understand trends and patterns over time.

### User Value
- See performance trends over weeks/months
- Identify periods of high/low activity
- Understand correlation between actions and outcomes
- Visual feedback on progress

### Technical Approach

#### 3.1 Database Schema

**New Table: `performance_timeline_data`**

```sql
CREATE TABLE performance_timeline_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metrics JSONB NOT NULL, -- Store daily metrics
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_performance_timeline_user_date ON performance_timeline_data(user_id, date DESC);
```

**Metrics JSONB Structure:**
```json
{
  "actions_completed": 5,
  "actions_created": 3,
  "replies_received": 2,
  "pins_created": 1,
  "pins_archived": 0,
  "streak_day": 7,
  "completion_rate": 0.83,
  "reply_rate": 0.40
}
```

#### 3.2 Data Aggregation Job

**Daily Cron Job: `aggregate-performance-timeline`**

- **Schedule:** Run daily at 11:59 PM UTC
- **Purpose:** Aggregate daily metrics for all active users
- **Logic:**
  1. For each user with active subscription or trial:
    2. Calculate metrics for previous day:
       - Actions completed (state = DONE, REPLIED, SENT)
       - Actions created
       - Replies received (actions with replied_at)
       - Pins created
       - Pins archived
       - Current streak day
       - Completion rate (completed / total actions)
       - Reply rate (replies / outreach actions)
    3. Upsert into `performance_timeline_data`
  4. Keep last 365 days of data (archive older)

**Implementation:**
- Create API endpoint: `POST /api/cron/aggregate-performance-timeline`
- Add to cron-job.org (daily at 11:59 PM UTC)
- Use Supabase service role for database access

#### 3.3 API Endpoint

**GET `/api/performance-timeline`**

**Query Parameters:**
- `startDate` (optional): ISO date string, default: 30 days ago
- `endDate` (optional): ISO date string, default: today
- `granularity` (optional): "day" | "week" | "month", default: "day"

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-01",
      "metrics": {
        "actions_completed": 5,
        "actions_created": 3,
        "replies_received": 2,
        "pins_created": 1,
        "pins_archived": 0,
        "streak_day": 7,
        "completion_rate": 0.83,
        "reply_rate": 0.40
      }
    }
  ],
  "summary": {
    "total_days": 30,
    "avg_completion_rate": 0.75,
    "avg_reply_rate": 0.35,
    "total_actions_completed": 150,
    "total_replies_received": 60
  }
}
```

**Premium Gating:**
- Check subscription status
- Return 402 if not Premium
- Include `requiresUpgrade: true` in response

#### 3.4 Frontend Components

**Page: `/app/insights/timeline`**

**Components:**

1. **PerformanceTimelinePage.tsx**
   - Main page component
   - Date range picker (last 7/30/90/365 days)
   - Granularity selector (day/week/month)
   - Timeline visualization
   - Summary cards

2. **TimelineChart.tsx**
   - Line/area chart visualization
   - Multiple metrics overlay
   - Interactive tooltips
   - Zoom/pan functionality
   - Uses Chart.js or Recharts library

3. **TimelineSummaryCards.tsx**
   - Average completion rate
   - Average reply rate
   - Total actions completed
   - Total replies received
   - Best performing period

4. **MetricSelector.tsx**
   - Toggle metrics on/off
   - Color coding per metric
   - Legend

**UI/UX:**
- Clean, modern timeline visualization
- Color-coded metrics (completion rate = green, reply rate = blue, etc.)
- Hover tooltips showing exact values
- Responsive design (mobile-friendly)
- Loading states
- Empty state for new users

#### 3.5 Implementation Steps

1. **Database Migration** (1 day)
   - Create `performance_timeline_data` table
   - Add indexes
   - Create migration file

2. **Backend API** (1 day)
   - Create aggregation cron job endpoint
   - Create GET `/api/performance-timeline` endpoint
   - Add Premium gating
   - Test with sample data

3. **Frontend Components** (2 days)
   - Create PerformanceTimelinePage
   - Integrate charting library (Recharts recommended)
   - Build TimelineChart component
   - Build summary cards
   - Add date range picker
   - Add Premium gating UI

4. **Testing** (1 day)
   - Test with various date ranges
   - Test with different granularities
   - Test Premium gating
   - Test empty states
   - Test mobile responsiveness

**Total Estimated Effort: 5 days**

---

## Phase 4: Content Engine with Voice Learning

### Goal
Enhance content prompt generation by learning from user's writing style and voice, making generated content more personalized and authentic.

### User Value
- Content that sounds like the user wrote it
- Improved content quality and relevance
- Time saved on content creation
- Better engagement with personalized tone

### Technical Approach

#### 4.1 Database Schema

**New Table: `user_voice_profile`**

```sql
CREATE TABLE user_voice_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  voice_characteristics JSONB NOT NULL, -- Learned voice characteristics
  sample_count INTEGER NOT NULL DEFAULT 0, -- Number of samples used
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_voice_profile_user ON user_voice_profile(user_id);
```

**Voice Characteristics JSONB Structure:**
```json
{
  "tone": "professional-friendly",
  "formality": "semi-formal",
  "sentence_length": "medium",
  "vocabulary_level": "intermediate",
  "common_phrases": ["looking forward to", "happy to help", "let's connect"],
  "writing_patterns": {
    "greeting_style": "warm",
    "closing_style": "professional",
    "punctuation_preference": "standard"
  },
  "topics": ["networking", "business development", "partnerships"],
  "sample_texts": [
    "Sample text 1...",
    "Sample text 2..."
  ]
}
```

**New Column: `content_prompts.user_edited`**

```sql
ALTER TABLE content_prompts 
ADD COLUMN user_edited BOOLEAN DEFAULT false,
ADD COLUMN edited_text TEXT;
```

#### 4.2 Voice Learning System

**Data Sources for Learning:**
1. **User-edited content prompts** - When user edits a generated prompt
2. **Action notes** - User's notes on actions
3. **Pin notes** - User's notes on pins
4. **Weekly summary feedback** - If user provides feedback

**Learning Process:**

1. **Text Collection:**
   - Collect user-written text from:
     - Edited content prompts (`content_prompts.edited_text`)
     - Action notes (`actions.notes`)
     - Pin notes (`person_pins.notes`)
   - Minimum 5 samples needed to build profile
   - Prefer longer samples (>50 words)

2. **Analysis:**
   - Use OpenAI API to analyze writing style:
     - Tone (professional, casual, friendly, etc.)
     - Formality level
     - Sentence structure
     - Vocabulary level
     - Common phrases
     - Writing patterns
   - Store analysis in `user_voice_profile.voice_characteristics`

3. **Profile Update:**
   - Update profile when new samples available
   - Weight recent samples more heavily
   - Maintain rolling window of last 20 samples

**Implementation:**
- Create API endpoint: `POST /api/voice-profile/analyze`
- Trigger analysis when:
  - User edits 5+ content prompts
  - User has 10+ action/pin notes
  - Manual trigger from settings

#### 4.3 Enhanced Content Generation

**Updated Content Prompt Generation:**

1. **Check for Voice Profile:**
   - If user has voice profile, include in prompt
   - If no profile, use default generation

2. **Enhanced Prompt:**
   ```
   Generate a LinkedIn post about [topic] based on the user's writing style:
   
   User's writing style:
   - Tone: [tone]
   - Formality: [formality]
   - Common phrases: [phrases]
   - Writing patterns: [patterns]
   
   Topic: [topic from weekly summary]
   Context: [relevant context from actions/pins]
   
   Generate content that matches the user's voice and style.
   ```

3. **Generation:**
   - Use OpenAI API with voice profile context
   - Generate content matching user's style
   - Include user's common phrases naturally
   - Match formality and tone

**API Endpoint: `POST /api/content-prompts/generate`**

**Request:**
```json
{
  "topic": "Recent partnership success",
  "context": "Closed partnership with TechCorp",
  "use_voice_profile": true
}
```

**Response:**
```json
{
  "success": true,
  "prompt": "Excited to share that we've partnered with TechCorp...",
  "voice_profile_used": true
}
```

#### 4.4 Frontend Components

**Settings Section: `Settings → Content → Voice Learning`**

**Components:**

1. **VoiceLearningSection.tsx**
   - Show voice profile status
   - Display learned characteristics
   - Show sample count
   - "Regenerate Profile" button
   - Privacy notice

2. **VoiceProfileCard.tsx**
   - Display tone, formality, etc.
   - Show sample texts used
   - Last updated timestamp

3. **ContentPromptEditor.tsx** (Enhanced)
   - Add "Edit" button to generated prompts
   - Save edited version
   - Trigger voice profile update

**UI/UX:**
- Clear explanation of voice learning
- Privacy notice (data used only for content generation)
- Option to disable voice learning
- Visual indicators when voice profile is used

#### 4.5 Implementation Steps

1. **Database Migration** (0.5 days)
   - Create `user_voice_profile` table
   - Add `user_edited` and `edited_text` to `content_prompts`
   - Create migration file

2. **Voice Analysis Service** (2 days)
   - Create voice analysis function
   - Integrate with OpenAI API
   - Build prompt for style analysis
   - Store results in database
   - Handle edge cases (insufficient samples, etc.)

3. **Content Generation Enhancement** (2 days)
   - Update content prompt generation
   - Include voice profile in prompts
   - Test with various voice profiles
   - Fallback to default if no profile

4. **Frontend Components** (2 days)
   - Create VoiceLearningSection
   - Create VoiceProfileCard
   - Enhance ContentPromptEditor
   - Add edit functionality
   - Add Premium gating

5. **Data Collection** (1 day)
   - Collect samples from existing data
   - Build initial profiles for active users
   - Create background job for profile updates

6. **Testing** (1 day)
   - Test voice analysis accuracy
   - Test content generation with voice profile
   - Test Premium gating
   - Test edge cases (no samples, etc.)

**Total Estimated Effort: 8.5 days**

---

## Premium Gating Strategy

Both features should be gated behind Premium plan:

### API Level
- Check subscription status in API endpoints
- Return 402 with `UPGRADE_REQUIRED` for Standard users
- Include `requiresUpgrade: true` in error response

### Frontend Level
- Show upgrade prompt when Standard users access
- Redirect to Stripe customer portal
- Display teaser content with upgrade CTA

### Database Level
- RLS policies ensure users can only access their own data
- Service role used for aggregation jobs

---

## Dependencies

### Phase 3 Dependencies
- Existing `actions`, `person_pins`, `users` tables
- Cron job infrastructure (cron-job.org)
- Charting library (Recharts recommended)

### Phase 4 Dependencies
- Existing `content_prompts` table
- OpenAI API access
- BYOK support for OpenAI (already implemented)

---

## Success Metrics

### Phase 3: Performance Timeline
- **Adoption rate:** % of Premium users who view timeline
- **Engagement:** Average views per user per week
- **Retention:** Users who view timeline are more likely to renew

### Phase 4: Content Engine with Voice Learning
- **Profile creation rate:** % of Premium users with voice profiles
- **Content quality:** User satisfaction with generated content
- **Edit rate:** % of prompts edited by users (lower = better)
- **Usage:** Increase in content prompt usage

---

## Future Enhancements

### Phase 3 Enhancements
- Export timeline data as CSV/PDF
- Compare periods (this month vs last month)
- Goal setting and tracking
- Custom date ranges

### Phase 4 Enhancements
- Voice input for content creation
- Multiple voice profiles (work vs personal)
- Voice profile sharing/collaboration
- Real-time style suggestions

---

## Testing Plan

### Phase 3 Testing
1. **Data Aggregation:**
   - Test cron job with various user data
   - Test edge cases (no actions, all actions, etc.)
   - Verify data accuracy

2. **API:**
   - Test various date ranges
   - Test different granularities
   - Test Premium gating
   - Test empty states

3. **Frontend:**
   - Test timeline visualization
   - Test date range picker
   - Test metric toggles
   - Test mobile responsiveness

### Phase 4 Testing
1. **Voice Analysis:**
   - Test with various writing samples
   - Test with insufficient samples
   - Verify analysis accuracy

2. **Content Generation:**
   - Test with voice profile
   - Test without voice profile
   - Compare generated content quality
   - Test Premium gating

3. **Frontend:**
   - Test voice profile display
   - Test content editing
   - Test profile regeneration
   - Test Premium gating

---

## Implementation Timeline

### Phase 3: Performance Timeline
- **Week 1:** Database + Backend API (2 days)
- **Week 1-2:** Frontend Components (2 days)
- **Week 2:** Testing + Polish (1 day)

### Phase 4: Content Engine with Voice Learning
- **Week 1:** Database + Voice Analysis (2.5 days)
- **Week 2:** Content Generation Enhancement (2 days)
- **Week 2-3:** Frontend Components (2 days)
- **Week 3:** Data Collection + Testing (2 days)

**Total Timeline: 3 weeks for both phases (can be done in parallel)**

---

## Risk Mitigation

### Technical Risks
- **Charting library performance:** Use lightweight library, optimize rendering
- **Voice analysis accuracy:** Start with simple analysis, iterate based on feedback
- **Data aggregation performance:** Use database indexes, batch processing

### Product Risks
- **Low adoption:** Ensure clear value proposition, good UX
- **Privacy concerns:** Clear privacy notice, opt-out option
- **Content quality:** Allow easy editing, iterate on prompts

---

## Next Steps

1. Review and approve implementation plan
2. Set up development environment
3. Start with Phase 3 (simpler, can validate approach)
4. Then implement Phase 4 (more complex, builds on Phase 3 learnings)
5. Test thoroughly before release
6. Monitor metrics post-launch

---

_Last updated: December 2025_

