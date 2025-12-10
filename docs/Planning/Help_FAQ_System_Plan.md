# Help/FAQ System Plan

**Date:** December 10, 2025  
**Status:** 📋 Planning  
**Priority:** P2 - Top Priority (Phase 1)  
**Estimated Effort:** 2-3 days

---

## Overview

Create a comprehensive help center with searchable FAQ, tutorials, and support contact form to reduce support ticket volume and improve user experience.

---

## Goals

1. Provide self-service help for common questions
2. Reduce support ticket volume by 30%+
3. Improve user onboarding and adoption
4. Provide clear path to contact support
5. Build trust and confidence in the product

---

## Components

### 1. Help Center Page (`/help`)

**Sections:**
- Search bar (prominent)
- Category navigation
- Featured articles
- Popular questions
- Contact support CTA

**Categories:**
- Getting Started
- Daily Plans
- Actions & Follow-ups
- Calendar Integration
- Billing & Subscriptions
- Troubleshooting
- Account Settings

### 2. FAQ System

**Features:**
- Searchable FAQ (client-side search)
- Category filtering
- Expandable Q&A sections
- Related articles
- "Was this helpful?" feedback

**Content Structure:**
- Question (short, clear)
- Answer (detailed, with examples)
- Related links
- Last updated date

### 3. Contact Support Form

**Integration:**
- Links to Jira integration form
- Pre-fills issue type based on context
- Optional: Direct email support

### 4. In-App Help

**Features:**
- Contextual help tooltips
- "?" icons on key features
- Help links in modals
- Onboarding hints

---

## Content Requirements

### FAQ Categories & Questions

#### Getting Started
- How do I get started?
- What is a Fast Win?
- How do I add my first lead?
- How do daily plans work?
- What is a weekly focus?

#### Daily Plans
- How are daily plans generated?
- Why did I get fewer actions today?
- Can I customize my daily plan?
- What happens if I don't complete actions?
- How does calendar integration affect my plan?

#### Actions & Follow-ups
- How do I mark an action as done?
- What's the difference between "Got a reply" and "Done"?
- How do I snooze an action?
- What happens when I snooze?
- How do follow-ups work?

#### Calendar Integration
- How do I connect my calendar?
- Which calendars are supported?
- How does calendar integration affect my daily plan?
- Can I disconnect my calendar?
- What if my calendar isn't syncing?

#### Billing & Subscriptions
- How does the free trial work?
- What's included in Standard vs Premium?
- How do I upgrade/downgrade?
- How do I cancel my subscription?
- What happens after my trial ends?

#### Troubleshooting
- My daily plan isn't generating
- Calendar isn't connecting
- I'm not receiving emails
- Actions aren't showing up
- How do I reset my account?

---

## Technical Implementation

### 1. Help Center Page

**File:** `web/src/app/help/page.tsx`

**Components:**
- `HelpSearch` - Search bar component
- `HelpCategories` - Category navigation
- `HelpArticles` - Article list/grid
- `ContactSupport` - Support CTA

**Search Implementation:**
- Client-side search (Fuse.js or simple filter)
- Search across question + answer text
- Highlight matching terms
- Show results count

### 2. FAQ Data Structure

**File:** `web/src/data/faq.json` or `web/src/lib/help/faq.ts`

```typescript
interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  relatedArticles?: string[];
  lastUpdated: string;
  tags?: string[];
}
```

### 3. FAQ Component

**File:** `web/src/app/help/components/FAQSection.tsx`

**Features:**
- Expandable Q&A
- Search highlighting
- Category filtering
- Related articles links
- Feedback buttons

### 4. Article Page

**File:** `web/src/app/help/[slug]/page.tsx`

**Features:**
- Full article content
- Table of contents
- Related articles
- "Was this helpful?" feedback
- Back to help center

---

## Design Considerations

### Layout
- Clean, scannable design
- Clear hierarchy
- Mobile-responsive
- Fast loading

### Search
- Prominent search bar
- Instant results
- Highlight matches
- Show "No results" state

### Navigation
- Breadcrumbs
- Category sidebar
- Related articles
- Back to help center

---

## Content Management

### Initial Approach: Static Content

- Store FAQ in JSON/TypeScript file
- Easy to update via code
- Fast loading
- Version controlled

### Future: CMS Integration (Optional)

- Consider headless CMS (Contentful, Sanity)
- Allow non-technical updates
- Rich content support
- Analytics integration

---

## Analytics & Tracking

### Metrics to Track

1. **Usage:**
   - Help center page views
   - Search queries
   - Article views
   - Category clicks

2. **Effectiveness:**
   - "Was this helpful?" feedback
   - Support ticket volume reduction
   - Time on help pages
   - Bounce rate

3. **Content:**
   - Most viewed articles
   - Most searched terms
   - Articles with negative feedback

---

## User Experience Flow

1. **User needs help:**
   - Clicks "Help" link in navigation
   - Or clicks "?" icon on feature

2. **Help Center:**
   - Sees search bar
   - Browses categories
   - Finds relevant article

3. **Article:**
   - Reads answer
   - Clicks related articles if needed
   - Provides feedback

4. **If not helpful:**
   - Clicks "Contact Support"
   - Fills out feedback form
   - Submits to Jira

---

## Implementation Steps

### Phase 1: Basic Help Center (Day 1)

1. Create `/help` page
2. Add FAQ data structure
3. Implement search functionality
4. Create FAQ component
5. Add category navigation

### Phase 2: Content & Polish (Day 2)

1. Write FAQ content (all categories)
2. Add article pages
3. Implement "Was this helpful?" feedback
4. Add related articles
5. Mobile optimization

### Phase 3: Integration & Testing (Day 3)

1. Integrate with Jira feedback form
2. Add in-app help tooltips
3. Add help links throughout app
4. Testing & polish
5. Analytics setup

---

## Success Criteria

- Help center accessible from main navigation
- Search returns relevant results
- FAQ covers 80%+ of common questions
- Support ticket volume reduced by 30%+
- User satisfaction with help content >4/5

---

## Future Enhancements

1. **Video Tutorials:**
   - Embedded videos
   - Step-by-step guides
   - Screen recordings

2. **Interactive Guides:**
   - Product tours
   - Interactive tutorials
   - Guided onboarding

3. **Community Forum:**
   - User discussions
   - Peer support
   - Feature requests

4. **Live Chat:**
   - Real-time support
   - Chat widget
   - Integration with support system

---

## Dependencies

- FAQ content written
- Screenshots/videos prepared (optional)
- Jira integration form (for contact support)
- Analytics setup

---

## Timeline

**Estimated:** 2-3 days

- **Day 1:** Help center page + search + FAQ component (6-8 hours)
- **Day 2:** Content writing + article pages + polish (6-8 hours)
- **Day 3:** Integration + testing + analytics (4-6 hours)

---

**Status:** Ready for development in January 2026 (Top Priority)

