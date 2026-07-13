/*
	Keyset paging, as muallim-api hands it back: the rows, an opaque cursor for the
	next page, and whether there is one. There is no total, and there will not be —
	the API runs no `COUNT(*)`, so nothing here may claim "44 of 120".
*/
export interface Paged<T> {
	rows: T[];
	/** Opaque. It came from the API and it goes back to the API unread. */
	cursor?: string;
	hasMore: boolean;
}

/** A page as a list endpoint returns it. A null array is an empty one. */
export function pageOf<T>(
	rows: T[] | null | undefined,
	cursor: string | undefined,
	hasMore: boolean
): Paged<T> {
	return { rows: rows ?? [], cursor, hasMore };
}

/*
	The next page, appended to the ones already on screen. Keyed, because a row that
	arrives twice — a replayed cursor, a window that shifted under a keyset — must not
	be drawn twice, and because the rows already read must not move.
*/
export function appendPage<T>(page: Paged<T>, next: Paged<T>, key: (row: T) => string): Paged<T> {
	const seen = new Set(page.rows.map(key));

	return {
		rows: [...page.rows, ...next.rows.filter((row) => !seen.has(key(row)))],
		cursor: next.cursor,
		hasMore: next.hasMore
	};
}

/** Only a page that says there is more, and hands back the cursor to reach it. */
export function canLoadMore<T>(page: Paged<T>): boolean {
	return page.hasMore && Boolean(page.cursor);
}

/** One row replaced in place. The list does not re-order and nothing else moves. */
export function replaceRow<T>(
	page: Paged<T>,
	key: (row: T) => string,
	id: string,
	next: T
): Paged<T> {
	return { ...page, rows: page.rows.map((row) => (key(row) === id ? next : row)) };
}

/** One row gone. The cursor still stands: it is keyed on rows already passed. */
export function removeRow<T>(page: Paged<T>, key: (row: T) => string, id: string): Paged<T> {
	return { ...page, rows: page.rows.filter((row) => key(row) !== id) };
}
