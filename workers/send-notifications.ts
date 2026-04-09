/**
 * Notification Worker
 *
 * Sends progress updates and completion notifications to users
 * Sends admin alerts for worker failures and monitoring
 */

import type { Job } from 'pg-boss';
import { db } from '../src/lib/server/db/index.js';
import { orders, normalizedData, lookups } from '../src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { Jobs, REQUIRED_SOURCES, isRequiredSource } from '../src/lib/server/queue/job-names.js';

interface NotificationJobData {
	vin: string;
	type: 'progress' | 'admin_error' | 'admin_timeout';
	error?: string;
	stage?: string;
}

async function getEmailService() {
	try {
		return await import('../src/lib/server/email-service.js');
	} catch (error) {
		console.warn('[notifications] Email service unavailable:', error);
		return null;
	}
}

async function getTelegramBot() {
	try {
		return await import('../src/telegram-bot/index.js');
	} catch (error) {
		console.warn('[notifications] Telegram bot unavailable:', error);
		return null;
	}
}

/**
 * Send progress notification to user
 */
async function sendUserProgressNotification(vin: string): Promise<void> {
	// Get order info by joining lookups and orders tables
	const result = await db
		.select({
			id: orders.id,
			email: orders.email,
			telegramChatId: orders.telegramChatId,
			lookupId: orders.lookupId
		})
		.from(orders)
		.innerJoin(lookups, eq(orders.lookupId, lookups.id))
		.where(eq(lookups.vin, vin))
		.limit(1);

	if (!result || result.length === 0) {
		console.log(`[notifications] No order found for VIN ${vin}`);
		return;
	}

	const orderData = result[0];

	// Count completed required sources
	const completed = await db.select().from(normalizedData).where(eq(normalizedData.vin, vin));

	const completedRequired = completed.filter((record) => isRequiredSource(record.source)).length;

	const totalRequired = REQUIRED_SOURCES.length;
	const progress = Math.round((completedRequired / totalRequired) * 100);

	// Only send if significant progress (25%, 50%, 75%)
	if (progress !== 25 && progress !== 50 && progress !== 75) {
		return;
	}

	// Estimate remaining time (rough estimate: 30 seconds per source)
	const remaining = totalRequired - completedRequired;
	const estimatedMinutes = Math.ceil((remaining * 30) / 60);

	console.log(
		`[notifications] Sending progress update to ${orderData.email} for VIN ${vin} (${progress}%)`
	);

	// Send email notification
	if (orderData.email && !orderData.email.startsWith('telegram')) {
		try {
			const emailService = await getEmailService();
			await emailService?.sendProgressUpdate(
				orderData.email,
				vin,
				completedRequired,
				totalRequired,
				estimatedMinutes
			);
		} catch (error) {
			console.error(`[notifications] Failed to send email to ${orderData.email}:`, error);
		}
	}

	// Send Telegram notification
	if (orderData.telegramChatId) {
		try {
			const telegramBot = await getTelegramBot();
			if (!telegramBot?.bot) {
				return;
			}

			const progressBar =
				'█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
			await telegramBot.bot.telegram.sendMessage(
				orderData.telegramChatId,
				`🔄 *Report Processing Update*\n\n` +
					`VIN: \`${vin}\`\n\n` +
					`Progress: ${progressBar} ${progress}%\n` +
					`Sources: ${completedRequired}/${totalRequired} complete\n` +
					`Estimated time: ~${estimatedMinutes} min\n\n` +
					`We'll notify you when your report is ready!`,
				{ parse_mode: 'Markdown' }
			);
		} catch (error) {
			console.error(`[notifications] Failed to send Telegram message:`, error);
		}
	}
}

/**
 * Send admin error notification
 */
async function sendAdminErrorNotification(
	vin: string,
	stage: string,
	error: string
): Promise<void> {
	console.log(`[notifications] Sending admin error notification for ${stage} on VIN ${vin}`);

	try {
		const emailService = await getEmailService();
		await emailService?.sendAdminNotification(
			`Worker Error: ${stage}`,
			`A worker encountered an error while processing VIN ${vin}.`,
			{
				vin,
				stage,
				error,
				timestamp: new Date().toISOString()
			}
		);
	} catch (err) {
		console.error('[notifications] Failed to send admin notification:', err);
	}
}

/**
 * Send admin timeout notification
 */
async function sendAdminTimeoutNotification(vin: string): Promise<void> {
	console.log(`[notifications] Sending admin timeout notification for VIN ${vin}`);

	try {
		const emailService = await getEmailService();
		await emailService?.sendAdminNotification(
			`Report Timeout Warning`,
			`Report generation for VIN ${vin} has been processing for over 5 minutes. This may indicate stuck workers or API issues.`,
			{
				vin,
				timestamp: new Date().toISOString(),
				action: 'Check worker logs and job queue status'
			}
		);
	} catch (err) {
		console.error('[notifications] Failed to send admin timeout notification:', err);
	}
}

/**
 * Main notification worker handler
 */
async function handleNotification(jobs: Job<NotificationJobData>[]): Promise<void> {
	for (const job of jobs) {
		const { vin, type, error, stage } = job.data;

		try {
			switch (type) {
				case 'progress':
					await sendUserProgressNotification(vin);
					break;

				case 'admin_error':
					if (stage && error) {
						await sendAdminErrorNotification(vin, stage, error);
					}
					break;

				case 'admin_timeout':
					await sendAdminTimeoutNotification(vin);
					break;

				default:
					console.warn(`[notifications] Unknown notification type: ${type}`);
			}
		} catch (error) {
			console.error(`[notifications] Failed to process notification:`, error);
			// Don't throw - notifications are non-critical
		}
	}
}

/**
 * Register notification worker
 */
export async function registerNotificationWorker(queue: import('pg-boss').PgBoss): Promise<void> {
	await queue.work(Jobs.SEND_NOTIFICATION, handleNotification);
	console.log('[notifications] Worker registered');
}
