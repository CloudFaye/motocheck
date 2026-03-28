# Design Document: VIN Check MVP

## Overview

The VIN Check MVP is a no-authentication web application and Telegram bot that enables Nigerian clearing agents and used car buyers to decode Vehicle Identification Numbers (VINs) and purchase comprehensive PDF reports containing Nigerian Customs Service (NCS) import duty estimates.

The system architecture follows a monolithic SvelteKit application with a separate Telegram bot worker, both sharing a PostgreSQL database. The application validates VINs according to ISO 3779 standards, decodes vehicle specifications via the NHTSA vPIC API, calculates Nigerian import duties based on NCS valuation tables, processes payments through Flutterwave, generates PDF reports using Puppeteer, stores reports in Cloudflare R2, and delivers reports via Resend email or Telegram.

Key design principles:
- No authentication or user sessions - VIN is the identity anchor
- Idempotent webhook processing to handle payment retries
- Caching of NHTSA API responses to reduce external dependencies
- Security-first approach with HMAC verification and rate limiting
- Deterministic duty calculations with exchange rate stamping

## Architecture

### System Components

The system consists of the following major components:

**Web Application (SvelteKit)**
- Public-facing pages for VIN input, preview, and payment
- API routes for VIN lookup, payment initiation, and webhooks
- Server-side rendering with SvelteKit adapter-node

**Telegram Bot Worker**
- Separate Node.js process using Telegraf framework
- Webhook-based (not polling) for efficient operation
- Shares database and server modules with web application

**Database (PostgreSQL)**
- Managed via Drizzle ORM with postgres.js driver
- Three tables: lookups, orders, reports
- No user table - VIN-centric data model

**External Services**
- NHTSA vPIC API: Vehicle specification decoding
- Flutterwave: Payment processing
- Resend: Email delivery
- Cloudflare R2: PDF storage (S3-compatible)
- CBN API: Exchange rate fetching

### Request Flow

**Web VIN Lookup Flow:**
1. User submits VIN on homepage
2. VIN_Validator normalizes and validates format
3. System checks lookup cache (30-day TTL)
4. On cache miss: NHTSA_Decoder fetches vehicle specs
5. NCS_Valuator determines CIF value from valuation table
6. Duty_Engine calculates all import duties and levies
7. Result cached in database
8. Preview response returned to client

**Payment and Fulfillment Flow:**
1. User initiates payment with email and lookup ID
2. System creates order record with status "pending"
3. Flutterwave payment link generated and returned
4. User completes payment on Flutterwave
5. Flutterwave webhook fires with payment confirmation
6. Webhook_Handler verifies HMAC signature
7. System re-verifies transaction via Flutterwave API
8. Order status updated to "paid"
9. Report_Generator creates PDF with Puppeteer
10. PDF uploaded to R2 with SHA-256 hash
11. Pre-signed URL generated (72-hour expiry)
12. Email_Service delivers report via Resend
13. Report delivery timestamp recorded

**Telegram Bot Flow:**
1. User sends /check command or raw VIN
2. Bot validates and decodes VIN
3. Bot responds with preview and payment link
4. Payment metadata includes chat_id
5. On payment confirmation, bot sends PDF directly to chat

### Security Architecture

**Webhook Security:**
- HMAC-SHA512 verification of raw request body
- Timing-safe comparison using crypto.timingSafeEqual
- Transaction re-verification via Flutterwave API
- Amount validation against database records

**Rate Limiting:**
- IP-based rate limiting for web API (5 req/min)
- Chat-based rate limiting for Telegram bot (3 req/hour)
- HTTP 429 responses with Retry-After headers

**Data Security:**
- Private R2 bucket with pre-signed URLs
- UUID v4 report IDs to prevent enumeration
- Parameterized queries via Drizzle ORM
- Environment variable management for secrets

## Components and Interfaces

### VIN_Validator

**Purpose:** Validates and normalizes VIN format according to ISO 3779

**Interface:**
```typescript
interface VINValidationResult {
  valid: boolean;
  normalized: string;
  wmi: string;
  origin: string;
  error?: string;
}

function validateVIN(vin: string): VINValidationResult
```

