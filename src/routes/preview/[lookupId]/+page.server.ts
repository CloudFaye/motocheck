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
		error(404, 'Lookup not found');
	}

	const data = lookup[0];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const decoded = data.decodedJson as Record<string, any>;
	const duty = data.dutyJson as DutyData;

	// Handle both old and new data structures
	const isNewStructure = decoded.identification !== undefined;

	// Helper to safely get value with fallback
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const safeGet = (value: any, fallback: string = 'N/A'): string => {
		if (value === null || value === undefined || value === '') return fallback;
		if (typeof value === 'object') return fallback;
		return String(value);
	};

	return {
		lookupId: data.id,
		vin: data.vin,
		make: safeGet(isNewStructure ? decoded.identification?.make : decoded.make, 'Unknown'),
		model: safeGet(isNewStructure ? decoded.identification?.model : decoded.model, 'Unknown'),
		year: safeGet(isNewStructure ? decoded.identification?.modelYear : decoded.year, 'Unknown'),
		engine: safeGet(
			isNewStructure 
				? (decoded.engine?.model || decoded.engine?.configuration) 
				: decoded.engine,
			'Unknown'
		),
		bodyClass: safeGet(isNewStructure ? decoded.body?.bodyClass : decoded.bodyClass, 'Unknown'),
		plantCountry: safeGet(isNewStructure ? decoded.manufacturing?.plantCountry : decoded.plantCountry, 'Unknown'),
		fuelType: safeGet(isNewStructure ? decoded.engine?.fuelTypePrimary : decoded.fuelType, 'Unknown'),
		dutyEstimate: duty?.totalDutyNgn || 0,
		confidence: data.valuationConfidence || 'unknown'
	};
};
