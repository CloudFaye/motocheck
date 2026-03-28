/**
 * Tests for webhook handler
 */

import { describe, it, expect } from 'vitest';
import { handleFlutterwaveWebhook } from './webhook-handler';
import crypto from 'crypto';

describe('Webhook Handler', () => {
	it('should reject invalid HMAC signature', async () => {
		const payload = {
			event: 'charge.completed',
			data: {
				id: '123',
				tx_ref: 'vin-test',
				amount: 5000,
				currency: 'NGN',
				status: 'successful'
			}
		};

		const rawBody = JSON.stringify(payload);
		const invalidHash = 'invalid-hash';

		const result = await handleFlutterwaveWebhook(rawBody, invalidHash, payload);
		expect(result.valid).toBe(false);
	});

	it('should reject non-charge.completed events', async () => {
		const payload = {
			event: 'charge.failed',
			data: {
				id: '123',
				tx_ref: 'vin-test',
				amount: 5000,
				currency: 'NGN',
				status: 'failed'
			}
		};

		const rawBody = JSON.stringify(payload);
		const hash = crypto
			.createHmac('sha512', process.env.FLW_SECRET_HASH || 'test')
			.update(rawBody)
			.digest('hex');

		const result = await handleFlutterwaveWebhook(rawBody, hash, payload);
		expect(result.valid).toBe(false);
	});
});
