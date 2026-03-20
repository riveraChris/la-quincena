import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from './types/database';

export function createClient(
	fetch?: typeof globalThis.fetch,
	cookieStore?: {
		getAll: () => Array<{ name: string; value: string }>;
		setAll: (cookies: Array<{ name: string; value: string; options: Record<string, unknown> }>) => void;
	}
) {
	if (isBrowser()) {
		return createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	}

	return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: { fetch },
		cookies: {
			getAll: () => cookieStore?.getAll() ?? [],
			setAll: (cookies) => cookieStore?.setAll(cookies)
		}
	});
}
