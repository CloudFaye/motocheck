/**
 * Development Telegram Bot Runner
 * 
 * This script runs the Telegram bot in polling mode for local development.
 * Use this when you can't set up webhooks (local development without ngrok).
 * 
 * Usage:
 *   tsx dev-bot.ts
 * 
 * Make sure your .env file has a valid TELEGRAM_BOT_TOKEN
 */

import { bot } from './telegram-bot';

console.log('🤖 Starting Telegram bot in polling mode...');
console.log('📝 Make sure TELEGRAM_BOT_TOKEN is set in your .env file');
console.log('');

bot.launch()
	.then(() => {
		console.log('✅ Bot started successfully!');
		console.log('💬 Send a message to your bot on Telegram to test');
		console.log('');
		console.log('Press Ctrl+C to stop');
	})
	.catch((error) => {
		console.error('❌ Failed to start bot:', error.message);
		process.exit(1);
	});

// Enable graceful stop
process.once('SIGINT', () => {
	console.log('\n🛑 Stopping bot...');
	bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
	console.log('\n🛑 Stopping bot...');
	bot.stop('SIGTERM');
});
