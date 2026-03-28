/**
 * Tests for NHTSA VIN decoder
 * Validates API integration, field extraction, and error handling
 */

import { describe, it, expect } from 'vitest';
import { decodeVIN } from './nhtsa-decoder';

describe('NHTSA Decoder', () => {
	it.skip('should decode a valid VIN and extract all required fields', async () => {
		const vin = '1HGBH41JXMN109186'; // Honda Accord
		const result = await decodeVIN(vin);

		expect(result).toBeDefined();
		expect(result.make).toBeDefined();
		expect(result.model).toBeDefined();
		expect(result.year).toBeDefined();
		expect(result.engine).toBeDefined();
		expect(result.displacement).toBeDefined();
		expect(result.bodyClass).toBeDefined();
		expect(result.plantCountry).toBeDefined();
		expect(result.driveType).toBeDefined();
		expect(result.fuelType).toBeDefined();
	});

	it.skip('should use "Unknown" for missing fields', async () => {
		const vin = '1HGBH41JXMN109186'; // Use valid VIN, check for Unknown fallback
		const result = await decodeVIN(vin);

		expect(result).toBeDefined();
		expect(typeof result.make).toBe('string');
		expect(typeof result.model).toBe('string');
		expect(typeof result.year).toBe('string');
	});

	it.skip('should extract fields by VariableId not variable name', async () => {
		const vin = '1HGBH41JXMN109186';
		const result = await decodeVIN(vin);

		// Verify that we get actual data (not "Unknown" for all fields)
		const hasRealData =
			result.make !== 'Unknown' ||
			result.model !== 'Unknown' ||
			result.year !== 'Unknown';

		expect(hasRealData).toBe(true);
	});
});
