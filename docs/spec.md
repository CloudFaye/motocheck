---
title: VIN Check MVP Spec
created: 2026-03-25
---

# Stack
SvelteKit + Drizzle + PostgreSQL + Flutterwave + Resend + Puppeteer + Telegraf + R2

# Flow
1. User pastes VIN → validate → NHTSA decode → NCS valuation → duty calc → cache
2. Preview page shows basic info + duty estimate
3. User pays ₦2,500-5,000 via Flutterwave
4. Generate PDF → upload R2 → email via Resend
5. Telegram bot mirrors same flow

# Database (3 tables)
- **lookups**: vin, decoded_json, ncs_valuation_usd, duty_json, cbr_rate_ngn
- **orders**: lookup_id, email, amount_ngn, flw_tx_ref, status, source, telegram_chat_id
- **reports**: order_id, r2_key, pdf_hash, signed_url

# API Routes
- `POST /api/vin` - validate, decode, calculate, cache (5 req/min/IP)
- `POST /api/pay/initiate` - create Flutterwave payment
- `POST /api/webhook/flutterwave` - HMAC verify → generate PDF → email
- `POST /api/webhook/telegram` - bot updates

# Pages
- `/` - VIN input
- `/result/[vin]` - preview
- `/pay/[vin]` - payment form

# Core Logic
- **VIN validation**: 17 chars, ISO 3779 check digit, normalize
- **NHTSA decode**: fetch from vPIC API, cache 30 days
- **NCS valuation**: lookup from valuation_table.json
- **Duty calc**: 35% import + 7% surcharge + 20% NAC + 1% CISS + 0.5% ETLS + 7.5% VAT
- **PDF**: Puppeteer A4 report with all sections
- **R2**: private bucket, 72hr signed URLs

# Security
- HMAC-SHA512 webhook verification
- Rate limiting (5/min VIN, 3/hr bot)
- timingSafeEqual for HMAC
- Amount verification before fulfillment
- Idempotent webhook handlers

# Bot
- `/start`, `/check [VIN]`, `/help`
- Webhook mode with secret_token
- Send PDF directly to chat

# Deploy
- Railway: SvelteKit app + bot worker + Postgres
- Set 15 env vars
- Register webhooks (Telegram + Flutterwave)

---

# Tasks

## Setup
- [ ] Initialize Drizzle schema (3 tables)
- [ ] Configure Railway Postgres + env vars
- [ ] Setup R2 bucket (private)

## Core Modules
- [ ] VIN validation + normalization (`src/lib/server/vin/validate.ts`)
- [ ] NHTSA decode client (`src/lib/server/vin/nhtsa.ts`)
- [ ] NCS valuation lookup (`src/lib/server/duty/valuation.ts`)
- [ ] Duty calculation engine (`src/lib/server/duty/calculate.ts`)
- [ ] Rate limiter (`src/lib/server/rate-limit/`)
- [ ] Flutterwave client + HMAC verify (`src/lib/server/payment/`)
- [ ] Puppeteer PDF generator (`src/lib/server/pdf/generate.ts`)
- [ ] R2 upload + signed URLs (`src/lib/server/pdf/storage.ts`)
- [ ] Resend email client (`src/lib/server/email/`)

## API Routes
- [ ] `POST /api/vin` - full decode pipeline
- [ ] `POST /api/pay/initiate` - Flutterwave payment link
- [ ] `POST /api/webhook/flutterwave` - payment verification + fulfillment
- [ ] `POST /api/webhook/telegram` - bot webhook handler

## Pages
- [ ] `/+page.svelte` - VIN input form
- [ ] `/result/[vin]/+page.svelte` - preview + pay button
- [ ] `/pay/[vin]/+page.svelte` - email + Flutterwave checkout

## Bot
- [ ] Telegraf setup (`src/bot/index.js`)
- [ ] `/start`, `/check`, `/help` commands
- [ ] VIN decode flow
- [ ] PDF delivery to chat

## Deploy
- [ ] Push schema to Railway Postgres
- [ ] Deploy SvelteKit app
- [ ] Deploy bot worker
- [ ] Register Telegram webhook
- [ ] Configure Flutterwave webhook
- [ ] End-to-end smoke test
