/**
 * Integration tests for database connectivity and schema
 * These tests verify that the database is properly configured and accessible
 */

import { describe, it, expect } from 'vitest';
import { db } from './index';
import { sql } from 'drizzle-orm';

describe('Database Integration', () => {
	it('should connect to the database', async () => {
		// Simple query to verify connection
		const result = await db.execute(sql`SELECT 1 as value`);
		expect(result).toBeDefined();
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(1);
		expect(result[0].value).toBe(1);
	});

	it('should have lookups table with correct structure', async () => {
		const result = await db.execute(sql`
			SELECT column_name, data_type, is_nullable, column_default
			FROM information_schema.columns
			WHERE table_name = 'lookups'
			ORDER BY ordinal_position
		`);

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);

		const columns = result.map((row: any) => row.column_name);
		expect(columns).toContain('id');
		expect(columns).toContain('vin');
		expect(columns).toContain('decoded_json');
		expect(columns).toContain('ncs_valuation_usd');
		expect(columns).toContain('valuation_confidence');
		expect(columns).toContain('duty_json');
		expect(columns).toContain('cbn_rate_ngn');
		expect(columns).toContain('rate_fetched_at');
		expect(columns).toContain('created_at');
		expect(columns).toContain('refreshed_at');
	});

	it('should have orders table with correct structure', async () => {
		const result = await db.execute(sql`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_name = 'orders'
			ORDER BY ordinal_position
		`);

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);

		const columns = result.map((row: any) => row.column_name);
		expect(columns).toContain('id');
		expect(columns).toContain('lookup_id');
		expect(columns).toContain('email');
		expect(columns).toContain('amount_ngn');
		expect(columns).toContain('flw_tx_ref');
		expect(columns).toContain('flw_tx_id');
		expect(columns).toContain('status');
		expect(columns).toContain('source');
		expect(columns).toContain('telegram_chat_id');
		expect(columns).toContain('created_at');
		expect(columns).toContain('paid_at');
	});

	it('should have reports table with correct structure', async () => {
		const result = await db.execute(sql`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_name = 'reports'
			ORDER BY ordinal_position
		`);

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);

		const columns = result.map((row: any) => row.column_name);
		expect(columns).toContain('id');
		expect(columns).toContain('order_id');
		expect(columns).toContain('r2_key');
		expect(columns).toContain('pdf_hash');
		expect(columns).toContain('signed_url');
		expect(columns).toContain('sent_at');
		expect(columns).toContain('created_at');
	});

	it('should have unique constraint on lookups.vin', async () => {
		const result = await db.execute(sql`
			SELECT constraint_name, constraint_type
			FROM information_schema.table_constraints
			WHERE table_name = 'lookups' AND constraint_type = 'UNIQUE'
		`);

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
		const constraintNames = result.map((row: any) => row.constraint_name);
		expect(constraintNames.some((name: string) => name.includes('vin'))).toBe(true);
	});

	it('should have foreign key from orders.lookup_id to lookups.id', async () => {
		const result = await db.execute(sql`
			SELECT
				tc.constraint_name,
				kcu.column_name,
				ccu.table_name AS foreign_table_name,
				ccu.column_name AS foreign_column_name
			FROM information_schema.table_constraints AS tc
			JOIN information_schema.key_column_usage AS kcu
				ON tc.constraint_name = kcu.constraint_name
			JOIN information_schema.constraint_column_usage AS ccu
				ON ccu.constraint_name = tc.constraint_name
			WHERE tc.constraint_type = 'FOREIGN KEY'
				AND tc.table_name = 'orders'
				AND kcu.column_name = 'lookup_id'
		`);

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(1);
		expect(result[0].foreign_table_name).toBe('lookups');
		expect(result[0].foreign_column_name).toBe('id');
	});

	it('should have unique foreign key from reports.order_id to orders.id', async () => {
		// Check foreign key
		const fkResult = await db.execute(sql`
			SELECT
				tc.constraint_name,
				kcu.column_name,
				ccu.table_name AS foreign_table_name,
				ccu.column_name AS foreign_column_name
			FROM information_schema.table_constraints AS tc
			JOIN information_schema.key_column_usage AS kcu
				ON tc.constraint_name = kcu.constraint_name
			JOIN information_schema.constraint_column_usage AS ccu
				ON ccu.constraint_name = tc.constraint_name
			WHERE tc.constraint_type = 'FOREIGN KEY'
				AND tc.table_name = 'reports'
				AND kcu.column_name = 'order_id'
		`);

		expect(Array.isArray(fkResult)).toBe(true);
		expect(fkResult.length).toBe(1);
		expect(fkResult[0].foreign_table_name).toBe('orders');
		expect(fkResult[0].foreign_column_name).toBe('id');

		// Check unique constraint
		const uniqueResult = await db.execute(sql`
			SELECT constraint_name, constraint_type
			FROM information_schema.table_constraints
			WHERE table_name = 'reports'
				AND constraint_type = 'UNIQUE'
		`);

		expect(Array.isArray(uniqueResult)).toBe(true);
		expect(uniqueResult.length).toBeGreaterThan(0);
		const constraintNames = uniqueResult.map((row: any) => row.constraint_name);
		expect(constraintNames.some((name: string) => name.includes('order_id'))).toBe(true);
	});
});
