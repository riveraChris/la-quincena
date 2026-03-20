<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		if (!data.session) {
			goto('/login');
		}
	});
</script>

{#if data.session}
	<div class="min-h-screen bg-gray-950 text-white">
		<header class="bg-[#1a2e1a] px-4 py-4">
			<div class="mx-auto flex max-w-lg items-center justify-between">
				<h1 class="text-lg font-bold text-emerald-100">FinanzasFam</h1>
				<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold">
					{data.session.user.user_metadata?.display_name?.[0] ?? '?'}
				</div>
			</div>
		</header>

		<main class="mx-auto max-w-lg px-4 py-6">
			<p class="text-gray-400">Dashboard en construcción...</p>
		</main>
	</div>
{/if}
