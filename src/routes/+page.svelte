<script lang="ts">
	import { onMount } from 'svelte';
	import { runM1, sendTelegramAlert } from '$lib/m1';

	type M1Result = Awaited<ReturnType<typeof runM1>>;

	let result = $state<M1Result | { error: string } | null>(null);
	let loading = $state(false);
	let sending = $state(false);
	let teleStatus = $state<string | null>(null);
	let tgBotToken = $state('');
	let tgChatId = $state('');

	onMount(() => void refresh());

	async function refresh() {
		teleStatus = null;
		loading = true;
		try {
			result = await runM1();
		} catch (e) {
			result = { error: e instanceof Error ? e.message : String(e) };
		} finally {
			loading = false;
		}
	}

	let firstPayloadItem = $derived.by(() => {
		if (!result || !('ok' in result) || !result.ok) return null;
		const data = result.data as { payload?: unknown[] };
		const first = data?.payload?.[0];
		return first ?? null;
	});

	async function onSendTelegram() {
		if (!firstPayloadItem) return;
		sending = true;
		teleStatus = null;
		try {
			const out = await sendTelegramAlert(firstPayloadItem, {
				botToken: tgBotToken,
				chatId: tgChatId
			});
			teleStatus = out.ok ? 'Sent to Telegram.' : `Telegram: ${out.error}`;
		} catch (e) {
			teleStatus = e instanceof Error ? e.message : String(e);
		} finally {
			sending = false;
		}
	}
</script>

<div class="mx-auto max-w-3xl space-y-4 p-6">
	<h1 class="text-xl font-semibold text-neutral-900">SP-API</h1>
	<p class="text-sm text-neutral-600">
		<strong>Run again</strong> fetches sandbox pricing. <strong>Send to Telegram</strong> uses the first ASIN row. Leave the fields empty to use
		<code class="rounded bg-neutral-100 px-1">.env.local</code>; otherwise each filled field overrides env.
	</p>

	<div class="space-y-2 rounded-lg border border-neutral-200 p-3">
		<p class="text-xs font-medium text-neutral-500">Telegram (optional overrides)</p>
		<label class="block text-sm">
			<span>Bot token</span>
			<input
				type="password"
				autocomplete="off"
				bind:value={tgBotToken}
				placeholder="from .env if empty"
				class="mt-1 w-full max-w-md rounded border border-neutral-300 bg-white px-2 py-1.5 font-mono text-sm"
			/>
		</label>
		<label class="block text-sm">
			<span class="text-neutral-600">Chat ID</span>
			<input
				type="text"
				autocomplete="off"
				bind:value={tgChatId}
				placeholder="from .env if empty"
				class="mt-1 w-full max-w-md rounded border border-neutral-300 bg-white px-2 py-1.5 font-mono text-sm"
			/>
		</label>
	</div>

	<div class="flex flex-wrap gap-2">
		<button
			type="button"
			class="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
			onclick={() => void refresh()}
			disabled={loading}
		>
			{loading ? 'Loading…' : 'Run again'}
		</button>
		<button
			type="button"
			class="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
			onclick={() => void onSendTelegram()}
			disabled={sending || !firstPayloadItem}
		>
			{sending ? 'Sending…' : 'Send to Telegram'}
		</button>
	</div>

	{#if teleStatus}
		<p class="text-sm text-neutral-700">{teleStatus}</p>
	{/if}

	<details class="rounded-lg border border-neutral-200">
		<summary class="cursor-pointer px-3 py-2 text-sm font-medium">Response JSON</summary>
		<pre
			class="max-h-80 overflow-auto border-t border-neutral-200 p-3 font-mono text-xs"
		>{JSON.stringify(result, null, 2)}</pre>
	</details>
</div>
