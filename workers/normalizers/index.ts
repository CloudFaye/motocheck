/**
 * Normalizer Worker Registry
 *
 * This worker dispatches raw data to source-specific normalizers,
 * checks if all required sources are complete, and triggers stitching.
 *
 * Requirements: 11.1, 11.7, 11.8, 11.9, 54.1-54.5
 */

import type { Job } from 'pg-boss';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, normalizedData, pipelineLog } from '../../src/lib/server/db/schema.js';
import { getQueue } from '../../src/lib/server/queue/index.js';
import { Jobs, REQUIRED_SOURCES } from '../../src/lib/server/queue/job-names.js';
import { eq, and } from 'drizzle-orm';
import type { NormalizedVehicleRecord, DataSource } from '../../src/lib/shared/types.js';

// Import source-specific normalizers
import { normalizeNhtsaDecode, normalizeNhtsaRecalls } from './normalize-nhtsa';
import { normalizeNmvtis } from './normalize-nmvtis';
import { normalizeNicb } from './normalize-nicb';
import { normalizeCopart } from './normalize-copart';
import { normalizeIaai } from './normalize-iaai';
import { normalizeAutotrader } from './normalize-autotrader';
import { normalizeCargurus } from './normalize-cargurus';
import { normalizeJdpower } from './normalize-jdpower.js';
import { normalizeVininspect } from './normalize-vininspect';

/**
 * Normalizer function type
 */
type NormalizerFunction = (
	vin: string,
	rawJson: unknown,
	rawHtml: string | null
) => Promise<NormalizedVehicleRecord>;

/**
 * Normalizer registry mapping source names to normalizer functions
 */
const normalizers: Record<string, NormalizerFunction> = {
	nhtsa_decode: normalizeNhtsaDecode,
	nhtsa_recalls: normalizeNhtsaRecalls,
	nmvtis: normalizeNmvtis,
	nicb: normalizeNicb,
	copart: normalizeCopart,
	iaai: normalizeIaai,
	autotrader: normalizeAutotrader,
	cargurus: normalizeCargurus,
	jdpower: normalizeJdpower,
	vininspect: normalizeVininspect
};

/**
 * Normalize job payload
 */
interface NormalizeJobPayload {
	vin: string;
	source: DataSource;
}

/**
 * Main normalizer worker handler
 * Dispatches to source-specific normalizers and manages pipeline flow
 */
export async function normalizeWorkerHandler(jobs: Job<NormalizeJobPayload>[]): Promise<void> {
	for (const job of jobs) {
		await normalizeWorker(job);
	}
}

/**
 * Process a single normalization job
 */
async function normalizeWorker(job: Job<NormalizeJobPayload>): Promise<void> {
	const { vin, source } = job.data;

	console.log(`[normalize] Starting normalization for VIN ${vin}, source ${source}`);

	// Log pipeline progress - started
	await db.insert(pipelineLog).values({
		vin,
		stage: `normalize-${source}`,
		status: 'started',
		message: `Starting normalization for ${source}`
	});

	try {
		// Fetch raw data for this VIN and source
		const rawDataRecords = await db
			.select()
			.from(rawData)
			.where(and(eq(rawData.vin, vin), eq(rawData.source, source)))
			.limit(1);

		if (rawDataRecords.length === 0) {
			throw new Error(`No raw data found for VIN ${vin}, source ${source}`);
		}

		const rawRecord = rawDataRecords[0];

		if (!rawRecord.success) {
			throw new Error(`Raw data fetch failed for ${source}: ${rawRecord.errorMessage}`);
		}

		// Get the appropriate normalizer function
		const normalizerFn = normalizers[source];
		if (!normalizerFn) {
			throw new Error(`No normalizer found for source: ${source}`);
		}

		// Execute normalization
		const normalized = await normalizerFn(vin, rawRecord.rawJson, rawRecord.rawHtml);

		// Store normalized data (upsert on conflict)
		await db
			.insert(normalizedData)
			.values({
				vin,
				source,
				data: normalized as unknown as typeof normalizedData.$inferInsert.data
			})
			.onConflictDoUpdate({
				target: [normalizedData.vin, normalizedData.source],
				set: {
					data: normalized as unknown as typeof normalizedData.$inferInsert.data,
					normalizedAt: new Date()
				}
			});

		console.log(`[normalize] Successfully normalized ${source} for VIN ${vin}`);

		// Log pipeline progress - completed
		await db.insert(pipelineLog).values({
			vin,
			stage: `normalize-${source}`,
			status: 'completed',
			message: `Normalization completed for ${source}`
		});

		// Check if all required sources are complete
		await checkAndEnqueueStitching(vin);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`[normalize] Failed to normalize ${source} for VIN ${vin}:`, errorMessage);

		// Log pipeline progress - failed
		await db.insert(pipelineLog).values({
			vin,
			stage: `normalize-${source}`,
			status: 'failed',
			message: `Normalization failed: ${errorMessage}`
		});

		throw error;
	}
}

/**
 * Check if all required sources are normalized and enqueue stitching job
 * Requirements: 11.7, 11.8, 54.1-54.5
 */
async function checkAndEnqueueStitching(vin: string): Promise<void> {
	console.log(`[normalize] Checking if all required sources are complete for VIN ${vin}`);

	// Query normalized data for this VIN
	const normalizedRecords = await db
		.select()
		.from(normalizedData)
		.where(eq(normalizedData.vin, vin));

	// Get set of completed sources
	const completedSources = new Set(normalizedRecords.map((r) => r.source));

	// Check if all required sources are present
	const allRequiredComplete = REQUIRED_SOURCES.every((source) => completedSources.has(source));

	if (allRequiredComplete) {
		console.log(
			`[normalize] All required sources complete for VIN ${vin}, enqueueing stitching job`
		);

		// Enqueue stitching job
		const queue = await getQueue();
		await queue.send(Jobs.STITCH_REPORT, { vin });

		console.log(`[normalize] Stitching job enqueued for VIN ${vin}`);
	} else {
		const missingRequired = REQUIRED_SOURCES.filter((source) => !completedSources.has(source));
		console.log(
			`[normalize] Waiting for required sources for VIN ${vin}: ${missingRequired.join(', ')}`
		);

		// Send progress notification to user
		const queue = await getQueue();
		await queue.send(Jobs.SEND_NOTIFICATION, {
			vin,
			type: 'progress'
		});
	}
}

/**
 * Register the normalizer worker with pg-boss
 */
export async function registerNormalizerWorker(queue: import('pg-boss').PgBoss): Promise<void> {
	await queue.work(Jobs.NORMALIZE, normalizeWorkerHandler);
	console.log('[normalize] Worker registered');
}
