**VIN CHECK MVP**

Full-Stack Build Brief for Kiro

  ----------------------------------------------
  **Stack**          SvelteKit + Drizzle +
                     postgres.js
  ------------------ ---------------------------
  **Database**       PostgreSQL (Railway)

  **Payment**        Flutterwave

  **Email**          Resend

  **PDF**            Puppeteer (server-side)

  **Bot**            Telegraf (same monorepo)

  **Storage**        Cloudflare R2 (PDF storage)

  **Deploy**         Railway (SvelteKit + Bot
                     worker)

  **Auth**           None --- no login, no
                     sessions
  ----------------------------------------------

Generated Wed Mar 25 2026

# **1. Product Overview**

A no-auth, no-login SvelteKit web app and Telegram bot that lets anyone
paste a VIN, instantly preview decoded vehicle details, pay to unlock a
comprehensive PDF report, and receive it by email. The primary market is
Nigerian clearing agents and used car buyers who need accurate NCS duty
estimates.

## **Core User Flow**

1.  User pastes VIN on homepage

2.  System validates, decodes via NHTSA, runs duty engine, caches result

3.  Preview page shows: Make, Model, Year, Engine, Origin country,
    Import duty estimate teaser

4.  User clicks \"Get Full Report\" --- enters email, pays via
    Flutterwave (₦2,500--₦5,000)

5.  On payment confirmation: PDF generated, uploaded to R2, emailed via
    Resend

6.  Telegram bot mirrors the same flow --- sends PDF directly in chat

# **2. Project Structure**

Monorepo. SvelteKit handles web + all API routes. Bot runs as a separate
Node process from the same repo.

  ------------------------------------------------------------------------------------------
  **Path**                                        **Purpose**
  ----------------------------------------------- ------------------------------------------
  src/routes/                                     All SvelteKit pages and API endpoints

  src/routes/(web)/                               Public-facing pages

  src/routes/(web)/+page.svelte                   Homepage --- VIN input

  src/routes/(web)/result/\[vin\]/+page.svelte    Basic preview page

  src/routes/(web)/pay/\[vin\]/+page.svelte       Payment page (email + Flutterwave)

  src/routes/api/vin/+server.ts                   POST --- validate, decode, cache, return
                                                  preview

  src/routes/api/pay/initiate/+server.ts          POST --- create Flutterwave payment link

  src/routes/api/webhook/flutterwave/+server.ts   POST --- verify payment, trigger PDF +
                                                  email

  src/routes/api/webhook/telegram/+server.ts      POST --- handle bot updates

  src/lib/server/db/                              Drizzle client + schema definitions

  src/lib/server/vin/                             VIN validation + NHTSA decode logic

  src/lib/server/duty/                            NCS valuation + full duty calculation
                                                  engine

  src/lib/server/pdf/                             Puppeteer PDF generation + R2 upload

  src/lib/server/email/                           Resend email client

  src/lib/server/payment/                         Flutterwave wrapper + HMAC verification

  src/lib/server/rate-limit/                      In-memory IP rate limiter for API routes

  src/lib/server/exchange-rate/                   CBN rate fetcher (scheduled)

  src/lib/data/valuation_table.json               Static Year/Make/Model → NCS USD value map

  src/bot/                                        Telegraf bot entry point + handler logic

  drizzle/                                        Drizzle migration files

  drizzle.config.ts                               Drizzle config pointing at Railway
                                                  Postgres
  ------------------------------------------------------------------------------------------

# **3. Database Schema (Drizzle + postgres.js)**

Three tables. No user table. VIN is the identity anchor across all
lookups.

