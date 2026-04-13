import { runM1 } from '$lib/server/m1';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	const result = await runM1();
	return json(result);
};
