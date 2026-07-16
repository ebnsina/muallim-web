<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import {
		ArrowDown01Icon,
		ArrowTurnBackwardIcon,
		Book02Icon,
		BookOpen01Icon,
		Cancel01Icon,
		LibraryIcon,
		PlusSignIcon
	} from '@hugeicons/core-free-icons';
	import { Alert, Badge, Button, EmptyState, Field, Icon, Input, Select } from '$lib/components';
	import { Sheet } from '$lib/components';
	import {
		LIBRARY_LIMITS,
		LOAN_STATUSES,
		addBookSchema,
		copiesTone,
		isOverdue,
		issueLoanSchema,
		loanStatusLabel,
		loanStatusTone,
		type Book,
		type Loan
	} from '$lib/library';
	import { appendPage, canLoadMore, replaceRow, type Paged } from '$lib/paging';
	import type { Student } from '$lib/students';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const bookKey = (book: Book) => book.id;
	const loanKey = (loan: Loan) => loan.id;

	// The rows on screen, seeded by the server and mutated in place as books are added,
	// loans issued and copies returned.
	let books = $derived(data.books as Paged<Book>);
	let loans = $derived(data.loans as Paged<Loan>);

	const students = $derived(data.students as Student[]);
	const studentMap = $derived(new Map(students.map((s) => [s.id, s.full_name])));
	const bookTitles = $derived(new Map(books.rows.map((b) => [b.id, b.title])));

	const studentName = (id: string) => studentMap.get(id) ?? 'Unknown student';
	const bookTitle = (id: string) => bookTitles.get(id) ?? 'a book';

	// A date-time from the API, shown as the day alone — the copy went out on a day, not a second.
	const day = (iso: string) => (iso ? iso.slice(0, 10) : '');

	// Per-form field errors, kept apart so one form's mistake does not light another.
	let bookErrors = $state<FieldErrors>({});
	let loanErrors = $state<FieldErrors>({});

	let addBookOpen = $state(false);
	let issueOpen = $state(false);
	let addingBook = $state(false);
	let issuing = $state(false);
	let returning = $state<string | null>(null);
	let loadingBooks = $state(false);
	let loadingLoans = $state(false);
</script>

