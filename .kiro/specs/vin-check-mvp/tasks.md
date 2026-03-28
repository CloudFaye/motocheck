# Implementation Plan: VIN Check MVP

## Overview

This implementation plan breaks down the VIN Check MVP into discrete coding tasks. The system is a SvelteKit monolith with a separate Telegram bot worker, both sharing a PostgreSQL database. Implementation follows a bottom-up approach: database schema → core server modules → API routes → frontend pages → Telegram bot → testing.

Stack: SvelteKit + Drizzle ORM + PostgreSQL + Flutterwave + Resend + Puppeteer + Telegraf + Cloudflare R2

## Tasks

- [x] 1. Database schema and environment configuration
  - [x] 1.1 Set up environment variables and validation
    - Create `.env.example` with all required variables (DATABASE_URL, NHTSA_API_URL, FLW_PUBLIC_KEY, FLW_SECRET_KEY, FLW_SECRET_HASH, RESEND_API_KEY, FROM_EMAIL, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, TELEGRAM_BOT_TOKEN, TELEGRAM_SECRET_TOKEN, PUBLIC_BASE_URL)
    - Create `src/lib/server/config.ts` to load and validate environment variables at startup
    - Exit with descriptive error if any required variable is missing
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [x] 1.2 Define database schema with Drizzle ORM
    - Update `src/lib/server/db/schema.ts` with lookups, orders, and reports tables
    - Add unique constraint on lookups.vin
    - Add foreign key from orders.lookupId to lookups.id
    - Add unique foreign key from reports.orderId to orders.id
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [x] 1.3 Create database migration
    - Generate Drizzle migration for the three tables
    - Run migration to create tables in PostgreSQL
    - _Requirements: 15.1_

- [-] 2. Core server modules - VIN validation and NHTSA decoding
  - [x] 2.1 Implement VIN_Validator module
    - Create `src/lib/server/vin-validator.ts`
    - Implement normalization (strip whitespace, uppercase, O→0, I→1, Q→0)
    - Implement length validation (exactly 17 characters)
    - Implement character set validation (regex `/^[A-HJ-NPR-Z0-9]{17}$/`)
    - Implement ISO 3779 check digit validation at position 9
    - Implement WMI extraction (characters 1-3) and country mapping
    - Return descriptive error messages for each validation failure
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 2.2 Write property tests for VIN_Validator
    - **Property 1: VIN Normalization Idempotence** - Validates: Requirements 1.1
    - **Property 2: VIN Length Validation** - Validates: Requirements 1.2
    - **Property 3: VIN Character Set Validation** - Validates: Requirements 1.3
    - **Property 4: Invalid VIN Error Without Side Effects** - Validates: Requirements 1.5
    - **Property 5: WMI Extraction Consistency** - Validates: Requirements 1.6

  - [x] 2.3 Implement NHTSA_Decoder module
    - Create `src/lib/server/nhtsa-decoder.ts`
    - Implement NHTSA vPIC API call to `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}?format=json`
    - Parse Results array by VariableId (not variable name)
    - Extract Make, Model, Year, Engine, Displacement, Body Class, Plant Country, Drive Type, Fuel Type
    - Implement retry logic for 503/timeout errors (1 retry with 1-second backoff)
    - Use "Unknown" as fallback for missing fields
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 2.4 Write property tests for NHTSA_Decoder
    - **Property 6: NHTSA Response Field Extraction** - Validates: Requirements 2.2
    - **Property 39: NHTSA Response Round-Trip** - Validates: Requirements 17.1, 17.3, 17.4, 17.5

- [x] 3. Core server modules - NCS valuation and duty calculation
  - [x] 3.1 Create NCS valuation table data file
    - Create `src/lib/server/data/valuation_table.json` with Year-Make-Model → CIF USD mappings
    - Use format: `{"2020-HONDA-ACCORD": 12500, "2019-HONDA-ACCORD": 11800, ...}`
    - Include at least 50 common vehicle entries for MVP
    - _Requirements: 3.1_

  - [x] 3.2 Implement NCS_Valuator module
    - Create `src/lib/server/ncs-valuator.ts`
    - Load valuation_table.json at startup into Map<string, number>
    - Implement exact match lookup (Year-Make-Model)
    - Implement interpolated match (nearest year with same Make-Model)
    - Implement estimated fallback (Make-Model average or hardcoded)
    - Return CIF USD, confidence level, and matched key
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.3 Write property tests for NCS_Valuator
    - **Property 8: Valuation Lookup Key Format** - Validates: Requirements 3.1
    - **Property 9: Valuation Confidence Recording** - Validates: Requirements 3.5

  - [x] 3.4 Implement Duty_Engine module
    - Create `src/lib/server/duty-engine.ts`
    - Implement pure function calculateDuty(cifUsd, cbnRate)
    - Calculate Import Duty (35% of CIF NGN)
    - Calculate Surcharge (7% of Import Duty)
    - Calculate NAC Levy (20% of CIF NGN)
    - Calculate CISS (1% of CIF NGN)
    - Calculate ETLS (0.5% of CIF NGN)
    - Calculate VAT (7.5% of sum of CIF + all above duties)
    - Return all components in NGN and USD, plus metadata (CBN rate, rate timestamp, Finance Act year)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 3.5 Write property tests for Duty_Engine
    - **Property 10: Duty Calculation Completeness** - Validates: Requirements 4.1-4.8
    - **Property 11: Duty Calculation Determinism** - Validates: Requirements 4.1-4.8

