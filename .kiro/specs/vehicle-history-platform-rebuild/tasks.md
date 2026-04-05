# Implementation Plan: Vehicle History Platform Rebuild

## Overview

This implementation plan transforms the vehicle history platform from a synchronous monolithic system into a modern worker-based pipeline architecture. The system will generate comprehensive vehicle history reports with LLM-written sections, gap detection, odometer anomaly analysis, and photo aggregation from 8 data sources.

**Architecture**: SvelteKit web app + separate worker process sharing PostgreSQL database on Railway

**Key Technologies**: TypeScript, pg-boss queue, Drizzle ORM, Puppeteer, Claude LLM

**Implementation Language**: TypeScript (for all components)

**Data Sources**: 
- Required: NHTSA decode, NHTSA recalls, NMVTIS, NICB, Copart, IAAI
- Optional: AutoTrader, CarGurus

**Pipeline Flow**: Fetch → Normalize → Stitch → LLM Analyze → LLM Write Sections → Ready

## Tasks


- [x] 1. Foundation Setup - Install dependencies and configure project structure
  - [x] 1.1 Install required pnpm packages
    - Install pg-boss, @anthropic-ai/sdk, got, puppeteer-extra, puppeteer-extra-plugin-stealth
    - Install concurrently and tsx as dev dependencies
    - Update package.json scripts for dev, workers, and db commands
    - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 30.6, 30.7, 31.1, 31.2_
  
  - [x] 1.2 Create folder structure for workers and shared code
    - Create workers/ directory with subdirectories: fetchers/, scrapers/, normalizers/
    - Create src/lib/server/queue/ directory
    - Create src/lib/shared/ directory for shared types and utilities
    - Preserve existing src/lib/server/vehicle/ directory
    - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 29.7, 29.8_
  
  - [x] 1.3 Create shared types and utilities
    - Create src/lib/shared/types.ts with VehicleIdentity, VehicleEvent, OdometerReading, NormalizedVehicleRecord, Timeline interfaces
    - Create src/lib/shared/vin-utils.ts with validateVIN function
    - _Requirements: 55.1, 55.2, 55.3, 55.4, 55.5, 89.4_

- [x] 2. Database Schema Extension - Add new tables for pipeline data
  - [x] 2.1 Extend Drizzle schema with new tables
    - Add reportStatusEnum, dataSourceEnum, odometerSourceEnum, eventTypeEnum to schema
    - Add reports table with timeline, llmFlags, llmVerdict fields
    - Add raw_data table with rawJson and rawHtml fields
    - Add normalized_data table with data jsonb field
    - Add odometer_readings table with anomaly detection fields
    - Add vehicle_photos table with source and metadata fields
    - Add report_sections table for LLM-written content
    - Add pipeline_log table for progress tracking
    - Create indexes on vin columns for performance
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 66.1-66.9, 85.1-85.5_
  
  - [x] 2.2 Generate and apply database migrations
    - Run drizzle-kit generate to create migration files
    - Review generated migrations for correctness
    - Run drizzle-kit migrate to apply migrations
    - Verify all existing tables are preserved
    - _Requirements: 32.1, 32.2, 32.3, 32.4, 32.5_

- [x] 3. Queue System Setup - Configure pg-boss for job orchestration
  - [x] 3.1 Create queue client singleton
    - Create src/lib/server/queue/index.ts with getQueue function
    - Configure pg-boss with retry limit 3, exponential backoff, 10-minute expiration
    - Configure job retention: 3 days for completed, 7 days for failed
    - Add error event logging
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 48.1-48.5, 49.1-49.5_
  
  - [x] 3.2 Create job name constants
    - Create src/lib/server/queue/job-names.ts with Jobs enum
    - Define all job names: fetch-*, scrape-*, normalize, stitch-report, llm-analyze, llm-write-sections
    - Define REQUIRED_SOURCES and OPTIONAL_SOURCES arrays
    - _Requirements: 63.1, 63.2, 77.1-77.6_


