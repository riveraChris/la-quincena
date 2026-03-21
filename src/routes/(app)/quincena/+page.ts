import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth() + 1;
	const period = now.getDate() <= 15 ? 1 : 2;

	redirect(302, `/quincena/${year}/${month}/${period}`);
};
