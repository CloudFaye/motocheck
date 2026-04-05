import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { pipelineReports } from '$lib/server/db/schema';
import { getQueue } from '$lib/server/queue';
import { Jobs } from '$lib/server/queue/job-names';
import { validateVIN, normalizeVIN } from '$lib/shared/vin-utils';
import { eq } from 'drizzle-orm';

/**
 * POST /api/report
 * Trigger report generation for a VIN
 * 
 * Request body: { vin: string }
 * Response: { status: "processing", vin: string }
 * 
 * Validates VIN, creates report record, enqueues all data source jobs
 * Requirements: 19.1-19.7, 55.1-55.5, 78.1-78.5, 87.1-87.5
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const rawVin = body.vin;

		// Validate VIN is provided
		if (!rawVin || typeof rawVin !== 'string') {
			return json(
				{ error: 'VIN is required' },
				{ status: 400 }
			);
		}

		// Normalize VIN (uppercase, trim)
		const vin = normalizeVIN(rawVin);

		// Validate VIN format
		const validation = validateVIN(vin);
		if (!validation.valid) {
			return json(
				{ error: validation.error },
				{ status: 400 }
			);
		}

		// Create report record with status "pending"
		await db.insert(pipelineReports).values({
			vin,
			status: 'pending',
		}).onConflictDoUpdate({
			target: pipelineReports.vin,
			set: {
				status: 'pending',
				updatedAt: new Date(),
				errorMessage: null,
			}
		});

		// Get queue instance
		const queue = await getQueue();

		// Enqueue jobs for all required sources
		const requiredJobs = [
			{ name: Jobs.FETCH_NHTSA_DECODE, data: { vin } },
			{ name: Jobs.FETCH_NHTSA_RECALLS, data: { vin } },
			{ name: Jobs.FETCH_NMVTIS, data: { vin } },
			{ name: Jobs.FETCH_NICB, data: { vin } },
			{ name: Jobs.SCRAPE_COPART, data: { vin } },
			{ name: Jobs.SCRAPE_IAAI, data: { vin } },
		];

		// Enqueue jobs for all optional sources
		const optionalJobs = [
			{ name: Jobs.SCRAPE_AUTOTRADER, data: { vin } },
			{ name: Jobs.SCRAPE_CARGURUS, data: { vin } },
		];

		// Enqueue all jobs in parallel
		await Promise.all([
			...requiredJobs.map(job => queue.send(job.name, job.data)),
			...optionalJobs.map(job => queue.send(job.name, job.data)),
		]);

		// Update report status to "fetching"
		await db.update(pipelineReports)
			.set({
				status: 'fetching',
				updatedAt: new Date(),
			})
			.where(eq(pipelineReports.vin, vin));

		return json({
			status: 'processing',
			vin,
		});

	} catch (error) {
		console.error('[POST /api/report] Error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};

/**
 * GET /api/report?vin={vin}
 * Retrieve a report by VIN
 * 
 * Query params: vin (required)
 * Response: Complete report with timeline, llmFlags, llmVerdict, status
 * 
 * Returns partial reports if status is not "ready"
 * Requirements: 20.1-20.5, 62.1-62.5
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const rawVin = url.searchParams.get('vin');

		// Validate VIN is provided
		if (!rawVin) {
			return json(
				{ error: 'VIN query parameter is required' },
				{ status: 400 }
			);
		}

		// Normalize VIN
		const vin = normalizeVIN(rawVin);

		// Query report from database
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

		// Return complete report (including partial reports)
		return json({
			id: report.id,
			vin: report.vin,
			status: report.status,
			createdAt: report.createdAt,
			updatedAt: report.updatedAt,
			completedAt: report.completedAt,
			errorMessage: report.errorMessage,
			
			// Vehicle identity
			year: report.year,
			make: report.make,
			model: report.model,
			trim: report.trim,
			bodyStyle: report.bodyStyle,
			engineDescription: report.engineDescription,
			driveType: report.driveType,
			fuelType: report.fuelType,
			
			// Timeline and analysis
			timeline: report.timeline,
			llmFlags: report.llmFlags,
			llmVerdict: report.llmVerdict,
		});

	} catch (error) {
		console.error('[GET /api/report] Error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
