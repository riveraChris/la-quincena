<script lang="ts">
	import { goto } from '$app/navigation';

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

		goto('/');
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-[#1a2e1a] px-4">
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<img src="/LaQuincena-192.png" alt="La Quincena" class="mx-auto mb-4 h-20 w-20" />
			<h1 class="text-2xl font-bold text-white">La Quincena</h1>
			<p class="text-sm text-emerald-300/70">FINANZAS FAMILIARES</p>
		</div>

		{#if success}
			<div class="rounded-lg bg-emerald-500/20 px-4 py-6 text-center">
				<p class="text-emerald-200">¡Revisa tu email para confirmar tu cuenta!</p>
				<a href="/login" class="mt-4 inline-block text-sm text-emerald-300 underline">Ir a login</a>
			</div>
		{:else}
			<form onsubmit={handleRegister} class="space-y-4">
				{#if error}
					<div class="rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-300">{error}</div>
				{/if}

				<div>
					<label for="displayName" class="mb-1 block text-sm text-emerald-200">Nombre</label>
					<input
						id="displayName"
						type="text"
						bind:value={displayName}
						required
						class="w-full rounded-lg border border-emerald-700 bg-emerald-900/30 px-4 py-3 text-white placeholder-emerald-600 focus:border-emerald-400 focus:outline-none"
						placeholder="Christian"
					/>
				</div>

				<div>
					<label for="email" class="mb-1 block text-sm text-emerald-200">Email</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						class="w-full rounded-lg border border-emerald-700 bg-emerald-900/30 px-4 py-3 text-white placeholder-emerald-600 focus:border-emerald-400 focus:outline-none"
						placeholder="tu@email.com"
					/>
				</div>

				<div>
					<label for="password" class="mb-1 block text-sm text-emerald-200">Contraseña</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						minlength="6"
						class="w-full rounded-lg border border-emerald-700 bg-emerald-900/30 px-4 py-3 text-white placeholder-emerald-600 focus:border-emerald-400 focus:outline-none"
						placeholder="Mínimo 6 caracteres"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full rounded-lg bg-[#3d7a4e] py-3 font-semibold text-white transition-colors hover:bg-[#4a9060] disabled:opacity-50"
				>
					{loading ? 'Creando cuenta...' : 'Crear cuenta'}
				</button>
			</form>

			<p class="mt-6 text-center text-sm text-emerald-400/60">
				¿Ya tienes cuenta? <a href="/login" class="text-emerald-300 underline">Entra aquí</a>
			</p>
		{/if}
	</div>
</div>