- [x] 4. Fetcher Workers - Implement API data fetching workers
  - [x] 4.1 Implement NHTSA decode fetcher worker
    - Create workers/fetchers/fetch-nhtsa-decode.ts
    - Wrap existing NHTSA client logic without rewriting
    - Call NHTSA VIN decode API and store raw JSON response
    - Handle HTTP 503 errors with 1-second retry delay
    - Log pipeline progress (started, completed, failed)
    - Enqueue normalization job on success
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 22.1-22.5_
  
  - [x] 4.2 Implement NHTSA recalls fetcher worker
    - Create workers/fetchers/fetch-nhtsa-recalls.ts
    - Call NHTSA recalls API and store raw JSON response
    - Log pipeline progress
    - Enqueue normalization job on success
    - _Requirements: 4.2, 4.4, 4.6_
  
  - [x] 4.3 Implement NMVTIS fetcher worker
    - Create workers/fetchers/fetch-nmvtis.ts
    - Call NMVTIS provider API with authentication
    - Store raw JSON response
    - Log pipeline progress
    - Enqueue normalization job on success
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 4.4 Implement NICB theft data fetcher worker
    - Create workers/fetchers/fetch-nicb.ts
    - Call NICB VINCheck API with User-Agent header
    - Store raw JSON response
    - Log pipeline progress
    - Enqueue normalization job on success
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 5. Scraper Workers - Implement Puppeteer-based web scraping workers
  - [x] 5.1 Implement Copart auction scraper worker
    - Create workers/scrapers/scrape-copart.ts
    - Use puppeteer-extra with stealth plugin
    - Search Copart by VIN and extract lot data (lot number, sale date, odometer, damage, images)
    - Store raw HTML snapshot for re-parsing
    - Store extracted images in vehicle_photos table
    - Configure teamSize=2, teamConcurrency=1 for rate limiting
    - Log pipeline progress
    - Enqueue normalization job on success
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 24.1-24.4, 35.1-35.5, 36.1, 56.1-56.7_
  
  - [x] 5.2 Implement IAAI auction scraper worker
    - Create workers/scrapers/scrape-iaai.ts
    - Use puppeteer-extra with stealth plugin
    - Search IAAI by VIN and extract auction data (stock number, sale date, mileage, damage, images)
    - Store raw HTML snapshot
    - Store extracted images in vehicle_photos table
    - Configure teamSize=2, teamConcurrency=1
    - Log pipeline progress
    - Enqueue normalization job on success
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 36.2_
  
  - [x] 5.3 Implement AutoTrader listing scraper worker
    - Create workers/scrapers/scrape-autotrader.ts
    - Use puppeteer-extra with stealth plugin
    - Search AutoTrader by VIN and extract listing data (price, mileage, dealer, location, images)
    - Store raw HTML snapshot
    - Store listing images in vehicle_photos table
    - Log pipeline progress
    - Enqueue normalization job on success
    - Continue pipeline even if this optional source fails
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 5.4 Implement CarGurus price scraper worker
    - Create workers/scrapers/scrape-cargurus.ts
    - Use puppeteer-extra with stealth plugin
    - Search CarGurus by VIN and extract price data (current price, rating, market average, days on market)
    - Store raw HTML snapshot
    - Log pipeline progress
    - Enqueue normalization job on success
    - Continue pipeline even if this optional source fails
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_


- [x] 6. Normalizer Workers - Transform raw data into unified schema
  - [x] 6.1 Create normalizer registry and worker
    - Create workers/normalizers/index.ts with normalizer map
    - Implement normalize worker that dispatches to source-specific normalizers
    - Check if all required sources are complete after each normalization
    - Enqueue stitching job when all required sources are normalized
    - _Requirements: 11.1, 11.7, 11.8, 11.9, 54.1-54.5_
  
  - [x] 6.2 Implement NHTSA decode normalizer
    - Create workers/normalizers/normalize-nhtsa.ts
    - Wrap existing NHTSA mapper logic without rewriting
    - Extract vehicle identity fields (year, make, model, trim, body style, engine, drivetrain, fuel type)
    - Transform to NormalizedVehicleRecord interface
    - _Requirements: 11.2, 33.1, 33.2, 39.1-39.5_
  
  - [x] 6.3 Implement NHTSA recalls normalizer
    - Add normalizeNhtsaRecalls function to normalize-nhtsa.ts
    - Extract recalls with campaign number, component, summary, consequence, remedy
    - Create recall events for timeline
    - _Requirements: 11.5, 43.1-43.5_
  
  - [x] 6.4 Implement NMVTIS normalizer
    - Create workers/normalizers/normalize-nmvtis.ts
    - Extract title history with dates, states, odometer readings
    - Extract title brands (salvage, rebuilt, flood, lemon)
    - Create title transfer and title brand events
    - Extract odometer readings from title transfers
    - _Requirements: 11.3, 11.4, 11.5, 42.1-42.5_
  
  - [x] 6.5 Implement NICB normalizer
    - Create workers/normalizers/normalize-nicb.ts
    - Extract theft records
    - Create theft events for timeline
    - _Requirements: 11.3_
  
  - [x] 6.6 Implement Copart normalizer
    - Create workers/normalizers/normalize-copart.ts
    - Extract auction events with sale dates and locations
    - Extract damage records with primary/secondary damage and title codes
    - Extract odometer readings from auction data
    - Generate human-readable event descriptions
    - _Requirements: 11.3, 11.4, 41.1-41.5, 84.1-84.5_
  
  - [x] 6.7 Implement IAAI normalizer
    - Create workers/normalizers/normalize-iaai.ts
    - Extract auction events with sale dates and locations
    - Extract damage records with damage types
    - Extract odometer readings from auction data
    - Generate human-readable event descriptions
    - _Requirements: 11.3, 11.4, 41.1-41.5, 84.1-84.5_
  
  - [x] 6.8 Implement AutoTrader normalizer
    - Create workers/normalizers/normalize-autotrader.ts
    - Extract listing events with prices and dealer info
    - Extract market value data (asking price)
    - Extract odometer readings from listings
    - Generate human-readable event descriptions
    - _Requirements: 11.3, 11.4, 40.1-40.6_
  
  - [x] 6.9 Implement CarGurus normalizer
    - Create workers/normalizers/normalize-cargurus.ts
    - Extract market value data (price rating, market average, days on market)
    - _Requirements: 40.1-40.6_

