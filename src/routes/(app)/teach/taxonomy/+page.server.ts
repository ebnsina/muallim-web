import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { categorySchema, tagSchema } from '$lib/taxonomy';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** Enough of an instructor's courses to fill the tagging picker. */
const COURSE_LIMIT = 100;

/*
	The taxonomy desk: the categories and tags a workspace files courses under, and the
	tool that assigns them. The categories and tags are the page's substance; the course
	list only fills a picker. A failed course list degrades to a notice on that one panel.
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
	/** Create a category. The slug is the server's to derive. */
	createCategory: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Ftaxonomy');

		const parsed = parseForm(categorySchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/course-categories', {
			body: { name: parsed.value.name }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That category could not be created.')
			});
		}

		return { createdCategory: data.category };
	},

	/** Delete a category. The API answers 204; the row is gone. */
	deleteCategory: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Ftaxonomy');

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/course-categories/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That category could not be deleted.')
			});
		}

		return { deletedCategory: id };
	},

	/** Create a tag. The slug is the server's to derive. */
	createTag: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Ftaxonomy');

		const parsed = parseForm(tagSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/course-tags', {
			body: { name: parsed.value.name }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That tag could not be created.')
			});
		}

		return { createdTag: data.tag };
	},

	/** Delete a tag. The API answers 204; the row is gone. */
	deleteTag: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Ftaxonomy');

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/course-tags/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That tag could not be deleted.')
			});
		}

		return { deletedTag: id };
	},

	/** Load one course's current category and tags, to fill the tagging form. */
	loadTaxonomy: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Ftaxonomy');

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
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Ftaxonomy');

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
