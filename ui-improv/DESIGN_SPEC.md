# MotoCheck — Design System & Upgrade Spec
## Implementation guide for your coding agent

---

## File manifest

```
tailwind.config.js                    ← Custom theme tokens (fonts, colors, shadows, keyframes)
src/app.css                           ← Tailwind @layer base + components + all custom classes
src/routes/+layout.svelte             ← Nav + Footer shared layout
src/routes/+page.svelte               ← Full home page (all sections)
src/routes/sample-report/+page.svelte ← Sample report viewer
```

---

## Design decisions

### Typography
- **Display / headings:** `Instrument Serif` (from Google Fonts) — loaded in `app.css` via `@import`.
  Elegant, editorial serif that contrasts sharply with the data-dense UI.
- **Body / UI:** `DM Sans` (fallback `IBM Plex Sans`) — clean, contemporary, optically balanced at small sizes.
- **Monospace:** `IBM Plex Mono` — used for VIN strings and tabular figures only.

Load fonts in `app.html` or via `@import` in `app.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');
```

### Colour palette

| Token              | Hex       | Use                                  |
|--------------------|-----------|--------------------------------------|
| `gold-500`         | `#d4943a` | Primary CTA, accents, stars          |
| `gold-400`         | `#efc358` | Rule lines, borders, hover           |
| `gold-100`         | `#faefd0` | Badge backgrounds                    |
| `navy-800`         | `#1a3059` | Testimonial avatars, dark accents    |
| `ink` / `#0f0f0f`  | `#0f0f0f` | Primary text, dark button bg         |
| `ink-muted`        | `#6b7280` | Secondary text                       |
| `ink-faint`        | `#9ca3af` | Placeholder, captions                |
| `surface-subtle`   | `#f8f8f6` | Alternate section backgrounds        |
| `surface-warm`     | `#faf9f7` | Cards, sidebars                      |
| `surface-border`   | `#e8e8e4` | All dividers and card borders        |
| `white`            | `#ffffff`  | Page background, main sections       |

