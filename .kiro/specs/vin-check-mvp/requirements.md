# Requirements Document

## Introduction

The VIN Check MVP is a no-authentication web application and Telegram bot that enables Nigerian clearing agents and used car buyers to decode Vehicle Identification Numbers (VINs), preview vehicle details, and purchase comprehensive PDF reports containing NCS duty estimates. The system validates VINs, decodes vehicle specifications via NHTSA vPIC API, calculates Nigerian Customs Service import duties, processes payments via Flutterwave, and delivers PDF reports via email or Telegram.

## Glossary

- **VIN_Validator**: Component that validates VIN format and check digit per ISO 3779
- **NHTSA_Decoder**: Component that retrieves vehicle specifications from NHTSA vPIC API
- **Duty_Engine**: Component that calculates Nigerian import duties and levies
- **NCS_Valuator**: Component that determines CIF value from valuation table
- **Payment_Gateway**: Flutterwave payment processing interface
- **Report_Generator**: Puppeteer-based PDF generation component
- **Storage_Service**: Cloudflare R2 object storage for PDF files
- **Email_Service**: Resend email delivery service
- **Telegram_Bot**: Telegraf-based bot interface
- **Rate_Limiter**: IP-based request throttling component
- **Webhook_Handler**: Payment confirmation processor with HMAC verification
- **Lookup_Cache**: Database table storing decoded VIN results
- **CIF**: Cost, Insurance, and Freight value in USD
- **NAC**: National Automotive Council levy
- **CISS**: Comprehensive Import Supervision Scheme fee
- **ETLS**: Electronic Trade Levy Scheme fee
- **CBN**: Central Bank of Nigeria

## Requirements

### Requirement 1: VIN Validation and Normalization

**User Story:** As a clearing agent, I want the system to validate VINs before processing, so that I only pay for valid vehicle lookups.

#### Acceptance Criteria

1. WHEN a VIN is submitted, THE VIN_Validator SHALL normalize the input by removing whitespace, converting to uppercase, and substituting O→0, I→1, Q→0
2. THE VIN_Validator SHALL verify the normalized VIN is exactly 17 alphanumeric characters
3. THE VIN_Validator SHALL verify the VIN contains only characters A-H, J-N, P-R, Z, and 0-9
4. THE VIN_Validator SHALL compute and verify the ISO 3779 check digit at position 9
5. IF the VIN fails any validation rule, THEN THE VIN_Validator SHALL return a descriptive error message without making external API calls
6. WHEN validation succeeds, THE VIN_Validator SHALL extract the WMI (characters 1-3) and map it to the country of manufacture

### Requirement 2: Vehicle Decoding via NHTSA

**User Story:** As a user, I want to see accurate vehicle specifications, so that I can verify the VIN corresponds to the correct vehicle.

#### Acceptance Criteria

1. WHEN a validated VIN is not cached, THE NHTSA_Decoder SHALL call the NHTSA vPIC API endpoint with the VIN
2. THE NHTSA_Decoder SHALL extract Make, Model, Model Year, Engine, Displacement, Body Class, Plant Country, Drive Type, and Fuel Type from the API response
3. IF the NHTSA API returns a 503 or timeout error, THEN THE NHTSA_Decoder SHALL retry once with exponential backoff
4. WHEN decoding succeeds, THE System SHALL store the decoded result in the Lookup_Cache with a timestamp
5. WHEN a VIN exists in the Lookup_Cache and was created within 30 days, THE System SHALL return the cached result without calling NHTSA

### Requirement 3: NCS Valuation Lookup

**User Story:** As a clearing agent, I want to see the NCS assessed value, so that I can estimate import duties accurately.

#### Acceptance Criteria

1. WHEN vehicle specifications are decoded, THE NCS_Valuator SHALL lookup the CIF value using Year-Make-Model as the key in the valuation table
2. IF an exact match exists, THEN THE NCS_Valuator SHALL return the CIF value with confidence level "exact"
3. IF no exact match exists, THEN THE NCS_Valuator SHALL search for the nearest year with the same Make and Model and return confidence level "interpolated"
4. IF no Make-Model match exists, THEN THE NCS_Valuator SHALL return a fallback estimate with confidence level "estimated"
5. THE NCS_Valuator SHALL record the matched key or estimation method used for the valuation

### Requirement 4: Import Duty Calculation

**User Story:** As a clearing agent, I want to see a complete breakdown of all import duties and levies, so that I can budget accurately for vehicle clearance.

#### Acceptance Criteria

1. WHEN a CIF value and CBN exchange rate are available, THE Duty_Engine SHALL calculate Import Duty as 35% of CIF value in NGN
2. THE Duty_Engine SHALL calculate Surcharge as 7% of the Import Duty amount
3. THE Duty_Engine SHALL calculate NAC Levy as 20% of CIF value in NGN
4. THE Duty_Engine SHALL calculate CISS as 1% of CIF value in NGN
5. THE Duty_Engine SHALL calculate ETLS as 0.5% of CIF value in NGN
6. THE Duty_Engine SHALL calculate VAT as 7.5% of the sum of CIF value and all above duties
7. THE Duty_Engine SHALL return each duty component separately with both NGN and USD amounts
8. THE Duty_Engine SHALL stamp the calculation with the CBN rate used, rate timestamp, and Finance Act year governing the rates

