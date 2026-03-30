import { Telegraf } from 'telegraf';
import { config } from '../lib/server/config';
import { checkRateLimit } from '../lib/server/rate-limiter';
import { decodeVehicle } from '../lib/server/vehicle/decoder';
import { lookupValuation } from '../lib/server/ncs-valuator';
import { calculateDuty } from '../lib/server/duty-engine';
import { getCurrentRate } from '../lib/server/exchange-rate-manager';
import { initiatePayment } from '../lib/server/payment-gateway';
import { db } from '../lib/server/db';
import { lookups, orders } from '../lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { ComprehensiveVehicleData } from '../lib/server/vehicle/types';

const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => {
	ctx.reply(
		'🚗 Welcome to VIN Check Bot!\n\n' +
			'Send me a 17-character VIN to get instant vehicle import duty estimates.\n\n' +
			'💰 Price: ₦5,000 for full detailed report\n\n' +
			'Commands:\n' +
			'/help - Show this message\n' +
			'/check <VIN> - Check a VIN'
	);
});

bot.help((ctx) => {
	ctx.reply(
		'📋 VIN Check Bot Help\n\n' +
			'How to use:\n' +
			'1. Send a 17-character VIN\n' +
			'2. Review the vehicle details and duty estimate\n' +
			'3. Click the payment link to purchase full report\n' +
			'4. Receive PDF report via Telegram\n\n' +
			'Price: ₦5,000 per report\n\n' +
			'Support: Contact @support'
	);
});

bot.command('check', async (ctx) => {
	const vin = ctx.message.text.split(' ')[1]?.trim().toUpperCase();

	if (!vin) {
		return ctx.reply('❌ Please provide a VIN: /check <VIN>');
	}

	await handleVinCheck(ctx, vin);
});

bot.on('text', async (ctx) => {
	const text = ctx.message.text.trim().toUpperCase();

	// Ignore commands
	if (text.startsWith('/')) return;

	// Check if it looks like a VIN (17 alphanumeric)
	if (text.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/.test(text)) {
		await handleVinCheck(ctx, text);
	} else {
		ctx.reply('❌ Invalid VIN. Please send a valid 17-character VIN.');
	}
});

async function handleVinCheck(ctx: any, vin: string) {
	const chatId = String(ctx.chat.id);

	// Rate limiting (separate namespace for Telegram)
	const rateLimit = checkRateLimit(`telegram:${chatId}`, 5, 3600);
	if (!rateLimit.allowed) {
		return ctx.reply(
			`⏳ Rate limit exceeded. Please try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.`
		);
	}

	const statusMsg = await ctx.reply('🔍 Checking VIN...');

	try {
		// Check cache
		const cached = await db.select().from(lookups).where(eq(lookups.vin, vin)).limit(1);

		let lookupId: string;
		let vehicleData: ComprehensiveVehicleData;
		let duty: any;
		let confidence: string;

		if (cached.length > 0) {
			const lookup = cached[0];
			lookupId = lookup.id;
			vehicleData = lookup.decodedJson as ComprehensiveVehicleData;
			duty = lookup.dutyJson;
			confidence = lookup.valuationConfidence;
		} else {
			// Decode VIN
			vehicleData = await decodeVehicle(vin);
			const valuation = lookupValuation(
				vehicleData.identification.modelYear,
				vehicleData.identification.make,
				vehicleData.identification.model
			);
			const rate = getCurrentRate();
			duty = calculateDuty(valuation.cifUsd, rate.cbnRate);

			// Store in cache
			const [inserted] = await db
				.insert(lookups)
				.values({
					vin,
					decodedJson: vehicleData,
					ncsValuationUsd: String(valuation.cifUsd),
					valuationConfidence: valuation.confidence,
					dutyJson: duty,
					cbnRateNgn: String(rate.cbnRate),
					rateFetchedAt: rate.fetchedAt
				})
				.returning();

			lookupId = inserted.id;
			confidence = valuation.confidence;
		}

		// Create pending order for payment tracking
		const amountNgn = 5000;
		const payment = await initiatePayment('telegram@user.com', amountNgn, {
			source: 'telegram',
			lookupId,
			chatId
		});

		await db.insert(orders).values({
			lookupId,
			email: 'telegram@user.com',
			amountNgn: String(amountNgn),
			paymentRef: payment.txRef,
			status: 'pending',
			source: 'telegram',
			telegramChatId: chatId
		});

		// Format response
		const message =
			`✅ Vehicle Found!\n\n` +
			`🚗 ${vehicleData.identification.make} ${vehicleData.identification.model} (${vehicleData.identification.modelYear})\n` +
			`🔧 Engine: ${vehicleData.engine.model || vehicleData.engine.configuration}\n` +
			`🏭 Origin: ${vehicleData.manufacturing.plantCountry}\n` +
			`⛽ Fuel: ${vehicleData.engine.fuelTypePrimary}\n` +
			`📦 Body: ${vehicleData.body.bodyClass}\n\n` +
			`💰 Estimated Import Duty: ₦${duty.totalDutyNgn.toLocaleString()}\n` +
			`📊 Confidence: ${confidence}\n\n` +
			`📄 Get full detailed report for ₦5,000\n` +
			`Click below to purchase:`;

		await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, undefined, message, {
			reply_markup: {
				inline_keyboard: [[{ text: '💳 Purchase Report (₦5,000)', url: payment.paymentUrl }]]
			}
		});
	} catch (error: any) {
		await ctx.telegram.editMessageText(
			ctx.chat.id,
			statusMsg.message_id,
			undefined,
			`❌ Error: ${error.message || 'Failed to decode VIN'}`
		);
	}
}

export { bot };
