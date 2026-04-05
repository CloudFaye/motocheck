import { pgTable, uuid, varchar, jsonb, numeric, timestamp, serial, text, integer, boolean, pgEnum, index } from 'drizzle-orm/pg-core';

// ============================================================================
// ENUMS for Pipeline Architecture
// ============================================================================

/**
 * Report status enum - Tracks pipeline progress
 */
export const reportStatusEnum = pgEnum('report_status', [
	'pending',
	'fetching',
	'normalizing',
	'stitching',
	'analyzing',
	'ready',
	'failed'
]);

/**
 * Data source enum - External data providers
 */
export const dataSourceEnum = pgEnum('data_source', [
	'nhtsa_decode',
	'nhtsa_recalls',
	'nmvtis',
	'nicb',
	'copart',
	'iaai',
	'autotrader',
	'cargurus'
]);

/**
 * Odometer source enum - Where mileage readings come from
 */
export const odometerSourceEnum = pgEnum('odometer_source', [
	'title_transfer',
	'state_inspection',
	'auction',
	'service_record',
	'listing'
]);

/**
 * Event type enum - Types of vehicle history events
 */
export const eventTypeEnum = pgEnum('event_type', [
	'title_transfer',
	'auction_sale',
	'accident',
	'recall',
	'inspection',
	'listing',
	'theft',
	'title_brand'
]);

// ============================================================================
// EXISTING TABLES (Preserved from original schema)
// ============================================================================

/**
 * Lookups table - Stores VIN decoding results and duty calculations
 * Acts as a cache for NHTSA API responses (30-day TTL)
 */
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

/**
 * Orders table - Tracks payment transactions
 * Links lookups to payment processing and fulfillment
 */
