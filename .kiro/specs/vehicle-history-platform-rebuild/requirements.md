# Requirements Document

## Introduction

This document specifies requirements for rebuilding the vehicle history platform from a synchronous monolithic system into a modern worker-based pipeline architecture. The system generates comprehensive vehicle history reports comparable to Carfax, with LLM-written sections, gap detection, odometer analysis, and photo aggregation from multiple data sources.

The platform consists of a SvelteKit web application and a separate worker process that share a PostgreSQL database. The worker pipeline fetches data from APIs, scrapes auction and listing sites, normalizes all data into a unified schema, stitches a chronological timeline, and uses Claude LLM to analyze and write report sections in plain English.

## Glossary

- **System**: The vehicle history platform (web app + worker process + database)
- **Web_App**: The SvelteKit application serving HTTP requests
- **Worker_Process**: The long-running process executing background jobs
- **Queue**: The pg-boss job queue system
- **Database**: The PostgreSQL database on Railway
- **Pipeline**: The complete data processing workflow from fetch to report completion
- **Fetcher_Worker**: A worker that calls external APIs to retrieve data
- **Scraper_Worker**: A worker that uses Puppeteer to extract data from websites
- **Normalizer_Worker**: A worker that transforms raw data into unified schema
- **Stitcher_Worker**: A worker that merges all normalized data into a timeline
- **LLM_Worker**: A worker that uses Claude to analyze data and write report sections
- **Report**: A complete vehicle history document for a single VIN
- **VIN**: Vehicle Identification Number (17-character unique identifier)
- **Timeline**: Chronologically ordered list of all vehicle events
- **Event**: A single occurrence in vehicle history (title transfer, auction, accident, etc.)
- **Gap**: A period of 18+ months with no recorded events
- **Odometer_Reading**: A mileage measurement at a specific date
- **Anomaly**: An odometer reading that indicates rollback or unusual mileage rate
- **Title_Brand**: A designation on a vehicle title (salvage, rebuilt, flood, etc.)
- **Raw_Data**: Unprocessed data as received from external sources
- **Normalized_Data**: Data transformed to conform to the unified schema
- **Report_Section**: An LLM-written explanation of one aspect of vehicle history
- **Source**: An external data provider (NHTSA, Copart, NMVTIS, etc.)
- **Required_Source**: A data source that must complete before stitching begins
- **Optional_Source**: A data source that enriches reports but doesn't block stitching

## Requirements

### Requirement 1: Architecture Separation

**User Story:** As a system administrator, I want the web server and worker process separated, so that long-running jobs do not block HTTP responses.

#### Acceptance Criteria

1. THE Web_App SHALL serve HTTP requests without executing data fetching or scraping operations
2. THE Worker_Process SHALL execute all data fetching, scraping, normalization, stitching, and LLM operations
3. THE Web_App SHALL communicate with THE Worker_Process exclusively through THE Queue
4. THE Web_App SHALL read completed reports from THE Database without triggering synchronous processing
5. WHEN THE System deploys to Railway, THE Web_App and THE Worker_Process SHALL run as separate services
6. THE Web_App and THE Worker_Process SHALL share THE Database connection string


### Requirement 2: Queue System Implementation

**User Story:** As a developer, I want a reliable job queue system, so that workers can process tasks asynchronously with automatic retries.

#### Acceptance Criteria

1. THE System SHALL use pg-boss as THE Queue implementation
2. THE Queue SHALL store job state in THE Database
3. WHEN a job fails, THE Queue SHALL retry the job up to 3 times with exponential backoff
4. THE Queue SHALL expire jobs that have not started within 10 minutes
5. THE Queue SHALL retain completed jobs for 3 days for debugging purposes
6. THE Queue SHALL emit error events that THE System logs

### Requirement 3: Database Schema Extension

**User Story:** As a developer, I want a comprehensive database schema, so that all vehicle history data can be stored and queried efficiently.

#### Acceptance Criteria

1. THE Database SHALL include a reports table storing VIN, status, timeline, and LLM analysis
2. THE Database SHALL include a raw_data table storing unprocessed data from each source per VIN
3. THE Database SHALL include a normalized_data table storing transformed data conforming to unified schema
4. THE Database SHALL include an odometer_readings table storing mileage measurements with anomaly flags
5. THE Database SHALL include a vehicle_photos table storing image URLs with source and date metadata
6. THE Database SHALL include a report_sections table storing LLM-written content per section per VIN
7. THE Database SHALL include a pipeline_log table tracking progress of each pipeline stage per VIN
8. THE Database SHALL enforce unique constraints on VIN-source combinations for raw_data and normalized_data
9. THE Database SHALL use Drizzle ORM for schema definition and migrations
10. WHEN THE System adds new tables, THE Database SHALL preserve all existing tables

### Requirement 4: NHTSA Data Fetching

**User Story:** As a system, I want to fetch vehicle specifications from NHTSA, so that reports include accurate manufacturer data.

#### Acceptance Criteria

1. WHEN a report is requested, THE Fetcher_Worker SHALL call the NHTSA VIN decode API
2. WHEN a report is requested, THE Fetcher_Worker SHALL call the NHTSA recalls API
3. THE Fetcher_Worker SHALL store NHTSA decode response in THE Database as Raw_Data
4. THE Fetcher_Worker SHALL store NHTSA recalls response in THE Database as Raw_Data
5. WHEN NHTSA API returns HTTP 503, THE Fetcher_Worker SHALL retry after 1 second delay
6. WHEN NHTSA API calls complete, THE Fetcher_Worker SHALL enqueue normalization jobs
7. THE Fetcher_Worker SHALL reuse existing NHTSA client logic without rewriting

### Requirement 5: NMVTIS Data Fetching

**User Story:** As a system, I want to fetch title history from NMVTIS, so that reports include official title transfer records.

#### Acceptance Criteria

1. WHEN a report is requested, THE Fetcher_Worker SHALL call THE NMVTIS provider API with the VIN
2. THE Fetcher_Worker SHALL authenticate using THE NMVTIS API key from environment variables
3. THE Fetcher_Worker SHALL store NMVTIS response in THE Database as Raw_Data
4. WHEN NMVTIS API call completes, THE Fetcher_Worker SHALL enqueue a normalization job
5. THE System SHALL support NMVTIS provider configuration via environment variables


### Requirement 6: NICB Theft Data Fetching

**User Story:** As a system, I want to check theft records via NICB, so that reports flag stolen vehicles.

#### Acceptance Criteria

1. WHEN a report is requested, THE Fetcher_Worker SHALL call THE NICB VINCheck API
2. THE Fetcher_Worker SHALL store NICB response in THE Database as Raw_Data
3. WHEN NICB API call completes, THE Fetcher_Worker SHALL enqueue a normalization job
4. THE Fetcher_Worker SHALL include a User-Agent header to avoid bot detection

### Requirement 7: Copart Auction Scraping

**User Story:** As a system, I want to scrape Copart auction history, so that reports include salvage records and damage photos.

#### Acceptance Criteria

1. WHEN a report is requested, THE Scraper_Worker SHALL search Copart by VIN using Puppeteer
2. THE Scraper_Worker SHALL use puppeteer-extra with stealth plugin to avoid detection
3. THE Scraper_Worker SHALL extract lot number, sale date, odometer, damage description, and images
4. THE Scraper_Worker SHALL store extracted data in THE Database as Raw_Data
5. THE Scraper_Worker SHALL store the complete HTML snapshot in THE Database for re-parsing
6. THE Scraper_Worker SHALL store each image URL in THE vehicle_photos table
7. WHEN Copart scraping completes, THE Scraper_Worker SHALL enqueue a normalization job
8. THE Scraper_Worker SHALL run with teamSize of 2 and teamConcurrency of 1 to limit load

