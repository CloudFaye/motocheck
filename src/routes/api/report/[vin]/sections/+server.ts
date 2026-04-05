import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { pipelineReports, reportSections } from '$lib/server/db/schema';
import { normalizeVIN } from '$lib/shared/vin-utils';
import { eq, and } from 'drizzle-orm';

/**
 * Section display order for consistent presentation
 */
const SECTION_ORDER = [
	'summary',
	'ownership_history',
	'accident_analysis',
	'odometer_analysis',
	'title_history',
	'recall_status',
	'market_value',
	'gap_analysis',
	'buyers_checklist',
];

/**
 * GET /api/report/:vin/sections
 * Get report sections for a VIN
 * 
 * Returns all sections ordered by display sequence.
 * Supports filtering by section key via query parameter.
 * 
 * Requirements: 34.1-34.5
 */
export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const rawVin = params.vin;
		const sectionKey = url.searchParams.get('section');

		// Normalize VIN
		const vin = normalizeVIN(rawVin);

		// Verify report exists
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

		// Query sections (with optional filtering by section key)
		const sections = await db.query.reportSections.findMany({
			where: sectionKey
				? and(
					eq(reportSections.vin, vin),
					eq(reportSections.sectionKey, sectionKey)
				)
				: eq(reportSections.vin, vin),
		});

		// Format sections for response
		const formattedSections = sections.map(section => ({
			sectionKey: section.sectionKey,
			content: section.content,
			generatedAt: section.generatedAt.toISOString(),
			modelUsed: section.modelUsed || undefined,
		}));

		// Sort sections by predefined display order
		formattedSections.sort((a, b) => {
			const indexA = SECTION_ORDER.indexOf(a.sectionKey);
			const indexB = SECTION_ORDER.indexOf(b.sectionKey);
			
			// If both are in the order list, sort by position
			if (indexA !== -1 && indexB !== -1) {
				return indexA - indexB;
			}
			
			// If only one is in the order list, it comes first
			if (indexA !== -1) return -1;
			if (indexB !== -1) return 1;
			
			// If neither is in the order list, sort alphabetically
			return a.sectionKey.localeCompare(b.sectionKey);
		});

		return json({
			vin: report.vin,
			sections: formattedSections,
		});

	} catch (error) {
		console.error('[GET /api/report/:vin/sections] Error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
