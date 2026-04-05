# Design Document: Vehicle History Platform Rebuild

## Overview

This design transforms the vehicle history platform from a synchronous monolithic system into a modern worker-based pipeline architecture. The system generates comprehensive vehicle history reports comparable to Carfax, featuring LLM-written sections, gap detection, odometer anomaly analysis, and photo aggregation from multiple data sources.

The platform consists of two primary components:
1. **SvelteKit Web Application**: Serves HTTP requests, manages report requests, and returns completed reports
2. **Worker Process**: Executes background jobs for data fetching, scraping, normalization, stitching, and LLM analysis

Both components share a PostgreSQL database on Railway and communicate exclusively through a pg-boss job queue.

### Key Differentiators

- **LLM-Written Sections**: Every report section is explained in plain English by Claude, not raw data dumps
- **Gap Detection**: System actively identifies and flags missing history windows (18+ months)
- **Odometer Graph**: Visual mileage timeline plotted from all sources with anomaly detection
- **Photo Aggregation**: Condition photos pulled from auction and listing history
- **Modular Pipeline**: Adding a new data source requires only one fetcher + one normalizer

### Technology Stack

- **Frontend/Backend**: SvelteKit (fullstack)
- **Database**: PostgreSQL on Railway with Drizzle ORM
- **Queue**: pg-boss (PostgreSQL-backed job queue)
- **Scraping**: Puppeteer with stealth plugin
- **LLM**: Claude (Anthropic) via @anthropic-ai/sdk
- **Deployment**: Railway (two services: web app + worker process)

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          RAILWAY DEPLOYMENT                         │
│                                                                     │
│  ┌──────────────────────┐         ┌────────────────────────────┐   │
│  │   SvelteKit App      │         │   Worker Process           │   │
│  │   (web server)       │         │   (workers/index.ts)       │   │
│  │                      │         │                            │   │
│  │  POST /api/report ───┼──jobs──▶│  Fetcher Workers (4)       │   │
│  │  GET  /api/report ◀──┼──read───│  Scraper Workers (4)       │   │
│  │  GET  /api/status ◀──┼──read───│  Normalizer Worker         │   │
│  │  GET  /api/odometer ◀┼──read───│  Stitcher Worker           │   │
│  │  GET  /api/photos  ◀─┼──read───│  LLM Workers (2)           │   │
│  │  GET  /api/sections ◀┼──read───│                            │   │
│  └──────────────────────┘         └────────────┬───────────────┘   │
│             │                                  │                   │
│             ▼                                  ▼                   │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │              PostgreSQL (Railway)                         │     │
│  │  • pg-boss jobs table                                     │     │
│  │  • reports                                                │     │
│  │  • raw_data                                               │     │
│  │  • normalized_data                                        │     │
│  │  • odometer_readings                                      │     │
│  │  • vehicle_photos                                         │     │
│  │  • report_sections                                        │     │
│  │  • pipeline_log                                           │     │
│  └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Separation

**Web Application Responsibilities:**
- Accept report generation requests via POST /api/report
- Enqueue jobs for all data sources (fetchers and scrapers)
- Return completed reports via GET /api/report
- Provide pipeline status via GET /api/status/:vin
- Serve odometer graph data via GET /api/report/:vin/odometer
- Serve photo aggregation via GET /api/report/:vin/photos
- Serve LLM sections via GET /api/report/:vin/sections
- Generate DOCX exports via GET /api/export/:vin

**Worker Process Responsibilities:**
- Execute all data fetching from APIs (NHTSA, NMVTIS, NICB)
- Execute all web scraping (Copart, IAAI, AutoTrader, CarGurus)
- Normalize all raw data into unified schema
- Stitch normalized data into chronological timeline
- Detect odometer anomalies and history gaps
- Analyze timeline with Claude LLM
- Write 9 report sections with Claude LLM

**Key Principle**: The web app never directly calls external APIs or scrapers. All heavy lifting is done by workers. The web app only reads completed data from the database.

### Data Flow

1. **Request Phase**: User submits VIN → Web app creates report record → Web app enqueues 8 jobs (4 fetchers + 4 scrapers)
2. **Fetch Phase**: Workers fetch data from APIs and scrape websites → Store raw data in database
3. **Normalize Phase**: Workers transform raw data into unified schema → Store normalized data
4. **Stitch Phase**: Worker merges all normalized data → Creates chronological timeline → Detects gaps and anomalies
5. **Analyze Phase**: LLM worker analyzes timeline → Generates risk score, verdict, and flags
6. **Write Phase**: LLM worker writes 9 report sections in plain English
7. **Complete Phase**: Report status set to "ready" → User retrieves via GET /api/report

## Components and Interfaces

### Web Application Components

#### API Routes

**POST /api/report**
- Input: `{ vin: string }`
- Validation: VIN must be 17 characters, alphanumeric, no I/O/Q
- Creates report record with status "pending"
- Enqueues jobs for all required and optional sources
- Returns: `{ status: "processing", vin: string }`

**GET /api/report?vin={vin}**
- Input: VIN as query parameter
- Returns complete report including timeline and LLM analysis
- Returns partial report if status is not "ready"
- Returns: `{ status, vin, timeline, llmFlags, llmVerdict, completedAt, ... }`

**GET /api/status/:vin**
- Returns overall report status and per-stage completion
- Returns 20 most recent pipeline log entries
- Returns: `{ status, stages: [], logs: [] }`

**GET /api/report/:vin/odometer**
- Returns odometer readings sorted by date
- Includes anomaly flags and expected mileage line
- Returns: `{ readings: [], expectedMileage: [] }`

**GET /api/report/:vin/photos**
- Returns photos grouped by source, sorted by capture date
- Returns: `{ photos: [], recentPhotos: [] }`

**GET /api/report/:vin/sections**
- Returns all LLM-written sections
- Returns: `{ sections: [{ key, content, generatedAt, modelUsed }] }`

**GET /api/export/:vin**
- Generates DOCX export with all sections, odometer graph, and photos
- Returns DOCX file with Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document

#### Queue Client

Located in `src/lib/server/queue/index.ts`:
- Singleton pg-boss instance
- Configuration: 3 retries, exponential backoff, 10-minute expiration
- Job retention: 3 days for completed, 7 days for failed
- Error event logging

#### Database Client

Located in `src/lib/server/db/index.ts`:
- Drizzle ORM client with connection pooling
- Max 20 concurrent connections
- 30-second connection timeout
- Schema defined in `src/lib/server/db/schema.ts`

### Worker Process Components

#### Worker Bootstrap

Located in `workers/index.ts`:
- Registers all 13 workers on startup
- Logs successful registration of each worker
- Exits with error code 1 if registration fails
- Logs heartbeat every 60 seconds with active job count

