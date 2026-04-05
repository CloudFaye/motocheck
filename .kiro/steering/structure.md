---
inclusion: auto
---

# Project Structure

## Root Configuration
- `package.json` - Dependencies and npm scripts
- `svelte.config.js` - SvelteKit configuration with Node adapter
- `vite.config.ts` - Vite build config with Tailwind plugin
- `tsconfig.json` - TypeScript strict mode configuration
- `eslint.config.js` - ESLint with TypeScript and Svelte plugins
- `.prettierrc` - Prettier formatting rules
- `.env` / `.env.example` - Environment variables

## Source Structure (`src/`)

### Routes (`src/routes/`)
SvelteKit file-based routing:
- `+page.svelte` - Landing page with VIN input form
- `+layout.svelte` - Root layout with global styles
- `checkout/` - Payment checkout flow
- `preview/[lookupId]/` - Vehicle report preview page
- `payment/success/` - Payment confirmation page
- `sample-report/` - Sample report showcase
- `api/` - API endpoints:
  - `api/vin/` - VIN lookup and decoding
  - `api/pay/initiate/` - Payment initiation
  - `api/webhook/paystack/` - Paystack webhook handler
  - `api/webhook/telegram/` - Telegram bot webhook
  - `api/reports/[reportId]/` - Report retrieval
  - `api/health/` - Health check endpoint

### Library Code (`src/lib/`)

#### Client-side (`src/lib/`)
- `constants.ts` - Application constants (pricing, regex patterns)
- `utils.ts` - Utility functions (tailwind-merge, clsx)
- `vin-validator.ts` - VIN validation logic
- `components/` - Reusable Svelte components
- `assets/` - Static assets
- `hooks/` - Client-side hooks

#### Server-side (`src/lib/server/`)
Core business logic modules:

**Vehicle Data:**
- `vehicle/` - NHTSA API client, decoder, and type definitions
  - `nhtsa-client.ts` - API communication
  - `nhtsa-mapper.ts` - Response mapping
  - `decoder.ts` - VIN decoding orchestration
  - `types.ts` - Vehicle data types

**Financial Calculations:**
- `duty-engine.ts` - Import duty calculation engine
- `ncs-valuator.ts` - NCS valuation table lookup
- `exchange-rate-manager.ts` - CBN exchange rate fetching

**Report Generation:**
- `reports/` - Document generation modules
  - `generator.ts` - Main report orchestrator
  - `docx-generator.ts` - DOCX report generation
  - `pdfkit-generator.ts` - PDF generation with pdfkit
  - `docx-styles.ts` - Document styling
  - `docx-section-builders.ts` - Report section builders
  - `*-legacy.ts` - Legacy Puppeteer-based generators (being phased out)

**Infrastructure:**
- `db/` - Database layer
  - `schema.ts` - Drizzle ORM schema (lookups, orders, reports, vehicle_images_cache)
  - `index.ts` - Database client
- `storage-service.ts` - Cloudflare R2 file storage
- `email-service.ts` - Resend email integration
- `payment-gateway.ts` - Paystack payment processing
- `webhook-handler.ts` - Payment webhook processing
- `rate-limiter.ts` - API rate limiting
- `vehicle-image-service.ts` - Google Custom Search integration
- `config.ts` - Server configuration

**Data:**
- `data/valuation_table.json` - NCS vehicle valuation reference data

### Telegram Bot (`src/telegram-bot/`)
- `index.ts` - Bot command handlers
- `start.ts` - Bot initialization script

## Database Schema

Four main tables (PostgreSQL with Drizzle ORM):

1. **lookups** - VIN decoding cache (30-day TTL)
   - Stores NHTSA API responses, NCS valuations, duty calculations
   
2. **orders** - Payment transactions
   - Links lookups to payments, tracks fulfillment status
   
3. **reports** - Generated report metadata
   - R2 storage keys, signed URLs, document hashes
   
4. **vehicle_images_cache** - Image search results (24-hour TTL)

## Testing Convention

- Test files use `.test.ts` suffix
- Located alongside source files (e.g., `duty-engine.ts` → `duty-engine.test.ts`)
- Vitest with Node environment
- Integration tests in `db/integration.test.ts`

## Naming Conventions

- **Files:** kebab-case (e.g., `duty-engine.ts`, `ncs-valuator.ts`)
- **Components:** PascalCase Svelte files
- **Routes:** SvelteKit conventions (`+page.svelte`, `+layout.svelte`, `+server.ts`)
- **Types:** PascalCase interfaces and types
- **Constants:** SCREAMING_SNAKE_CASE

## Legacy Code

Files with `-legacy` suffix are being phased out:
- Puppeteer-based PDF generation → migrating to pdfkit
- Old report templates → new template system
