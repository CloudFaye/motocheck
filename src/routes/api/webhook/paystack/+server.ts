import { json } from '@sveltejs/kit';
import { handlePaystackWebhook } from '$lib/server/webhook-handler';
import { db } from '$lib/server/db';
import { orders, reports, lookups } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateVehicleReport } from '$lib/server/reports/generator';
import { uploadReport } from '$lib/server/storage-service';
import { sendReport } from '$lib/server/email-service';
import { config } from '$lib/server/config';
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

		console.log('📄 Generating reports for VIN:', lookupData.vin);

		// Generate both PDF and DOCX reports
		const reportOptions = {
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
		};

		const [docxReport, pdfReport] = await Promise.all([
			generateVehicleReport(vehicleData, { ...reportOptions, format: 'docx' }),
			generateVehicleReport(vehicleData, { ...reportOptions, format: 'pdf' })
		]);

		console.log('✅ Both reports generated, uploading to R2...');

		// Upload both reports to R2
		const docxReportId = crypto.randomUUID();
		const pdfReportId = crypto.randomUUID();

		const [docxStorage, pdfStorage] = await Promise.all([
			uploadReport(docxReportId, docxReport.buffer, docxReport.format),
			uploadReport(pdfReportId, pdfReport.buffer, pdfReport.format)
		]);

		console.log('✅ Reports uploaded:', { docx: docxStorage.r2Key, pdf: pdfStorage.r2Key });

		// Save both report records
		await db.insert(reports).values([
			{
				id: docxReportId,
				orderId: orderRecord.id,
				r2Key: docxStorage.r2Key,
				documentHash: docxReport.hash,
				format: docxReport.format,
				signedUrl: '',
				sentAt: new Date()
			},
			{
				id: pdfReportId,
				orderId: orderRecord.id,
				r2Key: pdfStorage.r2Key,
				documentHash: pdfReport.hash,
				format: pdfReport.format,
				signedUrl: '',
				sentAt: new Date()
			}
		]);

		console.log('✅ Report records saved');

		// Send email or Telegram with both formats
		if (orderRecord.source === 'web') {
			console.log('📧 Sending email notification with both formats as attachments');
			await sendReport(orderRecord.email, docxReportId, lookupData.vin, docxReport.buffer, pdfReport.buffer);
			console.log('✅ Email sent');
		} else if (orderRecord.source === 'telegram' && orderRecord.telegramChatId) {
			console.log('📱 Sending both formats to Telegram');
			const { bot } = await import('../../../../telegram-bot');
			
			// Send both documents to Telegram
			await Promise.all([
				bot.telegram.sendDocument(orderRecord.telegramChatId, {
					source: docxReport.buffer,
					filename: `motocheck-report-${lookupData.vin}.docx`
				}, {
					caption: '📄 Word Document (editable)'
				}),
				bot.telegram.sendDocument(orderRecord.telegramChatId, {
					source: pdfReport.buffer,
					filename: `motocheck-report-${lookupData.vin}.pdf`
				}, {
					caption: '📕 PDF Document'
				})
			]);
			
			console.log('✅ Telegram messages sent');
		}

		console.log('🎉 Webhook processing complete');
	} catch (error) {
		console.error('❌ Error processing webhook:', error);
		// Always return 200 to prevent Paystack retries
	}

	return json({ status: 'received' });
};
