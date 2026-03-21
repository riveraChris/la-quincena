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

<div class="app-screen items-center justify-center bg-auth-bg px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
	<div class="w-full max-w-sm">
		<!-- Logo -->
		<div class="mb-10 text-center">
			<img src="/LaQuincena-192.png" alt="La Quincena" class="mx-auto mb-4 h-20 w-20 rounded-2xl" />
			<h1 class="text-2xl font-bold text-white">La Quincena</h1>
			<p class="mt-1 text-xs font-medium tracking-[0.2em] text-text-accent/60 uppercase">Finanzas Familiares</p>
		</div>

		<!-- Form -->
		<form onsubmit={handleLogin} class="space-y-5">
			{#if error}
				<div class="rounded-input bg-expense/10 px-4 py-3 text-sm text-expense">{error}</div>
			{/if}

			<div>
				<label for="email" class="mb-1.5 block text-sm font-medium text-text-accent/80">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					class="w-full rounded-input border border-auth-input-border bg-auth-input-bg px-4 py-3 text-white placeholder-text-muted focus:border-auth-input-focus focus:outline-none"
					placeholder="jdoe@email.com"
				/>
			</div>

			<div>
				<label for="password" class="mb-1.5 block text-sm font-medium text-text-accent/80">Contraseña</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					class="w-full rounded-input border border-auth-input-border bg-auth-input-bg px-4 py-3 text-white placeholder-text-muted focus:border-auth-input-focus focus:outline-none"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-button bg-brand py-3.5 font-semibold text-white transition-colors active:bg-brand-hover disabled:opacity-50"
			>
				{loading ? 'Entrando...' : 'Entrar'}
			</button>
		</form>

		<p class="mt-8 text-center text-sm text-text-muted">
			¿No tienes cuenta?
			<button onclick={() => goto('/register')} class="font-medium text-text-accent underline">Regístrate</button>
		</p>
	</div>
</div>
