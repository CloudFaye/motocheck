# UI Redesign Implementation - Design Document

## Overview

This design document specifies the technical architecture for integrating a comprehensive UI redesign into the MotoCheck SvelteKit application. The redesign introduces a new design system with a white, editorial, trustworthy fintech aesthetic while preserving all existing functionality, API integrations, and user workflows.

### Design Goals

1. **Visual Transformation**: Replace current UI with new design system featuring Instrument Serif display typography, warm gold accents (#d4943a), and refined component styling
2. **Zero Regression**: Maintain 100% compatibility with existing VIN validation, API endpoints, payment flows, and data processing
3. **Modern Framework**: Migrate to Svelte 5 syntax ($state, onclick, {@render children()})
4. **Performance**: Optimize font loading, minimize bundle size, ensure fast initial page loads
5. **Accessibility**: Meet WCAG AA standards with proper semantic HTML, ARIA labels, and keyboard navigation

### Scope

**In Scope:**
- Tailwind CSS configuration migration (v4 inline @theme → v3 config.js)
- Application stylesheet replacement (layout.css → app.css)
- Layout component redesign (navigation + footer)
- Homepage redesign (hero, stats, features, pricing, testimonials, FAQ, CTA)
- Sample report page creation (HTML rendering with sticky sidebar)
- Svelte 5 syntax migration
- Responsive design implementation
- Animation and interaction patterns

**Out of Scope:**
- Changes to API endpoints or server-side logic
- Database schema modifications
- Payment gateway integration changes
- PDF generation logic changes
- Email delivery system changes
- Authentication/authorization changes

### Key Design Decisions

1. **Tailwind Migration Strategy**: Replace v4 inline @theme with traditional tailwind.config.js at project root
2. **Font Loading**: Use @import in CSS for simplicity (can be optimized to <link> tags later)
3. **Component Strategy**: Blend custom CSS classes (btn-gold, card) with existing shadcn-svelte components
4. **Layout Architecture**: Fixed navigation with backdrop blur, 4-column footer, mobile hamburger menu
5. **Sample Report**: Render as HTML (not PDF iframe) with 2/3 main + 1/3 sticky sidebar layout

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
├─────────────────────────────────────────────────────────┤
│  SvelteKit Routes                                        │
│  ├─ +layout.svelte (Nav + Footer)                       │
│  ├─ +page.svelte (Homepage)                             │
│  ├─ sample-report/+page.svelte (Sample Report)          │
│  ├─ preview/[lookupId]/+page.svelte (Existing)          │
│  └─ checkout/[lookupId]/+page.svelte (Existing)         │
├─────────────────────────────────────────────────────────┤
│  Design System                                           │
│  ├─ tailwind.config.js (Theme tokens)                   │
│  ├─ app.css (Component classes)                         │
│  └─ Google Fonts (Instrument Serif, DM Sans, IBM Plex)  │
├─────────────────────────────────────────────────────────┤
│  Existing Components                                     │
│  ├─ shadcn-svelte (Button, Input, Label, Toaster)       │
│  └─ VIN Validator ($lib/vin-validator)                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  API Layer (Existing)                    │
│  ├─ POST /api/vin (VIN lookup)                          │
│  ├─ POST /api/pay/initiate (Payment)                    │
│  └─ POST /api/webhook/* (Payment webhooks)              │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

The UI redesign preserves the existing data flow:

```
User Input (VIN) 
  → sanitizeVIN() 
  → validate 
  → POST /api/vin 
  → { lookupId, vehicleData }
  → Navigate to /preview/{lookupId}
  → User clicks "Purchase"
  → /checkout/{lookupId}
  → Paystack payment
  → Webhook → Generate PDF → Email
  → Redirect to /payment/success
```

### Technology Stack

- **Framework**: SvelteKit (existing)
- **Styling**: Tailwind CSS v3 (migrated from v4)
- **Typography**: Google Fonts (Instrument Serif, DM Sans, IBM Plex Mono)
- **Components**: shadcn-svelte (existing) + custom CSS classes
- **State Management**: Svelte 5 $state() runes
- **Validation**: Existing $lib/vin-validator
- **Payment**: Existing Paystack integration
- **Notifications**: Existing svelte-sonner

## Components and Interfaces

### 1. Tailwind Configuration (tailwind.config.js)

**Location**: Project root

**Purpose**: Define design system tokens (colors, typography, spacing, shadows, animations)

**Structure**:
```javascript
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        gold: { 50-900 scale },
        navy: { 50-900 scale },
        ink: { DEFAULT, soft, muted, faint },
        surface: { DEFAULT, subtle, warm, border },
      },
      fontSize: {
        display: ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.08' }],
        'display-sm': ['clamp(1.8rem, 3.5vw, 2.8rem)', { lineHeight: '1.1' }],
      },
      boxShadow: {
        crisp: '0 1px 3px 0 rgb(0 0 0 / 0.06)',
        lifted: '0 4px 16px -2px rgb(0 0 0 / 0.08)',
        card: '0 0 0 1px rgb(0 0 0 / 0.04), 0 8px 32px -4px rgb(0 0 0 / 0.08)',
        gold: '0 4px 20px -4px rgb(212 148 58 / 0.35)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both',
        'fade-in': 'fadeIn 0.4s ease both',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
```

**Integration Points**:
- Imported by Tailwind CSS processor
- Tokens available as utility classes throughout application
- Must preserve existing shadcn-svelte color tokens (primary, secondary, etc.)

### 2. Application Stylesheet (src/routes/app.css)

**Purpose**: Define base styles, component classes, and import fonts

**Structure**:
```css
/* Font imports */
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif...');
@import url('https://fonts.googleapis.com/css2?family=DM+Sans...');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono...');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Base resets, font smoothing, selection colors */
}

