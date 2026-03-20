<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	$effect(() => {
		if (!data.session) {
			goto('/login');
		}
	});

	async function handleLogout() {
		await data.supabase.auth.signOut();
		goto('/login', { invalidateAll: true });
	}
</script>

{#if data.session}
	<div class="flex h-[100dvh] flex-col bg-gray-950 text-white">
		<header class="bg-[#1a2e1a] px-4 pt-[env(safe-area-inset-top)]">
			<div class="mx-auto flex max-w-lg items-center justify-between py-4">
				<h1 class="text-lg font-bold text-emerald-100">La Quincena</h1>
				<button
					onclick={handleLogout}
					class="rounded-lg border border-emerald-700 px-3 py-1.5 text-sm text-emerald-300 transition-colors active:bg-emerald-900/30"
				>
					Salir
				</button>
			</div>
		</header>

		<main class="flex-1 overflow-y-auto px-4 pb-[env(safe-area-inset-bottom)]">
			<div class="mx-auto max-w-lg py-6">
				<p class="text-gray-400">Dashboard en construcción...</p>
			</div>
		</main>
	</div>
{/if}
