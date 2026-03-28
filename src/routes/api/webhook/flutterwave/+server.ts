import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { handleFlutterwaveWebhook } from '$lib/server/webhook-handler';
import { db } from '$lib/server/db';
import { orders, reports, lookups } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateReport } from '$lib/server/report-generator';
import { uploadReport } from '$lib/server/storage-service';
import { sendReport } from '$lib/server/email-service';

export const POST: RequestHandler = async ({ request }) => {
	const verifHash = request.headers.get('verif-hash') || '';
	const rawBody = await request.text();
	
	let payload;
	try {
		payload = JSON.parse(rawBody);
	} catch (error) {
		console.error('Failed to parse webhook payload:', error);
		return json({ status: 'received' });
	}

	const result = await handleFlutterwaveWebhook(rawBody, verifHash, payload);

	// Always return 200
	if (!result.valid) {
		return json({ status: 'received' });
	}

	try {
		// Find order
		const order = await db.select().from(orders).where(eq(orders.flwTxRef, result.txRef!)).limit(1);

		if (order.length === 0) {
			return json({ status: 'received' });
		}

		const orderRecord = order[0];

		// Check amount
		if (Number(orderRecord.amountNgn) !== result.amount) {
			return json({ status: 'received' });
		}

		// Update order
		await db
			.update(orders)
			.set({
				status: 'paid',
				flwTxId: result.txId,
				paidAt: new Date()
			})
			.where(eq(orders.id, orderRecord.id));

		// Check if report exists (idempotency)
		const existingReport = await db
			.select()
			.from(reports)
			.where(eq(reports.orderId, orderRecord.id))
			.limit(1);

		if (existingReport.length > 0) {
			return json({ status: 'received' });
		}

		// Get lookup data
		const lookup = await db
			.select()
			.from(lookups)
			.where(eq(lookups.id, orderRecord.lookupId))
			.limit(1);

		if (lookup.length === 0) {
			return json({ status: 'received' });
		}

		const lookupData = lookup[0];
		const decoded = lookupData.decodedJson as any;
		const duty = lookupData.dutyJson as any;

		// Generate report
		const report = await generateReport({
			vin: lookupData.vin,
			make: decoded.make,
			model: decoded.model,
			year: decoded.year,
			engine: decoded.engine,
			bodyClass: decoded.bodyClass,
			plantCountry: decoded.plantCountry,
			cifUsd: Number(lookupData.ncsValuationUsd),
			cifNgn: duty.cifNgn,
			confidence: lookupData.valuationConfidence,
			importDuty: duty.importDuty,
			surcharge: duty.surcharge,
			nacLevy: duty.nacLevy,
			ciss: duty.ciss,
			etls: duty.etls,
			vat: duty.vat,
			totalDutyNgn: duty.totalDutyNgn,
			cbnRate: Number(lookupData.cbnRateNgn),
			rateTimestamp: lookupData.rateFetchedAt
		});

		// Upload to R2
		const reportId = crypto.randomUUID();
		const storage = await uploadReport(reportId, report.pdfBuffer);

		// Save report record
		await db.insert(reports).values({
			orderId: orderRecord.id,
			r2Key: storage.r2Key,
			pdfHash: report.hash,
			signedUrl: storage.signedUrl,
			sentAt: new Date()
		});

		// Send email or Telegram
		if (orderRecord.source === 'web') {
			await sendReport(orderRecord.email, reportId, lookupData.vin, storage.signedUrl);
		} else if (orderRecord.source === 'telegram' && orderRecord.telegramChatId) {
			// Send PDF to Telegram
			const { bot } = await import('../../../../telegram-bot');
			await bot.telegram.sendDocument(orderRecord.telegramChatId, {
				source: report.pdfBuffer,
				filename: `vin-report-${lookupData.vin}.pdf`
			});
		}
	} catch (error) {
		console.error('Error processing webhook:', error);
		// Always return 200 to prevent Flutterwave retries
	}

	return json({ status: 'received' });
};