- [x] 7. Checkpoint - Verify data fetching and normalization pipeline
  - Ensure all tests pass, ask the user if questions arise.


- [x] 8. Stitcher Worker - Merge normalized data into chronological timeline
  - [x] 8.1 Implement timeline stitching logic
    - Create workers/stitch-report.ts
    - Wait for all required sources to complete normalization
    - Merge all events from normalized data into chronological order
    - Use NHTSA decode as authoritative source for vehicle identity
    - Merge odometer readings from all sources into sorted list
    - Merge title history from NMVTIS
    - Merge damage records from Copart and IAAI
    - Merge market value data from AutoTrader and CarGurus
    - Store complete timeline in reports table
    - Update report status to "analyzing"
    - _Requirements: 12.1-12.9, 38.1-38.5, 39.1-39.5, 40.1-40.6, 41.1-41.5, 42.1-42.5, 43.1-43.5, 44.1-44.5_
  
  - [x] 8.2 Implement odometer anomaly detection
    - Detect mileage rollbacks (decreasing mileage between consecutive readings)
    - Flag rollbacks with "possible rollback" note
    - Detect unusual mileage rates (exceeding 50,000 miles/year)
    - Flag unusual rates with calculated annual rate
    - Store anomaly flags and notes in odometer_readings table
    - Calculate expected mileage based on 12,000 miles/year average
    - _Requirements: 13.1-13.5, 74.1-74.5_
  
  - [x] 8.3 Implement history gap detection
    - Detect gaps exceeding 18 months between consecutive events
    - Classify gap severity: high (36+ months), medium (18-36 months)
    - Detect gap from last event to present date
    - Store gaps with start date, end date, duration, and severity
    - _Requirements: 14.1-14.5_
  
  - [x] 8.4 Enqueue LLM analysis job after stitching
    - Update report status to "analyzing"
    - Enqueue llm-analyze job with VIN
    - _Requirements: 12.8, 12.9_

- [x] 9. LLM Workers - Analyze timeline and write report sections
  - [x] 9.1 Implement LLM analysis worker
    - Create workers/llm-analyze.ts
    - Load stitched timeline from reports table
    - Construct analysis prompt with complete timeline data
    - Call Claude API with 60-second timeout
    - Parse JSON response with risk score, verdict, flags, gap analysis
    - Validate risk score is 1-10, verdict is buy/caution/avoid
    - Store analysis results in reports.llmFlags and reports.llmVerdict
    - Handle timeout errors with retry logic
    - Handle rate limiting with exponential backoff
    - Enqueue llm-write-sections job on success
    - _Requirements: 15.1-15.10, 45.1-45.6, 46.1-46.5, 82.1-82.5_
  
  - [x] 9.2 Implement LLM section writing worker
    - Create workers/llm-write-sections.ts
    - Define 9 section prompts: summary, ownership_history, accident_analysis, odometer_analysis, title_history, recall_status, market_value, gap_analysis, buyers_checklist
    - Call Claude API for each section with specific prompts
    - Use claude-sonnet-4-20250514 model
    - Limit responses to 1000 tokens per section
    - Store each section in report_sections table with VIN and section key
    - Update report status to "ready" when all sections complete
    - Set completedAt timestamp
    - Continue generating other sections if one section fails
    - _Requirements: 16.1-16.13, 67.1-67.5, 68.1-68.5, 69.1-69.5, 70.1-70.5, 71.1-71.5, 72.1-72.5, 73.1-73.5, 76.1-76.5, 79.1-79.5, 94.1-94.5_


