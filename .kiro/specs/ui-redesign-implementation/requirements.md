# Requirements Document

## Introduction

This specification defines the requirements for implementing a comprehensive UI redesign for the MotoCheck vehicle history report platform. The redesign introduces a new design system with a white, editorial, trustworthy fintech aesthetic, replacing the current implementation while maintaining all existing functionality.

The redesign has been completed in the `ui-improv` folder and needs to be integrated into the existing SvelteKit codebase. This is a visual and structural overhaul that must preserve all business logic, API integrations, and user workflows.

## Glossary

- **Design_System**: The collection of typography, colors, spacing, shadows, and component styles defined in the new UI
- **VIN_Form**: The vehicle identification number input form on the homepage that validates and submits VIN data
- **Sample_Report_Page**: A page displaying a full example vehicle report as HTML (not PDF iframe)
- **Layout_Component**: The SvelteKit +layout.svelte file containing navigation and footer
- **Homepage**: The main landing page at route "/" containing hero, features, pricing, testimonials, FAQ, and CTA sections
- **Tailwind_Config**: The Tailwind CSS configuration defining theme tokens (currently using v4 inline @theme syntax)
- **App_CSS**: The main stylesheet containing base styles and component classes
- **Navigation**: The header component with logo, links, and CTA button
- **Footer**: The bottom component with links, contact info, and trust marks
- **Sticky_Sidebar**: A sidebar layout that remains visible while scrolling the main content
- **NHTSA**: National Highway Traffic Safety Administration - source of vehicle data
- **NCS**: Nigerian Customs Service - source of duty calculation data
- **Paystack**: Payment gateway integration for processing report purchases
- **shadcn_svelte**: Component library currently used for UI elements (Button, Input, Label, Toaster)

## Requirements

### Requirement 1: Replace Tailwind CSS Configuration

**User Story:** As a developer, I want to replace the current Tailwind v4 configuration with the new custom theme, so that the design system tokens are available throughout the application.

#### Acceptance Criteria

1. THE System SHALL remove the current Tailwind v4 @theme inline configuration from src/routes/layout.css
2. THE System SHALL create a new tailwind.config.js file in the project root with the custom theme from ui-improv/tailwind.config.js
3. THE System SHALL define font families for Instrument Serif (display), DM Sans (sans), and IBM Plex Mono (mono)
4. THE System SHALL define the gold color palette (50-900 scale) with #d4943a as gold-500
5. THE System SHALL define the navy color palette (50-900 scale) with #1a3059 as navy-800
6. THE System SHALL define ink colors (DEFAULT, soft, muted, faint) for text hierarchy
7. THE System SHALL define surface colors (DEFAULT, subtle, warm, border) for backgrounds
8. THE System SHALL define custom font sizes including display and display-sm with clamp() for responsive scaling
9. THE System SHALL define custom shadows (crisp, lifted, card, gold, inset-border)
10. THE System SHALL define custom animations (fade-up, fade-in, pulse-soft) with corresponding keyframes
11. THE System SHALL maintain compatibility with existing Tailwind utilities and plugins

### Requirement 2: Replace Application Stylesheet

**User Story:** As a developer, I want to replace the current layout.css with the new app.css containing all component classes, so that the new design system is applied consistently.

#### Acceptance Criteria

1. THE System SHALL replace src/routes/layout.css with content from ui-improv/app.css
2. THE System SHALL import Google Fonts for Instrument Serif, DM Sans, and IBM Plex Mono via @import
3. THE System SHALL define base styles in @layer base including font smoothing and selection colors
4. THE System SHALL define layout component classes (container-wide, container-prose, section-pad) in @layer components
5. THE System SHALL define typography component classes (heading-display, heading-section, eyebrow, body-lg, body-base)
6. THE System SHALL define button component classes (btn-primary, btn-gold, btn-ghost, btn-link)
7. THE System SHALL define card component classes (card, card-sm, card-surface)
8. THE System SHALL define form component classes (input-base, input-lg, label-base)
9. THE System SHALL define badge component classes (badge-gold, badge-navy, badge-neutral, badge-green)
10. THE System SHALL define data table component classes (data-table with th and td styles)
11. THE System SHALL define FAQ component classes (faq-item, faq-trigger, faq-content)
12. THE System SHALL define navigation component classes (nav-link)
13. THE System SHALL define report-specific component classes (report-section-head, report-icon)
14. THE System SHALL preserve existing custom scrollbar styles and Sonner toast overrides

