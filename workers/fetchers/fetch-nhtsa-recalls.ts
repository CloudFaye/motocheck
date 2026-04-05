/**
 * NHTSA Recalls Fetcher Worker
 * 
 * Fetches safety recall data from NHTSA recalls API
 * 
 * Requirements: 4.2, 4.4, 4.6
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
 * Fetch NHTSA recalls data
 */
async function fetchNHTSARecalls(vin: string): Promise<Record<string, unknown>> {
	const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?vin=${vin}`;
	
	try {
		const response = await fetch(url, { 
			signal: AbortSignal.timeout(10000) 
		});
		
		if (!response.ok) {
			throw new Error(`NHTSA Recalls API error: ${response.status}`);
		}
		
		return await response.json();
	} catch (error) {
		if (error instanceof Error && error.name === 'TimeoutError') {
			throw new Error('NHTSA Recalls API timeout after 10 seconds', { cause: error });
		}
		throw error;
	}
}

/**
 * Worker handler for NHTSA recalls fetch job
 */
export async function handleFetchNHTSARecalls(jobs: Job[]): Promise<void> {
	for (const job of jobs) {
		await processFetchNHTSARecalls(job);
	}
}

async function processFetchNHTSARecalls(job: Job): Promise<void> {
	const { vin } = job.data;
	
	// Log pipeline progress: started
	await db.insert(pipelineLog).values({
		vin,
		stage: 'fetch-nhtsa-recalls',
		status: 'started',
		message: 'Fetching NHTSA recalls data',
	});
	
	console.log(`[fetch-nhtsa-recalls] Starting fetch for VIN: ${vin}`);
	
	try {
		// Call NHTSA recalls API (Requirement 4.2)
		const rawJson = await fetchNHTSARecalls(vin);
		
		// Store raw JSON response (Requirement 4.4)
		await db.insert(rawData).values({
			vin,
			source: 'nhtsa_recalls',
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
			stage: 'fetch-nhtsa-recalls',
			status: 'completed',
			message: 'Successfully fetched NHTSA recalls data',
		});
		
		console.log(`[fetch-nhtsa-recalls] Successfully fetched data for VIN: ${vin}`);
		
		// Enqueue normalization job on success (Requirement 4.6)
		const queue = await getQueue();
		await queue.send(Jobs.NORMALIZE, {
			vin,
			source: 'nhtsa_recalls',
		});
		
		console.log(`[fetch-nhtsa-recalls] Enqueued normalization job for VIN: ${vin}`);
		
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		
		// Store error in raw_data table
		await db.insert(rawData).values({
			vin,
			source: 'nhtsa_recalls',
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
			stage: 'fetch-nhtsa-recalls',
			status: 'failed',
			message: `Failed to fetch NHTSA recalls data: ${errorMessage}`,
		});
		
		console.error(`[fetch-nhtsa-recalls] Failed for VIN ${vin}:`, error);
		
		// Re-throw to trigger queue retry
		throw error;
	}
}

/**
 * Register the worker with pg-boss
 */
export async function registerFetchNHTSARecallsWorker(queue: PgBoss): Promise<void> {
	await queue.work(Jobs.FETCH_NHTSA_RECALLS, handleFetchNHTSARecalls);
	
	console.log('[fetch-nhtsa-recalls] Worker registered');
}