@layer components {
  /* Layout classes: container-wide, section-pad */
  /* Typography: heading-display, heading-section, eyebrow */
  /* Buttons: btn-primary, btn-gold, btn-ghost */
  /* Cards: card, card-sm, card-surface */
  /* Forms: input-base, input-lg, label-base */
  /* Badges: badge-gold, badge-green, badge-neutral */
  /* Tables: data-table */
  /* FAQ: faq-item, faq-trigger, faq-content */
  /* Navigation: nav-link */
  /* Report: report-section-head, report-icon */
}
```

**Key Classes**:
- `.btn-gold`: Primary CTA (gold background, white text, shadow-gold)
- `.btn-primary`: Dark CTA (ink background, white text)
- `.card`: White card with shadow-card and border
- `.heading-display`: Largest display heading (Instrument Serif, clamp sizing)
- `.eyebrow`: Small uppercase label (gold-500, tracking-widest)
- `.input-lg`: Large input for VIN (monospace, tracking-widest)
- `.data-table`: Styled table for report data

**Preservation**:
- Must keep existing Sonner toast overrides
- Must keep existing custom scrollbar styles

### 3. Layout Component (src/routes/+layout.svelte)

**Purpose**: Shared navigation and footer across all pages

**Structure**:
```svelte
<script lang="ts">
  import './app.css';
  let { children } = $props();
  let mobileOpen = $state(false);
</script>

<header class="fixed top-0 ...">
  <nav>
    <a href="/">Logo</a>
    <ul>Desktop Links</ul>
    <button onclick={() => mobileOpen = !mobileOpen}>Hamburger</button>
  </nav>
  {#if mobileOpen}
    <div>Mobile Menu</div>
  {/if}
</header>

<main class="pt-16">
  {@render children()}
</main>

<footer>
  <div>4-column layout</div>
  <div>Bottom bar</div>
</footer>
```

**State Management**:
- `mobileOpen`: Boolean for mobile menu visibility (Svelte 5 $state)

**Navigation Links**:
- Sample Report → /sample-report
- How It Works → /#how-it-works
- FAQ → /#faq
- Check VIN (CTA) → /#vin-form

**Footer Columns**:
1. Brand (logo, tagline, trust badges)
2. Product (Check VIN, Sample Report, How It Works, Pricing)
3. Support (FAQ, Contact, Privacy, Terms)
4. Contact (email, phone, location)

**Responsive Behavior**:
- Desktop: Horizontal nav with visible links
- Mobile: Hamburger menu with dropdown panel

### 4. Homepage Component (src/routes/+page.svelte)

**Purpose**: Main landing page with all marketing sections

**Structure**:
```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { sanitizeVIN, getVINError } from '$lib/vin-validator';
  import { toast } from 'svelte-sonner';

  let vin = $state('');
  let loading = $state(false);
  let openFaq = $state<number | null>(null);

  function handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    vin = sanitizeVIN(input.value);
  }

  async function handleSubmit() {
    const validationError = getVINError(vin);
    if (validationError) {
      toast.error('Invalid VIN', { description: validationError });
      return;
    }
    loading = true;
    try {
      const res = await fetch('/api/vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin })
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'VIN not found');
        loading = false;
        return;
      }
      const data = await res.json();
      goto(`/preview/${data.lookupId}`);
    } catch {
      toast.error('Network Error');
      loading = false;
    }
  }

  function toggleFaq(i: number) {
    openFaq = openFaq === i ? null : i;
  }
</script>

<section id="hero">Hero + VIN Form</section>
<section>Stats Bar</section>
<section id="how-it-works">How It Works</section>
<section id="features">What We Inspect</section>
<section id="pricing">Pricing</section>
<section>Testimonials</section>
<section id="faq">FAQ</section>
<section>Final CTA</section>
```

**State Variables**:
- `vin`: Current VIN input value (string, max 17 chars)
- `loading`: API call in progress (boolean)
- `openFaq`: Currently open FAQ index (number | null)

**Key Functions**:
- `handleInput()`: Sanitize VIN input, update state
- `handleSubmit()`: Validate VIN, call API, navigate to preview
- `toggleFaq()`: Open/close FAQ accordion items

**Sections**:
1. **Hero**: Headline, VIN form, preview card (desktop only)
2. **Stats Bar**: 4 metrics (reports, price, speed, accuracy)
3. **How It Works**: 3 step cards with connecting line
4. **What We Inspect**: Sticky header + 6 feature cards
5. **Pricing**: Single card with feature list
6. **Testimonials**: 3 customer cards with stars and quotes
7. **FAQ**: Accordion with 6 questions
8. **Final CTA**: Dark background with gold button

### 5. Sample Report Page (src/routes/sample-report/+page.svelte)

**Purpose**: Display full example report as HTML (not PDF)

**Structure**:
```svelte
<script lang="ts">
  const report = {
    vin: '1HGBH41JXMN109186',
    year: 2021,
    make: 'Honda',
    model: 'Accord',
    // ... all demo data
  };

  function fmt(n: number) {
    return '₦' + n.toLocaleString('en-NG');
  }
</script>

<div class="page-header">Title + CTA</div>

<div class="container-wide">
  <div class="grid lg:grid-cols-3 gap-8">
    
    <!-- Main content (2/3) -->
    <div class="lg:col-span-2">
      <div class="card">Vehicle Identity</div>
      <div class="card">Specifications Table</div>
      <div class="card">Manufacturing Details</div>
      <div class="card">Safety Recalls</div>
    </div>

    <!-- Sidebar (1/3) -->
    <div class="lg:sticky lg:top-24">
      <div class="card">Import Duty Summary</div>
      <div class="card">NCS Valuation</div>
      <div class="card">Report Metadata</div>
      <a href="/#vin-form" class="btn-gold">Check Your VIN</a>
    </div>

  </div>
</div>
```

**Data Structure**:
```typescript
interface ReportData {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  bodyStyle: string;
  color: string;
  fuelType: string;
  doors: number;
  plant: string;
  mfgDate: string;
  country: string;
  destMarket: string;
  gvwr: string;
  recalls: any[];
  cifUSD: number;
  exchangeRate: number;
  cifNGN: number;
  importDutyRate: number;
  importDutyNGN: number;
  levyNGN: number;
  vatNGN: number;
  portChargesNGN: number;
  totalNGN: number;
  ncsValuation: number;
  reportDate: string;
}
```

**Layout Behavior**:
- Desktop (lg+): 2/3 main + 1/3 sticky sidebar
- Mobile: Stacked (sidebar below main content)
- Sidebar sticks at `top-24` (below fixed nav)

### 6. VIN Validation Integration

**Existing Functions** (preserved):
```typescript
// $lib/vin-validator.ts
export function sanitizeVIN(input: string): string {
  return input.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17);
}

