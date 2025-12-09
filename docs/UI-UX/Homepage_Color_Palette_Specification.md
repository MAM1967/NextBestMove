# Homepage Color Palette Specification

**Date:** December 9, 2025  
**Page:** Marketing Homepage (`/`)  
**Framework:** Tailwind CSS (Zinc color scale)

---

## Complete Color Palette

### Background Colors

#### Primary Background
- **Color Name:** Background Light
- **Tailwind Class:** `bg-zinc-50`
- **Hex:** `#FAFAF9`
- **RGB:** `rgb(250, 250, 249)`
- **Usage:** Main page background
- **Location:** `<main>` element

#### White Background
- **Color Name:** White
- **Tailwind Class:** `bg-white`
- **Hex:** `#FFFFFF`
- **RGB:** `rgb(255, 255, 255)`
- **Usage:** Secondary button background, card backgrounds
- **Location:** "Get started" button

#### Black Background
- **Color Name:** Black
- **Tailwind Class:** `bg-black`
- **Hex:** `#000000`
- **RGB:** `rgb(0, 0, 0)`
- **Usage:** Primary button background
- **Location:** "Sign in" button

#### Button Hover States
- **Primary Button Hover:** `bg-zinc-800`
  - **Hex:** `#27272A`
  - **RGB:** `rgb(39, 39, 42)`
  - **Usage:** "Sign in" button hover state

- **Secondary Button Hover:** `bg-zinc-50`
  - **Hex:** `#FAFAF9`
  - **RGB:** `rgb(250, 250, 249)`
  - **Usage:** "Get started" button hover state

---

### Text Colors

#### Primary Text
- **Color Name:** Text Primary
- **Tailwind Class:** `text-zinc-900`
- **Hex:** `#18181B`
- **RGB:** `rgb(24, 24, 27)`
- **Usage:** Main headings, primary text, button text
- **Font Weight:** Semibold (600) for headings, Medium (500) for buttons
- **Location:** H1, H2 headings, button text

#### Secondary Text
- **Color Name:** Text Secondary
- **Tailwind Class:** `text-zinc-600`
- **Hex:** `#52525B`
- **RGB:** `rgb(82, 82, 91)`
- **Usage:** Body text, descriptions, footer text
- **Font Weight:** Regular (400)
- **Location:** Paragraphs, feature descriptions, footer

#### Muted Text
- **Color Name:** Text Muted
- **Tailwind Class:** `text-zinc-500`
- **Hex:** `#71717A`
- **RGB:** `rgb(113, 113, 122)`
- **Usage:** Brand name, subtle text, analytics notice
- **Font Weight:** Semibold (600) for brand, Regular (400) for notice
- **Location:** "NextBestMove" brand text, analytics notice

#### White Text
- **Color Name:** White Text
- **Tailwind Class:** `text-white`
- **Hex:** `#FFFFFF`
- **RGB:** `rgb(255, 255, 255)`
- **Usage:** Text on dark backgrounds
- **Location:** "Sign in" button text

#### Link Hover
- **Color Name:** Link Hover
- **Tailwind Class:** `hover:text-zinc-900`
- **Hex:** `#18181B`
- **RGB:** `rgb(24, 24, 27)`
- **Usage:** Footer links on hover
- **Location:** Terms/Privacy links

---

### Border Colors

#### Divider Border
- **Color Name:** Border Light
- **Tailwind Class:** `border-zinc-200`
- **Hex:** `#E4E4E7`
- **RGB:** `rgb(228, 228, 231)`
- **Usage:** Section dividers, footer divider
- **Location:** Top borders on feature section and footer

#### Button Border
- **Color Name:** Border Medium
- **Tailwind Class:** `border-zinc-300`
- **Hex:** `#D4D4D8`
- **RGB:** `rgb(212, 212, 216)`
- **Usage:** Secondary button border
- **Location:** "Get started" button

---

### Accent Colors

#### Accent Underline
- **Color Name:** Sky Blue Accent
- **Tailwind Class:** `decoration-sky-400`
- **Hex:** `#38BDF8`
- **RGB:** `rgb(56, 189, 248)`
- **Usage:** Decorative underline on "next best move" text
- **Decoration Style:** Underline, 2px thickness, 4px offset
- **Location:** H1 heading accent text

