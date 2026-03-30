import { json } from '@sveltejs/kit';
import { handlePaystackWebhook } from '$lib/server/webhook-handler';
import { db } from '$lib/server/db';
import { orders, reports, lookups } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateVehicleReport } from '$lib/server/reports/generator';
import { uploadReport } from '$lib/server/storage-service';
import { sendReport } from '$lib/server/email-service';
import type { ComprehensiveVehicleData } from '$lib/server/vehicle/types';
import type { RequestHandler } from '@sveltejs/kit';

interface DutyData {
	cifNgn: number;
	importDuty: number;
	surcharge: number;
	nacLevy: number;
	ciss: number;
	etls: number;
	vat: number;
	totalDutyNgn: number;
}

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

		// Check if report exists (idempotency)
		const existingReport = await db
			.select()
			.from(reports)
			.where(eq(reports.orderId, orderRecord.id))
			.limit(1);

		if (existingReport.length > 0) {
			console.log('ℹ️ Report already exists, skipping generation');
			return json({ status: 'received' });
		}

		// Get lookup data
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
		const vehicleData = lookupData.decodedJson as ComprehensiveVehicleData;
		const duty = lookupData.dutyJson as DutyData;

		console.log('📄 Generating report for VIN:', lookupData.vin);

		// Generate report with comprehensive vehicle data
		const report = await generateVehicleReport(vehicleData, {
			includeNCSValuation: true,
			includeDutyBreakdown: true,
			cifUsd: Number(lookupData.ncsValuationUsd),
			cifNgn: duty.cifNgn,
			confidence: lookupData.valuationConfidence,
			dutyBreakdown: {
				importDuty: duty.importDuty,
				surcharge: duty.surcharge,
				nacLevy: duty.nacLevy,
				ciss: duty.ciss,
				etls: duty.etls,
				vat: duty.vat,
				totalDutyNgn: duty.totalDutyNgn
			},
			cbnRate: Number(lookupData.cbnRateNgn)
		});

		console.log('✅ Report generated, uploading to R2...');

		// Upload to R2
		const reportId = crypto.randomUUID();
		const storage = await uploadReport(reportId, report.pdfBuffer);

		console.log('✅ Report uploaded:', storage.r2Key);

		// Save report record
		await db.insert(reports).values({
			orderId: orderRecord.id,
			r2Key: storage.r2Key,
			pdfHash: report.hash,
			signedUrl: storage.signedUrl,
			sentAt: new Date()
		});

		console.log('✅ Report record saved');

		// Send email or Telegram
		if (orderRecord.source === 'web') {
			console.log('📧 Sending email to:', orderRecord.email);
			await sendReport(orderRecord.email, reportId, lookupData.vin, storage.signedUrl);
			console.log('✅ Email sent');
		} else if (orderRecord.source === 'telegram' && orderRecord.telegramChatId) {
			console.log('📱 Sending to Telegram chat:', orderRecord.telegramChatId);
			// Send PDF to Telegram
			const { bot } = await import('../../../../telegram-bot');
			await bot.telegram.sendDocument(orderRecord.telegramChatId, {
				source: report.pdfBuffer,
				filename: `vin-report-${lookupData.vin}.pdf`
			});
			console.log('✅ Telegram message sent');
		}

		console.log('🎉 Webhook processing complete');
	} catch (error) {
		console.error('❌ Error processing webhook:', error);
		// Always return 200 to prevent Paystack retries
	}

	return json({ status: 'received' });
};
