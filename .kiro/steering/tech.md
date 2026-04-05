---
inclusion: auto
---

# Tech Stack

## Framework & Runtime
- **SvelteKit** (latest) with Svelte 5 (runes mode enabled)
- **Node.js** adapter for production deployment
- **TypeScript** (strict mode) with ES modules
- **Vite** for build tooling

## Frontend
- **Tailwind CSS 4** with typography plugin
- **bits-ui** component library
- **svelte-sonner** for toast notifications
- **mode-watcher** for dark mode support
- **@tabler/icons-svelte** for icons

## Backend & Database
- **Drizzle ORM** with PostgreSQL (postgres.js driver)
- **AWS S3** (Cloudflare R2) for report storage
- **Resend** for email delivery
- **Paystack** payment gateway integration
- **Telegraf** for Telegram bot

## Document Generation
- **docx** library for DOCX reports
- **pdfkit** for PDF generation
- Legacy Puppeteer-based PDF generation (being phased out)

## Testing
- **Vitest** with UI mode support
- Test environment: Node.js
- Global test utilities enabled

## Code Quality
- **ESLint** with TypeScript and Svelte plugins
- **Prettier** with Svelte and Tailwind plugins
- Strict TypeScript configuration

## Common Commands

This project uses **pnpm** as the package manager.

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm preview          # Preview production build

# Code Quality
pnpm check            # Type check with svelte-check
pnpm check:watch      # Type check in watch mode
pnpm lint             # Run ESLint and Prettier checks
pnpm format           # Format code with Prettier

# Testing
pnpm test             # Run tests once
pnpm test:watch       # Run tests in watch mode
pnpm test:ui          # Open Vitest UI

# Database
pnpm db:push          # Push schema changes to database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
pnpm db:clear-invalid # Clear invalid VINs from database

# Utilities
pnpm generate:sample-pdf  # Generate sample PDF report
pnpm bot:setup            # Setup Telegram bot
```

## Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `NHTSA_API_URL` - NHTSA vehicle API endpoint
- `PAYSTACK_SECRET_KEY` - Paystack payment gateway key
- `RESEND_API_KEY` - Email service API key
- `R2_*` - Cloudflare R2 storage credentials
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `GOOGLE_SEARCH_API_KEY` - Google Custom Search for vehicle images
- `PUBLIC_BASE_URL` - Application base URL
