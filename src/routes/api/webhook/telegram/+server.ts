import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config } from '$lib/server/config';
import { bot } from '../../../../telegram-bot';

export const POST: RequestHandler = async ({ request }) => {
	const secretToken = request.headers.get('x-telegram-bot-api-secret-token');

	if (secretToken !== config.TELEGRAM_SECRET_TOKEN) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const update = await request.json();

	try {
		await bot.handleUpdate(update);
	} catch {
		// Silently fail - webhook will retry
	}

	return json({ ok: true });
};
