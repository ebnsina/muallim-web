import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import {
	institutionTypeSchema,
	termCreateSchema,
	yearCreateSchema,
	type Term
} from '$lib/academics-years';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

const LOGIN = '/login?next=%2Fmanage%2Facademic-years';

/*
	The academic calendar's spine: the years this school has opened, the terms inside each,
	and the kind of institution it is. A school runs a handful of years, so every year's
	terms are fetched alongside the list rather than behind a click.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, LOGIN);

	const api = authedApi(url.origin, locals.accessToken);

	const [yearsRes, typeRes] = await Promise.all([
		api.GET('/v1/academic-years'),
		api.GET('/v1/academics/institution-type')
	]);

	if (yearsRes.error || !yearsRes.data) {
		error(
			yearsRes.response?.status ?? 500,
			problemMessage(yearsRes.error, 'We couldn’t load your academic years. Please try again.')
		);
	}

	const years = yearsRes.data.years ?? [];

	const termLists = await Promise.all(
		years.map((year) =>
			api.GET('/v1/academic-years/{id}/terms', { params: { path: { id: year.id } } })
		)
	);

	// A year whose terms failed to load shows as a year with none rather than taking the
	// page down: the list, and which year is current, still read true without them.
	const termsByYear: Record<string, Term[]> = {};
	years.forEach((year, index) => {
		termsByYear[year.id] = termLists[index].data?.terms ?? [];
	});

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		years,
		termsByYear,
		institutionType: typeRes.data?.type ?? 'school',
		institutionTypeError:
			typeRes.error || !typeRes.data
				? problemMessage(typeRes.error, 'We couldn’t load what kind of institution this is.')
				: null
	};
};

export const actions: Actions = {
	/** Open a year. It is not the current one until somebody says so. */
	createYear: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, LOGIN);

		const parsed = parseForm(yearCreateSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { name, starts_on, ends_on } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/academic-years', {
			body: { name, starts_on, ends_on }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t open that year. Please try again.')
			});
		}

		return { createdYear: data.year };
	},

	/*
		Make one year the current one. The API clears any other, so the page can move the
		mark across without asking again which year now holds it.
	*/
	setCurrent: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, LOGIN);

		const id = String((await request.formData()).get('id') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).PUT('/v1/academic-years/{id}/current', {
			params: { path: { id } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(
					problem,
					'We couldn’t make that the current year. Please try again.'
				)
			});
		}

		return { currentYear: data.year };
	},

	/** Remove a year. Its terms go with it — the API answers 204 and both are gone. */
	deleteYear: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, LOGIN);

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/academic-years/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t remove that year. Please try again.')
			});
		}

		return { deletedYear: id };
	},

	/** Add a term to a year. The API orders a year's terms by the span they cover. */
	createTerm: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, LOGIN);

		const parsed = parseForm(termCreateSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { year_id, name, starts_on, ends_on } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/academic-years/{id}/terms', {
			params: { path: { id: year_id } },
			body: { name, starts_on, ends_on }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t add that term. Please try again.')
			});
		}

		return { createdTerm: data.term, yearId: year_id };
	},

	/** Remove a term. The year it sat in stays. */
	deleteTerm: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, LOGIN);

		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const yearId = String(form.get('year_id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/terms/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t remove that term. Please try again.')
			});
		}

		return { deletedTerm: id, yearId };
	},

	/** Say what kind of institution this is. The API answers 204; the choice is the record. */
	setInstitutionType: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, LOGIN);

		const parsed = parseForm(institutionTypeSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { type } = parsed.value;

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/academics/institution-type',
			{ body: { type } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t save that choice. Please try again.')
			});
		}

		return { institutionType: type };
	}
};