#### Fetcher Workers (4)

**fetch-nhtsa-decode** (`workers/fetchers/fetch-nhtsa-decode.ts`)
- Calls NHTSA VIN decode API
- Stores raw JSON response in raw_data table
- Enqueues normalization job on success
- Retries on HTTP 503 with 1-second delay

**fetch-nhtsa-recalls** (`workers/fetchers/fetch-nhtsa-recalls.ts`)
- Calls NHTSA recalls API
- Stores raw JSON response in raw_data table
- Enqueues normalization job on success

**fetch-nmvtis** (`workers/fetchers/fetch-nmvtis.ts`)
- Calls NMVTIS provider API with authentication
- Stores raw JSON response in raw_data table
- Enqueues normalization job on success
- Cost: ~$0.05 per VIN query

**fetch-nicb** (`workers/fetchers/fetch-nicb.ts`)
- Calls NICB VINCheck API
- Stores raw JSON response in raw_data table
- Enqueues normalization job on success
- Uses User-Agent header to avoid bot detection

#### Scraper Workers (4)

All scrapers use puppeteer-extra with stealth plugin, headless mode, and realistic User-Agent headers.

**scrape-copart** (`workers/scrapers/scrape-copart.ts`)
- Searches Copart by VIN
- Extracts: lot number, sale date, odometer, damage description, images
- Stores raw HTML snapshot for re-parsing
- Stores images in vehicle_photos table
- teamSize: 2, teamConcurrency: 1 (rate limiting)

**scrape-iaai** (`workers/scrapers/scrape-iaai.ts`)
- Searches IAAI by VIN
- Extracts: stock number, sale date, mileage, damage type, images
- Stores raw HTML snapshot for re-parsing
- Stores images in vehicle_photos table
- teamSize: 2, teamConcurrency: 1 (rate limiting)

**scrape-autotrader** (`workers/scrapers/scrape-autotrader.ts`)
- Searches AutoTrader by VIN
- Extracts: price, mileage, dealer, location, listing images
- Stores raw HTML snapshot for re-parsing
- Stores images in vehicle_photos table
- Optional source (does not block stitching)

**scrape-cargurus** (`workers/scrapers/scrape-cargurus.ts`)
- Searches CarGurus by VIN
- Extracts: price, price rating, market average, days on market
- Stores raw HTML snapshot for re-parsing
- Optional source (does not block stitching)

#### Normalizer Worker

Located in `workers/normalizers/index.ts` with source-specific normalizers:
- `normalize-nhtsa.ts`: Wraps existing NHTSA mapper logic
- `normalize-nmvtis.ts`: Extracts title history and brands
- `normalize-nicb.ts`: Extracts theft records
- `normalize-copart.ts`: Extracts auction events and odometer readings
- `normalize-iaai.ts`: Extracts auction events and odometer readings
- `normalize-autotrader.ts`: Extracts listing events and market value
- `normalize-cargurus.ts`: Extracts market value data

**Normalizer Registry Pattern**:
```typescript
const normalizers = {
  'nhtsa_decode': normalizeNhtsa,
  'nhtsa_recalls': normalizeNhtsaRecalls,
  'nmvtis': normalizeNmvtis,
  'nicb': normalizeNicb,
  'copart': normalizeCopart,
  'iaai': normalizeIaai,
  'autotrader': normalizeAutotrader,
  'cargurus': normalizeCargurus,
};
```

After normalization completes, worker checks if all required sources are complete. If yes, enqueues stitching job.

#### Stitcher Worker

Located in `workers/stitch-report.ts`:
- Waits for all required sources: NHTSA decode, NHTSA recalls, NMVTIS, NICB, Copart, IAAI
- Merges all normalized data into chronological timeline
- Uses NHTSA decode as authoritative source for vehicle identity
- Merges odometer readings from all sources into sorted list
- Detects odometer anomalies (rollbacks, unusual rates)
- Detects history gaps (18+ months between events)
- Stores complete timeline in reports table
- Updates report status to "analyzing"
- Enqueues LLM analysis job

#### LLM Workers (2)

**llm-analyze** (`workers/llm-analyze.ts`)
- Analyzes complete timeline using Claude
- Generates risk score (1-10)
- Generates verdict (buy/caution/avoid) with reasoning
- Identifies top flags with severity levels
- Analyzes each gap with explanation and concern level
- Provides odometer assessment
- Provides title assessment
- Stores analysis in reports table
- Updates report status to "analyzing"
- Enqueues section writing job

**llm-write-sections** (`workers/llm-write-sections.ts`)
- Writes 9 report sections using Claude:
  1. Summary (3 sentences, most important finding first)
  2. Ownership History (owner count and patterns)
  3. Accident Analysis (damage severity and implications)
  4. Odometer Analysis (actual vs expected mileage)
  5. Title History (title brands explained)
  6. Recall Status (open and closed recalls)
  7. Market Value (asking price fairness)
  8. Gap Analysis (each unexplained period)
  9. Buyers Checklist (8 specific inspection items)
- Stores each section in report_sections table
- Uses claude-sonnet-4-20250514 model
- Updates report status to "ready" when complete

### Shared Types and Utilities

#### VIN Validation

Located in `src/lib/shared/vin-utils.ts`:
```typescript
function validateVIN(vin: string): { valid: boolean; error?: string } {
  if (vin.length !== 17) return { valid: false, error: 'VIN must be 17 characters' };
  if (!/^[A-HJ-NPR-Z0-9]+$/.test(vin)) return { valid: false, error: 'VIN contains invalid characters' };
  return { valid: true };
}
```

#### Job Names

Located in `src/lib/server/queue/job-names.ts`:
```typescript
export const Jobs = {
  FETCH_NHTSA_DECODE: 'fetch-nhtsa-decode',
  FETCH_NHTSA_RECALLS: 'fetch-nhtsa-recalls',
  FETCH_NMVTIS: 'fetch-nmvtis',
  FETCH_NICB: 'fetch-nicb',
  SCRAPE_COPART: 'scrape-copart',
  SCRAPE_IAAI: 'scrape-iaai',
  SCRAPE_AUTOTRADER: 'scrape-autotrader',
  SCRAPE_CARGURUS: 'scrape-cargurus',
  NORMALIZE: 'normalize',
  STITCH_REPORT: 'stitch-report',
  LLM_ANALYZE: 'llm-analyze',
  LLM_WRITE_SECTIONS: 'llm-write-sections',
} as const;

export const REQUIRED_SOURCES = [
  'nhtsa_decode',
  'nhtsa_recalls',
  'nmvtis',
  'nicb',
  'copart',
  'iaai',
] as const;

export const OPTIONAL_SOURCES = [
  'autotrader',
  'cargurus',
] as const;
```

