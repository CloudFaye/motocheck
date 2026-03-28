import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { lookups } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const lookup = await db.select().from(lookups).where(eq(lookups.id, params.lookupId)).limit(1);

	if (lookup.length === 0) {
		error(404, 'Lookup not found');
	}

	const data = lookup[0];
	const decoded = data.decodedJson as any;
	const duty = data.dutyJson as any;

	return {
		lookupId: data.id,
		vin: data.vin,
		make: decoded.make,
		model: decoded.model,
		year: decoded.year,
		engine: decoded.engine,
		bodyClass: decoded.bodyClass,
		plantCountry: decoded.plantCountry,
		fuelType: decoded.fuelType,
		dutyEstimate: duty.totalDutyNgn,
		confidence: data.valuationConfidence
	};
};
