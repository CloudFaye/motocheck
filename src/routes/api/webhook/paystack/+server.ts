import { json } from '@sveltejs/kit';
import { handlePaystackWebhook } from '$lib/server/webhook-handler';
import { db } from '$lib/server/db';
import { orders, lookups } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getQueue } from '$lib/server/queue';
import { Jobs } from '$lib/server/queue/job-names';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const signature = request.headers.get('x-paystack-signature') || '';
	const rawBody = await request.text();
	
	console.log('📥 Webhook received:', {
		hasSignature: !!signature,
		bodyLength: rawBody.length
	});
	
	let payload;
	try {
		payload = JSON.parse(rawBody);
		console.log('📦 Webhook event:', payload.event);
	} catch (error) {
		console.error('❌ Failed to parse webhook payload:', error);
		return json({ status: 'received' });
	}

	const result = await handlePaystackWebhook(rawBody, signature, payload);

	console.log('✅ Webhook validation result:', { valid: result.valid, txRef: result.txRef });

	// Always return 200
	if (!result.valid) {
		console.log('⚠️ Invalid webhook, ignoring');
		return json({ status: 'received' });
	}

	try {
		// Find order
		const order = await db.select().from(orders).where(eq(orders.paymentRef, result.txRef!)).limit(1);

		if (order.length === 0) {
			console.log('⚠️ Order not found for reference:', result.txRef);
			return json({ status: 'received' });
		}

		const orderRecord = order[0];
		console.log('📋 Order found:', { id: orderRecord.id, status: orderRecord.status });

		// Check amount
		if (Number(orderRecord.amountNgn) !== result.amount) {
			console.log('⚠️ Amount mismatch:', { expected: orderRecord.amountNgn, received: result.amount });
			return json({ status: 'received' });
		}

		// Update order
		await db
			.update(orders)
			.set({
				status: 'paid',
				paymentId: result.txId,
				paidAt: new Date()
			})
			.where(eq(orders.id, orderRecord.id));

		console.log('✅ Order updated to paid');

		// Get lookup data for VIN
		const lookup = await db
			.select()
			.from(lookups)
			.where(eq(lookups.id, orderRecord.lookupId))
			.limit(1);

		if (lookup.length === 0) {
			console.log('⚠️ Lookup not found:', orderRecord.lookupId);
			return json({ status: 'received' });
		}

		const lookupData = lookup[0];
		const vin = lookupData.vin;

		console.log('� Enqueuing jobs for VIN:', vin);

		// Get queue instance
		const queue = await getQueue();

		// Enqueue all fetcher jobs in parallel
		const fetcherJobs = [
			queue.send(Jobs.FETCH_NHTSA_DECODE, { vin }),
			queue.send(Jobs.FETCH_NHTSA_RECALLS, { vin }),
			queue.send(Jobs.FETCH_NMVTIS, { vin }),
			queue.send(Jobs.FETCH_NICB, { vin }),
		];

		// Enqueue all scraper jobs in parallel
		const scraperJobs = [
			queue.send(Jobs.SCRAPE_COPART, { vin }),
			queue.send(Jobs.SCRAPE_IAAI, { vin }),
			queue.send(Jobs.SCRAPE_AUTOTRADER, { vin }),
			queue.send(Jobs.SCRAPE_CARGURUS, { vin }),
		];

		try {
			await Promise.all([...fetcherJobs, ...scraperJobs]);
			console.log('✅ Successfully enqueued 8 jobs for VIN:', vin);
		} catch (error) {
			console.error('❌ Failed to enqueue jobs:', error);
			// Log individual failures
			const results = await Promise.allSettled([...fetcherJobs, ...scraperJobs]);
			results.forEach((result, index) => {
				if (result.status === 'rejected') {
					const jobNames = [
						'fetch-nhtsa-decode',
						'fetch-nhtsa-recalls',
						'fetch-nmvtis',
						'fetch-nicb',
						'scrape-copart',
						'scrape-iaai',
						'scrape-autotrader',
						'scrape-cargurus',
					];
					console.error(`✗ Failed to enqueue ${jobNames[index]}:`, result.reason);
				}
			});
		}

		console.log('🎉 Webhook processing complete');
	} catch (error) {
		console.error('❌ Error processing webhook:', error);
		// Always return 200 to prevent Paystack retries
	}

	return json({ status: 'received' });
};
