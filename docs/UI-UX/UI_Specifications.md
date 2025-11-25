# NextBestMove UI Specifications
## Version 1.0 - Aligned with PRD v0.1

---

## Table of Contents
1. [Design System & Foundations](#design-system--foundations)
2. [Screen Specifications](#screen-specifications)
3. [Component Specifications](#component-specifications)
4. [Interaction Patterns](#interaction-patterns)
5. [Responsive Design](#responsive-design)
6. [Accessibility](#accessibility)

---

## Design System & Foundations

### Color Palette

#### Primary Colors
- **Primary Blue:** `#2563EB` (rgb(37, 99, 235))
  - Used for: Primary buttons, links, active states, headers
  - Hover: `#1D4ED8` (rgb(29, 78, 216))
  - Active: `#1E40AF` (rgb(30, 64, 175))

- **Success Green:** `#10B981` (rgb(16, 185, 129))
  - Used for: Success states, completion indicators
  - Hover: `#059669` (rgb(5, 150, 105))

- **Warning Orange:** `#F59E0B` (rgb(245, 158, 11))
  - Used for: Warnings, pending states
  - Hover: `#D97706` (rgb(217, 119, 6))

- **Error Red:** `#EF4444` (rgb(239, 68, 68))
  - Used for: Errors, destructive actions
  - Hover: `#DC2626` (rgb(220, 38, 38))

#### Neutral Colors
- **Gray Scale:**
  - `#F9FAFB` - Background light
  - `#F3F4F6` - Background subtle
  - `#E5E7EB` - Borders, dividers
  - `#D1D5DB` - Disabled states
  - `#9CA3AF` - Placeholder text
  - `#6B7280` - Secondary text
  - `#4B5563` - Primary text
  - `#1F2937` - Headings, emphasis
  - `#111827` - Maximum contrast text

#### Semantic Colors
- **Fast Win Accent:** `#8B5CF6` (rgb(139, 92, 246)) - Purple
- **Archived/Dimmed:** `#9CA3AF` with 60% opacity
- **Snoozed:** `#F59E0B` with light background tint

### Typography

#### Font Family
- **Primary:** System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Monospace:** `"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace` (for code/data)

#### Font Sizes & Hierarchy
- **H1 (Page Title):** 32px / 2rem, font-weight: 700, line-height: 1.2
- **H2 (Section Title):** 24px / 1.5rem, font-weight: 600, line-height: 1.3
- **H3 (Card Title):** 20px / 1.25rem, font-weight: 600, line-height: 1.4
- **H4 (Subsection):** 18px / 1.125rem, font-weight: 600, line-height: 1.4
- **Body Large:** 16px / 1rem, font-weight: 400, line-height: 1.5
- **Body:** 14px / 0.875rem, font-weight: 400, line-height: 1.5
- **Body Small:** 12px / 0.75rem, font-weight: 400, line-height: 1.5
- **Caption:** 11px / 0.6875rem, font-weight: 400, line-height: 1.4

#### Font Weights
- **Light:** 300
- **Regular:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700

### Spacing System

#### Base Unit: 4px

- **xs:** 4px (0.25rem)
- **sm:** 8px (0.5rem)
- **md:** 12px (0.75rem)
- **base:** 16px (1rem)
- **lg:** 24px (1.5rem)
- **xl:** 32px (2rem)
- **2xl:** 48px (3rem)
- **3xl:** 64px (4rem)

#### Component Spacing
- **Card Padding:** 16px (1rem)
- **Card Gap:** 12px (0.75rem)
- **Section Gap:** 24px (1.5rem)
- **Page Padding:** 24px (1.5rem) mobile, 32px (2rem) desktop

### Border Radius
- **sm:** 4px
- **base:** 8px
- **md:** 12px
- **lg:** 16px
- **xl:** 24px
- **full:** 9999px (for pills/badges)

### Shadows
- **sm:** `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **base:** `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)`
- **md:** `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- **lg:** `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- **xl:** `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`

### Animation & Transitions

#### Duration
- **Fast:** 150ms
- **Base:** 200ms
- **Slow:** 300ms
- **Slower:** 500ms

#### Easing
- **Ease In:** `cubic-bezier(0.4, 0, 1, 1)`
- **Ease Out:** `cubic-bezier(0, 0, 0.2, 1)`
- **Ease In Out:** `cubic-bezier(0.4, 0, 0.2, 1)`

#### Common Transitions
- **Button Hover:** `all 150ms ease-out`
- **Card Hover:** `transform 200ms ease-out, box-shadow 200ms ease-out`
- **Modal Open:** `opacity 200ms ease-out, transform 200ms ease-out`
- **State Change:** `all 200ms ease-in-out`

---

## Screen Specifications

### 1. Daily Plan Screen

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ Header: "Your NextBestMove for Today"   │
│ Subheader: "Sized for your schedule."   │
├─────────────────────────────────────────┤
│ Today's Focus Card                      │
│ "This week: book 2 calls..."            │
├─────────────────────────────────────────┤
│ Progress Indicator                      │
│ "2 of 6 actions completed"              │
├─────────────────────────────────────────┤
│ Fast Win Card (Purple accent)           │
│ ┌───────────────────────────────────┐   │
│ │ Fast Win (under 5 minutes)        │   │
│ │ Description text                  │   │
│ │ [LinkedIn Profile] link           │   │
│ │ [Done] [Snooze] buttons           │   │
│ └───────────────────────────────────┘   │
├─────────────────────────────────────────┤
│ Action Cards List                        │
│ ┌───────────────────────────────────┐   │
│ │ Action Card #1 - Follow-Up        │   │
│ └───────────────────────────────────┘   │
│ ┌───────────────────────────────────┐   │
│ │ Action Card #2 - Outreach         │   │
│ └───────────────────────────────────┘   │
│ ... (3-8 cards total)                   │
├─────────────────────────────────────────┤
│ Footer: "Stay consistent..."            │
└─────────────────────────────────────────┘
```

#### Header Section
- **Height:** Auto, min-height: 80px
- **Background:** White
- **Padding:** 24px top/bottom, 24px sides (mobile) / 32px (desktop)
- **Border Bottom:** 1px solid `#E5E7EB`
- **Typography:**
  - Title: H1 (32px, bold)
  - Subheader: Body (14px, gray-600)
- **Alignment:** Left-aligned

#### Today's Focus Card
- **Background:** `#F3F4F6` (light gray)
- **Padding:** 16px
- **Border Radius:** 12px
- **Border:** 1px solid `#E5E7EB`
- **Typography:** Body (14px)
- **Margin:** 16px 0
- **Icon:** Lightbulb icon (optional) left of text

#### Progress Indicator
- **Layout:** Horizontal bar with text overlay
- **Background:** `#F3F4F6`
- **Fill:** Primary blue, width based on completion %
- **Height:** 8px
- **Border Radius:** 4px (full)
- **Text:** "X of Y actions completed" above bar
- **Typography:** Caption (11px, gray-600)
- **Margin:** 12px 0 24px 0

#### Fast Win Card
- **Background:** White with purple left border (4px, `#8B5CF6`)
- **Padding:** 20px
- **Border Radius:** 12px
- **Border:** 1px solid `#E5E7EB`, left border emphasized
- **Shadow:** md shadow
- **Margin:** 0 0 16px 0
- **Special Styling:**
  - Badge: "Fast Win (under 5 minutes)" - purple badge, top-right
  - Link: Primary blue, underline on hover
- **Buttons:** Primary button "Done", Secondary "Snooze"

#### Action Card (Standard)
- **Background:** White
- **Padding:** 16px
- **Border Radius:** 12px
- **Border:** 1px solid `#E5E7EB`
- **Shadow:** sm shadow, md on hover
- **Margin:** 0 0 12px 0
- **Hover Effect:** Slight lift (translateY(-2px)), shadow increase
- **Layout:**
  - Action type badge (top-left)
  - Title (H4, 18px)
  - Description (Body, 14px, gray-600)
  - Person link (Primary blue, 14px)
  - Action buttons (bottom, right-aligned)
- **Action Type Badges:**
  - Follow-Up: Orange badge
  - Outreach: Blue badge
  - Nurture: Green badge
  - Call Prep: Purple badge
  - Post Call: Indigo badge
  - Content: Pink badge

#### Action Buttons
- **Primary:** "Done", "Done - Got reply", "Done - No reply yet"
  - Full width on mobile, auto on desktop
  - Primary blue background
  - White text
  - Height: 40px
  - Border radius: 8px
  - Font: Medium weight, 14px
- **Secondary:** "Snooze", "Add note"
  - Ghost style (transparent, blue border)
  - Auto width
  - Same height and styling
- **Spacing:** 8px gap between buttons
- **Responsive:** Stack vertically on mobile < 640px

#### Empty State
- **Layout:** Centered, vertical
- **Icon:** Empty state illustration (optional)
- **Text:** "You're all set for today! Check back tomorrow for your next actions."
- **Typography:** Body (16px, gray-600)
- **Padding:** 64px 24px

#### Footer
- **Background:** `#F9FAFB`
- **Padding:** 24px
- **Text:** "Stay consistent. Small actions move everything forward."
- **Typography:** Body Small (12px, gray-500)
- **Text Alignment:** Center

#### Responsive Breakpoints
- **Mobile (< 640px):**
  - Single column layout
  - Full-width cards
  - Stacked buttons
  - Padding: 16px
- **Tablet (640px - 1024px):**
  - Single column (can expand cards slightly)
  - Padding: 24px
- **Desktop (> 1024px):**
  - Max width: 768px, centered
  - Padding: 32px

---

### 2. Pin Management Screen

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ Header: "Pinned People"                 │
│ Subheader: "Names you don't want..."    │
├─────────────────────────────────────────┤
│ Filter Toggle: [All|Active|Snoozed|...]│
├─────────────────────────────────────────┤
│ [Pin a Person] Button (floating/header) │
├─────────────────────────────────────────┤
│ Pin List                                │
│ ┌───────────────────────────────────┐   │
│ │ Pin Row #1                        │   │
│ │ Name | Status | URL | Actions     │   │
│ └───────────────────────────────────┘   │
│ ┌───────────────────────────────────┐   │
│ │ Pin Row #2 (Snoozed)              │   │
│ └───────────────────────────────────┘   │
│ ...                                     │
└─────────────────────────────────────────┘
```

#### Header
- Same styling as Daily Plan header
- **Floating Action Button:** "Pin a Person" - Fixed position bottom-right on mobile, top-right on desktop
  - Primary blue background
  - Plus icon
  - Shadow: lg
  - Size: 56x56px (mobile), 48px (desktop)
  - Border radius: full

#### Filter Toggle
- **Layout:** Horizontal pills/tabs
- **Background:** `#F3F4F6`
- **Padding:** 4px
- **Border Radius:** 8px
- **Options:** All | Active | Snoozed | Archived
- **Active State:** White background, primary blue text
- **Inactive State:** Transparent, gray-600 text
- **Spacing:** 4px gap between pills
- **Typography:** Body Small (12px), Medium weight

#### Pin Row
- **Background:** White
- **Padding:** 16px
- **Border Radius:** 12px
- **Border:** 1px solid `#E5E7EB`
- **Margin:** 0 0 8px 0
- **Hover:** Shadow increase, slight background tint
- **Layout:**
  - **Left Section:**
    - Name (H4, 18px, bold)
    - Status badge (small, colored)
    - URL type + date (Caption, gray-500)
    - Notes (if exists, Body Small, gray-600, italic)
  - **Right Section:**
    - Action buttons (View/Edit, Snooze/Unsnooze, Archive/Restore)
- **Status Badges:**
  - Active: Green badge
  - Snoozed: Orange badge with date
  - Archived: Gray badge (dimmed)

#### Pin Row (Archived State)
- **Opacity:** 60%
- **Background:** `#F9FAFB`
- **Text:** Gray-500
- **Actions:** Only "View/Edit" and "Restore" visible

#### Empty State
- **Centered layout**
- **Icon:** Empty state illustration
- **Text:** "You haven't pinned anyone yet. Pin someone you want to follow up with."
- **CTA:** "Pin a Person" button
- **Padding:** 64px 24px

---

### 3. Weekly Summary Screen

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ Header: "Your Weekly Summary"           │
│ Subheader: "Here's what you moved..."   │
├─────────────────────────────────────────┤
│ Metrics Grid (5 columns)                │
│ [Active days] [Actions] [Replies] ...   │
├─────────────────────────────────────────┤
│ Narrative Summary Card                  │
│ "You completed 12 actions..."           │
├─────────────────────────────────────────┤
│ Insight Card                            │
│ "Your follow-ups convert best..."       │
├─────────────────────────────────────────┤
│ Next Week Focus Card                    │
│ "Re-engage warm threads..."             │
│ [Confirm Focus] [Edit Focus]            │
├─────────────────────────────────────────┤
│ Content Prompts Section                 │
│ ┌───────────────────────────────────┐   │
│ │ Prompt Card #1                    │   │
│ │ [Copy] [Save] [View Draft]        │   │
│ └───────────────────────────────────┘   │
│ ┌───────────────────────────────────┐   │
│ │ Prompt Card #2                    │   │
│ └───────────────────────────────────┘   │
├─────────────────────────────────────────┤
│ [View past summaries] link              │
└─────────────────────────────────────────┘
```

#### Metrics Grid
- **Layout:** Grid, responsive
  - Mobile: 2 columns
  - Tablet: 3 columns
  - Desktop: 5 columns
- **Gap:** 16px
- **Metric Card:**
  - Background: White
  - Padding: 16px
  - Border Radius: 12px
  - Border: 1px solid `#E5E7EB`
  - **Label:** Caption (11px, gray-500), uppercase, letter-spacing: 0.05em
  - **Value:** H2 (24px, bold), primary color for emphasis
  - **Alignment:** Center

#### Narrative Summary Card
- **Background:** `#F3F4F6`
- **Padding:** 20px
- **Border Radius:** 12px
- **Border:** 1px solid `#E5E7EB`
- **Typography:** Body (16px, gray-700)
- **Line Height:** 1.6
- **Margin:** 24px 0

#### Insight Card
- **Background:** White with left border (4px, primary blue)
- **Padding:** 20px
- **Border Radius:** 12px
- **Border:** 1px solid `#E5E7EB`
- **Icon:** Lightbulb icon (optional)
- **Bold Text:** H4 (18px, bold)
- **Supporting Text:** Body (14px, gray-600)
- **Margin:** 16px 0

#### Next Week Focus Card
- **Background:** Primary blue, 10% opacity background with solid border
- **Padding:** 20px
- **Border Radius:** 12px
- **Border:** 2px solid primary blue
- **Focus Text:** H4 (18px, bold, primary blue)
- **Buttons:** Primary "Confirm Focus", Secondary "Edit Focus"
- **Margin:** 16px 0

#### Content Prompt Card
- **Background:** White
- **Padding:** 20px
- **Border Radius:** 12px
- **Border:** 1px solid `#E5E7EB`
- **Type Badge:** Small badge (Win Post / Insight Post)
- **Prompt Text:** Body (14px, gray-700), italic
- **Action Buttons:**
  - "Copy to clipboard" - Ghost button
  - "Save to Content Ideas" - Secondary button
  - "View full draft" - Link
- **Margin:** 0 0 12px 0

---

### 4. Modal Specifications

#### Modal Overlay
- **Background:** `rgba(0, 0, 0, 0.5)` - Black with 50% opacity
- **Backdrop Blur:** Optional, 4px
- **Z-index:** 1000
- **Animation:** Fade in 200ms ease-out
- **Click to Close:** Enabled (closes on overlay click)

#### Modal Container
- **Background:** White
- **Border Radius:** 16px (mobile) / 24px (desktop)
- **Max Width:** 
  - Small modals: 400px
  - Medium modals: 600px
  - Large modals: 800px
- **Max Height:** 90vh
- **Padding:** 24px (mobile) / 32px (desktop)
- **Margin:** 16px (mobile) / Auto (desktop)
- **Shadow:** xl shadow
- **Animation:** 
  - Scale: 0.95 → 1.0
  - Opacity: 0 → 1
  - Duration: 200ms ease-out

#### Modal Header
- **Title:** H2 (24px, bold)
- **Close Button:** X icon, top-right
  - Size: 32px
  - Color: gray-400
  - Hover: gray-600
- **Border Bottom:** 1px solid `#E5E7EB` (if body content exists)
- **Padding:** 0 0 16px 0
- **Margin:** 0 0 24px 0

#### Modal Body
- **Padding:** 0
- **Typography:** Body (14px)
- **Scroll:** Auto if content exceeds max-height
- **Max Height:** calc(90vh - 200px)

#### Modal Footer
- **Border Top:** 1px solid `#E5E7EB`
- **Padding:** 16px 0 0 0
- **Margin:** 24px 0 0 0
- **Button Layout:** Right-aligned, gap: 12px
  - Primary button on right
  - Secondary/Cancel on left

---

### 5. Form Input Specifications

#### Text Input
- **Height:** 40px
- **Padding:** 12px 16px
- **Border:** 1px solid `#D1D5DB`
- **Border Radius:** 8px
- **Background:** White
- **Typography:** Body (14px)
- **Focus State:**
  - Border: 2px solid primary blue
  - Outline: None
  - Shadow: `0 0 0 3px rgba(37, 99, 235, 0.1)`
- **Error State:**
  - Border: 2px solid error red
  - Background: `#FEF2F2`

#### Text Area
- **Min Height:** 80px
- **Padding:** 12px 16px
- **Border:** Same as text input
- **Resize:** Vertical only
- **Font:** Same as text input

#### Select/Dropdown
- **Height:** 40px
- **Padding:** 12px 16px
- **Border:** Same as text input
- **Arrow:** Custom chevron icon
- **Background:** White with arrow icon

#### Date Picker
- **Height:** 40px
- **Same styling as text input**
- **Calendar Icon:** Right side

#### Help Text
- **Typography:** Caption (11px, gray-500)
- **Margin:** 4px 0 0 0
- **Placement:** Below input field

#### Error Message
- **Typography:** Caption (11px, error red)
- **Icon:** Alert icon before text
- **Margin:** 4px 0 0 0

---

### 6. Button Specifications

#### Primary Button
- **Background:** Primary blue (`#2563EB`)
- **Color:** White
- **Padding:** 12px 24px
- **Height:** 40px (min)
- **Border:** None
- **Border Radius:** 8px
- **Typography:** Body (14px), Medium weight
- **Shadow:** sm shadow
- **Hover:**
  - Background: Darker blue (`#1D4ED8`)
  - Shadow: md shadow
  - Transform: translateY(-1px)
- **Active:**
  - Transform: translateY(0)
  - Shadow: sm shadow
- **Disabled:**
  - Background: gray-300
  - Color: gray-500
  - Cursor: not-allowed
  - Opacity: 60%

#### Secondary Button
- **Background:** Transparent
- **Color:** Primary blue
- **Border:** 1px solid primary blue
- **Same padding, height, typography as primary**
- **Hover:**
  - Background: Primary blue, 10% opacity
- **Disabled:** Same as primary

#### Ghost Button
- **Background:** Transparent
- **Color:** Primary blue
- **Border:** None
- **Same padding, height, typography**
- **Hover:**
  - Background: Primary blue, 10% opacity
- **Disabled:** Gray text, no hover

#### Destructive Button
- **Background:** Error red (`#EF4444`)
- **Color:** White
- **Same styling as primary**
- **Hover:** Darker red (`#DC2626`)

#### Link Button
- **Background:** Transparent
- **Color:** Primary blue
- **Border:** None
- **Padding:** 8px 0
- **Typography:** Body (14px)
- **Text Decoration:** Underline on hover
- **No min height**

---

### 7. Badge Specifications

#### Status Badge
- **Padding:** 4px 8px
- **Border Radius:** 12px (full)
- **Typography:** Caption (11px), Medium weight
- **Colors by Status:**
  - Active: Green background, white text
  - Snoozed: Orange background, white text
  - Archived: Gray background, white text
  - New: Blue background, white text

#### Action Type Badge
- **Padding:** 4px 10px
- **Border Radius:** 6px
- **Typography:** Caption (11px), Medium weight
- **Colors by Type:**
  - Follow-Up: Orange background, white text
  - Outreach: Blue background, white text
  - Nurture: Green background, white text
  - Call Prep: Purple background, white text
  - Post Call: Indigo background, white text
  - Content: Pink background, white text
  - Fast Win: Purple background, white text

---

## Interaction Patterns

### Hover States
- **Cards:** Slight lift (translateY(-2px)), shadow increase
- **Buttons:** Background darken, shadow increase, slight lift
- **Links:** Underline, color darken
- **Inputs:** Border color change, shadow appears

### Loading States
- **Skeleton Loaders:** Gray shimmer animation
- **Spinner:** Primary blue, 24px size, centered
- **Button Loading:** Spinner replaces text, disabled state

### Empty States
- **Icon/Illustration:** Optional, centered, 64px size
- **Heading:** H3 (20px, gray-700)
- **Description:** Body (14px, gray-500)
- **CTA:** Primary button (if applicable)

### Error States
- **Inline Error:** Red text below input, icon before text
- **Toast Notification:** 
  - Background: Error red
  - Color: White
  - Position: Top-right
  - Auto-dismiss: 5 seconds
  - Animation: Slide in from right

### Success States
- **Toast Notification:**
  - Background: Success green
  - Color: White
  - Same positioning and animation as error

---

## Responsive Design

### Breakpoints
- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### Mobile Adaptations
- **Navigation:** Hamburger menu, drawer
- **Cards:** Full width, stacked
- **Buttons:** Full width when primary, stacked
- **Modals:** Full screen with swipe to close
- **Tables:** Horizontal scroll or card conversion

### Tablet Adaptations
- **Navigation:** Can show sidebar if space allows
- **Cards:** 2 columns possible for some views
- **Modals:** Centered, reasonable max-width

### Desktop Adaptations
- **Navigation:** Full sidebar visible
- **Content:** Max-width containers, centered
- **Modals:** Larger max-widths
- **Hover states:** Fully enabled

---

## Accessibility

### WCAG 2.1 Level AA Compliance

#### Color Contrast
- **Normal Text:** Minimum 4.5:1 ratio
- **Large Text:** Minimum 3:1 ratio
- **Interactive Elements:** Minimum 3:1 ratio

#### Keyboard Navigation
- **Focus Indicators:** Clear, visible focus rings (2px, primary blue)
- **Tab Order:** Logical, sequential
- **Skip Links:** Available for main content
- **Keyboard Shortcuts:** 
  - Escape: Close modals
  - Enter: Submit forms
  - Arrow keys: Navigate lists/options

#### Screen Reader Support
- **Semantic HTML:** Proper heading hierarchy, landmarks
- **ARIA Labels:** For icons, buttons without text
- **ARIA Live Regions:** For dynamic content updates
- **Alt Text:** For all images, icons

#### Touch Targets
- **Minimum Size:** 44x44px for all interactive elements
- **Spacing:** 8px minimum between touch targets

#### Motion
- **Prefers Reduced Motion:** Respect `prefers-reduced-motion` media query
- **Animations:** Can be disabled if user preference set

---

*End of UI Specifications v1.0*

