import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { updateStaffSchema } from '$lib/staff';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/*
	One member: their record. A member who does not exist — or belongs to another
	workspace — is the API's 404, shown as it came.
*/
export const load: PageServerLoad = async ({ locals, params, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const staffRes = await authedApi(url.origin, locals.accessToken).GET('/v1/staff/{id}', {
		params: { path: { id: params.id } }
	});

	if (staffRes.error || !staffRes.data) {
		error(
			staffRes.response?.status ?? 500,
			problemMessage(
				staffRes.error,
				'We couldn’t open that staff member’s record. Please try again.'
			)
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return { staff: staffRes.data.staff };
};

export const actions: Actions = {
	/** Edit the record. Name, role and standing always go; contact details may be cleared. */
	update: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const parsed = parseForm(updateStaffSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { full_name, role, status, email, phone, joined_on } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).PATCH('/v1/staff/{id}', {
			params: { path: { id: params.id } },
			body: {
				full_name,
				role,
				status,
				...(email ? { email } : {}),
				...(phone ? { phone } : {}),
				...(joined_on ? { joined_on } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t save your changes. Please try again.')
			});
		}

		return { updated: data.staff };
	},

	/*
		Remove the member. The API answers 204 and the row is gone, so there is nothing
		to return to — the action redirects back to the roster, which reloads without them.
	*/
	remove: async ({ locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/staff/{id}',
			{ params: { path: { id: params.id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t remove that staff member. Please try again.')
			});
		}

		redirect(303, '/manage/staff');
	}
};