### Requirement 3: Update Layout Component

**User Story:** As a user, I want to see the new navigation and footer design when I visit any page, so that the site has a consistent, professional appearance.

#### Acceptance Criteria

1. WHEN the application loads, THE Layout_Component SHALL render the new navigation header from ui-improv/+layout.svelte
2. THE Navigation SHALL display the MotoCheck logo with car icon and text
3. THE Navigation SHALL include links to "Sample Report", "How It Works", and "FAQ"
4. THE Navigation SHALL include a gold "Check VIN" CTA button
5. THE Navigation SHALL be fixed at the top with backdrop blur effect
6. THE Navigation SHALL include a mobile hamburger menu that toggles navigation links
7. WHEN the mobile menu is open, THE Navigation SHALL display all links in a dropdown panel
8. THE Layout_Component SHALL render the new footer from ui-improv/+layout.svelte
9. THE Footer SHALL display the MotoCheck logo and tagline
10. THE Footer SHALL include four columns: Product, Support, and Contact information
11. THE Footer SHALL display trust badges for "NHTSA Verified" and "NCS Data"
12. THE Footer SHALL include a bottom bar with copyright and payment/data source attribution
13. THE Layout_Component SHALL use Svelte 5 {@render children()} syntax instead of deprecated <slot/>
14. THE Layout_Component SHALL use $state() for reactive variables instead of deprecated let declarations
15. THE Layout_Component SHALL use onclick instead of deprecated on:click event handlers

### Requirement 4: Update Homepage

**User Story:** As a visitor, I want to see the new homepage design with all sections, so that I can understand the service and submit a VIN check.

#### Acceptance Criteria

1. THE Homepage SHALL replace src/routes/+page.svelte with content from ui-improv/+page.svelte
2. THE Homepage SHALL render a hero section with headline, VIN input form, and visual card
3. WHEN a user types in the VIN input, THE VIN_Form SHALL format the input to uppercase and remove invalid characters
4. WHEN a user types in the VIN input, THE VIN_Form SHALL display a character counter showing X/17
5. WHEN the VIN input reaches 17 characters, THE VIN_Form SHALL change the counter color to green
6. WHEN a user submits the VIN form with invalid VIN, THE VIN_Form SHALL display an error message
7. WHEN a user submits the VIN form with valid VIN, THE VIN_Form SHALL call the existing /api/vin endpoint
8. WHEN the VIN API call succeeds, THE VIN_Form SHALL navigate to /preview/{lookupId} using SvelteKit goto()
9. WHEN the VIN API call fails, THE VIN_Form SHALL display an error toast using existing toast system
10. THE Homepage SHALL render a stats bar section with 4 metrics (reports generated, flat fee, delivery time, accuracy rate)
11. THE Homepage SHALL render a "How It Works" section with 3 step cards and connecting line
12. THE Homepage SHALL render a "What We Inspect" section with sticky left header and 6 feature cards
13. THE Homepage SHALL render a pricing section with single card showing ₦2,500 price and feature list
14. THE Homepage SHALL render a testimonials section with 3 customer cards including stars, quotes, and avatars
15. THE Homepage SHALL render an FAQ section with accordion items that expand/collapse on click
16. THE Homepage SHALL render a final CTA section with dark background and gold button
17. THE Homepage SHALL use $state() for reactive variables (vin, vinError, isLoading, openFaq)
18. THE Homepage SHALL use onclick/oninput/onsubmit instead of deprecated on: event handlers
19. THE Homepage SHALL integrate with existing VIN validation functions from $lib/vin-validator
20. THE Homepage SHALL maintain compatibility with existing shadcn-svelte components (Button, Input, Label)

### Requirement 5: Create Sample Report Page

**User Story:** As a visitor, I want to view a sample report as HTML (not PDF), so that I can see exactly what information is included before purchasing.

#### Acceptance Criteria