export function getVINError(vin: string): string | null {
  if (vin.length !== 17) return 'VIN must be exactly 17 characters';
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return 'VIN contains invalid characters';
  // ... checksum validation
  return null;
}
```

**Integration**:
- Import in homepage component
- Call `sanitizeVIN()` on every input event
- Call `getVINError()` before form submission
- Display error via toast notification

### 7. Component Class System

**Button Classes**:
```css
.btn-gold {
  /* Gold background, white text, shadow-gold */
  /* Hover: darker gold, translate-y-1px */
  /* Active: translate-y-0 */
}

.btn-primary {
  /* Ink background, white text */
  /* Hover: ink-soft, translate-y-1px */
}

.btn-ghost {
  /* Transparent, bordered */
  /* Hover: surface-subtle background */
}
```

**Card Classes**:
```css
.card {
  /* White background, shadow-card, border */
  /* Padding: p-6 md:p-8 */
  /* Rounded: rounded-2xl */
}

.card-sm {
  /* Smaller padding variant (p-5) */
  /* Rounded: rounded-xl */
}

.card-surface {
  /* Warm off-white background (surface-warm) */
  /* No shadow, just border */
}
```

**Typography Classes**:
```css
.heading-display {
  /* Instrument Serif, clamp(2.5rem, 5vw, 4.5rem) */
  /* Line height: 1.08, tracking: -0.02em */
}

.heading-section {
  /* Instrument Serif, clamp(1.8rem, 3.5vw, 2.8rem) */
  /* Line height: 1.1, tracking: -0.02em */
}

.eyebrow {
  /* Uppercase, tracking-widest, gold-500 */
  /* Font size: text-xs, font-semibold */
}
```

## Data Models

### VIN Form State

```typescript
interface VINFormState {
  vin: string;           // Current input value (0-17 chars)
  loading: boolean;      // API call in progress
  error: string | null;  // Validation error message
}
```

### FAQ State

```typescript
interface FAQState {
  openFaq: number | null;  // Index of currently open FAQ item
}
```

### Mobile Menu State

```typescript
interface MobileMenuState {
  mobileOpen: boolean;  // Mobile menu visibility
}
```

### Sample Report Data

```typescript
interface SampleReportData {
  // Vehicle Identity
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  
  // Specifications
  engine: string;
  transmission: string;
  drivetrain: string;
  bodyStyle: string;
  color: string;
  fuelType: string;
  doors: number;
  gvwr: string;
  
  // Manufacturing
  plant: string;
  mfgDate: string;
  country: string;
  destMarket: string;
  
  // Safety
  recalls: RecallItem[];
  
  // Duty Calculation
  cifUSD: number;
  exchangeRate: number;
  cifNGN: number;
  importDutyRate: number;
  importDutyNGN: number;
  levyNGN: number;
  vatNGN: number;
  portChargesNGN: number;
  totalNGN: number;
  
  // Metadata
  ncsValuation: number;
  reportDate: string;
}

interface RecallItem {
  campaign: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  date: string;
}
```

### API Response Types (Existing)

```typescript
// POST /api/vin response
interface VINLookupResponse {
  lookupId: string;
  vehicleData: {
    vin: string;
    year: number;
    make: string;
    model: string;
    // ... full vehicle data
  };
}

// Error response
interface APIError {
  error: string;
  details?: string;
}
```


## Implementation Strategy

### Phase 1: Configuration Setup

**Step 1.1: Create Tailwind Config**
- Create `tailwind.config.js` at project root
- Copy theme configuration from `ui-improv/tailwind.config.js`
- Ensure content paths include all Svelte files: `'./src/**/*.{html,js,svelte,ts}'`

**Step 1.2: Replace Application Stylesheet**
- Rename `src/routes/layout.css` to `src/routes/app.css`
- Copy content from `ui-improv/app.css`
- Remove Tailwind v4 @theme inline syntax
- Preserve existing Sonner toast overrides
- Preserve existing custom scrollbar styles
- Update import in `+layout.svelte` to reference `./app.css`

**Step 1.3: Verify Tailwind Build**
- Run `npm run dev` to ensure Tailwind processes correctly
- Check that new utility classes are available
- Verify no build errors or warnings

### Phase 2: Layout Component Migration

**Step 2.1: Update Navigation**
- Replace navigation markup in `src/routes/+layout.svelte`
- Implement fixed header with backdrop blur
- Add mobile hamburger menu with state management
- Use Svelte 5 $state() for `mobileOpen` variable
- Use onclick instead of on:click
- Ensure logo links to homepage
- Ensure CTA button links to `/#vin-form`

**Step 2.2: Update Footer**
- Replace footer markup in `src/routes/+layout.svelte`
- Implement 4-column layout (Brand, Product, Support, Contact)
- Add trust badges (NHTSA Verified, NCS Data)
- Add bottom bar with copyright and attribution
- Ensure responsive stacking on mobile

**Step 2.3: Update Children Rendering**
- Replace `<slot/>` with `{@render children()}`
- Ensure `let { children } = $props()` is declared

**Step 2.4: Preserve Toaster**
- Keep `<Toaster position="top-center" />` component
- Ensure it renders before navigation

### Phase 3: Homepage Redesign

**Step 3.1: Update Hero Section**
- Replace hero markup with new design
- Implement VIN form with character counter
- Add preview card (desktop only, hidden on mobile)
- Use existing `sanitizeVIN()` and `getVINError()` functions
- Integrate with existing `/api/vin` endpoint
- Use `goto()` for navigation to `/preview/{lookupId}`

**Step 3.2: Add Stats Bar**
- Add stats section below hero
- Display 4 metrics in grid layout
- Responsive: 2 columns on mobile, 4 on desktop

