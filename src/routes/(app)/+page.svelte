<script lang="ts">
	let { data } = $props();

	const displayName = $derived(
		data.session?.user?.user_metadata?.display_name?.split(' ')[0] ?? 'Usuario'
	);
</script>

<!-- Greeting -->
<div class="mb-4 rounded-card bg-surface-raised p-4">
	<h2 class="text-xl font-bold text-white">Hola, {displayName}</h2>
	<p class="text-sm text-text-secondary">Marzo 2026 | Quincena 1</p>
</div>

<!-- Stats Grid -->
<div class="mb-4 grid grid-cols-2 gap-3">
	<div class="rounded-card bg-[#1a2555] p-3">
		<p class="text-[0.65rem] font-medium tracking-wide text-blue-300/70 uppercase">Total Budget</p>
		<p class="text-2xl font-bold text-white">--</p>
		<p class="text-[0.65rem] text-text-muted">Chris + Ary</p>
	</div>
	<div class="rounded-card bg-[#1a3a2a] p-3">
		<p class="text-[0.65rem] font-medium tracking-wide text-income/70 uppercase">Sobrante</p>
		<p class="text-2xl font-bold text-income">--</p>
		<p class="text-[0.65rem] text-text-muted">este mes</p>
	</div>
</div>

<div class="mb-6 rounded-card bg-[#2a1a40] p-3">
	<div class="flex items-center justify-between">
		<div>
			<p class="text-[0.65rem] font-medium tracking-wide text-debt-purple/70 uppercase">Deuda Total Activa</p>
			<p class="text-2xl font-bold text-debt-purple">--</p>
		</div>
		<p class="text-[0.65rem] text-text-muted">0 deudas activas</p>
	</div>
</div>

<!-- Alertas -->
<h3 class="mb-2 text-sm font-semibold text-text-secondary">Alertas</h3>
<div class="mb-6 space-y-2">
	<p class="rounded-card bg-surface-raised p-4 text-center text-sm text-text-muted">
		Sin alertas pendientes
	</p>
</div>

<!-- Deudas en progreso -->
<h3 class="mb-2 text-sm font-semibold text-text-secondary">Deudas en progreso</h3>
<div class="space-y-2">
	<p class="rounded-card bg-surface-raised p-4 text-center text-sm text-text-muted">
		Sin deudas registradas
	</p>
</div>
