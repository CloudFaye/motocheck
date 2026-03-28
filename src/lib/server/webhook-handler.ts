import { config } from './config';
import { verifyTransaction } from './payment-gateway';
import crypto from 'crypto';

export interface WebhookPayload {
	event: string;
	data: {
		id: string;
		tx_ref: string;
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

export async function handleFlutterwaveWebhook(
	rawBody: string,
	verifHash: string,
	payload: WebhookPayload
): Promise<WebhookResult> {
	// Verify HMAC signature
	const hash = crypto.createHmac('sha512', config.FLW_SECRET_HASH).update(rawBody).digest('hex');

	if (hash !== verifHash) {
		return { valid: false };
	}

	// Check event type
	if (payload.event !== 'charge.completed') {
		return { valid: false };
	}

	// Check status
	if (payload.data.status !== 'successful') {
		return { valid: false };
	}

	// Re-verify with Flutterwave API
	const verification = await verifyTransaction(payload.data.id);

	if (verification.status !== 'successful') {
		return { valid: false };
	}

	return {
		valid: true,
		txRef: payload.data.tx_ref,
		amount: payload.data.amount,
		txId: payload.data.id
	};
}
