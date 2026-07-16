import { redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/*
	The printable institution report: the same aggregates the admin home shows, plus the
	ledger's income/expense/net, laid out for paper. Neither half is fatal to the other —
	an empty ledger degrades to a notice rather than a broken page — so each endpoint's
	failure is caught and folded into a `problemMessage`, not thrown.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Freports');

	const api = authedApi(url.origin, locals.accessToken);

	const [overviewRes, ledgerRes] = await Promise.all([
		api.GET('/v1/overview'),
		api.GET('/v1/ledger/summary')
	]);

	const overview = overviewRes.data?.overview ?? null;
	const overviewError =
		overviewRes.error || !overviewRes.data
			? problemMessage(overviewRes.error, 'We couldn’t load this report. Please try again.')
			: null;

	const totals = ledgerRes.data?.totals ?? null;
	const ledgerError =
		ledgerRes.error || !ledgerRes.data
			? problemMessage(ledgerRes.error, 'We couldn’t load the money summary. Please try again.')
			: null;

	// A workspace's own numbers, and the report is deterministic: the date is stamped on
	// the server so a reprint and a screenshot agree.
	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		overview,
		overviewError,
		totals,
		ledgerError,
		generatedOn: new Date().toISOString().slice(0, 10)
	};
};