- [x] 10. API Routes - Implement web app endpoints
  - [x] 10.1 Implement report triggering endpoint
    - Create src/routes/api/report/+server.ts with POST handler
    - Validate VIN length (17 characters) and characters (no I/O/Q)
    - Create report record with status "pending"
    - Enqueue jobs for all required sources (NHTSA decode, NHTSA recalls, NMVTIS, NICB, Copart, IAAI)
    - Enqueue jobs for all optional sources (AutoTrader, CarGurus)
    - Update report status to "fetching"
    - Return HTTP 200 with status "processing"
    - Return HTTP 400 for invalid VINs with descriptive error
    - _Requirements: 19.1-19.7, 55.1-55.5, 78.1-78.5, 87.1-87.5_
  
  - [x] 10.2 Implement report retrieval endpoint
    - Add GET handler to src/routes/api/report/+server.ts
    - Accept VIN as query parameter
    - Return HTTP 400 if VIN not provided
    - Return HTTP 404 if report does not exist
    - Return complete report with timeline, llmFlags, llmVerdict, status
    - Support partial reports (status other than "ready")
    - _Requirements: 20.1-20.5, 62.1-62.5_
  
  - [x] 10.3 Implement pipeline status endpoint
    - Create src/routes/api/status/[vin]/+server.ts with GET handler
    - Return overall report status
    - Return completion status for each pipeline stage
    - Return 20 most recent pipeline log entries
    - Query pipeline_log table ordered by timestamp descending
    - _Requirements: 21.1-21.5_
  
  - [x] 10.4 Implement odometer graph data endpoint
    - Create src/routes/api/report/[vin]/odometer/+server.ts with GET handler
    - Return odometer readings sorted by date
    - Include date, mileage, source, reportedBy, isAnomaly, anomalyNote for each reading
    - Calculate expected mileage line based on 12,000 miles/year
    - Format dates as ISO strings and mileage as integers
    - _Requirements: 18.1-18.5_
  
  - [x] 10.5 Implement photo aggregation endpoint
    - Create src/routes/api/report/[vin]/photos/+server.ts with GET handler
    - Return photos sorted by capture date (use scrape date if capture date unavailable)
    - Group photos by source
    - Return 6 most recent photos for hero display
    - Include photo metadata (source, date, type, url)
    - _Requirements: 17.1-17.7, 75.1-75.5_
  
  - [x] 10.6 Implement report sections endpoint
    - Create src/routes/api/report/[vin]/sections/+server.ts with GET handler
    - Return all sections for VIN ordered by display sequence
    - Include section key, content, generatedAt, modelUsed
    - Return empty array if sections don't exist
    - Support filtering by section key via query parameter
    - _Requirements: 34.1-34.5_
  
  - [x] 10.7 Implement DOCX export endpoint
    - Create src/routes/api/export/[vin]/+server.ts with GET handler
    - Use existing docx generation logic
    - Include all report sections in DOCX
    - Include odometer graph as embedded image
    - Include vehicle photos in DOCX
    - Return DOCX file with Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
    - _Requirements: 52.1-52.6, 33.4_
  
  - [x] 10.8 Implement health check endpoint
    - Create src/routes/api/health/+server.ts with GET handler
    - Verify database connectivity
    - Verify queue connectivity
    - Return HTTP 200 when healthy
    - Return system version and build timestamp
    - _Requirements: 93.1-93.5_


- [x] 11. Worker Process Bootstrap - Register and start all workers
  - [x] 11.1 Create worker bootstrap script
    - Create workers/index.ts
    - Import and register all fetcher workers (4 workers)
    - Import and register all scraper workers (4 workers)
    - Import and register normalizer worker
    - Import and register stitcher worker
    - Import and register LLM analysis worker
    - Import and register LLM section writing worker
    - Log successful registration of each worker
    - Log total number of registered workers (13 total)
    - Log pg-boss version on startup
    - Exit with error code 1 if registration fails
    - _Requirements: 25.1-25.8, 86.1-86.5_
  
  - [x] 11.2 Implement worker heartbeat logging
    - Log heartbeat message every 60 seconds
    - Include active job count in heartbeat
    - Include queue connection status in heartbeat
    - _Requirements: 60.1-60.3_
  
  - [x] 11.3 Implement graceful shutdown handling
    - Listen for SIGTERM signal
    - Log shutdown message
    - Allow current jobs to complete before exiting
    - Exit with code 0 after cleanup
    - _Requirements: 28.1-28.4_