### Requirement 8: IAAI Auction Scraping

**User Story:** As a system, I want to scrape IAAI auction history, so that reports include insurance auction records.

#### Acceptance Criteria

1. WHEN a report is requested, THE Scraper_Worker SHALL search IAAI by VIN using Puppeteer
2. THE Scraper_Worker SHALL use puppeteer-extra with stealth plugin to avoid detection
3. THE Scraper_Worker SHALL extract stock number, sale date, mileage, damage type, and images
4. THE Scraper_Worker SHALL store extracted data in THE Database as Raw_Data
5. THE Scraper_Worker SHALL store the complete HTML snapshot in THE Database for re-parsing
6. THE Scraper_Worker SHALL store each image URL in THE vehicle_photos table
7. WHEN IAAI scraping completes, THE Scraper_Worker SHALL enqueue a normalization job

### Requirement 9: AutoTrader Listing Scraping

**User Story:** As a system, I want to scrape AutoTrader listings, so that reports include market pricing data.

#### Acceptance Criteria

1. WHEN a report is requested, THE Scraper_Worker SHALL search AutoTrader by VIN using Puppeteer
2. THE Scraper_Worker SHALL extract price, mileage, dealer, location, and listing images
3. THE Scraper_Worker SHALL store extracted data in THE Database as Raw_Data
4. THE Scraper_Worker SHALL store listing images in THE vehicle_photos table
5. WHEN AutoTrader scraping completes, THE Scraper_Worker SHALL enqueue a normalization job
6. IF AutoTrader scraping fails after 3 retries, THE Pipeline SHALL continue without blocking stitching

### Requirement 10: CarGurus Price Scraping

**User Story:** As a system, I want to scrape CarGurus price ratings, so that reports include market value assessments.

#### Acceptance Criteria

1. WHEN a report is requested, THE Scraper_Worker SHALL search CarGurus by VIN using Puppeteer
2. THE Scraper_Worker SHALL extract current price, price rating, market average, and days on market
3. THE Scraper_Worker SHALL store extracted data in THE Database as Raw_Data
4. WHEN CarGurus scraping completes, THE Scraper_Worker SHALL enqueue a normalization job
5. IF CarGurus scraping fails after 3 retries, THE Pipeline SHALL continue without blocking stitching


### Requirement 11: Data Normalization

**User Story:** As a developer, I want all data sources normalized to a unified schema, so that the stitcher can merge data without source-specific logic.

#### Acceptance Criteria

1. THE Normalizer_Worker SHALL transform Raw_Data into Normalized_Data conforming to NormalizedVehicleRecord interface
2. THE Normalizer_Worker SHALL extract vehicle identity fields (year, make, model, trim, etc.) when present
3. THE Normalizer_Worker SHALL extract events with type, date, source, and description fields
4. THE Normalizer_Worker SHALL extract odometer readings with date, mileage, and source fields
5. THE Normalizer_Worker SHALL extract title brands when present
6. THE Normalizer_Worker SHALL store Normalized_Data in THE Database with VIN-source unique constraint
7. WHEN normalization completes, THE Normalizer_Worker SHALL check if all Required_Sources are complete
8. WHEN all Required_Sources are complete, THE Normalizer_Worker SHALL enqueue a stitching job
9. THE System SHALL provide separate normalizer functions for each source type

### Requirement 12: Timeline Stitching

**User Story:** As a system, I want all normalized data merged into a chronological timeline, so that reports present a complete vehicle history.

#### Acceptance Criteria

1. WHEN all Required_Sources are normalized, THE Stitcher_Worker SHALL merge all events into chronological order
2. THE Stitcher_Worker SHALL use NHTSA decode data as authoritative for vehicle identity
3. THE Stitcher_Worker SHALL merge odometer readings from all sources into a single sorted list
4. THE Stitcher_Worker SHALL merge title history from NMVTIS
5. THE Stitcher_Worker SHALL merge damage records from Copart and IAAI
6. THE Stitcher_Worker SHALL merge market value data from AutoTrader and CarGurus
7. THE Stitcher_Worker SHALL store the complete timeline in THE reports table
8. THE Stitcher_Worker SHALL update report status to analyzing
9. WHEN stitching completes, THE Stitcher_Worker SHALL enqueue an LLM analysis job

### Requirement 13: Odometer Anomaly Detection

**User Story:** As a buyer, I want odometer rollbacks and unusual mileage patterns flagged, so that I can identify potential fraud.

#### Acceptance Criteria

1. WHEN THE Stitcher_Worker processes odometer readings, THE System SHALL detect mileage decreases
2. WHEN mileage decreases between consecutive readings, THE System SHALL flag the reading as an anomaly with note "possible rollback"
3. WHEN mileage increases at a rate exceeding 50,000 miles per year, THE System SHALL flag the reading as an anomaly
4. THE System SHALL store anomaly flags and notes in THE odometer_readings table
5. THE System SHALL calculate expected mileage based on 12,000 miles per year average

### Requirement 14: History Gap Detection

**User Story:** As a buyer, I want unexplained gaps in vehicle history identified, so that I can investigate missing periods.

#### Acceptance Criteria

1. WHEN THE Stitcher_Worker processes events, THE System SHALL detect gaps exceeding 18 months between consecutive events
2. WHEN a gap exceeds 36 months, THE System SHALL classify the gap severity as high
3. WHEN a gap is between 18 and 36 months, THE System SHALL classify the gap severity as medium
4. WHEN the last recorded event is more than 18 months ago, THE System SHALL create a gap to present date
5. THE System SHALL store detected gaps in the timeline with start date, end date, and severity


### Requirement 15: LLM Analysis

**User Story:** As a buyer, I want an AI-powered risk assessment, so that I can quickly understand the vehicle's condition.

#### Acceptance Criteria

1. WHEN stitching completes, THE LLM_Worker SHALL analyze the complete timeline using Claude
2. THE LLM_Worker SHALL calculate a risk score from 1 to 10
3. THE LLM_Worker SHALL generate a verdict of buy, caution, or avoid
4. THE LLM_Worker SHALL provide 2-3 sentences explaining the verdict reasoning
5. THE LLM_Worker SHALL identify top flags with severity levels (high, medium, low)
6. THE LLM_Worker SHALL analyze each detected gap with likely explanation and buyer concern level
7. THE LLM_Worker SHALL provide plain English odometer assessment
8. THE LLM_Worker SHALL provide plain English title assessment
9. THE LLM_Worker SHALL store analysis results in THE reports table
10. WHEN LLM analysis completes, THE LLM_Worker SHALL enqueue a section writing job

### Requirement 16: LLM Report Section Writing

**User Story:** As a buyer, I want report sections written in plain English, so that I can understand the vehicle history without technical knowledge.

#### Acceptance Criteria

1. WHEN LLM analysis completes, THE LLM_Worker SHALL write 9 report sections using Claude
2. THE LLM_Worker SHALL write a summary section with 3-sentence buyer overview
3. THE LLM_Worker SHALL write an ownership history section explaining owner count and patterns
4. THE LLM_Worker SHALL write an accident analysis section explaining damage severity and implications
5. THE LLM_Worker SHALL write an odometer analysis section comparing actual vs expected mileage
6. THE LLM_Worker SHALL write a title history section explaining any title brands
7. THE LLM_Worker SHALL write a recall status section listing open and closed recalls
8. THE LLM_Worker SHALL write a market value section assessing asking price fairness
9. THE LLM_Worker SHALL write a gap analysis section explaining each unexplained period
10. THE LLM_Worker SHALL write a buyers checklist section with 8 specific inspection items
11. THE LLM_Worker SHALL store each section in THE report_sections table with VIN and section key
12. THE LLM_Worker SHALL use claude-sonnet-4-20250514 model
13. WHEN all sections are written, THE LLM_Worker SHALL update report status to ready

