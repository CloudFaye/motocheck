/**
 * NICB VINCheck Fetcher Worker
 * 
 * Fetches theft and total loss records from NICB VINCheck API
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { PgBoss } from 'pg-boss';
import { db } from '../../src/lib/server/db/index.js';
import { rawData, pipelineLog } from '../../src/lib/server/db/schema.js';
import { getQueue } from '../../src/lib/server/queue/index.js';
import { Jobs } from '../../src/lib/server/queue/job-names.js';

interface JobData {
	vin: string;
}

type Job = {
	data: JobData;
	id: string;
	name: string;
};

/**
 * Fetch NICB VINCheck data with User-Agent header
 */
async function fetchNICB(vin: string): Promise<Record<string, unknown>> {
	const apiUrl = process.env.NICB_API_URL || 'https://www.nicb.org/vincheck/api';
	
	try {
		// Call NICB VINCheck API with User-Agent header (Requirement 6.1, 6.4)
		const response = await fetch(`${apiUrl}?vin=${vin}`, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept': 'application/json',
			},
			signal: AbortSignal.timeout(10000),
		});
		
		if (!response.ok) {
			throw new Error(`NICB API error: ${response.status} ${response.statusText}`);
		}
		
		return await response.json();
	} catch (error) {
		if (error instanceof Error && error.name === 'TimeoutError') {
			throw new Error('NICB API timeout after 10 seconds', { cause: error });
		}
		throw error;
	}
}

/**
 * Worker handler for NICB fetch job
 */
export async function handleFetchNICB(jobs: Job[]): Promise<void> {
	for (const job of jobs) {
		await processFetchNICB(job);
	}
}

async function processFetchNICB(job: Job): Promise<void> {
	const { vin } = job.data;
	
	// Log pipeline progress: started
	await db.insert(pipelineLog).values({
		vin,
		stage: 'fetch-nicb',
		status: 'started',
		message: 'Fetching NICB theft data',
	});
	
	console.log(`[fetch-nicb] Starting fetch for VIN: ${vin}`);
	
	try {
		// Call NICB VINCheck API (Requirement 6.1)
		const rawJson = await fetchNICB(vin);
		
		// Store raw JSON response (Requirement 6.2)
		await db.insert(rawData).values({
			vin,
			source: 'nicb',
			rawJson,
			success: true,
		}).onConflictDoUpdate({
			target: [rawData.vin, rawData.source],
			set: {
				rawJson,
				fetchedAt: new Date(),
				success: true,
				errorMessage: null,
			},
		});
		
		// Log pipeline progress: completed
		await db.insert(pipelineLog).values({
			vin,
			stage: 'fetch-nicb',
			status: 'completed',
			message: 'Successfully fetched NICB data',
		});
		
		console.log(`[fetch-nicb] Successfully fetched data for VIN: ${vin}`);
		
		// Enqueue normalization job on success (Requirement 6.3)
		const queue = await getQueue();
		await queue.send(Jobs.NORMALIZE, {
			vin,
			source: 'nicb',
		});
		
		console.log(`[fetch-nicb] Enqueued normalization job for VIN: ${vin}`);
		
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		
		// Check if it's a 403 error (rate limited or blocked)
		const is403Error = errorMessage.includes('403');
		
		if (is403Error) {
			// 403 errors mean we're blocked/rate limited - treat as optional source
			await db.insert(rawData).values({
				vin,
				source: 'nicb',
				rawJson: {},
				success: false,
				errorMessage: 'NICB API blocked (403 Forbidden) - optional source',
			}).onConflictDoUpdate({
				target: [rawData.vin, rawData.source],
				set: {
					fetchedAt: new Date(),
					success: false,
					errorMessage: 'NICB API blocked (403 Forbidden) - optional source',
				},
			});
			
			// Log as completed (not failed) since it's optional
			await db.insert(pipelineLog).values({
				vin,
				stage: 'fetch-nicb',
				status: 'completed',
				message: 'NICB API blocked (403 Forbidden) - optional source, continuing pipeline',
			});
			
			console.log(`[fetch-nicb] NICB API blocked for VIN ${vin} (403) - continuing as optional source`);
			
			return; // Don't throw error, just skip
		}
		
		// For other errors, store as failed
		await db.insert(rawData).values({
			vin,
			source: 'nicb',
			rawJson: {},
			success: false,
			errorMessage,
		}).onConflictDoUpdate({
			target: [rawData.vin, rawData.source],
			set: {
				fetchedAt: new Date(),
				success: false,
				errorMessage,
			},
		});
		
		// Log pipeline progress: failed
		await db.insert(pipelineLog).values({
			vin,
			stage: 'fetch-nicb',
			status: 'failed',
			message: `Failed to fetch NICB data: ${errorMessage}`,
		});
		
		console.error(`[fetch-nicb] Failed for VIN ${vin}:`, error);
		
		// Re-throw to trigger queue retry
		throw error;
	}
}

/**
 * Register the worker with pg-boss
 */
export async function registerFetchNICBWorker(queue: PgBoss): Promise<void> {
	await queue.work(Jobs.FETCH_NICB, handleFetchNICB);
	
	console.log('[fetch-nicb] Worker registered');
}