**Step 3.3: Add How It Works Section**
- Add 3 step cards with connecting line
- Use step numbers (01, 02, 03)
- Desktop: horizontal line connecting cards
- Mobile: vertical stack

**Step 3.4: Add What We Inspect Section**
- Add sticky left header (desktop only)
- Add 6 feature cards in 2-column grid
- Implement hover lift effect on cards

**Step 3.5: Add Pricing Section**
- Add single pricing card
- Display ₦2,500 price
- List all included features
- Add CTA button

**Step 3.6: Add Testimonials Section**
- Add 3 testimonial cards
- Display 5-star ratings
- Show customer names, roles, locations
- Use navy-800 background for avatars

**Step 3.7: Add FAQ Section**
- Add accordion with 6 questions
- Implement toggle state with $state()
- Animate plus icon rotation
- Use onclick for toggle function

**Step 3.8: Add Final CTA Section**
- Add dark section with ink background
- Add gold CTA button
- Add trust indicators

**Step 3.9: Migrate to Svelte 5 Syntax**
- Replace all `let` with `$state()` for reactive variables
- Replace all `on:event` with `onevent` attributes
- Ensure all event handlers are properly typed

### Phase 4: Sample Report Page

**Step 4.1: Create Sample Report Route**
- Create or replace `src/routes/sample-report/+page.svelte`
- Copy structure from `ui-improv/+page (1).svelte`

**Step 4.2: Implement Page Header**
- Add page header with title, description, CTA
- Use surface-warm background with border

**Step 4.3: Implement Main Content**
- Add vehicle identity card with NHTSA badge
- Add specifications table with data-table class
- Add manufacturing details table
- Add safety recalls card with "no recalls" state

**Step 4.4: Implement Sidebar**
- Add import duty summary card with gold accent
- Add line-by-line duty breakdown
- Add total estimate in large gold text
- Add NCS valuation card
- Add report metadata card
- Add CTA button

**Step 4.5: Implement Sticky Behavior**
- Use `lg:sticky lg:top-24` on sidebar container
- Ensure sidebar stacks below main content on mobile

**Step 4.6: Add Demo Data**
- Define demo report data in component script
- Use realistic values for 2021 Honda Accord
- Format currency with Nigerian Naira and USD symbols

### Phase 5: Responsive Design

**Step 5.1: Navigation Responsive**
- Desktop: Show all links inline
- Mobile: Show hamburger, hide links
- Mobile menu: Dropdown panel with fade-in animation

**Step 5.2: Homepage Responsive**
- Hero: Stack form above card on mobile
- Stats: 2 columns on mobile, 4 on desktop
- How It Works: Single column on mobile
- What We Inspect: Single column on mobile, sticky header disabled
- Testimonials: Single column on mobile

**Step 5.3: Sample Report Responsive**
- Desktop: 2/3 + 1/3 layout
- Mobile: Stack sidebar below main content
- Disable sticky behavior on mobile

**Step 5.4: Footer Responsive**
- Desktop: 4 columns
- Mobile: Single column stack

### Phase 6: Animation and Interaction

**Step 6.1: Implement Animations**
- Add fade-up animation to hero elements
- Add fade-in animation to mobile menu
- Add pulse-soft animation to trust badge dot
- Add hover lift effect to cards
- Add hover translate to buttons

**Step 6.2: Implement FAQ Accordion**
- Toggle open/close on click
- Rotate plus icon 45deg when open
- Fade in content when expanding

**Step 6.3: Implement Button Interactions**
- Hover: translate-y-1px, darker background
- Active: translate-y-0
- Focus: ring-2 ring-gold-300

### Phase 7: Testing and Verification

**Step 7.1: Functional Testing**
- Test VIN form validation with valid/invalid VINs
- Test VIN form submission and navigation
- Test error toast display
- Test loading state display
- Test mobile menu open/close
- Test FAQ accordion expand/collapse
- Test all navigation links
- Test responsive breakpoints

**Step 7.2: Visual Testing**
- Verify fonts load correctly
- Verify colors match design spec
- Verify shadows and borders render correctly
- Verify animations work smoothly
- Verify responsive layout on mobile, tablet, desktop

**Step 7.3: Accessibility Testing**
- Verify keyboard navigation works
- Verify focus indicators are visible
- Verify ARIA labels are present
- Verify heading hierarchy is correct
- Verify color contrast meets WCAG AA

**Step 7.4: Performance Testing**
- Verify fonts load without blocking render
- Verify no layout shifts during load
- Verify bundle size is reasonable
- Verify no console errors or warnings

## Migration Considerations

### Tailwind v4 to v3 Migration

**Current State** (layout.css):
```css
@theme inline {
  --color-primary: var(--primary);
  /* ... many tokens */
}
```

**New State** (tailwind.config.js):
```javascript
export default {
  theme: {
    extend: {
      colors: {
        gold: { /* ... */ },
        /* ... */
      }
    }
  }
}
```

**Migration Steps**:
1. Remove entire `@theme inline { }` block from layout.css
2. Create tailwind.config.js with new theme
3. Keep existing shadcn color tokens in CSS variables (--primary, --secondary, etc.)
4. New design uses gold/navy/ink/surface tokens
5. Both token systems coexist (shadcn for components, new for custom UI)

### Svelte 5 Syntax Migration

**Reactive Variables**:
```svelte
<!-- Old (Svelte 4) -->
<script>
  let vin = '';
  let loading = false;
</script>

<!-- New (Svelte 5) -->
<script>
  let vin = $state('');
  let loading = $state(false);
</script>
```

**Event Handlers**:
```svelte
<!-- Old (Svelte 4) -->
<button on:click={handleClick}>Click</button>
<input on:input={handleInput} />
<form on:submit={handleSubmit}>

<!-- New (Svelte 5) -->
<button onclick={handleClick}>Click</button>
<input oninput={handleInput} />
<form onsubmit={handleSubmit}>
```

**Slot Rendering**:
```svelte
<!-- Old (Svelte 4) -->
<slot />

<!-- New (Svelte 5) -->
{@render children()}
```

