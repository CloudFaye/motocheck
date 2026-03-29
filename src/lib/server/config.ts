/**
 * Environment configuration loader and validator
 * Validates all required environment variables at application startup
 * Exits with descriptive error if any required variable is missing
 */

interface Config {
	DATABASE_URL: string;
	NHTSA_API_URL: string;
	PAYSTACK_SECRET_KEY: string;
	RESEND_API_KEY: string;
	FROM_EMAIL: string;
	R2_ENDPOINT: string;
	R2_ACCESS_KEY_ID: string;
	R2_SECRET_ACCESS_KEY: string;
	R2_BUCKET_NAME: string;
	TELEGRAM_BOT_TOKEN: string;
	TELEGRAM_SECRET_TOKEN: string;
	PUBLIC_BASE_URL: string;
}

const requiredEnvVars: (keyof Config)[] = [
	'DATABASE_URL',
	'NHTSA_API_URL',
	'PAYSTACK_SECRET_KEY',
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

function loadConfig(): Config {
	const missing: string[] = [];

	for (const varName of requiredEnvVars) {
		const value = process.env[varName];
		if (!value || value.trim() === '') {
			missing.push(varName);
		}
	}

	if (missing.length > 0) {
		console.error('❌ Configuration Error: Missing required environment variables:');
		missing.forEach((varName) => {
			console.error(`   - ${varName}`);
		});
		console.error('\nPlease set all required environment variables in your .env file.');
		console.error('See .env.example for reference.');
		process.exit(1);
	}

	return {
		DATABASE_URL: process.env.DATABASE_URL!,
		NHTSA_API_URL: process.env.NHTSA_API_URL!,
		PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY!,
		RESEND_API_KEY: process.env.RESEND_API_KEY!,
		FROM_EMAIL: process.env.FROM_EMAIL!,
		R2_ENDPOINT: process.env.R2_ENDPOINT!,
		R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID!,
		R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY!,
		R2_BUCKET_NAME: process.env.R2_BUCKET_NAME!,
		TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN!,
		TELEGRAM_SECRET_TOKEN: process.env.TELEGRAM_SECRET_TOKEN!,
		PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL!
	};
}

export const config = loadConfig();
