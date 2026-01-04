# Tooltip Implementation Plan

**Priority:** P2 (Same as Help/FAQ System)  
**Estimated Time:** 2-3 days  
**Status:** Planning

---

## Overview

Add contextual tooltips throughout the NextBestMove app to help users understand features, terminology, and UI elements without cluttering the interface. Tooltips will provide on-demand explanations for:

- Capacity levels and adaptive recovery
- Action statuses and sources
- Relationship states and tiers
- Filter options and settings
- Badges and indicators
- Complex features (Signals matrix, decision engine)

---

## Tooltip Library Selection

### Recommended: Radix UI Tooltip

**Why Radix UI:**
- ✅ **Accessible**: ARIA compliant, keyboard navigation, screen reader support
- ✅ **Headless**: Full control over styling with Tailwind CSS
- ✅ **TypeScript**: Excellent type safety
- ✅ **Lightweight**: Tree-shakeable, only includes what you use
- ✅ **Framework-agnostic**: Works seamlessly with React 19 and Next.js 16
- ✅ **Active maintenance**: Well-maintained, widely adopted

**Installation:**
```bash
npm install @radix-ui/react-tooltip
```

**Alternative Considered:**
- Floating UI: More lightweight but requires more setup
- React Tooltip: Simpler but less accessible
- Tippy.js: Feature-rich but heavier bundle size

---

## Tooltip Placement Strategy

### Phase 1: High-Priority Tooltips (Day 1)

#### Today Page
1. **Best Action Card**
   - "Best Action" label: "The highest-priority action based on urgency, value, and your availability"
   - Lane badge (Priority/In Motion/On Deck): Explain what each lane means
   - Promise badge: "You committed to completing this by [date]"
   - Reason text: Expand on why this action was selected

2. **Capacity Card**
   - Capacity level (Auto/Micro/Light/Standard/Heavy): Explain what each level means
   - "X minutes available": "Based on your calendar free/busy data"
   - Adaptive recovery indicator: "Your capacity was adjusted because [reason]"

3. **Overdue Counts**
   - Overdue actions count: "Actions past their due date"
   - Overdue relationships count: "Relationships that need attention"

4. **Calendar Card**
   - Event count: "Number of calendar events today"
   - Time until next event: "Time until your next scheduled event"
   - Available time: "Free time between calendar events"

#### Daily Plan Page
1. **Capacity Override Control**
   - Each capacity option: Full description from `capacityLabels`
   - "Auto" option: "Automatically calculated from your calendar"
   - Adaptive recovery badge: Explain why capacity was adjusted

2. **Duration Selector**
   - "I have X minutes": "Filter actions that fit in this time window"
   - Each duration option: "Show actions estimated to take X minutes or less"

3. **Fast Win Card**
   - "Fast Win" label: "A quick, high-impact action you can complete in under 5 minutes"
   - Fast Win badge: "Quick wins build momentum"

4. **Progress Bar**
   - Capacity label: Match explanation from capacity settings
   - Progress indicator: "X of Y actions completed"

#### Actions Page
1. **Filter Bar**
   - View toggle (Due/Relationships): "View actions by due date or by relationship"
   - Status filter: Explain each status (Pending, Waiting, Snoozed, Done)
   - Source filter: "Where the action originated (email, calendar, etc.)"
   - Intent filter: "Purpose of the action (follow-up, reply, etc.)"

2. **Action Cards**
   - Source badge: "This action was created from [source]"
   - Status badge: Explain what each status means
   - Priority indicator: "High/Medium/Low priority based on urgency and value"

#### Relationships Page
1. **Relationship Cards**
   - Tier badge (Inner/Active/Warm/Background): Explain tier meaning
   - Relationship state: Explain state machine (Unengaged, Active Conversation, etc.)
   - "Next touch due": "Based on your cadence and last interaction"
   - Overdue indicator: "This relationship needs attention"

2. **Email Signals**
   - Signal strength: "How important this email signal is"
   - Topics: "Key topics discussed in recent emails"
   - Asks: "Requests or open loops from the sender"

#### Settings Page
1. **Default Capacity Section**
   - Each capacity option: Full description
   - "Auto (from calendar)": "Automatically calculated from your calendar availability"
   - Adaptive recovery explanation: "Your capacity may be adjusted based on activity patterns"

2. **Weekend Preference**
   - Toggle: "Include or exclude weekends from daily plan generation"

3. **Working Hours**
   - Start/End time: "Hours used for calendar availability calculation"

4. **Calendar Connection**
   - Connection status: "Calendar is connected and syncing"
   - Last sync: "Last time calendar data was refreshed"

5. **Email Connection**
   - Connection status: "Email is connected for signal extraction"
   - Signal extraction: "AI analyzes emails to create actions"

### Phase 2: Medium-Priority Tooltips (Day 2)

