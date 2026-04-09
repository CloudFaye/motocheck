# MotoCheck

MotoCheck is a SvelteKit application and background-worker pipeline for generating vehicle history reports aimed at Nigerian buyers and importers.

## What the codebase does

- Accepts a VIN and performs a fast preview lookup for decoded vehicle data and duty estimates.
- Takes payment with Paystack for paid report requests.
- Runs a background pipeline that fetches API data, scrapes public sources, normalizes results, stitches a timeline, scores risk, writes report sections, and exposes a DOCX export.
- Supports email and Telegram notifications around report progress.

## Main architecture

- `src/routes`:
  SvelteKit pages and API routes.
- `workers`:
  `pg-boss` worker pipeline for fetchers, scrapers, normalization, stitching, LLM analysis, and notifications.
- `src/lib/server/db/schema.ts`:
  Shared schema for preview lookup tables and the newer pipeline tables.
- `src/routes/api/report/+server.ts`:
  Pipeline entrypoint for asynchronous report generation.
- `src/routes/api/status/[vin]/+server.ts`:
  Pipeline status and recent stage logs.
- `src/routes/api/export/[vin]/+server.ts`:
  DOCX export for completed pipeline reports.

## Report pipeline

1. `POST /api/report` creates or resets a `pipeline_reports` row and enqueues source jobs.
2. Fetchers and scrapers store raw source payloads in `raw_data`.
3. Normalizers convert source payloads into a shared schema in `normalized_data`.
4. The stitcher merges normalized records into a timeline in `pipeline_reports.timeline`.
5. LLM analysis produces risk flags and a verdict, with deterministic fallback if no provider is configured.
6. Section generation writes user-facing report sections, also with deterministic fallback.
7. `GET /api/export/:vin` generates a DOCX report directly from pipeline tables when status is `ready`.

## Source strategy

- Required for pipeline completion:
  `nhtsa_decode`, `nhtsa_recalls`
- Optional enrichment:
  `nmvtis`, `nicb`, `copart`, `iaai`, `autotrader`, `cargurus`, `jdpower`, `vininspect`

The pipeline is intentionally tolerant of optional-source failures so reports can still complete when scrapers get blocked or premium APIs are unavailable.

## Local development

```bash
pnpm install
pnpm dev
```

This starts the SvelteKit app and the worker process together.

Useful commands:

```bash
pnpm check
pnpm lint
pnpm test
pnpm workers
pnpm test:vin
```

## Environment

See [.env.example](/Users/mac/Desktop/motocheck/.env.example) for the current environment contract.

For pipeline-only local work, the practical minimum is:

- `DATABASE_URL`
- `NHTSA_API_URL`

Payments, email, Telegram, image search, and premium data providers are optional for pipeline development, although they are required for the full production product experience.

## Notes

- The codebase no longer contains the removed historical report-generation stack or the older payment integration leftovers.
- The current source of truth for product and pipeline behavior is [docs/spec.md](/Users/mac/Desktop/motocheck/docs/spec.md).
