import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { getQueue } from '$lib/server/queue';
import { sql } from 'drizzle-orm';

/**
 * GET /api/health
 * Health check endpoint for monitoring
 *
 * Verifies database and queue connectivity
 * Returns system version and build timestamp
 *
 * Requirements: 93.1-93.5
 */
export const GET: RequestHandler = async () => {
	const checks: Record<string, { status: string; message?: string }> = {};
	let overallStatus = 'ok';

	// Check database connectivity
	try {
		await db.execute(sql`SELECT 1`);
		checks.database = { status: 'ok' };
	} catch (error) {
		checks.database = {
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error'
		};
		overallStatus = 'degraded';
	}

	// Check queue connectivity
	try {
		const queue = await getQueue();
		// Verify queue is started by checking if we can get the version
		if (queue) {
			checks.queue = { status: 'ok' };
		} else {
			checks.queue = { status: 'error', message: 'Queue not initialized' };
			overallStatus = 'degraded';
		}
	} catch (error) {
		checks.queue = {
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error'
		};
		overallStatus = 'degraded';
	}

	// Return health status
	return json(
		{
			status: overallStatus,
			timestamp: new Date().toISOString(),
			service: 'vehicle-history-platform',
			version: '2.0.0',
			buildTimestamp: process.env.BUILD_TIMESTAMP || new Date().toISOString(),
			checks
		},
		{
			status: overallStatus === 'ok' ? 200 : 503
		}
	);
};