### Font Loading Strategy

**Option A: CSS @import** (Chosen for simplicity)
```css
/* app.css */
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');
```

**Option B: HTML <link> tags** (Better performance)
```svelte
<!-- +layout.svelte -->
<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif..." rel="stylesheet" />
</svelte:head>
```

**Decision**: Use Option A initially for simplicity. Can optimize to Option B later if performance metrics indicate font loading is blocking render.

### Component Integration Strategy

**Existing shadcn-svelte Components**:
- `<Button>` from $lib/components/ui/button
- `<Input>` from $lib/components/ui/input
- `<Label>` from $lib/components/ui/label
- `<Toaster>` from $lib/components/ui/sonner

**New Custom Classes**:
- `.btn-gold`, `.btn-primary`, `.btn-ghost` for styled links
- `.input-lg` for VIN input styling
- `.label-base` for form labels

**Integration Approach**:
1. **Form Submissions**: Use shadcn `<Button type="submit">` with custom classes
2. **Link CTAs**: Use `<a class="btn-gold">` for navigation links
3. **Form Inputs**: Use shadcn `<Input>` with custom classes for styling
4. **Form Labels**: Use shadcn `<Label>` with custom classes for styling
5. **Toasts**: Continue using existing svelte-sonner integration

**Example**:
```svelte
<!-- Form submission button -->
<Button type="submit" class="btn-gold w-full">Submit</Button>

<!-- Link CTA -->
<a href="/sample-report" class="btn-gold">View Sample</a>

<!-- VIN input -->
<Input 
  id="vin" 
  value={vin} 
  oninput={handleInput}
  class="input-lg"
/>
```

### Responsive Breakpoints

