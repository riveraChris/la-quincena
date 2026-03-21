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

<div class="flex h-[100dvh] items-center justify-center bg-[#1a2e1a] px-4">
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<img src="/LaQuincena-192.png" alt="La Quincena" class="mx-auto mb-4 h-20 w-20" />
			<h1 class="text-2xl font-bold text-white">La Quincena</h1>
			<p class="text-sm text-emerald-300/70">FINANZAS FAMILIARES</p>
		</div>

		<form onsubmit={handleLogin} class="space-y-4">
			{#if error}
				<div class="rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-300">{error}</div>
			{/if}

			<div>
				<label for="email" class="mb-1 block text-sm text-emerald-200">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					class="w-full rounded-lg border border-emerald-700 bg-emerald-900/30 px-4 py-3 text-white placeholder-emerald-600 focus:border-emerald-400 focus:outline-none"
					placeholder="jdoe@email.com"
				/>
			</div>

			<div>
				<label for="password" class="mb-1 block text-sm text-emerald-200">Contraseña</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					class="w-full rounded-lg border border-emerald-700 bg-emerald-900/30 px-4 py-3 text-white placeholder-emerald-600 focus:border-emerald-400 focus:outline-none"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-lg bg-[#3d7a4e] py-3 font-semibold text-white transition-colors hover:bg-[#4a9060] disabled:opacity-50"
			>
				{loading ? 'Entrando...' : 'Entrar'}
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-emerald-400/60">
			¿No tienes cuenta? <a href="/register" class="text-emerald-300 underline">Regístrate</a>
		</p>
	</div>
</div>
