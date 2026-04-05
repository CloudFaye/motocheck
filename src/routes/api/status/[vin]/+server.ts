import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { pipelineReports, pipelineLog } from '$lib/server/db/schema';
import { normalizeVIN } from '$lib/shared/vin-utils';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/status/:vin
 * Get pipeline status and recent logs for a VIN
 * 
 * Returns overall report status, completion status for each stage,
 * and 20 most recent pipeline log entries
 * 
 * Requirements: 21.1-21.5
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const rawVin = params.vin;

		// Normalize VIN
		const vin = normalizeVIN(rawVin);

		// Query report status
		const report = await db.query.pipelineReports.findFirst({
			where: eq(pipelineReports.vin, vin),
		});

		// Return 404 if report doesn't exist
		if (!report) {
			return json(
				{ error: 'Report not found' },
				{ status: 404 }
			);
		}

		// Query 20 most recent log entries
		const logs = await db.query.pipelineLog.findMany({
			where: eq(pipelineLog.vin, vin),
			orderBy: [desc(pipelineLog.timestamp)],
			limit: 20,
		});

		// Group logs by stage to determine completion status
		const stageStatus: Record<string, { status: string; message?: string; timestamp: Date }> = {};
		
		for (const log of logs) {
			// Keep the most recent status for each stage
			if (!stageStatus[log.stage]) {
				stageStatus[log.stage] = {
					status: log.status,
					message: log.message || undefined,
					timestamp: log.timestamp,
				};
			}
		}

		// Convert to array format
		const stages = Object.entries(stageStatus).map(([stage, info]) => ({
			stage,
			status: info.status,
			message: info.message,
			timestamp: info.timestamp,
		}));

		return json({
			vin: report.vin,
			status: report.status,
			createdAt: report.createdAt,
			updatedAt: report.updatedAt,
			completedAt: report.completedAt,
			errorMessage: report.errorMessage,
			stages,
			logs: logs.map(log => ({
				stage: log.stage,
				status: log.status,
				message: log.message,
				timestamp: log.timestamp,
			})),
		});

	} catch (error) {
		console.error('[GET /api/status/:vin] Error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
