import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

/** Enough of an instructor's courses to fill the picker. */
const COURSE_LIMIT = 100;

/*
	The one place a category and tags are applied to a course. The PUT sets both at
	once — the category replaces any existing one, a blank one clears it, and the tag
	list replaces the whole set — so the two vocabularies converge here even though
	each is managed on its own page.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);

	const [categoriesRes, tagsRes, coursesRes] = await Promise.all([
		api.GET('/v1/course-categories'),
		api.GET('/v1/course-tags'),
		api.GET('/v1/me/courses', { params: { query: { limit: COURSE_LIMIT } } })
	]);

	if (categoriesRes.error || !categoriesRes.data) {
		error(
			categoriesRes.response?.status ?? 500,
			problemMessage(categoriesRes.error, 'The categories could not be loaded.')
		);
	}

	if (tagsRes.error || !tagsRes.data) {
		error(
			tagsRes.response?.status ?? 500,
			problemMessage(tagsRes.error, 'The tags could not be loaded.')
		);
	}

	const coursesError =
		coursesRes.error || !coursesRes.data
			? problemMessage(coursesRes.error, 'Your courses could not be loaded.')
			: null;

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		categories: categoriesRes.data.categories ?? [],
		tags: tagsRes.data.tags ?? [],
		courses: coursesRes.data?.courses ?? [],
		coursesError
	};
};

export const actions: Actions = {
	/** Load one course's current category and tags, to fill the form. */
	loadTaxonomy: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Forganise-courses');

		const slug = String((await request.formData()).get('slug') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/courses/{slug}/taxonomy', {
			params: { path: { slug } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "That course's taxonomy could not be loaded.")
			});
		}

		return { taxonomy: { slug, category: data.category, tags: data.tags ?? [] } };
	},

	/*
		Set a course's category and tags. The category replaces any existing one, a blank
		one clears it, and the tag list replaces the whole set.
	*/
	saveTaxonomy: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Forganise-courses');

		const form = await request.formData();
		const slug = String(form.get('slug') ?? '');
		const categoryId = String(form.get('category_id') ?? '');
		const tagIds = form.getAll('tag_ids').map(String).filter(Boolean);

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).PUT('/v1/courses/{slug}/taxonomy', {
			params: { path: { slug } },
			body: {
				tag_ids: tagIds,
				...(categoryId ? { category_id: categoryId } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "That course's taxonomy could not be saved.")
			});
		}

		return { savedTaxonomy: { slug, category: data.category, tags: data.tags ?? [] } };
	}
};
