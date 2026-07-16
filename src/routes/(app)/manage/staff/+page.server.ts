import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import { STAFF_ROLES, hireStaffSchema, type StaffRole } from '$lib/staff';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of the roster. muallim-api caps the rest behind a cursor. */
const PAGE_SIZE = 50;

/** A blank filter is "every role"; anything else must be one the API knows. */
function roleFilter(raw: string | null): StaffRole | '' {
	return STAFF_ROLES.includes(raw as StaffRole) ? (raw as StaffRole) : '';
}

export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fstaff');

	const api = authedApi(url.origin, locals.accessToken);
	const role = roleFilter(url.searchParams.get('role'));

	const staffRes = await api.GET('/v1/staff', {
		params: { query: { limit: PAGE_SIZE, ...(role ? { role } : {}) } }
	});

	if (staffRes.error || !staffRes.data) {
		error(
			staffRes.response?.status ?? 500,
			problemMessage(staffRes.error, 'The staff roster could not be loaded.')
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		staff: pageOf(staffRes.data.staff, staffRes.data.next_cursor, staffRes.data.has_more),
		role
	};
};

export const actions: Actions = {
	/*
		Hire a member. A name and a role are all that is needed; a duplicate staff
		number is the API's 409, and the page prints the sentence it came with.
	*/
	hire: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fstaff');

		const parsed = parseForm(hireStaffSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { full_name, role, staff_no, email, phone, joined_on } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/staff', {
			body: {
				full_name,
				role,
				...(staff_no ? { staff_no } : {}),
				...(email ? { email } : {}),
				...(phone ? { phone } : {}),
				...(joined_on ? { joined_on } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That member could not be hired.')
			});
		}

		return { hired: data.staff };
	},

	/** The next page. The cursor is opaque and goes back unread; the filter travels with it. */
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fstaff');

		const form = await request.formData();
		const cursor = String(form.get('cursor') ?? '');
		const role = roleFilter(String(form.get('role') ?? ''));

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/staff', {
			params: { query: { limit: PAGE_SIZE, cursor, ...(role ? { role } : {}) } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'The next page of staff could not be loaded.')
			});
		}

		return { more: pageOf(data.staff, data.next_cursor, data.has_more) };
	}
};