### Requirement 5: VIN Lookup API Rate Limiting

**User Story:** As the system operator, I want to prevent API abuse, so that the service remains available for legitimate users.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL track VIN lookup requests by source IP address
2. WHEN an IP address makes more than 5 requests within 60 seconds, THE Rate_Limiter SHALL reject subsequent requests with HTTP 429 status
3. WHEN rejecting a rate-limited request, THE System SHALL include a Retry-After header indicating seconds until the limit resets
4. THE Rate_Limiter SHALL reset the request count for each IP address after 60 seconds from the first request

### Requirement 6: Payment Initiation

**User Story:** As a user, I want to pay securely for the full report, so that I can receive the comprehensive duty breakdown.

#### Acceptance Criteria

1. WHEN a user requests payment, THE System SHALL validate the email address format
2. THE System SHALL verify the lookup ID exists in the database
3. THE System SHALL generate a unique transaction reference in the format "vin-{uuid}"
4. THE System SHALL create an order record with status "pending" and store the transaction reference
5. THE System SHALL call the Flutterwave API to create a payment link with the transaction reference, amount, email, and redirect URL
6. THE System SHALL return the Flutterwave payment URL to the client

### Requirement 7: Flutterwave Webhook Security

**User Story:** As the system operator, I want to verify all payment webhooks are authentic, so that fraudulent payment confirmations cannot trigger report delivery.

#### Acceptance Criteria

1. WHEN a webhook request is received, THE Webhook_Handler SHALL read the raw request body as a Buffer before parsing
2. THE Webhook_Handler SHALL compute HMAC-SHA512 of the raw body using the Flutterwave secret hash
3. THE Webhook_Handler SHALL compare the computed HMAC with the verif-hash header using crypto.timingSafeEqual
4. IF the HMAC comparison fails, THEN THE Webhook_Handler SHALL reject the request with HTTP 401 status and log the attempt
5. THE Webhook_Handler SHALL verify the event type is "charge.completed" and status is "successful"
6. THE Webhook_Handler SHALL call the Flutterwave transaction verification API to re-verify the transaction
7. THE Webhook_Handler SHALL compare the verified amount with the expected amount in the database
8. IF the amounts do not match, THEN THE Webhook_Handler SHALL reject the webhook and log the discrepancy
9. THE Webhook_Handler SHALL return HTTP 200 to Flutterwave regardless of internal processing success to prevent retries

### Requirement 8: Payment Fulfillment and Report Delivery

**User Story:** As a user, I want to receive my PDF report immediately after payment, so that I can proceed with vehicle clearance planning.

#### Acceptance Criteria

1. WHEN a payment webhook is verified, THE System SHALL update the order status to "paid" and record the Flutterwave transaction ID and payment timestamp
2. THE System SHALL check if a report already exists for the order to ensure idempotent processing
3. IF no report exists, THEN THE Report_Generator SHALL generate a PDF containing all vehicle details and duty breakdown
4. THE Report_Generator SHALL compute SHA-256 hash of the PDF bytes and store it with the report record
5. THE Storage_Service SHALL upload the PDF to R2 with key format "reports/{year}/{month}/{report-uuid}.pdf"
6. THE Storage_Service SHALL generate a pre-signed GetObject URL with 72-hour expiry
7. WHERE the order source is "web", THE Email_Service SHALL send the PDF report to the provided email address with the signed URL
8. WHERE the order source is "telegram", THE Telegram_Bot SHALL send the PDF file directly to the chat ID
9. THE System SHALL record the report delivery timestamp

### Requirement 9: PDF Report Content and Structure

**User Story:** As a clearing agent, I want a comprehensive PDF report, so that I have all necessary information for customs clearance.

#### Acceptance Criteria

1. THE Report_Generator SHALL render the PDF using Puppeteer with A4 format and 15mm margins on all sides
2. THE Report_Generator SHALL include a header section with logo, report ID, VIN, and generation timestamp
3. THE Report_Generator SHALL include a Vehicle Identity section displaying Make, Model, Year, Engine, Body Type, Drive Type, Fuel Type, and Plant Country
4. THE Report_Generator SHALL include an NCS Valuation section displaying CIF value in USD and NGN, confidence level, and match basis
5. THE Report_Generator SHALL include a Duty Breakdown section with a table showing each duty component in both NGN and USD
6. THE Report_Generator SHALL include an Exchange Rates section displaying CBN official rate and parallel market rate with timestamps
7. THE Report_Generator SHALL include a Disclaimer section stating "Estimate only. Verify final figures with NCS at port of entry."
8. THE Report_Generator SHALL include a footer with report ID, page number, and website URL

### Requirement 10: R2 Storage Security

**User Story:** As the system operator, I want PDF reports stored securely, so that only paying customers can access their reports.

#### Acceptance Criteria

