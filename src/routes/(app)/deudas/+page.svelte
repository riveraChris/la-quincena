<script lang="ts">
	import type { Tables } from '$lib/types/database';

	let { data } = $props();

	type Debt = Tables<'debts'>;

	let debts = $state<Debt[]>([]);
	let activeTab = $state<'installment_no_interest' | 'operational' | 'fixed'>('installment_no_interest');
	let showForm = $state(false);
	let editingDebt = $state<Debt | null>(null);

	// Form state
	let formName = $state('');
	let formType = $state<Debt['type']>('installment_no_interest');
	let formBalance = $state('');
	let formMinPayment = $state('');
	let formQ1Amount = $state('');
	let formQ2Amount = $state('');
	let formDeadline = $state('');
	let formNotes = $state('');
	let formLoading = $state(false);
	let formError = $state('');

	// Keep debts in sync with load data
	const loadedDebts = $derived(data.debts as Debt[]);
	$effect(() => {
		debts = loadedDebts;
	});

	const filteredDebts = $derived(debts.filter((d) => d.type === activeTab));

	const totalActive = $derived(
		debts.reduce((sum, d) => sum + Number(d.current_balance), 0)
	);

	const tabs = [
		{ key: 'installment_no_interest', label: 'A Plazos' },
		{ key: 'operational', label: 'Operacional' },
		{ key: 'fixed', label: 'Fijos' }
	] as const;

	function openAddForm() {
		editingDebt = null;
		formName = '';
		formType = activeTab;
		formBalance = '';
		formMinPayment = '';
		formQ1Amount = '';
		formQ2Amount = '';
		formDeadline = '';
		formNotes = '';
		formError = '';
		showForm = true;
	}

	function openEditForm(debt: Debt) {
		editingDebt = debt;
		formName = debt.name;
		formType = debt.type as Debt['type'];
		formBalance = String(debt.current_balance);
		formMinPayment = String(debt.our_minimum_payment);
		formQ1Amount = debt.q1_amount ? String(debt.q1_amount) : '';
		formQ2Amount = debt.q2_amount ? String(debt.q2_amount) : '';
		formDeadline = debt.interest_free_deadline ?? '';
		formNotes = debt.notes ?? '';
		formError = '';
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		editingDebt = null;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		formLoading = true;
		formError = '';

		const q1 = parseFloat(formQ1Amount) || 0;
		const q2 = parseFloat(formQ2Amount) || 0;

		const payload = {
			name: formName,
			type: formType,
			current_balance: parseFloat(formBalance) || 0,
			our_minimum_payment: parseFloat(formMinPayment) || 0,
			q1_amount: q1,
			q2_amount: q2,
			interest_free_deadline: formType === 'installment_no_interest' && formDeadline ? formDeadline : null,
			notes: formNotes || null
		};

		if (editingDebt) {
			const { error } = await data.supabase
				.from('debts')
				.update(payload)
				.eq('id', editingDebt.id);

			if (error) {
				formError = error.message;
				formLoading = false;
				return;
			}

			debts = debts.map((d) => (d.id === editingDebt!.id ? { ...d, ...payload } : d));
		} else {
			const familyId = data.familyId;
		if (!familyId || typeof familyId !== 'string') {
			formError = 'No se encontró la familia';
			formLoading = false;
			return;
		}

		const { data: newDebt, error } = await data.supabase
				.from('debts')
				.insert({ ...payload, family_id: familyId })
				.select()
				.single();

			if (error) {
				formError = error.message;
				formLoading = false;
				return;
			}

			debts = [...debts, newDebt];
		}

		formLoading = false;
		closeForm();
	}

	async function handleDelete(debt: Debt) {
		const { error } = await data.supabase
			.from('debts')
			.delete()
			.eq('id', debt.id);

		if (!error) {
			debts = debts.filter((d) => d.id !== debt.id);
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function getMonthsRemaining(deadline: string | null): number | null {
		if (!deadline) return null;
		const target = new Date(deadline);
		const now = new Date();
		const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
		return Math.max(0, months);
	}

	function formatDeadline(deadline: string | null): string {
		if (!deadline) return '';
		const d = new Date(deadline + 'T00:00:00');
		const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
		return `${months[d.getMonth()]} ${d.getFullYear()}`;
	}

	function getUrgencyColor(deadline: string | null): string {
		if (!deadline) return 'bg-debt-healthy';
		const months = getMonthsRemaining(deadline);
		if (months === null) return 'bg-debt-healthy';
		if (months <= 1) return 'bg-debt-urgent';
		if (months <= 3) return 'bg-debt-warning';
		return 'bg-debt-purple';
	}

	function getUrgencyTextColor(deadline: string | null): string {
		if (!deadline) return 'text-debt-healthy';
		const months = getMonthsRemaining(deadline);
		if (months === null) return 'text-debt-healthy';
		if (months <= 1) return 'text-debt-urgent';
		if (months <= 3) return 'text-debt-warning';
		return 'text-debt-purple';
	}
</script>

<!-- Header -->
<div class="mb-4 text-center">
	<h2 class="text-xl font-bold text-white">Mis Deudas</h2>
	<p class="text-sm {totalActive > 0 ? 'text-debt-urgent' : 'text-text-secondary'}">
		Total activo: {formatCurrency(totalActive)} | {debts.length} deuda{debts.length !== 1 ? 's' : ''}
	</p>
</div>

<!-- Tabs -->
<div class="mb-4 flex rounded-card bg-surface-raised p-1">
	{#each tabs as tab}
		<button
			onclick={() => (activeTab = tab.key)}
			class="flex-1 rounded-badge py-2 text-xs font-semibold transition-colors
				{activeTab === tab.key ? 'bg-surface-overlay text-white' : 'text-text-muted'}"
		>
			{tab.label}
		</button>
	{/each}
</div>

<!-- Debt List -->
<div class="space-y-3">
	{#each filteredDebts as debt (debt.id)}
		{@const monthsLeft = getMonthsRemaining(debt.interest_free_deadline)}
		<button
			onclick={() => openEditForm(debt)}
			class="block w-full rounded-card bg-surface-raised text-left"
		>
			<!-- Card header -->
			<div class="flex items-center justify-between rounded-t-card {getUrgencyColor(debt.interest_free_deadline)} px-4 py-2">
				<span class="font-bold text-white">{debt.name}</span>
				{#if debt.type === 'installment_no_interest' && debt.interest_free_deadline}
					<span class="rounded-badge bg-white/20 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
						{formatDeadline(debt.interest_free_deadline)} — {monthsLeft} mes{monthsLeft !== 1 ? 'es' : ''}
					</span>
				{:else if debt.type === 'operational'}
					<span class="rounded-badge bg-white/20 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
						Operacional activo
					</span>
				{:else}
					<span class="rounded-badge bg-white/20 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
						Gasto fijo
					</span>
				{/if}
			</div>

			<!-- Card body -->
			<div class="px-4 py-3">
				{#if debt.type === 'operational'}
					<p class="text-sm text-text-secondary">Balance arrastrado:</p>
					<p class="text-xl font-bold text-white">{formatCurrency(debt.current_balance)}</p>
					<p class="mt-1 text-xs text-text-muted">
						Mín. arrastre: {formatCurrency(debt.our_minimum_payment)}/quinc.
					</p>
				{:else if debt.type === 'installment_no_interest'}
					<p class="text-sm text-text-secondary">Balance:</p>
					<p class="text-xl font-bold text-white">{formatCurrency(debt.current_balance)}</p>
					<p class="mt-1 text-xs text-text-muted">
						Mín. calculado: {formatCurrency(debt.our_minimum_payment)}/quinc.
					</p>
					<!-- Progress bar -->
					{#if debt.current_balance > 0}
						{@const pct = Math.max(0, Math.min(100, 100 - (debt.current_balance / (debt.current_balance + debt.our_minimum_payment * (monthsLeft ?? 1) * 2)) * 100))}
						<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
							<div
								class="h-full rounded-full {getUrgencyColor(debt.interest_free_deadline)}"
								style="width: {pct}%"
							></div>
						</div>
						<p class="mt-1 text-right text-[0.6rem] {getUrgencyTextColor(debt.interest_free_deadline)}">{Math.round(pct)}% pagado</p>
					{/if}
				{:else}
					<p class="text-sm text-text-secondary">Pago quincenal:</p>
					<p class="text-xl font-bold text-white">{formatCurrency(debt.our_minimum_payment)}</p>
				{/if}

				<!-- Q1/Q2 schedule -->
				{#if debt.q1_amount > 0 || debt.q2_amount > 0}
					<div class="mt-2 flex gap-2">
						{#if debt.q1_amount > 0}
							<span class="rounded-badge bg-text-accent/10 px-2 py-0.5 text-[0.6rem] font-medium text-text-accent">
								Q1: {formatCurrency(debt.q1_amount)}
							</span>
						{/if}
						{#if debt.q2_amount > 0}
							<span class="rounded-badge bg-text-accent/10 px-2 py-0.5 text-[0.6rem] font-medium text-text-accent">
								Q2: {formatCurrency(debt.q2_amount)}
							</span>
						{/if}
					</div>
				{:else}
					<p class="mt-2 text-[0.6rem] text-debt-warning/70">Sin quincena asignada</p>
				{/if}
			</div>
		</button>
	{:else}
		<p class="rounded-card bg-surface-raised p-6 text-center text-sm text-text-muted">
			{#if activeTab === 'installment_no_interest'}
				Sin deudas a plazos
			{:else if activeTab === 'operational'}
				Sin tarjetas operacionales
			{:else}
				Sin gastos fijos
			{/if}
		</p>
	{/each}
</div>

<!-- Add button -->
<button
	onclick={openAddForm}
	class="mt-4 w-full rounded-button border border-dashed border-text-muted/30 py-3 text-sm font-medium text-text-muted active:bg-surface-raised"
>
	+ Nueva deuda
</button>

<!-- Form Modal (full-screen overlay) -->
{#if showForm}
	<div class="fixed inset-0 z-50 flex flex-col bg-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
		<!-- Header -->
		<div class="flex shrink-0 items-center justify-between border-b border-nav-border bg-nav px-4 py-3">
			<button type="button" onclick={closeForm} class="text-sm font-medium text-text-muted active:text-white">
				Cancelar
			</button>
			<h3 class="text-base font-bold text-white">
				{editingDebt ? 'Editar deuda' : 'Nueva deuda'}
			</h3>
			{#if editingDebt}
				<button
					type="button"
					onclick={() => { handleDelete(editingDebt!); closeForm(); }}
					class="text-sm font-medium text-expense active:opacity-70"
				>
					Eliminar
				</button>
			{:else}
				<div class="w-14"></div>
			{/if}
		</div>

		<!-- Scrollable form -->
		<div class="flex-1 overflow-y-auto">
			<form id="debtForm" onsubmit={handleSubmit} class="mx-auto max-w-lg space-y-4 px-4 py-4">
				{#if formError}
					<div class="rounded-badge bg-expense/10 px-3 py-2 text-sm text-expense">{formError}</div>
				{/if}

				<!-- Name -->
				<div>
					<label for="debtName" class="mb-1 block text-xs font-medium text-text-secondary uppercase">Nombre</label>
					<input
						id="debtName"
						type="text"
						bind:value={formName}
						required
						class="w-full rounded-input border border-nav-border bg-surface-raised px-3 py-2.5 text-sm text-white placeholder-text-muted focus:border-text-accent focus:outline-none"
						placeholder="Ej: Capitol One, AMEX Delta"
					/>
				</div>

				<!-- Type -->
				<div>
					<label for="debtType" class="mb-1 block text-xs font-medium text-text-secondary uppercase">Tipo</label>
					<select
						id="debtType"
						bind:value={formType}
						class="w-full rounded-input border border-nav-border bg-surface-raised px-3 py-2.5 text-sm text-white focus:border-text-accent focus:outline-none"
					>
						<option value="installment_no_interest">A plazos sin intereses</option>
						<option value="operational">Tarjeta operacional</option>
						<option value="fixed">Gasto fijo</option>
					</select>
				</div>

				<!-- Balance (not for fixed) -->
				{#if formType !== 'fixed'}
					<div>
						<label for="debtBalance" class="mb-1 block text-xs font-medium text-text-secondary uppercase">
							{formType === 'operational' ? 'Balance arrastrado' : 'Balance actual'}
						</label>
						<input
							id="debtBalance"
							type="number"
							step="0.01"
							bind:value={formBalance}
							required
							class="w-full rounded-input border border-nav-border bg-surface-raised px-3 py-2.5 text-sm text-white placeholder-text-muted focus:border-text-accent focus:outline-none"
							placeholder="0.00"
						/>
					</div>
				{/if}

				<!-- Minimum payment -->
				<div>
					<label for="debtMin" class="mb-1 block text-xs font-medium text-text-secondary uppercase">
						{formType === 'fixed' ? 'Monto quincenal' : 'Pago mínimo (nuestro)'}
					</label>
					<input
						id="debtMin"
						type="number"
						step="0.01"
						bind:value={formMinPayment}
						required
						class="w-full rounded-input border border-nav-border bg-surface-raised px-3 py-2.5 text-sm text-white placeholder-text-muted focus:border-text-accent focus:outline-none"
						placeholder="0.00"
					/>
				</div>

				<!-- Quincena split -->
				<div>
					<p class="mb-1 text-xs font-medium text-text-secondary uppercase">Distribución por quincena</p>
					<div class="flex gap-2">
						<div class="flex-1">
							<div class="mb-1 text-center text-[0.6rem] text-text-muted">Q1 (días 1-15)</div>
							<input
								type="number"
								step="0.01"
								bind:value={formQ1Amount}
								class="w-full rounded-input border border-nav-border bg-surface-raised px-3 py-2.5 text-center text-sm text-white placeholder-text-muted focus:border-text-accent focus:outline-none"
								placeholder="0.00"
							/>
						</div>
						<div class="flex-1">
							<div class="mb-1 text-center text-[0.6rem] text-text-muted">Q2 (días 16-fin)</div>
							<input
								type="number"
								step="0.01"
								bind:value={formQ2Amount}
								class="w-full rounded-input border border-nav-border bg-surface-raised px-3 py-2.5 text-center text-sm text-white placeholder-text-muted focus:border-text-accent focus:outline-none"
								placeholder="0.00"
							/>
						</div>
					</div>
					{#if (parseFloat(formQ1Amount) || 0) + (parseFloat(formQ2Amount) || 0) > 0}
						<p class="mt-1 text-center text-[0.6rem] text-text-muted">
							Total mensual: ${((parseFloat(formQ1Amount) || 0) + (parseFloat(formQ2Amount) || 0)).toFixed(0)}
						</p>
					{/if}
				</div>

				<!-- Deadline (only installment) -->
				{#if formType === 'installment_no_interest'}
					<div>
						<label for="debtDeadline" class="mb-1 block text-xs font-medium text-text-secondary uppercase">Fecha límite sin intereses</label>
						<input
							id="debtDeadline"
							type="date"
							bind:value={formDeadline}
							class="w-full rounded-input border border-nav-border bg-surface-raised px-3 py-2.5 text-sm text-white focus:border-text-accent focus:outline-none"
						/>
					</div>
				{/if}

				<!-- Notes -->
				<div>
					<label for="debtNotes" class="mb-1 block text-xs font-medium text-text-secondary uppercase">Notas</label>
					<input
						id="debtNotes"
						type="text"
						bind:value={formNotes}
						class="w-full rounded-input border border-nav-border bg-surface-raised px-3 py-2.5 text-sm text-white placeholder-text-muted focus:border-text-accent focus:outline-none"
						placeholder="Opcional"
					/>
				</div>
			</form>
		</div>

		<!-- Fixed bottom button -->
		<div class="shrink-0 border-t border-nav-border bg-nav px-4 py-3">
			<button
				type="submit"
				form="debtForm"
				disabled={formLoading}
				class="mx-auto block w-full max-w-lg rounded-button bg-brand py-3 text-sm font-semibold text-white active:bg-brand-hover disabled:opacity-50"
			>
				{formLoading ? 'Guardando...' : editingDebt ? 'Guardar cambios' : 'Crear deuda'}
			</button>
		</div>
	</div>
{/if}