## **Table: lookups**

  ------------------------------------------------------------------------------
  **Column**             **Type**        **Notes**
  ---------------------- --------------- ---------------------------------------
  id                     uuid PK         Default gen_random_uuid()

  vin                    varchar(17)     Normalised, uppercased
                         UNIQUE          

  decoded_json           jsonb           Raw NHTSA vPIC response

  ncs_valuation_usd      numeric         Estimated NCS assessed value in USD

  valuation_confidence   varchar(20)     exact \| interpolated \| estimated

  duty_json              jsonb           Full duty calculation breakdown object

  cbr_rate_ngn           numeric         Exchange rate used at time of
                                         calculation

  rate_fetched_at        timestamptz     When the CBN rate was pulled

  created_at             timestamptz     Default now()

  refreshed_at           timestamptz     Last time decode was re-fetched (null =
                                         fresh)
  ------------------------------------------------------------------------------

## **Table: orders**

  --------------------------------------------------------------------------
  **Column**         **Type**        **Notes**
  ------------------ --------------- ---------------------------------------
  id                 uuid PK         

  lookup_id          uuid FK         References lookups.id

  email              varchar(255)    Where report gets delivered

  amount_ngn         numeric         Amount charged in kobo --- store what
                                     Flutterwave confirms

  flw_tx_ref         varchar         Your generated tx_ref sent to
                                     Flutterwave

  flw_tx_id          varchar         Flutterwave transaction ID from webhook

  status             varchar(20)     pending \| paid \| failed \| refunded

  source             varchar(10)     web \| telegram

  telegram_chat_id   varchar         Populated if source = telegram

  created_at         timestamptz     Default now()

  paid_at            timestamptz     Null until webhook confirms
  --------------------------------------------------------------------------

## **Table: reports**

  ------------------------------------------------------------------------
  **Column**       **Type**        **Notes**
  ---------------- --------------- ---------------------------------------
  id               uuid PK         This is the report reference number

  order_id         uuid FK UNIQUE  One report per order

  r2_key           varchar         R2 object key for the PDF file

  pdf_hash         varchar(64)     SHA-256 of PDF bytes --- immutable
                                   integrity check

  signed_url       text            Pre-signed R2 URL (72hr expiry) ---
                                   regenerated on resend

  sent_at          timestamptz     When email/bot message was dispatched

  created_at       timestamptz     Default now()
  ------------------------------------------------------------------------

# **4. API Routes**

## **POST /api/vin**

### **Request**

