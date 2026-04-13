/**
 * Client-only: calls server `/api/m1`.
 */
export async function runM1() {
	const res = await fetch('/api/m1', { method: 'POST' });
	if (!res.ok) {
		throw new Error(`M1 failed: ${res.status}`);
	}
	return res.json() as Promise<
		{ ok: true; data: unknown; telegramSent: boolean } | { ok: false }
	>;
}
