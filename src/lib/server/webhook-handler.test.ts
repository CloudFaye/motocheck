/**
 * Tests for webhook handler
 */

import { describe, it, expect } from 'vitest';
import { handlePaystackWebhook } from './webhook-handler';
import crypto from 'crypto';

describe('Webhook Handler', () => {
	it('should reject invalid HMAC signature', async () => {
		const payload = {
			event: 'charge.success',
			data: {
				id: 123,
				reference: 'vin-test',
				amount: 500000, // in kobo
				currency: 'NGN',
				status: 'success'
			}
		};

		const rawBody = JSON.stringify(payload);
		const invalidHash = 'invalid-hash';

		const result = await handlePaystackWebhook(rawBody, invalidHash, payload);
		expect(result.valid).toBe(false);
	});

	it('should reject non-charge.success events', async () => {
		const payload = {
			event: 'charge.failed',
			data: {
				id: 123,
				reference: 'vin-test',
				amount: 500000,
				currency: 'NGN',
				status: 'failed'
			}
		};

		const rawBody = JSON.stringify(payload);
		const hash = crypto
			.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || 'test')
			.update(rawBody)
			.digest('hex');

		const result = await handlePaystackWebhook(rawBody, hash, payload);
		expect(result.valid).toBe(false);
	});
});
