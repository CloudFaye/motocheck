import { PgBoss } from 'pg-boss';

// Use environment variable directly for compatibility with worker process
// In SvelteKit context, this is set by the framework
// In worker context, this is set by Railway or loaded from .env
const DATABASE_URL = process.env.DATABASE_URL;

let queueInstance: PgBoss | null = null;

/**
 * Get or create the pg-boss queue singleton instance
 *
 * Configuration:
 * - Retry limit: 3 attempts with exponential backoff
 * - Job expiration: 10 minutes for pending jobs
 * - Job retention: 3 days for completed, 7 days for failed
 * - Error event logging enabled
 *
 * @returns Promise<PgBoss> - The queue instance
 */
export async function getQueue(): Promise<PgBoss> {
	if (queueInstance) {
		return queueInstance;
	}

	const boss = new PgBoss({
		connectionString: DATABASE_URL,

		// Connection pool settings
		max: 10, // Max 10 connections for queue

		// Maintenance settings
		supervise: true,
		maintenanceIntervalSeconds: 60
	});

	// Error event logging (Requirement 2.6)
	boss.on('error', (error) => {
		console.error('[pg-boss] Queue error:', error);
	});

	// Monitor lifecycle events
	boss.on('stopped', () => {
		console.log('[pg-boss] Queue stopped');
		queueInstance = null;
	});

	boss.on('wip', (data) => {
		console.log(`[pg-boss] Work in progress: ${data.length} active jobs`);
	});

	// Start the queue
	await boss.start();
	console.log('[pg-boss] Queue started successfully');

	queueInstance = boss;
	return boss;
}

/**
 * Create all queues needed by the worker pipeline
 * Must be called before workers start listening
 */
export async function createAllQueues(): Promise<void> {
	const queue = await getQueue();

	const queueNames = [
		'fetch-nhtsa-decode',
		'fetch-nhtsa-recalls',
		'fetch-nmvtis',
		'fetch-nicb',
		'scrape-copart',
		'scrape-iaai',
		'scrape-autotrader',
		'scrape-cargurus',
		'scrape-jdpower',
		'scrape-vininspect',
		'normalize',
		'stitch-report',
		'llm-analyze',
		'llm-write-sections',
		'send-notification'
	];

	console.log('[pg-boss] Creating queues...');

	// Queue-level options (Requirement 2.1, 2.2, 2.3, 23.2, 48.1, 49.1, 49.2, 49.3)
	const queueOptions = {
		retryLimit: 3, // 3 retry attempts
		retryDelay: 30, // 30 seconds base delay
		retryBackoff: true, // Exponential backoff
		expireInSeconds: 60 * 10, // 10 minutes for active jobs
		retentionSeconds: 60 * 60 * 24 * 14, // 14 days for pending jobs
		deleteAfterSeconds: 60 * 60 * 24 * 7 // 7 days for completed/failed jobs
	};

	for (const queueName of queueNames) {
		await queue.createQueue(queueName, queueOptions);
	}

	console.log(`[pg-boss] Created ${queueNames.length} queues`);
}

/**
 * Stop the queue gracefully
 * Allows current jobs to complete before shutting down
 */
export async function stopQueue(): Promise<void> {
	if (queueInstance) {
		console.log('[pg-boss] Stopping queue...');
		await queueInstance.stop();
		queueInstance = null;
		console.log('[pg-boss] Queue stopped successfully');
	}
}
