import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const health = {
		status: 'ok',
		timestamp: new Date().toISOString(),
		env: {
			hasDatabase: !!process.env.DATABASE_URL,
			hasFlutterwave: !!process.env.FLW_SECRET_KEY,
			hasResend: !!process.env.RESEND_API_KEY,
			hasR2: !!process.env.R2_ACCOUNT_ID && !!process.env.R2_ACCESS_KEY_ID,
			nodeVersion: process.version
		}
	};

	return json(health);
};