**Implementation Details:**
- Normalization: strip whitespace, uppercase, substitute O→0, I→1, Q→0
- Length validation: exactly 17 characters
- Character validation: regex `/^[A-HJ-NPR-Z0-9]{17}$/`
- Check digit validation: ISO 3779 algorithm at position 9
- WMI extraction: characters 1-3 mapped to country of manufacture

**Error Handling:**
- Returns descriptive error messages without making external API calls
- Invalid length: "VIN must be exactly 17 characters"
- Invalid characters: "VIN contains invalid characters"
- Invalid check digit: "VIN check digit validation failed"

### NHTSA_Decoder

**Purpose:** Retrieves vehicle specifications from NHTSA vPIC API

**Interface:**
```typescript
interface VehicleSpecs {
  make: string;
  model: string;
  year: number;
  engine: string;
  displacement: string;
  bodyClass: string;
  plantCountry: string;
  driveType: string;
  fuelType: string;
}

async function decodeVIN(vin: string): Promise<VehicleSpecs>
```

**Implementation Details:**
- Endpoint: `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}?format=json`
- Parses Results array by VariableId (more stable than variable names)
- Extracts only required fields for efficiency
- No API key required

**Error Handling:**
- 503 or timeout: retry once with exponential backoff (1 second delay)
- Invalid response structure: throw descriptive error
- Missing required fields: use "Unknown" as fallback value

**Caching Strategy:**
- Cache decoded results in lookups table
- 30-day cache TTL
- VIN specifications never change, so cache is safe

### NCS_Valuator

**Purpose:** Determines CIF value from NCS valuation table

**Interface:**
```typescript
interface ValuationResult {
  cifUsd: number;
  confidence: 'exact' | 'interpolated' | 'estimated';
  matchedKey: string;
}

function lookupValuation(year: number, make: string, model: string): ValuationResult
```

**Implementation Details:**
- Loads `valuation_table.json` at startup into Map<string, number>
- Key format: `YEAR-MAKE-MODEL`
- Lookup priority:
  1. Exact match: year + make + model
  2. Interpolated: nearest year with same make + model
  3. Estimated: make + model average or hardcoded fallback

**Data Structure:**
```typescript
// valuation_table.json
{
  "2020-HONDA-ACCORD": 12500,
  "2019-HONDA-ACCORD": 11800,
  "2018-HONDA-ACCORD": 10500
}
```

### Duty_Engine

**Purpose:** Calculates Nigerian import duties and levies

**Interface:**
```typescript
interface DutyBreakdown {
  cifNgn: number;
  cifUsd: number;
  importDuty: number;
  surcharge: number;
  nacLevy: number;
  ciss: number;
  etls: number;
  vat: number;
  totalNgn: number;
  totalUsd: number;
  effectiveRatePct: number;
  cbnRate: number;
  rateTimestamp: Date;
  financeActYear: number;
}

function calculateDuty(cifUsd: number, cbnRate: number): DutyBreakdown
```

**Implementation Details:**
- Pure function with no external dependencies
- Fully deterministic given inputs
- Calculation formula (Finance Act 2023):
  - Import Duty = 35% of CIF (NGN)
  - Surcharge = 7% of Import Duty
  - NAC Levy = 20% of CIF (NGN)
  - CISS = 1% of CIF (NGN)
  - ETLS = 0.5% of CIF (NGN)
  - VAT = 7.5% of (CIF + all above duties)
  - Total = Sum of all components
- Effective rate: ~70-75% of CIF value

**Exchange Rate Stamping:**
- Each calculation stamped with CBN rate used
- Rate timestamp recorded
- Finance Act year recorded
- Never recalculate retroactively

### Payment_Gateway

**Purpose:** Flutterwave payment processing interface

**Interface:**
```typescript
interface PaymentInitiation {
  txRef: string;
  amount: number;
  email: string;
  redirectUrl: string;
}

interface PaymentLink {
  paymentUrl: string;
}

async function initiatePayment(params: PaymentInitiation): Promise<PaymentLink>
async function verifyTransaction(txId: string): Promise<TransactionDetails>
```

**Implementation Details:**
- Transaction reference format: `vin-{uuid4}`
- Amount stored in kobo (multiply NGN by 100)
- Redirect URL points back to application
- Metadata includes source (web/telegram) and chat_id (if telegram)

**API Endpoints:**
- Initiate: `POST /v3/payments`
- Verify: `GET /v3/transactions/{id}/verify`

