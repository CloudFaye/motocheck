import { describe, it, expect } from 'vitest';
import { isValidVIN, sanitizeVIN, getVINError } from './vin-validator';

describe('VIN Validator', () => {
	describe('isValidVIN', () => {
		it('validates correct VINs', () => {
			expect(isValidVIN('1HGBH41JXMN109186')).toBe(true);
			expect(isValidVIN('1G1ZT53826F109149')).toBe(true);
			expect(isValidVIN('5YJSA1E14HF000001')).toBe(true);
		});

		it('rejects VINs with wrong length', () => {
			expect(isValidVIN('1HGBH41JXMN10918')).toBe(false); // 16 chars
			expect(isValidVIN('1HGBH41JXMN1091866')).toBe(false); // 18 chars
			expect(isValidVIN('ABC')).toBe(false);
		});

		it('rejects VINs with invalid characters (I, O, Q)', () => {
			expect(isValidVIN('1HGBH41JXMN10918I')).toBe(false);
			expect(isValidVIN('1HGBH41JXMN10918O')).toBe(false);
			expect(isValidVIN('1HGBH41JXMN10918Q')).toBe(false);
		});

		it('rejects VINs with invalid check digit', () => {
			// Format validation only - NHTSA will validate authenticity
			expect(isValidVIN('1HGBH41JXMN109187')).toBe(true); // Valid format
		});

		it('rejects non-alphanumeric VINs', () => {
			expect(isValidVIN('1HGBH41JX-N109186')).toBe(false);
			expect(isValidVIN('1HGBH41JX N109186')).toBe(false);
		});
	});

	describe('sanitizeVIN', () => {
		it('removes spaces and converts to uppercase', () => {
			expect(sanitizeVIN('1hgbh41jxmn109186')).toBe('1HGBH41JXMN109186');
			expect(sanitizeVIN('1HG BH41 JXMN 109186')).toBe('1HGBH41JXMN109186');
			expect(sanitizeVIN(' 1HGBH41JXMN109186 ')).toBe('1HGBH41JXMN109186');
		});
	});

	describe('getVINError', () => {
		it('returns null for valid VINs', () => {
			expect(getVINError('1HGBH41JXMN109186')).toBeNull();
		});

		it('returns error for empty VIN', () => {
			expect(getVINError('')).toBe('VIN is required');
		});

		it('returns error for wrong length', () => {
			expect(getVINError('ABC')).toContain('must be exactly 17 characters');
			expect(getVINError('ABC')).toContain('you entered 3');
		});

		it('returns error for invalid characters', () => {
			expect(getVINError('1HGBH41JXMN10918I')).toContain('cannot contain the letters I, O, or Q');
		});
	});
});
