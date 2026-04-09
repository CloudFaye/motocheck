import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { pipelineReports, odometerReadings } from '$lib/server/db/schema';
import { normalizeVIN } from '$lib/shared/vin-utils';
import { eq, asc } from 'drizzle-orm';

/**
 * GET /api/report/:vin/odometer
 * Get odometer readings and expected mileage line for a VIN
 *
 * Returns odometer readings sorted by date with anomaly flags,
 * and calculates expected mileage based on 12,000 miles/year
 *
 * Requirements: 18.1-18.5
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const rawVin = params.vin;

		// Normalize VIN
		const vin = normalizeVIN(rawVin);

		// Query report to get vehicle year
		const report = await db.query.pipelineReports.findFirst({
			where: eq(pipelineReports.vin, vin)
		});

		// Return 404 if report doesn't exist
		if (!report) {
			return json({ error: 'Report not found' }, { status: 404 });
		}

		// Query odometer readings sorted by date
		const readings = await db.query.odometerReadings.findMany({
			where: eq(odometerReadings.vin, vin),
			orderBy: [asc(odometerReadings.readingDate)]
		});

		// Format readings for response
		const formattedReadings = readings.map((reading) => ({
			date: reading.readingDate.toISOString(),
			mileage: reading.mileage,
			source: reading.source,
			reportedBy: reading.reportedBy || undefined,
			isAnomaly: reading.isAnomaly,
			anomalyNote: reading.anomalyNote || undefined
		}));

		// Calculate expected mileage line based on 12,000 miles/year
		const expectedMileage: Array<{ date: string; mileage: number }> = [];

		if (report.year && readings.length > 0) {
			const vehicleYear = report.year;
			const currentYear = new Date().getFullYear();
			const milesPerYear = 12000;

			// Create expected mileage points for each year
			for (let year = vehicleYear; year <= currentYear; year++) {
				const age = year - vehicleYear;
				const expectedMiles = age * milesPerYear;
				expectedMileage.push({
					date: new Date(year, 0, 1).toISOString(),
					mileage: expectedMiles
				});
			}
		}

		return json({
			vin: report.vin,
			vehicleYear: report.year,
			readings: formattedReadings,
			expectedMileage
		});
	} catch (error) {
		console.error('[GET /api/report/:vin/odometer] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
