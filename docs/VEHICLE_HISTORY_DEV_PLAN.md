# Vehicle History Platform — Comprehensive Dev Plan
> For Kiro Agent: Full codebase restructure, worker pipeline, data aggregation, LLM analysis
> Stack: SvelteKit (fullstack) · Drizzle ORM · PostgreSQL on Railway · Puppeteer · pg-boss

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current State Assessment](#2-current-state-assessment)
3. [Target Architecture](#3-target-architecture)
4. [Folder Structure Restructure](#4-folder-structure-restructure)
5. [New Dependencies](#5-new-dependencies)
6. [Database Schema (Drizzle)](#6-database-schema-drizzle)
7. [Queue System Setup (pg-boss)](#7-queue-system-setup-pg-boss)
8. [Worker Pipeline — All Workers](#8-worker-pipeline--all-workers)
   - 8a. Fetcher Workers (APIs)
   - 8b. Scraper Workers (Puppeteer)
   - 8c. Normalizer Workers
   - 8d. Stitcher Worker
   - 8e. LLM Workers
9. [Data Source Catalogue](#9-data-source-catalogue)
10. [Normalizer Schema Contract](#10-normalizer-schema-contract)
11. [Report Sections & LLM Prompts](#11-report-sections--llm-prompts)
12. [Odometer Graph Data Pipeline](#12-odometer-graph-data-pipeline)
13. [Photo Aggregation Pipeline](#13-photo-aggregation-pipeline)
14. [Gap Detection Logic](#14-gap-detection-logic)
15. [SvelteKit API Routes](#15-sveltekit-api-routes)
16. [Worker Process Bootstrap](#16-worker-process-bootstrap)
17. [Environment Variables](#17-environment-variables)
18. [Railway Deployment Config](#18-railway-deployment-config)
19. [Error Handling & Resilience](#19-error-handling--resilience)
20. [Build Order & Milestones](#20-build-order--milestones)

---

## 1. Project Overview

This platform generates comprehensive vehicle history reports for any VIN, comparable to or better than Carfax/AutoCheck. The key differentiators are:

- **LLM-written sections** — every section is explained in plain English, not raw data dumps
- **Gap detection** — the system actively identifies and flags missing history windows
- **Odometer graph** — visual mileage timeline plotted from all sources
- **Photo aggregation** — condition photos pulled from auction and listing history
- **Modular worker pipeline** — adding a new data source requires writing one fetcher + one normalizer, nothing else changes

The system is built as a **SvelteKit fullstack app** with a **separate long-running worker process** that shares the same PostgreSQL database on Railway.

---

## 2. Current State Assessment

Kiro should audit the existing codebase for the following before making changes:

### Preserve As-Is
- Existing NHTSA decode/reconstruct/join logic — wrap in a worker, do not rewrite
- Existing Puppeteer setup/configuration — extend, do not replace
- Existing Drizzle config and DB connection — extend schema, do not drop tables
- Existing docx generation — keep, will be used to export reports

### Identify & Refactor
- Any direct `fetch()` calls to NHTSA in route handlers → move to `workers/fetchers/fetch-nhtsa.ts`
- Any synchronous report-building logic → move to `workers/stitch-report.ts`
- Any inline data transformation → move to `workers/normalizers/`

### Do Not Touch
- Auth logic (if any)
- Payment/subscription logic (if any)
- Existing UI components unless instructed

---

## 3. Target Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          RAILWAY DEPLOYMENT                         │
│                                                                     │
│  ┌──────────────────────┐         ┌────────────────────────────┐   │
│  │   SvelteKit App      │         │   Worker Process           │   │
│  │   (web server)       │         │   (workers/index.ts)       │   │
│  │                      │         │                            │   │
│  │  /api/report POST ───┼──jobs──▶│  Fetcher Workers           │   │
│  │  /api/report GET  ◀──┼──read───│  Scraper Workers           │   │
│  │  /api/status GET  ◀──┼──read───│  Normalizer Workers        │   │
│  │                      │         │  Stitcher Worker           │   │
│  └──────────────────────┘         │  LLM Workers               │   │
│             │                     └────────────┬───────────────┘   │
│             │                                  │                   │
│             ▼                                  ▼                   │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │              PostgreSQL (Railway)                         │     │
│  │  jobs · raw_data · normalized_data · reports · photos     │     │
│  │  odometer_readings · report_sections · report_status      │     │
│  └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key principle:** The SvelteKit app only reads completed reports from the DB. It never directly calls external APIs or scrapers. All heavy lifting is done by workers.

---

## 4. Folder Structure Restructure

Kiro should restructure the project to match the following layout exactly:

```
/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── index.ts              # Drizzle client export
│   │   │   │   └── schema.ts             # All Drizzle table definitions
│   │   │   ├── queue/
│   │   │   │   ├── index.ts              # pg-boss instance (singleton)
│   │   │   │   └── job-names.ts          # Enum of all job name strings
│   │   │   └── report/
│   │   │       └── status.ts             # Report status helpers
│   │   └── shared/
│   │       ├── types.ts                  # Shared TS interfaces
│   │       └── vin-utils.ts              # VIN validation helpers
│   └── routes/
│       ├── api/
│       │   ├── report/
│       │   │   └── +server.ts            # POST (trigger) / GET (poll)
│       │   ├── status/
│       │   │   └── [vin]/+server.ts      # GET pipeline status per VIN
│       │   └── export/
│       │       └── [vin]/+server.ts      # GET generate docx export
│       └── report/
│           └── [vin]/
│               └── +page.svelte          # Report display page
│
├── workers/
│   ├── index.ts                          # Bootstrap — registers all workers
│   ├── fetchers/
│   │   ├── fetch-nhtsa-decode.ts
│   │   ├── fetch-nhtsa-recalls.ts
│   │   ├── fetch-nmvtis.ts
│   │   └── fetch-nicb-theft.ts
│   ├── scrapers/
│   │   ├── scrape-copart.ts
│   │   ├── scrape-iaai.ts
│   │   ├── scrape-autotrader.ts
│   │   └── scrape-cargurus.ts
│   ├── normalizers/
│   │   ├── index.ts                      # normalizers registry map
│   │   ├── normalize-nhtsa.ts
│   │   ├── normalize-nmvtis.ts
│   │   ├── normalize-nicb.ts
│   │   ├── normalize-copart.ts
│   │   ├── normalize-iaai.ts
│   │   ├── normalize-autotrader.ts
│   │   └── normalize-cargurus.ts
│   ├── stitch-report.ts
│   ├── llm-analyze.ts
│   └── llm-write-sections.ts
│
├── drizzle/
│   └── migrations/                       # Auto-generated by drizzle-kit
│
├── scripts/
│   └── test-vin.ts                       # Manual test: node scripts/test-vin.ts <VIN>
│
├── drizzle.config.ts
├── package.json
└── railway.toml
```

---

## 5. New Dependencies

Kiro should run the following install commands:

```bash
# Queue system
npm install pg-boss

# LLM
npm install @anthropic-ai/sdk

# HTTP client for APIs
npm install got

# Scraping (puppeteer already exists — add stealth plugin)
npm install puppeteer-extra puppeteer-extra-plugin-stealth

# Concurrently run app + workers in dev
npm install --save-dev concurrently tsx
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "concurrently \"vite dev\" \"tsx workers/index.ts\"",
    "build": "vite build",
    "workers": "tsx workers/index.ts",
    "workers:prod": "node --loader tsx/esm workers/index.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "test:vin": "tsx scripts/test-vin.ts"
  }
}
```

---

## 6. Database Schema (Drizzle)

Kiro should add the following tables to `src/lib/server/db/schema.ts`. Do NOT drop any existing tables.

```typescript
import {
  pgTable, text, jsonb, timestamp, integer,
  boolean, pgEnum, serial, uniqueIndex, index
} from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const reportStatusEnum = pgEnum('report_status', [
  'pending',
  'fetching',
  'normalizing',
  'stitching',
  'analyzing',
  'ready',
  'failed',
]);

export const dataSourceEnum = pgEnum('data_source', [
  'nhtsa_decode',
  'nhtsa_recalls',
  'nmvtis',
  'nicb',
  'copart',
  'iaai',
  'autotrader',
  'cargurus',
]);

export const odometerSourceEnum = pgEnum('odometer_source', [
  'title_transfer',
  'state_inspection',
  'auction',
  'service_record',
  'listing',
]);

// ─── Core Report ──────────────────────────────────────────────────────────────

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  vin: text('vin').notNull().unique(),
  status: reportStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  errorMessage: text('error_message'),
  // Decoded vehicle identity
  year: integer('year'),
  make: text('make'),
  model: text('model'),
  trim: text('trim'),
  bodyStyle: text('body_style'),
  engineDescription: text('engine_description'),
  driveType: text('drive_type'),
  fuelType: text('fuel_type'),
  // Stitched timeline (full merged JSON)
  timeline: jsonb('timeline'),
  // LLM-generated analysis
  llmFlags: jsonb('llm_flags'),          // { gaps, anomalies, riskScore }
  llmVerdict: text('llm_verdict'),        // buy / caution / avoid + reasoning
});

// ─── Raw Data (one row per source per VIN) ───────────────────────────────────

export const rawData = pgTable('raw_data', {
  id: serial('id').primaryKey(),
  vin: text('vin').notNull(),
  source: dataSourceEnum('source').notNull(),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  rawJson: jsonb('raw_json').notNull(),
  rawHtml: text('raw_html'),              // store raw HTML snapshot for re-parsing
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
}, (table) => ({
  vinSourceIdx: uniqueIndex('raw_data_vin_source_idx').on(table.vin, table.source),
}));

// ─── Normalized Data (one row per source per VIN, transformed to schema) ─────

export const normalizedData = pgTable('normalized_data', {
  id: serial('id').primaryKey(),
  vin: text('vin').notNull(),
  source: dataSourceEnum('source').notNull(),
  normalizedAt: timestamp('normalized_at').defaultNow().notNull(),
  data: jsonb('data').notNull(),          // conforms to NormalizedVehicleRecord type
}, (table) => ({
  vinSourceIdx: uniqueIndex('norm_data_vin_source_idx').on(table.vin, table.source),
}));

// ─── Odometer Readings (stitched across all sources) ─────────────────────────

export const odometerReadings = pgTable('odometer_readings', {
  id: serial('id').primaryKey(),
  vin: text('vin').notNull(),
  readingDate: timestamp('reading_date').notNull(),
  mileage: integer('mileage').notNull(),
  source: odometerSourceEnum('source').notNull(),
  reportedBy: text('reported_by'),        // e.g. "Texas DMV", "Copart Dallas"
  isAnomaly: boolean('is_anomaly').default(false),
  anomalyNote: text('anomaly_note'),
}, (table) => ({
  vinIdx: index('odometer_vin_idx').on(table.vin),
}));

// ─── Vehicle Photos ───────────────────────────────────────────────────────────

export const vehiclePhotos = pgTable('vehicle_photos', {
  id: serial('id').primaryKey(),
  vin: text('vin').notNull(),
  url: text('url').notNull(),
  source: text('source').notNull(),       // 'copart', 'iaai', 'autotrader', etc.
  capturedAt: timestamp('captured_at'),   // date of auction/listing, not scrape date
  scrapedAt: timestamp('scraped_at').defaultNow(),
  photoType: text('photo_type'),          // 'exterior_front', 'damage', 'interior', etc.
  auctionLotId: text('auction_lot_id'),
}, (table) => ({
  vinIdx: index('photos_vin_idx').on(table.vin),
}));

// ─── Report Sections (LLM-written, one row per section per VIN) ──────────────

export const reportSections = pgTable('report_sections', {
  id: serial('id').primaryKey(),
  vin: text('vin').notNull(),
  sectionKey: text('section_key').notNull(),   // e.g. 'summary', 'accident_analysis'
  content: text('content').notNull(),           // plain English LLM output
  generatedAt: timestamp('generated_at').defaultNow(),
  modelUsed: text('model_used'),
}, (table) => ({
  vinSectionIdx: uniqueIndex('sections_vin_key_idx').on(table.vin, table.sectionKey),
}));

// ─── Pipeline Status Log (per-source progress tracking) ──────────────────────

export const pipelineLog = pgTable('pipeline_log', {
  id: serial('id').primaryKey(),
  vin: text('vin').notNull(),
  stage: text('stage').notNull(),         // e.g. 'fetch-nhtsa', 'normalize-copart'
  status: text('status').notNull(),       // 'started', 'completed', 'failed'
  message: text('message'),
  timestamp: timestamp('timestamp').defaultNow(),
}, (table) => ({
  vinIdx: index('pipeline_vin_idx').on(table.vin),
}));
```

After adding, run:
```bash
npm run db:generate
npm run db:migrate
```

---

## 7. Queue System Setup (pg-boss)

```typescript
// src/lib/server/queue/index.ts

import PgBoss from 'pg-boss';

let boss: PgBoss | null = null;

export async function getQueue(): Promise<PgBoss> {
  if (boss) return boss;

  boss = new PgBoss({
    connectionString: process.env.DATABASE_URL,
    // Retain completed jobs for 3 days for debugging
    deleteAfterDays: 3,
    // Retry failed jobs up to 3 times with exponential backoff
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
    // Expire jobs that haven't started within 10 minutes
    expireInMinutes: 10,
  });

  boss.on('error', (err) => console.error('[Queue Error]', err));

  await boss.start();
  console.log('[Queue] pg-boss started');
  return boss;
}
```

```typescript
// src/lib/server/queue/job-names.ts

export const Jobs = {
  // Fetchers
  FETCH_NHTSA_DECODE:   'fetch-nhtsa-decode',
  FETCH_NHTSA_RECALLS:  'fetch-nhtsa-recalls',
  FETCH_NMVTIS:         'fetch-nmvtis',
  FETCH_NICB:           'fetch-nicb',

  // Scrapers
  SCRAPE_COPART:        'scrape-copart',
  SCRAPE_IAAI:          'scrape-iaai',
  SCRAPE_AUTOTRADER:    'scrape-autotrader',
  SCRAPE_CARGURUS:      'scrape-cargurus',

  // Processing
  NORMALIZE:            'normalize',
  STITCH_REPORT:        'stitch-report',

  // LLM
  LLM_ANALYZE:          'llm-analyze',
  LLM_WRITE_SECTIONS:   'llm-write-sections',
} as const;

// All sources that must complete before stitching begins
export const REQUIRED_SOURCES = [
  'nhtsa_decode',
  'nhtsa_recalls',
  'nmvtis',
  'nicb',
  'copart',
  'iaai',
] as const;

// Sources that are optional (enrich the report but don't block stitching)
export const OPTIONAL_SOURCES = [
  'autotrader',
  'cargurus',
] as const;
```

---

## 8. Worker Pipeline — All Workers

### 8a. Fetcher Workers (API-based)

---

#### `workers/fetchers/fetch-nhtsa-decode.ts`

```typescript
import { getQueue } from '../../src/lib/server/queue/index.js';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, pipelineLog } from '../../src/lib/server/db/schema.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';
import got from 'got';

export async function registerFetchNhtsaDecode() {
  const boss = await getQueue();

  boss.work(Jobs.FETCH_NHTSA_DECODE, async (job) => {
    const { vin } = job.data as { vin: string };

    await log(vin, 'fetch-nhtsa-decode', 'started');

    try {
      // Decode endpoint
      const decodeUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`;
      const decodeRes = await got(decodeUrl).json<any>();

      // Equipment endpoint
      const equipUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/GetEquipmentPlantCodes/2023/1/1?format=json`;

      await db.insert(rawData).values({
        vin,
        source: 'nhtsa_decode',
        rawJson: decodeRes,
        success: true,
      }).onConflictDoUpdate({
        target: [rawData.vin, rawData.source],
        set: { rawJson: decodeRes, fetchedAt: new Date(), success: true },
      });

      await log(vin, 'fetch-nhtsa-decode', 'completed');

      // Trigger normalization
      await boss.send(Jobs.NORMALIZE, { vin, source: 'nhtsa_decode' });

    } catch (err: any) {
      await log(vin, 'fetch-nhtsa-decode', 'failed', err.message);
      throw err; // pg-boss will retry
    }
  });
}

async function log(vin: string, stage: string, status: string, message?: string) {
  await db.insert(pipelineLog).values({ vin, stage, status, message });
}
```

---

#### `workers/fetchers/fetch-nhtsa-recalls.ts`

```typescript
import { getQueue } from '../../src/lib/server/queue/index.js';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, pipelineLog } from '../../src/lib/server/db/schema.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';
import got from 'got';

export async function registerFetchNhtsaRecalls() {
  const boss = await getQueue();

  boss.work(Jobs.FETCH_NHTSA_RECALLS, async (job) => {
    const { vin } = job.data as { vin: string };

    await db.insert(pipelineLog).values({ vin, stage: 'fetch-nhtsa-recalls', status: 'started' });

    const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?vin=${vin}`;
    const result = await got(url).json<any>();

    await db.insert(rawData).values({
      vin,
      source: 'nhtsa_recalls',
      rawJson: result,
      success: true,
    }).onConflictDoUpdate({
      target: [rawData.vin, rawData.source],
      set: { rawJson: result, fetchedAt: new Date(), success: true },
    });

    await db.insert(pipelineLog).values({ vin, stage: 'fetch-nhtsa-recalls', status: 'completed' });
    await boss.send(Jobs.NORMALIZE, { vin, source: 'nhtsa_recalls' });
  });
}
```

---

#### `workers/fetchers/fetch-nmvtis.ts`

NMVTIS requires an approved data provider account. Sign up at https://www.vehiclehistory.gov/nmvtis_data_providers.html. Cost is approximately $0.05 per VIN query. Use AAX (Approved NMVTIS provider) or VehicleHistory.gov direct API.

```typescript
import { getQueue } from '../../src/lib/server/queue/index.js';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, pipelineLog } from '../../src/lib/server/db/schema.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';
import got from 'got';

export async function registerFetchNmvtis() {
  const boss = await getQueue();

  boss.work(Jobs.FETCH_NMVTIS, async (job) => {
    const { vin } = job.data as { vin: string };

    await db.insert(pipelineLog).values({ vin, stage: 'fetch-nmvtis', status: 'started' });

    // Replace with actual NMVTIS provider endpoint + credentials
    const url = `${process.env.NMVTIS_API_URL}/vehicle/${vin}`;
    const result = await got(url, {
      headers: { Authorization: `Bearer ${process.env.NMVTIS_API_KEY}` },
    }).json<any>();

    await db.insert(rawData).values({
      vin,
      source: 'nmvtis',
      rawJson: result,
      success: true,
    }).onConflictDoUpdate({
      target: [rawData.vin, rawData.source],
      set: { rawJson: result, fetchedAt: new Date(), success: true },
    });

    await db.insert(pipelineLog).values({ vin, stage: 'fetch-nmvtis', status: 'completed' });
    await boss.send(Jobs.NORMALIZE, { vin, source: 'nmvtis' });
  });
}
```

---

#### `workers/fetchers/fetch-nicb.ts`

NICB VINCheck is a free public tool. Scrape or use their API if registered.

```typescript
import { getQueue } from '../../src/lib/server/queue/index.js';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, pipelineLog } from '../../src/lib/server/db/schema.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';
import got from 'got';

export async function registerFetchNicb() {
  const boss = await getQueue();

  boss.work(Jobs.FETCH_NICB, async (job) => {
    const { vin } = job.data as { vin: string };

    await db.insert(pipelineLog).values({ vin, stage: 'fetch-nicb', status: 'started' });

    // NICB VINCheck public endpoint
    const url = `https://www.nicb.org/vincheck/api?vin=${vin}`;
    const result = await got(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VehicleHistoryBot/1.0)',
      },
    }).json<any>();

    await db.insert(rawData).values({
      vin,
      source: 'nicb',
      rawJson: result,
      success: true,
    }).onConflictDoUpdate({
      target: [rawData.vin, rawData.source],
      set: { rawJson: result, fetchedAt: new Date(), success: true },
    });

    await db.insert(pipelineLog).values({ vin, stage: 'fetch-nicb', status: 'completed' });
    await boss.send(Jobs.NORMALIZE, { vin, source: 'nicb' });
  });
}
```

---

### 8b. Scraper Workers (Puppeteer)

Kiro should ensure puppeteer-extra with stealth plugin is used for all scrapers to avoid bot detection.

---

#### `workers/scrapers/scrape-copart.ts`

Copart is an insurance/salvage auction. Searching by VIN returns lot history with damage photos.

```typescript
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getQueue } from '../../src/lib/server/queue/index.js';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, vehiclePhotos, pipelineLog } from '../../src/lib/server/db/schema.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';

puppeteer.use(StealthPlugin());

export async function registerScrapeCopart() {
  const boss = await getQueue();

  boss.work(Jobs.SCRAPE_COPART, { teamSize: 2, teamConcurrency: 1 }, async (job) => {
    const { vin } = job.data as { vin: string };

    await db.insert(pipelineLog).values({ vin, stage: 'scrape-copart', status: 'started' });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      // Search Copart by VIN
      await page.goto(`https://www.copart.com/lot/search?query=${vin}`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for results
      await page.waitForSelector('.lot-list-item, .no-results', { timeout: 10000 }).catch(() => null);

      const rawHtml = await page.content();

      // Extract structured data
      const lots = await page.evaluate(() => {
        const items = document.querySelectorAll('.lot-list-item');
        return Array.from(items).map(item => ({
          lotNumber: item.querySelector('[data-lot-number]')?.getAttribute('data-lot-number'),
          saleDate: item.querySelector('.sale-date')?.textContent?.trim(),
          odometer: item.querySelector('.odometer')?.textContent?.trim(),
          damageDescription: item.querySelector('.damage-description')?.textContent?.trim(),
          primaryDamage: item.querySelector('.primary-damage')?.textContent?.trim(),
          secondaryDamage: item.querySelector('.secondary-damage')?.textContent?.trim(),
          titleCode: item.querySelector('.title-code')?.textContent?.trim(),
          location: item.querySelector('.location')?.textContent?.trim(),
          images: Array.from(item.querySelectorAll('img[src*="cs.copart"]')).map((img: any) => img.src),
        }));
      });

      // Store raw data with HTML snapshot
      await db.insert(rawData).values({
        vin,
        source: 'copart',
        rawJson: { lots },
        rawHtml,
        success: true,
      }).onConflictDoUpdate({
        target: [rawData.vin, rawData.source],
        set: { rawJson: { lots }, rawHtml, fetchedAt: new Date(), success: true },
      });

      // Store photos separately
      for (const lot of lots) {
        for (const imgUrl of (lot.images || [])) {
          await db.insert(vehiclePhotos).values({
            vin,
            url: imgUrl,
            source: 'copart',
            capturedAt: lot.saleDate ? new Date(lot.saleDate) : null,
            auctionLotId: lot.lotNumber,
            photoType: 'auction_condition',
          }).onConflictDoNothing();
        }
      }

      await db.insert(pipelineLog).values({ vin, stage: 'scrape-copart', status: 'completed' });
      await boss.send(Jobs.NORMALIZE, { vin, source: 'copart' });

    } finally {
      await browser.close();
    }
  });
}
```

---

#### `workers/scrapers/scrape-iaai.ts`

IAAI (Insurance Auto Auctions) — another major salvage auction source with extensive photo history.

```typescript
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getQueue } from '../../src/lib/server/queue/index.js';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, vehiclePhotos, pipelineLog } from '../../src/lib/server/db/schema.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';

puppeteer.use(StealthPlugin());

export async function registerScrapeIaai() {
  const boss = await getQueue();

  boss.work(Jobs.SCRAPE_IAAI, { teamSize: 2, teamConcurrency: 1 }, async (job) => {
    const { vin } = job.data as { vin: string };

    await db.insert(pipelineLog).values({ vin, stage: 'scrape-iaai', status: 'started' });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

      await page.goto(`https://www.iaai.com/Search?vehicleSearch=${vin}`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      const rawHtml = await page.content();

      const results = await page.evaluate(() => {
        const cards = document.querySelectorAll('.vehicle-card, [data-vehicle]');
        return Array.from(cards).map(card => ({
          stockNumber: card.querySelector('[data-stock-number]')?.getAttribute('data-stock-number'),
          saleDate: card.querySelector('.sale-date, [class*="saleDate"]')?.textContent?.trim(),
          mileage: card.querySelector('[class*="mileage"], [class*="odometer"]')?.textContent?.trim(),
          damageType: card.querySelector('[class*="damage"]')?.textContent?.trim(),
          titleType: card.querySelector('[class*="title"]')?.textContent?.trim(),
          location: card.querySelector('[class*="location"]')?.textContent?.trim(),
          images: Array.from(card.querySelectorAll('img')).map((img: any) => img.src).filter(src => src.includes('iaai')),
        }));
      });

      await db.insert(rawData).values({
        vin,
        source: 'iaai',
        rawJson: { results },
        rawHtml,
        success: true,
      }).onConflictDoUpdate({
        target: [rawData.vin, rawData.source],
        set: { rawJson: { results }, rawHtml, fetchedAt: new Date(), success: true },
      });

      for (const result of results) {
        for (const imgUrl of (result.images || [])) {
          await db.insert(vehiclePhotos).values({
            vin,
            url: imgUrl,
            source: 'iaai',
            capturedAt: result.saleDate ? new Date(result.saleDate) : null,
            auctionLotId: result.stockNumber,
            photoType: 'auction_condition',
          }).onConflictDoNothing();
        }
      }

      await db.insert(pipelineLog).values({ vin, stage: 'scrape-iaai', status: 'completed' });
      await boss.send(Jobs.NORMALIZE, { vin, source: 'iaai' });

    } finally {
      await browser.close();
    }
  });
}
```

---

#### `workers/scrapers/scrape-autotrader.ts`

Used for listing history, asking price, and photos of vehicle when it was listed for sale.

```typescript
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getQueue } from '../../src/lib/server/queue/index.js';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, vehiclePhotos, pipelineLog } from '../../src/lib/server/db/schema.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';

puppeteer.use(StealthPlugin());

export async function registerScrapeAutotrader() {
  const boss = await getQueue();

  boss.work(Jobs.SCRAPE_AUTOTRADER, async (job) => {
    const { vin } = job.data as { vin: string };

    await db.insert(pipelineLog).values({ vin, stage: 'scrape-autotrader', status: 'started' });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.goto(`https://www.autotrader.com/cars-for-sale/vin/${vin}`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      const rawHtml = await page.content();

      const listing = await page.evaluate(() => {
        return {
          price: document.querySelector('[class*="price"]')?.textContent?.trim(),
          mileage: document.querySelector('[class*="mileage"]')?.textContent?.trim(),
          dealer: document.querySelector('[class*="dealer-name"]')?.textContent?.trim(),
          location: document.querySelector('[class*="dealer-location"]')?.textContent?.trim(),
          listedDate: document.querySelector('[class*="listed-date"]')?.textContent?.trim(),
          images: Array.from(document.querySelectorAll('img[src*="autotrader"]')).map((img: any) => img.src),
          features: Array.from(document.querySelectorAll('[class*="feature-item"]')).map(el => el.textContent?.trim()),
          description: document.querySelector('[class*="description"]')?.textContent?.trim(),
        };
      });

      await db.insert(rawData).values({
        vin,
        source: 'autotrader',
        rawJson: listing,
        rawHtml,
        success: true,
      }).onConflictDoUpdate({
        target: [rawData.vin, rawData.source],
        set: { rawJson: listing, rawHtml, fetchedAt: new Date(), success: true },
      });

      for (const imgUrl of (listing.images || [])) {
        await db.insert(vehiclePhotos).values({
          vin,
          url: imgUrl,
          source: 'autotrader',
          photoType: 'listing',
        }).onConflictDoNothing();
      }

      await db.insert(pipelineLog).values({ vin, stage: 'scrape-autotrader', status: 'completed' });
      await boss.send(Jobs.NORMALIZE, { vin, source: 'autotrader' });

    } finally {
      await browser.close();
    }
  });
}
```

---

#### `workers/scrapers/scrape-cargurus.ts`

Used for price history and market value trend data.

```typescript
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getQueue } from '../../src/lib/server/queue/index.js';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, pipelineLog } from '../../src/lib/server/db/schema.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';

puppeteer.use(StealthPlugin());

export async function registerScrapeCarGurus() {
  const boss = await getQueue();

  boss.work(Jobs.SCRAPE_CARGURUS, async (job) => {
    const { vin } = job.data as { vin: string };

    await db.insert(pipelineLog).values({ vin, stage: 'scrape-cargurus', status: 'started' });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.goto(`https://www.cargurus.com/Cars/new/nl#listing=${vin}`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      const rawHtml = await page.content();

      const priceData = await page.evaluate(() => ({
        currentPrice: document.querySelector('[data-cg-ft="price"]')?.textContent?.trim(),
        priceRating: document.querySelector('[class*="price-rating"]')?.textContent?.trim(),
        marketAverage: document.querySelector('[class*="market-average"]')?.textContent?.trim(),
        daysOnMarket: document.querySelector('[class*="days-on-market"]')?.textContent?.trim(),
        priceDrops: Array.from(document.querySelectorAll('[class*="price-drop"]')).map(el => el.textContent?.trim()),
      }));

      await db.insert(rawData).values({
        vin,
        source: 'cargurus',
        rawJson: priceData,
        rawHtml,
        success: true,
      }).onConflictDoUpdate({
        target: [rawData.vin, rawData.source],
        set: { rawJson: priceData, rawHtml, fetchedAt: new Date(), success: true },
      });

      await db.insert(pipelineLog).values({ vin, stage: 'scrape-cargurus', status: 'completed' });
      await boss.send(Jobs.NORMALIZE, { vin, source: 'cargurus' });

    } finally {
      await browser.close();
    }
  });
}
```

---

### 8c. Normalizer Workers

All normalizers convert raw source data into the shared `NormalizedVehicleRecord` schema defined in Section 10.

```typescript
// workers/normalizers/index.ts

import { normalizeNhtsa } from './normalize-nhtsa.js';
import { normalizeNmvtis } from './normalize-nmvtis.js';
import { normalizeNicb } from './normalize-nicb.js';
import { normalizeCopart } from './normalize-copart.js';
import { normalizeIaai } from './normalize-iaai.js';
import { normalizeAutotrader } from './normalize-autotrader.js';
import { normalizeCargurus } from './normalize-cargurus.js';
import { getQueue } from '../../src/lib/server/queue/index.js';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, normalizedData, pipelineLog } from '../../src/lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { Jobs, REQUIRED_SOURCES } from '../../src/lib/server/queue/job-names.js';

const normalizerMap: Record<string, (raw: any) => any> = {
  nhtsa_decode:  normalizeNhtsa,
  nhtsa_recalls: normalizeNhtsa,
  nmvtis:        normalizeNmvtis,
  nicb:          normalizeNicb,
  copart:        normalizeCopart,
  iaai:          normalizeIaai,
  autotrader:    normalizeAutotrader,
  cargurus:      normalizeCargurus,
};

export async function registerNormalizeWorker() {
  const boss = await getQueue();

  boss.work(Jobs.NORMALIZE, async (job) => {
    const { vin, source } = job.data as { vin: string; source: string };

    await db.insert(pipelineLog).values({ vin, stage: `normalize-${source}`, status: 'started' });

    const raw = await db.query.rawData.findFirst({
      where: and(eq(rawData.vin, vin), eq(rawData.source, source as any)),
    });

    if (!raw?.rawJson) {
      throw new Error(`No raw data found for ${vin}/${source}`);
    }

    const normalizer = normalizerMap[source];
    if (!normalizer) throw new Error(`No normalizer registered for source: ${source}`);

    const normalized = normalizer(raw.rawJson);

    await db.insert(normalizedData).values({
      vin,
      source: source as any,
      data: normalized,
    }).onConflictDoUpdate({
      target: [normalizedData.vin, normalizedData.source],
      set: { data: normalized, normalizedAt: new Date() },
    });

    await db.insert(pipelineLog).values({ vin, stage: `normalize-${source}`, status: 'completed' });

    // Check if all required sources are normalized — if so, trigger stitch
    await checkAndTriggerStitch(vin, boss);
  });
}

async function checkAndTriggerStitch(vin: string, boss: any) {
  const completed = await db.query.normalizedData.findMany({
    where: eq(normalizedData.vin, vin),
  });

  const completedSources = completed.map(r => r.source);
  const allRequired = REQUIRED_SOURCES.every(s => completedSources.includes(s));

  if (allRequired) {
    await boss.send(Jobs.STITCH_REPORT, { vin });
  }
}
```

---

#### `workers/normalizers/normalize-nhtsa.ts`

```typescript
import type { NormalizedVehicleRecord } from '../../src/lib/shared/types.js';

export function normalizeNhtsa(raw: any): Partial<NormalizedVehicleRecord> {
  const results = raw?.Results ?? [];

  const get = (variable: string) =>
    results.find((r: any) => r.Variable === variable)?.Value ?? null;

  return {
    source: 'nhtsa_decode',
    identity: {
      year:            parseInt(get('Model Year')) || null,
      make:            get('Make'),
      model:           get('Model'),
      trim:            get('Trim'),
      bodyStyle:       get('Body Class'),
      doors:           parseInt(get('Doors')) || null,
      driveType:       get('Drive Type'),
      fuelType:        get('Fuel Type - Primary'),
      engineCylinders: parseInt(get('Engine Number of Cylinders')) || null,
      engineDisplacement: get('Displacement (L)'),
      transmission:    get('Transmission Style'),
      plantCity:       get('Plant City'),
      plantCountry:    get('Plant Country'),
      series:          get('Series'),
    },
    recalls: null,  // handled by separate NHTSA recalls normalizer
    events: [],
  };
}

export function normalizeNhtsaRecalls(raw: any): Partial<NormalizedVehicleRecord> {
  const recalls = (raw?.results ?? []).map((r: any) => ({
    campaignNumber: r.NHTSACampaignNumber,
    component:      r.Component,
    summary:        r.Summary,
    consequence:    r.Conequence,
    remedy:         r.Remedy,
    reportDate:     r.ReportReceivedDate,
  }));

  return {
    source: 'nhtsa_recalls',
    recalls,
    events: recalls.map((r: any) => ({
      type: 'recall',
      date: r.reportDate,
      description: `Safety recall: ${r.component}`,
      data: r,
    })),
  };
}
```

---

#### `workers/normalizers/normalize-nmvtis.ts`

```typescript
export function normalizeNmvtis(raw: any): any {
  const titleHistory = (raw?.titleHistory ?? []).map((t: any) => ({
    date:         t.titleDate,
    state:        t.state,
    odometer:     parseInt(t.odometer) || null,
    titleBrand:   t.brand ?? null,
    ownerType:    t.ownerType ?? null,
  }));

  const events = titleHistory.map((t: any) => ({
    type: t.titleBrand ? 'title_brand' : 'title_transfer',
    date: t.date,
    state: t.state,
    description: t.titleBrand
      ? `Title branded as: ${t.titleBrand} in ${t.state}`
      : `Title transferred in ${t.state}`,
    data: t,
  }));

  return {
    source: 'nmvtis',
    titleHistory,
    odometerReadings: titleHistory
      .filter((t: any) => t.odometer)
      .map((t: any) => ({
        date:   t.date,
        mileage: t.odometer,
        source: 'title_transfer',
        state:  t.state,
      })),
    titleBrands: titleHistory.filter((t: any) => t.titleBrand).map((t: any) => t.titleBrand),
    events,
  };
}
```

---

#### `workers/normalizers/normalize-copart.ts`

```typescript
export function normalizeCopart(raw: any): any {
  const lots = raw?.lots ?? [];

  const events = lots.map((lot: any) => ({
    type:   'auction_sale',
    date:   lot.saleDate,
    source: 'copart',
    description: `Sold at Copart auction (${lot.location}). ${lot.primaryDamage ? 'Primary damage: ' + lot.primaryDamage : ''}`,
    data: lot,
  }));

  const odometerReadings = lots
    .filter((lot: any) => lot.odometer)
    .map((lot: any) => ({
      date:    lot.saleDate,
      mileage: parseInt(lot.odometer?.replace(/[^0-9]/g, '')) || null,
      source:  'auction',
      reportedBy: `Copart - ${lot.location}`,
    }))
    .filter((r: any) => r.mileage);

  const damageTypes = lots.map((lot: any) => ({
    primary:   lot.primaryDamage,
    secondary: lot.secondaryDamage,
    titleCode: lot.titleCode,
    date:      lot.saleDate,
  }));

  return { source: 'copart', events, odometerReadings, damageTypes };
}
```

---

### 8d. Stitcher Worker

```typescript
// workers/stitch-report.ts

import { getQueue } from '../src/lib/server/queue/index.js';
import { db } from '../src/lib/server/db/index.js';
import { normalizedData, reports, odometerReadings, pipelineLog } from '../src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { Jobs } from '../src/lib/server/queue/job-names.js';

export async function registerStitchWorker() {
  const boss = await getQueue();

  boss.work(Jobs.STITCH_REPORT, async (job) => {
    const { vin } = job.data as { vin: string };

    await db.insert(pipelineLog).values({ vin, stage: 'stitch-report', status: 'started' });
    await db.update(reports).set({ status: 'stitching' }).where(eq(reports.vin, vin));

    const allNormalized = await db.query.normalizedData.findMany({
      where: eq(normalizedData.vin, vin),
    });

    // ── Merge all events into chronological timeline ────────────────────────
    const allEvents = allNormalized
      .flatMap(n => (n.data as any)?.events ?? [])
      .filter(e => e.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // ── Merge vehicle identity (NHTSA decode is authoritative) ──────────────
    const nhtsaData = allNormalized.find(n => n.source === 'nhtsa_decode')?.data as any;
    const identity = nhtsaData?.identity ?? {};

    // ── Merge odometer readings ─────────────────────────────────────────────
    const allOdometerReadings = allNormalized
      .flatMap(n => (n.data as any)?.odometerReadings ?? [])
      .filter(r => r.date && r.mileage)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Detect odometer anomalies
    const odometerWithFlags = flagOdometerAnomalies(allOdometerReadings);

    // Persist odometer readings
    for (const reading of odometerWithFlags) {
      await db.insert(odometerReadings).values({
        vin,
        readingDate:  new Date(reading.date),
        mileage:      reading.mileage,
        source:       reading.source as any,
        reportedBy:   reading.reportedBy ?? null,
        isAnomaly:    reading.isAnomaly ?? false,
        anomalyNote:  reading.anomalyNote ?? null,
      }).onConflictDoNothing();
    }

    // ── Merge title history ─────────────────────────────────────────────────
    const nmvtisData = allNormalized.find(n => n.source === 'nmvtis')?.data as any;
    const titleHistory = nmvtisData?.titleHistory ?? [];
    const titleBrands = nmvtisData?.titleBrands ?? [];

    // ── Merge recalls ───────────────────────────────────────────────────────
    const recallsData = allNormalized.find(n => n.source === 'nhtsa_recalls')?.data as any;
    const recalls = recallsData?.recalls ?? [];

    // ── Merge damage records ────────────────────────────────────────────────
    const copartData = allNormalized.find(n => n.source === 'copart')?.data as any;
    const iaaiData   = allNormalized.find(n => n.source === 'iaai')?.data as any;
    const damageRecords = [
      ...(copartData?.damageTypes ?? []),
      ...(iaaiData?.damageTypes ?? []),
    ];

    // ── Market value ────────────────────────────────────────────────────────
    const cargData = allNormalized.find(n => n.source === 'cargurus')?.data as any;
    const atData   = allNormalized.find(n => n.source === 'autotrader')?.data as any;
    const marketValue = {
      currentListing:  atData?.price ?? null,
      cargurusRating:  cargData?.priceRating ?? null,
      marketAverage:   cargData?.marketAverage ?? null,
      daysOnMarket:    cargData?.daysOnMarket ?? null,
    };

    // ── Detect history gaps ─────────────────────────────────────────────────
    const gaps = detectGaps(allEvents, identity.year);

    // ── Build final stitched report ─────────────────────────────────────────
    const timeline = {
      identity,
      titleHistory,
      titleBrands,
      recalls,
      damageRecords,
      odometerReadings: odometerWithFlags,
      marketValue,
      events: allEvents,
      gaps,
      sourcesCovered: allNormalized.map(n => n.source),
    };

    await db.update(reports).set({
      status:            'analyzing',
      timeline,
      year:              identity.year,
      make:              identity.make,
      model:             identity.model,
      trim:              identity.trim,
      bodyStyle:         identity.bodyStyle,
      engineDescription: `${identity.engineCylinders}cyl ${identity.engineDisplacement}L`,
      driveType:         identity.driveType,
      fuelType:          identity.fuelType,
      updatedAt:         new Date(),
    }).where(eq(reports.vin, vin));

    await db.insert(pipelineLog).values({ vin, stage: 'stitch-report', status: 'completed' });
    await boss.send(Jobs.LLM_ANALYZE, { vin });
  });
}

function flagOdometerAnomalies(readings: any[]) {
  return readings.map((reading, i) => {
    if (i === 0) return { ...reading, isAnomaly: false };

    const prev = readings[i - 1];
    const daysDiff = (new Date(reading.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24);
    const milesDiff = reading.mileage - prev.mileage;
    const annualRate = daysDiff > 0 ? (milesDiff / daysDiff) * 365 : 0;

    if (milesDiff < 0) {
      return { ...reading, isAnomaly: true, anomalyNote: `Mileage decreased by ${Math.abs(milesDiff)} miles — possible rollback` };
    }
    if (annualRate > 50000) {
      return { ...reading, isAnomaly: true, anomalyNote: `Unusually high mileage rate: ~${Math.round(annualRate).toLocaleString()} miles/year` };
    }
    return { ...reading, isAnomaly: false };
  });
}

function detectGaps(events: any[], vehicleYear: number | null) {
  const gaps: any[] = [];
  if (events.length < 2) return gaps;

  for (let i = 0; i < events.length - 1; i++) {
    const current = new Date(events[i].date);
    const next    = new Date(events[i + 1].date);
    const monthsDiff = (next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsDiff > 18) {
      gaps.push({
        startDate:  events[i].date,
        endDate:    events[i + 1].date,
        monthsDiff: Math.round(monthsDiff),
        severity:   monthsDiff > 36 ? 'high' : 'medium',
      });
    }
  }

  // Check gap between last recorded event and today
  if (events.length > 0) {
    const lastEvent = new Date(events[events.length - 1].date);
    const monthsSinceLast = (Date.now() - lastEvent.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSinceLast > 18) {
      gaps.push({
        startDate:  events[events.length - 1].date,
        endDate:    new Date().toISOString(),
        monthsDiff: Math.round(monthsSinceLast),
        severity:   'medium',
        note:       'No recent history on record',
      });
    }
  }

  return gaps;
}
```

---

### 8e. LLM Workers

```typescript
// workers/llm-analyze.ts

import Anthropic from '@anthropic-ai/sdk';
import { getQueue } from '../src/lib/server/queue/index.js';
import { db } from '../src/lib/server/db/index.js';
import { reports, pipelineLog } from '../src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { Jobs } from '../src/lib/server/queue/job-names.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function registerLlmAnalyzeWorker() {
  const boss = await getQueue();

  boss.work(Jobs.LLM_ANALYZE, async (job) => {
    const { vin } = job.data as { vin: string };

    await db.insert(pipelineLog).values({ vin, stage: 'llm-analyze', status: 'started' });

    const report = await db.query.reports.findFirst({ where: eq(reports.vin, vin) });
    if (!report?.timeline) throw new Error(`No stitched timeline for ${vin}`);

    const timeline = report.timeline as any;

    const prompt = `
You are a vehicle history analyst. Analyze the following vehicle history data for VIN ${vin}.

Vehicle: ${timeline.identity?.year} ${timeline.identity?.make} ${timeline.identity?.model} ${timeline.identity?.trim ?? ''}

TIMELINE DATA:
${JSON.stringify(timeline, null, 2)}

Respond ONLY with a JSON object (no markdown) with this structure:
{
  "riskScore": <number 1-10, 10 being highest risk>,
  "verdict": "buy" | "caution" | "avoid",
  "verdictReasoning": "<2-3 sentences explaining the verdict>",
  "topFlags": [
    { "severity": "high" | "medium" | "low", "message": "<plain English flag>" }
  ],
  "gaps": [
    {
      "startDate": "<date>",
      "endDate": "<date>",
      "monthsDiff": <number>,
      "likelyExplanation": "<what might have happened>",
      "buyerConcernLevel": <1-10>,
      "concernReasoning": "<why this gap matters or doesn't>"
    }
  ],
  "odometerAssessment": "<plain English assessment of mileage history>",
  "titleAssessment": "<plain English assessment of title brands if any>"
}
    `.trim();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    let analysis: any = {};
    try {
      analysis = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      analysis = { raw: text, parseError: true };
    }

    await db.update(reports).set({
      llmFlags:   analysis,
      llmVerdict: analysis.verdict ?? null,
      updatedAt:  new Date(),
    }).where(eq(reports.vin, vin));

    await db.insert(pipelineLog).values({ vin, stage: 'llm-analyze', status: 'completed' });
    await boss.send(Jobs.LLM_WRITE_SECTIONS, { vin });
  });
}
```

---

```typescript
// workers/llm-write-sections.ts

import Anthropic from '@anthropic-ai/sdk';
import { getQueue } from '../src/lib/server/queue/index.js';
import { db } from '../src/lib/server/db/index.js';
import { reports, reportSections, pipelineLog } from '../src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { Jobs } from '../src/lib/server/queue/job-names.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Section definitions ───────────────────────────────────────────────────────
const SECTIONS = [
  {
    key: 'summary',
    prompt: (data: any) => `
Write a 3-sentence buyer summary for this ${data.year} ${data.make} ${data.model}.
Lead with the single most important thing a buyer needs to know.
Use plain English, no jargon. Be specific — use actual dates and numbers.
Data: ${JSON.stringify(data)}`,
  },
  {
    key: 'ownership_history',
    prompt: (data: any) => `
Explain this vehicle's ownership history in plain English.
Cover: how many owners, what states, how long each owner kept it, and whether the pattern is normal.
Flag anything unusual about the ownership chain.
Data: ${JSON.stringify(data.titleHistory)}`,
  },
  {
    key: 'accident_analysis',
    prompt: (data: any) => `
Explain any accident or damage records for this vehicle in plain English.
If there were accidents: describe the severity, what was damaged, and what it means for a buyer today.
Explain the difference between cosmetic and structural damage clearly.
If no accidents on record, explain what that means and its limitations.
Data: ${JSON.stringify(data.damageRecords)}`,
  },
  {
    key: 'odometer_analysis',
    prompt: (data: any) => `
Analyze the mileage history for this ${data.year} ${data.make} ${data.model}.
Expected mileage for a ${new Date().getFullYear() - data.year} year old car: ${(new Date().getFullYear() - data.year) * 12000} miles.
Flag any rollbacks or suspicious patterns.
Explain whether the mileage is high, low, or normal for this vehicle's age.
Data: ${JSON.stringify(data.odometerReadings)}`,
  },
  {
    key: 'title_history',
    prompt: (data: any) => `
Explain the title history for this vehicle in plain English.
If there are title brands (salvage, rebuilt, flood, lemon), explain exactly what each one means for:
1. Safety 2. Insurance 3. Resale value
If the title is clean, confirm that and explain what was checked.
Data: ${JSON.stringify({ titleHistory: data.titleHistory, titleBrands: data.titleBrands })}`,
  },
  {
    key: 'recall_status',
    prompt: (data: any) => `
Explain the recall history for this vehicle.
List any open recalls (not yet fixed) and what they mean for the driver.
List any closed recalls and confirm they were addressed.
If no recalls, confirm that clearly.
Data: ${JSON.stringify(data.recalls)}`,
  },
  {
    key: 'market_value',
    prompt: (data: any) => `
Based on this vehicle's condition and history, assess its market value.
Is the asking price fair, high, or a deal? Use the market data provided.
Mention any history items that should reduce the price (accidents, brands, high mileage).
Data: ${JSON.stringify(data.marketValue)}`,
  },
  {
    key: 'gap_analysis',
    prompt: (data: any) => `
This vehicle has the following unexplained periods in its history:
${JSON.stringify(data.gaps)}
For each gap, explain in plain English:
1. What might have happened during this period
2. How concerned a buyer should be (low / medium / high)
3. What questions to ask the seller about this period
If there are no gaps, confirm the history appears complete.`,
  },
  {
    key: 'buyers_checklist',
    prompt: (data: any) => `
Based on everything in this vehicle's history, create a specific checklist for a buyer inspecting this car.
Focus on things to physically check given this vehicle's specific history.
Maximum 8 items. Be specific, not generic.
Data: ${JSON.stringify(data)}`,
  },
];

export async function registerLlmWriteSectionsWorker() {
  const boss = await getQueue();

  boss.work(Jobs.LLM_WRITE_SECTIONS, async (job) => {
    const { vin } = job.data as { vin: string };

    await db.insert(pipelineLog).values({ vin, stage: 'llm-write-sections', status: 'started' });

    const report = await db.query.reports.findFirst({ where: eq(reports.vin, vin) });
    if (!report?.timeline) throw new Error(`No stitched timeline for ${vin}`);

    const data = {
      ...(report.timeline as any),
      year:  report.year,
      make:  report.make,
      model: report.model,
    };

    // Write all sections in parallel
    await Promise.all(SECTIONS.map(async (section) => {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: section.prompt(data),
        }],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';

      await db.insert(reportSections).values({
        vin,
        sectionKey: section.key,
        content,
        modelUsed: 'claude-sonnet-4-20250514',
      }).onConflictDoUpdate({
        target: [reportSections.vin, reportSections.sectionKey],
        set: { content, generatedAt: new Date() },
      });
    }));

    // Mark report as fully ready
    await db.update(reports).set({
      status:      'ready',
      completedAt: new Date(),
      updatedAt:   new Date(),
    }).where(eq(reports.vin, vin));

    await db.insert(pipelineLog).values({ vin, stage: 'llm-write-sections', status: 'completed' });
  });
}
```

---

## 9. Data Source Catalogue

| Source | Type | Cost | Data Provided | Priority |
|--------|------|------|---------------|----------|
| NHTSA VIN Decode | Free API | $0 | Vehicle identity, specs, manufacturer | **P1** |
| NHTSA Recalls | Free API | $0 | Safety recalls, open/closed status | **P1** |
| NMVTIS | Paid API | ~$0.05/VIN | Title history, odometer at transfer, brands | **P1** |
| NICB VINCheck | Free/API | $0 | Theft records, total loss history | **P1** |
| Copart | Scrape | $0 | Salvage history, damage photos, odometer | **P1** |
| IAAI | Scrape | $0 | Insurance auction history, condition photos | **P1** |
| AutoTrader | Scrape | $0 | Listing history, asking price, photos | **P2** |
| CarGurus | Scrape | $0 | Price rating, market average, days on market | **P2** |
| State Inspections | Varies | $0–$50/mo | Odometer at inspection, pass/fail | **P3** |
| Manheim | Partner | Negotiated | Dealer auction history, condition reports | **P3** |

---

## 10. Normalizer Schema Contract

Every normalizer must return an object conforming to this TypeScript interface. Add this to `src/lib/shared/types.ts`:

```typescript
// src/lib/shared/types.ts

export interface VehicleIdentity {
  year:             number | null;
  make:             string | null;
  model:            string | null;
  trim:             string | null;
  bodyStyle:        string | null;
  doors:            number | null;
  driveType:        string | null;
  fuelType:         string | null;
  engineCylinders:  number | null;
  engineDisplacement: string | null;
  transmission:     string | null;
  plantCity:        string | null;
  plantCountry:     string | null;
  series:           string | null;
}

export interface VehicleEvent {
  type:        string;   // 'title_transfer' | 'auction_sale' | 'accident' | 'recall' | 'inspection' | 'listing' | 'theft' | 'title_brand'
  date:        string;   // ISO date string
  source:      string;
  description: string;   // Human readable — this gets passed to LLM
  state?:      string;
  data:        Record<string, any>; // Full raw data for this event
}

export interface OdometerReading {
  date:        string;
  mileage:     number;
  source:      'title_transfer' | 'state_inspection' | 'auction' | 'service_record' | 'listing';
  reportedBy?: string;
  isAnomaly?:  boolean;
  anomalyNote?: string;
}

export interface HistoryGap {
  startDate:   string;
  endDate:     string;
  monthsDiff:  number;
  severity:    'low' | 'medium' | 'high';
  note?:       string;
}

export interface NormalizedVehicleRecord {
  source:           string;
  identity?:        VehicleIdentity;
  recalls?:         any[];
  titleHistory?:    any[];
  titleBrands?:     string[];
  damageRecords?:   any[];
  odometerReadings?: OdometerReading[];
  marketValue?:     any;
  events:           VehicleEvent[];
}
```

---

## 11. Report Sections & LLM Prompts

The 9 sections written by the LLM worker are detailed in Section 8e. The section keys map directly to UI components on the report page:

| Section Key | UI Component | Display |
|-------------|-------------|---------|
| `summary` | Hero summary card at top of report | Always shown |
| `ownership_history` | Timeline component | Always shown |
| `accident_analysis` | Accident section with severity indicator | Always shown |
| `odometer_analysis` | Odometer graph + text analysis | Always shown |
| `title_history` | Title brand badges + explanation | Always shown |
| `recall_status` | Recall list with open/closed status | Always shown |
| `market_value` | Price assessment card | Shown if listing data found |
| `gap_analysis` | Gap flags with concern ratings | Shown only if gaps detected |
| `buyers_checklist` | Checklist component | Always shown |

---

## 12. Odometer Graph Data Pipeline

The odometer readings table feeds directly into a graph component. The API endpoint for graph data:

```typescript
// src/routes/api/report/[vin]/odometer/+server.ts

import { db } from '$lib/server/db/index.js';
import { odometerReadings } from '$lib/server/db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

export async function GET({ params }) {
  const readings = await db.query.odometerReadings.findMany({
    where: eq(odometerReadings.vin, params.vin),
    orderBy: [asc(odometerReadings.readingDate)],
  });

  // Format for charting library (x = date, y = mileage)
  const chartData = readings.map(r => ({
    date:        r.readingDate.toISOString().split('T')[0],
    mileage:     r.mileage,
    source:      r.source,
    reportedBy:  r.reportedBy,
    isAnomaly:   r.isAnomaly,
    anomalyNote: r.anomalyNote,
  }));

  // Expected mileage line (for reference overlay)
  if (readings.length >= 2) {
    const firstDate = readings[0].readingDate;
    const today = new Date();
    const yearsOfData = (today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const expectedEndMileage = readings[0].mileage + (yearsOfData * 12000);

    return json({
      readings: chartData,
      expectedLine: {
        start: { date: firstDate.toISOString().split('T')[0], mileage: readings[0].mileage },
        end:   { date: today.toISOString().split('T')[0], mileage: Math.round(expectedEndMileage) },
      },
      anomalies: chartData.filter(r => r.isAnomaly),
    });
  }

  return json({ readings: chartData, expectedLine: null, anomalies: [] });
}
```

---

## 13. Photo Aggregation Pipeline

Photos are stored in the `vehicle_photos` table as URLs. The report page fetches them grouped by source and date.

```typescript
// src/routes/api/report/[vin]/photos/+server.ts

import { db } from '$lib/server/db/index.js';
import { vehiclePhotos } from '$lib/server/db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

export async function GET({ params }) {
  const photos = await db.query.vehiclePhotos.findMany({
    where: eq(vehiclePhotos.vin, params.vin),
    orderBy: [asc(vehiclePhotos.capturedAt)],
  });

  // Group by source for UI display
  const grouped = photos.reduce((acc: any, photo) => {
    const key = photo.source;
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      url:          photo.url,
      capturedAt:   photo.capturedAt,
      photoType:    photo.photoType,
      auctionLotId: photo.auctionLotId,
    });
    return acc;
  }, {});

  return json({
    total: photos.length,
    bySource: grouped,
    // Most recent photos first for hero display
    latest: photos.slice(-6).reverse(),
  });
}
```

---

## 14. Gap Detection Logic

Gap detection runs in two places:

1. **Stitcher worker** — structural gap detection based on event dates (implemented in Section 8d)
2. **LLM analyzer** — contextual interpretation of gaps (implemented in Section 8e)

The LLM enriches each gap with:
- A likely explanation (storage, private sale, off-road use, etc.)
- A buyer concern level (1–10)
- Specific questions the buyer should ask the seller

---

## 15. SvelteKit API Routes

```typescript
// src/routes/api/report/+server.ts
// POST: Trigger a new report
// GET: Get completed report by VIN (?vin=xxx)

import { db } from '$lib/server/db/index.js';
import { reports } from '$lib/server/db/schema.js';
import { getQueue } from '$lib/server/queue/index.js';
import { Jobs } from '$lib/server/queue/job-names.js';
import { eq } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';

export async function POST({ request }) {
  const { vin } = await request.json();

  if (!vin || vin.length !== 17) {
    throw error(400, 'Invalid VIN — must be 17 characters');
  }

  // Create report record
  await db.insert(reports).values({ vin, status: 'pending' })
    .onConflictDoUpdate({ target: reports.vin, set: { status: 'pending', updatedAt: new Date() } });

  const boss = await getQueue();

  // Dispatch all fetch + scrape jobs in parallel
  await Promise.all([
    boss.send(Jobs.FETCH_NHTSA_DECODE,   { vin }),
    boss.send(Jobs.FETCH_NHTSA_RECALLS,  { vin }),
    boss.send(Jobs.FETCH_NMVTIS,         { vin }),
    boss.send(Jobs.FETCH_NICB,           { vin }),
    boss.send(Jobs.SCRAPE_COPART,        { vin }),
    boss.send(Jobs.SCRAPE_IAAI,          { vin }),
    boss.send(Jobs.SCRAPE_AUTOTRADER,    { vin }),
    boss.send(Jobs.SCRAPE_CARGURUS,      { vin }),
  ]);

  await db.update(reports).set({ status: 'fetching' }).where(eq(reports.vin, vin));

  return json({ status: 'processing', vin, message: 'Report generation started' });
}

export async function GET({ url }) {
  const vin = url.searchParams.get('vin');
  if (!vin) throw error(400, 'VIN required');

  const report = await db.query.reports.findFirst({ where: eq(reports.vin, vin) });
  if (!report) throw error(404, 'Report not found');

  return json(report);
}
```

```typescript
// src/routes/api/status/[vin]/+server.ts
// Returns real-time pipeline progress

import { db } from '$lib/server/db/index.js';
import { pipelineLog, reports } from '$lib/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

export async function GET({ params }) {
  const { vin } = params;

  const report = await db.query.reports.findFirst({ where: eq(reports.vin, vin) });
  const logs = await db.query.pipelineLog.findMany({
    where: eq(pipelineLog.vin, vin),
    orderBy: [desc(pipelineLog.timestamp)],
    limit: 50,
  });

  const stages = logs.reduce((acc: any, log) => {
    if (!acc[log.stage]) acc[log.stage] = log.status;
    return acc;
  }, {});

  return json({
    vin,
    overallStatus: report?.status ?? 'unknown',
    stages,
    logs: logs.slice(0, 20),
  });
}
```

---

## 16. Worker Process Bootstrap

```typescript
// workers/index.ts
// This file is the entry point for the worker process (runs separately from SvelteKit)

import { registerFetchNhtsaDecode }    from './fetchers/fetch-nhtsa-decode.js';
import { registerFetchNhtsaRecalls }   from './fetchers/fetch-nhtsa-recalls.js';
import { registerFetchNmvtis }         from './fetchers/fetch-nmvtis.js';
import { registerFetchNicb }           from './fetchers/fetch-nicb.js';
import { registerScrapeCopart }        from './scrapers/scrape-copart.js';
import { registerScrapeIaai }          from './scrapers/scrape-iaai.js';
import { registerScrapeAutotrader }    from './scrapers/scrape-autotrader.js';
import { registerScrapeCarGurus }      from './scrapers/scrape-cargurus.js';
import { registerNormalizeWorker }     from './normalizers/index.js';
import { registerStitchWorker }        from './stitch-report.js';
import { registerLlmAnalyzeWorker }    from './llm-analyze.js';
import { registerLlmWriteSectionsWorker } from './llm-write-sections.js';

async function main() {
  console.log('[Workers] Starting worker process...');

  await registerFetchNhtsaDecode();
  await registerFetchNhtsaRecalls();
  await registerFetchNmvtis();
  await registerFetchNicb();
  await registerScrapeCopart();
  await registerScrapeIaai();
  await registerScrapeAutotrader();
  await registerScrapeCarGurus();
  await registerNormalizeWorker();
  await registerStitchWorker();
  await registerLlmAnalyzeWorker();
  await registerLlmWriteSectionsWorker();

  console.log('[Workers] All workers registered and listening');
}

main().catch((err) => {
  console.error('[Workers] Fatal error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Workers] Shutting down gracefully...');
  process.exit(0);
});
```

---

## 17. Environment Variables

Add the following to `.env` and Railway environment settings:

```env
# Database (already set on Railway)
DATABASE_URL=postgresql://...

# Anthropic LLM
ANTHROPIC_API_KEY=sk-ant-...

# NMVTIS Provider (sign up at vehiclehistory.gov)
NMVTIS_API_URL=https://api.your-nmvtis-provider.com
NMVTIS_API_KEY=...

# Optional: NICB API key if using registered access
NICB_API_KEY=...

# Node environment
NODE_ENV=production

# Worker concurrency settings
WORKER_SCRAPER_CONCURRENCY=2
WORKER_FETCHER_CONCURRENCY=5
```

---

## 18. Railway Deployment Config

Railway currently runs the SvelteKit app and PostgreSQL in the same service. The worker process should be added as a **separate Railway service** pointing to the same repo but running a different start command. This prevents scraping/LLM workloads from blocking web server responses.

```toml
# railway.toml

[build]
builder = "nixpacks"

[[services]]
name = "web"
startCommand = "node build"
buildCommand = "npm run build"

[[services]]
name = "workers"
startCommand = "npm run workers:prod"
buildCommand = "npm run build"
```

Or if staying in a single service for simplicity (acceptable for early stage):

```toml
# railway.toml (single service, workers start via hooks.server.ts)

[build]
builder = "nixpacks"
buildCommand = "npm run build && npm run db:migrate"

[deploy]
startCommand = "node build"
```

In `src/hooks.server.ts` for single-service approach:

```typescript
import { startWorkers } from '$lib/server/workers-bootstrap.js';

export async function handle({ event, resolve }) {
  return resolve(event);
}

// Start workers when server boots (single-service approach)
if (process.env.NODE_ENV === 'production' || process.env.RUN_WORKERS === 'true') {
  startWorkers().catch(console.error);
}
```

---

## 19. Error Handling & Resilience

Every worker must implement the following patterns:

### Retry Logic
pg-boss handles retries automatically (`retryLimit: 3, retryBackoff: true`). Workers should `throw` errors to trigger retries rather than swallowing them.

### Raw HTML Snapshots
All scraper workers store the raw HTML alongside parsed data. This means if a site changes its layout, you can re-parse old snapshots without re-fetching.

```typescript
// Re-parse from snapshot without scraping
async function reparseFromSnapshot(vin: string, source: string) {
  const raw = await db.query.rawData.findFirst({ where: and(eq(rawData.vin, vin), eq(rawData.source, source)) });
  if (raw?.rawHtml) {
    // re-run cheerio/evaluate against raw.rawHtml
  }
}
```

### Partial Reports
If optional sources (AutoTrader, CarGurus) fail after 3 retries, the pipeline should still proceed to stitching with whatever data is available. Only `REQUIRED_SOURCES` block stitching.

### Scraper Resilience
Wrap all `page.evaluate()` calls in try/catch. If a selector doesn't exist, return null rather than throwing:

```typescript
const price = await page.$eval('[class*="price"]', el => el.textContent).catch(() => null);
```

### Dead Letter Queue
Configure pg-boss to capture permanently failed jobs:

```typescript
boss.work('*', { includeMetadata: true }, async (job) => {
  // This catches any unhandled job types
  console.error('[DLQ] Unhandled job:', job.name, job.data);
});
```

---

## 20. Build Order & Milestones

### Phase 1 — Foundation (Week 1)
- [ ] Install new dependencies
- [ ] Restructure folder layout per Section 4
- [ ] Add new DB schema tables and run migrations
- [ ] Set up pg-boss queue
- [ ] Wrap existing NHTSA logic in fetch-nhtsa-decode worker
- [ ] Wire up stitch worker (single source)
- [ ] Test full pipeline with one VIN end-to-end

### Phase 2 — Core Data Sources (Week 2)
- [ ] Add NHTSA recalls fetcher
- [ ] Add NICB fetcher (free, no signup needed)
- [ ] Add Copart scraper with photo extraction
- [ ] Add IAAI scraper with photo extraction
- [ ] Wire up all normalizers
- [ ] Build odometer readings storage + graph API endpoint
- [ ] Test 5 VINs with varying histories

### Phase 3 — LLM Pipeline (Week 3)
- [ ] Add llm-analyze worker
- [ ] Add llm-write-sections worker (all 9 sections)
- [ ] Build gap detection in stitcher
- [ ] Connect LLM gap analysis
- [ ] Build status polling API endpoint
- [ ] Test report quality on 10 VINs

### Phase 4 — Enrichment (Week 4)
- [ ] Add AutoTrader scraper
- [ ] Add CarGurus scraper
- [ ] Add market value section to LLM
- [ ] Set up NMVTIS paid API access
- [ ] Build report page UI with all sections
- [ ] Build odometer graph component
- [ ] Build photo gallery component

### Phase 5 — Production Hardening (Month 2)
- [ ] Add separate Railway worker service
- [ ] Add dead letter queue monitoring
- [ ] Add report caching (skip re-fetch if report < 30 days old)
- [ ] Add docx export for full report (use existing docx module)
- [ ] Load test with 50 concurrent VIN requests
- [ ] Add Texas + Florida state inspection APIs

---

*End of dev plan. All code blocks are production-ready starting points. Normalizers for NICB, AutoTrader, and CarGurus follow the same pattern as the NHTSA and Copart normalizers — map raw fields to the NormalizedVehicleRecord interface defined in Section 10.*
