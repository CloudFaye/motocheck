# VIN Check MVP - Deployment Guide

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- Cloudflare R2 bucket
- Flutterwave account
- Resend account
- Telegram bot token (optional)

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in all required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NHTSA_API_URL` - https://vpic.nhtsa.dot.gov/api
- `FLW_PUBLIC_KEY`, `FLW_SECRET_KEY`, `FLW_SECRET_HASH` - Flutterwave credentials
- `RESEND_API_KEY`, `FROM_EMAIL` - Resend email service
- `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` - Cloudflare R2
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_SECRET_TOKEN` - Telegram bot (optional)
- `PUBLIC_BASE_URL` - Your deployed URL

## Database Setup

1. Generate and run migrations:
```bash
pnpm db:generate
pnpm db:migrate
```

Or push schema directly:
```bash
pnpm db:push
```

## Build and Deploy

1. Install dependencies:
```bash
pnpm install
```

2. Build the application:
```bash
pnpm build
```

3. Start the server:
```bash
node build
```

## Telegram Bot Setup (Optional)

1. Set up webhook:
```bash
pnpm bot:setup
```

This configures the Telegram webhook to point to your deployed URL.

## Production Checklist

- [ ] Database migrations applied
- [ ] All environment variables set
- [ ] Flutterwave webhook configured to `/api/webhook/flutterwave`
- [ ] Telegram webhook configured (if using bot)
- [ ] R2 bucket CORS configured
- [ ] Email sender verified in Resend
- [ ] Rate limiting configured
- [ ] Error logging enabled

## Monitoring

Monitor these endpoints:
- `/api/vin` - VIN lookups
- `/api/pay/initiate` - Payment initiations
- `/api/webhook/flutterwave` - Payment confirmations
- `/api/webhook/telegram` - Telegram updates (if enabled)

## Scaling Considerations

- Database connection pooling configured in `src/lib/server/db/index.ts`
- Rate limiting uses in-memory storage (consider Redis for multi-instance)
- Exchange rate cache refreshes every 6 hours
- Puppeteer runs in headless mode with `--no-sandbox`