- [x] 4. Core server modules - Exchange rate and rate limiting
  - [x] 4.1 Implement Exchange_Rate_Manager module
    - Create `src/lib/server/exchange-rate-manager.ts`
    - Implement fetchExchangeRate() to fetch CBN official rate and parallel rate
    - Store rates in memory with fetched timestamp
    - Store rates in database for historical tracking
    - Implement getCurrentRate() to return most recent rate
    - Set up 6-hour refresh interval
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 4.2 Write property tests for Exchange_Rate_Manager
    - **Property 36: Exchange Rate Timestamp Storage** - Validates: Requirements 14.2
    - **Property 37: Duty Calculation Rate Immutability** - Validates: Requirements 14.5

  - [x] 4.3 Implement Rate_Limiter module
    - Create `src/lib/server/rate-limiter.ts`
    - Implement in-memory tracking with Map<identifier, request[]>
    - Implement checkRateLimit(identifier, limit, windowSeconds) with sliding window algorithm
    - Return allowed boolean and retryAfter seconds
    - Implement cleanup of expired entries every 5 minutes
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 4.4 Write property tests for Rate_Limiter
    - **Property 12: Rate Limit Tracking Per Identifier** - Validates: Requirements 5.1, 12.4
    - **Property 13: Rate Limit Response Headers** - Validates: Requirements 5.3

- [ ] 5. Checkpoint - Ensure all core modules pass tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Core server modules - Payment and webhook handling
  - [x] 6.1 Implement Payment_Gateway module
    - Create `src/lib/server/payment-gateway.ts`
    - Implement initiatePayment() to call Flutterwave `/v3/payments` endpoint
    - Generate transaction reference in format "vin-{uuid4}"
    - Include amount in kobo, email, redirect URL, and metadata (source, chat_id)
    - Implement verifyTransaction() to call Flutterwave `/v3/transactions/{id}/verify` endpoint
    - _Requirements: 6.3, 6.6_

  - [ ]* 6.2 Write property tests for Payment_Gateway
    - **Property 16: Transaction Reference Format** - Validates: Requirements 6.3
    - **Property 18: Payment Response Contains URL** - Validates: Requirements 6.6

  - [x] 6.3 Implement Webhook_Handler module
    - Create `src/lib/server/webhook-handler.ts`
    - Implement handleFlutterwaveWebhook(rawBody, verifHash, payload)
    - Compute HMAC-SHA512 of raw body using FLW_SECRET_HASH
    - Compare with verif-hash header using crypto.timingSafeEqual
    - Verify event === "charge.completed" and status === "successful"
    - Call verifyTransaction() to re-verify via Flutterwave API
    - Compare verified amount with expected amount in database
    - Check if report already exists (idempotency)
    - Always return HTTP 200 to Flutterwave
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [ ]* 6.4 Write property tests for Webhook_Handler
    - **Property 19: HMAC Verification Rejects Invalid Signatures** - Validates: Requirements 7.2, 7.3
    - **Property 20: Webhook Event Type Filtering** - Validates: Requirements 7.5
    - **Property 21: Webhook Amount Validation** - Validates: Requirements 7.7
    - **Property 22: Webhook Always Returns 200** - Validates: Requirements 7.9

