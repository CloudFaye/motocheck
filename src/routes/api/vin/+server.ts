import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkRateLimit } from '$lib/server/rate-limiter';
import { decodeVehicle } from '$lib/server/vehicle/decoder';
import { lookupValuation } from '$lib/server/ncs-valuator';
import { calculateDuty } from '$lib/server/duty-engine';
import { getCurrentRate } from '$lib/server/exchange-rate-manager';
import { db } from '$lib/server/db';
import { lookups } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sanitizeVIN, getVINError } from '$lib/vin-validator';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	const rateLimit = checkRateLimit(ip, 5, 60);

	if (!rateLimit.allowed) {
		return json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON payload' }, { status: 400 });
	}

	const { vin } = body;

	if (!vin || typeof vin !== 'string') {
		return json({ error: 'VIN is required' }, { status: 400 });
	}

	const normalizedVin = sanitizeVIN(vin);

	// Validate VIN format
	const validationError = getVINError(normalizedVin);
	if (validationError) {
		return json({ error: validationError }, { status: 400 });
	}

	// Check cache
	const cached = await db.select().from(lookups).where(eq(lookups.vin, normalizedVin)).limit(1);

	if (cached.length > 0) {
		const lookup = cached[0];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const decoded = lookup.decodedJson as Record<string, any>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const duty = lookup.dutyJson as Record<string, any>;

		return json({
			lookupId: lookup.id,
			vin: lookup.vin,
			make: decoded.identification?.make || decoded.make,
			model: decoded.identification?.model || decoded.model,
			year: decoded.identification?.modelYear || decoded.year,
			engine: decoded.engine?.model || decoded.engine,
			bodyClass: decoded.body?.bodyClass || decoded.bodyClass,
			plantCountry: decoded.manufacturing?.plantCountry || decoded.plantCountry,
			fuelType: decoded.engine?.fuelTypePrimary || decoded.fuelType,
			dutyEstimate: duty.totalDutyNgn,
			confidence: lookup.valuationConfidence
		});
	}

	try {
		// Decode VIN with comprehensive data
		const vehicleData = await decodeVehicle(normalizedVin);
		const valuation = lookupValuation(
			vehicleData.identification.modelYear,
			vehicleData.identification.make,
			vehicleData.identification.model
		);
		const rate = getCurrentRate();
		const dutyCalc = calculateDuty(valuation.cifUsd, rate.cbnRate);

		// Store comprehensive data in cache
		const [inserted] = await db.insert(lookups).values({
			vin: normalizedVin,
			decodedJson: vehicleData,
			ncsValuationUsd: String(valuation.cifUsd),
			valuationConfidence: valuation.confidence,
			dutyJson: dutyCalc,
			cbnRateNgn: String(rate.cbnRate),
			rateFetchedAt: rate.fetchedAt
		}).returning();

		return json({
			lookupId: inserted.id,
			vin: normalizedVin,
			make: vehicleData.identification.make,
			model: vehicleData.identification.model,
			year: vehicleData.identification.modelYear,
			engine: vehicleData.engine.model || vehicleData.engine.configuration,
			bodyClass: vehicleData.body.bodyClass,
			plantCountry: vehicleData.manufacturing.plantCountry,
			fuelType: vehicleData.engine.fuelTypePrimary,
			dutyEstimate: dutyCalc.totalDutyNgn,
			confidence: valuation.confidence
		});
	} catch (error) {
		console.error('Error decoding VIN:', error);
		if (error instanceof Error && error.message.includes('NHTSA')) {
			return json({ error: 'Unable to decode VIN from NHTSA database' }, { status: 502 });
		}
		return json({ error: 'Failed to process VIN' }, { status: 500 });
	}
};