## Data Models

### Database Schema

#### Enums

```typescript
reportStatusEnum: 'pending' | 'fetching' | 'normalizing' | 'stitching' | 'analyzing' | 'ready' | 'failed'

dataSourceEnum: 'nhtsa_decode' | 'nhtsa_recalls' | 'nmvtis' | 'nicb' | 'copart' | 'iaai' | 'autotrader' | 'cargurus'

odometerSourceEnum: 'title_transfer' | 'state_inspection' | 'auction' | 'service_record' | 'listing'

eventTypeEnum: 'title_transfer' | 'auction_sale' | 'accident' | 'recall' | 'inspection' | 'listing' | 'theft' | 'title_brand'
```

#### reports Table

```typescript
{
  id: serial (primary key)
  vin: text (unique, not null)
  status: reportStatusEnum (default 'pending')
  createdAt: timestamp (default now)
  updatedAt: timestamp (default now)
  completedAt: timestamp (nullable)
  errorMessage: text (nullable)
  
  // Vehicle identity (from NHTSA decode)
  year: integer
  make: text
  model: text
  trim: text
  bodyStyle: text
  engineDescription: text
  driveType: text
  fuelType: text
  
  // Stitched timeline (complete merged JSON)
  timeline: jsonb
  
  // LLM-generated analysis
  llmFlags: jsonb  // { gaps, anomalies, riskScore }
  llmVerdict: text  // buy/caution/avoid + reasoning
}
```

#### raw_data Table

```typescript
{
  id: serial (primary key)
  vin: text (not null)
  source: dataSourceEnum (not null)
  fetchedAt: timestamp (default now)
  rawJson: jsonb (not null)
  rawHtml: text (nullable)  // HTML snapshot for re-parsing
  success: boolean (default true)
  errorMessage: text (nullable)
  
  // Unique constraint on (vin, source)
}
```

#### normalized_data Table

```typescript
{
  id: serial (primary key)
  vin: text (not null)
  source: dataSourceEnum (not null)
  normalizedAt: timestamp (default now)
  data: jsonb (not null)  // conforms to NormalizedVehicleRecord
  
  // Unique constraint on (vin, source)
}
```

#### odometer_readings Table

```typescript
{
  id: serial (primary key)
  vin: text (not null, indexed)
  readingDate: timestamp (not null)
  mileage: integer (not null)
  source: odometerSourceEnum (not null)
  reportedBy: text (nullable)  // e.g. "Texas DMV", "Copart Dallas"
  isAnomaly: boolean (default false)
  anomalyNote: text (nullable)  // e.g. "possible rollback", "unusual rate"
}
```

#### vehicle_photos Table

```typescript
{
  id: serial (primary key)
  vin: text (not null, indexed)
  url: text (not null)
  source: text (not null)  // 'copart', 'iaai', 'autotrader', 'cargurus'
  capturedAt: timestamp (nullable)  // date of auction/listing
  scrapedAt: timestamp (default now)
  photoType: text (nullable)  // 'exterior_front', 'damage', 'interior'
  auctionLotId: text (nullable)
}
```

#### report_sections Table

```typescript
{
  id: serial (primary key)
  vin: text (not null)
  sectionKey: text (not null)  // 'summary', 'accident_analysis', etc.
  content: text (not null)  // plain English LLM output
  generatedAt: timestamp (default now)
  modelUsed: text (nullable)  // 'claude-sonnet-4-20250514'
  
  // Unique constraint on (vin, sectionKey)
}
```

#### pipeline_log Table

```typescript
{
  id: serial (primary key)
  vin: text (not null, indexed)
  stage: text (not null)  // 'fetch-nhtsa', 'normalize-copart', etc.
  status: text (not null)  // 'started', 'completed', 'failed'
  message: text (nullable)
  timestamp: timestamp (default now)
}
```

### Normalized Data Schema

All normalizers transform raw data into this unified structure:

```typescript
interface NormalizedVehicleRecord {
  vin: string;
  source: string;
  
  // Vehicle identity (optional, only from NHTSA)
  identity?: {
    year: number;
    make: string;
    model: string;
    trim?: string;
    bodyStyle?: string;
    engineDescription?: string;
    driveType?: string;
    fuelType?: string;
  };
  
  // Events (chronological occurrences)
  events: Array<{
    type: 'title_transfer' | 'auction_sale' | 'accident' | 'recall' | 'inspection' | 'listing' | 'theft' | 'title_brand';
    date: string;  // ISO 8601
    description: string;  // plain English
    location?: string;
    details: Record<string, any>;  // source-specific data
  }>;
  
  // Odometer readings
  odometerReadings: Array<{
    date: string;  // ISO 8601
    mileage: number;
    source: 'title_transfer' | 'state_inspection' | 'auction' | 'service_record' | 'listing';
    reportedBy?: string;
  }>;
  
  // Title brands
  titleBrands: Array<{
    brand: 'salvage' | 'rebuilt' | 'flood' | 'hail' | 'lemon' | 'other';
    date: string;
    state: string;
    description?: string;
  }>;
  
  // Recalls (only from NHTSA)
  recalls?: Array<{
    component: string;
    summary: string;
    consequence: string;
    remedy: string;
    reportReceivedDate: string;
    nhtsaCampaignNumber: string;
  }>;
  
  // Market value (only from AutoTrader/CarGurus)
  marketValue?: {
    askingPrice?: number;
    priceRating?: string;
    marketAverage?: number;
    daysOnMarket?: number;
    currency: string;
  };
  
  // Damage records (only from Copart/IAAI)
  damageRecords?: Array<{
    date: string;
    primaryDamage: string;
    secondaryDamage?: string;
    titleCode?: string;
    location: string;
  }>;
}
```

### Timeline JSON Structure

After stitching, the complete timeline is stored in the reports table:

