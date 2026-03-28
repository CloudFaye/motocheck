/**
 * Tests for duty calculation engine
 */

import { describe, it, expect } from 'vitest';
import { calculateDuty } from './duty-engine';

describe('Duty Engine', () => {
	it('should calculate all duty components correctly', () => {
		const result = calculateDuty(10000, 1500);

		expect(result.cifUsd).toBe(10000);
		expect(result.cifNgn).toBe(15000000);
		expect(result.cbnRate).toBe(1500);
		expect(result.importDuty).toBe(5250000); // 35% of CIF
		expect(result.surcharge).toBe(367500); // 7% of import duty
		expect(result.nacLevy).toBe(3000000); // 20% of CIF
		expect(result.ciss).toBe(150000); // 1% of CIF
		expect(result.etls).toBe(75000); // 0.5% of CIF
		expect(result.vat).toBeGreaterThan(0); // 7.5% of sum
		expect(result.totalDutyNgn).toBeGreaterThan(0);
		expect(result.totalDutyUsd).toBeGreaterThan(0);
	});

	it('should be deterministic for same inputs', () => {
		const result1 = calculateDuty(10000, 1500);
		const result2 = calculateDuty(10000, 1500);

		expect(result1.totalDutyNgn).toBe(result2.totalDutyNgn);
		expect(result1.importDuty).toBe(result2.importDuty);
	});

	it('should include metadata', () => {
		const result = calculateDuty(10000, 1500);

		expect(result.rateTimestamp).toBeInstanceOf(Date);
		expect(result.financeActYear).toBe(2024);
	});
});
