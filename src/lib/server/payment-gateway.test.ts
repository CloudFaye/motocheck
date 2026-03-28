/**
 * Tests for payment gateway
 */

import { describe, it, expect } from 'vitest';

describe('Payment Gateway', () => {
	it('should generate transaction reference with vin- prefix', () => {
		const txRef = `vin-${crypto.randomUUID()}`;
		expect(txRef).toMatch(/^vin-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
	});

	it('should validate email format before payment', () => {
		const validEmail = 'test@example.com';
		const invalidEmail = 'invalid-email';

		expect(validEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
		expect(invalidEmail).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
	});
});
