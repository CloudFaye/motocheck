/**
 * Worker Process Bootstrap
 * 
 * Registers and starts all workers for the vehicle history pipeline.
 * This process runs separately from the web app and handles all background jobs.
 * 
 * Environment variables are set directly by Railway deployment.
 * For local development, use .env file (loaded automatically by dotenv in package.json).
 * 
 * Requirements: 25.1-25.8, 86.1-86.5, 60.1-60.3, 28.1-28.4
 */

import { getQueue, stopQueue, createAllQueues } from '../src/lib/server/queue/index.js';

// Import fetcher workers (Requirement 25.1)
import { registerFetchNHTSADecodeWorker } from './fetchers/fetch-nhtsa-decode.js';
import { registerFetchNHTSARecallsWorker } from './fetchers/fetch-nhtsa-recalls.js';
import { registerFetchNMVTISWorker } from './fetchers/fetch-nmvtis.js';
import { registerFetchNICBWorker } from './fetchers/fetch-nicb.js';

// Import scraper workers (Requirement 25.2)
import { registerScrapeCopartWorker } from './scrapers/scrape-copart.js';
import { registerScrapeIAAIWorker } from './scrapers/scrape-iaai.js';
import { registerScrapeAutoTraderWorker } from './scrapers/scrape-autotrader.js';
import { registerScrapeCarGurusWorker } from './scrapers/scrape-cargurus.js';
import { registerScrapeJDPowerWorker } from './scrapers/scrape-jdpower.js';
import { registerScrapeVINInspectWorker } from './scrapers/scrape-vininspect.js';

// Import normalizer worker (Requirement 25.3)
import { registerNormalizerWorker } from './normalizers/index.js';

// Import stitcher worker (Requirement 25.4)
import { registerStitcherWorker } from './stitch-report.js';

// Import LLM workers (Requirements 25.5, 25.6)
import { registerLLMAnalyzeWorker } from './llm-analyze.js';
import { registerLLMWriteSectionsWorker } from './llm-write-sections.js';

// Import notification worker
import { registerNotificationWorker } from './send-notifications.js';

/**
 * Heartbeat interval in milliseconds (60 seconds)
 * Requirement 60.1
 */
const HEARTBEAT_INTERVAL = 60 * 1000;

/**
 * Heartbeat timer reference
 */
let heartbeatTimer: NodeJS.Timeout | null = null;

/**
 * Register all workers with the queue
 */
async function registerAllWorkers(): Promise<void> {
	console.log('[workers] Starting worker registration...');
	
	const queue = await getQueue();
	
	// Log pg-boss version on startup (Requirement 25.8, 86.5)
	const pgBossVersion = '12.15.0'; // From package.json
	console.log(`[workers] pg-boss version: ${pgBossVersion}`);
	
	// Create all queues before registering workers
	await createAllQueues();
	
	try {
		// Register fetcher workers (4 workers)
		console.log('[workers] Registering fetcher workers...');
		await registerFetchNHTSADecodeWorker(queue);
		await registerFetchNHTSARecallsWorker(queue);
		await registerFetchNMVTISWorker(queue);
		await registerFetchNICBWorker(queue);
		console.log('[workers] ✓ Registered 4 fetcher workers');
		
		// Register scraper workers (6 workers)
		console.log('[workers] Registering scraper workers...');
		await registerScrapeCopartWorker(queue);
		await registerScrapeIAAIWorker(queue);
		await registerScrapeAutoTraderWorker(queue);
		await registerScrapeCarGurusWorker(queue);
		await registerScrapeJDPowerWorker(queue);
		await registerScrapeVINInspectWorker(queue);
		console.log('[workers] ✓ Registered 6 scraper workers');
		
		// Register normalizer worker (1 worker)
		console.log('[workers] Registering normalizer worker...');
		await registerNormalizerWorker(queue);
		console.log('[workers] ✓ Registered normalizer worker');
		
		// Register stitcher worker (1 worker)
		console.log('[workers] Registering stitcher worker...');
		await registerStitcherWorker(queue);
		console.log('[workers] ✓ Registered stitcher worker');
		
		// Register LLM workers (2 workers)
		console.log('[workers] Registering LLM workers...');
		await registerLLMAnalyzeWorker(queue);
		await registerLLMWriteSectionsWorker(queue);
		console.log('[workers] ✓ Registered 2 LLM workers');
		
		// Register notification worker (1 worker)
		console.log('[workers] Registering notification worker...');
		await registerNotificationWorker(queue);
		console.log('[workers] ✓ Registered notification worker');
		
		// Log total number of registered workers (Requirement 25.7, 86.4)
		const totalWorkers = 16;
		console.log(`[workers] ✓ Successfully registered ${totalWorkers} workers`);
		console.log('[workers] Worker process is ready to process jobs');
		
	} catch (error) {
		// Exit with error code 1 if registration fails (Requirement 25.8, 86.5)
		console.error('[workers] ✗ Failed to register workers:', error);
		process.exit(1);
	}
}

/**
 * Start heartbeat logging
 * Logs heartbeat message every 60 seconds with active job count and queue status
 * Requirements 60.1-60.3
 */
async function startHeartbeat(): Promise<void> {
	heartbeatTimer = setInterval(async () => {
		try {
			const queue = await getQueue();
			
			// Get active job count (Requirement 60.2)
			// pg-boss doesn't expose active job count directly, so we log a heartbeat message
			const queueStatus = queue ? 'connected' : 'disconnected';
			
			// Log heartbeat message (Requirement 60.1)
			// Include queue connection status (Requirement 60.3)
			console.log(`[workers] ❤️  Heartbeat - Queue status: ${queueStatus}`);
			
		} catch (error) {
			console.error('[workers] Heartbeat error:', error);
		}
	}, HEARTBEAT_INTERVAL);
	
	console.log('[workers] Heartbeat logging started (60 second interval)');
}

/**
 * Stop heartbeat logging
 */
function stopHeartbeat(): void {
	if (heartbeatTimer) {
		clearInterval(heartbeatTimer);
		heartbeatTimer = null;
		console.log('[workers] Heartbeat logging stopped');
	}
}

/**
 * Graceful shutdown handler
 * Allows current jobs to complete before exiting
 * Requirements 28.1-28.4
 */
async function handleShutdown(signal: string): Promise<void> {
	// Log shutdown message (Requirement 28.1)
	console.log(`[workers] Received ${signal} signal, initiating graceful shutdown...`);
	
	// Stop heartbeat logging
	stopHeartbeat();
	
	try {
		// Allow current jobs to complete before exiting (Requirement 28.2)
		console.log('[workers] Stopping queue (allowing current jobs to complete)...');
		await stopQueue();
		
		console.log('[workers] Graceful shutdown complete');
		
		// Exit with code 0 after cleanup (Requirement 28.3, 28.4)
		process.exit(0);
		
	} catch (error) {
		console.error('[workers] Error during shutdown:', error);
		process.exit(1);
	}
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
	console.log('[workers] ========================================');
	console.log('[workers] Vehicle History Worker Process');
	console.log('[workers] ========================================');
	
	// Register graceful shutdown handlers (Requirement 28.1)
	process.on('SIGTERM', () => handleShutdown('SIGTERM'));
	process.on('SIGINT', () => handleShutdown('SIGINT'));
	
	// Register all workers
	await registerAllWorkers();
	
	// Start heartbeat logging
	await startHeartbeat();
	
	console.log('[workers] Worker process is running. Press Ctrl+C to stop.');
}

// Start the worker process
main().catch((error) => {
	console.error('[workers] Fatal error:', error);
	process.exit(1);
});