**Tailwind Breakpoints**:
- `sm`: 640px (small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (desktops)
- `xl`: 1280px (large desktops)

**Usage Patterns**:
- Navigation: `md:flex` for desktop links, `md:hidden` for hamburger
- Hero: `lg:grid-cols-2` for side-by-side layout
- Stats: `grid-cols-2 md:grid-cols-4` for responsive columns
- Sample Report: `lg:grid-cols-3` for sidebar layout
- Footer: `md:grid-cols-2 lg:grid-cols-4` for column layout

### Animation Timing

**Keyframes** (defined in tailwind.config.js):
```javascript
keyframes: {
  fadeUp: {
    '0%': { opacity: '0', transform: 'translateY(16px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  pulseSoft: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.6' },
  },
}
```

**Usage**:
- Hero elements: `animate-fade-up` with optional `animate-delay-200`
- Mobile menu: `animate-fade-in`
- Trust badge dot: `animate-pulse-soft`
- FAQ plus icon: `transition-transform duration-200` with `rotate-45` toggle
- Card hover: `transition-shadow duration-300` with `hover:shadow-lifted`
- Button hover: `transition-all duration-200` with `hover:-translate-y-px`

### Error Handling Strategy

**VIN Validation Errors**:
```typescript
// Client-side validation
const error = getVINError(vin);
if (error) {
  toast.error('Invalid VIN', { description: error });
  return;
}
```

**API Errors**:
```typescript
// Network errors
try {
  const res = await fetch('/api/vin', { ... });
  if (!res.ok) {
    const data = await res.json();
    toast.error(data.error || 'VIN not found');
    return;
  }
} catch {
  toast.error('Network Error');
}
```

**Loading States**:
```svelte
{#if loading}
  <div class="fixed inset-0 bg-white z-50">
    <div>Loading spinner + message</div>
  </div>
{/if}
```

**Form Validation States**:
- Invalid VIN: Red border on input, error text below
- Valid VIN: Green character counter (17/17)
- Disabled state: Opacity reduced, cursor not-allowed

### Accessibility Implementation

**Semantic HTML**:
```html
<header>
  <nav>
    <a href="/">Logo</a>
    <ul><li><a>Link</a></li></ul>
  </nav>
</header>

<main>
  <section>
    <h1>Heading</h1>
    <form>
      <label for="vin">Label</label>
      <input id="vin" />
    </form>
  </section>
</main>

<footer>
  <div>Footer content</div>
</footer>
```

**ARIA Labels**:
```svelte
<button aria-label="Toggle menu" onclick={...}>
  <svg>Hamburger icon</svg>
</button>

<button aria-expanded={openFaq === i} onclick={...}>
  FAQ question
</button>
```

**Keyboard Navigation**:
- All interactive elements focusable via Tab
- Form submission via Enter key
- FAQ toggle via Enter/Space
- Mobile menu toggle via Enter/Space
- Focus indicators visible (ring-2 ring-gold-300)

**Color Contrast**:
- Body text (ink #0f0f0f) on white: 20.83:1 (AAA)
- Muted text (ink-muted #6b7280) on white: 4.69:1 (AA)
- Gold button text (white) on gold-500 (#d4943a): 4.52:1 (AA)
- All combinations meet WCAG AA minimum 4.5:1 for normal text

### Performance Optimization

**Font Loading**:
- Use `font-display: swap` in Google Fonts URL
- Preconnect to fonts.googleapis.com and fonts.gstatic.com (if using <link>)
- Limit to 3 font families (Instrument Serif, DM Sans, IBM Plex Mono)
- Limit font weights loaded (only used weights)

**Image Optimization**:
- Use lazy loading for below-fold images: `loading="lazy"`
- Use appropriate image formats (WebP with fallback)
- Specify width and height to prevent layout shift

**CSS Optimization**:
- Tailwind JIT generates only used utilities
- Component classes in @layer components for proper cascade
- Minimize custom CSS (rely on Tailwind utilities)

**JavaScript Optimization**:
- SvelteKit code splitting by route
- No additional dependencies added
- Existing dependencies preserved (svelte-sonner, shadcn-svelte)

**Animation Performance**:
- Use CSS transforms (translate, rotate) instead of layout properties
- Use opacity transitions instead of visibility
- Hardware-accelerated properties only

### Integration Testing Checklist

**VIN Form Flow**:
1. Enter invalid VIN → See error toast
2. Enter valid VIN → Character counter turns green
3. Submit form → Loading state displays
4. API success → Navigate to /preview/{lookupId}
5. API failure → Error toast displays, loading state clears

**Navigation Flow**:
1. Click logo → Navigate to homepage
2. Click "Sample Report" → Navigate to /sample-report
3. Click "How It Works" → Scroll to #how-it-works
4. Click "FAQ" → Scroll to #faq
5. Click "Check VIN" CTA → Scroll to #vin-form

**Mobile Menu Flow**:
1. Click hamburger → Menu opens with fade-in
2. Click link → Navigate and close menu
3. Click hamburger again → Menu closes

**FAQ Accordion Flow**:
1. Click question → Content expands, plus rotates to X
2. Click same question → Content collapses, X rotates to plus
3. Click different question → Previous closes, new opens

**Responsive Behavior**:
1. Resize to mobile → Navigation collapses to hamburger
2. Resize to mobile → Hero card hides
3. Resize to mobile → Stats display 2 columns
4. Resize to mobile → Sample report sidebar stacks below
5. Resize to mobile → Footer stacks vertically


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, I identified the following testable properties and examples. Many criteria are about build configuration, file structure, or visual design that cannot be tested with automated property-based tests. The testable properties focus on:

1. **Input transformation**: VIN sanitization and formatting
2. **State management**: Character counter, loading states, menu toggles
3. **Error handling**: Invalid VIN submission, API failures
4. **API integration**: Successful VIN lookup and navigation
5. **UI structure**: Presence of expected elements (examples, not properties)

**Redundancy Analysis**:
- Properties 4.7, 6.3, and 6.4 all test API integration and navigation - these can be combined into a single comprehensive property about the VIN submission flow
- Properties 4.9 and 6.5 both test error toast display - these are the same property
- Properties 11.2 and 11.3 both test that form elements are disabled during loading - these can be combined
- Many "example" criteria test similar UI structure (navigation links, footer columns, homepage sections) - these can be grouped into a few comprehensive examples

**Final Property Set** (after removing redundancy):
1. VIN input sanitization (transformation property)
2. Character counter accuracy (metamorphic property)
3. Mobile menu toggle (idempotence property)
4. Invalid VIN error handling (error condition property)
5. Valid VIN submission flow (integration property combining API call + navigation)
6. API failure error handling (error condition property)
7. Form disabled during loading (state property)
8. Currency formatting (transformation property)

### Property 1: VIN Input Sanitization

*For any* string input to the VIN form, the displayed value should be uppercase with only valid VIN characters (A-H, J-N, P-Z, 0-9), and truncated to maximum 17 characters.

**Validates: Requirements 4.3**

**Rationale**: This property ensures that user input is always transformed to valid VIN format, preventing invalid characters from being submitted. This is a transformation property where we test that the sanitization function correctly filters and formats any input string.

### Property 2: Character Counter Accuracy

*For any* VIN input value, the character counter should display the exact length of the current input value in the format "X/17".

**Validates: Requirements 4.4**

**Rationale**: This property ensures the character counter always reflects the actual input length. This is a metamorphic property where the counter value should always equal the input string length.

### Property 3: Mobile Menu Toggle

*For any* initial mobile menu state (open or closed), clicking the toggle button should change the state to its opposite value.

**Validates: Requirements 3.6, 8.2**

**Rationale**: This property ensures the mobile menu toggle behaves consistently regardless of current state. This is an idempotence-related property where toggling twice returns to the original state.

### Property 4: Invalid VIN Error Handling

*For any* VIN input that fails validation (length ≠ 17 or contains invalid characters), submitting the form should display an error toast and prevent API submission.

**Validates: Requirements 4.6, 11.4**

**Rationale**: This property ensures that invalid VINs are caught before API calls, providing immediate user feedback. This is an error condition property testing that all invalid inputs are properly rejected.

### Property 5: Valid VIN Submission Flow

*For any* valid 17-character VIN, submitting the form should:
1. Call POST /api/vin with the VIN in the request body
2. On successful response with lookupId, navigate to /preview/{lookupId}
3. Display loading state during the API call

**Validates: Requirements 4.7, 4.8, 6.3, 6.4**

**Rationale**: This property ensures the complete VIN submission workflow functions correctly for all valid VINs. This is an integration property testing the end-to-end flow from submission to navigation.

### Property 6: API Failure Error Handling

*For any* VIN submission where the API call fails (network error or non-200 response), the system should display an error toast and clear the loading state.

**Validates: Requirements 4.9, 6.5, 11.4**

**Rationale**: This property ensures that API failures are handled gracefully with user feedback. This is an error condition property testing that all failure scenarios result in appropriate error messages.

### Property 7: Form Disabled During Loading

*For any* VIN form in loading state, both the submit button and VIN input should be disabled to prevent duplicate submissions.

**Validates: Requirements 11.2, 11.3**

**Rationale**: This property ensures that users cannot submit the form multiple times while an API call is in progress. This is a state property testing that loading state correctly disables form interactions.

### Property 8: Currency Formatting

*For any* numeric currency value, the formatted output should include the appropriate currency symbol (₦ for NGN, $ for USD) and use locale-appropriate thousand separators.

**Validates: Requirements 5.16**

**Rationale**: This property ensures that all currency values are consistently formatted with correct symbols and separators. This is a transformation property testing that the formatting function produces correct output for all numeric inputs.

### Example Tests

In addition to the properties above, the following example tests verify that expected UI structure exists:

**Example 1: Navigation Structure**
- Verify navigation contains MotoCheck logo with car icon
- Verify navigation contains links to "Sample Report", "How It Works", "FAQ"
- Verify navigation contains gold "Check VIN" CTA button
- Verify navigation has fixed positioning with backdrop blur classes

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

**Example 2: Footer Structure**
- Verify footer contains 4 columns: Brand, Product, Support, Contact
- Verify footer contains trust badges: "NHTSA Verified", "NCS Data"
- Verify footer contains bottom bar with copyright and attribution

**Validates: Requirements 3.9, 3.10, 3.11, 3.12**

**Example 3: Homepage Sections**
- Verify homepage contains hero section with VIN form
- Verify homepage contains stats bar with 4 metrics
- Verify homepage contains "How It Works" section with 3 steps
- Verify homepage contains "What We Inspect" section with 6 features
- Verify homepage contains pricing section
- Verify homepage contains testimonials section with 3 cards
- Verify homepage contains FAQ section with accordion
- Verify homepage contains final CTA section

**Validates: Requirements 4.2, 4.10, 4.11, 4.12, 4.13, 4.14, 4.15, 4.16**

**Example 4: Sample Report Structure**
- Verify sample report page contains page header with title and CTA
- Verify main content contains vehicle identity card
- Verify main content contains specifications table
- Verify main content contains manufacturing details table
- Verify main content contains safety recalls card
- Verify sidebar contains import duty summary card
- Verify sidebar contains NCS valuation card
- Verify sidebar contains report metadata card
- Verify sidebar contains CTA button

**Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9, 5.10, 5.11, 5.12, 5.13, 5.14**

**Example 5: Accessibility Features**
- Verify hamburger button has aria-label="Toggle menu"
- Verify VIN input is associated with label via for/id attributes
- Verify heading hierarchy is correct (h1 → h2 → h3)
- Verify all interactive elements have visible focus indicators

**Validates: Requirements 10.1, 10.2, 10.4, 10.7**

**Example 6: Loading State Display**
- Verify that when loading state is true, submit button displays "Generating report…" with spinner
- Verify that when loading state is true, loading overlay is visible

**Validates: Requirements 11.1, 11.7**

**Example 7: Character Counter Color**
- Verify that when VIN length equals 17, character counter has green color class
- Verify that when VIN length is less than 17, character counter has faint color class

**Validates: Requirements 4.5** (edge case)

**Example 8: Mobile Menu Display**
- Verify that when mobile menu is open, dropdown panel is visible with all navigation links

**Validates: Requirements 3.7**

## Error Handling

### Client-Side Validation Errors

**VIN Format Errors**:
- **Trigger**: User submits VIN with length ≠ 17
- **Response**: Display error toast "Invalid VIN: VIN must be exactly 17 characters"
- **Recovery**: User corrects VIN and resubmits

**VIN Character Errors**:
- **Trigger**: User submits VIN with invalid characters (I, O, Q)
- **Response**: Display error toast "Invalid VIN: VIN contains invalid characters"
- **Recovery**: User corrects VIN and resubmits

**VIN Checksum Errors**:
- **Trigger**: User submits VIN that fails checksum validation
- **Response**: Display error toast "Invalid VIN: Checksum validation failed"
- **Recovery**: User corrects VIN and resubmits

### API Errors

**VIN Not Found**:
- **Trigger**: API returns 404 for VIN lookup
- **Response**: Display error toast with API error message
- **State**: Clear loading state, keep VIN in input
- **Recovery**: User tries different VIN

**Network Errors**:
- **Trigger**: Fetch request fails (network timeout, connection refused)
- **Response**: Display error toast "Network Error"
- **State**: Clear loading state, keep VIN in input
- **Recovery**: User retries submission

**Server Errors**:
- **Trigger**: API returns 500 or other server error
- **Response**: Display error toast with API error message or generic "Server Error"
- **State**: Clear loading state, keep VIN in input
- **Recovery**: User retries submission

### State Management Errors

**Double Submission Prevention**:
- **Trigger**: User clicks submit button multiple times rapidly
- **Response**: Button disabled after first click, subsequent clicks ignored
- **State**: Loading state prevents multiple API calls
- **Recovery**: Automatic (loading state clears after API response)

**Navigation Errors**:
- **Trigger**: API returns success but missing lookupId
- **Response**: Display error toast "Invalid API response"
- **State**: Clear loading state
- **Recovery**: User retries submission

### Error Display Strategy

All errors use the existing svelte-sonner toast system:

```typescript
// Error toast
toast.error('Error Title', {
  description: 'Detailed error message'
});

// Success toast (for future use)
toast.success('Success Title', {
  description: 'Success message'
});
```

**Toast Configuration**:
- Position: top-center
- Duration: 4000ms (auto-dismiss)
- Dismissible: Yes (click to close)
- Styling: Preserved from existing Sonner overrides in app.css

### Error Logging

**Client-Side Errors**:
- Log validation errors to console for debugging
- Do not send validation errors to server (client-side only)

**API Errors**:
- Log full error response to console for debugging
- Display user-friendly message in toast
- Preserve error details for support requests

**Network Errors**:
- Log fetch error to console
- Display generic "Network Error" message to user
- Suggest checking internet connection

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and UI structure
- Test that navigation contains expected links
- Test that footer has 4 columns
- Test that homepage has all required sections
- Test that sample report has expected layout
- Test that character counter turns green at 17 characters
- Test that loading overlay displays when loading state is true
- Test that mobile menu displays when mobileOpen is true

**Property-Based Tests**: Verify universal properties across all inputs
- Test VIN sanitization for random input strings
- Test character counter accuracy for random VIN lengths
- Test mobile menu toggle for random initial states
- Test invalid VIN error handling for random invalid VINs
- Test valid VIN submission flow for random valid VINs
- Test API failure handling for random error responses
- Test form disabled state for random loading states
- Test currency formatting for random numeric values

### Property-Based Testing Configuration

**Library Selection**: Use `fast-check` for JavaScript/TypeScript property-based testing

**Installation**:
```bash
npm install --save-dev fast-check
```

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: ui-redesign-implementation, Property {number}: {property_text}`

**Example Property Test**:
```typescript
import fc from 'fast-check';
import { sanitizeVIN } from '$lib/vin-validator';

describe('Feature: ui-redesign-implementation, Property 1: VIN Input Sanitization', () => {
  it('should sanitize any input string to valid VIN format', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = sanitizeVIN(input);
        
        // Result should be uppercase
        expect(result).toBe(result.toUpperCase());
        
        // Result should only contain valid VIN characters
        expect(result).toMatch(/^[A-HJ-NPR-Z0-9]*$/);
        
        // Result should be max 17 characters
        expect(result.length).toBeLessThanOrEqual(17);
      }),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Strategy

**Component Testing**: Use Vitest + Testing Library for Svelte component tests

**Test Files**:
- `src/routes/+layout.test.ts` - Navigation and footer structure
- `src/routes/+page.test.ts` - Homepage sections and VIN form
- `src/routes/sample-report/+page.test.ts` - Sample report structure
- `src/lib/vin-validator.test.ts` - VIN validation functions (existing)

**Example Unit Test**:
```typescript
import { render, screen } from '@testing-library/svelte';
import Layout from './+layout.svelte';

describe('Navigation Structure', () => {
  it('should render MotoCheck logo with car icon', () => {
    render(Layout);
    
    const logo = screen.getByRole('link', { name: /motocheck/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('href', '/');
    
    const icon = logo.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(Layout);
    
    expect(screen.getByRole('link', { name: /sample report/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /how it works/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /faq/i })).toBeInTheDocument();
  });

  it('should render Check VIN CTA button', () => {
    render(Layout);
    
    const cta = screen.getByRole('link', { name: /check vin/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveClass('btn-gold');
  });
});
```

### Integration Testing

**VIN Form Flow Test**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import Homepage from './+page.svelte';

describe('VIN Form Integration', () => {
  it('should submit valid VIN and navigate to preview', async () => {
    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ lookupId: 'test-123' })
      })
    );

    // Mock goto
    const mockGoto = vi.fn();
    vi.mock('$app/navigation', () => ({
      goto: mockGoto
    }));

    render(Homepage);

    // Enter valid VIN
    const input = screen.getByLabelText(/vehicle identification number/i);
    await fireEvent.input(input, { target: { value: '1HGBH41JXMN109186' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /get instant report/i });
    await fireEvent.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: '1HGBH41JXMN109186' })
      });
    });

    // Verify navigation
    await waitFor(() => {
      expect(mockGoto).toHaveBeenCalledWith('/preview/test-123');
    });
  });

  it('should display error toast for invalid VIN', async () => {
    const mockToast = vi.fn();
    vi.mock('svelte-sonner', () => ({
      toast: { error: mockToast }
    }));

    render(Homepage);

    // Enter invalid VIN (too short)
    const input = screen.getByLabelText(/vehicle identification number/i);
    await fireEvent.input(input, { target: { value: '1HGBH41' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /get instant report/i });
    await fireEvent.click(submitButton);

    // Verify error toast
    expect(mockToast).toHaveBeenCalledWith('Invalid VIN', {
      description: expect.stringContaining('17 characters')
    });
  });
});
```

### Visual Regression Testing

**Tool**: Playwright for visual regression tests

**Test Scenarios**:
- Homepage desktop layout
- Homepage mobile layout
- Sample report desktop layout
- Sample report mobile layout
- Navigation with mobile menu open
- VIN form with error state
- VIN form with loading state

**Example Visual Test**:
```typescript
import { test, expect } from '@playwright/test';

