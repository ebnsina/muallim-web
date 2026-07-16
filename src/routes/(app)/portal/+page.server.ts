import { error, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { isoDaysAgo, isoToday } from '$lib/portal';
import type { PageServerLoad } from './$types';

// The parent-and-pupil portal: a guardian or student signs in and sees the day of
// the child they are tied to — attendance, fees, memorisation. Which student they
// may read is the API's decision, not a query parameter: `?child` only picks among
// the children the server already says are theirs.
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fportal');

	const api = authedApi(url.origin, locals.accessToken);

	const childrenRes = await api.GET('/v1/portal/children');
	if (childrenRes.error) {
		error(502, problemMessage(childrenRes.error, 'Your children could not be loaded.'));
	}
	const children = childrenRes.data.children ?? [];

	// The requested child, but only if it is one of theirs — otherwise the first.
	const requested = url.searchParams.get('child');
	const selected =
		children.find((c) => c.id === requested)?.id ?? children[0]?.id ?? null;

	setHeaders({ 'cache-control': 'private, no-store' });

	if (!selected) {
		return { children, selectedId: null, attendance: null, ledger: null, hifz: null };
	}

	const from = isoDaysAgo(30);
	const to = isoToday();
	const [attendanceRes, feesRes, hifzRes] = await Promise.all([
		api.GET('/v1/portal/children/{id}/attendance', {
			params: { path: { id: selected }, query: { from, to } }
		}),
		api.GET('/v1/portal/children/{id}/fees', { params: { path: { id: selected } } }),
		api.GET('/v1/portal/children/{id}/hifz', {
			params: { path: { id: selected }, query: { days: 30 } }
		})
	]);

	return {
		children,
		selectedId: selected,
		attendance: attendanceRes.data ?? null,
		ledger: feesRes.data?.ledger ?? null,
		hifz: hifzRes.data?.summary ?? null
	};
};
