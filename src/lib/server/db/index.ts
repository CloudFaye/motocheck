import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Use process.env directly for compatibility with worker process
// In SvelteKit context, this is set by the framework
// In worker context, this is set by Railway or loaded from .env
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL || DATABASE_URL.trim() === '') {
	throw new Error(
		'DATABASE_URL environment variable is required.\n' +
			'For Railway: Set DATABASE_URL in environment variables.\n' +
			'For local development: Add DATABASE_URL to your .env file.'
	);
}

const client = postgres(DATABASE_URL, {
	max: 10,
	idle_timeout: 20,
	connect_timeout: 10
});

export const db = drizzle(client, { schema });
