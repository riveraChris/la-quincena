<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

	// Reactive data from load
	const year = $derived(data.year);
	const month = $derived(data.month);
	const period = $derived(data.period);
	const budgetId = $derived(data.budgetId);
	const members = $derived(data.members);
	const debts = $derived(data.debts);

	let incomes = $state<typeof data.incomes>([]);
	let expenses = $state<typeof data.expenses>([]);
	let savings = $state<typeof data.savings>([]);

	const loadedIncomes = $derived(data.incomes);
	const loadedExpenses = $derived(data.expenses);
	const loadedSavings = $derived(data.savings);

	$effect(() => { incomes = loadedIncomes; });
	$effect(() => { expenses = loadedExpenses; });
	$effect(() => { savings = loadedSavings; });

	// Calculations
	const totalIncome = $derived(incomes.reduce((s, i) => s + Number(i.amount), 0));
	const totalExpenses = $derived(expenses.reduce((s, e) => s + Number(e.amount), 0));
	const totalSavings = $derived(savings.reduce((s, sv) => s + Number(sv.amount), 0));
	const sobrante = $derived(totalIncome + totalExpenses + totalSavings);

	// Navigation
	function navigatePrev() {
		let y = year, m = month, p = period;
		if (p === 2) { p = 1; }
		else { p = 2; m--; if (m < 1) { m = 12; y--; } }
		goto(`/quincena/${y}/${m}/${p}`);
	}

	function navigateNext() {
		let y = year, m = month, p = period;
		if (p === 1) { p = 2; }
		else { p = 1; m++; if (m > 12) { m = 1; y++; } }
		goto(`/quincena/${y}/${m}/${p}`);
	}

	function togglePeriod() {
		const p = period === 1 ? 2 : 1;
		goto(`/quincena/${year}/${month}/${p}`);
	}

	// Form modals
	let showIncomeForm = $state(false);
	let showExpenseForm = $state(false);
	let showSavingsForm = $state(false);

	// Income form
	let incomeMemberId = $state('');
	let incomeAmount = $state('');
	let incomeType = $state<'salary' | 'bonus'>('salary');
	let incomeLabel = $state('');
	let incomeLoading = $state(false);

	// Expense form
	let expenseName = $state('');
	let expenseAmount = $state('');
	let expenseCategory = $state<'fixed' | 'operational_card' | 'installment'>('fixed');
	let expenseDebtId = $state<string | null>(null);
	let expenseLoading = $state(false);

	// Savings form
	let savingsAmount = $state('');
	let savingsLabel = $state('');
	let savingsLoading = $state(false);

	function openIncomeForm() {
		incomeMemberId = members[0]?.id ?? '';
		incomeAmount = '';
		incomeType = 'salary';
		incomeLabel = '';
		showIncomeForm = true;
	}

	function openExpenseForm() {
		expenseName = '';
		expenseAmount = '';
		expenseCategory = 'fixed';
		expenseDebtId = null;
		showExpenseForm = true;
	}

	function openSavingsForm() {
		savingsAmount = '';
		savingsLabel = '';
		showSavingsForm = true;
	}

	async function addIncome(e: Event) {
		e.preventDefault();
		if (!budgetId) return;
		incomeLoading = true;

		const { data: newIncome, error } = await data.supabase
			.from('incomes')
			.insert({
				budget_id: budgetId,
				member_id: incomeMemberId,
				amount: parseFloat(incomeAmount),
				type: incomeType,
				label: incomeLabel || null
			})
			.select('*, family_members!inner(display_name)')
			.single();

		if (!error && newIncome) {
			incomes = [...incomes, newIncome];
		}
		incomeLoading = false;
		showIncomeForm = false;
	}

	async function addExpense(e: Event) {
		e.preventDefault();
		if (!budgetId) return;
		expenseLoading = true;

		// Expenses stored as negative
		const amount = -(Math.abs(parseFloat(expenseAmount)));

		const { data: newExpense, error } = await data.supabase
			.from('expense_items')
			.insert({
				budget_id: budgetId,
				name: expenseName,
				amount,
				category: expenseCategory,
				debt_id: expenseDebtId
			})
			.select('*, debts(name)')
			.single();

		if (!error && newExpense) {
			expenses = [...expenses, newExpense];
		}
		expenseLoading = false;
		showExpenseForm = false;
	}

	async function addSavings(e: Event) {
		e.preventDefault();
		if (!budgetId) return;
		savingsLoading = true;

		// Savings stored as negative
		const amount = -(Math.abs(parseFloat(savingsAmount)));

		const { data: newSaving, error } = await data.supabase
			.from('savings')
			.insert({
				budget_id: budgetId,
				amount,
				label: savingsLabel || null
			})
			.select()
			.single();

		if (!error && newSaving) {
			savings = [...savings, newSaving];
		}
		savingsLoading = false;
		showSavingsForm = false;
	}

	async function togglePaid(expense: typeof expenses[0]) {
		const newPaid = !expense.is_paid;
		const { error } = await data.supabase
			.from('expense_items')
			.update({
				is_paid: newPaid,
				paid_at: newPaid ? new Date().toISOString() : null
			})
			.eq('id', expense.id);

		if (!error) {
			expenses = expenses.map((ex) =>
				ex.id === expense.id
					? { ...ex, is_paid: newPaid, paid_at: newPaid ? new Date().toISOString() : null }
					: ex
			);
		}
	}

	async function deleteIncome(id: string) {
		const { error } = await data.supabase.from('incomes').delete().eq('id', id);
		if (!error) incomes = incomes.filter((i) => i.id !== id);
	}

	async function deleteExpense(id: string) {
		const { error } = await data.supabase.from('expense_items').delete().eq('id', id);
		if (!error) expenses = expenses.filter((e) => e.id !== id);
	}

	async function deleteSaving(id: string) {
		const { error } = await data.supabase.from('savings').delete().eq('id', id);
		if (!error) savings = savings.filter((s) => s.id !== id);
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(Math.abs(amount));
	}
