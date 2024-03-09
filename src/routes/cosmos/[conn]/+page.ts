import type { PageLoad } from './$types';
import { getConnectionSchema } from '$lib/service/connection-history-service';

import { error } from '@sveltejs/kit';
export const ssr = false;
export const prerender = false;
export const csr = true;
export const load: PageLoad = async ({ params }) => {
	const conn =  await getConnectionSchema(params.conn);
	if(conn === null || conn === undefined)
			error(404, 'Not Found')

	return {
		schema : conn
	}
};