import { config } from './config';

export interface PaymentInitiationResult {
	paymentUrl: string;
	txRef: string;
}

export interface TransactionVerification {
	status: string;
	amount: number;
	currency: string;
	txRef: string;
}

export async function initiatePayment(
	email: string,
	amountNgn: number,
	metadata: { source: string; lookupId: string; chatId?: string }
): Promise<PaymentInitiationResult> {
	const txRef = `vin-${crypto.randomUUID()}`;

	const response = await fetch('https://api.paystack.co/transaction/initialize', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			reference: txRef,
			amount: amountNgn * 100, // Paystack uses kobo (smallest currency unit)
			email,
			currency: 'NGN',
			callback_url: `${config.PUBLIC_BASE_URL}/payment/success`,
			metadata
		}),
		signal: AbortSignal.timeout(15000)
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(`Paystack API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
	}

	const data = await response.json();
	return {
		paymentUrl: data.data.authorization_url,
		txRef
	};
}

export async function verifyTransaction(reference: string): Promise<TransactionVerification> {
	const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
		headers: {
			Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`
		},
		signal: AbortSignal.timeout(15000)
	});

	if (!response.ok) {
		throw new Error(`Paystack verification error: ${response.status}`);
	}

	const data = await response.json();
	return {
		status: data.data.status,
		amount: data.data.amount / 100, // Convert from kobo to naira
		currency: data.data.currency,
		txRef: data.data.reference
	};
}
