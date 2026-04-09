# Deployment

MotoCheck runs as two Railway services that share one PostgreSQL database:

1. Web app
2. Worker process

## Required services

- Railway Postgres
- Web app service
- Worker service

## Recommended health checks

- Web app:
  `GET /api/health`
- Worker:
  no HTTP health check, rely on process restarts and logs

## Minimum environment for pipeline development

Set these on both services:

- `DATABASE_URL`
- `NHTSA_API_URL`
- `PUBLIC_BASE_URL`

With only those values set, the worker pipeline can still run and will use deterministic fallback analysis if no LLM provider is configured.

## Full product environment

Set these on the web service and on the worker service if the worker needs to send notifications:

- `PAYSTACK_SECRET_KEY`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `ADMIN_EMAIL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_SECRET_TOKEN`

Optional enrichment:

- `NMVTIS_API_URL`
- `NMVTIS_API_KEY`
- `NICB_API_URL`
- `NICB_API_KEY`
- `GOOGLE_SEARCH_API_KEY`
- `GOOGLE_SEARCH_ENGINE_ID`

Optional LLM providers:

- `ALIBABA_API_KEY`
- `MULEROUTER_API_KEY`
- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`

## Railway commands

Web app:

```bash
pnpm install && pnpm run build
node build/index.js
```

Worker:

```bash
pnpm install
pnpm workers:prod
```

## Notes

- The active codebase no longer depends on the removed historical report-storage flow or the older payment provider integration.
- Scrapers are enrichment sources, so production monitoring should focus on completion rate, queue latency, and fallback usage instead of expecting every scraper to succeed on every VIN.
