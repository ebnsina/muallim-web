import { DURATION } from '$lib/motion';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface Toast {
	id: number;
	tone: ToastTone;
	title?: string;
	message: string;
	/** Milliseconds. `0` pins it until the reader dismisses it. */
	duration: number;
}

interface ToastOptions {
	title?: string;
	duration?: number;
}

/** How many are drawn at once. The rest wait behind the stack. */
export const VISIBLE = 3;

/*
	Long enough to read a sentence, and no longer. A notice that outstays the
	action it describes is a notice the reader learns to ignore.
*/
const DEFAULT_DURATION = 4500;

class Toaster {
	toasts = $state<Toast[]>([]);

	#nextId = 0;
	#timers = new Map<number, ReturnType<typeof setTimeout>>();
	#remaining = new Map<number, number>();
	#startedAt = new Map<number, number>();

	/**
	 * Newest first, so index 0 is the front of the stack. The array order *is* the
	 * z-order and the scale, which is why nothing else may reorder it.
	 */
	push(
		tone: ToastTone,
		message: string,
		{ title, duration = DEFAULT_DURATION }: ToastOptions = {}
	) {
		const id = this.#nextId++;

		this.toasts = [{ id, tone, title, message, duration }, ...this.toasts];
		if (duration > 0) this.#arm(id, duration);

		return id;
	}

	info = (message: string, options?: ToastOptions) => this.push('info', message, options);
	success = (message: string, options?: ToastOptions) => this.push('success', message, options);
	warning = (message: string, options?: ToastOptions) => this.push('warning', message, options);

	/**
	 * An error toast is pinned by default. A message that says what went wrong is
	 * one the reader may need to read twice, and it should not vanish while they do.
	 */
	danger = (message: string, options?: ToastOptions) =>
		this.push('danger', message, { duration: 0, ...options });

	dismiss(id: number) {
		this.#disarm(id);
		this.#remaining.delete(id);
		this.toasts = this.toasts.filter((toast) => toast.id !== id);
	}

	/**
	 * Pauses every countdown, banking what was left of each.
	 *
	 * Called when the pointer enters the stack or focus lands inside it. A toast
	 * that expired while the reader was reaching for its dismiss button is a toast
	 * that moved the button out from under them.
	 */
	pause() {
		for (const [id, timer] of this.#timers) {
			clearTimeout(timer);

			const elapsed = Date.now() - (this.#startedAt.get(id) ?? Date.now());
			this.#remaining.set(id, Math.max(0, (this.#remaining.get(id) ?? 0) - elapsed));
		}
		this.#timers.clear();
	}

	/** Restarts each countdown from what was banked. */
	resume() {
		for (const [id, left] of this.#remaining) {
			if (left > 0) this.#arm(id, left);
		}
	}

	#arm(id: number, duration: number) {
		this.#remaining.set(id, duration);
		this.#startedAt.set(id, Date.now());
		this.#timers.set(
			id,
			setTimeout(() => this.dismiss(id), duration)
		);
	}

	#disarm(id: number) {
		const timer = this.#timers.get(id);
		if (timer !== undefined) clearTimeout(timer);

		this.#timers.delete(id);
		this.#startedAt.delete(id);
	}
}

/*
	One instance for the app.

	A module-level singleton is a shared mutable value, which on a SvelteKit server
	would leak one request's notices into another's. This is only ever read by
	Toaster, which runs in the browser, and only ever written from an event handler
	— which also runs in the browser. Anything that wanted to raise a toast during
	SSR would be raising it for whoever loads the page next.
*/
export const toast = new Toaster();

/** Exported so Toaster and its tests agree on the timings. */
export const TOAST_MOTION = DURATION;