No gradients on CTAs. The gold button is a flat solid `#d4943a` with a subtle shadow. The dark CTA section (final section) uses `bg-ink` (#0f0f0f) — the only truly dark background on the page.

### Spacing philosophy
- Section vertical padding: `py-20 md:py-28` (class: `section-pad`)
- Container max-width: `max-w-7xl` with horizontal padding `px-5 sm:px-8 lg:px-12`
- Cards: `p-6 md:p-8` for large, `p-5` for small
- Grid gaps: `gap-6` default, `gap-5` on tight grids

### Shadows
- `shadow-crisp`: very subtle, barely-there elevation
- `shadow-card`: default card shadow (soft, no hard edge)
- `shadow-lifted`: hover state elevation upgrade
- `shadow-gold`: gold-tinted glow on CTA buttons

---

## Component reference (from `app.css` @layer components)

### Buttons
```svelte
<a class="btn-gold">Primary CTA</a>          <!-- Gold fill, white text -->
<button class="btn-primary">Dark CTA</button> <!-- Black fill, white text -->
<a class="btn-ghost">Secondary</a>            <!-- Bordered, transparent -->
<a class="btn-link">Text link →</a>           <!-- Underline on hover -->
```

### Typography helpers
```svelte
<h1 class="heading-display">…</h1>         <!-- Largest display, Instrument Serif -->
<h2 class="heading-section">…</h2>         <!-- Section titles -->
<span class="eyebrow">Section label</span>  <!-- Uppercase tracking, gold -->
<p class="body-lg">…</p>                    <!-- Light-weight lead text -->
<p class="body-base">…</p>                  <!-- Standard paragraph -->
```

### Cards
```svelte
<div class="card">…</div>           <!-- White, boxshadow, border -->
<div class="card-sm">…</div>        <!-- Smaller padding variant -->
<div class="card-surface">…</div>   <!-- Warm off-white tint, no shadow -->
```

### Badges
```svelte
<span class="badge-gold">NHTSA</span>
<span class="badge-green">Verified</span>
<span class="badge-neutral">Label</span>
<span class="badge-navy">Navy</span>
```

### Form inputs
```svelte
<label class="label-base" for="x">Label</label>
<input class="input-base" />    <!-- Standard input -->
<input class="input-lg" />      <!-- Large, monospace (VIN input) -->
```

### Section decoration
```svelte
<!-- Eyebrow line rule -->
<div class="section-rule">
  <span class="eyebrow">Label</span>
</div>
<!-- renders: gold line — LABEL -->
```

### Data table
```svelte
<table class="data-table">
  <thead><tr><th>Col A</th><th>Col B</th></tr></thead>
  <tbody><tr><td>…</td><td>…</td></tr></tbody>
</table>
```

### FAQ (accordion)
```svelte
<div class="faq-item">
  <button class="faq-trigger">Question <PlusIcon/></button>
  {#if open}
    <div class="faq-content animate-fade-in">Answer text</div>
  {/if}
</div>
```

---

## Page sections (home `+page.svelte`)

| Section         | Anchor       | Notes                                                   |
|-----------------|--------------|----------------------------------------------------------|
| Hero            | `#vin-form`  | VIN input + inline report preview card (desktop)         |
| Stats bar       | —            | 4-col row beneath hero: reports, price, speed, accuracy  |
| How It Works    | `#how-it-works` | 3-step cards with connecting line                     |
| What We Inspect | `#features`  | 2-col feature grid, sticky left header on desktop        |
| Pricing         | `#pricing`   | Single card, full feature list, gold CTA                 |
| Testimonials    | —            | 3-col testimonial cards                                  |
| FAQ             | `#faq`       | Accordion, left description, right questions             |
| CTA             | —            | Dark (`bg-ink`) section, gold button                     |

---

## Sample report page

Layout: 2/3 main + 1/3 sticky sidebar on desktop.

Main column sections (top → bottom):
1. **Vehicle identity card** — year/make/model/trim headline, badge
2. **Vehicle specifications table** — all decoded VIN fields
3. **Manufacturing details table** — plant, date, origin, market
4. **Safety recalls card** — green "no recalls" state, or list of active ones

Sidebar (sticky):
1. **Import duty summary** — line-by-line with gold accent header
2. **NCS valuation** — reference USD value
3. **Report metadata** — generated date, data sources, FX rate
4. **CTA** — "Check Your Own VIN" button

---

## Integration notes for your agent

### SvelteKit routing
The current codebase uses file-based routing. The files map directly:
```
src/routes/+layout.svelte             → shared nav + footer
src/routes/+page.svelte               → /
src/routes/sample-report/+page.svelte → /sample-report
```

### VIN form submission
In `+page.svelte`, `handleSubmit` currently uses `window.location.href`. Replace with SvelteKit's `goto()` from `$app/navigation`:
```typescript
import { goto } from '$app/navigation';
// ...
await goto(`/report?vin=${vin}`);
```

### Report data
The `sample-report` page uses hardcoded demo data. In production, wire up:
```typescript
// src/routes/report/+page.ts
export async function load({ url, fetch }) {
  const vin = url.searchParams.get('vin');
  const res = await fetch(`/api/report/${vin}`);
  return await res.json();
}
```

### Paystack integration
After VIN validation, redirect to a `/checkout?vin=...` route. On Paystack `onSuccess`, call your Go backend to generate and email the report, then redirect to `/report/:id`.

### Clerk auth (if gating reports)
Wrap report fetch behind `locals.session` in your `+page.server.ts` load function. The design doesn't assume auth — all pages are publicly accessible in this implementation.

### Environment-aware font loading
Consider loading Google Fonts via `<svelte:head>` in `+layout.svelte` rather than `@import` in CSS to avoid render-blocking:
```svelte
<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>
```

---

## What was removed / changed vs original

| Original                               | New                                                   |
|----------------------------------------|-------------------------------------------------------|
| Emoji-heavy copy ("🚗 Trusted by…")    | Clean badge with pulsing green dot                    |
| Generic Unsplash car photo             | Inline report preview card (data-rich, branded)       |
| Flat feature icon tiles                | Cards with hover lift + gold icon accent              |
| Initials-only testimonial avatars      | Navy-background avatar + role context line            |
| Generic gradient CTAs                  | Flat gold button with `shadow-gold`                   |
| PDF iframe on sample-report page       | Full HTML report rendering (no iframe dependency)     |
| Basic FAQ list                         | Accordion with plus/close animation                   |
| Footer with sparse copy                | 4-col footer with trust marks, Paystack + NHTSA tags  |
| No pricing section                     | Dedicated pricing card with full feature checklist    |
| No "How It Works" detail               | 3-step cards with number markers + connecting rule    |
| No stats bar                           | 4-metric stats row under hero                        |