---

## Color Usage by Component

### Header Section
- **Background:** `#FAFAF9` (zinc-50)
- **Brand Text:** `#71717A` (zinc-500) - Semibold, uppercase, letter-spacing 0.2em
- **H1 Text:** `#18181B` (zinc-900) - Semibold
- **H1 Accent:** `#38BDF8` (sky-400) - Underline decoration
- **Body Text:** `#52525B` (zinc-600) - Regular

### Call-to-Action Buttons
- **Primary Button (Sign in):**
  - Background: `#000000` (black)
  - Text: `#FFFFFF` (white)
  - Hover Background: `#27272A` (zinc-800)
  - Border Radius: Full (9999px)
  - Shadow: Small (`0 1px 2px 0 rgba(0, 0, 0, 0.05)`)

- **Secondary Button (Get started):**
  - Background: `#FFFFFF` (white)
  - Text: `#18181B` (zinc-900)
  - Border: `#D4D4D8` (zinc-300)
  - Hover Background: `#FAFAF9` (zinc-50)
  - Border Radius: Full (9999px)
  - Shadow: Small (`0 1px 2px 0 rgba(0, 0, 0, 0.05)`)

### Feature Section
- **Background:** `#FAFAF9` (zinc-50)
- **Top Border:** `#E4E4E7` (zinc-200)
- **H2 Headings:** `#18181B` (zinc-900) - Semibold
- **Feature Descriptions:** `#52525B` (zinc-600) - Regular

### Footer Section
- **Background:** `#FAFAF9` (zinc-50)
- **Top Border:** `#E4E4E7` (zinc-200)
- **Copyright Text:** `#52525B` (zinc-600)
- **Link Text:** `#52525B` (zinc-600)
- **Link Hover:** `#18181B` (zinc-900)
- **Analytics Notice:** `#71717A` (zinc-500) - Centered, smaller

---

## Typography Colors Summary

| Element | Color | Hex | RGB | Weight | Size |
|---------|-------|-----|-----|--------|------|
| Brand name | zinc-500 | `#71717A` | `rgb(113, 113, 122)` | 600 | 14px |
| H1 heading | zinc-900 | `#18181B` | `rgb(24, 24, 27)` | 600 | 36-48px |
| H1 accent | sky-400 | `#38BDF8` | `rgb(56, 189, 248)` | 600 | Same as H1 |
| Body text | zinc-600 | `#52525B` | `rgb(82, 82, 91)` | 400 | 18px |
| H2 headings | zinc-900 | `#18181B` | `rgb(24, 24, 27)` | 600 | 14px |
| Feature text | zinc-600 | `#52525B` | `rgb(82, 82, 91)` | 400 | 14px |
| Button text (primary) | white | `#FFFFFF` | `rgb(255, 255, 255)` | 500 | 14px |
| Button text (secondary) | zinc-900 | `#18181B` | `rgb(24, 24, 27)` | 500 | 14px |
| Footer text | zinc-600 | `#52525B` | `rgb(82, 82, 91)` | 400 | 14px |
| Footer links | zinc-600 | `#52525B` | `rgb(82, 82, 91)` | 400 | 14px |
| Footer links hover | zinc-900 | `#18181B` | `rgb(24, 24, 27)` | 400 | 14px |
| Analytics notice | zinc-500 | `#71717A` | `rgb(113, 113, 122)` | 400 | 14px |

---

## Color Palette Reference (Quick Copy)

### Primary Colors
```
Background: #FAFAF9 (zinc-50)
Primary Text: #18181B (zinc-900)
Secondary Text: #52525B (zinc-600)
Muted Text: #71717A (zinc-500)
```

### Interactive Colors
```
Primary Button BG: #000000 (black)
Primary Button Text: #FFFFFF (white)
Primary Button Hover: #27272A (zinc-800)
Secondary Button BG: #FFFFFF (white)
Secondary Button Text: #18181B (zinc-900)
Secondary Button Border: #D4D4D8 (zinc-300)
Secondary Button Hover: #FAFAF9 (zinc-50)
```

