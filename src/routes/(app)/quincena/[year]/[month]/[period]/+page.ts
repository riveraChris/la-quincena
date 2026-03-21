import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	const { supabase, familyId, member } = await parent();

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
			.select('id, name, type, our_minimum_payment')
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
