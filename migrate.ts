import postgres from 'postgres';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error('DATABASE_URL not set');
	process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function migrate() {
	try {
		console.log('Running migration...');
		const migration = readFileSync('drizzle/0000_young_firebrand.sql', 'utf-8');
		
		// Split by statement separator and execute each
		const statements = migration.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
		
		for (const statement of statements) {
			if (statement) {
				console.log('Executing:', statement.substring(0, 50) + '...');
				await sql.unsafe(statement);
			}
		}
		
		console.log('✅ Migration completed successfully');
		await sql.end();
		process.exit(0);
	} catch (error) {
		console.error('❌ Migration failed:', error);
		await sql.end();
		process.exit(1);
	}
}

migrate();
