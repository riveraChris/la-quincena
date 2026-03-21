<script lang="ts">
	import { goto, invalidate } from '$app/navigation';

	let { data } = $props();

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		const { error: authError } = await data.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (authError) {
			error = authError.message;
			loading = false;
			return;
		}

		await invalidate('supabase:auth');
		goto('/');
	}
</script>

<div class="app-screen bg-surface">
	<!-- Top safe area with brand color -->
	<div class="bg-nav pt-[env(safe-area-inset-top)]"></div>

	<!-- Content -->
	<div class="flex flex-1 flex-col items-center justify-center px-6">
		<!-- Logo -->
		<div class="mb-10 text-center">
			<div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand">
				<img src="/LaQuincena-192.png" alt="La Quincena" class="h-20 w-20 rounded-2xl" />
			</div>
			<h1 class="text-2xl font-bold text-white">La Quincena</h1>
			<p class="mt-1 text-xs font-medium tracking-[0.2em] text-text-accent/50 uppercase">Finanzas Familiares</p>
		</div>

		<!-- Form Card -->
		<div class="w-full max-w-sm rounded-card bg-surface-raised p-5">
			<form onsubmit={handleLogin} class="space-y-4">
				{#if error}
					<div class="rounded-badge bg-expense/10 px-4 py-3 text-sm text-expense">{error}</div>
				{/if}

				<div>
					<label for="email" class="mb-1.5 block text-xs font-medium text-text-secondary uppercase">Email</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						class="w-full rounded-input border border-nav-border bg-surface px-4 py-3 text-white placeholder-text-muted focus:border-text-accent focus:outline-none"
						placeholder="jdoe@email.com"
					/>
				</div>

				<div>
					<label for="password" class="mb-1.5 block text-xs font-medium text-text-secondary uppercase">Contraseña</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						class="w-full rounded-input border border-nav-border bg-surface px-4 py-3 text-white placeholder-text-muted focus:border-text-accent focus:outline-none"
						placeholder="••••••••"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full rounded-button bg-brand py-3.5 font-semibold text-white active:bg-brand-hover disabled:opacity-50"
				>
					{loading ? 'Entrando...' : 'Entrar'}
				</button>
			</form>
		</div>

		<p class="mt-6 text-sm text-text-muted">
			¿No tienes cuenta?
			<button onclick={() => goto('/register')} class="font-medium text-text-accent">Regístrate</button>
		</p>
	</div>

	<!-- Bottom safe area -->
	<div class="bg-surface pb-[env(safe-area-inset-bottom)]"></div>
</div>