```typescript
interface Timeline {
  identity: {
    year: number;
    make: string;
    model: string;
    trim?: string;
    bodyStyle?: string;
    engineDescription?: string;
    driveType?: string;
    fuelType?: string;
  };
  
  titleHistory: Array<{
    date: string;
    state: string;
    titleNumber?: string;
    transferType: 'sale' | 'inheritance' | 'gift' | 'other';
  }>;
  
  titleBrands: Array<{
    brand: string;
    date: string;
    state: string;
    description?: string;
  }>;
  
  recalls: Array<{
    component: string;
    summary: string;
    consequence: string;
    remedy: string;
    reportReceivedDate: string;
    nhtsaCampaignNumber: string;
  }>;
  
  damageRecords: Array<{
    date: string;
    primaryDamage: string;
    secondaryDamage?: string;
    titleCode?: string;
    location: string;
  }>;
  
  odometerReadings: Array<{
    date: string;
    mileage: number;
    source: string;
    reportedBy?: string;
    isAnomaly: boolean;
    anomalyNote?: string;
  }>;
  
  marketValue: {
    askingPrice?: number;
    priceRating?: string;
    marketAverage?: number;
    daysOnMarket?: number;
    currency: string;
  };
  
  events: Array<{
    type: string;
    date: string;
    description: string;
    location?: string;
    details: Record<string, any>;
  }>;
  
  gaps: Array<{
    startDate: string;
    endDate: string;
    durationMonths: number;
    severity: 'medium' | 'high';
  }>;
  
  sourcesCovered: string[];
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Report Read Idempotence

*For any* completed report, reading it multiple times should not change its status, trigger new jobs, or modify any data.

**Validates: Requirements 1.4**

### Property 2: Job Retry Limit

*For any* failed job, the queue should retry it exactly 3 times with exponentially increasing delays before marking it as permanently failed.

**Validates: Requirements 2.1, 23.2**

### Property 3: Job Expiration

*For any* job that remains in pending state, it should be expired and removed from the queue after 10 minutes without starting.

**Validates: Requirements 2.2, 48.1**

### Property 4: Job Retention

*For any* completed job, it should remain queryable in the queue for exactly 3 days, then be automatically deleted.

**Validates: Requirements 2.3, 49.1, 49.2**

### Property 5: VIN-Source Uniqueness

*For any* VIN and source combination, attempting to insert duplicate raw_data or normalized_data should either fail or update the existing record, never creating duplicates.

**Validates: Requirements 3.8**

### Property 6: Normalization Triggers Stitching

*For any* VIN where all required sources have been normalized, the system should automatically enqueue a stitching job exactly once.

**Validates: Requirements 11.7, 11.8**

### Property 7: Chronological Event Ordering

*For any* set of events from multiple sources, the stitched timeline should contain all events sorted by date in ascending order.

**Validates: Requirements 12.1, 38.1**

### Property 8: Stable Sort for Same-Date Events

*For any* set of events with identical dates, sorting the timeline multiple times should produce the same order (stable sort).

**Validates: Requirements 38.2**

### Property 9: Odometer Rollback Detection

*For any* sequence of odometer readings where mileage decreases between consecutive readings, the system should flag the later reading as an anomaly with note "possible rollback".

**Validates: Requirements 13.1, 13.2**

### Property 10: Excessive Mileage Rate Detection

*For any* pair of consecutive odometer readings where mileage increases at a rate exceeding 50,000 miles per year, the system should flag the later reading as an anomaly.

**Validates: Requirements 13.3**

### Property 11: Gap Detection

*For any* timeline with events, all gaps of 18 or more months between consecutive events should be detected and included in the gaps array.

**Validates: Requirements 14.1**

### Property 12: Gap Severity Classification

*For any* detected gap, if duration exceeds 36 months it should be classified as "high" severity, otherwise "medium" severity.

**Validates: Requirements 14.2**

### Property 13: Risk Score Range

*For any* LLM analysis result, the risk score should be an integer between 1 and 10 inclusive.

**Validates: Requirements 15.2**

### Property 14: Report Section Completeness

*For any* completed report, exactly 9 sections should be written and stored in the report_sections table.

**Validates: Requirements 16.1**

### Property 15: VIN Length Validation

*For any* VIN submitted to the API, if its length is not exactly 17 characters, the system should return HTTP 400 error.

**Validates: Requirements 19.2, 55.1**

### Property 16: Invalid VIN Character Rejection

*For any* VIN containing the characters I, O, or Q, the system should reject it with HTTP 400 error.

**Validates: Requirements 55.3**

### Property 17: Valid VIN Creates Report

*For any* valid VIN (17 characters, alphanumeric, no I/O/Q), submitting it to POST /api/report should create a report record with status "pending".

**Validates: Requirements 19.3**

### Property 18: Duplicate Photo Prevention

*For any* photo URL, attempting to insert it multiple times for the same VIN should not create duplicate records in the vehicle_photos table.

**Validates: Requirements 47.1, 47.2**

### Property 19: Duplicate Odometer Reading Prevention

*For any* odometer reading with identical VIN, date, and mileage, attempting to insert it multiple times should not create duplicate records.

**Validates: Requirements 57.1, 57.2**

### Property 20: Expected Mileage Calculation

*For any* vehicle with known year, the expected mileage should be calculated as (current year - vehicle year) × 12,000 miles.

**Validates: Requirements 74.1**

### Property 21: Photo Chronological Ordering

*For any* set of photos for a VIN, the API should return them sorted by capture date in ascending order (using scrape date when capture date is unavailable).

**Validates: Requirements 75.1**

### Property 22: Timeline Schema Conformance

*For any* stitched timeline, it should conform to the defined Timeline interface with all required fields present.

**Validates: Requirements 89.1, 89.2**

### Property 23: Normalizer Round-Trip

*For any* valid raw data from a source, normalizing it should produce a NormalizedVehicleRecord that contains all essential information from the raw data.

**Validates: Requirements 98.1**

### Property 24: Parser Round-Trip

*For any* valid HTML snapshot, parsing it to extract data, then re-parsing the same HTML should produce equivalent extracted data.

**Validates: Requirements 99.4**

### Property 25: Fetch Triggers Normalization

*For any* successful data fetch (API or scrape), the system should enqueue a normalization job for that VIN and source.

**Validates: Requirements 4.6, 5.4, 6.3, 7.7, 8.7, 9.5, 10.4**

### Property 26: Required Sources Block Stitching

*For any* VIN, the stitcher should not run until all required sources (NHTSA decode, NHTSA recalls, NMVTIS, NICB, Copart, IAAI) have completed normalization.

**Validates: Requirements 63.3**

### Property 27: Optional Sources Don't Block Stitching

*For any* VIN, the stitcher should run even if optional sources (AutoTrader, CarGurus) have not completed, including their data if available.

**Validates: Requirements 63.4, 63.5**


## Error Handling

### Retry Strategy

**Job-Level Retries:**
- All jobs retry up to 3 times on failure
- Exponential backoff: 30 seconds base delay, doubling each retry
- Retry attempts logged to pipeline_log table
- After 3 failures, job marked as permanently failed

**Source-Level Failure Handling:**
- Required source failure → report marked as "failed"
- Optional source failure → pipeline continues without that source
- Partial data stored even on failure for debugging

**Network Error Handling:**
- HTTP 503 errors trigger immediate retry with 1-second delay
- Timeout errors (30 seconds) trigger standard retry logic
- Connection errors logged with full error details

### LLM Error Handling

**API Timeouts:**
- 60-second timeout for all Claude API calls
- Timeout triggers retry via queue system
- After 3 timeouts, report marked as failed

**Response Parsing:**
- Non-JSON responses stored as raw text with parse error flag
- Missing fields in JSON responses filled with null values
- Parse failures logged but don't fail entire report
- Individual section failures don't block other sections

**Rate Limiting:**
- Anthropic rate limits handled with exponential backoff
- 429 responses trigger retry with delay from Retry-After header

### Scraper Error Handling

**Missing Elements:**
- Null returned for missing DOM elements instead of throwing
- All page.evaluate calls wrapped in try-catch
- Selector failures logged without failing entire scrape
- Partial results stored when critical data missing

**Bot Detection:**
- Stealth plugin reduces detection risk
- User-Agent rotation prevents pattern detection
- Rate limiting via teamSize and teamConcurrency
- Captcha detection triggers job failure for manual review

**Browser Crashes:**
- Browser instances closed in finally blocks
- Crash errors logged with full stack trace
- Job retried with fresh browser instance

### Database Error Handling

**Connection Failures:**
- Connection pool exhaustion logged as warning
- Failed queries retried once after 1-second delay
- Persistent connection failures trigger worker shutdown

**Constraint Violations:**
- Unique constraint violations handled with onConflictDoUpdate or onConflictDoNothing
- Foreign key violations logged and job marked as failed
- Validation errors returned to caller with descriptive message

### Partial Report Handling

**Incomplete Data:**
- Reports with status other than "ready" returned as partial
- Missing fields represented as null or empty arrays
- Completeness indicator shows which sources succeeded
- Users can view partial data while generation continues

**Data Completeness Indicator:**
```typescript
{
  sourcesCovered: ['nhtsa_decode', 'nmvtis', 'copart'],
  sourcesRequired: ['nhtsa_decode', 'nhtsa_recalls', 'nmvtis', 'nicb', 'copart', 'iaai'],
  sourcesOptional: ['autotrader', 'cargurus'],
  completenessPercentage: 50  // 3 of 6 required sources
}
```

## Testing Strategy

### Dual Testing Approach

The system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Specific examples demonstrating correct behavior
- Edge cases (empty data, missing fields, malformed input)
- Error conditions (network failures, invalid VINs, missing sources)
- Integration points between components
- API endpoint contracts

**Property-Based Tests:**
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Each test references its design document property

### Property-Based Testing Configuration

**Library Selection:**
- TypeScript/JavaScript: fast-check
- Minimum 100 iterations per test (due to randomization)
- Seed-based reproducibility for failed tests

**Test Tagging Format:**
```typescript
// Feature: vehicle-history-platform-rebuild, Property 9: Odometer Rollback Detection
test('detects mileage rollback', () => {
  fc.assert(
    fc.property(
      fc.array(odometerReadingArbitrary, { minLength: 2 }),
      (readings) => {
        const sorted = readings.sort((a, b) => a.date - b.date);
        const result = detectAnomalies(sorted);
        
        // Check for rollbacks
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].mileage < sorted[i-1].mileage) {
            expect(result[i].isAnomaly).toBe(true);
            expect(result[i].anomalyNote).toContain('possible rollback');
          }
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage by Component

**API Routes:**
- Unit: Valid requests, invalid VINs, missing parameters, authentication
- Property: VIN validation rules, response format consistency

**Queue System:**
- Unit: Job enqueueing, worker registration, connection failures
- Property: Retry limits, expiration timing, job retention

**Fetcher Workers:**
- Unit: Successful API calls, HTTP errors, timeout handling
- Property: Normalization job enqueueing after fetch

**Scraper Workers:**
- Unit: Successful scrapes, missing elements, bot detection
- Property: HTML snapshot storage, photo deduplication

**Normalizers:**
- Unit: Each source's data transformation, missing fields
- Property: Round-trip (normalize then validate schema), required field extraction

**Stitcher:**
- Unit: Timeline merging, vehicle identity resolution
- Property: Chronological ordering, gap detection, anomaly detection

**LLM Workers:**
- Unit: Prompt construction, response parsing, timeout handling
- Property: Risk score range, section count, verdict format

**Database:**
- Unit: CRUD operations, constraint violations, connection pooling
- Property: Unique constraints, index usage, query performance

### Integration Testing

**End-to-End Pipeline:**
1. Submit VIN via POST /api/report
2. Poll GET /api/status/:vin until status is "ready"
3. Retrieve report via GET /api/report?vin=:vin
4. Verify all required sections present
5. Verify timeline structure conforms to schema

**Test VINs:**
- Clean history VIN (no accidents, no title brands)
- Salvage title VIN (auction history, damage records)
- High mileage VIN (odometer anomaly detection)
- Gap history VIN (18+ month gaps)
- Recall VIN (open recalls)

### Manual Testing Script

Located in `scripts/test-vin.ts`:
```bash
npm run test:vin 1HGBH41JXMN109186
```

Output:
```
[00:00] Report created, status: pending
[00:02] Fetching data from 8 sources...
[00:15] Normalizing data...
[00:18] Stitching timeline...
[00:20] Analyzing with LLM...
[00:35] Writing report sections...
[00:50] Report complete!

Risk Score: 7/10
Verdict: CAUTION
Flags: Salvage title, 2 accidents, 24-month gap

View report: http://localhost:5173/report/1HGBH41JXMN109186
```

## Deployment Architecture

### Railway Configuration

**Service 1: Web Application**
- Build command: `npm run build`
- Start command: `node build/index.js`
- Environment: NODE_ENV=production
- Port: 3000 (auto-detected by Railway)
- Health check: GET /api/health

**Service 2: Worker Process**
- Build command: `npm install`
- Start command: `node --loader tsx/esm workers/index.ts`
- Environment: NODE_ENV=production
- No exposed port (internal only)
- Health check: Worker heartbeat logs

**Shared Resources:**
- PostgreSQL database (Railway addon)
- Environment variables synced across both services

### Environment Variables

Required for both services:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
ANTHROPIC_API_KEY=sk-ant-...
NMVTIS_API_URL=https://nmvtis-provider.com/api
NMVTIS_API_KEY=...
NODE_ENV=production
```

Optional:
```bash
NICB_API_KEY=...
LLM_MODEL=claude-sonnet-4-20250514
WORKER_CONCURRENCY=5
SCRAPER_CONCURRENCY=2
```

### Database Migrations

Run before starting services:
```bash
npm run db:migrate
```

Railway deployment hook in `railway.toml`:
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run db:migrate && node build/index.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### Scaling Considerations

**Horizontal Scaling:**
- Multiple worker instances supported
- Queue distributes jobs across all workers
- No shared state between workers
- Database handles concurrent connections

**Vertical Scaling:**
- Worker concurrency configurable via environment
- Database connection pool size: 20 per service
- Scraper rate limiting prevents site overload

**Cost Optimization:**
- Optional sources can be disabled to reduce scraping costs
- Report caching (30 days) reduces redundant processing
- HTML snapshot compression reduces storage costs
- LLM model configurable for cost/quality tradeoff

## Algorithms

### Odometer Anomaly Detection

**Rollback Detection:**
```typescript
function detectRollback(readings: OdometerReading[]): OdometerReading[] {
  const sorted = readings.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].mileage < sorted[i-1].mileage) {
      sorted[i].isAnomaly = true;
      sorted[i].anomalyNote = 'possible rollback';
    }
  }
  
  return sorted;
}
```

**Unusual Rate Detection:**
```typescript
function detectUnusualRate(readings: OdometerReading[]): OdometerReading[] {
  const sorted = readings.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  for (let i = 1; i < sorted.length; i++) {
    const mileageDiff = sorted[i].mileage - sorted[i-1].mileage;
    const timeDiffYears = (sorted[i].date.getTime() - sorted[i-1].date.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const rate = mileageDiff / timeDiffYears;
    
    if (rate > 50000) {
      sorted[i].isAnomaly = true;
      sorted[i].anomalyNote = `unusual rate: ${Math.round(rate)} miles/year`;
    }
  }
  
  return sorted;
}
```

**Expected Mileage Calculation:**
```typescript
function calculateExpectedMileage(vehicleYear: number): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicleYear;
  return age * 12000;  // 12,000 miles per year average
}
```

### Gap Detection

**Gap Identification:**
```typescript
function detectGaps(events: TimelineEvent[]): Gap[] {
  const sorted = events.sort((a, b) => a.date.getTime() - b.date.getTime());
  const gaps: Gap[] = [];
  
  for (let i = 1; i < sorted.length; i++) {
    const gapMonths = monthsBetween(sorted[i-1].date, sorted[i].date);
    
    if (gapMonths >= 18) {
      gaps.push({
        startDate: sorted[i-1].date,
        endDate: sorted[i].date,
        durationMonths: gapMonths,
        severity: gapMonths >= 36 ? 'high' : 'medium'
      });
    }
  }
  
  // Check gap from last event to present
  if (sorted.length > 0) {
    const lastEvent = sorted[sorted.length - 1];
    const gapMonths = monthsBetween(lastEvent.date, new Date());
    
    if (gapMonths >= 18) {
      gaps.push({
        startDate: lastEvent.date,
        endDate: new Date(),
        durationMonths: gapMonths,
        severity: gapMonths >= 36 ? 'high' : 'medium'
      });
    }
  }
  
  return gaps;
}