### Requirement 17: Photo Aggregation

**User Story:** As a buyer, I want to see historical photos of the vehicle, so that I can assess its condition over time.

#### Acceptance Criteria

1. WHEN scraper workers extract images, THE System SHALL store each image URL in THE vehicle_photos table
2. THE System SHALL store image source (copart, iaai, autotrader, cargurus)
3. THE System SHALL store image capture date when available
4. THE System SHALL store auction lot ID when applicable
5. THE System SHALL store photo type (auction_condition, listing, etc.)
6. THE Web_App SHALL provide an API endpoint to retrieve photos grouped by source
7. THE Web_App SHALL provide an API endpoint to retrieve the 6 most recent photos

### Requirement 18: Odometer Graph Data

**User Story:** As a buyer, I want to see a visual graph of mileage over time, so that I can identify trends and anomalies.

#### Acceptance Criteria

1. THE Web_App SHALL provide an API endpoint returning odometer readings sorted by date
2. THE API endpoint SHALL return date, mileage, source, and anomaly flag for each reading
3. THE API endpoint SHALL calculate an expected mileage line based on 12,000 miles per year
4. THE API endpoint SHALL return anomalous readings separately for highlighting
5. THE API endpoint SHALL format dates as ISO strings and mileage as integers


### Requirement 19: Report Triggering API

**User Story:** As a user, I want to request a vehicle history report, so that the system generates a comprehensive analysis.

#### Acceptance Criteria

1. THE Web_App SHALL provide a POST endpoint accepting VIN in request body
2. WHEN VIN length is not 17 characters, THE Web_App SHALL return HTTP 400 error
3. WHEN a valid VIN is received, THE Web_App SHALL create a report record with status pending
4. THE Web_App SHALL enqueue jobs for all Required_Sources in parallel
5. THE Web_App SHALL enqueue jobs for all Optional_Sources in parallel
6. THE Web_App SHALL update report status to fetching
7. THE Web_App SHALL return HTTP 200 with status processing message

### Requirement 20: Report Retrieval API

**User Story:** As a user, I want to retrieve a completed report, so that I can view the vehicle history.

#### Acceptance Criteria

1. THE Web_App SHALL provide a GET endpoint accepting VIN as query parameter
2. WHEN VIN is not provided, THE Web_App SHALL return HTTP 400 error
3. WHEN report does not exist, THE Web_App SHALL return HTTP 404 error
4. WHEN report exists, THE Web_App SHALL return the complete report record including timeline and LLM analysis
5. THE Web_App SHALL return report status (pending, fetching, normalizing, stitching, analyzing, ready, failed)

### Requirement 21: Pipeline Status API

**User Story:** As a user, I want to check report generation progress, so that I know when the report will be ready.

#### Acceptance Criteria

1. THE Web_App SHALL provide a GET endpoint accepting VIN as path parameter
2. THE Web_App SHALL return overall report status
3. THE Web_App SHALL return completion status for each pipeline stage
4. THE Web_App SHALL return the 20 most recent log entries for the VIN
5. THE Web_App SHALL query THE pipeline_log table ordered by timestamp descending

### Requirement 22: Pipeline Progress Logging

**User Story:** As a developer, I want detailed pipeline logs, so that I can debug failures and monitor progress.

#### Acceptance Criteria

1. WHEN a worker starts processing, THE System SHALL insert a log entry with status started
2. WHEN a worker completes successfully, THE System SHALL insert a log entry with status completed
3. WHEN a worker fails, THE System SHALL insert a log entry with status failed and error message
4. THE System SHALL log stage name, VIN, status, message, and timestamp for each entry
5. THE System SHALL retain pipeline logs indefinitely for historical analysis

### Requirement 23: Error Handling and Retries

**User Story:** As a system administrator, I want automatic retry logic, so that transient failures do not require manual intervention.

#### Acceptance Criteria

1. WHEN a worker throws an error, THE Queue SHALL retry the job up to 3 times
2. THE Queue SHALL apply exponential backoff between retries (30 seconds base delay)
3. WHEN a Required_Source fails after 3 retries, THE System SHALL mark the report as failed
4. WHEN an Optional_Source fails after 3 retries, THE Pipeline SHALL continue without that source
5. THE System SHALL log all retry attempts to THE pipeline_log table


### Requirement 24: Raw HTML Snapshot Storage

**User Story:** As a developer, I want raw HTML snapshots stored, so that I can re-parse data if site layouts change without re-scraping.

#### Acceptance Criteria

1. WHEN a scraper worker extracts data, THE System SHALL store the complete HTML response
2. THE System SHALL store HTML snapshots in THE raw_data table rawHtml column
3. THE System SHALL associate HTML snapshots with VIN and source
4. THE System SHALL enable re-parsing from snapshots without network requests

### Requirement 25: Worker Process Bootstrap

**User Story:** As a system administrator, I want all workers registered at startup, so that the system can process jobs immediately.

#### Acceptance Criteria

1. THE Worker_Process SHALL register all fetcher workers on startup
2. THE Worker_Process SHALL register all scraper workers on startup
3. THE Worker_Process SHALL register the normalizer worker on startup
4. THE Worker_Process SHALL register the stitcher worker on startup
5. THE Worker_Process SHALL register the LLM analysis worker on startup
6. THE Worker_Process SHALL register the LLM section writing worker on startup
7. THE Worker_Process SHALL log successful registration of each worker
8. WHEN registration fails, THE Worker_Process SHALL exit with error code 1

### Requirement 26: Environment Configuration

**User Story:** As a system administrator, I want environment-based configuration, so that I can deploy to different environments without code changes.

#### Acceptance Criteria

1. THE System SHALL read DATABASE_URL from environment variables
2. THE System SHALL read ANTHROPIC_API_KEY from environment variables
3. THE System SHALL read NMVTIS_API_URL from environment variables
4. THE System SHALL read NMVTIS_API_KEY from environment variables
5. THE System SHALL read NODE_ENV from environment variables
6. THE System SHALL support optional NICB_API_KEY from environment variables
7. THE System SHALL support optional worker concurrency settings from environment variables

### Requirement 27: Railway Deployment

**User Story:** As a system administrator, I want the system deployable to Railway, so that I can run it in production.

#### Acceptance Criteria

1. THE System SHALL support deployment as two separate Railway services
2. THE Web_App service SHALL run the SvelteKit build command
3. THE Worker_Process service SHALL run the workers bootstrap script
4. BOTH services SHALL connect to the same Railway PostgreSQL database
5. THE System SHALL run database migrations before starting services
6. THE System SHALL support single-service deployment for development environments

### Requirement 28: Graceful Shutdown

**User Story:** As a system administrator, I want graceful shutdown handling, so that in-flight jobs complete before process termination.

#### Acceptance Criteria

1. WHEN THE Worker_Process receives SIGTERM signal, THE System SHALL log shutdown message
2. WHEN THE Worker_Process receives SIGTERM signal, THE System SHALL allow current jobs to complete
3. WHEN THE Worker_Process receives SIGTERM signal, THE System SHALL exit with code 0 after cleanup
4. THE Queue SHALL not accept new jobs during shutdown


### Requirement 29: Folder Structure Reorganization

**User Story:** As a developer, I want a clear folder structure, so that I can locate code quickly and understand system organization.

#### Acceptance Criteria

1. THE System SHALL organize server code under src/lib/server with db, queue, and report subdirectories
2. THE System SHALL organize worker code under workers/ with fetchers, scrapers, and normalizers subdirectories
3. THE System SHALL place database schema in src/lib/server/db/schema.ts
4. THE System SHALL place queue configuration in src/lib/server/queue/index.ts
5. THE System SHALL place job name constants in src/lib/server/queue/job-names.ts
6. THE System SHALL place shared types in src/lib/shared/types.ts
7. THE System SHALL place worker bootstrap in workers/index.ts
8. THE System SHALL preserve existing code in src/lib/server/vehicle/ directory