- [x] 12. Environment Configuration - Set up environment variables
  - [x] 12.1 Create environment variable configuration
    - Document required variables: DATABASE_URL, ANTHROPIC_API_KEY, NMVTIS_API_URL, NMVTIS_API_KEY, NODE_ENV
    - Document optional variables: NICB_API_KEY, LLM_MODEL, WORKER_CONCURRENCY, SCRAPER_CONCURRENCY
    - Update .env.example with all variables
    - _Requirements: 26.1-26.7_

- [x] 13. Checkpoint - Verify complete pipeline end-to-end
  - Ensure all tests pass, ask the user if questions arise.


- [ ]* 14. Testing - Implement comprehensive test coverage
  - [ ]* 14.1 Write property-based tests for core algorithms
    - **Property 1: Report Read Idempotence**
    - **Validates: Requirements 1.4**
    - Test that reading completed reports multiple times doesn't change status or trigger jobs
  
  - [ ]* 14.2 Write property test for job retry limits
    - **Property 2: Job Retry Limit**
    - **Validates: Requirements 2.1, 23.2**
    - Test that failed jobs retry exactly 3 times with exponential backoff
  
  - [ ]* 14.3 Write property test for job expiration
    - **Property 3: Job Expiration**
    - **Validates: Requirements 2.2, 48.1**
    - Test that pending jobs expire after 10 minutes
  
  - [ ]* 14.4 Write property test for job retention
    - **Property 4: Job Retention**
    - **Validates: Requirements 2.3, 49.1, 49.2**
    - Test that completed jobs are retained for 3 days then deleted
  
  - [ ]* 14.5 Write property test for VIN-source uniqueness
    - **Property 5: VIN-Source Uniqueness**
    - **Validates: Requirements 3.8**
    - Test that duplicate raw_data/normalized_data inserts update existing records
  
  - [ ]* 14.6 Write property test for normalization triggering stitching
    - **Property 6: Normalization Triggers Stitching**
    - **Validates: Requirements 11.7, 11.8**
    - Test that stitching job is enqueued when all required sources complete
  
  - [ ]* 14.7 Write property test for chronological event ordering
    - **Property 7: Chronological Event Ordering**
    - **Validates: Requirements 12.1, 38.1**
    - Test that timeline events are sorted by date in ascending order
  
  - [ ]* 14.8 Write property test for stable sort
    - **Property 8: Stable Sort for Same-Date Events**
    - **Validates: Requirements 38.2**
    - Test that events with identical dates maintain consistent order
  
  - [ ]* 14.9 Write property test for odometer rollback detection
    - **Property 9: Odometer Rollback Detection**
    - **Validates: Requirements 13.1, 13.2**
    - Test that decreasing mileage is flagged as "possible rollback"
  
  - [ ]* 14.10 Write property test for excessive mileage rate detection
    - **Property 10: Excessive Mileage Rate Detection**
    - **Validates: Requirements 13.3**
    - Test that mileage increases exceeding 50,000 miles/year are flagged
  
  - [ ]* 14.11 Write property test for gap detection
    - **Property 11: Gap Detection**
    - **Validates: Requirements 14.1**
    - Test that gaps of 18+ months are detected and included
  
  - [ ]* 14.12 Write property test for gap severity classification
    - **Property 12: Gap Severity Classification**
    - **Validates: Requirements 14.2**
    - Test that gaps >36 months are "high", 18-36 months are "medium"
  
  - [ ]* 14.13 Write property test for risk score range
    - **Property 13: Risk Score Range**
    - **Validates: Requirements 15.2**
    - Test that LLM risk scores are integers between 1 and 10
  
  - [ ]* 14.14 Write property test for report section completeness
    - **Property 14: Report Section Completeness**
    - **Validates: Requirements 16.1**
    - Test that exactly 9 sections are written for completed reports
  
  - [ ]* 14.15 Write property test for VIN length validation
    - **Property 15: VIN Length Validation**
    - **Validates: Requirements 19.2, 55.1**
    - Test that VINs not exactly 17 characters return HTTP 400
  
  - [ ]* 14.16 Write property test for invalid VIN character rejection
    - **Property 16: Invalid VIN Character Rejection**
    - **Validates: Requirements 55.3**
    - Test that VINs containing I, O, or Q are rejected
  
  - [ ]* 14.17 Write property test for valid VIN creates report
    - **Property 17: Valid VIN Creates Report**
    - **Validates: Requirements 19.3**
    - Test that valid VINs create report records with status "pending"
  
  - [ ]* 14.18 Write property test for duplicate photo prevention
    - **Property 18: Duplicate Photo Prevention**
    - **Validates: Requirements 47.1, 47.2**
    - Test that duplicate photo URLs don't create multiple records
  
  - [ ]* 14.19 Write property test for duplicate odometer reading prevention
    - **Property 19: Duplicate Odometer Reading Prevention**
    - **Validates: Requirements 57.1, 57.2**
    - Test that duplicate odometer readings don't create multiple records
  
  - [ ]* 14.20 Write property test for expected mileage calculation
    - **Property 20: Expected Mileage Calculation**
    - **Validates: Requirements 74.1**
    - Test that expected mileage = (current year - vehicle year) × 12,000
  
  - [ ]* 14.21 Write property test for photo chronological ordering
    - **Property 21: Photo Chronological Ordering**
    - **Validates: Requirements 75.1**
    - Test that photos are sorted by capture date ascending
  
  - [ ]* 14.22 Write property test for timeline schema conformance
    - **Property 22: Timeline Schema Conformance**
    - **Validates: Requirements 89.1, 89.2**
    - Test that stitched timelines conform to Timeline interface
  
  - [ ]* 14.23 Write property test for normalizer round-trip
    - **Property 23: Normalizer Round-Trip**
    - **Validates: Requirements 98.1**
    - Test that normalizing preserves essential information from raw data
  
  - [ ]* 14.24 Write property test for parser round-trip
    - **Property 24: Parser Round-Trip**
    - **Validates: Requirements 99.4**
    - Test that parsing HTML twice produces equivalent data
  
  - [ ]* 14.25 Write property test for fetch triggers normalization
    - **Property 25: Fetch Triggers Normalization**
    - **Validates: Requirements 4.6, 5.4, 6.3, 7.7, 8.7, 9.5, 10.4**
    - Test that successful fetches enqueue normalization jobs
  
  - [ ]* 14.26 Write property test for required sources block stitching
    - **Property 26: Required Sources Block Stitching**
    - **Validates: Requirements 63.3**
    - Test that stitcher waits for all required sources
  
  - [ ]* 14.27 Write property test for optional sources don't block stitching
    - **Property 27: Optional Sources Don't Block Stitching**
    - **Validates: Requirements 63.4, 63.5**
    - Test that stitcher runs without optional sources
  
  - [ ]* 14.28 Write unit tests for API endpoints
    - Test POST /api/report with valid and invalid VINs
    - Test GET /api/report with existing and non-existing VINs
    - Test GET /api/status/:vin
    - Test GET /api/report/:vin/odometer
    - Test GET /api/report/:vin/photos
    - Test GET /api/report/:vin/sections
    - Test GET /api/export/:vin
    - Test GET /api/health
  
  - [ ]* 14.29 Write unit tests for worker components
    - Test each fetcher worker with mock API responses
    - Test each scraper worker with mock HTML
    - Test each normalizer with sample raw data
    - Test stitcher with sample normalized data
    - Test LLM workers with mock Claude responses
  
  - [ ]* 14.30 Write integration tests for end-to-end pipeline
    - Test complete pipeline from VIN submission to report completion
    - Test pipeline with clean history VIN
    - Test pipeline with salvage title VIN
    - Test pipeline with high mileage VIN
    - Test pipeline with gap history VIN
    - Test pipeline with recall VIN