test('homepage desktop layout', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Wait for fonts to load
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await expect(page).toHaveScreenshot('homepage-desktop.png');
});

test('homepage mobile layout', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 375, height: 667 });
  
  // Wait for fonts to load
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await expect(page).toHaveScreenshot('homepage-mobile.png');
});
```

### Accessibility Testing

**Tool**: axe-core via @axe-core/playwright

**Test Scenarios**:
- Homepage accessibility
- Sample report accessibility
- Navigation accessibility
- VIN form accessibility

**Example Accessibility Test**:
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage should not have accessibility violations', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});

test('VIN form should be keyboard accessible', async ({ page }) => {
  await page.goto('/');
  
  // Tab to VIN input
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  
  // Verify focus on VIN input
  const vinInput = page.getByLabel(/vehicle identification number/i);
  await expect(vinInput).toBeFocused();
  
  // Type VIN
  await page.keyboard.type('1HGBH41JXMN109186');
  
  // Tab to submit button
  await page.keyboard.press('Tab');
  
  // Verify focus on submit button
  const submitButton = page.getByRole('button', { name: /get instant report/i });
  await expect(submitButton).toBeFocused();
  
  // Submit with Enter
  await page.keyboard.press('Enter');
  
  // Verify form submission (loading state or navigation)
  await expect(submitButton).toBeDisabled();
});
```

