# DESIGN.md — Hisab Design System (Liquid Glass)

> The visual language is **locked** — Hree approved it 2026-09-21. Do not restyle. PRD references these tokens; components must use them, not ad-hoc values. Source of truth for values: `apps/mobile/src/theme.js`.

## 1. Canvas & atmosphere

- App is **dark-only**. No light mode in scope.
- Background: layered `#06080E` over `#030509` (near-black with a blue whisper).
- **Ambient orbs** (fixed, behind content, blurred): mint `#0E7C5B`, indigo `#2B3A8F`, rose `#8F2B4A`. They give the "light in a dark room" feel. Never animate aggressively; slow drift only.
- Status bar: light content.

## 2. Color tokens

| Token | Value | Use |
|---|---|---|
| `bg` / `bgDeep` | `#06080E` / `#030509` | Canvas |
| `glass` / `glassStrong` | `rgba(255,255,255,0.07)` / `0.11` | Card tints (sit under BlurView) |
| `glassBorder` | `rgba(255,255,255,0.16)` | Card borders |
| `glassHighlight` | `rgba(255,255,255,0.28)` | Top-edge sheen |
| `ink` / `inkSoft` / `muted` / `faint` | `#FFFFFF` / `rgba(235,240,255,0.82)` / `0.55` / `0.38` | Type ramp |
| `primary` (mint) | `#34D399` (`primaryDeep` `#0C6B4E`) | Primary actions, active states, peak highlight |
| `blue` / `violet` / `amber` / `rose` | `#5B8CFF` / `#A78BFA` / `#FBBF24` / `#FB7185` | Charts, badges, alerts |

**Payment badges:** UPI = mint tint (`upiBg rgba(52,211,153,0.16)`, text `#6EE7B7`); Card = blue tint (`cardBg rgba(91,140,255,0.18)`, text `#9DB9FF`).

**Category hues + glyphs** (Ionicons, always paired — never a bare dot):

| Category | Hue | Icon |
|---|---|---|
| Food | `#FB923C` | `fast-food-outline` |
| Travel | `#5B8CFF` | `car-outline` |
| Bills | `#A78BFA` | `receipt-outline` |
| Shopping | `#FB7185` | `bag-outline` |
| Other | `#94A3B8` | `shapes-outline` |

## 3. Typography

- System font stack (no custom font files in V1 — keeps binary lean and rendering native).
- Scale: hero amount 34–40pt semibold; screen titles 22pt semibold; card titles 16pt semibold; body 14pt; captions 12pt `muted`.
- Money: always `₹` + `en-IN` grouping (`₹1,94,200`), tabular numerals where amounts align in lists.

## 4. Spacing & shape

- Radius: `sm 12` / `md 18` / `lg 26` / `xl 32`. Cards `lg`; sheets `xl` top; chips `sm`.
- Screen padding: 20pt horizontal. Card padding: 18–20pt. Inter-card gap: 14pt.
- **Bottom spacer 150pt** on scroll views — content must clear the floating tab bar.

## 5. Components

- **Glass card:** `BlurView` (tint dark, intensity ~40) + `glass` tint + 1pt `glassBorder` + `floatShadow` (`#000`, y12, 35%, r24, elevation 8). Used for heroes, insights, budgets.
- **Floating tab bar:** 5 tabs (Home, Insights, Budgets, Bills, History); frosted, rounded `xl`, floats above content with bottom inset; active tab = mint **glow pill** behind the Ionicons glyph.
- **Transaction row:** category glyph in tinted circle (hue at 16% alpha) | merchant (semibold) + time/method caption | amount right-aligned, negative spend in `ink`, plus method badge (UPI/Card).
- **Detail bottom sheet:** drag handle, merchant header w/ glyph, amount hero, meta rows (method, reference, source badge: Manual/SMS/Email/Bank), recategorize chips row.
- **Buttons:** primary = mint fill, dark text `#06281D`, radius `md`; secondary = glass fill, `inkSoft` text; destructive = rose tint.
- **Charts:** 7-day bars — peak day solid mint, others `faint` gray; no gridlines; rounded bar tops.
- **Morning planner card:** appears before 12:00 only; prompt "Good morning. What are you going to do?"; plan rows with estimate chips.
- **Empty states:** orb glow + single line of `muted` copy + primary CTA. Never a blank screen.

## 6. Motion

- Tab switch: 180ms ease-out crossfade + glyph scale 1→1.08 on the glow pill.
- Sheet: spring (damping ~0.85) from bottom; backdrop fades 200ms.
- Number changes (hero): count-up 400ms, ease-out. No bouncy overshoot on money.
- Respect `reduce motion`: crossfade only.

## 7. Rules

1. Dark-only; never ship a light variant without Hree's explicit approval.
2. Category glyphs always accompany category color — no bare dots anywhere.
3. Mint (`#34D399`) is reserved for: primary actions, active states, the peak data point, and UPI. Don't mint-wash secondary UI.
4. Every scrollable screen ends with the 150pt bottom spacer.
5. Amounts are `en-IN` formatted; paise never shown to users (₹989, not ₹989.00).
6. Screenshots for review: 390×844 viewport, exported web build, saved to `preview/`.
