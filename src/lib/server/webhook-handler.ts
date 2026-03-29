import { config } from './config';
import { verifyTransaction } from './payment-gateway';
import crypto from 'crypto';

export interface PaystackWebhookPayload {
	event: string;
	data: {
		id: number;
		reference: string;
		amount: number;
		currency: string;
		status: string;
	};
}

export interface WebhookResult {
	valid: boolean;
	txRef?: string;
	amount?: number;
	txId?: string;
}

export async function handlePaystackWebhook(
	rawBody: string,
	signature: string,
	payload: PaystackWebhookPayload
): Promise<WebhookResult> {
	// Verify HMAC signature
	const hash = crypto
		.createHmac('sha512', config.PAYSTACK_SECRET_KEY)
		.update(rawBody)
		.digest('hex');

	if (hash !== signature) {
		return { valid: false };
	}

	// Check event type
	if (payload.event !== 'charge.success') {
		return { valid: false };
	}

	// Check status
	if (payload.data.status !== 'success') {
		return { valid: false };
	}

	// Re-verify with Paystack API
	const verification = await verifyTransaction(payload.data.reference);

	if (verification.status !== 'success') {
		return { valid: false };
	}

	return {
		valid: true,
		txRef: payload.data.reference,
		amount: payload.data.amount / 100, // Convert from kobo to naira
		txId: String(payload.data.id)
	};
}
