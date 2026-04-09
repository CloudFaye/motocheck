import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { pipelineReports, vehiclePhotos } from '$lib/server/db/schema';
import { normalizeVIN } from '$lib/shared/vin-utils';
import { eq, desc, sql } from 'drizzle-orm';

/**
 * GET /api/report/:vin/photos
 * Get photos for a VIN grouped by source
 *
 * Returns photos sorted by capture date (or scrape date if capture date unavailable),
 * grouped by source, with 6 most recent photos for hero display
 *
 * Requirements: 17.1-17.7, 75.1-75.5
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const rawVin = params.vin;

		// Normalize VIN
		const vin = normalizeVIN(rawVin);

		// Verify report exists
		const report = await db.query.pipelineReports.findFirst({
			where: eq(pipelineReports.vin, vin)
		});

		// Return 404 if report doesn't exist
		if (!report) {
			return json({ error: 'Report not found' }, { status: 404 });
		}

		// Query all photos sorted by capture date (use scrape date as fallback)
		// Use COALESCE to prefer capturedAt over scrapedAt
		const photos = await db.query.vehiclePhotos.findMany({
			where: eq(vehiclePhotos.vin, vin),
			orderBy: [desc(sql`COALESCE(${vehiclePhotos.capturedAt}, ${vehiclePhotos.scrapedAt})`)]
		});

		// Format photos for response
		const formattedPhotos = photos.map((photo) => ({
			id: photo.id,
			url: photo.url,
			source: photo.source,
			capturedAt: photo.capturedAt?.toISOString() || null,
			scrapedAt: photo.scrapedAt.toISOString(),
			photoType: photo.photoType || undefined,
			auctionLotId: photo.auctionLotId || undefined
		}));

		// Group photos by source
		const photosBySource: Record<string, typeof formattedPhotos> = {};
		for (const photo of formattedPhotos) {
			if (!photosBySource[photo.source]) {
				photosBySource[photo.source] = [];
			}
			photosBySource[photo.source].push(photo);
		}

		// Get 6 most recent photos for hero display
		const recentPhotos = formattedPhotos.slice(0, 6);

		return json({
			vin: report.vin,
			totalPhotos: formattedPhotos.length,
			photos: formattedPhotos,
			photosBySource,
			recentPhotos
		});
	} catch (error) {
		console.error('[GET /api/report/:vin/photos] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