- [x] 15. Manual Testing and Validation - Create testing utilities
  - [x] 15.1 Create manual VIN testing script
    - Create scripts/test-vin.ts
    - Accept VIN as command line argument
    - Trigger report generation via API
    - Poll status endpoint until completion or failure
    - Display pipeline progress in real-time
    - Output final report or error message
    - _Requirements: 92.1-92.5_
  
  - [x] 15.2 Test with sample VINs
    - Test with clean history VIN (no accidents, no brands)
    - Test with salvage title VIN (auction history, damage)
    - Test with high mileage VIN (odometer anomaly detection)
    - Test with gap history VIN (18+ month gaps)
    - Test with recall VIN (open recalls)

- [ ] 16. Railway Deployment Configuration - Prepare for production deployment
  - [ ] 16.1 Create Railway configuration file
    - Create railway.toml with build and deploy settings
    - Configure web app service with build and start commands
    - Configure worker service with start command
    - Set healthcheck path to /api/health
    - Configure restart policy with max 3 retries
    - _Requirements: 27.1-27.6_
  
  - [ ] 16.2 Configure database migrations for deployment
    - Add migration command to deployment script
    - Ensure migrations run before starting services
    - _Requirements: 32.4_
  
  - [ ] 16.3 Document deployment process
    - Document environment variable setup
    - Document two-service deployment (web + worker)
    - Document database connection configuration
    - Document health check verification