- [x] 7. Core server modules - Report generation and storage
  - [x] 7.1 Implement Report_Generator module
    - Create `src/lib/server/report-generator.ts`
    - Implement generateReport(reportData) using Puppeteer
    - Build HTML template with all required sections (header, vehicle identity, NCS valuation, duty breakdown, exchange rates, disclaimer, footer)
    - Render to PDF with A4 format, printBackground: true, margin: 15mm
    - Compute SHA-256 hash of PDF buffer
    - Return PDF buffer and hash
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [ ]* 7.2 Write property tests for Report_Generator
    - **Property 25: Report PDF Hash Storage** - Validates: Requirements 8.4
    - **Property 29: PDF Report Content Completeness** - Validates: Requirements 9.2-9.8
    - **Property 30: Report ID Format** - Validates: Requirements 10.3

  - [x] 7.3 Implement Storage_Service module
    - Create `src/lib/server/storage-service.ts`
    - Implement uploadReport(reportId, pdfBuffer) using @aws-sdk/client-s3
    - Generate R2 key in format "reports/{year}/{month}/{report-uuid}.pdf"
    - Upload to R2 bucket
    - Implement generateSignedUrl(r2Key, expiryHours) with 72-hour expiry
    - Return R2 key and signed URL
    - _Requirements: 8.5, 8.6, 10.1, 10.2, 10.3_

  - [ ]* 7.4 Write property tests for Storage_Service
    - **Property 26: R2 Key Format** - Validates: Requirements 8.5
    - **Property 27: Pre-signed URL Expiry** - Validates: Requirements 8.6, 10.2

  - [x] 7.5 Implement Email_Service module
    - Create `src/lib/server/email-service.ts`
    - Implement sendReport(to, reportId, vin, signedUrl) using Resend API
    - Build HTML email template with branded design
    - Include signed URL as download link
    - Subject: "Your VIN Report - {VIN}"
    - _Requirements: 8.7_

- [ ] 8. Checkpoint - Ensure all server modules pass tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. API routes - VIN lookup and payment
  - [x] 9.1 Implement VIN lookup API route
    - Create `src/routes/api/vin/+server.ts`
    - Implement POST handler
    - Apply rate limiting (5 req/min per IP)
    - Validate VIN using VIN_Validator
    - Check lookup cache (30-day TTL)
    - On cache miss: decode with NHTSA_Decoder, lookup valuation with NCS_Valuator, calculate duty with Duty_Engine
    - Store result in lookups table
    - Return preview response (VIN, make, model, year, engine, body type, origin, fuel type, duty estimate, confidence, lookup ID)
    - Do NOT include detailed duty breakdown in preview
    - _Requirements: 2.4, 2.5, 5.1, 5.2, 5.3, 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ]* 9.2 Write property tests for VIN lookup API
    - **Property 7: Successful Decode Creates Cache Entry** - Validates: Requirements 2.4, 15.2
    - **Property 35: VIN Lookup Preview Response Structure** - Validates: Requirements 13.1-13.5

  - [x] 9.3 Implement payment initiation API route
    - Create `src/routes/api/pay/initiate/+server.ts`
    - Implement POST handler
    - Validate email format
    - Verify lookup ID exists in database
    - Create order record with status "pending"
    - Call Payment_Gateway.initiatePayment()
    - Return payment URL
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 9.4 Write property tests for payment initiation API
    - **Property 14: Email Validation** - Validates: Requirements 6.1
    - **Property 15: Lookup ID Referential Integrity** - Validates: Requirements 6.2
    - **Property 17: Payment Initiation Creates Pending Order** - Validates: Requirements 6.4, 15.4

- [x] 10. API routes - Webhook handling and fulfillment
  - [x] 10.1 Implement Flutterwave webhook API route
    - Create `src/routes/api/webhook/flutterwave/+server.ts`
    - Implement POST handler
    - Read raw request body as Buffer before parsing
    - Call Webhook_Handler.handleFlutterwaveWebhook()
    - On verification success: update order status to "paid", record transaction ID and payment timestamp
    - Check if report already exists (idempotency)
    - If no report: generate PDF with Report_Generator, upload to R2 with Storage_Service, send email with Email_Service (for web orders) or send to Telegram (for telegram orders)
    - Record report delivery timestamp
    - Always return HTTP 200
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

  - [ ]* 10.2 Write property tests for webhook fulfillment
    - **Property 23: Payment Confirmation Updates Order** - Validates: Requirements 8.1
    - **Property 24: Report Generation Idempotency** - Validates: Requirements 8.2
    - **Property 28: Report Delivery Timestamp Recording** - Validates: Requirements 8.9
    - **Property 38: Complete Report Record Storage** - Validates: Requirements 15.5