### Performance Testing

**Metrics to Track**:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms

**Tool**: Lighthouse CI

**Configuration** (.lighthouserc.json):
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:5173/", "http://localhost:5173/sample-report"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", { "maxNumericValue": 1500 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "interactive": ["error", { "maxNumericValue": 3500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "max-potential-fid": ["error", { "maxNumericValue": 100 }]
      }
    }
  }
}
```

### Test Coverage Goals

**Unit Test Coverage**: 80% of component code
- All component rendering logic
- All event handlers
- All state management logic

**Property Test Coverage**: 100% of identified properties
- All 8 correctness properties
- Minimum 100 iterations per property

**Integration Test Coverage**: 100% of user flows
- VIN form submission (success and error paths)
- Navigation between pages
- Mobile menu interaction
- FAQ accordion interaction

**Visual Regression Coverage**: Key layouts
- Homepage (desktop and mobile)
- Sample report (desktop and mobile)
- Navigation states (default and mobile menu open)
- Form states (default, error, loading)

**Accessibility Coverage**: 100% of pages
- No axe-core violations on any page
- Keyboard navigation works on all interactive elements
- Screen reader compatibility verified

### Continuous Integration

**CI Pipeline**:
1. Run unit tests (Vitest)
2. Run property-based tests (fast-check)
3. Run integration tests (Playwright)
4. Run accessibility tests (axe-core)
5. Run visual regression tests (Playwright screenshots)
6. Run performance tests (Lighthouse CI)
7. Generate coverage report
8. Fail build if any test fails or coverage < 80%

**GitHub Actions Workflow**:
```yaml
name: UI Redesign Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:a11y
      - run: npm run test:visual
      - run: npm run test:performance
```

