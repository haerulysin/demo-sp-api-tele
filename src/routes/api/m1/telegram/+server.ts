import { isPricingItem, sendTelegramAlert } from '$lib/server/m1';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON');
	}

	const b = body && typeof body === 'object' ? body : null;
	const item = b && 'item' in b ? b.item : null;
	if (!isPricingItem(item)) {
		throw error(400, 'Body must include { item: SpApiPricingItem }');
	}

	const botToken = b && 'botToken' in b && typeof b.botToken === 'string' ? b.botToken : undefined;
	const chatId = b && 'chatId' in b && typeof b.chatId === 'string' ? b.chatId : undefined;

	const out = await sendTelegramAlert(item, { botToken, chatId });
	return json(out);
};
