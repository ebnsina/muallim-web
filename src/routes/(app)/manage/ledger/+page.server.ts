import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import {
	DEFAULT_CURRENCY,
	KINDS,
	MINOR_PER_MAJOR,
	categorySchema,
	entrySchema,
	type Kind
} from '$lib/ledger';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of entries. muallim-api caps the rest behind a cursor. */
const PAGE_SIZE = 50;

/** A blank filter is "either kind"; anything else must be one the API knows. */
function kindFilter(raw: string | null): Kind | '' {
	return KINDS.includes(raw as Kind) ? (raw as Kind) : '';
}

/** A blank date box is "no bound", not a filter. */
function dateFilter(raw: string | null): string {
	const value = (raw ?? '').trim();
	return value && !Number.isNaN(Date.parse(value)) ? value : '';
}

/*
	The accounts desk: the school's own income and expense books, kept apart from the
	fees a student is billed. The summary totals the entries by currency, the categories
	are the buckets an entry lands in, and the entries are every booking, newest first
	and filtered by kind, category and date.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fledger');

	const api = authedApi(url.origin, locals.accessToken);

	const kind = kindFilter(url.searchParams.get('kind'));
	const categoryId = url.searchParams.get('category') ?? '';
	const from = dateFilter(url.searchParams.get('from'));
	const to = dateFilter(url.searchParams.get('to'));

	const entryQuery = {
		...(kind ? { kind } : {}),
		...(categoryId ? { category_id: categoryId } : {}),
		...(from ? { from } : {}),
		...(to ? { to } : {})
	};

	const [categoriesRes, entriesRes, summaryRes] = await Promise.all([
		api.GET('/v1/ledger/categories'),
		api.GET('/v1/ledger/entries', { params: { query: { limit: PAGE_SIZE, ...entryQuery } } }),
		api.GET('/v1/ledger/summary', { params: { query: entryQuery } })
	]);

	if (categoriesRes.error || !categoriesRes.data) {
		error(
			categoriesRes.response?.status ?? 500,
			problemMessage(
				categoriesRes.error,
				'We couldn’t load your ledger categories. Please try again.'
			)
		);
	}

	// Neither the entries nor the summary is fatal to the desk: the categories and every
	// form stand without them, so a failed list degrades to a notice in its own section
	// rather than an error page over the whole thing.
	const entriesError =
		entriesRes.error || !entriesRes.data
			? problemMessage(entriesRes.error, 'We couldn’t load your ledger entries. Please try again.')
			: null;

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		categories: categoriesRes.data.categories ?? [],
		entries: pageOf(
			entriesRes.data?.entries,
			entriesRes.data?.next_cursor,
			entriesRes.data?.has_more ?? false
		),
		entriesError,
		totals: summaryRes.data?.totals ?? [],
		kind,
		categoryId,
		from,
		to
	};
};

export const actions: Actions = {
	/*
		Create a category — a named bucket that is either income or expense. The kind is
		fixed at creation; an entry inherits which way the money moves from it.
	*/
	createCategory: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fledger');

		const parsed = parseForm(categorySchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { name, kind } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/ledger/categories', {
			body: { name, kind }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t create that category. Please try again.')
			});
		}

		return { createdCategory: data.category };
	},

	/*
		Record an entry — an amount booked against a category on a day. The amount arrives
		in major units (an admin books in taka) and is sent to the API in minor.
	*/
	recordEntry: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fledger');

		const parsed = parseForm(entrySchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { category_id, amount, occurred_on, description } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/ledger/entries', {
			body: {
				category_id,
				amount: Math.round(amount * MINOR_PER_MAJOR),
				currency: DEFAULT_CURRENCY,
				occurred_on,
				...(description ? { description } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t record that entry. Please try again.')
			});
		}

		return { recordedEntry: data.entry };
	},

	/** The next page of entries. The cursor is opaque; the filters travel with it. */
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fledger');

		const form = await request.formData();
		const cursor = String(form.get('cursor') ?? '');
		const kind = kindFilter(String(form.get('kind') ?? ''));
		const categoryId = String(form.get('category') ?? '');
		const from = dateFilter(String(form.get('from') ?? ''));
		const to = dateFilter(String(form.get('to') ?? ''));

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/ledger/entries', {
			params: {
				query: {
					limit: PAGE_SIZE,
					cursor,
					...(kind ? { kind } : {}),
					...(categoryId ? { category_id: categoryId } : {}),
					...(from ? { from } : {}),
					...(to ? { to } : {})
				}
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t load more entries. Please try again.')
			});
		}

		return { more: pageOf(data.entries, data.next_cursor, data.has_more) };
	}
};
