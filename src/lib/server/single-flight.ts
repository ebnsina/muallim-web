/**
 * Collapses concurrent calls that share a key onto one execution.
 *
 * The caller that arrives first runs `work`; everyone arriving while it is still
 * pending receives the same promise, and therefore the same result. Once it
 * settles the key is released, so a later call runs afresh.
 *
 * This lives apart from `session.ts` so it can be tested without SvelteKit's
 * ambient modules. What it guards is not a performance problem: see the comment
 * on `refreshOnce`.
 */
export function singleFlight<T>(
	inFlight: Map<string, Promise<T>>,
	key: string,
	work: () => Promise<T>
): Promise<T> {
	const existing = inFlight.get(key);
	if (existing) return existing;

	// `work()` may throw synchronously; starting it inside the promise chain would
	// leave the key set forever. Calling it first means a throw propagates before
	// anything is registered.
	const pending = work().finally(() => {
		inFlight.delete(key);
	});

	inFlight.set(key, pending);
	return pending;
}