1. THE System SHALL replace src/routes/sample-report/+page.svelte with content from ui-improv/+page (1).svelte
2. THE Sample_Report_Page SHALL render a page header with title, description, and "Check Your VIN" CTA
3. THE Sample_Report_Page SHALL use a 2-column layout on desktop: 2/3 main content + 1/3 sidebar
4. THE Sample_Report_Page SHALL render a vehicle identity card showing year/make/model/trim with NHTSA badge
5. THE Sample_Report_Page SHALL render a vehicle specifications table with all decoded VIN fields
6. THE Sample_Report_Page SHALL render a manufacturing details table with plant, date, origin, and market
7. THE Sample_Report_Page SHALL render a safety recalls card showing "No active recalls" state with green checkmark
8. THE Sticky_Sidebar SHALL remain visible while scrolling the main content on desktop
9. THE Sticky_Sidebar SHALL render an import duty summary card with gold accent header
10. THE Sticky_Sidebar SHALL display line-by-line duty breakdown (CIF, Import Duty, ECOWAS Levy, VAT, Port Charges)
11. THE Sticky_Sidebar SHALL display total duty estimate in large gold text
12. THE Sticky_Sidebar SHALL render an NCS valuation card showing reference USD value
13. THE Sticky_Sidebar SHALL render a report metadata card showing generated date, data sources, and exchange rate
14. THE Sticky_Sidebar SHALL render a "Check Your Own VIN" CTA button
15. THE Sample_Report_Page SHALL use demo data defined in the component script
16. THE Sample_Report_Page SHALL format currency values using Nigerian Naira (₦) and USD ($) symbols
17. THE Sample_Report_Page SHALL use tabular-nums class for aligned number display
18. THE Sample_Report_Page SHALL be responsive and stack sidebar below main content on mobile

### Requirement 6: Preserve Existing Functionality

**User Story:** As a user, I want all existing features to continue working after the redesign, so that I can complete my vehicle check workflow without interruption.

#### Acceptance Criteria

