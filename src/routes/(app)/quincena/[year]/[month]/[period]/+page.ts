import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	const { supabase, familyId } = await parent();

	const year = parseInt(params.year);
	const month = parseInt(params.month);
	const period = parseInt(params.period);

	if (!familyId || typeof familyId !== 'string') {
		return { budgetId: null, year, month, period, incomes: [], expenses: [], savings: [], members: [], debts: [] };
	}

	// Get or create budget
	const { data: budgetId } = await supabase.rpc('get_or_create_budget', {
		p_family_id: familyId,
		p_year: year,
		p_month: month,
		p_period: period
	});

	if (!budgetId) {
		return { budgetId: null, year, month, period, incomes: [], expenses: [], savings: [], members: [], debts: [] };
	}

	// Auto-create expense_items only for current or future quincenas
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;
	const currentPeriod = now.getDate() <= 15 ? 1 : 2;
	const isCurrentOrFuture =
		year > currentYear ||
		(year === currentYear && month > currentMonth) ||
		(year === currentYear && month === currentMonth && period >= currentPeriod);

	if (isCurrentOrFuture) {
		await supabase.rpc('auto_create_quincena_expenses', {
			p_budget_id: budgetId,
			p_family_id: familyId,
			p_period: period
		});
	}

	// Load all data in parallel
	const [incomesRes, expensesRes, savingsRes, membersRes, debtsRes] = await Promise.all([
		supabase
			.from('incomes')
			.select('*, family_members!inner(display_name)')
			.eq('budget_id', budgetId)
			.order('created_at'),
		supabase
			.from('expense_items')
			.select('*, debts(name)')
			.eq('budget_id', budgetId)
			.order('created_at'),
		supabase
			.from('savings')
			.select('*')
			.eq('budget_id', budgetId)
			.order('created_at'),
		supabase
			.from('family_members')
			.select('id, display_name, color')
			.eq('family_id', familyId),
		supabase
			.from('debts')
			.select('id, name, type, our_minimum_payment, current_balance, interest_free_deadline, is_auto_recalculate')
			.eq('family_id', familyId)
			.eq('status', 'active')
	]);

	return {
		budgetId,
		year,
		month,
		period,
		incomes: incomesRes.data ?? [],
		expenses: expensesRes.data ?? [],
		savings: savingsRes.data ?? [],
		members: membersRes.data ?? [],
		debts: debtsRes.data ?? []
	};
};
