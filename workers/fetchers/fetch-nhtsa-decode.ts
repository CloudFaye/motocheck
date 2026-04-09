/**
 * NHTSA VIN Decode Fetcher Worker
 *
 * Fetches vehicle specifications from NHTSA VIN decode API
 * Wraps existing NHTSA client logic without rewriting
 *
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 22.1-22.5
 */

import { PgBoss } from 'pg-boss';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, pipelineLog } from '../../src/lib/server/db/schema.js';
import { getQueue } from '../../src/lib/server/queue/index.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';
import { config } from '../../src/lib/server/config.js';

interface JobData {
	vin: string;
}

type Job = {
	data: JobData;
	id: string;
	name: string;
};

/**
 * Fetch NHTSA VIN decode data with retry on 503 errors
 */
async function fetchNHTSADecode(vin: string): Promise<Record<string, unknown>> {
	const url = `${config.NHTSA_API_URL}/vehicles/DecodeVin/${vin}?format=json`;

	try {
		const response = await fetch(url, {
			signal: AbortSignal.timeout(10000)
		});

		// Handle HTTP 503 with 1-second retry delay (Requirement 4.5)
		if (response.status === 503) {
			console.log(
				`[fetch-nhtsa-decode] HTTP 503 received for VIN ${vin}, retrying after 1 second...`
			);
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const retryResponse = await fetch(url, {
				signal: AbortSignal.timeout(10000)
			});

			if (!retryResponse.ok) {
				throw new Error(`NHTSA API error after retry: ${retryResponse.status}`);
			}

			return await retryResponse.json();
		}

		if (!response.ok) {
			throw new Error(`NHTSA API error: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		if (error instanceof Error && error.name === 'TimeoutError') {
			throw new Error('NHTSA API timeout after 10 seconds', { cause: error });
		}
		throw error;
	}
}

/**
 * Worker handler for NHTSA decode fetch job
 */
export async function handleFetchNHTSADecode(jobs: Job[]): Promise<void> {
	for (const job of jobs) {
		await processFetchNHTSADecode(job);
	}
}

async function processFetchNHTSADecode(job: Job): Promise<void> {
	const { vin } = job.data;

	// Log pipeline progress: started (Requirement 22.1)
	await db.insert(pipelineLog).values({
		vin,
		stage: 'fetch-nhtsa-decode',
		status: 'started',
		message: 'Fetching NHTSA VIN decode data'
	});

	console.log(`[fetch-nhtsa-decode] Starting fetch for VIN: ${vin}`);

	try {
		// Call NHTSA VIN decode API (Requirement 4.1)
		const rawJson = await fetchNHTSADecode(vin);

		// Store raw JSON response (Requirement 4.3)
		await db
			.insert(rawData)
			.values({
				vin,
				source: 'nhtsa_decode',
				rawJson,
				success: true
			})
			.onConflictDoUpdate({
				target: [rawData.vin, rawData.source],
				set: {
					rawJson,
					fetchedAt: new Date(),
					success: true,
					errorMessage: null
				}
			});

		// Log pipeline progress: completed (Requirement 22.2)
		await db.insert(pipelineLog).values({
			vin,
			stage: 'fetch-nhtsa-decode',
			status: 'completed',
			message: 'Successfully fetched NHTSA decode data'
		});

		console.log(`[fetch-nhtsa-decode] Successfully fetched data for VIN: ${vin}`);

		// Enqueue normalization job on success (Requirement 4.6)
		const queue = await getQueue();
		await queue.send(Jobs.NORMALIZE, {
			vin,
			source: 'nhtsa_decode'
		});

		console.log(`[fetch-nhtsa-decode] Enqueued normalization job for VIN: ${vin}`);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		// Store error in raw_data table
		await db
			.insert(rawData)
			.values({
				vin,
				source: 'nhtsa_decode',
				rawJson: {},
				success: false,
				errorMessage
			})
			.onConflictDoUpdate({
				target: [rawData.vin, rawData.source],
				set: {
					fetchedAt: new Date(),
					success: false,
					errorMessage
				}
			});

		// Log pipeline progress: failed (Requirement 22.3)
		await db.insert(pipelineLog).values({
			vin,
			stage: 'fetch-nhtsa-decode',
			status: 'failed',
			message: `Failed to fetch NHTSA decode data: ${errorMessage}`
		});

		console.error(`[fetch-nhtsa-decode] Failed for VIN ${vin}:`, error);

		// Re-throw to trigger queue retry
		throw error;
	}
}

/**
 * Register the worker with pg-boss
 */
export async function registerFetchNHTSADecodeWorker(queue: PgBoss): Promise<void> {
	await queue.work(Jobs.FETCH_NHTSA_DECODE, handleFetchNHTSADecode);

	console.log('[fetch-nhtsa-decode] Worker registered');
}