### Requirement 30: Dependency Installation

**User Story:** As a developer, I want all required dependencies installed, so that the system has access to necessary libraries.

#### Acceptance Criteria

1. THE System SHALL include pg-boss for queue management
2. THE System SHALL include @anthropic-ai/sdk for LLM integration
3. THE System SHALL include got for HTTP requests
4. THE System SHALL include puppeteer-extra for web scraping
5. THE System SHALL include puppeteer-extra-plugin-stealth for bot detection avoidance
6. THE System SHALL include concurrently for running multiple processes in development
7. THE System SHALL include tsx for TypeScript execution
8. THE System SHALL preserve all existing dependencies

### Requirement 31: Development Workflow

**User Story:** As a developer, I want to run the web app and workers concurrently in development, so that I can test the full system locally.

#### Acceptance Criteria

1. THE System SHALL provide a dev script that runs both web app and workers
2. THE dev script SHALL use concurrently to run vite dev and tsx workers/index.ts
3. THE System SHALL provide a workers script for running workers standalone
4. THE System SHALL provide a workers:prod script for production worker execution
5. THE System SHALL provide a test:vin script for manual VIN testing

### Requirement 32: Database Migration Management

**User Story:** As a developer, I want automated database migrations, so that schema changes deploy reliably.

#### Acceptance Criteria

1. THE System SHALL use drizzle-kit for migration generation
2. THE System SHALL provide a db:generate script to create migrations from schema changes
3. THE System SHALL provide a db:migrate script to apply pending migrations
4. THE System SHALL run migrations before starting production services
5. THE System SHALL preserve all existing database tables during migration

### Requirement 33: Existing Code Preservation

**User Story:** As a developer, I want existing NHTSA logic preserved, so that proven functionality is not lost during refactoring.

#### Acceptance Criteria

1. THE System SHALL wrap existing NHTSA decode logic in a fetcher worker without rewriting
2. THE System SHALL wrap existing NHTSA mapper logic in a normalizer without rewriting
3. THE System SHALL preserve existing Puppeteer configuration and extend it with stealth plugin
4. THE System SHALL preserve existing docx generation for report exports
5. THE System SHALL preserve existing type definitions in src/lib/server/vehicle/types.ts


### Requirement 34: Report Section Retrieval

**User Story:** As a user, I want to retrieve individual report sections, so that I can display them in the UI progressively.

#### Acceptance Criteria

1. THE Web_App SHALL provide an API endpoint to retrieve all sections for a VIN
2. THE Web_App SHALL return section key, content, generation timestamp, and model used
3. THE Web_App SHALL return sections ordered by a predefined display sequence
4. WHEN sections do not exist, THE Web_App SHALL return an empty array
5. THE Web_App SHALL support filtering by section key via query parameter

### Requirement 35: Scraper Resilience

**User Story:** As a developer, I want scrapers to handle missing elements gracefully, so that layout changes do not crash workers.

#### Acceptance Criteria

1. WHEN a scraper queries a DOM element that does not exist, THE System SHALL return null instead of throwing
2. THE System SHALL wrap all page.evaluate calls in try-catch blocks
3. THE System SHALL log selector failures without failing the entire scrape job
4. WHEN critical data is missing, THE System SHALL store partial results and mark success as false
5. THE System SHALL continue processing other elements when one element extraction fails

### Requirement 36: Scraper Concurrency Control

**User Story:** As a system administrator, I want scraper concurrency limited, so that external sites are not overloaded.

#### Acceptance Criteria

1. THE Copart scraper SHALL run with teamSize of 2 and teamConcurrency of 1
2. THE IAAI scraper SHALL run with teamSize of 2 and teamConcurrency of 1
3. THE AutoTrader scraper SHALL run with default concurrency settings
4. THE CarGurus scraper SHALL run with default concurrency settings
5. THE System SHALL support configurable concurrency via environment variables

### Requirement 37: Report Status Transitions

**User Story:** As a user, I want to track report generation progress, so that I know what stage the system is processing.

#### Acceptance Criteria

1. WHEN a report is created, THE System SHALL set status to pending
2. WHEN fetch jobs are enqueued, THE System SHALL set status to fetching
3. WHEN normalization begins, THE System SHALL set status to normalizing
4. WHEN stitching begins, THE System SHALL set status to stitching
5. WHEN LLM analysis begins, THE System SHALL set status to analyzing
6. WHEN all sections are written, THE System SHALL set status to ready
7. WHEN any Required_Source fails permanently, THE System SHALL set status to failed
8. THE System SHALL update the updatedAt timestamp on every status change

### Requirement 38: Timeline Event Ordering

**User Story:** As a buyer, I want events displayed chronologically, so that I can understand the vehicle's history sequence.

#### Acceptance Criteria

1. THE Stitcher_Worker SHALL sort all events by date in ascending order
2. WHEN events have the same date, THE System SHALL maintain source order (NHTSA, NMVTIS, auctions, listings)
3. THE System SHALL store events as an array in the timeline JSON field
4. THE System SHALL include event type, date, source, description, and full data for each event
5. THE System SHALL filter out events with missing or invalid dates


### Requirement 39: Vehicle Identity Resolution

**User Story:** As a system, I want authoritative vehicle identity data, so that reports display accurate specifications.

#### Acceptance Criteria

1. THE Stitcher_Worker SHALL use NHTSA decode data as the authoritative source for vehicle identity
2. THE System SHALL extract year, make, model, trim, body style, engine, drivetrain, and fuel type from NHTSA
3. WHEN NHTSA data is incomplete, THE System SHALL use null values rather than guessing
4. THE System SHALL store vehicle identity fields directly in the reports table for query performance
5. THE System SHALL include complete identity data in the timeline JSON for LLM analysis

### Requirement 40: Market Value Aggregation

**User Story:** As a buyer, I want market value data from multiple sources, so that I can assess fair pricing.

#### Acceptance Criteria

1. THE Stitcher_Worker SHALL merge AutoTrader listing price into market value object
2. THE Stitcher_Worker SHALL merge CarGurus price rating into market value object
3. THE Stitcher_Worker SHALL merge CarGurus market average into market value object
4. THE Stitcher_Worker SHALL merge CarGurus days on market into market value object
5. WHEN market value sources are unavailable, THE System SHALL store null values
6. THE System SHALL pass market value data to THE LLM_Worker for analysis

### Requirement 41: Damage Record Aggregation

**User Story:** As a buyer, I want all damage records consolidated, so that I can assess the vehicle's accident history.

#### Acceptance Criteria

1. THE Stitcher_Worker SHALL merge damage records from Copart into a single array
2. THE Stitcher_Worker SHALL merge damage records from IAAI into the same array
3. THE System SHALL include primary damage, secondary damage, title code, and date for each record
4. THE System SHALL pass damage records to THE LLM_Worker for accident analysis
5. WHEN no damage records exist, THE System SHALL store an empty array

### Requirement 42: Title Brand Identification

**User Story:** As a buyer, I want title brands clearly identified, so that I can assess title status risks.

#### Acceptance Criteria

1. THE Stitcher_Worker SHALL extract title brands from NMVTIS data
2. THE System SHALL store title brands as an array of strings (salvage, rebuilt, flood, lemon, etc.)
3. THE System SHALL pass title brands to THE LLM_Worker for title assessment
4. WHEN no title brands exist, THE System SHALL store an empty array
5. THE System SHALL include title brand information in the timeline events

### Requirement 43: Recall Data Aggregation

