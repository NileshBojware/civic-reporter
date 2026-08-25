---
version: alpha
name: CivicReport-design-analysis
description: A clean, civic-tech-first interface anchored on white canvas with black primary CTAs and confident geometric display typography. The system reads as trustworthy modern govtech SaaS — generous whitespace, soft-rounded cards (~12px), real product UI fragments (map pins, status badges, report cards) shown directly inside cards, and a dark navy footer that visually closes long-scroll pages. Brand voltage comes from the display headline and from status-driven color coding (Reported / Verified / In Progress / Resolved / Rejected) rather than from decorative accent colors.

colors:
  primary: "#111111"
  primary-active: "#242424"
  primary-disabled: "#e5e7eb"
  ink: "#111111"
  body: "#374151"
  muted: "#6b7280"
  muted-soft: "#898989"
  hairline: "#e5e7eb"
  hairline-soft: "#f3f4f6"
  canvas: "#ffffff"
  surface-soft: "#f8f9fa"
  surface-card: "#f5f5f5"
  surface-strong: "#e5e7eb"
  surface-dark: "#101828"
  surface-dark-elevated: "#1a2333"
  on-primary: "#ffffff"
  on-dark: "#ffffff"
  on-dark-soft: "#a1a9b8"
  brand-accent: "#2563eb"
  status-reported: "#f59e0b"
  status-verified: "#3b82f6"
  status-inprogress: "#8b5cf6"
  status-resolved: "#10b981"
  status-rejected: "#ef4444"
  success: "#10b981"
  warning: "#f59e0b"
  error: "#ef4444"
  category-waste: "#fb923c"
  category-water: "#38bdf8"
  category-drainage: "#8b5cf6"

typography:
  display-xl:
    fontFamily: "Cal Sans, Inter, sans-serif"
    fontSize: 60px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: -1.75px
  display-lg:
    fontFamily: "Cal Sans, Inter, sans-serif"
    fontSize: 44px
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: -1.25px
  display-md:
    fontFamily: "Cal Sans, Inter, sans-serif"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: -0.75px
  display-sm:
    fontFamily: "Cal Sans, Inter, sans-serif"
    fontSize: 26px
    fontWeight: 600
    lineHeight: 1.22
    letterSpacing: -0.4px
  title-lg:
    fontFamily: "Inter, sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.3px
  title-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  title-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-icon-circular:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 36px
  button-text-link:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
  text-link:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 64px
  nav-pill-group:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.pill}"
    padding: 6px
  hero-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    padding: 96px
  hero-map-mockup-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
  feature-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  feature-icon-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.lg}"
    padding: 24px
  report-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 20px
  status-badge:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  category-badge:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  stat-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-sm}"
    rounded: "{rounded.lg}"
    padding: 24px
  timeline-step:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 12px
  testimonial-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 24px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 10px 14px
    height: 40px
  text-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  category-tab:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.nav-link}"
    padding: 8px 14px
    rounded: "{rounded.md}"
  category-tab-active:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.md}"
  avatar-circle:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 36px
  upvote-pill:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 6px 12px
  cta-band-light:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.display-sm}"
    rounded: "{rounded.lg}"
    padding: 48px
  footer:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark-soft}"
    typography: "{typography.body-sm}"
    padding: 64px
---

## Overview

The Smart Civic Issue Reporting and Management System's interface is a clean, trustworthy modern-govtech surface — white canvas (`{colors.canvas}` — #ffffff) with black primary CTAs (`{colors.primary}` — #111111), confident display typography, and `{colors.surface-card}` (#f5f5f5) light-gray cards holding real product UI fragments. The system reads as engineered-for-clarity: every band has a single clear hierarchy, generous whitespace, and one obvious primary action ("Report an Issue").

Type voice splits cleanly into two roles: a **display face** (used for h1, h2, h3, and hero headlines) and **Inter** (used for everything else — body, buttons, nav, captions, form labels). The display face uses weight 600 with negative letter-spacing — it feels modern, precise, and civic-institutional without being cold.

