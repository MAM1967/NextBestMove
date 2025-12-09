## Lapidist Design-Lint – What the Warnings Mean (with examples)

The latest Vercel build shows informational warnings from design-lint. They are not blocking builds, but they flag places where code diverges from the configured design tokens. Below is a quick visual-style cheatsheet with current vs. recommended usage so you can see the adjustments to make.

### Token groups (what’s configured)

- **Colors:** primary/semantic/grayscale tokens (e.g., `primary-blue`, `success-green`, `gray-700`, etc.)
- **Spacing:** `xs` 4px, `sm` 8px, `md` 12px, `base` 16px, `lg` 24px, `xl` 32px, `2xl` 48px, `3xl` 64px
- **Radius:** `sm` 4px, `base` 8px, `md` 12px, `lg` 16px, `xl` 24px, `full` 9999px
- **Font sizes:** `h1` 32px, `h2` 24px, `h3` 20px, `h4` 18px, `body-large` 16px, `body` 14px, `body-small` 12px, `caption` 11px
- **Font weights:** light 300, regular 400, medium 500, semibold 600, bold 700
- **Shadows:** `sm`, `base`, `md`, `lg`, `xl` (values in tokens)

### Quick guidance

- Use tokens instead of raw values for color, spacing, radius, font size, font weight, and shadows.
- For shadows and font weights, update the token file to use the expected `$type` (see below) so rules recognize them.

### Current vs. Recommended (examples)

| Warning type                 | Example the linter found (current)                                                           | Recommended for compliance                                                                                                                                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shadow token missing         | `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`                                                      | Define in tokens as `$type: "shadow"` under `shadows`, e.g. use token `shadows.base` in code (or map your shadow utilities to tokens).                                                                                                                          |
| Font weight token missing    | `font-weight: 600`                                                                           | Reference token `fontWeights.semibold` (ensure tokens use `$type: "fontWeight"`).                                                                                                                                                                               |
| Color not in tokens          | `#16a34a`, `#15803d`, `#b45309`, `#9333ea`, `#7e22ce`, `#0000CD`, `white`, `rgba(0,0,0,0.1)` | Replace with nearest token: `success-green`/`success-green-hover`, `warning-orange`/`warning-orange-hover`, `fast-win-accent`, `gray-50..gray-800`, `black`, `white` (already a token), or add a new approved token. Avoid ad-hoc rgba; prefer existing tokens. |
| Spacing not on the 4px scale | `gap: 0.5rem` (8px), `gap: 1rem` (16px) when expressed as rems or non-token values           | Use spacing tokens: `sm` (8px) or `base` (16px) from `spacing`. In JSX/Tailwind-style props, map to those token values.                                                                                                                                         |
| Border radius not in tokens  | `border-radius: 0`, `0.5`, `1`, `100`                                                        | Use radius tokens: `sm` (4px), `base` (8px), `md` (12px), `lg` (16px), `xl` (24px), `full` (9999px). Pick the closest fit; avoid arbitrary radii.                                                                                                               |

### Minimal fixes to shrink warnings

1. **Token file fixes** (makes rules recognize groups):

   - Set `shadows.*` tokens to `$type: "shadow"` (not string).
   - Set `fontWeights.*` tokens to `$type: "fontWeight"` (not number).

2. **Code fixes** (reduce the bulk):
   - Replace stray colors with token colors (see table).
   - Replace spacing 0.5/1 rem with `sm`/`base` (8px/16px).
   - Replace radii 0/0.5/1/100 with `sm/base/md/lg/xl/full`.

These are safe, incremental adjustments. Once tokens for shadows and font weights use the expected `$type`, the “requires tokens” warnings will disappear, leaving only true violations to fix.\*\*\*