**User Story:** As a buyer, I want all safety recalls listed, so that I can verify they have been addressed.

#### Acceptance Criteria

1. THE Stitcher_Worker SHALL extract recalls from NHTSA recalls data
2. THE System SHALL include campaign number, component, summary, consequence, remedy, and report date for each recall
3. THE System SHALL pass recalls to THE LLM_Worker for recall status analysis
4. WHEN no recalls exist, THE System SHALL store an empty array
5. THE System SHALL distinguish between open and closed recalls in LLM analysis


### Requirement 44: Source Coverage Tracking

**User Story:** As a developer, I want to know which sources contributed data, so that I can identify coverage gaps.

#### Acceptance Criteria

1. THE Stitcher_Worker SHALL record all sources that provided normalized data
2. THE System SHALL store source names in the timeline sourcesCovered array
3. THE System SHALL include sourcesCovered in API responses
4. THE System SHALL enable filtering reports by source coverage
5. THE System SHALL log missing Required_Sources as warnings

### Requirement 45: LLM Prompt Engineering

**User Story:** As a developer, I want well-structured LLM prompts, so that generated content is accurate and useful.

#### Acceptance Criteria

1. THE LLM_Worker SHALL provide complete timeline data in JSON format to Claude
2. THE LLM_Worker SHALL specify expected response structure in prompts
3. THE LLM_Worker SHALL request plain English explanations without jargon
4. THE LLM_Worker SHALL request specific dates and numbers in responses
5. THE LLM_Worker SHALL limit response length to 1000 tokens per section
6. THE LLM_Worker SHALL parse JSON responses and handle parse errors gracefully

### Requirement 46: LLM Response Validation

**User Story:** As a developer, I want LLM responses validated, so that malformed responses do not break the system.

#### Acceptance Criteria

1. WHEN Claude returns non-JSON text, THE System SHALL store the raw text with a parse error flag
2. WHEN Claude returns JSON with missing fields, THE System SHALL use null values for missing fields
3. THE System SHALL log LLM response parse failures to THE pipeline_log table
4. THE System SHALL not fail the entire report when one section fails to generate
5. THE System SHALL retry section generation on transient API errors

### Requirement 47: Photo Deduplication

**User Story:** As a system, I want duplicate photos prevented, so that storage is efficient and UI is clean.

#### Acceptance Criteria

1. THE System SHALL use onConflictDoNothing when inserting vehicle photos
2. THE System SHALL consider photos with identical URLs as duplicates
3. THE System SHALL preserve the earliest capture date when duplicates are detected
4. THE System SHALL allow the same photo from different sources if URLs differ
5. THE System SHALL not fail scraping jobs when duplicate photos are encountered

### Requirement 48: Job Expiration

**User Story:** As a system administrator, I want stale jobs expired, so that the queue does not accumulate abandoned work.

#### Acceptance Criteria

1. THE Queue SHALL expire jobs that have not started within 10 minutes
2. THE Queue SHALL log expired jobs to THE pipeline_log table
3. THE Queue SHALL not retry expired jobs
4. THE System SHALL allow manual re-triggering of expired reports
5. THE Queue SHALL clean up expired job records after 3 days

### Requirement 49: Completed Job Retention

**User Story:** As a developer, I want completed jobs retained temporarily, so that I can debug issues.

#### Acceptance Criteria

1. THE Queue SHALL retain completed jobs for 3 days
2. THE Queue SHALL delete completed jobs older than 3 days automatically
3. THE System SHALL allow querying completed jobs within the retention period
4. THE System SHALL log job deletion events
5. THE Queue SHALL retain failed jobs for 7 days for extended debugging


### Requirement 50: API Authentication

**User Story:** As a system administrator, I want API endpoints protected, so that unauthorized users cannot trigger expensive operations.

#### Acceptance Criteria

1. WHERE authentication is enabled, THE Web_App SHALL validate API keys before processing requests
2. WHERE authentication is enabled, THE Web_App SHALL return HTTP 401 for missing or invalid credentials
3. THE System SHALL support disabling authentication for development environments
4. THE System SHALL rate limit report generation requests per API key
5. THE System SHALL log all API requests with timestamp and requester identifier

### Requirement 51: Report Caching

**User Story:** As a system administrator, I want reports cached, so that repeated requests do not waste resources.

#### Acceptance Criteria

1. WHEN a report exists with status ready, THE Web_App SHALL return the cached report
2. WHEN a report is less than 30 days old, THE System SHALL not re-fetch data
3. WHEN a report is more than 30 days old, THE System SHALL allow manual refresh
4. THE System SHALL provide a force refresh parameter to bypass cache
5. THE System SHALL update the completedAt timestamp when reports are refreshed

### Requirement 52: DOCX Export

**User Story:** As a user, I want to export reports as DOCX files, so that I can save them offline.

#### Acceptance Criteria

1. THE Web_App SHALL provide an API endpoint to generate DOCX exports
2. THE System SHALL use existing docx generation logic for exports
3. THE System SHALL include all report sections in the DOCX file
4. THE System SHALL include odometer graph as an embedded image
5. THE System SHALL include vehicle photos in the DOCX file
6. THE System SHALL return DOCX file with appropriate Content-Type header

### Requirement 53: Error Response Formatting

**User Story:** As a frontend developer, I want consistent error responses, so that I can display meaningful messages to users.

#### Acceptance Criteria

1. WHEN an error occurs, THE Web_App SHALL return JSON with error message and status code
2. THE Web_App SHALL use HTTP 400 for client errors (invalid input)
3. THE Web_App SHALL use HTTP 404 for not found errors
4. THE Web_App SHALL use HTTP 500 for server errors
5. THE Web_App SHALL include error details in development mode only

### Requirement 54: Normalizer Registry

**User Story:** As a developer, I want normalizers registered centrally, so that adding new sources requires minimal changes.

#### Acceptance Criteria

1. THE System SHALL maintain a normalizer map in workers/normalizers/index.ts
2. THE System SHALL map source names to normalizer functions
3. WHEN a source has no registered normalizer, THE System SHALL throw an error
4. THE System SHALL allow adding new normalizers by updating the map
5. THE System SHALL validate that all Required_Sources have registered normalizers on startup

### Requirement 55: VIN Validation

**User Story:** As a system, I want VINs validated before processing, so that invalid requests are rejected early.

#### Acceptance Criteria

1. WHEN a VIN is received, THE System SHALL verify it is exactly 17 characters
2. THE System SHALL verify VIN contains only alphanumeric characters
3. THE System SHALL reject VINs containing I, O, or Q characters (invalid per VIN standard)
4. THE System SHALL return HTTP 400 with descriptive error for invalid VINs
5. THE System SHALL provide a VIN validation utility function in src/lib/shared/vin-utils.ts


### Requirement 56: Puppeteer Configuration

**User Story:** As a developer, I want Puppeteer configured for production, so that scrapers run reliably in containerized environments.

#### Acceptance Criteria

1. THE System SHALL launch Puppeteer in headless mode
2. THE System SHALL pass --no-sandbox and --disable-setuid-sandbox arguments for container compatibility
3. THE System SHALL set a realistic User-Agent header to avoid bot detection
4. THE System SHALL use puppeteer-extra-plugin-stealth for all scrapers
5. THE System SHALL set page timeout to 30 seconds
6. THE System SHALL wait for networkidle2 before extracting data
7. THE System SHALL close browser instances after each scrape to prevent memory leaks

### Requirement 57: Odometer Reading Deduplication

**User Story:** As a system, I want duplicate odometer readings prevented, so that graphs are accurate.

#### Acceptance Criteria

