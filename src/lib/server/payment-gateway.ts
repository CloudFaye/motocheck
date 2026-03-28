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

	const response = await fetch('https://api.flutterwave.com/v3/payments', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${config.FLW_SECRET_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			tx_ref: txRef,
			amount: amountNgn,
			currency: 'NGN',
			redirect_url: `${config.PUBLIC_BASE_URL}/payment/success`,
			customer: { email },
			customizations: {
				title: 'VIN Check Report',
				description: 'Vehicle Import Duty Report'
			},
			meta: metadata
		}),
		signal: AbortSignal.timeout(15000)
	});

	if (!response.ok) {
		throw new Error(`Flutterwave API error: ${response.status}`);
	}

	const data = await response.json();
	return {
		paymentUrl: data.data.link,
		txRef
	};
}

export async function verifyTransaction(txId: string): Promise<TransactionVerification> {
	const response = await fetch(`https://api.flutterwave.com/v3/transactions/${txId}/verify`, {
		headers: {
			Authorization: `Bearer ${config.FLW_SECRET_KEY}`
		},
		signal: AbortSignal.timeout(15000)
	});

	if (!response.ok) {
		throw new Error(`Flutterwave verification error: ${response.status}`);
	}

	const data = await response.json();
	return {
		status: data.data.status,
		amount: data.data.amount,
		currency: data.data.currency,
		txRef: data.data.tx_ref
	};
}