#### Signals Page
1. **2x2 Matrix**
   - Quadrant labels: Explain each quadrant (High Urgency/Low Value, etc.)
   - Urgency calculation: "Based on days since last interaction, overdue actions, and email signals"
   - Value calculation: "Based on relationship tier, response rate, and deal potential"

2. **Relationship Cards in Matrix**
   - Position explanation: "Why this relationship is in this quadrant"

#### Weekly Review Page
1. **Metrics**
   - Each metric: Brief explanation of what it measures
   - "Consecutive days": "Days with at least one completed action"

2. **Content Prompts**
   - "Win Post": "Celebrate a recent win or milestone"
   - "Insight Post": "Share a valuable insight or lesson learned"

#### Action Detail Modal
1. **Action Type**
   - Each type: Brief explanation (FOLLOW_UP, OUTREACH, etc.)

2. **Completion Tracking**
   - "Next call calendared": "You scheduled a follow-up call"
   - "Replied to email": "You responded to their email"
   - "Got response": "They replied to your message"

3. **Relationship State**
   - Current state: Explain state machine
   - State transitions: "How actions move relationships through states"

### Phase 3: Low-Priority Tooltips (Day 3)

#### Navigation
1. **Nav Items**
   - Each page: Brief description of what's on that page

#### Badges Throughout App
1. **Status Badges**
   - All status indicators: Consistent explanations

2. **Source Badges**
   - Email, Calendar, Meeting Note, etc.: "This was created from [source]"

#### Empty States
1. **Empty State Messages**
   - Helpful tooltips on empty state CTAs

---

## Implementation Details

### Component Structure

Create a reusable `Tooltip` component wrapper:

```typescript
// web/src/components/ui/Tooltip.tsx
"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ReactNode } from "react";

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 300,
  disabled = false,
}: TooltipProps) {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            className="z-50 rounded-md bg-zinc-900 px-3 py-2 text-sm text-white shadow-lg data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade"
            sideOffset={5}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-zinc-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
```

### Styling

Use Tailwind CSS classes matching the app's design system:
- Background: `bg-zinc-900` (dark, matches app's dark buttons)
- Text: `text-white`
- Padding: `px-3 py-2`
- Border radius: `rounded-md`
- Shadow: `shadow-lg`
- Animations: Use Radix's built-in animations

### Content Guidelines

1. **Be Concise**: 1-2 sentences maximum
2. **Be Actionable**: Explain what the feature does, not just what it is
3. **Use Plain Language**: Avoid jargon, use terms from help.md
4. **Be Consistent**: Use same terminology across all tooltips
5. **Be Helpful**: Answer "Why should I care?" not just "What is this?"

### Examples

**Good:**
- "Automatically calculated from your calendar free/busy data"
- "A quick, high-impact action you can complete in under 5 minutes"
- "Your capacity was reduced because you haven't logged in for 7+ days"

**Bad:**
- "Capacity"
- "This is the capacity setting"
- "Adaptive recovery algorithm adjusts capacity based on user activity patterns and completion rates"

---

## Testing Plan

### Manual Testing
1. **Accessibility**
   - Keyboard navigation (Tab to trigger, Escape to dismiss)
   - Screen reader announcements
   - Focus management

2. **Visual**
   - Tooltip positioning (all sides)
   - Responsive design (mobile, tablet, desktop)
   - Dark mode compatibility (if applicable)

3. **Interaction**
   - Hover trigger
   - Focus trigger
   - Delay timing
   - Multiple tooltips on same page

### Automated Testing
- Unit tests for Tooltip component
- E2E tests for critical tooltips (capacity, status badges)

---

## Rollout Strategy

1. **Phase 1 (Day 1)**: Install library, create Tooltip component, implement high-priority tooltips
2. **Phase 2 (Day 2)**: Implement medium-priority tooltips
3. **Phase 3 (Day 3)**: Implement low-priority tooltips, polish, testing
4. **Post-Launch**: Gather user feedback, iterate on content

---

## Success Criteria

- ✅ All high-priority elements have helpful tooltips
- ✅ Tooltips are accessible (keyboard + screen reader)
- ✅ Tooltips match app design system
- ✅ Content is consistent with help.md terminology
- ✅ No performance impact (tooltips load on demand)
- ✅ User feedback indicates tooltips are helpful

---

## Related Documentation

- `docs/help.md` - Terminology and concepts reference
- `docs/PRD/NextBestMove_PRD_v1.md` - Feature specifications
- `web/src/lib/plan/capacity-labels.ts` - Capacity descriptions

---

## Future Enhancements

- **Rich Content Tooltips**: Support for links, formatted text, images
- **Interactive Tooltips**: Allow actions within tooltips (e.g., "Learn more" link)
- **Tooltip Analytics**: Track which tooltips are viewed most
- **User Preferences**: Allow users to disable tooltips if desired