1. THE System SHALL use onConflictDoNothing when inserting odometer readings
2. THE System SHALL consider readings with identical VIN, date, and mileage as duplicates
3. THE System SHALL preserve the first inserted reading when duplicates are detected
4. THE System SHALL allow multiple readings on the same date if mileage differs
5. THE System SHALL not fail stitching when duplicate readings are encountered

### Requirement 58: Timeline Completeness Indicator

**User Story:** As a buyer, I want to know if the timeline is complete, so that I can assess data reliability.

#### Acceptance Criteria

1. THE System SHALL indicate which Required_Sources completed successfully
2. THE System SHALL indicate which Optional_Sources completed successfully
3. THE System SHALL flag Required_Sources that failed after retries
4. THE System SHALL include source completion status in API responses
5. THE System SHALL display a completeness percentage in the UI

### Requirement 59: LLM Cost Tracking

**User Story:** As a system administrator, I want LLM usage tracked, so that I can monitor API costs.

#### Acceptance Criteria

1. THE System SHALL log each LLM API call with model name and token count
2. THE System SHALL store model name in THE report_sections table
3. THE System SHALL provide an API endpoint to retrieve LLM usage statistics
4. THE System SHALL calculate estimated cost based on Claude pricing
5. THE System SHALL aggregate usage by date and model

### Requirement 60: Worker Health Monitoring

**User Story:** As a system administrator, I want worker health monitored, so that I can detect failures quickly.

#### Acceptance Criteria

1. THE Worker_Process SHALL log heartbeat messages every 60 seconds
2. THE Worker_Process SHALL log active job count in heartbeat messages
3. THE Worker_Process SHALL log queue connection status in heartbeat messages
4. THE Worker_Process SHALL expose a health check endpoint returning worker status
5. WHEN THE Queue connection fails, THE Worker_Process SHALL attempt reconnection with exponential backoff

### Requirement 61: Report Regeneration

**User Story:** As a user, I want to regenerate outdated reports, so that I can get fresh data.

#### Acceptance Criteria

1. THE Web_App SHALL provide an API endpoint to trigger report regeneration
2. WHEN regeneration is requested, THE System SHALL reset report status to pending
3. THE System SHALL clear existing timeline and LLM analysis
4. THE System SHALL re-enqueue all fetch and scrape jobs
5. THE System SHALL preserve historical pipeline logs for comparison


### Requirement 62: Partial Report Display

**User Story:** As a user, I want to see partial reports while generation is in progress, so that I can review available data immediately.

#### Acceptance Criteria

1. THE Web_App SHALL return partial reports with status other than ready
2. THE Web_App SHALL include completed sections in partial reports
3. THE Web_App SHALL indicate which sections are still generating
4. THE Web_App SHALL include completed odometer readings in partial reports
5. THE Web_App SHALL include completed photos in partial reports

### Requirement 63: Source Priority Enforcement

**User Story:** As a system, I want Required_Sources prioritized, so that critical data is fetched first.

#### Acceptance Criteria

1. THE System SHALL define Required_Sources as NHTSA decode, NHTSA recalls, NMVTIS, NICB, Copart, and IAAI
2. THE System SHALL define Optional_Sources as AutoTrader and CarGurus
3. THE Stitcher_Worker SHALL wait for all Required_Sources before processing
4. THE Stitcher_Worker SHALL not wait for Optional_Sources
5. THE System SHALL include Optional_Source data if available when stitching begins

### Requirement 64: Database Connection Pooling

**User Story:** As a system administrator, I want database connections pooled, so that the system scales efficiently.

#### Acceptance Criteria

1. THE System SHALL use Drizzle ORM connection pooling
2. THE System SHALL configure a maximum of 20 concurrent database connections
3. THE System SHALL configure a connection timeout of 30 seconds
4. THE System SHALL log connection pool exhaustion warnings
5. THE System SHALL reuse connections across worker jobs

### Requirement 65: Scraper User-Agent Rotation

**User Story:** As a developer, I want User-Agent headers varied, so that scrapers are less likely to be blocked.

#### Acceptance Criteria

1. THE System SHALL maintain a list of realistic User-Agent strings
2. THE System SHALL randomly select a User-Agent for each scrape job
3. THE System SHALL include common browser versions in User-Agent strings
4. THE System SHALL log the User-Agent used for each scrape
5. THE System SHALL allow configuring User-Agent strings via environment variables

### Requirement 66: Timeline Event Types

**User Story:** As a developer, I want standardized event types, so that the UI can render events consistently.

#### Acceptance Criteria

1. THE System SHALL use event type title_transfer for title changes
2. THE System SHALL use event type auction_sale for auction records
3. THE System SHALL use event type accident for damage records
4. THE System SHALL use event type recall for safety recalls
5. THE System SHALL use event type inspection for state inspections
6. THE System SHALL use event type listing for dealer listings
7. THE System SHALL use event type theft for theft records
8. THE System SHALL use event type title_brand for branded titles
9. THE System SHALL validate event types against a defined enum

### Requirement 67: Gap Explanation Prompting

**User Story:** As a buyer, I want gap explanations to be specific, so that I understand what likely happened.

#### Acceptance Criteria

1. THE LLM_Worker SHALL provide vehicle age context when analyzing gaps
2. THE LLM_Worker SHALL consider gap duration when assessing concern level
3. THE LLM_Worker SHALL suggest specific questions to ask the seller
4. THE LLM_Worker SHALL distinguish between normal gaps (storage, private ownership) and concerning gaps
5. THE LLM_Worker SHALL rate buyer concern level from 1 to 10 for each gap


### Requirement 68: Accident Severity Classification

**User Story:** As a buyer, I want accident severity clearly classified, so that I can assess damage impact.

#### Acceptance Criteria

1. THE LLM_Worker SHALL classify accidents as minor, moderate, or severe
2. THE LLM_Worker SHALL explain the difference between cosmetic and structural damage
3. THE LLM_Worker SHALL consider airbag deployment as an indicator of severity
4. THE LLM_Worker SHALL estimate repair costs when data is available
5. THE LLM_Worker SHALL explain how accident history affects resale value

### Requirement 69: Buyers Checklist Specificity

**User Story:** As a buyer, I want a specific inspection checklist, so that I know exactly what to verify.

#### Acceptance Criteria

1. THE LLM_Worker SHALL generate a maximum of 8 checklist items
2. THE LLM_Worker SHALL base checklist items on the vehicle's specific history
3. THE LLM_Worker SHALL avoid generic items like "check the engine"
4. THE LLM_Worker SHALL reference specific damage areas from accident records
5. THE LLM_Worker SHALL reference specific recall components if applicable

### Requirement 70: Market Value Context

**User Story:** As a buyer, I want market value explained with context, so that I can negotiate effectively.

#### Acceptance Criteria

1. THE LLM_Worker SHALL compare asking price to market average when available
2. THE LLM_Worker SHALL explain how accident history affects value
3. THE LLM_Worker SHALL explain how title brands affect value
4. THE LLM_Worker SHALL explain how mileage affects value
5. THE LLM_Worker SHALL provide a clear buy/caution/avoid recommendation

### Requirement 71: Recall Status Clarity

**User Story:** As a buyer, I want recall status clearly explained, so that I know if the vehicle is safe.

#### Acceptance Criteria

1. THE LLM_Worker SHALL distinguish between open and closed recalls
2. THE LLM_Worker SHALL explain what each recall component means in plain English
3. THE LLM_Worker SHALL explain the consequence of not addressing open recalls
4. THE LLM_Worker SHALL provide remedy information for open recalls
5. THE LLM_Worker SHALL confirm when no recalls exist

### Requirement 72: Title Brand Impact Explanation

**User Story:** As a buyer, I want title brands explained clearly, so that I understand the implications.

#### Acceptance Criteria

