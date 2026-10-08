# RaiseUp design

Calm and trustworthy: paper white, ink text, one deep green accent. The data (scores, amounts) carries the weight.

## Colour (CSS variables in `src/styles.scss`, mapped in `tailwind.config.js`)

| Token | Value | Use |
|---|---|---|
| `bg` | #FAFAF7 | Page |
| `surface` | #FFFFFF | Cards, sidebar, inputs |
| `subtle` | #F3F3EE | Tags, hovers, skeletons, board columns |
| `line` | #14171A at 7-16% | Borders and dividers |
| `ink` / `ink-muted` / `ink-faint` | #14171A / #585D64 / #868A91 | Text levels |
| `accent` | #1F5E46 | Primary action, active nav, match rings, progress |
| `accent-soft` | #E8F0EC | Selected chips and rows |
| `danger` | #B42318 | Errors, destructive actions |

Charts use #2E7A5B (validated on white) and the accent on hover; single series, no legend, table view available.

## Type and shape

Inter Variable, 15px body; page titles 26-30px semibold, tight tracking. Cards 12px radius, controls 8px, chips round.
1px borders, shadows only on hover, menus and dialogs.

## Patterns

- Match score: ring from 0 to 100 (strong >= 75, good >= 50), breakdown with the four criteria and points.
- Avatars are initials on a soft tone derived from the name (no stock images).
- Every list has a skeleton, an empty state with a next step, and works at 390px.
- Desktop: left sidebar. Mobile: bottom tab bar.
