<script lang="ts">
	import { goto, invalidate } from '$app/navigation';

	let { data } = $props();

	let displayName = $state('');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	async function handleRegister(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		const { data: authData, error: authError } = await data.supabase.auth.signUp({
			email,
			password,
			options: {
				data: { display_name: displayName }
			}
		});

		if (authError) {
			error = authError.message;
			loading = false;
			return;
		}

		if (authData.user && !authData.session) {
			success = true;
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

		{#if success}
			<!-- Success Card -->
			<div class="w-full max-w-sm rounded-card bg-surface-raised p-6 text-center">
				<svg class="mx-auto mb-3 h-12 w-12 text-text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
				</svg>
				<p class="text-lg font-semibold text-white">¡Revisa tu email!</p>
				<p class="mt-2 text-sm text-text-secondary">Confirma tu cuenta para poder entrar.</p>
				<button
					onclick={() => goto('/login')}
					class="mt-6 w-full rounded-button bg-brand py-3 font-semibold text-white active:bg-brand-hover"
				>
					Ir a login
				</button>
			</div>
		{:else}
			<!-- Form Card -->
			<div class="w-full max-w-sm rounded-card bg-surface-raised p-5">
				<form onsubmit={handleRegister} class="space-y-4">
					{#if error}
						<div class="rounded-badge bg-expense/10 px-4 py-3 text-sm text-expense">{error}</div>
					{/if}

					<div>
						<label for="displayName" class="mb-1.5 block text-xs font-medium text-text-secondary uppercase">Nombre</label>
						<input
							id="displayName"
							type="text"
							bind:value={displayName}
							required
							class="w-full rounded-input border border-nav-border bg-surface px-4 py-3 text-white placeholder-text-muted focus:border-text-accent focus:outline-none"
							placeholder="John Doe"
						/>
					</div>

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
							minlength="6"
							class="w-full rounded-input border border-nav-border bg-surface px-4 py-3 text-white placeholder-text-muted focus:border-text-accent focus:outline-none"
							placeholder="Mínimo 6 caracteres"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full rounded-button bg-brand py-3.5 font-semibold text-white active:bg-brand-hover disabled:opacity-50"
					>
						{loading ? 'Creando cuenta...' : 'Crear cuenta'}
					</button>
				</form>
			</div>

			<p class="mt-6 text-sm text-text-muted">
				¿Ya tienes cuenta?
				<button onclick={() => goto('/login')} class="font-medium text-text-accent">Entra aquí</button>
			</p>
		{/if}
	</div>

	<!-- Bottom safe area -->
	<div class="bg-surface pb-[env(safe-area-inset-bottom)]"></div>
</div>
