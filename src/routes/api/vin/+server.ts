import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkRateLimit } from '$lib/server/rate-limiter';
import { decodeVIN } from '$lib/server/nhtsa-decoder';
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
	} catch (error) {
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
		const decoded = lookup.decodedJson as any;
		const duty = lookup.dutyJson as any;

		return json({
			lookupId: lookup.id,
			vin: lookup.vin,
			make: decoded.make,
			model: decoded.model,
			year: decoded.year,
			engine: decoded.engine,
			bodyClass: decoded.bodyClass,
			plantCountry: decoded.plantCountry,
			fuelType: decoded.fuelType,
			dutyEstimate: duty.totalDutyNgn,
			confidence: lookup.valuationConfidence
		});
	}

	try {
		// Decode VIN
		const decoded = await decodeVIN(normalizedVin);
		const valuation = lookupValuation(decoded.year, decoded.make, decoded.model);
		const rate = getCurrentRate();
		const duty = calculateDuty(valuation.cifUsd, rate.cbnRate);

		// Store in cache
		const [inserted] = await db.insert(lookups).values({
			vin: normalizedVin,
			decodedJson: decoded,
			ncsValuationUsd: String(valuation.cifUsd),
			valuationConfidence: valuation.confidence,
			dutyJson: duty,
			cbnRateNgn: String(rate.cbnRate),
			rateFetchedAt: rate.fetchedAt
		}).returning();

		return json({
			lookupId: inserted.id,
			vin: normalizedVin,
			make: decoded.make,
			model: decoded.model,
			year: decoded.year,
			engine: decoded.engine,
			bodyClass: decoded.bodyClass,
			plantCountry: decoded.plantCountry,
			fuelType: decoded.fuelType,
			dutyEstimate: duty.totalDutyNgn,
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
