import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
	const { supabase, session } = await parent();

	if (!session) return { member: null, familyId: null };

	// Check if user already has a family_member record
	const { data: member } = await supabase
		.from('family_members')
		.select('id, family_id, display_name, role, color')
		.eq('user_id', session.user.id)
		.single();

	if (member) {
		return { member, familyId: member.family_id };
	}

	// First login — create family + member via RPC
	const displayName = session.user.user_metadata?.display_name ?? 'Usuario';
	const { data: familyId } = await supabase.rpc('create_family_for_user', {
		family_name: `Familia ${displayName.split(' ')[0]}`,
		member_display_name: displayName
	});

	if (!familyId) {
		return { member: null, familyId: null };
	}

	// Fetch the newly created member
	const { data: newMember } = await supabase
		.from('family_members')
		.select('id, family_id, display_name, role, color')
		.eq('user_id', session.user.id)
		.single();

	return { member: newMember, familyId: newMember?.family_id ?? familyId };
};
