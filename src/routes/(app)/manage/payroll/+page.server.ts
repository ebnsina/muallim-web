import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import {
	MINOR_PER_MAJOR,
	PAYSLIP_STATUSES,
	generateBatchSchema,
	payPayslipSchema,
	setSalarySchema,
	type PayslipStatus,
	type SalaryStructure
} from '$lib/payroll';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of payslips. muallim-api caps the rest behind a cursor. */
const PAGE_SIZE = 50;

/** A blank filter is "any status"; anything else must be one the API knows. */
function statusFilter(raw: string | null): PayslipStatus | '' {
	return PAYSLIP_STATUSES.includes(raw as PayslipStatus) ? (raw as PayslipStatus) : '';
}

/*
	The payroll desk: the staff a school pays, the salary structure it pays each by, and
	the payslips it generates a month at a time. The staff roster is loaded to name a
	payslip's owner and to fill the pickers; a few hundred is enough for both, and a
	staff filter narrows the payslip list. When one member is in focus, their salary
	structure comes with them.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fpayroll');

	const api = authedApi(url.origin, locals.accessToken);

	const status = statusFilter(url.searchParams.get('status'));
	const staffId = url.searchParams.get('staff') ?? '';
	const period = url.searchParams.get('period') ?? '';

	const [staffRes, payslipsRes] = await Promise.all([
		api.GET('/v1/staff', { params: { query: { limit: 100 } } }),
		api.GET('/v1/payroll/payslips', {
			params: {
				query: {
					limit: PAGE_SIZE,
					...(status ? { status } : {}),
					...(staffId ? { staff_id: staffId } : {}),
					...(period ? { period } : {})
				}
			}
		})
	]);

	if (staffRes.error || !staffRes.data) {
		error(
			staffRes.response?.status ?? 500,
			problemMessage(staffRes.error, 'The staff roster could not be loaded.')
		);
	}

	// The payslip list is not fatal to the desk: the roster and every salary structure
	// stand without it, so a failed list degrades to a notice in its own section rather
	// than an error page over the whole thing.
	const payslipsError =
		payslipsRes.error || !payslipsRes.data
			? problemMessage(payslipsRes.error, 'The payslips could not be loaded.')
			: null;

	// A member in focus brings their salary structure. There may be none yet — a 404 is
	// "not set", not an error — so a missing structure is a blank form, not a failed page.
	let salary: SalaryStructure | null = null;
	if (staffId) {
		const salaryRes = await api.GET('/v1/payroll/salary/{staff_id}', {
			params: { path: { staff_id: staffId } }
		});
		salary = salaryRes.data?.salary ?? null;
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		staff: staffRes.data.staff ?? [],
		payslips: pageOf(
			payslipsRes.data?.payslips,
			payslipsRes.data?.next_cursor,
			payslipsRes.data?.has_more ?? false
		),
		payslipsError,
		salary,
		staffId,
		period,
		status
	};
};

export const actions: Actions = {
	/*
		Set a staff member's salary. The amounts arrive in major units — an admin pays in
		taka — and are sent to the API in minor. Setting it again replaces the structure
		in place.
	*/
	setSalary: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fpayroll');

		const form = await request.formData();
		const staffId = String(form.get('staff_id') ?? '');

		const parsed = parseForm(setSalarySchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { basic_amount, allowances_amount, deductions_amount, currency, effective_from } =
			parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).PUT('/v1/payroll/salary/{staff_id}', {
			params: { path: { staff_id: staffId } },
			body: {
				basic_amount: Math.round(basic_amount * MINOR_PER_MAJOR),
				allowances_amount: Math.round(allowances_amount * MINOR_PER_MAJOR),
				deductions_amount: Math.round(deductions_amount * MINOR_PER_MAJOR),
				currency,
				...(effective_from ? { effective_from } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That salary could not be saved.')
			});
		}

		return { savedSalary: data.salary };
	},

	/*
		Generate payslips for a period. Idempotent: re-running the same month pays nobody
		twice. A blank staff member runs the whole workspace. The API answers 422 when a
		member in the run has no salary structure yet.
	*/
	generate: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fpayroll');

		const parsed = parseForm(generateBatchSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { period, staff_id } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/payroll/payslips', {
			body: {
				period,
				...(staff_id ? { staff_id } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Those payslips could not be generated.')
			});
		}

		return { generated: data.generated };
	},

	/*
		Record that a draft payslip was paid. The draft guard makes a double submission
		harmless — a 409 says it was already paid. The method is optional.
	*/
	pay: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fpayroll');

		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		const parsed = parseForm(payPayslipSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { method } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/payroll/payslips/{id}/pay', {
			params: { path: { id } },
			body: {
				...(method ? { method } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That payslip could not be marked paid.')
			});
		}

		return { paidPayslip: data.payslip };
	},

	/** The next page of payslips. The cursor is opaque; the filters travel with it. */
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fpayroll');

		const form = await request.formData();
		const cursor = String(form.get('cursor') ?? '');
		const status = statusFilter(String(form.get('status') ?? ''));
		const staffId = String(form.get('staff') ?? '');
		const period = String(form.get('period') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/payroll/payslips', {
			params: {
				query: {
					limit: PAGE_SIZE,
					cursor,
					...(status ? { status } : {}),
					...(staffId ? { staff_id: staffId } : {}),
					...(period ? { period } : {})
				}
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'The next page of payslips could not be loaded.')
			});
		}

		return { more: pageOf(data.payslips, data.next_cursor, data.has_more) };
	}
};