- [ ] 17. Performance Optimization - Optimize for production
  - [ ] 17.1 Configure database connection pooling
    - Set max 20 concurrent connections
    - Set 30-second connection timeout
    - Add connection pool exhaustion logging
    - _Requirements: 64.1-64.5_
  
  - [ ] 17.2 Implement report caching
    - Return cached reports when status is "ready"
    - Don't re-fetch data for reports less than 30 days old
    - Support force refresh parameter
    - Update completedAt timestamp on refresh
    - _Requirements: 51.1-51.5_
  
  - [ ] 17.3 Implement HTML snapshot compression
    - Compress HTML snapshots exceeding 100KB with gzip
    - Decompress when re-parsing
    - Log compression ratio
    - Support disabling via environment variable
    - _Requirements: 95.1-95.5_
  
  - [ ] 17.4 Implement User-Agent rotation for scrapers
    - Maintain list of realistic User-Agent strings
    - Randomly select User-Agent for each scrape
    - Log User-Agent used
    - Support configuration via environment variables
    - _Requirements: 65.1-65.5_


- [ ] 18. Monitoring and Observability - Add production monitoring
  - [ ] 18.1 Implement LLM cost tracking
    - Log each LLM API call with model name and token count
    - Store model name in report_sections table
    - Calculate estimated cost based on Claude pricing
    - Create API endpoint for LLM usage statistics
    - Aggregate usage by date and model
    - _Requirements: 59.1-59.5_
  
  - [ ] 18.2 Implement report generation metrics
    - Track total generation time per report
    - Track time spent in each pipeline stage
    - Track number of retries per source
    - Create API endpoint to retrieve metrics
    - Aggregate metrics by date for trend analysis
    - _Requirements: 96.1-96.5_
  
  - [ ] 18.3 Implement queue monitoring
    - Create API endpoint for queue statistics
    - Return pending job count by job type
    - Return active job count by job type
    - Return failed job count by job type
    - Return average job completion time by job type
    - _Requirements: 97.1-97.5_
  
  - [ ] 18.4 Implement worker health monitoring
    - Expose health check endpoint for worker status
    - Implement queue connection reconnection with exponential backoff
    - _Requirements: 60.4, 60.5_

- [ ] 19. Advanced Features - Implement additional functionality
  - [ ] 19.1 Implement report regeneration
    - Create API endpoint to trigger regeneration
    - Reset report status to "pending"
    - Clear existing timeline and LLM analysis
    - Re-enqueue all fetch and scrape jobs
    - Preserve historical pipeline logs
    - _Requirements: 61.1-61.5_
  
  - [ ] 19.2 Implement API authentication (optional)
    - Add API key validation before processing requests
    - Return HTTP 401 for missing/invalid credentials
    - Support disabling authentication for development
    - Implement rate limiting per API key
    - Log all API requests with requester identifier
    - _Requirements: 50.1-50.5_
  
  - [ ] 19.3 Implement concurrent report generation
    - Configure concurrent fetch job processing
    - Configure concurrent scrape job processing with rate limiting
    - Configure concurrent normalization job processing
    - Support configurable concurrency limits via environment
    - _Requirements: 91.1-91.5, 100.1-100.5_

- [ ] 20. Final Checkpoint - Complete system validation
  - Ensure all tests pass, ask the user if questions arise.


## Notes

### Implementation Strategy

This implementation plan follows a bottom-up approach, building the foundation first and progressively adding layers:

1. **Foundation (Tasks 1-3)**: Set up dependencies, folder structure, database schema, and queue system
2. **Data Collection (Tasks 4-5)**: Implement all fetcher and scraper workers to gather raw data
3. **Data Processing (Tasks 6-8)**: Transform raw data into unified schema and stitch into timeline
4. **Intelligence Layer (Task 9)**: Add LLM analysis and section writing
5. **API Layer (Task 10)**: Expose functionality through REST endpoints
6. **Infrastructure (Tasks 11-12)**: Bootstrap workers and configure environment
7. **Quality Assurance (Tasks 14-15)**: Comprehensive testing and validation
8. **Production Readiness (Tasks 16-19)**: Deployment, optimization, and monitoring