Component voltage comes from **real product UI fragments shown directly inside cards** — the interactive Leaflet map with report pins, status-lifecycle badges, report cards with photo thumbnails, and the admin triage table. The platform doesn't illustrate the idea of civic reporting; it shows the actual map, the actual status pill, the actual report card, at small scale, embedded in the marketing and app flow.

The footer flips to `{colors.surface-dark}` (#101828 — a deep navy-slate, distinct from pure black to read as "municipal" rather than "startup") — the only dark surface in the system, closing every long-scroll page.

**Key Characteristics:**
- White canvas with black primary CTA (`{colors.primary}` — #111111). Buttons are `{rounded.md}` (8px) with confident weight-600 labels ("Report an Issue", "Track My Reports").
- Display typeface for headlines (Cal Sans-style, substituted with Inter weight 600 if unavailable). Negative letter-spacing on display sizes — precise and institutional-modern.
- Light-gray card surfaces (`{colors.surface-card}` — #f5f5f5) for feature cards, stat summaries, and testimonials. Report cards on the citizen dashboard stay white with a hairline border to feel like "live records" rather than marketing copy.
- **Status-driven color coding** is the system's real accent language, not decorative brand color: Reported (`{colors.status-reported}` amber), Verified (`{colors.status-verified}` blue), In Progress (`{colors.status-inprogress}` violet), Resolved (`{colors.status-resolved}` emerald), Rejected (`{colors.status-rejected}` red). These appear only on `{component.status-badge}` — never on buttons or headlines.
- Product UI fragments embedded directly in cards — the hero shows the actual Leaflet map with pins and an open report popup; feature sections show the actual admin triage table and the actual notification toast.
- Nav-pill-group (`{component.nav-pill-group}`) — a small pill-radius wrapper used for the "My Reports / All Reports / Map View" view switcher.
- Avatars are circular (`{rounded.full}`), 36px diameter, used for citizen profile menus and admin assignment rows.
- Footer is dark navy-slate (`{colors.surface-dark}` — #101828) with light text (`{colors.on-dark-soft}` — #a1a9b8).
- Spacing rhythm is `{spacing.section}` (96px) between major bands.
- Border radius is hierarchical: `{rounded.md}` (8px) for buttons + inputs, `{rounded.lg}` (12px) for cards, `{rounded.xl}` (16px) for the hero map-mockup container, `{rounded.pill}` for status/category badges + upvote pills, `{rounded.full}` for avatars + icon buttons.

## Colors

### Brand & Status
- **Primary** (`{colors.primary}` — #111111): The dominant action color. All primary CTAs, h1/h2 display type. Press state shifts to `{colors.primary-active}` (#242424).
- **Brand Accent** (`{colors.brand-accent}` — #2563eb): Used sparingly on inline links and the "View on Map" affordance. The platform stays near-monochrome at the action layer — blue is reserved, not decorative.
- **Status Colors** — the functional accent system, used exclusively on `{component.status-badge}`:
  - Reported (`{colors.status-reported}` — #f59e0b, amber): newly submitted, awaiting review.
  - Verified (`{colors.status-verified}` — #3b82f6, blue): confirmed valid by an administrator.
  - In Progress (`{colors.status-inprogress}` — #8b5cf6, violet): actively being worked by a department/crew.
  - Resolved (`{colors.status-resolved}` — #10b981, emerald): issue fixed and closed.
  - Rejected (`{colors.status-rejected}` — #ef4444, red): invalid or insufficient-info, terminal state.
- **Category Colors** — a small pastel set for `{component.category-badge}`: Waste (`{colors.category-waste}` — #fb923c), Water (`{colors.category-water}` — #38bdf8), Drainage (`{colors.category-drainage}` — #8b5cf6). Category badges are visually distinct from status badges (different hue family) so a report card never reads ambiguously.

### Surface
- **Canvas** (`{colors.canvas}` — #ffffff): The default page floor for both the marketing site and the app shell.
- **Surface Soft** (`{colors.surface-soft}` — #f8f9fa): Nav-pill-group background, soft section dividers.
- **Surface Card** (`{colors.surface-card}` — #f5f5f5): Feature cards, stat cards on the dashboard summary row, testimonial cards, badge fallback fill.
- **Surface Strong** (`{colors.surface-strong}` — #e5e7eb): Hairline border alternative; disabled button background.
- **Surface Dark** (`{colors.surface-dark}` — #101828): Footer background — the only dark surface in the system.
- **Surface Dark Elevated** (`{colors.surface-dark-elevated}` — #1a2333): Nested cards inside the dark footer (e.g. a footer "Report an Issue" mini-CTA block).
- **Hairline** (`{colors.hairline}` — #e5e7eb): 1px border tone — report card outlines, table row dividers, input borders.
- **Hairline Soft** (`{colors.hairline-soft}` — #f3f4f6): Barely-visible divider between sections sharing the white canvas.

### Text
- **Ink** (`{colors.ink}` — #111111): Headlines, primary text, report titles.
- **Body** (`{colors.body}` — #374151): Default running text, report descriptions.
- **Muted** (`{colors.muted}` — #6b7280): Secondary text — timestamps, ward/location metadata, breadcrumbs.
- **Muted Soft** (`{colors.muted-soft}` — #898989): Tertiary text — fine print, report IDs, footer copyright line.
- **On Primary / On Dark** (`{colors.on-primary}` / `{colors.on-dark}` — #ffffff): Text on primary buttons and dark footer.
- **On Dark Soft** (`{colors.on-dark-soft}` — #a1a9b8): Footer body text.

### Semantic
- **Success** (`{colors.success}` — #10b981): Confirmation toasts ("Report submitted"), aliases `{colors.status-resolved}`.
- **Warning** (`{colors.warning}` — #f59e0b): Warning callouts, aliases `{colors.status-reported}`.
- **Error** (`{colors.error}` — #ef4444): Form validation errors, aliases `{colors.status-rejected}`.

## Typography

### Font Family
The system runs a **Cal Sans-style geometric display face** for headlines and brand wordmark, and **Inter** for everything else. Inter handles body copy, buttons, navigation, form labels, table content, and the monospace-adjacent report-ID captions. Fallback stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.

The split is functional:
- Display face (600 weight, -0.4 to -1.75px tracking) — h1, h2, h3, hero headline ("Report civic issues. Track real resolution.")
- Inter (400–600 weight, 0 letter-spacing) — paragraphs, labels, buttons, nav, table cells, form fields

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 60px | 600 | 1.08 | -1.75px | Homepage h1 ("Report it. Track it. Get it resolved.") |
| `{typography.display-lg}` | 44px | 600 | 1.12 | -1.25px | Section heads ("How resolution works") |
| `{typography.display-md}` | 32px | 600 | 1.18 | -0.75px | Sub-section heads, dashboard summary heading |
| `{typography.display-sm}` | 26px | 600 | 1.22 | -0.4px | CTA-band heads, stat-card big numbers |
| `{typography.title-lg}` | 22px | 600 | 1.3 | -0.3px | Report detail title |
| `{typography.title-md}` | 18px | 600 | 1.4 | 0 | Feature card titles, report card titles |
| `{typography.title-sm}` | 16px | 600 | 1.4 | 0 | Small card titles, admin table column emphasis |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Default running text, report descriptions |
| `{typography.body-sm}` | 14px | 400 | 1.5 | 0 | Footer body, fine-print, table cells |
| `{typography.caption}` | 13px | 500 | 1.4 | 0 | Status badges, category badges, timestamps |
| `{typography.code}` | 14px | 400 | 1.5 | 0 | Report ID, API examples |
| `{typography.button}` | 14px | 600 | 1.0 | 0 | Standard button labels |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top-nav menu items |

### Principles
The display face is the brand voice — every headline uses it. Inter handles the supporting type, and critically, **all data-dense surfaces** (admin table, report list, notification feed) — data density needs Inter's neutrality, not display flourish. Display weight stays at 600 across all sizes — never 700, never 500.

### Note on Font Substitutes
If the licensed display face is unavailable, **Inter** at weight 600 with -0.04em letter-spacing is a usable approximation. **Manrope** at weight 700 is another close alternative.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** `{spacing.section}` (96px) on the marketing/landing pages; the in-app dashboard uses a tighter `{spacing.xl}` (32px) rhythm since it's a working tool, not editorial content.
- **Card internal padding:** `{spacing.xl}` (32px) for feature cards; `{spacing.lg}` (24px) for testimonial and stat cards; `{spacing.md}`–`{spacing.lg}` (16–24px) for report cards, which need to stay compact in list views.
- **Gutters:** `{spacing.lg}` (24px) between cards in 3-up grids; `{spacing.sm}` (12px) between stacked report cards in a feed.

### Grid & Container
- **Max content width:** ~1200px centered on marketing pages; the admin dashboard and map view can go full-bleed within a sidebar shell.
- **Editorial body:** Single 12-column grid; hero band uses a 6/6 split (h1 + CTA left, live interactive map with pins right).
- **Feature card grids:** 3-up at desktop, 2-up at tablet, 1-up at mobile.
- **Dashboard summary row:** 4-up `{component.stat-card}` grid (Total Reports / In Progress / Resolved / My Reports) at desktop, 2-up at tablet.
- **Report feed:** Single-column list on mobile and the citizen "My Reports" view; 2-column masonry-style option for the public "All Reports" browse view.
- **Admin triage table:** Full-width responsive table, collapsing to stacked report cards below tablet width.
- **Footer:** 4-column link list at desktop, wrapping to 2-up at tablet, 1-up at mobile.

### Whitespace Philosophy
Marketing surfaces use generous whitespace (96px section padding) to build institutional trust. The in-app dashboard tightens the rhythm considerably — citizens and admins are scanning many report rows, so density wins over air once inside the product. The result: an editorial, breathing marketing site that hands off to a brisk, table-dense working tool.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Body sections, top nav, hero band |
| Soft hairline | 1px `{colors.hairline}` border | Inputs, table dividers, report cards |
| Card surface | `{colors.surface-card}` background — no shadow | Feature cards, stat cards, testimonials |
| Subtle drop shadow | Faint shadow at low alpha | Hero map-mockup card, open report popup on the map, notification toast (`0 1px 2px rgba(0,0,0,0.05)` and `0 4px 12px rgba(0,0,0,0.08)`) |
| Footer | `{colors.surface-dark}` background, no shadow needed | Closes every marketing page |

The elevation philosophy is **soft and modern** — small drop shadows on elevated/interactive elements (map popups, toasts), color-block contrast (status badges) for at-a-glance meaning rather than depth for emphasis.

### Decorative Depth
- The Leaflet map itself carries its own native tile rendering and pin-drop shadow — not a system token, it's product chrome shown as hero content.
- Report card photo thumbnails use a subtle inset hairline to separate them from the card's white background.
- Avatar circles in admin assignment rows sometimes carry pastel category-color fills — a small chromatic flourish tied to functional meaning, not decoration.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Reserved for inline badge accents |
| `{rounded.sm}` | 6px | Small inline buttons, dropdown items |
| `{rounded.md}` | 8px | Standard CTA buttons, text inputs, category tabs |
| `{rounded.lg}` | 12px | Content cards — feature cards, report cards, stat cards |
| `{rounded.xl}` | 16px | Hero map-mockup card (the marquee interactive-map component) |
| `{rounded.pill}` | 9999px | Nav-pill-group, status badges, category badges, upvote pills |
| `{rounded.full}` | 9999px / 50% | Avatars, icon buttons |

### Photography / Media Geometry
Avatar photos use `{rounded.full}` (perfect circles) at 36px. Report photo evidence thumbnails inside `{component.report-card}` use `{rounded.md}` (8px) corners at a fixed 4:3 aspect ratio for consistent grid alignment. The hero's interactive map uses `{rounded.xl}` (16px) corners with the map tiles clipped to the rounded container.

## Components

### Top Navigation

**`top-nav`** — White nav bar pinned to the top of every page. 64px tall, `{colors.canvas}` background. Carries the platform wordmark + civic icon at left, primary horizontal menu (Report an Issue, Browse Reports, Map View, How It Works) center, right-side cluster with "Sign in" text-link and "Report an Issue" `{component.button-primary}`. Once authenticated, the right cluster becomes a notification bell + `{component.avatar-circle}` profile menu.

**`nav-pill-group`** — A small pill-radius wrapper around 2–3 view-mode segments: "My Reports" / "All Reports" / "Map View" on the citizen dashboard, or "Pending" / "In Progress" / "Resolved" on the admin triage board. Background `{colors.surface-soft}`, internal padding 6px, rounded `{rounded.pill}`. Active segment renders as a white-canvas pill with subtle drop shadow.

### Buttons

**`button-primary`** — The signature primary CTA ("Report an Issue", "Submit Report", "Verify Report"). Background `{colors.primary}` (#111111), text `{colors.on-primary}`, type `{typography.button}`, padding 12px × 20px, height 40px, rounded `{rounded.md}`. Active state shifts to `{colors.primary-active}`.

**`button-secondary`** — White button with hairline outline. Used for "Cancel", "Save Draft", secondary admin actions ("Reject" uses this styling + error-tinted text rather than a red fill, keeping the action layer monochrome).

**`button-icon-circular`** — 36 × 36px circular icon button. Used for the map's zoom controls, "share report" action, and carousel arrows on the testimonial band.

**`button-text-link`** — Inline text button. Used for "Sign in" in the top nav and "View full report →" links inside report cards.

**`text-link`** — Inline body links in `{colors.ink}`.

### Cards & Containers

**`hero-band`** — White-canvas hero with a 6-6 grid: h1 + sub-headline + "Report an Issue" button on the left, `{component.hero-map-mockup-card}` on the right showing a live-styled map with colored status pins and one open report popup. Vertical padding `{spacing.section}` (96px).

**`hero-map-mockup-card`** — The hero's right-side artifact: a stylized Leaflet map fragment with 4–6 pins color-coded by status, one pin expanded into a small popup card showing a report thumbnail, category badge, and status badge. Background `{colors.canvas}`, 1px hairline border, rounded `{rounded.xl}` (16px), subtle drop shadow.

**`feature-card`** — Used in 3-up feature grids ("Report with a photo and pin", "Track status in real time", "Upvote issues near you"). Background `{colors.surface-card}`, rounded `{rounded.lg}`, padding `{spacing.xl}` (32px). Icon at top, `{typography.title-md}` headline, `{typography.body-md}` description.

**`report-card`** — The core recurring unit of the app: shown in the citizen's "My Reports" feed, the public "All Reports" browse view, and (in a denser row variant) the admin triage table. Background `{colors.canvas}`, 1px hairline border, rounded `{rounded.lg}`, padding `{spacing.lg}` (24px). Layout: photo thumbnail left, then title (`{typography.title-md}`), location + timestamp (`{typography.caption}`, muted), `{component.category-badge}` + `{component.status-badge}` side by side, description truncated to 2 lines, and an `{component.upvote-pill}` in the bottom-right corner.

**`status-badge`** — Pill label showing the report's current lifecycle state. Background is a tinted-10%-opacity version of the relevant status color with full-opacity text in that same color (e.g. Resolved badge: `{colors.status-resolved}` text on a pale emerald fill). Type `{typography.caption}`, rounded `{rounded.pill}`, padding 4px × 12px. This is the system's single most important recurring component — it must be instantly scannable across a dense report list.

**`category-badge`** — Pill label for issue category (Waste / Water / Drainage), using the `{colors.category-*}` palette in the same tinted-fill pattern as status badges, but visually distinct (different hue family, sits to the left of the status badge on a report card so the two are never confused).

**`stat-card`** — Used in the dashboard summary row ("124 Total Reports", "38 In Progress", "76 Resolved"). Background `{colors.canvas}`, rounded `{rounded.lg}`, padding `{spacing.lg}` (24px). Big number in `{typography.display-sm}`, label underneath in `{typography.caption}` muted.

**`timeline-step`** — A single row in the incident-lifecycle timeline shown on a report's detail page (Reported → Verified → In Progress → Resolved). Each step shows a small status-colored dot, the step label, and a timestamp. Completed steps render solid; the current step pulses subtly; future steps render in `{colors.muted-soft}`.

**`testimonial-card`** — Used in citizen/administrator quote grids on the marketing site. Background `{colors.surface-card}`, rounded `{rounded.lg}`, padding `{spacing.lg}` (24px). Top row carries `{component.avatar-circle}` + name + ward/role; below sits the quote in `{typography.body-md}`.

### Inputs & Forms

**`text-input`** — Standard text input used in the report-submission form (title, description). Background `{colors.canvas}`, rounded `{rounded.md}` (8px), padding 10px × 14px, height 40px, 1px hairline border.

**`text-input-focused`** — Focus state; border shifts to `{colors.ink}`.

The report-submission form additionally includes a **map-picker field** (an embedded Leaflet instance for pinning exact location, styled with the same `{rounded.lg}` card treatment as `report-card`) and a **photo-upload dropzone** (dashed hairline border, `{rounded.md}`, centered upload icon + "Drop a photo or click to upload" caption).

### Tags / Badges

**`status-badge`** and **`category-badge`** — see above; these are the system's functional badge language, replacing generic decorative badge-pills.

**`avatar-circle`** — 36px diameter, rounded `{rounded.full}`. Holds a citizen's photo/initials, or (in the admin dashboard) the assigned department crew's initials on a category-tinted fill.

**`upvote-pill`** — A small interactive pill on each report card showing an upvote icon + count. Background `{colors.surface-card}` at rest; fills to a light `{colors.brand-accent}` tint when the current user has upvoted.

### Tab / Filter

**`category-tab`** + **`category-tab-active`** — Used inside `nav-pill-group` and as a horizontal filter row above the report feed (All / Waste / Water / Drainage). Inactive: transparent, `{colors.muted}` text. Active: `{colors.canvas}` background, `{colors.ink}` text, subtle inset shadow.

### CTA / Footer

**`cta-band-light`** — A pre-footer "See something? Report it in under a minute" CTA card. Background `{colors.surface-card}`, rounded `{rounded.lg}`, padding `{spacing.xxl}` (48px). h2 in `{typography.display-sm}`, sub-line, centered `{component.button-primary}`.

**`footer`** — Dark navy-slate footer closing every page. Background `{colors.surface-dark}` (#101828), text `{colors.on-dark-soft}`. 4-column link list at desktop covering Platform / For Citizens / For Administrators / Resources. Vertical padding 64px. Wordmark top-left in `{colors.on-dark}`.

## Do's and Don'ts

### Do
- Reserve `{colors.primary}` (#111111) for primary CTAs and h1/h2 type. Keep the action layer monochrome.
- Reserve the status palette (`{colors.status-*}`) exclusively for `{component.status-badge}` and `{component.timeline-step}` dots. Never use a status color on a button or headline — that would blur "system state" with "brand action."
- Keep category badges and status badges visually distinct (different hue families) so they never get confused on a dense report card.
- Embed the real interactive map, real report cards, and real status badges in marketing sections. Don't paint illustrations of civic reporting when the actual product UI communicates it better.
- Keep avatar circles at 36px, perfect circles, with category-tinted fills where relevant.
- Tighten spacing inside the app shell relative to the marketing site — the dashboard is a working tool, not editorial content.
- End every marketing page with the dark footer.

### Don't
- Don't use `{colors.brand-accent}` or category colors on primary CTAs. The action layer stays monochrome.
- Don't bold display weight beyond 600.
- Don't use rounded radius beyond `{rounded.xl}` (16px) on cards.
- Don't put dark surface cards anywhere except the footer. The dark surface is a deliberate, scarce signal.
- Don't let a status badge and a category badge share the same color family — that ambiguity defeats the badge system's purpose.
- Don't add hover state styling beyond what the system already encodes.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Hamburger nav; hero h1 60→32px; hero-map-mockup-card stacks below content; feature grids 1-up; stat-card grid 2-up; report feed single column; admin table collapses to stacked report cards; footer 4 cols → 1 |
| Tablet | 768–1024px | Top nav stays horizontal but tightens; nav-pill-group wraps; feature cards 2-up; stat-card grid 2-up; admin table scrolls horizontally |
| Desktop | 1024–1440px | Full top-nav with all menu items; 3-up feature cards; 4-up stat cards; full admin triage table |
| Wide | > 1440px | Same as desktop with more outer breathing room; max content width caps at 1200px on marketing pages; dashboard can go full-bleed |

### Touch Targets
- `{component.button-primary}` at minimum 40 × 40px.
- `{component.button-icon-circular}` at exactly 36 × 36.
- `{component.text-input}` height is 40px.
- `{component.upvote-pill}` and `{component.status-badge}` tap targets padded to 44px+ effective area even though visual padding is smaller.

### Collapsing Strategy
- Top nav collapses to hamburger at < 768px; menu opens as a full-screen sheet.
- Hero band's 6-6 grid collapses to single-column on mobile — h1 + sub-head + CTA first, then the map card below.
- Feature grids and stat-card grids reduce columns rather than scaling cards down.
- The admin triage table collapses into stacked `{component.report-card}` rows below tablet width, preserving the status-badge / category-badge pairing.
- Nav-pill-group wraps to multi-row on tablet if segments don't fit horizontally.
- The map-picker field in the report-submission form remains full-width and touch-draggable at every breakpoint.

### Image Behavior
- Report photo thumbnails crop to a fixed 4:3 ratio with `{rounded.md}` corners at every breakpoint.
- Avatar photos crop to circles at every breakpoint.
- The hero map-mockup card scales proportionally on mobile — pins and the open popup stay legible.

## Iteration Guide

1. Focus on ONE component at a time. Reference its YAML key directly (`{component.report-card}`, `{component.status-badge}`).
2. Variants of an existing component (`-active`, `-disabled`, `-focused`) live as separate entries in `components:`.
3. Use `{token.refs}` everywhere — never inline hex.
4. Never document hover. Default and Active/Pressed states only.
5. Display headlines stay in the display face at 600 with negative letter-spacing. Body stays Inter 400.
6. The dark footer is the only dark surface. Don't add other dark cards casually.
7. Status color and category color are functional, not decorative — never repurpose them for generic brand accents.
8. When in doubt about emphasis: bigger display type before bolder display type.

## Known Gaps

- The licensed display face (Cal Sans-style) is not a public web font; substitutes are documented in the typography section.
- Status-badge tint percentages (10% fill) and exact hover/press states for the admin triage table are not yet extracted from a live build — documented from standard SaaS badge conventions.
- Animation/transition timings (map pin drop, status-badge transition on lifecycle change, toast entrance) are not in scope.
- The offline/PWA-specific UI states (queued-report indicator, sync-pending badge) are not yet specified and should be added once the offline flow is implemented.
- Form validation states beyond `{component.text-input-focused}` are not extracted — error/success states would need the live report-submission flow to confirm.