<svelte:head><title>Library — Muallim</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div class="min-w-0">
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Library</h1>
		<p class="mt-2 max-w-2xl text-muted">
			The books this school lends, and the copies out on loan.
		</p>
	</div>
	<div class="flex shrink-0 items-center gap-3">
		<Button variant="secondary" onclick={() => (addBookOpen = !addBookOpen)}>
			<Icon icon={addBookOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
			{addBookOpen ? 'Close' : 'Add book'}
		</Button>
		<Button onclick={() => (issueOpen = !issueOpen)} disabled={books.rows.length === 0}>
			<Icon icon={issueOpen ? Cancel01Icon : BookOpen01Icon} class="size-4" />
			{issueOpen ? 'Close' : 'Issue loan'}
		</Button>
	</div>
</div>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- ---------------------------------------------------------------- add book -->
{#if addBookOpen}
	<form
		method="POST"
		action="?/addBook"
		class="mt-6"
		use:enhance={validated(
			addBookSchema,
			(next) => (bookErrors = next),
			() => {
				addingBook = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					addingBook = false;
					if (result.type !== 'success') return;

					const added = result.data?.addedBook as Book | undefined;
					if (added) {
						books = { ...books, rows: [added, ...books.rows] };
						addBookOpen = false;
						toast.success(`“${added.title}” has been added.`);
					}
				};
			}
		)}
	>
		<Sheet open={addBookOpen} onClose={() => (addBookOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new book</h2>
				<p class="mt-0.5 text-sm text-muted">
					A title and a number of copies. The author, ISBN and category are the record.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="title" label="Title" error={bookErrors.title}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="title"
							placeholder="Riyad as-Salihin"
							aria-describedby={describedBy}
							{...LIBRARY_LIMITS.title}
						/>
					{/snippet}
				</Field>

				<Field id="author" label="Author" error={bookErrors.author}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="author"
							placeholder="Imam an-Nawawi"
							aria-describedby={describedBy}
							{...LIBRARY_LIMITS.author}
						/>
					{/snippet}
				</Field>

				<Field id="isbn" label="ISBN" error={bookErrors.isbn}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="isbn"
							placeholder="Optional"
							aria-describedby={describedBy}
							{...LIBRARY_LIMITS.isbn}
						/>
					{/snippet}
				</Field>

				<Field id="category" label="Category" error={bookErrors.category}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="category"
							placeholder="Hadith"
							aria-describedby={describedBy}
							{...LIBRARY_LIMITS.category}
						/>
					{/snippet}
				</Field>

				<Field id="total_copies" label="Copies" error={bookErrors.total_copies}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="total_copies"
							inputmode="numeric"
							value="1"
							aria-describedby={describedBy}
							{...LIBRARY_LIMITS.totalCopies}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={addingBook} disabled={addingBook}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Add book
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------- issue loan -->
{#if issueOpen}
	<form
		method="POST"
		action="?/issueLoan"
		class="mt-6"
		use:enhance={validated(
			issueLoanSchema,
			(next) => (loanErrors = next),
			() => {
				issuing = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					issuing = false;
					if (result.type !== 'success') return;

					const issued = result.data?.issuedLoan as Loan | undefined;
					if (issued) {
						loans = { ...loans, rows: [issued, ...loans.rows] };
						books = {
							...books,
							rows: books.rows.map((b) =>
								b.id === issued.book_id
									? { ...b, available_copies: Math.max(0, b.available_copies - 1) }
									: b
							)
						};
						issueOpen = false;
						toast.success('The loan has been issued.');
					}
				};
			}
		)}
	>
		<Sheet open={issueOpen} onClose={() => (issueOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">Issue a loan</h2>
				<p class="mt-0.5 text-sm text-muted">
					A copy of a book handed to a student until the day it is due back.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-3">
				<Field id="book_id" label="Book" error={loanErrors.book_id}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="book_id" value="" aria-describedby={describedBy}>
							<option value="" disabled>Choose a book</option>
							{#each books.rows as b (b.id)}
								<option value={b.id} disabled={b.available_copies === 0}>
									{b.title}{b.available_copies === 0 ? ' — none available' : ''}
								</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="student_id" label="Student" error={loanErrors.student_id}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="student_id" value="" aria-describedby={describedBy}>
							<option value="" disabled>Choose a student</option>
							{#each students as s (s.id)}
								<option value={s.id}>{s.full_name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="due_date" label="Due date" error={loanErrors.due_date}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="due_date"
							aria-describedby={describedBy}
							{...LIBRARY_LIMITS.dueDate}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={issuing} disabled={issuing}>
					<Icon icon={BookOpen01Icon} class="size-4" />
					Issue loan
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------- catalogue -->
<section class="mt-10">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h2 class="text-lg font-semibold">Catalogue</h2>
			<p class="mt-1 text-sm text-muted">The books this school lends, and copies free to lend.</p>
		</div>

		<form method="GET" class="flex flex-wrap items-end gap-3">
			<input type="hidden" name="status" value={data.status} />
			<input type="hidden" name="student" value={data.studentId} />
			<div class="w-48">
				<Field id="category-filter" label="Category">
					{#snippet children({ id })}
						<Input {id} name="category" value={data.category} placeholder="All categories" />
					{/snippet}
				</Field>
			</div>
			<Button type="submit" variant="secondary">Filter</Button>
		</form>
	</div>

	<div class="mt-4">
		{#if books.rows.length === 0}
			<EmptyState
				icon={Book02Icon}
				title="No books"
				description={data.category
					? 'Nothing matches this category. Try another, or clear the filter.'
					: 'Add a book above and it will appear here, ready to lend.'}
			/>
		{:else}
			<ul class="grid gap-3 sm:grid-cols-2">
				{#each books.rows as book (book.id)}
					<li class="rounded-card border border-border bg-surface-raised p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="font-medium">{book.title}</p>
								<p class="mt-0.5 text-sm text-muted">
									{#if book.author}{book.author}{:else}Unknown author{/if}
									{#if book.category}· {book.category}{/if}
									{#if book.isbn}· {book.isbn}{/if}
								</p>
							</div>
							<Badge tone={copiesTone(book)}>
								{book.available_copies} / {book.total_copies} free
							</Badge>
						</div>
					</li>
				{/each}
			</ul>

			{#if canLoadMore(books)}
				<form
					method="POST"
					action="?/moreBooks"
					class="mt-4 flex justify-center"
					use:enhance={() => {
						loadingBooks = true;
						return async ({ result }) => {
							loadingBooks = false;
							if (result.type !== 'success') return applyAction(result);
							const next = result.data?.moreBooks as Paged<Book> | undefined;
							if (next) books = appendPage(books, next, bookKey);
						};
					}}
				>
					<input type="hidden" name="cursor" value={books.cursor} />
					<input type="hidden" name="category" value={data.category} />
					<Button type="submit" variant="secondary" loading={loadingBooks} disabled={loadingBooks}>
						<Icon icon={ArrowDown01Icon} class="size-4" />
						Load more books
					</Button>
				</form>
			{/if}
		{/if}
	</div>
</section>

<!-- ------------------------------------------------------------- loans -->
<section class="mt-10">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h2 class="text-lg font-semibold">Loans</h2>
			<p class="mt-1 text-sm text-muted">Every copy out, who holds it, and when it is due.</p>
		</div>

		<form method="GET" class="flex flex-wrap items-end gap-3">
			<input type="hidden" name="category" value={data.category} />
			<div class="w-44">
				<Field id="student-filter" label="Student">
					{#snippet children({ id })}
						<Select
							{id}
							name="student"
							value={data.studentId}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							<option value="">All students</option>
							{#each students as s (s.id)}
								<option value={s.id}>{s.full_name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>
			<div class="w-40">
				<Field id="status-filter" label="Status">
					{#snippet children({ id })}
						<Select
							{id}
							name="status"
							value={data.status}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							<option value="">Any status</option>
							{#each LOAN_STATUSES as s (s)}
								<option value={s}>{loanStatusLabel(s)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>
			<noscript><Button type="submit" variant="secondary">Apply</Button></noscript>
		</form>
	</div>

	<div class="mt-4">
		{#if data.loansError && loans.rows.length === 0}
			<Alert tone="warning" role="alert">
				{data.loansError} Pick a student or status above to narrow the list.
			</Alert>
		{:else if loans.rows.length === 0}
			<EmptyState
				icon={LibraryIcon}
				title="No loans"
				description={data.status || data.studentId
					? 'Nothing matches this filter. Try another student or status.'
					: 'Issue a loan above and it will appear here.'}
			/>
		{:else}
			<div class="overflow-x-auto rounded-card bg-surface-raised shadow-card">
				<table class="w-full border-collapse text-sm">
					<caption class="sr-only">
						Every loan: the book, the student, when it was borrowed and when it is due.
					</caption>
					<thead>
						<tr class="border-b border-border bg-surface-sunken text-left">
							<th scope="col" class="px-4 py-3 font-medium">Book</th>
							<th scope="col" class="px-4 py-3 font-medium">Student</th>
							<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Borrowed</th>
							<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Due</th>
							<th scope="col" class="px-4 py-3 font-medium">Status</th>
							<th scope="col" class="px-4 py-3 font-medium"><span class="sr-only">Actions</span></th
							>
						</tr>
					</thead>
					<tbody>
						{#each loans.rows as loan (loan.id)}
							<tr class="border-b border-border last:border-0">
								<td class="px-4 py-3 font-medium">{bookTitle(loan.book_id)}</td>
								<td class="px-4 py-3 text-muted">{studentName(loan.student_id)}</td>
								<td class="numeral px-4 py-3 whitespace-nowrap">{day(loan.borrowed_at)}</td>
								<td class="numeral px-4 py-3 whitespace-nowrap">
									{day(loan.due_at)}
									{#if isOverdue(loan)}
										<span class="block text-xs font-medium text-danger">Overdue</span>
									{:else if loan.returned_at}
										<span class="block text-xs text-muted">Returned {day(loan.returned_at)}</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<Badge tone={loanStatusTone(loan.status)}>{loanStatusLabel(loan.status)}</Badge>
								</td>
								<td class="px-4 py-3">
									{#if loan.status === 'out'}
										<div class="flex justify-end">
											<form
												method="POST"
												action="?/returnLoan"
												use:enhance={() => {
													returning = loan.id;
													return async ({ result }) => {
														returning = null;
														if (result.type !== 'success') return applyAction(result);
														const returned = result.data?.returnedLoan as Loan | undefined;
														if (returned) {
															loans = replaceRow(loans, loanKey, loan.id, returned);
															books = {
																...books,
																rows: books.rows.map((b) =>
																	b.id === returned.book_id
																		? {
																				...b,
																				available_copies: Math.min(
																					b.total_copies,
																					b.available_copies + 1
																				)
																			}
																		: b
																)
															};
															toast.success('The book is back on the shelf.');
														}
													};
												}}
											>
												<input type="hidden" name="id" value={loan.id} />
												<Button
													type="submit"
													size="sm"
													variant="ghost"
													loading={returning === loan.id}
													disabled={returning === loan.id}
												>
													<Icon icon={ArrowTurnBackwardIcon} class="size-4" />
													Return
												</Button>
											</form>
										</div>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if canLoadMore(loans)}
				<form
					method="POST"
					action="?/moreLoans"
					class="mt-4 flex justify-center"
					use:enhance={() => {
						loadingLoans = true;
						return async ({ result }) => {
							loadingLoans = false;
							if (result.type !== 'success') return applyAction(result);
							const next = result.data?.moreLoans as Paged<Loan> | undefined;
							if (next) loans = appendPage(loans, next, loanKey);
						};
					}}
				>
					<input type="hidden" name="cursor" value={loans.cursor} />
					<input type="hidden" name="status" value={data.status} />
					<input type="hidden" name="student" value={data.studentId} />
					<Button type="submit" variant="secondary" loading={loadingLoans} disabled={loadingLoans}>
						<Icon icon={ArrowDown01Icon} class="size-4" />
						Load more loans
					</Button>
				</form>
			{/if}
		{/if}
	</div>
</section>
