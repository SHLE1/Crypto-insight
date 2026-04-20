# Crypto Insight Design System

## 1. Visual Theme and Atmosphere
- Direction: neutral workspace
- Mood: calm, precise, low-noise, local-first
- Philosophy: use alignment, spacing, and surface hierarchy instead of decoration to create trust

## 2. Color Palette and Roles
| Token | Value | Role |
| --- | --- | --- |
| `background` | `oklch(0.982 0.004 240)` | Main canvas |
| `sidebar` | `oklch(0.955 0.004 240)` | Navigation surface |
| `card` | `oklch(0.995 0.002 240)` | Panels and cards |
| `foreground` | `oklch(0.27 0.018 248)` | Primary text |
| `muted-foreground` | `oklch(0.54 0.016 248)` | Secondary text |
| `primary` | `oklch(0.41 0.04 240)` | Primary actions |
| `accent` | `oklch(0.945 0.008 240)` | Hover and active fills |
| `border` | `oklch(0.905 0.007 245)` | Dividers and subtle outlines |

## 3. Typography Rules
- Sans: Geist Sans
- Mono: Geist Mono
- Headlines: weight `600`, tracking `-0.055em` to `-0.08em`
- Section labels: `11px`, medium weight, wide tracking for orientation only
- Body copy: `0.95rem` to `1rem`, relaxed leading, no display theatrics
- Numeric emphasis: use tabular numbers for prices and counts

## 4. Component Stylings
- Buttons: fixed rounded-lg, subtle inset highlight, no floating hover, press scale only
- Cards: light border plus quiet shadow, no blur, no glass
- Inputs: card-colored fill, gentle background shift on hover, stable focus ring
- Badges: short labels, restrained tracking, used for state not decoration
- Navigation: active item uses background step and one soft shadow, not heavy border framing

## 5. Layout Principles
- Dense enough for finance, but never cramped
- Use generous column spacing, not oversized row height
- App shell keeps sidebar visually separate through background step, not pattern
- Each section answers one question: status, structure, trend, action

## 6. Depth and Elevation
- Canvas to sidebar uses background-color step
- Canvas to card uses background step plus a low shadow
- No decorative gradients, no texture overlays, no blur layers
- Borders are for separation only; depth comes from shadow and tone

## 7. Do's and Don'ts
- Do keep copy direct and operational
- Do keep radii within one fixed family
- Do make totals and numbers visually stable
- Do use accent color sparingly
- Don't add showcase headlines to dashboard surfaces
- Don't stack multiple decorative effects on the same surface
- Don't use card treatment unless the content benefits from grouping
- Don't let side panels and main panels collapse into the same lightness

## 8. Responsive Behavior
- Mobile keeps the same visual language with tighter padding, not a new style
- Bottom nav stays compact and opaque
- Cards reduce spacing before reducing type size
- Maintain 40px minimum hit area across controls

## 9. Agent Prompt Guide
- Use `background` for the canvas, `sidebar` for navigation, and `card` for all elevated surfaces
- Headline style: Geist Sans, 600, tracking between `-0.055em` and `-0.08em`
- Body text style: muted copy at `0.95rem` with relaxed leading
- Buttons: rounded-lg, calm shadow, `active:scale(0.96)`, no hover lift
- Avoid gradients, blur, glossy borders, and template-style hero layouts