1. THE VIN_Form SHALL continue to use the existing sanitizeVIN() function from $lib/vin-validator
2. THE VIN_Form SHALL continue to use the existing getVINError() function from $lib/vin-validator
3. THE VIN_Form SHALL continue to call POST /api/vin with { vin } in request body
4. THE VIN_Form SHALL continue to navigate to /preview/{lookupId} on successful VIN lookup
5. THE VIN_Form SHALL continue to display error toasts using svelte-sonner Toaster component
6. THE Navigation SHALL continue to use SvelteKit's $app/navigation for client-side routing
7. THE System SHALL continue to use existing shadcn-svelte Button component for CTAs
8. THE System SHALL continue to use existing shadcn-svelte Input component for form fields
9. THE System SHALL continue to use existing shadcn-svelte Label component for form labels
10. THE System SHALL continue to render the Toaster component in the layout for toast notifications
11. THE System SHALL preserve all existing API endpoints (/api/vin, /api/pay/initiate, /api/webhook/*)
12. THE System SHALL preserve all existing routes (/preview/[lookupId], /checkout/[lookupId], /payment/success)
13. THE System SHALL preserve all existing server-side load functions
14. THE System SHALL preserve all existing database operations and storage service calls
15. THE System SHALL preserve all existing payment gateway integrations (Paystack, Flutterwave)

### Requirement 7: Font Loading Strategy

**User Story:** As a developer, I want fonts to load efficiently without blocking page render, so that users experience fast initial page loads.

#### Acceptance Criteria

1. THE System SHALL load Google Fonts via @import in app.css OR via <link> tags in +layout.svelte
2. WHEN using @import, THE System SHALL place font imports at the top of app.css before @tailwind directives
3. WHEN using <link> tags, THE System SHALL include preconnect hints for fonts.googleapis.com and fonts.gstatic.com
4. THE System SHALL load Instrument Serif with italic variant for display typography
5. THE System SHALL load DM Sans with weights 300, 400, 500, 600 and italic variant for body text
6. THE System SHALL load IBM Plex Mono with weights 400, 500 for monospace text (VIN display)
7. THE System SHALL use font-display: swap in font loading to prevent invisible text during load
8. THE System SHALL define fallback fonts in Tailwind config (Georgia for serif, system-ui for sans)

### Requirement 8: Responsive Design

**User Story:** As a mobile user, I want the redesigned site to work perfectly on my device, so that I can check VINs on the go.

#### Acceptance Criteria

1. WHEN viewing on mobile, THE Navigation SHALL display a hamburger menu icon instead of desktop links
2. WHEN the hamburger menu is tapped, THE Navigation SHALL expand to show all navigation links
3. WHEN viewing on mobile, THE Homepage hero SHALL stack the form above the visual card
4. WHEN viewing on mobile, THE Homepage stats bar SHALL display 2 columns instead of 4
5. WHEN viewing on mobile, THE Homepage "How It Works" SHALL display cards in a single column
6. WHEN viewing on mobile, THE Homepage "What We Inspect" SHALL display feature cards in a single column
7. WHEN viewing on mobile, THE Homepage testimonials SHALL display cards in a single column
8. WHEN viewing on mobile, THE Sample_Report_Page SHALL stack the sidebar below the main content
9. WHEN viewing on mobile, THE Footer SHALL stack columns vertically
10. THE System SHALL use Tailwind responsive prefixes (sm:, md:, lg:) for breakpoint-specific styles
11. THE System SHALL use clamp() for fluid typography that scales between mobile and desktop
12. THE System SHALL ensure touch targets are at least 44x44px for mobile usability

### Requirement 9: Animation and Interaction

**User Story:** As a user, I want smooth animations and interactions, so that the interface feels polished and responsive.

#### Acceptance Criteria

1. WHEN the homepage loads, THE Hero section SHALL animate in with fade-up animation
2. WHEN hovering over a card, THE Card SHALL lift slightly with shadow-lifted transition
3. WHEN hovering over a button, THE Button SHALL translate up by 1px and change background color
4. WHEN clicking a button, THE Button SHALL translate back to original position (active state)
5. WHEN clicking an FAQ item, THE FAQ content SHALL expand with fade-in animation
6. WHEN clicking an FAQ item again, THE FAQ content SHALL collapse smoothly
7. WHEN the FAQ is open, THE FAQ plus icon SHALL rotate 45 degrees to form an X
8. WHEN hovering over a navigation link, THE Link SHALL display an animated underline from left to right
9. WHEN the mobile menu opens, THE Menu SHALL animate in with fade-in animation
10. THE System SHALL use transition-all duration-200 for most hover effects
11. THE System SHALL use ease-smooth timing function (cubic-bezier(0.4, 0, 0.2, 1)) for animations
12. THE System SHALL use ease-spring timing function (cubic-bezier(0.34, 1.56, 0.64, 1)) for bounce effects

### Requirement 10: Accessibility and SEO

**User Story:** As a user with accessibility needs, I want the redesigned site to be fully accessible, so that I can use it with assistive technologies.

#### Acceptance Criteria

1. THE Navigation hamburger button SHALL include aria-label="Toggle menu"
2. THE VIN input field SHALL be associated with its label using for/id attributes
3. THE FAQ trigger buttons SHALL be keyboard accessible and toggle on Enter/Space
4. THE System SHALL maintain proper heading hierarchy (h1 → h2 → h3)
5. THE System SHALL include alt text for all decorative SVG icons (or aria-hidden="true")
6. THE System SHALL ensure color contrast ratios meet WCAG AA standards (4.5:1 for normal text)
7. THE System SHALL ensure focus indicators are visible on all interactive elements
8. THE Sample_Report_Page SHALL include <svelte:head> with title and meta description
9. THE Homepage SHALL include semantic HTML (header, nav, main, section, footer)
10. THE System SHALL ensure all forms can be submitted with keyboard (Enter key)

### Requirement 11: Error Handling and Loading States

**User Story:** As a user, I want clear feedback when actions are in progress or fail, so that I understand what's happening.

#### Acceptance Criteria

1. WHEN the VIN form is submitting, THE Submit button SHALL display "Generating report…" with spinner icon
2. WHEN the VIN form is submitting, THE Submit button SHALL be disabled to prevent double submission
3. WHEN the VIN form is submitting, THE VIN input SHALL be disabled
4. WHEN the VIN API call fails, THE System SHALL display an error toast with the error message
5. WHEN the VIN is invalid, THE VIN input SHALL display a red border and error text below
6. WHEN the VIN error is cleared, THE Error text SHALL be removed and border SHALL return to normal
7. WHEN the page is loading, THE System SHALL display the existing loading overlay with spinner
8. WHEN hovering over disabled elements, THE Cursor SHALL change to not-allowed
9. THE System SHALL preserve existing error handling logic from current implementation
10. THE System SHALL use existing toast system (svelte-sonner) for all notifications

### Requirement 12: Performance Optimization

**User Story:** As a user, I want the redesigned site to load quickly, so that I can start checking VINs without delay.

#### Acceptance Criteria

1. THE System SHALL lazy-load images that are below the fold
2. THE System SHALL use SVG icons instead of icon fonts for better performance
3. THE System SHALL minimize the number of custom fonts loaded (3 font families maximum)
4. THE System SHALL use font-display: swap to prevent invisible text during font loading
5. THE System SHALL avoid layout shifts by reserving space for dynamic content
6. THE System SHALL use CSS transforms for animations instead of layout properties
7. THE System SHALL debounce VIN input validation to avoid excessive re-renders
8. THE System SHALL use Tailwind's JIT mode to generate only used utility classes
9. THE System SHALL minimize JavaScript bundle size by avoiding unnecessary dependencies
10. THE System SHALL use SvelteKit's built-in code splitting for route-based chunks

## Parser and Serializer Requirements

This feature does not include parsers or serializers. All data transformation is handled by existing API endpoints and server-side logic.

## Round-Trip Properties

This feature does not require round-trip testing as it is a UI-only change that preserves existing data flow.

## Implementation Notes

### Migration Strategy

1. **Phase 1: Configuration** - Replace Tailwind config and app.css
2. **Phase 2: Layout** - Update +layout.svelte with new nav and footer
3. **Phase 3: Homepage** - Update +page.svelte with new design
4. **Phase 4: Sample Report** - Replace sample-report/+page.svelte
5. **Phase 5: Testing** - Verify all functionality works with new UI

### Svelte 5 Migration

The new UI files use Svelte 5 syntax. Key changes needed:
- Replace `let` with `$state()` for reactive variables
- Replace `on:event` with `onevent` attributes
- Replace `<slot/>` with `{@render children()}`
- Ensure all event handlers use arrow functions or bound methods

### Tailwind v4 to v3 Migration

The current codebase uses Tailwind v4 with inline @theme syntax. The new design uses traditional tailwind.config.js (v3 style). This is compatible - just need to:
- Remove @theme inline from layout.css
- Create tailwind.config.js in project root
- Ensure @import 'tailwindcss' remains in app.css

### Font Loading Decision

Choose ONE approach:
- **Option A (CSS @import)**: Simpler, but may block render
- **Option B (<link> tags)**: Better performance with preconnect hints

Recommendation: Use Option B with preconnect for production.

### Existing Component Integration

The new UI should use existing shadcn-svelte components where possible:
- Use `<Button>` from $lib/components/ui/button for all CTAs
- Use `<Input>` from $lib/components/ui/input for VIN form
- Use `<Label>` from $lib/components/ui/label for form labels
- Use `<Toaster>` from $lib/components/ui/sonner for notifications

However, the new design includes custom button classes (btn-gold, btn-primary) that may conflict with shadcn Button styles. Consider:
- Using custom `<a>` tags with btn-gold class for styled links
- Using shadcn `<Button>` with custom classes for form submissions
- Ensuring both approaches work together harmoniously

### API Integration Points

The new UI must integrate with these existing endpoints:
- `POST /api/vin` - VIN lookup (returns { lookupId, ... })
- `POST /api/pay/initiate` - Payment initiation
- `POST /api/webhook/paystack` - Payment webhook
- `GET /preview/[lookupId]` - Report preview page
- `GET /checkout/[lookupId]` - Checkout page

### Data Flow Preservation

```
User enters VIN → sanitizeVIN() → validate → POST /api/vin
  ↓
API returns lookupId
  ↓
Navigate to /preview/{lookupId}
  ↓
User clicks "Purchase" → /checkout/{lookupId}
  ↓
Paystack payment → webhook → generate PDF → email
  ↓
Redirect to /payment/success
```

This flow must remain unchanged.

### Testing Checklist

After implementation, verify:
- [ ] VIN form validates and submits correctly
- [ ] Navigation links work on all pages
- [ ] Mobile menu opens and closes
- [ ] FAQ accordion expands and collapses
- [ ] Sample report displays with correct layout
- [ ] All buttons have hover and active states
- [ ] Toast notifications appear on errors
- [ ] Loading states display during API calls
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Fonts load correctly
- [ ] Colors match design spec
- [ ] Shadows and animations work smoothly
- [ ] Existing routes still work (/preview, /checkout, /payment/success)
- [ ] Payment flow completes successfully
- [ ] PDF generation still works
- [ ] Email delivery still works

## Success Criteria

The implementation is complete when:
1. All pages render with the new design system
2. All existing functionality continues to work without regression
3. The VIN form validates and submits correctly
4. Navigation and routing work on all pages
5. The sample report page displays as HTML with sticky sidebar
6. Responsive design works on mobile and desktop
7. All animations and interactions work smoothly
8. No console errors or warnings appear
9. All tests pass (if tests exist)
10. The site loads quickly with good performance metrics