> { \"vin\": \"1HGCM82633A004352\" }

### **Logic**

- Normalise VIN: strip whitespace, uppercase, substitute O→0, I→1, Q→0

- Validate 17 chars, alphanumeric (no I, O, Q), check digit (ISO 3779
  algorithm)

- Check lookups table --- if cached within 30 days, return from DB (no
  NHTSA call)

- If cache miss: call NHTSA vPIC /vehicles/DecodeVin/{vin}?format=json

- Extract: Make, Model, Model Year, Engine, Displacement, Body Class,
  Plant Country, Drive Type, Fuel Type

- Run NCS valuation lookup against valuation_table.json

- Run duty calculation engine with current CBN rate

- Persist to lookups table

- Return preview payload --- enough to prove legitimacy, not the full
  breakdown

### **Response (200)**

> { \"vin\": \"\...\", \"make\": \"Honda\", \"model\": \"Accord\",
> \"year\": \"2003\", \"engine\": \"2.4L I4\", \"bodyType\": \"Sedan\",
> \"origin\": \"USA\", \"fuelType\": \"Gasoline\", \"dutyEstimateNgn\":
> 4850000, \"confidence\": \"interpolated\", \"lookupId\": \"uuid\" }
>
> *Rate limit: 5 requests per IP per minute. Return 429 with Retry-After
> header on breach.*

## **POST /api/pay/initiate**

### **Request**

> { \"lookupId\": \"uuid\", \"email\": \"user@example.com\", \"source\":
> \"web\" }

### **Logic**

- Validate email format server-side

- Confirm lookupId exists in DB

- Generate a unique tx_ref: vin-{uuid4} --- store in orders with
  status=pending

- Call Flutterwave /v3/payments with tx_ref, amount, email, redirect_url

- Return the Flutterwave payment link to the client

### **Response (200)**

> { \"paymentUrl\":
> \"https://checkout.flutterwave.com/v3/hosted/pay/\...\" }

## **POST /api/webhook/flutterwave**

### **Security --- Non-Negotiable**

- Read raw request body as Buffer before any parsing

- Compute HMAC-SHA512 of raw body using FLW_SECRET_HASH env var

- Compare with verif-hash header using timingSafeEqual --- reject if
  mismatch (return 401, log)

- Confirm event === charge.completed and data.status === successful

- Re-verify transaction by calling Flutterwave GET
  /v3/transactions/{id}/verify --- never trust webhook payload alone

- Confirm amount_settled matches expected amount in DB --- reject if
  different

### **On Valid Payment**

- Update orders: status=paid, flw_tx_id, paid_at

- Generate PDF via Puppeteer

- Upload to R2, store r2_key + pdf_hash in reports

- Generate signed URL (72hr)

- Send email via Resend with signed URL attached/linked

- If source=telegram: send PDF file directly to telegram_chat_id via Bot
  API

- Return 200 immediately --- do heavy work async (use setImmediate or a
  job queue)

> *Always return 200 to Flutterwave even if your processing fails ---
> otherwise they will retry. Handle failures internally.*

## **POST /api/webhook/telegram**

### **Security**

- Set a secret_token when registering the webhook with Telegram

- Validate X-Telegram-Bot-Api-Secret-Token header on every incoming
  request

- Use telegraf webhookCallback() to handle routing

# **5. Core Server Modules**

## **VIN Validation (src/lib/server/vin/validate.ts)**

- 17 character length check

- Regex: /\^\[A-HJ-NPR-Z0-9\]{17}\$/ --- excludes I, O, Q

- ISO 3779 check digit algorithm (position 9)

- WMI extraction (chars 1-3) → country of manufacture map

- Returns: { valid: boolean, normalised: string, wmi: string, origin:
  string, error?: string }

## **NHTSA Decode (src/lib/server/vin/nhtsa.ts)**

- Endpoint:
  https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}?format=json

- Free, no API key, rate limit is generous for this use case

- Parse Results array --- each element is { Variable, Value, ValueId }

- Extract only needed fields by VariableId (more stable than variable
  name strings)

- Cache result in Redis or in DB --- VIN specs never change, cache
  indefinitely

- Handle 503/timeout with 1 retry + exponential backoff

## **Duty Engine (src/lib/server/duty/calculate.ts)**

Pure function --- no external dependencies. Fully deterministic given
inputs.

  ------------------------------------------------------------------------
  **Tax Component**        **Rate**     **Basis**
  ------------------------ ------------ ----------------------------------
  Import Duty              35%          CIF value in NGN

  Surcharge                7%           Of import duty

  NAC Levy (used vehicles) 20%          Of CIF value in NGN

  CISS                     1%           Of CIF value in NGN

  ETLS                     0.5%         Of CIF value in NGN

  VAT                      7.5%         Of (CIF + all above duties)

  TOTAL                    \~70--75%    Sum of all above + CIF
                           effective    
  ------------------------------------------------------------------------

- Function signature: calculateDuty(cifUsd: number, rateNgn: number):
  DutyBreakdown

- Returns each line item separately --- not just total --- for report
  display

- Also returns: totalNgn, totalUsd, effectiveRatePct, rateSource,
  rateTimestamp

- Stamp the Finance Act year that governs the rates used (e.g. Finance
  Act 2023)

## **NCS Valuation (src/lib/server/duty/valuation.ts)**

- Load valuation_table.json at startup (Map\<string, number\> keyed as
  YEAR-MAKE-MODEL)

- Lookup priority: exact year+make+model → nearest year same make+model
  → make+model average

- Return: { cifUsd: number, confidence: \'exact\' \| \'interpolated\' \|
  \'estimated\', matchedKey: string }

- If no match: use NADA/market proxy (future enhancement) --- for now
  flag as \'estimated\' with hardcoded fallback

## **Exchange Rate (src/lib/server/exchange-rate/index.ts)**

- Fetch CBN official rate from CBN API or scrape CBN website on app
  start + every 6 hours

- Store in memory + DB with fetched_at timestamp

- Also record parallel market rate (fxdata.ng or similar) for reference
  --- display both in report

- Stamp whichever rate was used onto every duty calculation --- never
  recalculate retroactively

## **PDF Generation (src/lib/server/pdf/generate.ts)**

- Use Puppeteer to render a self-contained HTML template to PDF

- Template is a single HTML string built from the lookup + order + duty
  data

- Set format: A4, printBackground: true, margin: 15mm all sides

- Report structure (sections in order):

  - Header: Logo, Report ID (uuid), VIN, generated timestamp

  - Section 1: Vehicle Identity --- make, model, year, engine, body,
    drive, fuel, plant country

  - Section 2: NCS Valuation --- estimated CIF value, confidence level,
    match basis

  - Section 3: Duty Breakdown --- line-by-line table with NGN and USD
    columns

  - Section 4: Exchange Rates --- CBN official + parallel rate, both
    timestamped

  - Section 5: Disclaimer --- \'Estimate only. Verify final figures with
    NCS at port of entry.\'

  - Footer: Report ID, page number, website URL

- Compute SHA-256 of PDF buffer --- store as pdf_hash for integrity

## **R2 Upload (src/lib/server/pdf/storage.ts)**

- Use \@aws-sdk/client-s3 --- R2 is S3-compatible

- Key format: reports/{year}/{month}/{report-uuid}.pdf

- Bucket is private --- never public

- Generate pre-signed GetObject URL with 72-hour expiry for each
  delivery

- Regenerate signed URL on resend requests --- never store the URL
  permanently

# **6. Telegram Bot (src/bot/)**

Runs as a separate Railway service (bot worker) using webhooks, not
polling. Same DB, same modules.

## **Bot Flow**

7.  User sends /start → bot explains the service and asks for VIN

8.  User sends a raw VIN → bot validates inline, replies with basic
    decode preview

9.  Bot sends a Flutterwave payment link (with the user\'s chat_id
    embedded in metadata)

10. User pays → Flutterwave webhook fires → report generated → bot sends
    PDF file directly to chat

## **Commands to Implement**

- /start --- welcome + instructions

- /check \[VIN\] --- decode + preview + payment link (also handles raw
  VIN messages)

- /help --- how it works, pricing, contact

## **Bot Security**

- Register webhook with secret_token --- validate on every update

- Rate limit: 3 VIN checks per chat_id per hour (track in DB or Redis)

- Validate every incoming VIN before any processing

- Never echo back raw user input without sanitisation

# **7. Security Requirements**

  -----------------------------------------------------------------------
  **Threat**             **Mitigation**
  ---------------------- ------------------------------------------------
  Webhook spoofing       HMAC-SHA512 on raw body + re-verify via
  (Flutterwave)          Flutterwave GET API

  VIN endpoint abuse     5 req/min/IP rate limit, return 429 +
                         Retry-After

  Bot abuse              3 checks/hour/chat_id, validate secret_token
                         header

  SQL injection          Drizzle parameterised queries only --- zero raw
                         SQL

  PDF URL enumeration    UUIDs as report IDs, signed URLs with 72hr
                         expiry, private bucket

  Env var leakage        All secrets in Railway env --- never committed
                         to repo

  Timing attacks         crypto.timingSafeEqual for all HMAC comparisons

  Overpayment /          Verify amount in webhook against DB expected
  underpayment fraud     amount before fulfilling

  Double fulfillment     Check reports table before generating ---
                         idempotent webhook handler

  XSS in Svelte pages    Svelte auto-escapes --- no
                         dangerouslySetInnerHTML equivalent; sanitise any
                         user input rendered
  -----------------------------------------------------------------------

# **8. Environment Variables**

  -------------------------------------------------------------------------
  **Variable**              **Description**
  ------------------------- -----------------------------------------------
  DATABASE_URL              Railway Postgres connection string

  FLW_PUBLIC_KEY            Flutterwave public key

  FLW_SECRET_KEY            Flutterwave secret key (server-side only)

  FLW_SECRET_HASH           Flutterwave webhook signature secret

  RESEND_API_KEY            Resend email API key

  R2_ACCOUNT_ID             Cloudflare account ID

  R2_ACCESS_KEY_ID          R2 S3-compatible access key

  R2_SECRET_ACCESS_KEY      R2 S3-compatible secret

  R2_BUCKET_NAME            Your R2 bucket name

  R2_ENDPOINT               https://{account_id}.r2.cloudflarestorage.com

  TELEGRAM_BOT_TOKEN        From BotFather

  TELEGRAM_WEBHOOK_SECRET   Your secret_token for webhook validation

  REPORT_PRICE_NGN          Price in kobo (e.g. 250000 for ₦2,500)

  APP_URL                   Your Railway deploy URL --- used for payment
                            redirect

  FROM_EMAIL                Sender address for Resend (e.g.
                            reports@yourdomain.com)
  -------------------------------------------------------------------------

# **9. Deployment (Railway)**

## **Services**

  -----------------------------------------------------------------------
  **Service**        **Config**
  ------------------ ----------------------------------------------------
  SvelteKit App      node build/index.js --- Railway auto-detects
                     SvelteKit. Set adapter-node.

  Bot Worker         node src/bot/index.js --- separate Railway service,
                     same repo

  PostgreSQL         Railway Postgres plugin --- DATABASE_URL
                     auto-injected
  -----------------------------------------------------------------------

## **Deploy Sequence**

11. railway new --- create project, add Postgres plugin

12. Set all env vars in Railway dashboard

13. npx drizzle-kit push --- apply schema to Railway Postgres

14. git push → Railway deploys SvelteKit automatically

15. Add second Railway service for bot worker

16. Register Telegram webhook: POST
    https://api.telegram.org/bot{TOKEN}/setWebhook with url +
    secret_token

17. Set Flutterwave webhook URL to
    https://your-app.railway.app/api/webhook/flutterwave

18. Smoke test: paste a real VIN, run full flow end-to-end

# **10. Out of Scope (v1)**

> *Do not build any of the following tonight. These are explicitly
> deferred to v2.*

- Auth / login / sessions of any kind

- Admin dashboard or internal tooling

- Bulk CSV VIN upload

- NCS valuation crowdsourcing UI

- Multi-tenant agent accounts / subscription tiers

- Automated CBN rate updates (hardcode a reasonable rate for v1, fetch
  manually to update)

- Report resend / customer self-service

- Any analytics or tracking beyond DB records

# **11. Definition of Done (Tonight)**

  -----------------------------------------------------------------------
        **Criterion**
  ----- -----------------------------------------------------------------
  1     Pasting a valid VIN on the homepage returns a decoded preview
        within 3 seconds

  2     Invalid VINs are rejected with a clear error message --- no API
        calls made

  3     Payment flow completes end-to-end with a test Flutterwave
        transaction

  4     PDF report is generated, uploaded to R2, and delivered by email
        within 60 seconds of payment

  5     Flutterwave webhook rejects any request with invalid HMAC
        signature

  6     Telegram bot responds to a VIN and delivers PDF to chat after
        payment

  7     VIN endpoint returns 429 after 5 requests in 60 seconds from the
        same IP

  8     All secrets are in Railway env vars --- nothing sensitive in the
        codebase

  9     Deployed to Railway and accessible via public URL

  10    R2 bucket is private --- no PDF accessible without a signed URL
  -----------------------------------------------------------------------

**Ship it.**
