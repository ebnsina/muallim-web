import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import {
	LOAN_STATUSES,
	addBookSchema,
	dueDateToTimestamp,
	issueLoanSchema,
	type LoanStatus
} from '$lib/library';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of books or loans. muallim-api caps the rest behind a cursor. */
const PAGE_SIZE = 50;

/** A blank filter is "any status"; anything else must be one the API knows. */
function statusFilter(raw: string | null): LoanStatus | '' {
	return LOAN_STATUSES.includes(raw as LoanStatus) ? (raw as LoanStatus) : '';
}

/*
	The library desk: the catalogue a school lends from, the loans out against it, and the
	students who hold them. The student roster fills the loan picker and names a loan's
	borrower; a few hundred is enough for both, and larger rosters filter by student.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Flibrary');

	const api = authedApi(url.origin, locals.accessToken);

	const category = url.searchParams.get('category') ?? '';
	const status = statusFilter(url.searchParams.get('status'));
	const studentId = url.searchParams.get('student') ?? '';

	const [booksRes, loansRes, studentsRes] = await Promise.all([
		api.GET('/v1/library/books', {
			params: { query: { limit: PAGE_SIZE, ...(category ? { category } : {}) } }
		}),
		api.GET('/v1/library/loans', {
			params: {
				query: {
					limit: PAGE_SIZE,
					...(status ? { status } : {}),
					...(studentId ? { student_id: studentId } : {})
				}
			}
		}),
		api.GET('/v1/students', { params: { query: { limit: 100 } } })
	]);

	if (booksRes.error || !booksRes.data) {
		error(
			booksRes.response?.status ?? 500,
			problemMessage(booksRes.error, 'The library catalogue could not be loaded.')
		);
	}

	// The loan list is not fatal to the desk: the catalogue stands without it, so a failed
	// list degrades to a notice in its own section rather than an error page over the whole thing.
	const loansError =
		loansRes.error || !loansRes.data
			? problemMessage(loansRes.error, 'The loans could not be loaded.')
			: null;

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		books: pageOf(booksRes.data.books, booksRes.data.next_cursor, booksRes.data.has_more),
		loans: pageOf(
			loansRes.data?.loans,
			loansRes.data?.next_cursor,
			loansRes.data?.has_more ?? false
		),
		loansError,
		students: studentsRes.data?.students ?? [],
		category,
		status,
		studentId
	};
};

export const actions: Actions = {
	/*
		Add a book to the catalogue. Only the title is required; the copies default to one
		and the API counts availability down from the total as loans go out.
	*/
	addBook: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Flibrary');

		const parsed = parseForm(addBookSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { title, author, isbn, category, total_copies } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/library/books', {
			body: {
				title,
				total_copies,
				...(author ? { author } : {}),
				...(isbn ? { isbn } : {}),
				...(category ? { category } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That book could not be added.')
			});
		}

		return { addedBook: data.book };
	},

	/*
		Issue a loan: a copy of a book handed to a student until the due date. The form types
		a date; the API is told the end-of-day timestamp. No copy free is the API's 409.
	*/
	issueLoan: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Flibrary');

		const parsed = parseForm(issueLoanSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { book_id, student_id, due_date } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/library/loans', {
			body: { book_id, student_id, due_at: dueDateToTimestamp(due_date) }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That loan could not be issued.')
			});
		}

		return { issuedLoan: data.loan };
	},

	/* Return a loan — the copy is back on the shelf, and availability restores. */
	returnLoan: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Flibrary');

		const id = String((await request.formData()).get('id') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/library/loans/{id}/return', {
			params: { path: { id } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That loan could not be returned.')
			});
		}

		return { returnedLoan: data.loan };
	},

	/** The next page of books. The cursor is opaque; the category filter travels with it. */
	moreBooks: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Flibrary');

		const form = await request.formData();
		const cursor = String(form.get('cursor') ?? '');
		const category = String(form.get('category') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/library/books', {
			params: { query: { limit: PAGE_SIZE, cursor, ...(category ? { category } : {}) } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'The next page of books could not be loaded.')
			});
		}

		return { moreBooks: pageOf(data.books, data.next_cursor, data.has_more) };
	},

	/** The next page of loans. The cursor is opaque; the filters travel with it. */
	moreLoans: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Flibrary');

		const form = await request.formData();
		const cursor = String(form.get('cursor') ?? '');
		const status = statusFilter(String(form.get('status') ?? ''));
		const studentId = String(form.get('student') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/library/loans', {
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
				message: problemMessage(problem, 'The next page of loans could not be loaded.')
			});
		}

		return { moreLoans: pageOf(data.loans, data.next_cursor, data.has_more) };
	}
};
