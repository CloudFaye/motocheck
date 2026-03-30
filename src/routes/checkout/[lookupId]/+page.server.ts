import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { lookups } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

interface DutyData {
	totalDutyNgn: number;
}

export const load: PageServerLoad = async ({ params }) => {
	const lookup = await db.select().from(lookups).where(eq(lookups.id, params.lookupId)).limit(1);

	if (lookup.length === 0) {
		throw error(404, 'VIN lookup not found');
	}

	const data = lookup[0];
	const decoded = data.decodedJson as any;
	const duty = data.dutyJson as DutyData;

	// Handle both old and new data structures
	const isNewStructure = decoded.identification !== undefined;

	return {
		lookupId: data.id,
		vin: data.vin,
		make: isNewStructure ? decoded.identification.make : decoded.make,
		model: isNewStructure ? decoded.identification.model : decoded.model,
		year: isNewStructure ? decoded.identification.modelYear : decoded.year,
		engine: isNewStructure ? (decoded.engine.model || decoded.engine.configuration) : decoded.engine,
		bodyClass: isNewStructure ? decoded.body.bodyClass : decoded.bodyClass,
		plantCountry: isNewStructure ? decoded.manufacturing.plantCountry : decoded.plantCountry,
		fuelType: isNewStructure ? decoded.engine.fuelTypePrimary : decoded.fuelType,
		cifUsd: parseFloat(data.ncsValuationUsd),
		confidence: data.valuationConfidence,
		totalDuty: duty.totalDutyNgn,
		cbnRate: parseFloat(data.cbnRateNgn)
	};
};