1. THE Storage_Service SHALL configure the R2 bucket as private with no public access
2. THE Storage_Service SHALL generate pre-signed URLs with 72-hour expiry for each report delivery
3. THE System SHALL use UUID v4 as report IDs to prevent enumeration attacks
4. WHEN a report resend is requested, THE Storage_Service SHALL regenerate a new signed URL rather than reusing the stored URL

### Requirement 11: Telegram Bot VIN Check Flow

**User Story:** As a Telegram user, I want to check VINs and receive reports in chat, so that I can use the service without visiting the website.

#### Acceptance Criteria

1. WHEN a user sends /start, THE Telegram_Bot SHALL respond with a welcome message and instructions
2. WHEN a user sends /check followed by a VIN or sends a raw VIN message, THE Telegram_Bot SHALL validate the VIN inline
3. IF the VIN is valid, THEN THE Telegram_Bot SHALL decode the vehicle and respond with a preview message and payment link
4. THE Telegram_Bot SHALL embed the chat ID in the payment metadata
5. WHEN payment is confirmed for a Telegram order, THE Telegram_Bot SHALL send the PDF file directly to the user's chat
6. WHEN a user sends /help, THE Telegram_Bot SHALL respond with service description, pricing, and contact information

### Requirement 12: Telegram Bot Security and Rate Limiting

**User Story:** As the system operator, I want to prevent bot abuse, so that the service remains cost-effective and available.

#### Acceptance Criteria

1. THE Telegram_Bot SHALL register the webhook with a secret token
2. WHEN a webhook update is received, THE Telegram_Bot SHALL validate the X-Telegram-Bot-Api-Secret-Token header
3. IF the secret token is invalid, THEN THE Telegram_Bot SHALL reject the request with HTTP 401 status
4. THE Telegram_Bot SHALL track VIN check requests by chat ID
5. WHEN a chat ID makes more than 3 VIN check requests within 60 minutes, THE Telegram_Bot SHALL reject subsequent requests with a rate limit message
6. THE Telegram_Bot SHALL sanitize all user input before processing to prevent injection attacks

### Requirement 13: VIN Lookup Preview Response

**User Story:** As a user, I want to see basic vehicle information before paying, so that I can verify the VIN is correct.

#### Acceptance Criteria

1. WHEN a VIN lookup succeeds, THE System SHALL return Make, Model, Year, Engine, Body Type, Origin Country, and Fuel Type
2. THE System SHALL return a duty estimate teaser showing the total estimated duty in NGN
3. THE System SHALL return the valuation confidence level
4. THE System SHALL return the lookup ID for use in payment initiation
5. THE System SHALL not include the detailed duty breakdown in the preview response

### Requirement 14: Exchange Rate Management

**User Story:** As the system operator, I want to use current exchange rates, so that duty calculations reflect realistic costs.

#### Acceptance Criteria

1. WHEN the application starts, THE System SHALL fetch the CBN official exchange rate
2. THE System SHALL store the exchange rate in memory and database with a fetched timestamp
3. THE System SHALL refresh the exchange rate every 6 hours
4. WHEN calculating duties, THE System SHALL use the most recently fetched exchange rate
5. THE System SHALL record which exchange rate was used for each duty calculation to ensure calculations are never retroactively changed

### Requirement 15: Database Schema and Data Integrity

**User Story:** As the system operator, I want reliable data storage, so that all transactions and reports are traceable.

#### Acceptance Criteria

1. THE System SHALL use Drizzle ORM with parameterized queries for all database operations
2. THE System SHALL store VIN lookups with decoded JSON, NCS valuation, duty breakdown, exchange rate, and timestamps
3. THE System SHALL enforce a unique constraint on the VIN column in the lookups table
4. THE System SHALL store orders with lookup reference, email, amount, Flutterwave transaction references, status, source, and timestamps
5. THE System SHALL store reports with order reference, R2 key, PDF hash, signed URL, and timestamps
6. THE System SHALL enforce a unique foreign key constraint between reports and orders to ensure one report per order

### Requirement 16: Environment Configuration Security

**User Story:** As the system operator, I want all secrets managed securely, so that credentials are never exposed in the codebase.

#### Acceptance Criteria

1. THE System SHALL load all API keys, database credentials, and secrets from environment variables
2. THE System SHALL never commit secrets to the Git repository
3. THE System SHALL validate that all required environment variables are present at application startup
4. IF any required environment variable is missing, THEN THE System SHALL log the missing variable name and exit with a non-zero status code

### Requirement 17: VIN Decode Parser and Pretty Printer

**User Story:** As a developer, I want to reliably parse NHTSA API responses, so that vehicle data is accurately extracted and stored.

#### Acceptance Criteria

1. WHEN the NHTSA API returns a response, THE NHTSA_Decoder SHALL parse the Results array into a structured vehicle object
2. THE NHTSA_Decoder SHALL extract fields by VariableId rather than variable name for stability
3. THE System SHALL serialize the parsed vehicle object to JSON for storage in the database
4. THE System SHALL deserialize the stored JSON back to a vehicle object when generating reports
5. FOR ALL valid NHTSA responses, parsing then serializing then parsing SHALL produce an equivalent vehicle object (round-trip property)
