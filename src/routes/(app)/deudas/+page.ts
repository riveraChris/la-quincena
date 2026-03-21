import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { supabase, familyId } = await parent();

	if (!familyId || typeof familyId !== 'string') return { debts: [] };

	const { data: debts } = await supabase
		.from('debts')
		.select('*')
		.eq('family_id', familyId)
		.eq('status', 'active')
		.order('created_at', { ascending: true });

	return { debts: debts ?? [] };
};
