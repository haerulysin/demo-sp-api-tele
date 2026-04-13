/**
 * Client-only: SP-API run + Telegram send (server holds secrets).
 */
export async function runM1() {
	const res = await fetch('/api/m1', { method: 'POST' });
	if (!res.ok) {
		throw new Error(`M1 failed: ${res.status}`);
	}
	return res.json() as Promise<{ ok: true; data: unknown } | { ok: false }>;
}

export async function sendTelegramAlert(
	item: unknown,
	options?: { botToken?: string; chatId?: string }
) {
	const botToken = options?.botToken?.trim() || undefined;
	const chatId = options?.chatId?.trim() || undefined;
	const res = await fetch('/api/m1/telegram', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ item, botToken, chatId })
	});
	if (!res.ok) {
		throw new Error(`Telegram API failed: ${res.status}`);
	}
	return res.json() as Promise<{ ok: true } | { ok: false; error: string }>;
}
