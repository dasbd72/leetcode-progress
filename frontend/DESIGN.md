# LeetCode Progress — Design Direction ("Nordic")

Locked design system for the React + Vite rewrite, derived from the
"Solve Board Nordic" reference. This is the source of truth for F1's tokens and
the screen map every later frontend ticket implements.

## Principles

- Calm, legible, data-dashboard aesthetic (restraint over decoration).
- Numbers are first-class: monospace, tabular, right-aligned in tables.
- Light **and** dark, system-aware with a manual override that always wins.
- Hairline borders + soft shadow; 8px radius; generous but tight spacing.

## Color tokens

Exposed as CSS custom properties (and mapped into Tailwind theme colors).

### Light (default)

| Token         | Value     | Use                             |
| ------------- | --------- | ------------------------------- |
| `--bg`        | `#f2f6f6` | page background                 |
| `--panel`     | `#ffffff` | cards / panels                  |
| `--fg`        | `#14201f` | primary text                    |
| `--muted`     | `#5d6f6e` | secondary text, axis labels     |
| `--line`      | `#d9e2e1` | borders, gridlines              |
| `--accent`    | `#0e7c72` | primary accent, active controls |
| `--on-accent` | `#ffffff` | text on accent                  |

### Dark

| Token         | Value     |
| ------------- | --------- |
| `--bg`        | `#0f1716` |
| `--panel`     | `#162221` |
| `--fg`        | `#e6efee` |
| `--muted`     | `#8aa09e` |
| `--line`      | `#263a38` |
| `--accent`    | `#3cc4b4` |
| `--on-accent` | `#06201d` |

### Difficulty (semantic)

| Token    | Light     | Dark      |
| -------- | --------- | --------- |
| `--easy` | `#1f9d63` | `#4cc98b` |
| `--med`  | `#d98a00` | `#f0b23a` |
| `--hard` | `#d9402e` | `#ff7a66` |

### User series (chart lines, leaderboard dots) — cycle of 6

| Token  | Light     | Dark      |
| ------ | --------- | --------- |
| `--u0` | `#0e7c72` | `#3cc4b4` |
| `--u1` | `#3b6fd8` | `#7ea6ff` |
| `--u2` | `#d98a00` | `#f0b23a` |
| `--u3` | `#c2417a` | `#ff7fb0` |
| `--u4` | `#7a5cc8` | `#b69cff` |
| `--u5` | `#5d6f6e` | `#9db3b1` |

Theme mechanism: `@media (prefers-color-scheme: dark)` sets dark values on
`:root:not([data-theme="light"])`; `:root[data-theme="dark"]` /
`:root[data-theme="light"]` overrides win in both directions (toggle stamps
`data-theme` on `<html>`, persisted to `localStorage`).

## Typography

- **UI:** IBM Plex Sans (self-hosted, weights 400/500/600).
- **Numbers:** IBM Plex Mono (self-hosted, 400/500), `font-variant-numeric: tabular-nums`.

| Role              | Spec                                               |
| ----------------- | -------------------------------------------------- |
| h1                | 600, 26px, line-height 1.1, letter-spacing -0.01em |
| h2 (panel title)  | 600, 15px, line-height 1.2                         |
| body              | 400, 14px, line-height 1.45                        |
| KPI value         | 600, 28px, mono, tabular                           |
| label (uppercase) | 11px, letter-spacing 0.07em, uppercase, `--muted`  |
| meta / notes      | 12px, mono, `--muted`                              |

Mobile (≤560px): h1 scales to ~85%, KPI value → 24px.

## Shape & spacing

- Radius: `8px` (chips: pill / `999px`).
- Borders: `1px solid var(--line)`.
- Shadow (light): `0 1px 2px rgba(20,32,31,.05)`; tooltip `0 6px 18px rgba(20,32,31,.12)`. Dark: shadow none / stronger tooltip.
- Base gap: `14px`; page padding: `16px` inline, `22px` top.
- Content max-width: `1080px`, centered.

## Score definition

`Score = Easy × 1 + Medium × 2 + Hard × 3` — used in KPIs, the metric selector,
and leaderboard ranking.

## Screen map

Consolidates the old separate `/total` (table) and `/chart` (charts) routes into
a single **Dashboard**, matching the reference IA. No capability is lost.

### 1. Dashboard — `/` (public, no login required)

- **Header:** title + "latest snapshot" meta + theme toggle + auth button (Sign in / account).
- **KPI tile row** (`F3`): total solved, solved in range, hard in range, top climber.
- **Progress panel** (`F3`): Recharts multi-series time-series.
  - Metric segmented control: Total / Easy / Medium / Hard / Score.
  - Interval segmented control matching the existing API
    (`getLatestWithInterval`): **Hour** (48 points × 1h) and **Day**
    (24 points × 1d). (The reference's 3h/12h/24h were demo-only.)
  - Mode toggle: **Cumulative** vs **Gain (delta)** — preserves the existing
    chart's delta mode.
  - Per-user toggle chips (show/hide series).
- **Leaderboard panel** (`F4`): ranked table — #, solver, Easy, Medium, Hard,
  Total, Score, gain (range), trend sparkline, difficulty-mix bar. Sorted by Score.
- **Announcements** (`F6`): surfaced here as a dismissible modal/banner.

### 2. Settings — `/settings` (auth-gated, `F5`)

- Tabbed: **Profile** (account details) and **Following** (manage followed
  solvers: add/remove, select-all / deselect-all).

### 3. Auth (`F2`)

- Cognito hosted OIDC (Authorization Code + PKCE, refresh). Sign-in from the
  header; post-login lands on `/settings`. Guard protects `/settings` only;
  the dashboard is viewable logged-out.

### Navigation

- Minimal top bar: brand → Dashboard; a Settings link (visible when signed in);
  theme toggle; auth control. No separate chart/total nav items (merged).

## Charting (Recharts)

All visualization via Recharts, styled to the tokens above:

- Main chart: thin lines (~2px), minimal horizontal gridlines in `--line`,
  mono axis labels in `--muted`, custom tooltip using panel/line/shadow tokens.
  Inline end-of-line series labels and the crosshair tooltip are custom layers
  on Recharts (approximating the reference).
- Sparklines: mini Recharts line charts (no axes).
- Difficulty mix: Recharts stacked horizontal bars using `--easy/--med/--hard`.
