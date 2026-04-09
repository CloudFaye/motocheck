/**
 * Environment configuration accessor.
 *
 * The previous implementation terminated the whole process at import time if any
 * unrelated environment variable was missing. That made the worker bootstrap
 * brittle because report workers pulled in payment/email/telegram config
 * transitively. We keep the same `config.FOO` call sites, but make validation
 * lazy so each feature only requires the env vars it actually uses.
 */

export interface Config {
	readonly DATABASE_URL: string;
	readonly NHTSA_API_URL: string;
	readonly PAYSTACK_SECRET_KEY: string;
	readonly RESEND_API_KEY: string;
	readonly FROM_EMAIL: string;
	readonly TELEGRAM_BOT_TOKEN: string;
	readonly TELEGRAM_SECRET_TOKEN: string;
	readonly PUBLIC_BASE_URL: string;
}

function getRequiredEnv(varName: keyof Config): string {
	const value = process.env[varName];

	if (!value || value.trim() === '') {
		throw new Error(
			`Missing required environment variable: ${varName}. ` +
				`Set it in your environment or .env file. See .env.example for reference.`
		);
	}

	return value;
}

export const config: Config = {
	get DATABASE_URL() {
		return getRequiredEnv('DATABASE_URL');
	},
	get NHTSA_API_URL() {
		return getRequiredEnv('NHTSA_API_URL');
	},
	get PAYSTACK_SECRET_KEY() {
		return getRequiredEnv('PAYSTACK_SECRET_KEY');
	},
	get RESEND_API_KEY() {
		return getRequiredEnv('RESEND_API_KEY');
	},
	get FROM_EMAIL() {
		return getRequiredEnv('FROM_EMAIL');
	},
	get TELEGRAM_BOT_TOKEN() {
		return getRequiredEnv('TELEGRAM_BOT_TOKEN');
	},
	get TELEGRAM_SECRET_TOKEN() {
		return getRequiredEnv('TELEGRAM_SECRET_TOKEN');
	},
	get PUBLIC_BASE_URL() {
		return getRequiredEnv('PUBLIC_BASE_URL');
	}
};
