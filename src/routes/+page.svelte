<script lang="ts">
	import { onMount } from 'svelte';
	import { runM1 } from '$lib/m1';

	type M1Result = Awaited<ReturnType<typeof runM1>>;

	let result = $state<M1Result | { error: string } | null>(null);
	let loading = $state(false);

	onMount(() => void refresh());

	async function refresh() {
		loading = true;
		try {
			result = await runM1();
		} catch (e) {
			result = { error: e instanceof Error ? e.message : String(e) };
		} finally {
			loading = false;
		}
	}
</script>

<div class="mx-auto max-w-3xl space-y-4 p-6">
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">SP-API MVP</h1>
	<p class="text-sm text-neutral-600 dark:text-neutral-400">
		Sandbox pricing call + Telegram when <code class="rounded bg-neutral-100 px-1 dark:bg-neutral-800">TELEGRAM_*</code> is set in
		<code class="rounded bg-neutral-100 px-1 dark:bg-neutral-800">.env.local</code>.
	</p>

	<button
		type="button"
		class="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
		onclick={() => void refresh()}
		disabled={loading}
	>
		{loading ? 'Loading…' : 'Run again'}
	</button>

	{#if result && 'ok' in result && result.ok}
		<p class="text-sm">
			Telegram:
			<span class="font-medium">{result.telegramSent ? 'sent' : 'skipped (missing env or API error)'}</span>
		</p>
	{/if}

	<details class="rounded-lg border border-neutral-200 dark:border-neutral-700">
		<summary class="cursor-pointer px-3 py-2 text-sm font-medium">Response JSON</summary>
		<pre
			class="max-h-80 overflow-auto border-t border-neutral-200 p-3 font-mono text-xs dark:border-neutral-700"
		>{JSON.stringify(result, null, 2)}</pre>
	</details>
</div>
