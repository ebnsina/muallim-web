import { describe, expect, it } from 'vitest';
import { appendPage, canLoadMore, pageOf, removeRow, replaceRow, type Paged } from './paging';

interface Row {
	id: string;
	name: string;
}

const key = (row: Row) => row.id;
const row = (id: string, name = id): Row => ({ id, name });

describe('pageOf', () => {
	it('carries the rows, the cursor and whether there is more', () => {
		expect(pageOf([row('a')], 'c1', true)).toEqual({
			rows: [row('a')],
			cursor: 'c1',
			hasMore: true
		});
	});

	it('treats a null list as an empty one — the API sends null, not []', () => {
		expect(pageOf<Row>(null, undefined, false).rows).toEqual([]);
		expect(pageOf<Row>(undefined, undefined, false).rows).toEqual([]);
	});
});

describe('appendPage', () => {
	it('appends the next page after the rows already read, in order', () => {
		const first: Paged<Row> = pageOf([row('a'), row('b')], 'c1', true);
		const next = appendPage(first, pageOf([row('c'), row('d')], 'c2', true), key);

		expect(next.rows.map(key)).toEqual(['a', 'b', 'c', 'd']);
		expect(next.cursor).toBe('c2');
		expect(next.hasMore).toBe(true);
	});

	it('never draws a row twice, however the window shifted', () => {
		const first = pageOf([row('a'), row('b')], 'c1', true);
		const next = appendPage(first, pageOf([row('b'), row('c')], 'c2', false), key);

		expect(next.rows.map(key)).toEqual(['a', 'b', 'c']);
	});

	it('does not move or re-order the rows already on screen', () => {
		const first = pageOf([row('a', 'Ada'), row('b', 'Bo')], 'c1', true);
		const next = appendPage(first, pageOf([row('a', 'RENAMED'), row('c')], undefined, false), key);

		expect(next.rows.slice(0, 2)).toEqual(first.rows);
	});

	it('takes the last page: no cursor, no more', () => {
		const next = appendPage(
			pageOf([row('a')], 'c1', true),
			pageOf([row('b')], undefined, false),
			key
		);

		expect(next.hasMore).toBe(false);
		expect(next.cursor).toBeUndefined();
	});
});

describe('canLoadMore', () => {
	it('needs both a promise of more and the cursor to reach it', () => {
		expect(canLoadMore(pageOf([row('a')], 'c1', true))).toBe(true);
		expect(canLoadMore(pageOf([row('a')], undefined, true))).toBe(false);
		expect(canLoadMore(pageOf([row('a')], 'c1', false))).toBe(false);
	});
});

describe('replaceRow', () => {
	it('replaces one row where it stands', () => {
		const page = pageOf([row('a'), row('b')], 'c1', true);
		const next = replaceRow(page, key, 'b', row('b', 'Bo'));

		expect(next.rows).toEqual([row('a'), row('b', 'Bo')]);
		expect(next.cursor).toBe('c1');
	});

	it('leaves a list that does not hold the row alone', () => {
		const page = pageOf([row('a')], undefined, false);
		expect(replaceRow(page, key, 'z', row('z')).rows).toEqual([row('a')]);
	});
});

describe('removeRow', () => {
	it('drops one row and keeps the cursor — it is keyed on rows already passed', () => {
		const page = pageOf([row('a'), row('b')], 'c1', true);
		const next = removeRow(page, key, 'a');

		expect(next.rows).toEqual([row('b')]);
		expect(next.cursor).toBe('c1');
		expect(next.hasMore).toBe(true);
	});
});