1. THE LLM_Worker SHALL explain what salvage title means for safety
2. THE LLM_Worker SHALL explain what salvage title means for insurance
3. THE LLM_Worker SHALL explain what salvage title means for resale value
4. THE LLM_Worker SHALL distinguish between salvage and rebuilt titles
5. THE LLM_Worker SHALL explain flood and lemon law titles when present

### Requirement 73: Ownership Pattern Analysis

**User Story:** As a buyer, I want ownership patterns analyzed, so that I can identify red flags.

#### Acceptance Criteria

1. THE LLM_Worker SHALL explain whether the number of owners is normal for the vehicle age
2. THE LLM_Worker SHALL flag unusually short ownership periods
3. THE LLM_Worker SHALL explain geographic patterns in ownership
4. THE LLM_Worker SHALL flag ownership changes shortly after accidents
5. THE LLM_Worker SHALL explain what normal ownership duration looks like


### Requirement 74: Odometer Expected Mileage Calculation

**User Story:** As a buyer, I want to see expected mileage, so that I can assess if actual mileage is normal.

#### Acceptance Criteria

1. THE System SHALL calculate expected mileage as vehicle age multiplied by 12,000 miles per year
2. THE System SHALL display expected mileage alongside actual mileage in the odometer graph
3. THE LLM_Worker SHALL explain whether mileage is high, low, or normal
4. THE LLM_Worker SHALL explain implications of high mileage (wear and tear)
5. THE LLM_Worker SHALL explain implications of low mileage (potential storage issues)

### Requirement 75: Photo Chronological Ordering

**User Story:** As a buyer, I want photos ordered by date, so that I can see condition changes over time.

#### Acceptance Criteria

1. THE Web_App SHALL return photos sorted by capture date in ascending order
2. WHEN capture date is unavailable, THE System SHALL use scrape date
3. THE Web_App SHALL group photos by source for organized display
4. THE Web_App SHALL return the 6 most recent photos for hero display
5. THE Web_App SHALL include photo metadata (source, date, type) in responses

### Requirement 76: Summary Section Prominence

**User Story:** As a buyer, I want the most important information first, so that I can make quick decisions.

#### Acceptance Criteria

1. THE LLM_Worker SHALL lead the summary section with the single most important finding
2. THE LLM_Worker SHALL limit the summary to 3 sentences
3. THE LLM_Worker SHALL use specific dates and numbers in the summary
4. THE LLM_Worker SHALL avoid jargon in the summary
5. THE LLM_Worker SHALL provide a clear buy/caution/avoid verdict in the summary

### Requirement 77: Pipeline Stage Naming

**User Story:** As a developer, I want consistent stage names, so that logs are easy to filter.

#### Acceptance Criteria

1. THE System SHALL use stage name format "fetch-{source}" for fetcher workers
2. THE System SHALL use stage name format "scrape-{source}" for scraper workers
3. THE System SHALL use stage name format "normalize-{source}" for normalizer workers
4. THE System SHALL use stage name "stitch-report" for the stitcher worker
5. THE System SHALL use stage name "llm-analyze" for LLM analysis
6. THE System SHALL use stage name "llm-write-sections" for LLM section writing

### Requirement 78: Job Data Serialization

**User Story:** As a developer, I want job data serialized correctly, so that workers receive valid parameters.

#### Acceptance Criteria

1. THE System SHALL pass VIN as a string in all job data
2. THE System SHALL pass source as a string in normalization job data
3. THE System SHALL serialize job data as JSON
4. THE System SHALL validate job data structure before enqueueing
5. THE System SHALL log job data serialization errors

### Requirement 79: Report Completion Timestamp

**User Story:** As a user, I want to know when a report was completed, so that I can assess data freshness.

#### Acceptance Criteria

1. WHEN a report reaches ready status, THE System SHALL set the completedAt timestamp
2. THE System SHALL display completedAt in API responses
3. THE System SHALL calculate report age as current time minus completedAt
4. THE System SHALL flag reports older than 30 days as potentially outdated
5. THE System SHALL include completedAt in DOCX exports


### Requirement 80: Normalizer Error Handling

**User Story:** As a developer, I want normalizer errors logged, so that I can fix data transformation issues.

#### Acceptance Criteria

1. WHEN a normalizer throws an error, THE System SHALL log the error with VIN and source
2. THE System SHALL log the raw data that caused the error
3. THE System SHALL mark the normalization job as failed
4. THE Queue SHALL retry failed normalization jobs up to 3 times
5. WHEN normalization fails permanently, THE System SHALL mark the report as failed if the source is required

### Requirement 81: Stitcher Partial Data Handling

**User Story:** As a system, I want the stitcher to handle missing data gracefully, so that partial reports can be generated.

#### Acceptance Criteria

1. WHEN a normalized data field is missing, THE Stitcher_Worker SHALL use an empty array or null
2. THE Stitcher_Worker SHALL not fail when Optional_Sources are missing
3. THE Stitcher_Worker SHALL log warnings for missing Required_Sources
4. THE Stitcher_Worker SHALL include a data completeness indicator in the timeline
5. THE Stitcher_Worker SHALL proceed with available data when all Required_Sources are present

### Requirement 82: LLM Timeout Handling

**User Story:** As a developer, I want LLM timeouts handled, so that slow API responses do not block the pipeline.

#### Acceptance Criteria

1. THE LLM_Worker SHALL set a timeout of 60 seconds for Claude API calls
2. WHEN a timeout occurs, THE System SHALL log the timeout error
3. THE Queue SHALL retry timed-out LLM jobs up to 3 times
4. WHEN LLM analysis times out permanently, THE System SHALL mark the report as failed
5. WHEN a single section times out, THE System SHALL continue generating other sections

### Requirement 83: Photo URL Validation

**User Story:** As a system, I want photo URLs validated, so that broken links are not stored.

#### Acceptance Criteria

1. THE System SHALL verify photo URLs start with http:// or https://
2. THE System SHALL reject URLs with invalid characters
3. THE System SHALL log rejected photo URLs for debugging
4. THE System SHALL not fail scraping jobs when photo URLs are invalid
5. THE System SHALL store valid photo URLs even when some are invalid

### Requirement 84: Event Description Quality

**User Story:** As a buyer, I want event descriptions to be human-readable, so that I can understand the timeline without technical knowledge.

#### Acceptance Criteria

1. THE Normalizer_Worker SHALL generate plain English descriptions for all events
2. THE System SHALL include relevant details in event descriptions (location, damage type, etc.)
3. THE System SHALL avoid technical codes in event descriptions
4. THE System SHALL format dates in event descriptions as readable strings
5. THE System SHALL pass event descriptions directly to THE LLM_Worker for analysis

### Requirement 85: Database Index Optimization

**User Story:** As a system administrator, I want database queries optimized, so that API responses are fast.

#### Acceptance Criteria

1. THE Database SHALL create an index on reports.vin for fast lookups
2. THE Database SHALL create an index on odometer_readings.vin for graph queries
3. THE Database SHALL create an index on vehicle_photos.vin for photo queries
4. THE Database SHALL create an index on pipeline_log.vin for status queries
5. THE Database SHALL create a composite index on raw_data (vin, source) for uniqueness


### Requirement 86: Worker Registration Logging

**User Story:** As a developer, I want worker registration logged, so that I can verify all workers started correctly.

#### Acceptance Criteria

1. WHEN a worker registers, THE Worker_Process SHALL log the worker name
2. THE Worker_Process SHALL log the total number of registered workers on startup
3. THE Worker_Process SHALL log queue connection success
4. WHEN worker registration fails, THE Worker_Process SHALL log the error and exit
5. THE Worker_Process SHALL log the pg-boss version on startup

### Requirement 87: API Response Consistency

**User Story:** As a frontend developer, I want consistent API response formats, so that I can parse responses reliably.

#### Acceptance Criteria

