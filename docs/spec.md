---
title: MotoCheck Current Product Spec
updated: 2026-04-09
---

# Product Summary

MotoCheck provides VIN-based vehicle intelligence for Nigerian buyers and importers.

The product currently has two connected flows:

1. A fast preview flow for VIN decoding and duty estimation.
2. A richer asynchronous vehicle-history pipeline that builds a timeline and exports a DOCX report.

# Current Stack

- SvelteKit
- PostgreSQL + Drizzle ORM
- `pg-boss` for background jobs
- Puppeteer + stealth plugin for public web scraping
- Paystack for payment
- Resend for email
- Telegraf for Telegram bot integration
- `docx` for report export

# Core User Flow

1. User enters a VIN on the landing page.
2. `POST /api/vin` validates the VIN, decodes NHTSA data, calculates duty, and stores a cached preview in `lookups`.
3. User proceeds to checkout and pays via Paystack.
4. Payment webhook or direct pipeline trigger enqueues report-generation jobs.
5. Workers fetch and scrape available data sources.
6. Normalized source records are stitched into a single timeline.
7. Analysis and section-writing produce a buyer-oriented report.
8. `GET /api/export/:vin` returns a DOCX file when the report is ready.

# Pipeline Stages

## 1. Fetch

Structured API sources:

- `nhtsa_decode`
- `nhtsa_recalls`
- `nmvtis` when configured
- `nicb` when available

## 2. Scrape

Public web sources:

- `copart`
- `iaai`
- `autotrader`
- `cargurus`
- `jdpower`
- `vininspect`

## 3. Normalize

Each source is mapped into a shared structure:

- identity
- timeline events
- odometer readings
- title brands
- recalls
- damage records
- market value

## 4. Stitch

The stitcher:

- merges normalized records into one chronological timeline
- inserts odometer readings
- detects mileage anomalies
- detects long history gaps
- stores the stitched result in `pipeline_reports`

## 5. Analyze

The analyzer:

- computes risk flags and verdict text
- uses a configured LLM provider when available
- falls back to deterministic rules when no provider is configured or parsing fails

## 6. Write Sections

Section generation:

- writes reusable report sections to `report_sections`
- uses the LLM when available
- falls back to deterministic prose when needed

# Completion Rules

Required for pipeline completion:

- `nhtsa_decode`
- `nhtsa_recalls`

Optional enrichment sources do not block completion:

- `nmvtis`
- `nicb`
- `copart`
- `iaai`
- `autotrader`
- `cargurus`
- `jdpower`
- `vininspect`

This is deliberate. Public scrapers are volatile and the report should still complete when enrichment sources are unavailable.

# Data Model

Preview/payment flow:

- `lookups`
- `orders`
- `reports` kept for backward compatibility with older delivery concepts

Pipeline flow:

- `pipeline_reports`
- `raw_data`
- `normalized_data`
- `odometer_readings`
- `vehicle_photos`
- `report_sections`
- `pipeline_log`

# Runtime Endpoints

Preview/payment:

- `POST /api/vin`
- `POST /api/pay/initiate`
- `POST /api/webhook/paystack`

Pipeline:

- `POST /api/report`
- `GET /api/report?vin=...`
- `GET /api/status/:vin`
- `GET /api/report/:vin/sections`
- `GET /api/report/:vin/photos`
- `GET /api/report/:vin/odometer`
- `GET /api/export/:vin`

Health:

- `GET /api/health`
- `GET /health`

# Current Non-Goals

- Guaranteed access to premium NMVTIS data without credentials
- Blocking report completion on scraper success
- Browser-based PDF generation in the active pipeline

# Working Principles For Future Changes

- Keep one active report-generation path.
- Prefer deterministic fallbacks over hard failures.
- Treat scrapers as enrichment, not as guaranteed infrastructure.
- Keep docs aligned with runtime behavior and remove dead modules rather than leaving dormant alternatives around.