function monthsBetween(date1: Date, date2: Date): number {
  const months = (date2.getFullYear() - date1.getFullYear()) * 12;
  return months + (date2.getMonth() - date1.getMonth());
}
```

### Timeline Stitching

**Event Merging:**
```typescript
function stitchTimeline(normalizedData: NormalizedVehicleRecord[]): Timeline {
  // Extract vehicle identity from NHTSA (authoritative source)
  const nhtsaData = normalizedData.find(d => d.source === 'nhtsa_decode');
  const identity = nhtsaData?.identity || {};
  
  // Merge all events
  const allEvents = normalizedData.flatMap(d => d.events);
  const sortedEvents = allEvents.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Merge odometer readings
  const allReadings = normalizedData.flatMap(d => d.odometerReadings);
  const sortedReadings = allReadings.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Detect anomalies
  const readingsWithAnomalies = detectAnomalies(sortedReadings);
  
  // Detect gaps
  const gaps = detectGaps(sortedEvents);
  
  // Merge other data
  const titleBrands = normalizedData.flatMap(d => d.titleBrands || []);
  const recalls = normalizedData.find(d => d.source === 'nhtsa_recalls')?.recalls || [];
  const damageRecords = normalizedData.flatMap(d => d.damageRecords || []);
  
  // Merge market value (prefer most recent)
  const marketValueSources = normalizedData.filter(d => d.marketValue);
  const marketValue = marketValueSources[marketValueSources.length - 1]?.marketValue || {};
  
  return {
    identity,
    titleHistory: [],  // Extracted from NMVTIS
    titleBrands,
    recalls,
    damageRecords,
    odometerReadings: readingsWithAnomalies,
    marketValue,
    events: sortedEvents,
    gaps,
    sourcesCovered: normalizedData.map(d => d.source)
  };
}
```


## LLM Integration

### Prompt Engineering

**Analysis Prompt Structure:**
```typescript
const analysisPrompt = `You are analyzing a vehicle history report. Based on the timeline data below, provide a comprehensive risk assessment.

VEHICLE: ${timeline.identity.year} ${timeline.identity.make} ${timeline.identity.model}

TIMELINE DATA:
${JSON.stringify(timeline, null, 2)}

Provide your analysis in the following JSON format:
{
  "riskScore": <number 1-10>,
  "verdict": "<buy|caution|avoid>",
  "verdictReasoning": "<2-3 sentences explaining the verdict>",
  "topFlags": [
    { "severity": "<high|medium|low>", "description": "<flag description>" }
  ],
  "gapAnalysis": [
    {
      "startDate": "<ISO date>",
      "endDate": "<ISO date>",
      "likelyExplanation": "<plain English explanation>",
      "buyerConcernLevel": <number 1-10>
    }
  ],
  "odometerAssessment": "<plain English assessment>",
  "titleAssessment": "<plain English assessment>"
}

Guidelines:
- Be specific with dates and numbers
- Avoid jargon
- Focus on buyer impact
- Distinguish between normal and concerning patterns
`;
```

**Section Writing Prompt Structure:**
```typescript
const sectionPrompts = {
  summary: `Write a 3-sentence summary of this vehicle's history. Lead with the single most important finding. Use specific dates and numbers. Avoid jargon.`,
  
  ownership_history: `Explain the ownership pattern for this vehicle. Is the number of owners normal for its age? Are there any red flags like unusually short ownership periods or ownership changes shortly after accidents?`,
  
  accident_analysis: `Analyze all damage records. Classify each accident as minor, moderate, or severe. Explain the difference between cosmetic and structural damage. Explain how this history affects resale value.`,
  
  odometer_analysis: `Compare actual mileage to expected mileage (12,000 miles/year). Is the mileage high, low, or normal? Explain implications of the mileage pattern.`,
  
  title_history: `Explain any title brands present. What does salvage/rebuilt/flood title mean for safety, insurance, and resale value? If no brands, confirm clean title.`,
  
  recall_status: `List all recalls. Distinguish between open and closed recalls. Explain what each recall component means in plain English. Explain consequences of not addressing open recalls.`,
  
  market_value: `Compare asking price to market average. Explain how accident history, title brands, and mileage affect value. Provide a clear buy/caution/avoid recommendation.`,
  
  gap_analysis: `Explain each gap in the vehicle's history. Provide vehicle age context. Suggest specific questions to ask the seller. Distinguish between normal gaps (storage, private ownership) and concerning gaps.`,
  
  buyers_checklist: `Generate exactly 8 specific inspection items based on this vehicle's history. Reference specific damage areas from accident records. Reference specific recall components if applicable. Avoid generic items.`
};
```

### Response Parsing and Validation

**Analysis Response Validation:**
```typescript
function validateAnalysisResponse(response: any): LLMAnalysis {
  // Validate risk score
  if (typeof response.riskScore !== 'number' || response.riskScore < 1 || response.riskScore > 10) {
    throw new Error('Invalid risk score: must be number between 1 and 10');
  }
  
  // Validate verdict
  if (!['buy', 'caution', 'avoid'].includes(response.verdict)) {
    throw new Error('Invalid verdict: must be buy, caution, or avoid');
  }
  
  // Validate verdict reasoning
  if (typeof response.verdictReasoning !== 'string' || response.verdictReasoning.length === 0) {
    throw new Error('Missing verdict reasoning');
  }
  
  // Validate top flags
  if (!Array.isArray(response.topFlags)) {
    throw new Error('topFlags must be an array');
  }
  
  for (const flag of response.topFlags) {
    if (!['high', 'medium', 'low'].includes(flag.severity)) {
      throw new Error('Invalid flag severity');
    }
  }
  
  return response as LLMAnalysis;
}
```

**Error Handling:**
```typescript
async function callClaudeWithRetry(prompt: string, maxRetries: number = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: process.env.LLM_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
        timeout: 60000  // 60 second timeout
      });
      
      const content = response.content[0].text;
      
      // Try to parse as JSON
      try {
        return JSON.parse(content);
      } catch (parseError) {
        // Store raw text with parse error flag
        await logPipelineError(vin, 'llm-analyze', 'JSON parse failed', content);
        
        if (attempt === maxRetries) {
          throw new Error('Failed to parse LLM response as JSON after all retries');
        }
        
        // Retry with more explicit JSON instruction
        prompt += '\n\nIMPORTANT: Respond with valid JSON only, no additional text.';
        continue;
      }
      
    } catch (error) {
      if (error.name === 'TimeoutError') {
        await logPipelineError(vin, 'llm-analyze', 'Timeout', error.message);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await sleep(1000 * Math.pow(2, attempt));
        continue;
      }
      
      if (error.status === 429) {
        // Rate limit - use Retry-After header
        const retryAfter = parseInt(error.headers['retry-after'] || '60');
        await sleep(retryAfter * 1000);
        continue;
      }
      
      throw error;
    }
  }
}
```

### Cost Tracking

**Usage Logging:**
```typescript
async function logLLMUsage(vin: string, model: string, inputTokens: number, outputTokens: number) {
  const cost = calculateCost(model, inputTokens, outputTokens);
  
  await db.insert(llmUsageLog).values({
    vin,
    model,
    inputTokens,
    outputTokens,
    estimatedCost: cost,
    timestamp: new Date()
  });
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  // Claude Sonnet 4 pricing (as of 2025)
  const inputCostPer1M = 3.00;   // $3 per 1M input tokens
  const outputCostPer1M = 15.00; // $15 per 1M output tokens
  
  const inputCost = (inputTokens / 1_000_000) * inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * outputCostPer1M;
  
  return inputCost + outputCost;
}
```

**Cost Monitoring API:**
```typescript
// GET /api/admin/llm-usage?startDate=2025-01-01&endDate=2025-01-31
async function getLLMUsageStats(startDate: Date, endDate: Date) {
  const usage = await db
    .select({
      date: sql`DATE(timestamp)`,
      model: llmUsageLog.model,
      totalInputTokens: sql`SUM(input_tokens)`,
      totalOutputTokens: sql`SUM(output_tokens)`,
      totalCost: sql`SUM(estimated_cost)`,
      reportCount: sql`COUNT(DISTINCT vin)`
    })
    .from(llmUsageLog)
    .where(
      and(
        gte(llmUsageLog.timestamp, startDate),
        lte(llmUsageLog.timestamp, endDate)
      )
    )
    .groupBy(sql`DATE(timestamp)`, llmUsageLog.model);
  
  return usage;
}
```

## Folder Structure

```
/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── index.ts              # Drizzle client export
│   │   │   │   └── schema.ts             # All table definitions
│   │   │   ├── queue/
│   │   │   │   ├── index.ts              # pg-boss singleton
│   │   │   │   └── job-names.ts          # Job name constants
│   │   │   ├── report/
│   │   │   │   └── status.ts             # Report status helpers
│   │   │   └── vehicle/
│   │   │       ├── nhtsa-client.ts       # EXISTING - preserved
│   │   │       ├── nhtsa-mapper.ts       # EXISTING - preserved
│   │   │       └── types.ts              # EXISTING - preserved
│   │   └── shared/
│   │       ├── types.ts                  # Shared TS interfaces
│   │       └── vin-utils.ts              # VIN validation
│   └── routes/
│       ├── api/
│       │   ├── report/
│       │   │   └── +server.ts            # POST (trigger) / GET (retrieve)
│       │   ├── status/
│       │   │   └── [vin]/+server.ts      # GET pipeline status
│       │   ├── export/
│       │   │   └── [vin]/+server.ts      # GET DOCX export
│       │   └── admin/
│       │       └── llm-usage/+server.ts  # GET usage stats
│       └── report/
│           └── [vin]/
│               └── +page.svelte          # Report display page
│
├── workers/
│   ├── index.ts                          # Bootstrap - registers all workers
│   ├── fetchers/
│   │   ├── fetch-nhtsa-decode.ts
│   │   ├── fetch-nhtsa-recalls.ts
│   │   ├── fetch-nmvtis.ts
│   │   └── fetch-nicb.ts
│   ├── scrapers/
│   │   ├── scrape-copart.ts
│   │   ├── scrape-iaai.ts
│   │   ├── scrape-autotrader.ts
│   │   └── scrape-cargurus.ts
│   ├── normalizers/
│   │   ├── index.ts                      # Normalizer registry
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
│   └── test-vin.ts                       # Manual test script
│
├── drizzle.config.ts
├── package.json
└── railway.toml
```

## Data Source Catalogue

### Required Sources (Block Stitching)

**NHTSA VIN Decode**
- API: https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}?format=json
- Cost: Free
- Rate Limit: None documented
- Data: Vehicle specifications, manufacturer info, safety features
- Normalizer: Wraps existing nhtsa-mapper.ts logic

**NHTSA Recalls**
- API: https://api.nhtsa.gov/recalls/recallsByVehicle?vin={vin}
- Cost: Free
- Rate Limit: None documented
- Data: Safety recalls with campaign numbers, components, remedies
- Normalizer: Extracts recall events

**NMVTIS (National Motor Vehicle Title Information System)**
- API: Provider-specific (e.g., VehicleHistory.gov, AAX)
- Cost: ~$0.05 per VIN query
- Rate Limit: Provider-specific
- Data: Title history, title brands, odometer readings from DMV
- Normalizer: Extracts title events, brands, odometer readings
- Authentication: API key required

**NICB VINCheck**
- API: https://www.nicb.org/vincheck/api?vin={vin}
- Cost: Free
- Rate Limit: Requires User-Agent header
- Data: Theft records, total loss records
- Normalizer: Extracts theft events

**Copart**
- Method: Puppeteer scrape
- URL: https://www.copart.com/lot/search?query={vin}
- Cost: Free (scraping)
- Rate Limit: teamSize=2, teamConcurrency=1
- Data: Auction history, damage descriptions, sale dates, photos
- Normalizer: Extracts auction events, damage records, odometer readings, photos

**IAAI (Insurance Auto Auctions)**
- Method: Puppeteer scrape
- URL: https://www.iaai.com/Search?vehicleSearch={vin}
- Cost: Free (scraping)
- Rate Limit: teamSize=2, teamConcurrency=1
- Data: Auction history, damage types, sale dates, photos
- Normalizer: Extracts auction events, damage records, odometer readings, photos

### Optional Sources (Don't Block Stitching)

**AutoTrader**
- Method: Puppeteer scrape
- URL: https://www.autotrader.com/cars-for-sale/vin/{vin}
- Cost: Free (scraping)
- Rate Limit: Default concurrency
- Data: Listing price, dealer info, listing photos, mileage
- Normalizer: Extracts listing events, market value, odometer readings, photos

**CarGurus**
- Method: Puppeteer scrape
- URL: https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?vin={vin}
- Cost: Free (scraping)
- Rate Limit: Default concurrency
- Data: Price rating, market average, days on market
- Normalizer: Extracts market value data

## Development Workflow

### Local Development

**Start both services concurrently:**
```bash
npm run dev
```

This runs:
- `vite dev` (web app on port 5173)
- `tsx workers/index.ts` (worker process)

**Run workers standalone:**
```bash
npm run workers
```

**Run web app standalone:**
```bash
npm run dev:web
```

### Database Management

**Generate migration from schema changes:**
```bash
npm run db:generate
```

**Apply pending migrations:**
```bash
npm run db:migrate
```

**View database in Drizzle Studio:**
```bash
npm run db:studio
```

### Testing

**Run all tests:**
```bash
npm test
```

**Run property-based tests only:**
```bash
npm test -- --grep "Property"
```

**Run specific test file:**
```bash
npm test -- src/lib/server/stitcher.test.ts
```

**Test specific VIN:**
```bash
npm run test:vin 1HGBH41JXMN109186
```

### Production Build

**Build web app:**
```bash
npm run build
```

**Run production web app:**
```bash
node build/index.js
```

**Run production workers:**
```bash
npm run workers:prod
```

## Implementation Notes

### Preserving Existing Code

**NHTSA Client (src/lib/server/vehicle/nhtsa-client.ts):**
- Keep existing decodeVIN and getRecalls functions
- Wrap in fetcher worker without modification
- Maintain existing retry logic and error handling

**NHTSA Mapper (src/lib/server/vehicle/nhtsa-mapper.ts):**
- Keep all existing mapper functions
- Wrap in normalizer worker
- Use existing type definitions from types.ts

**Puppeteer Configuration:**
- Extend existing setup with stealth plugin
- Preserve existing browser launch options
- Add User-Agent rotation on top of existing config

**DOCX Generation:**
- Keep existing template-builder logic
- Use for export endpoint
- Extend with new report sections

### Migration Strategy

**Phase 1: Database Schema**
1. Add new tables without dropping existing ones
2. Run migrations in development
3. Verify existing data preserved
4. Deploy schema changes to production

**Phase 2: Queue System**
1. Add pg-boss to existing codebase
2. Test queue in development
3. Deploy queue system (no user impact)

**Phase 3: Workers**
1. Implement fetcher workers
2. Implement scraper workers
3. Implement normalizer workers
4. Test pipeline end-to-end in development
5. Deploy worker process to Railway

**Phase 4: API Migration**
1. Update POST /api/report to enqueue jobs instead of synchronous processing
2. Keep existing GET /api/report working
3. Add new status/photos/sections endpoints
4. Test with real VINs
5. Deploy API changes

**Phase 5: LLM Integration**
1. Implement stitcher worker
2. Implement LLM workers
3. Test with sample timelines
4. Deploy LLM workers

### Performance Optimization

**Database Indexes:**
- reports.vin (unique, primary lookup)
- odometer_readings.vin (graph queries)
- vehicle_photos.vin (photo queries)
- pipeline_log.vin (status queries)
- raw_data (vin, source) composite (uniqueness)
- normalized_data (vin, source) composite (uniqueness)

**Query Optimization:**
- Use SELECT only needed columns
- Limit pipeline_log queries to 20 most recent
- Use connection pooling (max 20 connections)
- Cache completed reports for 30 days

**Scraper Optimization:**
- Rate limit with teamSize and teamConcurrency
- Close browser instances immediately after scrape
- Compress HTML snapshots over 100KB
- Store only essential photos (deduplicate)

**LLM Optimization:**
- Use claude-sonnet-4 (balance of cost and quality)
- Limit response tokens to 1000 per section
- Batch section writing when possible
- Cache analysis results (don't regenerate for 30 days)

---

## Summary

This design transforms the vehicle history platform into a scalable, maintainable system with clear separation between web serving and background processing. The worker-based pipeline architecture enables:

1. **Reliability**: Automatic retries, graceful degradation, partial report handling
2. **Scalability**: Horizontal scaling of workers, concurrent job processing
3. **Maintainability**: Modular design, clear interfaces, preserved existing code
4. **Extensibility**: Adding new data sources requires only fetcher + normalizer
5. **Quality**: LLM-written sections, comprehensive anomaly detection, gap analysis

The system processes 8 data sources (4 APIs + 4 scrapers), normalizes all data into a unified schema, stitches a chronological timeline, and uses Claude to analyze and write 9 report sections in plain English. All components communicate through a PostgreSQL-backed job queue, enabling reliable asynchronous processing with automatic retries and error handling.