1. THE Web_App SHALL return all successful responses as JSON objects
2. THE Web_App SHALL include a status field in all responses
3. THE Web_App SHALL use camelCase for all JSON field names
4. THE Web_App SHALL return arrays as empty arrays (not null) when no data exists
5. THE Web_App SHALL include timestamps in ISO 8601 format

### Requirement 88: Scraper Retry Logic

**User Story:** As a developer, I want scrapers to retry on network errors, so that transient failures do not require manual intervention.

#### Acceptance Criteria

1. WHEN a scraper encounters a network timeout, THE Queue SHALL retry the job
2. WHEN a scraper encounters a 503 error, THE Queue SHALL retry the job
3. THE Queue SHALL apply exponential backoff between scraper retries
4. THE System SHALL log each retry attempt with the error reason
5. WHEN a scraper fails after 3 retries, THE System SHALL mark the source as failed

### Requirement 89: Timeline JSON Schema

**User Story:** As a developer, I want the timeline JSON structure documented, so that I can query it reliably.

#### Acceptance Criteria

1. THE System SHALL store timeline as a JSON object with defined fields
2. THE timeline SHALL include identity, titleHistory, titleBrands, recalls, damageRecords, odometerReadings, marketValue, events, gaps, and sourcesCovered fields
3. THE System SHALL validate timeline structure before storing
4. THE System SHALL provide TypeScript interfaces for timeline structure
5. THE System SHALL document timeline schema in code comments

### Requirement 90: Report Error Messages

**User Story:** As a user, I want clear error messages, so that I understand why a report failed.

#### Acceptance Criteria

1. WHEN a report fails, THE System SHALL store a descriptive error message
2. THE System SHALL include the failing stage in the error message
3. THE System SHALL include the VIN in the error message
4. THE System SHALL avoid exposing internal error details to users
5. THE System SHALL provide actionable guidance in error messages (e.g., "VIN not found in NHTSA database")

### Requirement 91: Concurrent Report Generation

**User Story:** As a system, I want to process multiple reports concurrently, so that throughput is maximized.

#### Acceptance Criteria

1. THE Worker_Process SHALL process multiple fetch jobs concurrently
2. THE Worker_Process SHALL process multiple scrape jobs concurrently with rate limiting
3. THE Worker_Process SHALL process multiple normalization jobs concurrently
4. THE System SHALL limit concurrent scraper jobs to prevent site overload
5. THE System SHALL support configurable concurrency limits via environment variables


### Requirement 92: Development Testing Script

**User Story:** As a developer, I want a manual testing script, so that I can verify the pipeline with specific VINs.

#### Acceptance Criteria

1. THE System SHALL provide a test:vin script accepting a VIN as argument
2. THE script SHALL trigger report generation for the provided VIN
3. THE script SHALL poll report status until completion or failure
4. THE script SHALL display pipeline progress in real-time
5. THE script SHALL output the final report or error message

### Requirement 93: Production Deployment Validation

**User Story:** As a system administrator, I want deployment validated, so that I can verify the system is running correctly.

#### Acceptance Criteria

1. THE System SHALL provide a health check endpoint returning HTTP 200 when healthy
2. THE health check SHALL verify database connectivity
3. THE health check SHALL verify queue connectivity
4. THE health check SHALL return worker count and status
5. THE health check SHALL return system version and build timestamp

### Requirement 94: LLM Model Configuration

**User Story:** As a system administrator, I want the LLM model configurable, so that I can upgrade models without code changes.

#### Acceptance Criteria

1. THE System SHALL read LLM model name from environment variables
2. THE System SHALL default to claude-sonnet-4-20250514 when not configured
3. THE System SHALL log the model name used for each LLM call
4. THE System SHALL store the model name in THE report_sections table
5. THE System SHALL support switching models without database migrations

### Requirement 95: Scraper HTML Snapshot Compression

**User Story:** As a system administrator, I want HTML snapshots compressed, so that database storage is efficient.

#### Acceptance Criteria

1. WHERE HTML snapshots exceed 100KB, THE System SHALL compress them before storage
2. THE System SHALL use gzip compression for HTML snapshots
3. THE System SHALL decompress HTML snapshots when re-parsing
4. THE System SHALL log compression ratio for monitoring
5. THE System SHALL support disabling compression via environment variable

### Requirement 96: Report Generation Metrics

**User Story:** As a system administrator, I want generation metrics tracked, so that I can monitor performance.

#### Acceptance Criteria

1. THE System SHALL track total generation time per report
2. THE System SHALL track time spent in each pipeline stage
3. THE System SHALL track number of retries per source
4. THE System SHALL provide an API endpoint to retrieve metrics
5. THE System SHALL aggregate metrics by date for trend analysis

### Requirement 97: Queue Monitoring Dashboard

**User Story:** As a system administrator, I want queue status visible, so that I can monitor job processing.

#### Acceptance Criteria

1. THE System SHALL provide an API endpoint returning queue statistics
2. THE endpoint SHALL return pending job count by job type
3. THE endpoint SHALL return active job count by job type
4. THE endpoint SHALL return failed job count by job type
5. THE endpoint SHALL return average job completion time by job type


### Requirement 98: Normalizer Round-Trip Testing

**User Story:** As a developer, I want normalizers tested with round-trip properties, so that data transformations are verified.

#### Acceptance Criteria

1. FOR ALL valid raw data, normalizing then denormalizing SHALL produce equivalent data
2. THE System SHALL provide test fixtures for each normalizer
3. THE System SHALL verify all required fields are extracted
4. THE System SHALL verify event descriptions are human-readable
5. THE System SHALL verify odometer readings are numeric and positive

### Requirement 99: Parser Requirements

**User Story:** As a developer, I want HTML parsing logic separated, so that layout changes can be fixed quickly.

#### Acceptance Criteria

1. THE System SHALL provide separate parser functions for each scraper
2. THE System SHALL support re-parsing HTML snapshots without re-scraping
3. THE System SHALL provide a parser test suite with sample HTML
4. FOR ALL valid HTML snapshots, parsing then formatting then parsing SHALL produce equivalent data
5. THE System SHALL log parser version with each scrape for debugging

### Requirement 100: System Scalability

**User Story:** As a system administrator, I want the system to scale horizontally, so that it can handle increased load.

#### Acceptance Criteria

1. THE System SHALL support running multiple Worker_Process instances
2. THE Queue SHALL distribute jobs across all worker instances
3. THE System SHALL not require shared state between worker instances
4. THE Database SHALL handle concurrent writes from multiple workers
5. THE System SHALL support adding worker instances without downtime

---

## Implementation Notes

This requirements document defines the complete vehicle history platform rebuild. The system transforms from a synchronous monolithic architecture to a modern worker-based pipeline that generates Carfax-quality reports with LLM-written sections.

Key architectural decisions:
- Separation of web app and worker process for scalability
- pg-boss queue for reliable job orchestration
- Unified normalization schema for source-agnostic stitching
- Claude LLM for plain English report sections
- Puppeteer with stealth plugin for scraping resilience
- Raw HTML snapshot storage for re-parsing capability

The requirements are organized into 100 acceptance criteria covering:
- Architecture and infrastructure (Requirements 1-10)
- Data fetching and scraping (Requirements 11-20)
- Data normalization and stitching (Requirements 21-30)
- LLM analysis and section writing (Requirements 31-40)
- API endpoints and user features (Requirements 41-50)
- Error handling and resilience (Requirements 51-60)
- Performance and scalability (Requirements 61-70)
- Quality and testing (Requirements 71-80)
- Monitoring and operations (Requirements 81-90)
- Advanced features and optimization (Requirements 91-100)

All requirements follow EARS patterns and INCOSE quality rules for clarity, testability, and completeness.