### Webhook_Handler

**Purpose:** Processes payment confirmation webhooks with security verification

**Interface:**
```typescript
interface WebhookPayload {
  event: string;
  data: {
    id: string;
    tx_ref: string;
    amount: number;
    status: string;
  };
}

async function handleFlutterwaveWebhook(
  rawBody: Buffer,
  verifHash: string,
  payload: WebhookPayload
): Promise<void>
```

**Implementation Details:**
- Read raw request body as Buffer before parsing
- Compute HMAC-SHA512 of raw body using FLW_SECRET_HASH
- Compare with verif-hash header using crypto.timingSafeEqual
- Verify event === "charge.completed" and status === "successful"
- Re-verify transaction via Flutterwave API
- Compare verified amount with expected amount in database
- Always return HTTP 200 to prevent retries
- Process fulfillment asynchronously

**Security Checks:**
1. HMAC signature verification
2. Event type validation
3. Transaction re-verification via API
4. Amount validation
5. Idempotency check (report already exists)

### Report_Generator

**Purpose:** Generates PDF reports using Puppeteer

**Interface:**
```typescript
interface ReportData {
  reportId: string;
  vin: string;
  vehicleSpecs: VehicleSpecs;
  valuation: ValuationResult;
  dutyBreakdown: DutyBreakdown;
  generatedAt: Date;
}

async function generateReport(data: ReportData): Promise<Buffer>
```

**Implementation Details:**
- Uses Puppeteer to render HTML template to PDF
- Format: A4, printBackground: true, margin: 15mm all sides
- Single HTML string built from data (no external resources)
- Computes SHA-256 hash of PDF buffer for integrity

**Report Structure:**
1. Header: Logo, Report ID, VIN, timestamp
2. Vehicle Identity: Make, model, year, engine, body, drive, fuel, origin
3. NCS Valuation: CIF value (USD/NGN), confidence, match basis
4. Duty Breakdown: Line-by-line table with NGN and USD columns
5. Exchange Rates: CBN official + parallel rate with timestamps
6. Disclaimer: "Estimate only. Verify final figures with NCS at port of entry."
7. Footer: Report ID, page number, website URL

### Storage_Service

**Purpose:** Manages PDF storage in Cloudflare R2

**Interface:**
```typescript
interface UploadResult {
  r2Key: string;
  signedUrl: string;
}

async function uploadReport(reportId: string, pdfBuffer: Buffer): Promise<UploadResult>
async function generateSignedUrl(r2Key: string, expiryHours: number): Promise<string>
```

**Implementation Details:**
- Uses @aws-sdk/client-s3 (R2 is S3-compatible)
- Key format: `reports/{year}/{month}/{report-uuid}.pdf`
- Bucket configured as private (no public access)
- Pre-signed GetObject URLs with 72-hour expiry
- Regenerate signed URL on resend (never reuse stored URL)

**Configuration:**
- Endpoint: `https://{account_id}.r2.cloudflarestorage.com`
- Credentials: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
- Bucket: R2_BUCKET_NAME

### Email_Service

**Purpose:** Delivers PDF reports via Resend

**Interface:**
```typescript
interface EmailParams {
  to: string;
  reportId: string;
  vin: string;
  signedUrl: string;
}

async function sendReport(params: EmailParams): Promise<void>
```

**Implementation Details:**
- Uses Resend API with RESEND_API_KEY
- From address: FROM_EMAIL environment variable
- Subject: "Your VIN Report - {VIN}"
- HTML email with branded template
- Includes signed URL as download link
- Records sent_at timestamp on success

### Telegram_Bot

**Purpose:** Provides Telegram interface for VIN checking

**Interface:**
```typescript
interface BotContext {
  chatId: string;
  message: string;
}

async function handleStart(ctx: BotContext): Promise<void>
async function handleCheck(ctx: BotContext, vin: string): Promise<void>
async function handleHelp(ctx: BotContext): Promise<void>
async function sendReportPDF(chatId: string, pdfBuffer: Buffer): Promise<void>
```

**Implementation Details:**
- Uses Telegraf framework
- Webhook-based (not polling)
- Secret token validation on every update
- Commands:
  - /start: Welcome message and instructions
  - /check [VIN]: Validate, decode, preview, payment link
  - /help: Service description, pricing, contact
