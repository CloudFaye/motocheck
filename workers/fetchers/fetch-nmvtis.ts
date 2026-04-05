/**
 * NMVTIS Fetcher Worker
 * 
 * Fetches title history from NMVTIS provider API with authentication
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
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
 * Fetch NMVTIS data with authentication
 */
async function fetchNMVTIS(vin: string): Promise<Record<string, unknown>> {
	const apiUrl = process.env.NMVTIS_API_URL;
	const apiKey = process.env.NMVTIS_API_KEY;
	
	// Validate environment variables (Requirement 5.5)
	if (!apiUrl || !apiKey) {
		throw new Error('NMVTIS_API_URL and NMVTIS_API_KEY environment variables are required');
	}
	
	try {
		// Call NMVTIS provider API with authentication (Requirement 5.1, 5.2)
		const response = await fetch(`${apiUrl}?vin=${vin}`, {
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			signal: AbortSignal.timeout(15000), // 15 second timeout for paid API
		});
		
		if (!response.ok) {
			throw new Error(`NMVTIS API error: ${response.status} ${response.statusText}`);
		}
		
		return await response.json();
	} catch (error) {
		if (error instanceof Error && error.name === 'TimeoutError') {
			throw new Error('NMVTIS API timeout after 15 seconds', { cause: error });
		}
		throw error;
	}
}

/**
 * Worker handler for NMVTIS fetch job
 */
export async function handleFetchNMVTIS(jobs: Job[]): Promise<void> {
	for (const job of jobs) {
		await processFetchNMVTIS(job);
	}
}

async function processFetchNMVTIS(job: Job): Promise<void> {
	const { vin } = job.data;
	
	// Log pipeline progress: started
	await db.insert(pipelineLog).values({
		vin,
		stage: 'fetch-nmvtis',
		status: 'started',
		message: 'Fetching NMVTIS title history data',
	});
	
	console.log(`[fetch-nmvtis] Starting fetch for VIN: ${vin}`);
	
	try {
		// Call NMVTIS provider API (Requirement 5.1)
		const rawJson = await fetchNMVTIS(vin);
		
		// Store raw JSON response (Requirement 5.3)
		await db.insert(rawData).values({
			vin,
			source: 'nmvtis',
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
			stage: 'fetch-nmvtis',
			status: 'completed',
			message: 'Successfully fetched NMVTIS data',
		});
		
		console.log(`[fetch-nmvtis] Successfully fetched data for VIN: ${vin}`);
		
		// Enqueue normalization job on success (Requirement 5.4)
		const queue = await getQueue();
		await queue.send(Jobs.NORMALIZE, {
			vin,
			source: 'nmvtis',
		});
		
		console.log(`[fetch-nmvtis] Enqueued normalization job for VIN: ${vin}`);
		
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		
		// Store error in raw_data table
		await db.insert(rawData).values({
			vin,
			source: 'nmvtis',
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
			stage: 'fetch-nmvtis',
			status: 'failed',
			message: `Failed to fetch NMVTIS data: ${errorMessage}`,
		});
		
		console.error(`[fetch-nmvtis] Failed for VIN ${vin}:`, error);
		
		// Re-throw to trigger queue retry
		throw error;
	}
}

/**
 * Register the worker with pg-boss
 */
export async function registerFetchNMVTISWorker(queue: PgBoss): Promise<void> {
	await queue.work(Jobs.FETCH_NMVTIS, handleFetchNMVTIS);
	
	console.log('[fetch-nmvtis] Worker registered');
}
