/**
 * Tests for NCS valuator
 */

import { describe, it, expect } from 'vitest';
import { lookupValuation } from './ncs-valuator';

describe('NCS Valuator', () => {
	it('should return exact match with exact confidence', () => {
		const result = lookupValuation('2020', 'HONDA', 'ACCORD');
		expect(result.cifUsd).toBe(12500);
		expect(result.confidence).toBe('exact');
		expect(result.matchedKey).toBe('2020-HONDA-ACCORD');
	});

	it('should return interpolated match for missing year', () => {
		const result = lookupValuation('2021', 'HONDA', 'ACCORD');
		expect(result.confidence).toBe('interpolated');
		expect(result.cifUsd).toBeGreaterThan(0);
	});

	it('should return estimated match for unknown vehicle', () => {
		const result = lookupValuation('2020', 'UNKNOWN', 'MODEL');
		expect(result.confidence).toBe('estimated');
		expect(result.cifUsd).toBeGreaterThan(0);
	});

	it('should handle case-insensitive matching', () => {
		const result = lookupValuation('2020', 'honda', 'accord');
		expect(result.cifUsd).toBe(12500);
		expect(result.confidence).toBe('exact');
	});
});
