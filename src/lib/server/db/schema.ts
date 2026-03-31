import { pgTable, uuid, varchar, jsonb, numeric, timestamp } from 'drizzle-orm/pg-core';

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
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	paidAt: timestamp('paid_at', { withTimezone: true })
});

/**
 * Reports table - Stores generated PDF report metadata
 * One-to-one relationship with orders (enforced by unique constraint)
 */
export const reports = pgTable('reports', {
	id: uuid('id').primaryKey().defaultRandom(),
	orderId: uuid('order_id')
		.notNull()
		.references(() => orders.id)
		.unique(),
	r2Key: varchar('r2_key').notNull(),
	pdfHash: varchar('pdf_hash', { length: 64 }).notNull(),
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
