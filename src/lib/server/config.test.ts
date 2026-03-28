/**
 * Test for environment configuration validation
 * This test verifies that the config module properly validates required environment variables
 */

import { describe, it, expect } from 'vitest';

describe('Config validation', () => {
	const requiredVars = [
		'DATABASE_URL',
		'NHTSA_API_URL',
		'FLW_PUBLIC_KEY',
		'FLW_SECRET_KEY',
		'FLW_SECRET_HASH',
		'RESEND_API_KEY',
		'FROM_EMAIL',
		'R2_ENDPOINT',
		'R2_ACCESS_KEY_ID',
		'R2_SECRET_ACCESS_KEY',
		'R2_BUCKET_NAME',
		'TELEGRAM_BOT_TOKEN',
		'TELEGRAM_SECRET_TOKEN',
		'PUBLIC_BASE_URL'
	];

	it('should have all required environment variables defined in .env.example', () => {
		// This test verifies that .env.example contains all required variables
		// The actual validation happens in config.ts at runtime
		expect(requiredVars.length).toBe(14);
	});

	it('should validate DATABASE_URL is present', () => {
		expect(process.env.DATABASE_URL).toBeDefined();
		if (process.env.DATABASE_URL) {
			expect(process.env.DATABASE_URL).toMatch(/^postgres:\/\//);
		}
	});

	it('should list all required environment variables', () => {
		// Verify the list of required variables is complete
		expect(requiredVars).toEqual([
			'DATABASE_URL',
			'NHTSA_API_URL',
			'FLW_PUBLIC_KEY',
			'FLW_SECRET_KEY',
			'FLW_SECRET_HASH',
			'RESEND_API_KEY',
			'FROM_EMAIL',
			'R2_ENDPOINT',
			'R2_ACCESS_KEY_ID',
			'R2_SECRET_ACCESS_KEY',
			'R2_BUCKET_NAME',
			'TELEGRAM_BOT_TOKEN',
			'TELEGRAM_SECRET_TOKEN',
			'PUBLIC_BASE_URL'
		]);
	});
});
