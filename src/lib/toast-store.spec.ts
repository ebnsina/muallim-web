import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast, VISIBLE } from './toast.svelte';

/*
	Named `toast-store.spec.ts` and not `toast.svelte.spec.ts`: the latter is
	excluded from the server project, which is where a store with no DOM belongs.
	The module under test keeps its `.svelte.ts` suffix, because that is what tells
	the compiler its `$state` is a rune and not a function nobody imported.
*/

describe('toast', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		for (const item of [...toast.toasts]) toast.dismiss(item.id);
	});

	afterEach(() => vi.useRealTimers());

	it('puts the newest at the front, because index 0 is the front of the stack', () => {
		toast.info('first');
		toast.info('second');

		expect(toast.toasts.map((t) => t.message)).toEqual(['second', 'first']);
	});

	it('dismisses itself when its time is up', () => {
		toast.success('saved', { duration: 1000 });
		expect(toast.toasts).toHaveLength(1);

		vi.advanceTimersByTime(999);
		expect(toast.toasts).toHaveLength(1);

		vi.advanceTimersByTime(1);
		expect(toast.toasts).toHaveLength(0);
	});

	// An error is a thing the reader may need to read twice.
	it('pins an error until it is dismissed', () => {
		const id = toast.danger('That question could not be saved.');

		vi.advanceTimersByTime(60_000);
		expect(toast.toasts).toHaveLength(1);

		toast.dismiss(id);
		expect(toast.toasts).toHaveLength(0);
	});

	/*
		The bug this guards: a toast that expires while the pointer is over the stack
		moves the dismiss button out from under the reader's cursor, and they click
		whatever slid into its place.
	*/
	it('banks the remaining time while paused, and does not resume early', () => {
		toast.info('hello', { duration: 1000 });

		vi.advanceTimersByTime(400);
		toast.pause();

		// Time passes with the pointer over the stack. Nothing expires.
		vi.advanceTimersByTime(10_000);
		expect(toast.toasts).toHaveLength(1);

		toast.resume();

		// Six hundred milliseconds were left, and six hundred are what remain.
		vi.advanceTimersByTime(599);
		expect(toast.toasts).toHaveLength(1);

		vi.advanceTimersByTime(1);
		expect(toast.toasts).toHaveLength(0);
	});

	it('a pinned toast survives pause and resume', () => {
		toast.danger('pinned');

		toast.pause();
		toast.resume();
		vi.advanceTimersByTime(60_000);

		expect(toast.toasts).toHaveLength(1);
	});

	// Dismissing must clear the timer, or a later toast reusing nothing at all still
	// leaves a callback that fires against an id that has gone.
	it('dismissing before the timer fires leaves nothing behind', () => {
		const id = toast.info('going', { duration: 1000 });
		toast.dismiss(id);

		expect(() => vi.advanceTimersByTime(2000)).not.toThrow();
		expect(toast.toasts).toHaveLength(0);
	});

	it('keeps every toast, and lets the view decide how many to draw', () => {
		for (let i = 0; i < VISIBLE + 2; i++) toast.info(`toast ${i}`, { duration: 0 });

		// The store is not a viewport. Dropping the overflow here would mean a toast
		// that never animated out, and a count the reader cannot reconcile.
		expect(toast.toasts).toHaveLength(VISIBLE + 2);
	});
});