- [ ] 11. Checkpoint - Ensure all API routes pass tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. SvelteKit pages - Homepage and preview
  - [x] 12.1 Create homepage with VIN input form
    - Update `src/routes/+page.svelte`
    - Add VIN input field with validation
    - Add submit button
    - On submit: call `/api/vin` endpoint
    - Display loading state during API call
    - On success: navigate to preview page with lookup ID
    - On error: display error message inline
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 12.2 Create preview page with vehicle details and payment button
    - Create `src/routes/preview/[lookupId]/+page.svelte`
    - Create `src/routes/preview/[lookupId]/+page.server.ts` to load lookup data
    - Display vehicle specifications (make, model, year, engine, body type, origin, fuel type)
    - Display duty estimate teaser (total estimated duty in NGN)
    - Display valuation confidence level
    - Add "Purchase Full Report" button
    - On button click: show email input modal
    - On email submit: call `/api/pay/initiate` endpoint
    - On success: redirect to Flutterwave payment URL
    - _Requirements: 6.1, 6.2, 6.6, 13.1, 13.2, 13.3, 13.4_

  - [x] 12.3 Create payment success callback page
    - Create `src/routes/payment/success/+page.svelte`
    - Display success message
    - Display "Check your email for the report" message
    - Add link to return to homepage
    - _Requirements: 8.7_

- [x] 13. Telegram bot - Setup and command handlers
  - [x] 13.1 Create Telegram bot worker entry point
    - Create `src/telegram-bot/index.ts`
    - Initialize Telegraf bot with TELEGRAM_BOT_TOKEN
    - Set up webhook with TELEGRAM_SECRET_TOKEN
    - Import shared server modules (VIN_Validator, NHTSA_Decoder, NCS_Valuator, Duty_Engine, Payment_Gateway)
    - _Requirements: 11.1, 12.1, 12.2_

  - [x] 13.2 Implement /start command handler
    - Respond with welcome message and instructions
    - Include service description and pricing
    - _Requirements: 11.1_

  - [x] 13.3 Implement /help command handler
    - Respond with service description, pricing, and contact information
    - _Requirements: 11.6_

  - [x] 13.4 Implement /check command and raw VIN message handler
    - Apply rate limiting (3 req/hour per chat ID)
    - Validate VIN inline using VIN_Validator
    - On valid VIN: decode with NHTSA_Decoder, lookup valuation with NCS_Valuator, calculate duty with Duty_Engine
    - Respond with preview message (vehicle specs and duty estimate)
    - Include payment link with chat_id embedded in metadata
    - Sanitize all user input before processing
    - _Requirements: 11.2, 11.3, 11.4, 12.4, 12.5, 12.6_

  - [ ]* 13.5 Write property tests for Telegram bot
    - **Property 31: Telegram Bot Chat ID Embedding** - Validates: Requirements 11.4
    - **Property 32: Telegram Bot VIN Validation** - Validates: Requirements 11.2
    - **Property 33: Telegram Bot Secret Token Validation** - Validates: Requirements 12.2
    - **Property 34: Telegram Bot Input Sanitization** - Validates: Requirements 12.6

  - [x] 13.6 Implement Telegram webhook API route
    - Create `src/routes/api/webhook/telegram/+server.ts`
    - Implement POST handler
    - Validate X-Telegram-Bot-Api-Secret-Token header
    - Forward update to Telegraf bot
    - Return HTTP 401 if secret token is invalid
    - _Requirements: 12.2, 12.3_

  - [x] 13.7 Update webhook fulfillment to send PDF to Telegram
    - In `src/routes/api/webhook/flutterwave/+server.ts`, check order source
    - If source is "telegram": send PDF file directly to chat ID using bot.telegram.sendDocument()
    - _Requirements: 8.8, 11.5_

- [ ] 14. Checkpoint - Ensure all features work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Deployment configuration and final integration
  - [x] 15.1 Create deployment configuration
    - Update `package.json` with start scripts for web app and Telegram bot
    - Create `ecosystem.config.js` for PM2 (if using PM2)
    - Document environment variables in README.md
    - _Requirements: 16.1, 16.2_

  - [x] 15.2 Set up database connection pooling
    - Configure Drizzle connection pool settings in `src/lib/server/db/index.ts`
    - Set appropriate pool size and timeout values
    - _Requirements: 15.1_

  - [x] 15.3 Add error logging and monitoring
    - Set up structured logging for all error scenarios
    - Log validation errors, API errors, webhook verification failures, payment state transitions, report generation events
    - _Requirements: 7.4, 7.8_

  - [x] 15.4 Create README with setup instructions
    - Document installation steps
    - Document environment variable configuration
    - Document database migration steps
    - Document how to run web app and Telegram bot
    - Document testing instructions

- [ ] 16. Final checkpoint - Production readiness verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All 39 correctness properties from the design document are covered in property test tasks
