import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { lookups, orders } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { initiatePayment } from '$lib/server/payment-gateway';
import { EMAIL_REGEX, REPORT_PRICE_NGN } from '$lib/constants';

export const POST: RequestHandler = async ({ request }) => {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON payload' }, { status: 400 });
	}

	const { email, lookupId } = body;

	if (!email || !EMAIL_REGEX.test(email)) {
		return json({ error: 'Valid email is required' }, { status: 400 });
	}

	if (!lookupId) {
		return json({ error: 'Lookup ID is required' }, { status: 400 });
	}

	// Verify lookup exists
	const lookup = await db.select().from(lookups).where(eq(lookups.id, lookupId)).limit(1);

	if (lookup.length === 0) {
		return json({ error: 'Lookup not found' }, { status: 404 });
	}

	const amountNgn = REPORT_PRICE_NGN;

	try {
		const payment = await initiatePayment(email, amountNgn, {
			source: 'web',
			lookupId
		});

		// Create order
		await db.insert(orders).values({
			lookupId,
			email,
			amountNgn: String(amountNgn),
			flwTxRef: payment.txRef,
			status: 'pending',
			source: 'web'
		});

		return json({ paymentUrl: payment.paymentUrl });
	} catch (error) {
		console.error('Payment initiation error:', error);
		if (error instanceof Error && error.message.includes('Flutterwave')) {
			return json({ error: 'Payment gateway unavailable' }, { status: 502 });
		}
		return json({ error: 'Failed to initiate payment' }, { status: 500 });
	}
};