### Key Design Decisions

**TypeScript Throughout**: All code is written in TypeScript for type safety and maintainability. The design document provides extensive TypeScript examples that should be followed.

**Preserve Existing Code**: The existing NHTSA client, mapper, and Puppeteer configuration should be wrapped in workers without rewriting. This preserves proven functionality.

**Worker-Based Architecture**: The separation between web app and worker process enables horizontal scaling and prevents long-running operations from blocking HTTP responses.

**Unified Normalization Schema**: All data sources transform to the same NormalizedVehicleRecord interface, enabling source-agnostic stitching logic.

**Required vs Optional Sources**: The system distinguishes between required sources (block stitching) and optional sources (enrich but don't block), enabling graceful degradation.

**LLM-Powered Analysis**: Claude generates plain English explanations for all report sections, making technical data accessible to non-technical buyers.

### Testing Approach

**Property-Based Tests**: 27 properties validate universal correctness guarantees across all inputs. These tests use fast-check with minimum 100 iterations.

**Unit Tests**: Validate specific examples, edge cases, and error conditions for each component.

**Integration Tests**: Verify end-to-end pipeline with real VINs covering different scenarios (clean history, salvage, high mileage, gaps, recalls).

**Manual Testing**: The test:vin script enables quick validation with specific VINs during development.

### Deployment Architecture

**Two Railway Services**:
- Web App: Serves HTTP requests, reads completed reports
- Worker Process: Executes background jobs, processes pipeline

**Shared Database**: Both services connect to the same PostgreSQL database on Railway

**Queue-Based Communication**: All communication between web app and workers happens through pg-boss job queue

**Horizontal Scaling**: Multiple worker instances can run concurrently, with the queue distributing jobs across all instances

### Performance Considerations

**Database Indexes**: All VIN columns are indexed for fast lookups. Composite indexes on (vin, source) ensure uniqueness.

**Connection Pooling**: Maximum 20 concurrent database connections per service prevents pool exhaustion.

**Report Caching**: Completed reports are cached for 30 days to avoid redundant processing.

**Scraper Rate Limiting**: teamSize and teamConcurrency settings prevent site overload and bot detection.

**HTML Snapshot Compression**: Large HTML snapshots are compressed with gzip to reduce storage costs.

**LLM Cost Optimization**: Claude Sonnet 4 provides balance of cost and quality. Token limits prevent excessive costs.

### Error Handling Strategy

**Automatic Retries**: All jobs retry up to 3 times with exponential backoff before permanent failure.

**Graceful Degradation**: Optional source failures don't block pipeline completion.

**Partial Reports**: Users can view partial data while generation continues.

**Detailed Logging**: All pipeline stages log progress, enabling debugging and monitoring.

**User-Friendly Errors**: Error messages are descriptive and actionable, avoiding internal details.

### Monitoring and Operations

**Health Checks**: Both services expose health check endpoints for Railway monitoring.

**Worker Heartbeats**: Workers log heartbeat every 60 seconds with active job count.

**Pipeline Logs**: All stages log to pipeline_log table for status tracking and debugging.

**LLM Cost Tracking**: All Claude API calls are logged with token counts and estimated costs.

**Queue Monitoring**: Queue statistics endpoint provides visibility into job processing.

**Generation Metrics**: Track time spent in each stage and retry counts for performance analysis.

### Migration Path

The implementation preserves all existing code and tables, enabling incremental migration:

1. Add new tables alongside existing ones
2. Deploy queue system (no user impact)
3. Deploy worker process (no user impact)
4. Update API routes to use queue (cutover point)
5. Deploy LLM workers (new functionality)

This approach minimizes risk and enables rollback at each step.

### Success Criteria

The implementation is complete when:

1. All 100 requirements are satisfied
2. All 27 correctness properties pass property-based tests
3. End-to-end integration tests pass with sample VINs
4. Manual testing with test:vin script succeeds
5. Both services deploy successfully to Railway
6. Health checks return 200 for both services
7. Complete report generation works end-to-end
8. LLM sections are written in plain English
9. Odometer anomalies and gaps are detected correctly
10. Photos are aggregated from all sources

### Reference Documents

- **Requirements**: `.kiro/specs/vehicle-history-platform-rebuild/requirements.md` (100 requirements)
- **Design**: `.kiro/specs/vehicle-history-platform-rebuild/design.md` (27 properties, complete architecture)
- **Dev Plan**: `docs/VEHICLE_HISTORY_DEV_PLAN.md` (implementation details, code examples)

All three documents should be consulted during implementation for complete context.
