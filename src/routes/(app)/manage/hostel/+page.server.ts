import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import {
	ALLOCATION_STATUSES,
	addRoomSchema,
	allocateSchema,
	createBuildingSchema,
	type AllocationStatus
} from '$lib/hostel';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of buildings or allocations. muallim-api caps the rest behind a cursor. */
const PAGE_SIZE = 50;

/** A blank filter is "any status"; anything else must be one the API knows. */
function statusFilter(raw: string | null): AllocationStatus | '' {
	return ALLOCATION_STATUSES.includes(raw as AllocationStatus) ? (raw as AllocationStatus) : '';
}

/*
	The hostel desk: the boarding buildings, the rooms of the one in focus, and the
	allocations that put a student in a bed. The student roster fills the allocate
	picker and names an allocation's boarder; a few hundred is enough, and larger
	rosters filter by student. A building in focus (?building=) brings its rooms — the
	beds an allocation is made against.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fhostel');

	const api = authedApi(url.origin, locals.accessToken);

	const buildingId = url.searchParams.get('building') ?? '';
	const roomId = url.searchParams.get('room') ?? '';
	const studentId = url.searchParams.get('student') ?? '';
	const status = statusFilter(url.searchParams.get('status'));

	const [buildingsRes, allocationsRes, studentsRes] = await Promise.all([
		api.GET('/v1/hostel/buildings', { params: { query: { limit: PAGE_SIZE } } }),
		api.GET('/v1/hostel/allocations', {
			params: {
				query: {
					limit: PAGE_SIZE,
					...(roomId ? { room_id: roomId } : {}),
					...(studentId ? { student_id: studentId } : {}),
					...(status ? { status } : {})
				}
			}
		}),
		api.GET('/v1/students', { params: { query: { limit: 100 } } })
	]);

	if (buildingsRes.error || !buildingsRes.data) {
		error(
			buildingsRes.response?.status ?? 500,
			problemMessage(
				buildingsRes.error,
				'We couldn’t load your hostel buildings. Please try again.'
			)
		);
	}

	// The allocation list is not fatal to the desk: the buildings and their rooms stand
	// without it, so a failed list degrades to a notice in its own section.
	const allocationsError =
		allocationsRes.error || !allocationsRes.data
			? problemMessage(
					allocationsRes.error,
					'We couldn’t load who’s in which bed. Please try again.'
				)
			: null;

	// A building in focus brings its rooms — the beds an allocation is made against, with
	// occupancy against capacity. A missing building's rooms are not fatal to the page.
	let rooms = null;
	let roomsError = null;
	if (buildingId) {
		const roomsRes = await api.GET('/v1/hostel/buildings/{id}/rooms', {
			params: { path: { id: buildingId } }
		});
		if (roomsRes.error || !roomsRes.data) {
			roomsError = problemMessage(
				roomsRes.error,
				'We couldn’t load this building’s rooms. Please try again.'
			);
		} else {
			rooms = roomsRes.data.rooms ?? [];
		}
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		buildings: pageOf(
			buildingsRes.data.buildings,
			buildingsRes.data.next_cursor,
			buildingsRes.data.has_more
		),
		allocations: pageOf(
			allocationsRes.data?.allocations,
			allocationsRes.data?.next_cursor,
			allocationsRes.data?.has_more ?? false
		),
		allocationsError,
		students: studentsRes.data?.students ?? [],
		rooms,
		roomsError,
		buildingId,
		roomId,
		studentId,
		status
	};
};

export const actions: Actions = {
	/** Register a boarding building. The name is required; a warden is optional. */
	createBuilding: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fhostel');

		const parsed = parseForm(createBuildingSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { name, warden_name, warden_phone } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/hostel/buildings', {
			body: {
				name,
				...(warden_name ? { warden_name } : {}),
				...(warden_phone ? { warden_phone } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t add that building. Please try again.')
			});
		}

		return { createdBuilding: data.building };
	},

	/*
		Add a room to a building. The building is on the path; the room number and its
		capacity are the body. A new room boards nobody yet — occupied starts at zero.
	*/
	addRoom: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fhostel');

		const form = await request.formData();
		const buildingId = String(form.get('building_id') ?? '');
		if (!buildingId) return fail(400, { message: 'Choose a building first.' });

		const parsed = parseForm(addRoomSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { room_no, capacity } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/hostel/buildings/{id}/rooms', {
			params: { path: { id: buildingId } },
			body: { room_no, capacity }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t add that room. Please try again.')
			});
		}

		return { addedRoom: data.room };
	},

	/*
		Allocate a student a bed. A room full, or a student who already boards, is the
		API's 409 — printed with the sentence it came with, never guessed at here.
	*/
	allocate: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fhostel');

		const parsed = parseForm(allocateSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { room_id, student_id } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/hostel/allocations', {
			body: { room_id, student_id }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t give that student a bed. Please try again.')
			});
		}

		return { allocated: data.allocation };
	},

	/** Vacate an allocation. The bed is freed; the row stays as boarding history. Idempotent. */
	vacate: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fhostel');

		const id = String((await request.formData()).get('id') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).DELETE('/v1/hostel/allocations/{id}', {
			params: { path: { id } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t free that bed. Please try again.')
			});
		}

		return { vacated: data.allocation };
	},

	/** The next page of buildings. The cursor is opaque. */
	moreBuildings: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fhostel');

		const cursor = String((await request.formData()).get('cursor') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/hostel/buildings', {
			params: { query: { limit: PAGE_SIZE, cursor } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t load more buildings. Please try again.')
			});
		}

		return { moreBuildings: pageOf(data.buildings, data.next_cursor, data.has_more) };
	},

	/** The next page of allocations. The cursor is opaque; the filters travel with it. */
	moreAllocations: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fhostel');

		const form = await request.formData();
		const cursor = String(form.get('cursor') ?? '');
		const roomId = String(form.get('room') ?? '');
		const studentId = String(form.get('student') ?? '');
		const status = statusFilter(String(form.get('status') ?? ''));

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/hostel/allocations', {
			params: {
				query: {
					limit: PAGE_SIZE,
					cursor,
					...(roomId ? { room_id: roomId } : {}),
					...(studentId ? { student_id: studentId } : {}),
					...(status ? { status } : {})
				}
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t load more beds. Please try again.')
			});
		}

		return { moreAllocations: pageOf(data.allocations, data.next_cursor, data.has_more) };
	}
};
