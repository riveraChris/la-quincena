<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import { navigating } from '$app/state';

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

	const displayName = $derived(
		data.member?.display_name ?? data.session?.user?.user_metadata?.display_name ?? 'Usuario'
	);
	const avatarInitial = $derived(displayName[0]?.toUpperCase() ?? '?');

	let navigatingTo = $state<string | null>(null);

	$effect(() => {
		if (!navigating.to) {
			navigatingTo = null;
		}
	});

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

	function navigateTo(href: string) {
		if (isActive(href)) return;
		navigatingTo = href;
		goto(href);
	}

	// Pull-to-refresh
	let mainEl = $state<HTMLElement | null>(null);
	let pullY = $state(0);
	let pulling = $state(false);
	let refreshing = $state(false);
	let touchStartY = 0;
	const PULL_THRESHOLD = 80;

	function onTouchStart(e: TouchEvent) {
		if (mainEl && mainEl.scrollTop === 0 && !refreshing) {
			touchStartY = e.touches[0].clientY;
			pulling = true;
		}
	}

	function onTouchMove(e: TouchEvent) {
		if (!pulling || refreshing) return;
		const deltaY = e.touches[0].clientY - touchStartY;
		if (deltaY > 0) {
			pullY = Math.min(deltaY * 0.5, 120);
		} else {
			pullY = 0;
			pulling = false;
		}
	}

	async function onTouchEnd() {
		if (!pulling) return;
		if (pullY >= PULL_THRESHOLD) {
			refreshing = true;
			pullY = 50;
			await invalidateAll();
			refreshing = false;
		}
		pullY = 0;
		pulling = false;
	}
</script>

{#if data.session}
	<div class="app-screen bg-nav text-text-primary">
		<!-- Header -->
		<header class="shrink-0 bg-nav pt-[env(safe-area-inset-top)]">
			<div class="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
				<h1 class="text-lg font-bold text-white">La Quincena</h1>
				<button
					onclick={handleLogout}
					class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white active:opacity-70"
					title="Salir"
				>
					{avatarInitial}
				</button>
			</div>
		</header>

		<!-- Content -->
		<main
			bind:this={mainEl}
			ontouchstart={onTouchStart}
			ontouchmove={onTouchMove}
			ontouchend={onTouchEnd}
			class="scroll-area min-h-0 flex-1 bg-surface"
		>
			<!-- Pull-to-refresh indicator -->
			{#if pullY > 0}
				<div
					class="flex items-center justify-center overflow-hidden bg-surface transition-[height]"
					style="height: {pullY}px"
				>
					{#if refreshing}
						<svg class="h-5 w-5 animate-spin text-text-accent" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
						</svg>
					{:else}
						<svg
							class="h-5 w-5 text-text-muted transition-transform"
							style="transform: rotate({Math.min(pullY / PULL_THRESHOLD, 1) * 180}deg); opacity: {Math.min(pullY / PULL_THRESHOLD, 1)}"
							fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
						</svg>
					{/if}
				</div>
			{/if}

			<div class="mx-auto max-w-lg px-4 py-4">
				{@render children()}
			</div>
		</main>

		<!-- Loading bar -->
		{#if navigating.to}
			<div class="h-0.5 w-full overflow-hidden bg-surface">
				<div class="h-full animate-pulse bg-text-accent" style="width: 100%"></div>
			</div>
		{/if}

		<!-- Bottom Nav -->
		<nav class="shrink-0 border-t border-nav-border bg-nav pb-[env(safe-area-inset-bottom)]">
			<div class="mx-auto flex max-w-lg">
				{#each navItems as item}
					{@const loading = navigatingTo === item.href}
					<button
						onclick={() => navigateTo(item.href)}
						class="flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium transition-colors
							{isActive(item.href) ? 'text-text-accent' : loading ? 'text-text-accent/50' : 'text-text-muted active:text-text-secondary'}"
					>
						{#if loading}
							<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
						{:else}
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
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
						{/if}
						{item.label}
					</button>
				{/each}
			</div>
		</nav>
	</div>
{/if}
