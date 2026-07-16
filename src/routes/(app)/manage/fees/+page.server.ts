import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import {
	INVOICE_STATUSES,
	MINOR_PER_MAJOR,
	adhocInvoiceSchema,
	feeStructureSchema,
	issueFeesSchema,
	payInvoiceSchema,
	type InvoiceStatus,
	type Ledger
} from '$lib/fees';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of invoices. muallim-api caps the rest behind a cursor. */
const PAGE_SIZE = 50;

/** A blank filter is "any status"; anything else must be one the API knows. */
function statusFilter(raw: string | null): InvoiceStatus | '' {
	return INVOICE_STATUSES.includes(raw as InvoiceStatus) ? (raw as InvoiceStatus) : '';
}

/*
	The fees desk: the structures a school bills by, the invoices they raise, the
	students they belong to, and — when one student is in focus — that student's own
	ledger. The student roster is loaded to name an invoice's owner and to fill the
	pickers; a few hundred is enough for both, and larger rosters filter by student.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ffees');

	const api = authedApi(url.origin, locals.accessToken);

	const status = statusFilter(url.searchParams.get('status'));
	const studentId = url.searchParams.get('student') ?? '';

	const [structuresRes, invoicesRes, studentsRes, classesRes] = await Promise.all([
		api.GET('/v1/fee-structures'),
		api.GET('/v1/fee-invoices', {
			params: {
				query: {
					limit: PAGE_SIZE,
					...(status ? { status } : {}),
					...(studentId ? { student_id: studentId } : {})
				}
			}
		}),
		api.GET('/v1/students', { params: { query: { limit: 100 } } }),
		api.GET('/v1/classes')
	]);

	if (structuresRes.error || !structuresRes.data) {
		error(
			structuresRes.response?.status ?? 500,
			problemMessage(structuresRes.error, 'We couldn’t load your fees. Please try again.')
		);
	}

	// The invoice list is not fatal to the desk: the structures, the ledger, and every
	// per-student view stand without it, so a failed list degrades to a notice in its own
	// section rather than an error page over the whole thing.
	const invoicesError =
		invoicesRes.error || !invoicesRes.data
			? problemMessage(invoicesRes.error, 'We couldn’t load the invoices. Please try again.')
			: null;

	// A student in focus brings their ledger — the outstanding-by-currency total the
	// filter above narrows to. A missing student is not fatal to the page.
	let ledger: Ledger | null = null;
	if (studentId) {
		const ledgerRes = await api.GET('/v1/students/{id}/fees', {
			params: { path: { id: studentId } }
		});
		ledger = ledgerRes.data?.ledger ?? null;
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		structures: structuresRes.data.structures ?? [],
		invoices: pageOf(
			invoicesRes.data?.invoices,
			invoicesRes.data?.next_cursor,
			invoicesRes.data?.has_more ?? false
		),
		invoicesError,
		students: studentsRes.data?.students ?? [],
		classes: classesRes.data?.classes ?? [],
		ledger,
		status,
		studentId
	};
};

export const actions: Actions = {
	/*
		Create a fee structure. The amount arrives in major units — an admin prices in
		taka — and is sent to the API in minor. A blank class is "every class".
	*/
	createStructure: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ffees');

		const parsed = parseForm(feeStructureSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { name, amount, currency, grade_level_id, recurrence } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/fee-structures', {
			body: {
				name,
				amount: Math.round(amount * MINOR_PER_MAJOR),
				currency,
				recurrence,
				...(grade_level_id ? { grade_level_id } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t create that fee. Please try again.')
			});
		}

		return { createdStructure: data.structure };
	},

	/** Delete a structure. The API answers 204; the row is gone. */
	deleteStructure: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ffees');

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/fee-structures/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t delete that fee. Please try again.')
			});
		}

		return { deletedStructure: id };
	},

	/*
		Issue a structure for a period. Idempotent: re-issuing the same period bills
		nobody twice. A blank class bills every student the structure applies to.
	*/
	issue: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ffees');

		const form = await request.formData();
		const structureId = String(form.get('structure_id') ?? '');

		const parsed = parseForm(issueFeesSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { period, due_date, grade_level_id } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/fee-structures/{id}/issue', {
			params: { path: { id: structureId } },
			body: {
				period,
				...(due_date ? { due_date } : {}),
				...(grade_level_id ? { grade_level_id } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t issue those fees. Please try again.')
			});
		}

		return { issued: data.issued };
	},

	/*
		Raise an ad-hoc invoice against one student. The amount is major units in the
		box; the API is told minor.
	*/
	createInvoice: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ffees');

		const parsed = parseForm(adhocInvoiceSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { student_id, title, amount, currency, due_date, note } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/fee-invoices', {
			body: {
				student_id,
				title,
				amount: Math.round(amount * MINOR_PER_MAJOR),
				currency,
				...(due_date ? { due_date } : {}),
				...(note ? { note } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t create that invoice. Please try again.')
			});
		}

		return { createdInvoice: data.invoice };
	},

	/** Record a payment against an invoice. Major units in the box; minor on the wire. */
	pay: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ffees');

		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		const parsed = parseForm(payInvoiceSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { amount, method, note } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/fee-invoices/{id}/pay', {
			params: { path: { id } },
			body: {
				amount: Math.round(amount * MINOR_PER_MAJOR),
				...(method ? { method } : {}),
				...(note ? { note } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t record that payment. Please try again.')
			});
		}

		return { paidInvoice: data.invoice };
	},

	/** Waive an invoice — forgiven, not owed. */
	waive: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ffees');

		const id = String((await request.formData()).get('id') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/fee-invoices/{id}/waive', {
			params: { path: { id } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t waive that invoice. Please try again.')
			});
		}

		return { changedInvoice: data.invoice };
	},

	/** Cancel an invoice — void, never owed. */
	cancel: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ffees');

		const id = String((await request.formData()).get('id') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/fee-invoices/{id}/cancel', {
			params: { path: { id } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t cancel that invoice. Please try again.')
			});
		}

		return { changedInvoice: data.invoice };
	},

	/** The next page of invoices. The cursor is opaque; the filters travel with it. */
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Ffees');

		const form = await request.formData();
		const cursor = String(form.get('cursor') ?? '');
		const status = statusFilter(String(form.get('status') ?? ''));
		const studentId = String(form.get('student') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/fee-invoices', {
			params: {
				query: {
					limit: PAGE_SIZE,
					cursor,
					...(status ? { status } : {}),
					...(studentId ? { student_id: studentId } : {})
				}
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t load more invoices. Please try again.')
			});
		}

		return { more: pageOf(data.invoices, data.next_cursor, data.has_more) };
	}
};
