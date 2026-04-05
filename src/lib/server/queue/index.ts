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
		
		// Retry configuration (Requirement 2.1, 23.2)
		retryLimit: 3,
		retryDelay: 30, // 30 seconds base delay
		retryBackoff: true, // Exponential backoff
		
		// Job expiration (Requirement 2.2, 48.1)
		expireInSeconds: 60 * 10, // 10 minutes
		
		// Job retention (Requirement 2.3, 49.1, 49.2)
		retentionDays: 3, // Completed jobs retained for 3 days
		archiveCompletedAfterSeconds: 60 * 60 * 24 * 3, // 3 days
		
		// Failed job retention (Requirement 49.3)
		deleteAfterDays: 7, // Failed jobs retained for 7 days
		
		// Connection pool settings
		max: 10, // Max 10 connections for queue
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