</script>

<!-- Header: Month nav + Period toggle -->
<div class="mb-4 flex items-center justify-between">
	<button onclick={navigatePrev} class="px-2 py-1 text-sm font-medium text-text-accent active:opacity-70">
		&lt; {monthNames[(month - 2 + 12) % 12].slice(0, 3)}
	</button>
	<div class="text-center">
		<h2 class="text-xl font-bold text-white">Quincena {period}</h2>
		<p class="text-xs text-text-secondary">{monthNames[month - 1]} {year}</p>
	</div>
	<button onclick={togglePeriod} class="rounded-badge bg-brand px-3 py-1 text-xs font-bold text-white active:bg-brand-hover">
		Q{period === 1 ? 2 : 1} &gt;
	</button>
</div>

<!-- INGRESOS -->
<div class="mb-4">
	<p class="mb-2 text-[0.65rem] font-semibold tracking-wider text-income/70 uppercase">Ingresos</p>
	<div class="space-y-2">
		{#each incomes as income (income.id)}
			<div class="flex items-center justify-between rounded-card border border-income/30 bg-income/10 px-4 py-2.5">
				<div>
					<p class="text-sm font-medium text-white">
						{income.type === 'salary' ? 'Salario' : income.label ?? 'Bono'} {income.family_members?.display_name?.split(' ')[0] ?? ''}
					</p>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-sm font-bold text-income">{formatCurrency(income.amount)}</span>
					<button onclick={() => deleteIncome(income.id)} class="text-text-muted active:text-expense" aria-label="Eliminar ingreso">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		{/each}
	</div>
	<button
		onclick={openIncomeForm}
		class="mt-2 w-full rounded-card border border-dashed border-income/20 py-2 text-xs font-medium text-income/50 active:bg-income/5"
	>
		+ Agregar ingreso
	</button>
</div>

<!-- GASTOS -->
<div class="mb-4">
	<p class="mb-2 text-[0.65rem] font-semibold tracking-wider text-text-secondary uppercase">Gastos</p>
	<div class="space-y-2">
		{#each expenses as expense (expense.id)}
			<div class="flex items-center gap-3 rounded-card bg-surface-raised px-3 py-2.5">
				<!-- Checkbox -->
				<button
					onclick={() => togglePaid(expense)}
					class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2
						{expense.is_paid
							? 'border-income bg-income'
							: 'border-text-muted/40'}"
				>
					{#if expense.is_paid}
						<svg class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
							<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
						</svg>
					{/if}
				</button>

				<!-- Name + debt tag -->
				<div class="flex-1">
					<div class="flex items-center gap-2">
						<span class="text-sm {expense.is_paid ? 'text-text-muted line-through' : 'text-white'}">{expense.name}</span>
						{#if expense.debt_id}
							<span class="rounded-badge bg-expense/20 px-1.5 py-0.5 text-[0.6rem] font-semibold text-expense">Deuda</span>
						{/if}
					</div>
				</div>

				<!-- Amount -->
				<span class="text-sm font-medium text-expense">-{formatCurrency(expense.amount)}</span>

				<button onclick={() => deleteExpense(expense.id)} class="text-text-muted active:text-expense" aria-label="Eliminar gasto">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		{/each}
	</div>
	<button
		onclick={openExpenseForm}
		class="mt-2 w-full rounded-card border border-dashed border-text-muted/20 py-2 text-xs font-medium text-text-muted active:bg-surface-raised"
	>
		+ Agregar gasto
	</button>
</div>

<!-- AHORROS -->
<div class="mb-4">
	<p class="mb-2 text-[0.65rem] font-semibold tracking-wider text-savings/70 uppercase">Ahorros</p>
	<div class="space-y-2">
		{#each savings as saving (saving.id)}
			<div class="flex items-center justify-between rounded-card border border-savings/30 bg-savings/10 px-4 py-2.5">
				<span class="text-sm font-medium text-white">{saving.label ?? 'Ahorro'}</span>
				<div class="flex items-center gap-2">
					<span class="text-sm font-bold text-savings">-{formatCurrency(saving.amount)}</span>
					<button onclick={() => deleteSaving(saving.id)} class="text-text-muted active:text-expense" aria-label="Eliminar ahorro">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		{/each}
	</div>
	<button
		onclick={openSavingsForm}
		class="mt-2 w-full rounded-card border border-dashed border-savings/20 py-2 text-xs font-medium text-savings/50 active:bg-savings/5"
	>
		+ Agregar ahorro
	</button>
</div>

<!-- SOBRANTE -->
<div class="mb-6 rounded-card bg-[#1a3a2a] p-4 text-center">
	<p class="text-[0.65rem] font-semibold tracking-wider text-income/70 uppercase">Sobrante Q{period}</p>
	<p class="text-3xl font-bold {sobrante >= 0 ? 'text-income' : 'text-expense'}">
		{sobrante >= 0 ? '' : '-'}{formatCurrency(sobrante)}
	</p>
</div>

<!-- SEPARACIÓN DE PORCIENTOS -->
{#if members.length > 0 && totalIncome > 0}
	<div class="mb-4">
		<p class="mb-3 text-[0.65rem] font-semibold tracking-wider text-text-secondary uppercase">Separación de Porcientos</p>
		{#each members as member (member.id)}
			{@const memberIncomes = incomes.filter((i) => i.member_id === member.id)}
			{@const memberTotal = memberIncomes.reduce((s, i) => s + Number(i.amount), 0)}
			{#if memberTotal > 0}
				<div class="mb-3 rounded-card bg-surface-raised p-3">
					<p class="mb-2 text-xs font-semibold text-white">{member.display_name}</p>
					<div class="space-y-1.5">
						<div class="flex items-center gap-2">
							<div class="h-2 flex-1 overflow-hidden rounded-full bg-surface">
								<div class="h-full rounded-full bg-expense" style="width: 23%"></div>
							</div>
							<span class="w-24 text-right text-[0.6rem] text-text-muted">Deudas 23% {formatCurrency(memberTotal * 0.23)}</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="h-2 flex-1 overflow-hidden rounded-full bg-surface">
								<div class="h-full rounded-full bg-debt-healthy" style="width: 62%"></div>
							</div>
							<span class="w-24 text-right text-[0.6rem] text-text-muted">Gastos 62% {formatCurrency(memberTotal * 0.62)}</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="h-2 flex-1 overflow-hidden rounded-full bg-surface">
								<div class="h-full rounded-full bg-income" style="width: 15%"></div>
							</div>
							<span class="w-24 text-right text-[0.6rem] text-text-muted">Ahorros 15% {formatCurrency(memberTotal * 0.15)}</span>
						</div>
					</div>
				</div>
			{/if}
		{/each}
	</div>
{/if}

<!-- ===== MODALS ===== -->

<!-- Income Form -->
{#if showIncomeForm}
	<button onclick={() => (showIncomeForm = false)} class="fixed inset-0 z-40 bg-black/60" aria-label="Cerrar"></button>
	<div class="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-surface-raised pb-[env(safe-area-inset-bottom)]">
		<div class="mx-auto max-w-lg px-4 pt-4 pb-4">
			<div class="mx-auto mb-4 h-1 w-10 rounded-full bg-text-muted/30"></div>
			<h3 class="mb-4 text-lg font-bold text-white">Agregar ingreso</h3>
			<form onsubmit={addIncome} class="space-y-3">
				<div>
					<label for="incomeMember" class="mb-1 block text-xs font-medium text-text-secondary uppercase">Miembro</label>
					<select id="incomeMember" bind:value={incomeMemberId} class="w-full rounded-input border border-nav-border bg-surface px-3 py-2.5 text-sm text-white focus:border-text-accent focus:outline-none">
						{#each members as m}
							<option value={m.id}>{m.display_name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="incomeType" class="mb-1 block text-xs font-medium text-text-secondary uppercase">Tipo</label>
					<select id="incomeType" bind:value={incomeType} class="w-full rounded-input border border-nav-border bg-surface px-3 py-2.5 text-sm text-white focus:border-text-accent focus:outline-none">
						<option value="salary">Salario</option>
						<option value="bonus">Bono</option>
					</select>
				</div>
				{#if incomeType === 'bonus'}
					<div>
						<label for="incomeLabel" class="mb-1 block text-xs font-medium text-text-secondary uppercase">Descripción</label>
						<input id="incomeLabel" type="text" bind:value={incomeLabel} class="w-full rounded-input border border-nav-border bg-surface px-3 py-2.5 text-sm text-white placeholder-text-muted focus:border-text-accent focus:outline-none" placeholder="Ej: Bono trimestral" />
					</div>
				{/if}
				<div>
					<label for="incomeAmount" class="mb-1 block text-xs font-medium text-text-secondary uppercase">Monto</label>
					<input id="incomeAmount" type="number" step="0.01" bind:value={incomeAmount} required class="w-full rounded-input border border-nav-border bg-surface px-3 py-2.5 text-sm text-white placeholder-text-muted focus:border-text-accent focus:outline-none" placeholder="0.00" />
				</div>
				<div class="flex gap-2 pt-2">
					<button type="button" onclick={() => (showIncomeForm = false)} class="flex-1 rounded-button bg-surface py-3 text-sm font-semibold text-text-secondary active:bg-surface-overlay">Cancelar</button>
					<button type="submit" disabled={incomeLoading} class="flex-1 rounded-button bg-income py-3 text-sm font-semibold text-white active:opacity-80 disabled:opacity-50">{incomeLoading ? 'Guardando...' : 'Agregar'}</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Expense Form -->
{#if showExpenseForm}
	<button onclick={() => (showExpenseForm = false)} class="fixed inset-0 z-40 bg-black/60" aria-label="Cerrar"></button>
	<div class="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-surface-raised pb-[env(safe-area-inset-bottom)]">
		<div class="mx-auto max-w-lg px-4 pt-4 pb-4">
			<div class="mx-auto mb-4 h-1 w-10 rounded-full bg-text-muted/30"></div>
			<h3 class="mb-4 text-lg font-bold text-white">Agregar gasto</h3>
			<form onsubmit={addExpense} class="space-y-3">
				<div>
					<label for="expName" class="mb-1 block text-xs font-medium text-text-secondary uppercase">Nombre</label>
					<input id="expName" type="text" bind:value={expenseName} required class="w-full rounded-input border border-nav-border bg-surface px-3 py-2.5 text-sm text-white placeholder-text-muted focus:border-text-accent focus:outline-none" placeholder="Ej: Luma, Sunrun" />
				</div>
				<div>
					<label for="expCategory" class="mb-1 block text-xs font-medium text-text-secondary uppercase">Categoría</label>
					<select id="expCategory" bind:value={expenseCategory} class="w-full rounded-input border border-nav-border bg-surface px-3 py-2.5 text-sm text-white focus:border-text-accent focus:outline-none">
						<option value="fixed">Gasto fijo</option>
						<option value="operational_card">Tarjeta operacional</option>
						<option value="installment">Pago a deuda</option>
					</select>
				</div>
				{#if expenseCategory !== 'fixed' && debts.length > 0}
					<div>
						<label for="expDebt" class="mb-1 block text-xs font-medium text-text-secondary uppercase">Vincular a deuda</label>
						<select id="expDebt" bind:value={expenseDebtId} class="w-full rounded-input border border-nav-border bg-surface px-3 py-2.5 text-sm text-white focus:border-text-accent focus:outline-none">
							<option value={null}>Sin vincular</option>
							{#each debts as debt}
								<option value={debt.id}>{debt.name}</option>
							{/each}
						</select>
					</div>
				{/if}
				<div>
					<label for="expAmount" class="mb-1 block text-xs font-medium text-text-secondary uppercase">Monto</label>
					<input id="expAmount" type="number" step="0.01" bind:value={expenseAmount} required class="w-full rounded-input border border-nav-border bg-surface px-3 py-2.5 text-sm text-white placeholder-text-muted focus:border-text-accent focus:outline-none" placeholder="0.00" />
				</div>
				<div class="flex gap-2 pt-2">
					<button type="button" onclick={() => (showExpenseForm = false)} class="flex-1 rounded-button bg-surface py-3 text-sm font-semibold text-text-secondary active:bg-surface-overlay">Cancelar</button>
					<button type="submit" disabled={expenseLoading} class="flex-1 rounded-button bg-brand py-3 text-sm font-semibold text-white active:bg-brand-hover disabled:opacity-50">{expenseLoading ? 'Guardando...' : 'Agregar'}</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Savings Form -->
{#if showSavingsForm}
	<button onclick={() => (showSavingsForm = false)} class="fixed inset-0 z-40 bg-black/60" aria-label="Cerrar"></button>
	<div class="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-surface-raised pb-[env(safe-area-inset-bottom)]">
		<div class="mx-auto max-w-lg px-4 pt-4 pb-4">
			<div class="mx-auto mb-4 h-1 w-10 rounded-full bg-text-muted/30"></div>
			<h3 class="mb-4 text-lg font-bold text-white">Agregar ahorro</h3>
			<form onsubmit={addSavings} class="space-y-3">
				<div>
					<label for="savLabel" class="mb-1 block text-xs font-medium text-text-secondary uppercase">Descripción</label>
					<input id="savLabel" type="text" bind:value={savingsLabel} class="w-full rounded-input border border-nav-border bg-surface px-3 py-2.5 text-sm text-white placeholder-text-muted focus:border-text-accent focus:outline-none" placeholder="Ej: Ahorro quincenal" />
				</div>
				<div>
					<label for="savAmount" class="mb-1 block text-xs font-medium text-text-secondary uppercase">Monto</label>
					<input id="savAmount" type="number" step="0.01" bind:value={savingsAmount} required class="w-full rounded-input border border-nav-border bg-surface px-3 py-2.5 text-sm text-white placeholder-text-muted focus:border-text-accent focus:outline-none" placeholder="0.00" />
				</div>
				<div class="flex gap-2 pt-2">
					<button type="button" onclick={() => (showSavingsForm = false)} class="flex-1 rounded-button bg-surface py-3 text-sm font-semibold text-text-secondary active:bg-surface-overlay">Cancelar</button>
					<button type="submit" disabled={savingsLoading} class="flex-1 rounded-button bg-savings py-3 text-sm font-semibold text-white active:opacity-80 disabled:opacity-50">{savingsLoading ? 'Guardando...' : 'Agregar'}</button>
				</div>
			</form>
		</div>
	</div>
{/if}
