import type { PageLoad } from './$types';
import { getConnectionSchema } from '$lib/service/connection-history-service';

import { error } from '@sveltejs/kit';
export const ssr = false;
export const prerender = true;
export const csr = true;
export const load: PageLoad = async ({ params,url }) => {
	const timedOutFrom = url.searchParams.has("retry") ? url.searchParams.get("retry") : undefined;
	url.searchParams.delete("retry");
	return {
		timedOutFrom : timedOutFrom
	}
};