### Accent Colors
```
Accent Underline: #38BDF8 (sky-400)
```

### Border Colors
```
Divider: #E4E4E7 (zinc-200)
Button Border: #D4D4D8 (zinc-300)
```

---

## Design System Context

### Color Scale Used: Zinc (Tailwind CSS)
The homepage uses Tailwind's **Zinc** color scale, which is a neutral gray scale with cool undertones.

**Why Zinc?**
- Modern, clean aesthetic
- Excellent readability
- Professional appearance
- Good contrast ratios for accessibility

### Accent Color: Sky Blue
- **Sky-400** (`#38BDF8`) is used sparingly as an accent
- Provides visual interest without overwhelming
- Creates a subtle call-to-action highlight

### Contrast Ratios (WCAG Compliance)
- **zinc-900 on zinc-50:** 15.8:1 (AAA compliant)
- **zinc-600 on zinc-50:** 7.2:1 (AA compliant)
- **white on black:** 21:1 (AAA compliant)
- **zinc-900 on white:** 15.8:1 (AAA compliant)

---

## Implementation Notes

### Tailwind CSS Classes Used
```css
bg-zinc-50          /* Background */
text-zinc-900       /* Primary text */
text-zinc-600       /* Secondary text */
text-zinc-500       /* Muted text */
text-white          /* White text */
bg-black            /* Black background */
bg-white            /* White background */
bg-zinc-800         /* Hover state */
bg-zinc-50          /* Hover state */
border-zinc-200     /* Dividers */
border-zinc-300     /* Button border */
decoration-sky-400  /* Accent underline */
```

### CSS Custom Properties (If Converting)
```css
:root {
  --color-bg-primary: #FAFAF9;
  --color-text-primary: #18181B;
  --color-text-secondary: #52525B;
  --color-text-muted: #71717A;
  --color-button-primary-bg: #000000;
  --color-button-primary-text: #FFFFFF;
  --color-button-primary-hover: #27272A;
  --color-button-secondary-bg: #FFFFFF;
  --color-button-secondary-text: #18181B;
  --color-button-secondary-border: #D4D4D8;
  --color-button-secondary-hover: #FAFAF9;
  --color-accent-sky: #38BDF8;
  --color-border-light: #E4E4E7;
  --color-border-medium: #D4D4D8;
}
```

---

## Visual Hierarchy

### Color Usage Priority
1. **Primary Actions:** Black (`#000000`) - Highest contrast, primary CTA
2. **Headings:** Dark gray (`#18181B`) - Strong hierarchy
3. **Body Text:** Medium gray (`#52525B`) - Readable but secondary
4. **Muted Elements:** Light gray (`#71717A`) - Subtle, low priority
5. **Accents:** Sky blue (`#38BDF8`) - Draws attention to key phrases

---

## Accessibility Notes

- **All text meets WCAG AA standards** (minimum 4.5:1 contrast)
- **Most text meets WCAG AAA standards** (7:1 contrast)
- **Interactive elements have clear hover states**
- **Color is not the only indicator** (text, borders, shadows also used)

---

## Export Formats

### For Design Tools (Figma/Sketch)
```
Background: #FAFAF9
Primary Text: #18181B
Secondary Text: #52525B
Muted Text: #71717A
Black: #000000
White: #FFFFFF
Accent: #38BDF8
Border Light: #E4E4E7
Border Medium: #D4D4D8
Button Hover: #27272A
```

### For CSS/SCSS
```scss
$bg-primary: #FAFAF9;
$text-primary: #18181B;
$text-secondary: #52525B;
$text-muted: #71717A;
$button-primary-bg: #000000;
$button-primary-text: #FFFFFF;
$button-primary-hover: #27272A;
$button-secondary-bg: #FFFFFF;
$button-secondary-text: #18181B;
$button-secondary-border: #D4D4D8;
$button-secondary-hover: #FAFAF9;
$accent-sky: #38BDF8;
$border-light: #E4E4E7;
$border-medium: #D4D4D8;
```

---

**Last Updated:** December 9, 2025  
**Page:** Marketing Homepage (`/`)  
**Framework:** Next.js 16 + Tailwind CSS