- Raw VIN messages handled same as /check
- Payment metadata includes chat_id for fulfillment routing

**Security:**
- Validates X-Telegram-Bot-Api-Secret-Token header
- Rate limiting: 3 VIN checks per chat_id per hour
- Input sanitization before processing

### Rate_Limiter

**Purpose:** Prevents API abuse with IP and chat-based throttling

**Interface:**
```typescript
interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

function checkRateLimit(identifier: string, limit: number, windowSeconds: number): RateLimitResult
```

**Implementation Details:**
- In-memory tracking with Map<identifier, request[]>
- Web API: 5 requests per IP per 60 seconds
- Telegram bot: 3 requests per chat_id per 3600 seconds
- Returns HTTP 429 with Retry-After header on breach
- Sliding window algorithm
- Cleanup of expired entries every 5 minutes

### Exchange_Rate_Manager

**Purpose:** Fetches and manages CBN exchange rates

**Interface:**
```typescript
interface ExchangeRate {
  cbnRate: number;
  parallelRate: number;
  fetchedAt: Date;
}

async function fetchExchangeRate(): Promise<ExchangeRate>
function getCurrentRate(): ExchangeRate
```

**Implementation Details:**
- Fetches CBN official rate on application start
- Refreshes every 6 hours
- Stores in memory and database with timestamp
- Also fetches parallel market rate for reference
- Both rates displayed in PDF report
- Duty calculations use CBN official rate only

## Data Models

### Database Schema (Drizzle ORM)

**lookups table:**
```typescript
export const lookups = pgTable('lookups', {
  id: uuid('id').primaryKey().defaultRandom(),
  vin: varchar('vin', { length: 17 }).notNull().unique(),
  decodedJson: jsonb('decoded_json').notNull(),
  ncsValuationUsd: numeric('ncs_valuation_usd').notNull(),
  valuationConfidence: varchar('valuation_confidence', { length: 20 }).notNull(),
  dutyJson: jsonb('duty_json').notNull(),
  cbnRateNgn: numeric('cbn_rate_ngn').notNull(),
  rateFetchedAt: timestamp('rate_fetched_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  refreshedAt: timestamp('refreshed_at', { withTimezone: true })
});
```

**orders table:**
```typescript
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  lookupId: uuid('lookup_id').notNull().references(() => lookups.id),
  email: varchar('email', { length: 255 }).notNull(),
  amountNgn: numeric('amount_ngn').notNull(),
  flwTxRef: varchar('flw_tx_ref').notNull(),
  flwTxId: varchar('flw_tx_id'),
  status: varchar('status', { length: 20 }).notNull(),
  source: varchar('source', { length: 10 }).notNull(),
  telegramChatId: varchar('telegram_chat_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true })
});
```

**reports table:**
```typescript
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id).unique(),
  r2Key: varchar('r2_key').notNull(),
  pdfHash: varchar('pdf_hash', { length: 64 }).notNull(),
  signedUrl: text('signed_url').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
```

### Data Flow and Relationships

**VIN → Lookup → Order → Report**
- One VIN can have multiple lookups (cache refreshes)
- One lookup can have multiple orders (multiple purchases)
- One order has exactly one report (enforced by unique constraint)

**Caching Strategy:**
- Lookups cached for 30 days
- Cache key: normalized VIN
- Cache hit: return from database, no NHTSA call
- Cache miss: fetch from NHTSA, store in database

**Idempotency:**
- Webhook handler checks if report exists before generating
- Prevents duplicate report generation on webhook retries
- Order status transitions: pending → paid (never backwards)

### API Request/Response Models

**POST /api/vin Request:**
```typescript
interface VINLookupRequest {
  vin: string;
}
```

**POST /api/vin Response:**
```typescript
interface VINLookupResponse {
  vin: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  bodyType: string;
  origin: string;
  fuelType: string;
  dutyEstimateNgn: number;
  confidence: string;
  lookupId: string;
}
```

**POST /api/pay/initiate Request:**
```typescript
interface PaymentInitiationRequest {
  lookupId: string;
  email: string;
  source: 'web' | 'telegram';
  telegramChatId?: string;
}
```

**POST /api/pay/initiate Response:**
```typescript
interface PaymentInitiationResponse {
  paymentUrl: string;
}
```

