import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import {
	MINOR_PER_MAJOR,
	addVehicleSchema,
	assignStudentSchema,
	createRouteSchema
} from '$lib/transport';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of routes/assignments. muallim-api caps the rest behind a cursor. */
const PAGE_SIZE = 50;

/*
	The transport desk: the routes a school runs, the fleet on a chosen route, and the
	students riding them. The roster is loaded to name a rider and to fill the assign
	picker; a few hundred is enough for both. Picking a route brings its vehicles.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ftransport');

	const api = authedApi(url.origin, locals.accessToken);

	const routeId = url.searchParams.get('route') ?? '';
	const studentId = url.searchParams.get('student') ?? '';

	const [routesRes, assignmentsRes, studentsRes] = await Promise.all([
		api.GET('/v1/transport/routes', { params: { query: { limit: PAGE_SIZE } } }),
		api.GET('/v1/transport/assignments', {
			params: {
				query: {
					limit: PAGE_SIZE,
					...(routeId ? { route_id: routeId } : {}),
					...(studentId ? { student_id: studentId } : {})
				}
			}
		}),
		api.GET('/v1/students', { params: { query: { limit: 200 } } })
	]);

	if (routesRes.error || !routesRes.data) {
		error(
			routesRes.response?.status ?? 500,
			problemMessage(routesRes.error, 'We couldn’t load your transport routes. Please try again.')
		);
	}

	// A route in focus brings its fleet. A missing fleet is not fatal to the page.
	let vehicles = null;
	let vehiclesError: string | null = null;
	if (routeId) {
		const vehiclesRes = await api.GET('/v1/transport/routes/{id}/vehicles', {
			params: { path: { id: routeId } }
		});
		if (vehiclesRes.error || !vehiclesRes.data) {
			vehiclesError = problemMessage(
				vehiclesRes.error,
				'We couldn’t load the vehicles on this route. Please try again.'
			);
		} else {
			vehicles = vehiclesRes.data.vehicles ?? [];
		}
	}

	// The assignment list is not fatal: the routes and the fleet stand without it, so a
	// failed list degrades to a notice in its own section.
	const assignmentsError =
		assignmentsRes.error || !assignmentsRes.data
			? problemMessage(
					assignmentsRes.error,
					'We couldn’t load the riders on this route. Please try again.'
				)
			: null;

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		routes: routesRes.data.routes ?? [],
		routesHasMore: routesRes.data.has_more ?? false,
		routesCursor: routesRes.data.next_cursor,
		vehicles,
		vehiclesError,
		assignments: pageOf(
			assignmentsRes.data?.assignments,
			assignmentsRes.data?.next_cursor,
			assignmentsRes.data?.has_more ?? false
		),
		assignmentsError,
		students: studentsRes.data?.students ?? [],
		routeId,
		studentId
	};
};

export const actions: Actions = {
	/*
		Define a route. The fare arrives in major units — an admin prices in taka — and is
		sent to the API in minor. A blank description is left off.
	*/
	createRoute: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ftransport');

		const parsed = parseForm(createRouteSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { name, description, fare, currency } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/transport/routes', {
			body: {
				name,
				fare_amount: Math.round(fare * MINOR_PER_MAJOR),
				currency,
				...(description ? { description } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t create that route. Please try again.')
			});
		}

		return { createdRoute: data.route };
	},

	/** Add a vehicle to a route. A blank driver name or phone is left off. */
	addVehicle: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ftransport');

		const form = await request.formData();
		const routeId = String(form.get('route_id') ?? '');

		const parsed = parseForm(addVehicleSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { registration_no, capacity, driver_name, driver_phone } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/transport/routes/{id}/vehicles', {
			params: { path: { id: routeId } },
			body: {
				registration_no,
				capacity,
				...(driver_name ? { driver_name } : {}),
				...(driver_phone ? { driver_phone } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t add that vehicle. Please try again.')
			});
		}

		return { addedVehicle: data.vehicle };
	},

	/*
		Assign a student to a route. A student rides one route: a second assignment is the
		API's 409, surfaced as the message on the assign form.
	*/
	assign: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ftransport');

		const parsed = parseForm(assignStudentSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { route_id, student_id, stop_name } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/transport/assignments', {
			body: {
				route_id,
				student_id,
				...(stop_name ? { stop_name } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(
					problem,
					'We couldn’t put that student on the route. Please try again.'
				)
			});
		}

		return { assigned: data.assignment };
	},

	/** Take a student off their route. The API answers 204; the assignment is gone. */
	unassign: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ftransport');

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/transport/assignments/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(
					problem,
					'We couldn’t take that student off the route. Please try again.'
				)
			});
		}

		return { unassigned: id };
	},

	/** The next page of assignments. The cursor is opaque; the filters travel with it. */
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ftransport');

		const form = await request.formData();
		const cursor = String(form.get('cursor') ?? '');
		const routeId = String(form.get('route') ?? '');
		const studentId = String(form.get('student') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/transport/assignments', {
			params: {
				query: {
					limit: PAGE_SIZE,
					cursor,
					...(routeId ? { route_id: routeId } : {}),
					...(studentId ? { student_id: studentId } : {})
				}
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t load more riders. Please try again.')
			});
		}

		return { more: pageOf(data.assignments, data.next_cursor, data.has_more) };
	}
};
