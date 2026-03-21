<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let { children, data } = $props();

	$effect(() => {
		if (!data.session) {
			goto('/login');
		}
	});

	async function handleLogout() {
		await data.supabase.auth.signOut();
		goto('/login');
	}

	const navItems = [
		{ href: '/', label: 'Inicio', icon: 'home' },
		{ href: '/quincena', label: 'Quincena', icon: 'calendar' },
		{ href: '/deudas', label: 'Deudas', icon: 'credit-card' },
		{ href: '/config', label: 'Config', icon: 'settings' }
	] as const;

	function isActive(href: string) {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

{#if data.session}
<div class="flex h-[100dvh] flex-col bg-gray-950 text-white">
	<header class="bg-[#1a2e1a] px-4 pt-[env(safe-area-inset-top)]">
		<div class="mx-auto flex max-w-lg items-center justify-between py-3">
			<h1 class="text-lg font-bold text-emerald-100">La Quincena</h1>
			<button
				onclick={handleLogout}
				class="rounded-lg px-3 py-1.5 text-sm text-emerald-300/70 active:text-emerald-100"
			>
				Salir
			</button>
		</div>
	</header>

	<main class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-lg px-4 py-4">
			{@render children()}
		</div>
	</main>

	<nav class="border-t border-gray-800 bg-gray-950 pb-[env(safe-area-inset-bottom)]">
		<div class="mx-auto flex max-w-lg">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.65rem] transition-colors {isActive(item.href)
						? 'text-emerald-400'
						: 'text-gray-500 active:text-gray-300'}"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						{#if item.icon === 'home'}
							<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
						{:else if item.icon === 'calendar'}
							<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
						{:else if item.icon === 'credit-card'}
							<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
						{:else if item.icon === 'settings'}
							<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
						{/if}
					</svg>
					{item.label}
				</a>
			{/each}
		</div>
	</nav>
</div>
{/if}