**POST /api/webhook/flutterwave Request:**
```typescript
interface FlutterwaveWebhook {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
    customer: {
      email: string;
    };
  };
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

- Properties 4.1-4.6 (individual duty calculations) can be combined into a single comprehensive property that validates all duty components
- Properties 9.2-9.8 (PDF content sections) can be combined into a single property that validates all required content is present
- Properties 13.1-13.5 (preview response fields) can be combined into a single property about response structure
- Properties 15.2, 15.4, 15.5 (database field storage) can be combined into properties about complete record storage

The following properties represent the unique, non-redundant validation requirements:

### Property 1: VIN Normalization Idempotence

*For any* string input, normalizing it twice should produce the same result as normalizing it once (normalization is idempotent).

**Validates: Requirements 1.1**

### Property 2: VIN Length Validation

*For any* normalized string, it should pass length validation if and only if it is exactly 17 characters.

**Validates: Requirements 1.2**

### Property 3: VIN Character Set Validation

*For any* 17-character string, it should pass character validation if and only if all characters are in the set [A-H, J-N, P-R, Z, 0-9].

**Validates: Requirements 1.3**

### Property 4: Invalid VIN Error Without Side Effects

*For any* invalid VIN input, the validator should return an error message without making any external API calls or database writes.

**Validates: Requirements 1.5**

### Property 5: WMI Extraction Consistency

*For any* valid VIN, the extracted WMI (characters 1-3) should always map to the same country of manufacture.

**Validates: Requirements 1.6**

### Property 6: NHTSA Response Field Extraction

*For any* valid NHTSA API response, all required fields (Make, Model, Year, Engine, Displacement, Body Class, Plant Country, Drive Type, Fuel Type) should be extracted and present in the result.

**Validates: Requirements 2.2**

### Property 7: Successful Decode Creates Cache Entry

*For any* successful VIN decode, a lookup record should be created in the database with all required fields (decoded JSON, valuation, duty breakdown, exchange rate, timestamps).

**Validates: Requirements 2.4, 15.2**

### Property 8: Valuation Lookup Key Format

*For any* vehicle specification, the valuation lookup key should be formatted as "YEAR-MAKE-MODEL" in uppercase.

**Validates: Requirements 3.1**

### Property 9: Valuation Confidence Recording

*For any* valuation result, the confidence level and matched key (or estimation method) should be recorded.

**Validates: Requirements 3.5**

### Property 10: Duty Calculation Completeness

*For any* valid CIF value and CBN rate, the duty calculation should return all required components (Import Duty at 35%, Surcharge at 7% of duty, NAC Levy at 20%, CISS at 1%, ETLS at 0.5%, VAT at 7.5% of sum) with both NGN and USD amounts, plus metadata (CBN rate, rate timestamp, Finance Act year).

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8**

### Property 11: Duty Calculation Determinism

*For any* CIF value and CBN rate, calculating duties multiple times with the same inputs should always produce identical results.

**Validates: Requirements 4.1-4.8**

### Property 12: Rate Limit Tracking Per Identifier

*For any* request identifier (IP or chat ID), the rate limiter should track requests independently from other identifiers.

**Validates: Requirements 5.1, 12.4**

### Property 13: Rate Limit Response Headers

*For any* rate-limited request, the response should include a Retry-After header with the number of seconds until the limit resets.

**Validates: Requirements 5.3**

### Property 14: Email Validation

*For any* string, it should pass email validation if and only if it matches a valid email format (contains @ and domain).

**Validates: Requirements 6.1**

### Property 15: Lookup ID Referential Integrity

*For any* payment initiation request, the lookup ID should exist in the database before payment processing proceeds.

**Validates: Requirements 6.2**

### Property 16: Transaction Reference Format

*For any* generated transaction reference, it should match the format "vin-{uuid}" where uuid is a valid UUID v4.

**Validates: Requirements 6.3**

### Property 17: Payment Initiation Creates Pending Order

*For any* valid payment initiation, an order record should be created with status "pending" and all required fields (lookup ID, email, amount, transaction reference, source).

**Validates: Requirements 6.4, 15.4**

### Property 18: Payment Response Contains URL

*For any* successful payment initiation, the response should contain a Flutterwave payment URL.

**Validates: Requirements 6.6**

### Property 19: HMAC Verification Rejects Invalid Signatures

*For any* webhook request with an invalid HMAC signature, the webhook handler should reject the request without processing the payload.

**Validates: Requirements 7.2, 7.3**

### Property 20: Webhook Event Type Filtering

*For any* webhook request, it should only be processed if the event type is "charge.completed" and status is "successful".

**Validates: Requirements 7.5**

### Property 21: Webhook Amount Validation

*For any* verified webhook, the transaction amount should match the expected amount in the database before fulfillment proceeds.

**Validates: Requirements 7.7**

### Property 22: Webhook Always Returns 200

*For any* webhook request (valid or invalid), the response status should be HTTP 200 to prevent Flutterwave retries.

**Validates: Requirements 7.9**

### Property 23: Payment Confirmation Updates Order

*For any* verified payment webhook, the order status should be updated to "paid" with the Flutterwave transaction ID and payment timestamp recorded.

**Validates: Requirements 8.1**

### Property 24: Report Generation Idempotency

*For any* order, processing the payment webhook multiple times should result in exactly one report being generated.

**Validates: Requirements 8.2**

### Property 25: Report PDF Hash Storage

*For any* generated report, a SHA-256 hash of the PDF bytes should be computed and stored with the report record.

**Validates: Requirements 8.4**

### Property 26: R2 Key Format

*For any* uploaded PDF report, the R2 key should match the format "reports/{year}/{month}/{report-uuid}.pdf" where year and month are from the creation timestamp.

**Validates: Requirements 8.5**

### Property 27: Pre-signed URL Expiry

*For any* generated pre-signed URL, the expiry time should be 72 hours from generation.

**Validates: Requirements 8.6, 10.2**

### Property 28: Report Delivery Timestamp Recording

*For any* delivered report, the sent_at timestamp should be recorded in the database.

**Validates: Requirements 8.9**

### Property 29: PDF Report Content Completeness

*For any* generated PDF report, it should contain all required sections: header (logo, report ID, VIN, timestamp), vehicle identity (make, model, year, engine, body type, drive type, fuel type, plant country), NCS valuation (CIF in USD/NGN, confidence, match basis), duty breakdown (all components in NGN/USD), exchange rates (CBN and parallel with timestamps), disclaimer, and footer (report ID, page number, URL).

**Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8**

### Property 30: Report ID Format

*For any* generated report, the report ID should be a valid UUID v4.

**Validates: Requirements 10.3**

### Property 31: Telegram Bot Chat ID Embedding

*For any* Telegram-initiated payment, the payment metadata should include the chat ID.

**Validates: Requirements 11.4**

### Property 32: Telegram Bot VIN Validation

*For any* VIN submitted via Telegram bot, the same validation rules should apply as the web interface.

**Validates: Requirements 11.2**

### Property 33: Telegram Bot Secret Token Validation

*For any* Telegram webhook request with an invalid secret token, the request should be rejected with HTTP 401 status.

**Validates: Requirements 12.2**

### Property 34: Telegram Bot Input Sanitization

*For any* user input received by the Telegram bot, it should be sanitized before processing to prevent injection attacks.

**Validates: Requirements 12.6**

### Property 35: VIN Lookup Preview Response Structure

*For any* successful VIN lookup, the preview response should contain all required fields (VIN, make, model, year, engine, body type, origin, fuel type, duty estimate, confidence, lookup ID) and should NOT contain the detailed duty breakdown.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**

### Property 36: Exchange Rate Timestamp Storage

*For any* fetched exchange rate, it should be stored with a timestamp indicating when it was fetched.

**Validates: Requirements 14.2**

### Property 37: Duty Calculation Rate Immutability

*For any* duty calculation, the exchange rate used should be recorded and never changed retroactively.

**Validates: Requirements 14.5**

### Property 38: Complete Report Record Storage

*For any* generated report, all required fields should be stored in the database (order ID, R2 key, PDF hash, signed URL, sent_at, created_at).

**Validates: Requirements 15.5**

### Property 39: NHTSA Response Round-Trip

*For any* valid NHTSA API response, parsing the response to a vehicle object, serializing to JSON, and deserializing back should produce an equivalent vehicle object.

**Validates: Requirements 17.1, 17.3, 17.4, 17.5**

## Error Handling

### VIN Validation Errors

**Invalid Length:**
- Error message: "VIN must be exactly 17 characters"
- HTTP status: 400 Bad Request
- No external API calls made

**Invalid Characters:**
- Error message: "VIN contains invalid characters. Only A-H, J-N, P-R, Z, and 0-9 are allowed"
- HTTP status: 400 Bad Request
- No external API calls made

**Invalid Check Digit:**
- Error message: "VIN check digit validation failed"
- HTTP status: 400 Bad Request
- No external API calls made

### NHTSA API Errors

**503 Service Unavailable:**
- Retry once with 1-second exponential backoff
- If retry fails, return error to client
- Error message: "Vehicle decoding service temporarily unavailable. Please try again."
- HTTP status: 503 Service Unavailable

**Timeout:**
- Retry once with 1-second exponential backoff
- If retry fails, return error to client
- Error message: "Vehicle decoding request timed out. Please try again."
- HTTP status: 504 Gateway Timeout

**Invalid Response Structure:**
- Log error with response details
- Error message: "Unable to decode VIN. Please verify the VIN is correct."
- HTTP status: 500 Internal Server Error

### Payment Errors

**Invalid Email:**
- Error message: "Invalid email address format"
- HTTP status: 400 Bad Request

**Lookup ID Not Found:**
- Error message: "Lookup ID not found. Please perform a VIN lookup first."
- HTTP status: 404 Not Found

**Flutterwave API Error:**
- Log error with API response
- Error message: "Payment initiation failed. Please try again."
- HTTP status: 500 Internal Server Error

### Webhook Errors

**Invalid HMAC Signature:**
- Log attempt with IP address and timestamp
- HTTP status: 401 Unauthorized (but still return 200 to Flutterwave)
- No processing performed

**Amount Mismatch:**
- Log discrepancy with expected vs actual amounts
- HTTP status: 200 OK (to prevent retries)
- No fulfillment performed
- Alert system operator

**Transaction Verification Failed:**
- Log error with transaction details
- HTTP status: 200 OK (to prevent retries)
- No fulfillment performed

### Rate Limiting Errors

**Web API Rate Limit Exceeded:**
- HTTP status: 429 Too Many Requests
- Retry-After header: seconds until reset
- Error message: "Rate limit exceeded. Please try again in {seconds} seconds."

**Telegram Bot Rate Limit Exceeded:**
- Bot message: "You've reached the rate limit. Please try again in {minutes} minutes."
- No HTTP response (bot message only)

### PDF Generation Errors

**Puppeteer Failure:**
- Log error with stack trace
- Retry once
- If retry fails, alert system operator
- Do not send email/bot message

**R2 Upload Failure:**
- Log error with details
- Retry once with exponential backoff
- If retry fails, alert system operator
- Do not send email/bot message

### Email Delivery Errors

**Resend API Error:**
- Log error with API response
- Do not retry (to prevent duplicate emails)
- Alert system operator
- Mark report as generated but not delivered

### Database Errors

**Connection Failure:**
- Log error with connection details
- Return HTTP 500 Internal Server Error
- Error message: "Database connection failed. Please try again."

**Constraint Violation:**
- Log error with constraint details
- Return HTTP 409 Conflict for duplicate VIN
- Return HTTP 400 Bad Request for other violations

**Query Timeout:**
- Log error with query details
- Return HTTP 504 Gateway Timeout
- Error message: "Database query timed out. Please try again."

## Testing Strategy

### Dual Testing Approach

The VIN Check MVP will use both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests:**
- Specific examples demonstrating correct behavior
- Edge cases (empty strings, boundary values, special characters)
- Error conditions (invalid inputs, API failures, network errors)
- Integration points between components
- Webhook security scenarios

**Property-Based Tests:**
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Each test tagged with reference to design property

### Property-Based Testing Configuration

**Library Selection:**
- JavaScript/TypeScript: fast-check
- Minimum 100 iterations per test (configured via `fc.assert` options)
- Seed-based reproducibility for failed tests

**Test Tagging Format:**
```typescript
// Feature: vin-check-mvp, Property 1: VIN Normalization Idempotence
test('VIN normalization is idempotent', () => {
  fc.assert(
    fc.property(fc.string(), (input) => {
      const normalized1 = normalizeVIN(input);
      const normalized2 = normalizeVIN(normalized1);
      expect(normalized1).toBe(normalized2);
    }),
    { numRuns: 100 }
  );
});
```

### Test Coverage by Component

**VIN_Validator:**
- Unit tests: Known valid VINs, known invalid VINs, edge cases
- Property tests: Properties 1, 2, 3, 4, 5

**NHTSA_Decoder:**
- Unit tests: Sample API responses, retry scenarios, error handling
- Property tests: Properties 6, 7, 39

**NCS_Valuator:**
- Unit tests: Exact matches, interpolated matches, fallback estimates
- Property tests: Properties 8, 9

**Duty_Engine:**
- Unit tests: Known CIF values with expected outputs
- Property tests: Properties 10, 11

**Rate_Limiter:**
- Unit tests: Rate limit threshold scenarios, reset behavior
- Property tests: Properties 12, 13

**Payment_Gateway:**
- Unit tests: Successful payment initiation, API errors
- Property tests: Properties 14, 15, 16, 17, 18

**Webhook_Handler:**
- Unit tests: Valid webhooks, invalid signatures, amount mismatches
- Property tests: Properties 19, 20, 21, 22, 23, 24

**Report_Generator:**
- Unit tests: Sample report generation, PDF format validation
- Property tests: Properties 25, 26, 27, 28, 29, 30, 38

**Storage_Service:**
- Unit tests: Upload success, upload failure, signed URL generation
- Property tests: Properties 26, 27, 30

**Telegram_Bot:**
- Unit tests: Command handling, message formatting
- Property tests: Properties 31, 32, 33, 34

**Exchange_Rate_Manager:**
- Unit tests: Rate fetching, storage, retrieval
- Property tests: Properties 36, 37

**API Routes:**
- Unit tests: Request/response validation, error scenarios
- Property tests: Properties 35

### Integration Testing

**End-to-End Flows:**
1. Web VIN lookup → payment → report delivery
2. Telegram VIN lookup → payment → report delivery
3. Webhook retry handling (idempotency)
4. Cache hit vs cache miss behavior
5. Rate limiting across multiple requests

**External Service Mocking:**
- NHTSA API: Mock responses for testing
- Flutterwave API: Use test mode credentials
- Resend: Use test mode or mock
- R2: Use test bucket or mock
- Telegram API: Use test bot or mock

### Security Testing

**HMAC Verification:**
- Test with valid signatures
- Test with invalid signatures
- Test with missing signatures
- Test with timing attacks (verify timingSafeEqual usage)

**Rate Limiting:**
- Test threshold enforcement
- Test reset behavior
- Test concurrent requests from same identifier

**Input Validation:**
- Test SQL injection attempts (should be prevented by Drizzle)
- Test XSS attempts (should be prevented by Svelte)
- Test command injection in VIN input
- Test email header injection

**Access Control:**
- Verify R2 bucket is private
- Verify pre-signed URLs expire correctly
- Verify report IDs are non-enumerable (UUID v4)

### Performance Testing

**Response Time Targets:**
- VIN validation: < 50ms
- VIN lookup (cache hit): < 100ms
- VIN lookup (cache miss): < 3 seconds
- Payment initiation: < 500ms
- Webhook processing: < 5 seconds (async fulfillment)
- PDF generation: < 10 seconds

**Load Testing:**
- Simulate 100 concurrent VIN lookups
- Simulate 50 concurrent payment initiations
- Simulate 20 concurrent webhook deliveries
- Verify rate limiting works under load

### Monitoring and Observability

**Metrics to Track:**
- VIN lookup success/failure rates
- NHTSA API response times and error rates
- Payment initiation success rates
- Webhook processing times
- PDF generation times
- Email delivery success rates
- Rate limit trigger frequency

**Logging Requirements:**
- All validation errors with input details (sanitized)
- All external API calls with response times
- All webhook attempts with HMAC verification results
- All payment state transitions
- All report generation and delivery events
- All rate limit violations

**Alerting Thresholds:**
- NHTSA API error rate > 10%
- Webhook HMAC verification failure rate > 1%
- PDF generation failure rate > 5%
- Email delivery failure rate > 5%
- Database connection failures
- R2 upload failures