export const orders = pgTable('orders', {
	id: uuid('id').primaryKey().defaultRandom(),
	lookupId: uuid('lookup_id')
		.notNull()
		.references(() => lookups.id),
	email: varchar('email', { length: 255 }).notNull(),
	amountNgn: numeric('amount_ngn').notNull(),
	paymentRef: varchar('payment_ref').notNull(),
	paymentId: varchar('payment_id'),
	status: varchar('status', { length: 20 }).notNull(),
	source: varchar('source', { length: 10 }).notNull(),
	telegramChatId: varchar('telegram_chat_id'),
	reportFormat: varchar('report_format', { length: 10 }).notNull().default('docx'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	paidAt: timestamp('paid_at', { withTimezone: true })
});

/**
 * Reports table - Stores generated report metadata (PDF or DOCX)
 * One-to-many relationship with orders (multiple formats per order)
 */
export const reports = pgTable('reports', {
	id: uuid('id').primaryKey().defaultRandom(),
	orderId: uuid('order_id')
		.notNull()
		.references(() => orders.id),
	r2Key: varchar('r2_key').notNull(),
	documentHash: varchar('document_hash', { length: 64 }).notNull(),
	format: varchar('format', { length: 10 }).notNull().default('pdf'),
	signedUrl: varchar('signed_url').notNull(),
	sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

/**
 * Vehicle Images Cache table - Stores image search results
 * 24-hour TTL for image aggregation results
 */
export const vehicleImagesCache = pgTable('vehicle_images_cache', {
	id: uuid('id').primaryKey().defaultRandom(),
	vin: varchar('vin', { length: 17 }).notNull().unique(),
	imagesJson: jsonb('images_json').notNull(),
	cachedAt: timestamp('cached_at', { withTimezone: true }).defaultNow().notNull()
});

// ============================================================================
// NEW PIPELINE TABLES (Vehicle History Platform Rebuild)
// ============================================================================

/**
 * Pipeline Reports table - Stores vehicle history reports with timeline and LLM analysis
 * This is separate from the existing 'reports' table which stores document metadata
 */
export const pipelineReports = pgTable('pipeline_reports', {
	id: serial('id').primaryKey(),
	vin: varchar('vin', { length: 17 }).notNull().unique(),
	status: reportStatusEnum('status').notNull().default('pending'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	completedAt: timestamp('completed_at', { withTimezone: true }),
	errorMessage: text('error_message'),
	
	// Vehicle identity (from NHTSA decode)
	year: integer('year'),
	make: text('make'),
	model: text('model'),
	trim: text('trim'),
	bodyStyle: text('body_style'),
	engineDescription: text('engine_description'),
	driveType: text('drive_type'),
	fuelType: text('fuel_type'),
	
	// Stitched timeline (complete merged JSON)
	timeline: jsonb('timeline'),
	
	// LLM-generated analysis
	llmFlags: jsonb('llm_flags'),  // { gaps, anomalies, riskScore }
	llmVerdict: text('llm_verdict')  // buy/caution/avoid + reasoning
}, (table) => ({
	vinIdx: index('pipeline_reports_vin_idx').on(table.vin)
}));

/**
 * Raw Data table - Stores unprocessed data from external sources
 */
export const rawData = pgTable('raw_data', {
	id: serial('id').primaryKey(),
	vin: varchar('vin', { length: 17 }).notNull(),
	source: dataSourceEnum('source').notNull(),
	fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
	rawJson: jsonb('raw_json').notNull(),
	rawHtml: text('raw_html'),  // HTML snapshot for re-parsing
	success: boolean('success').notNull().default(true),
	errorMessage: text('error_message')
}, (table) => ({
	vinIdx: index('raw_data_vin_idx').on(table.vin),
	vinSourceIdx: index('raw_data_vin_source_idx').on(table.vin, table.source)
}));

/**
 * Normalized Data table - Stores transformed data conforming to unified schema
 */
export const normalizedData = pgTable('normalized_data', {
	id: serial('id').primaryKey(),
	vin: varchar('vin', { length: 17 }).notNull(),
	source: dataSourceEnum('source').notNull(),
	normalizedAt: timestamp('normalized_at', { withTimezone: true }).defaultNow().notNull(),
	data: jsonb('data').notNull()  // conforms to NormalizedVehicleRecord
}, (table) => ({
	vinIdx: index('normalized_data_vin_idx').on(table.vin),
	vinSourceIdx: index('normalized_data_vin_source_idx').on(table.vin, table.source)
}));

/**
 * Odometer Readings table - Stores mileage measurements with anomaly detection
 */
export const odometerReadings = pgTable('odometer_readings', {
	id: serial('id').primaryKey(),
	vin: varchar('vin', { length: 17 }).notNull(),
	readingDate: timestamp('reading_date', { withTimezone: true }).notNull(),
	mileage: integer('mileage').notNull(),
	source: odometerSourceEnum('source').notNull(),
	reportedBy: text('reported_by'),  // e.g. "Texas DMV", "Copart Dallas"
	isAnomaly: boolean('is_anomaly').notNull().default(false),
	anomalyNote: text('anomaly_note')  // e.g. "possible rollback", "unusual rate"
}, (table) => ({
	vinIdx: index('odometer_readings_vin_idx').on(table.vin),
	vinDateIdx: index('odometer_readings_vin_date_idx').on(table.vin, table.readingDate)
}));

/**
 * Vehicle Photos table - Stores image URLs with source and metadata
 */
export const vehiclePhotos = pgTable('vehicle_photos', {
	id: serial('id').primaryKey(),
	vin: varchar('vin', { length: 17 }).notNull(),
	url: text('url').notNull(),
	source: text('source').notNull(),  // 'copart', 'iaai', 'autotrader', 'cargurus'
	capturedAt: timestamp('captured_at', { withTimezone: true }),  // date of auction/listing
	scrapedAt: timestamp('scraped_at', { withTimezone: true }).defaultNow().notNull(),
	photoType: text('photo_type'),  // 'exterior_front', 'damage', 'interior'
	auctionLotId: text('auction_lot_id')
}, (table) => ({
	vinIdx: index('vehicle_photos_vin_idx').on(table.vin),
	vinSourceIdx: index('vehicle_photos_vin_source_idx').on(table.vin, table.source)
}));

/**
 * Report Sections table - Stores LLM-written content per section
 */
export const reportSections = pgTable('report_sections', {
	id: serial('id').primaryKey(),
	vin: varchar('vin', { length: 17 }).notNull(),
	sectionKey: text('section_key').notNull(),  // 'summary', 'accident_analysis', etc.
	content: text('content').notNull(),  // plain English LLM output
	generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
	modelUsed: text('model_used')  // 'claude-sonnet-4-20250514'
}, (table) => ({
	vinIdx: index('report_sections_vin_idx').on(table.vin),
	vinSectionIdx: index('report_sections_vin_section_idx').on(table.vin, table.sectionKey)
}));

/**
 * Pipeline Log table - Tracks progress of each pipeline stage
 */
export const pipelineLog = pgTable('pipeline_log', {
	id: serial('id').primaryKey(),
	vin: varchar('vin', { length: 17 }).notNull(),
	stage: text('stage').notNull(),  // 'fetch-nhtsa', 'normalize-copart', etc.
	status: text('status').notNull(),  // 'started', 'completed', 'failed'
	message: text('message'),
	timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
	vinIdx: index('pipeline_log_vin_idx').on(table.vin),
	vinTimestampIdx: index('pipeline_log_vin_timestamp_idx').on(table.vin, table.timestamp)
}));
