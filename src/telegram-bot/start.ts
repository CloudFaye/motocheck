#!/usr/bin/env node
import 'dotenv/config';
import { bot } from './index.js';
import { config } from '../lib/server/config.js';

const webhookUrl = `${config.PUBLIC_BASE_URL}/api/webhook/telegram`;

async function main() {
	console.log('🤖 Starting Telegram bot...');

	// Set webhook
	await bot.telegram.setWebhook(webhookUrl, {
		secret_token: config.TELEGRAM_SECRET_TOKEN
	});

	console.log(`✅ Webhook set to: ${webhookUrl}`);
	console.log('🚀 Bot is ready!');
}

main().catch(console.error);
