import { describe, expect, it } from 'vitest';
import { singleFlight } from './single-flight';

/** A promise this test decides when to settle. */
function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

describe('singleFlight', () => {
	// The property the whole refresh design rests on. muallim-api rotates a refresh
	// token on every use and treats one presented twice as theft, revoking the
	// session family. Two callers arriving together must spend the token once.
	it('runs the work once for concurrent callers, and gives them all the same result', async () => {
		const inFlight = new Map<string, Promise<string>>();
		const gate = deferred<string>();
		let runs = 0;

		const work = () => {
			runs++;
			return gate.promise;
		};

		const callers = [
			singleFlight(inFlight, 'token', work),
			singleFlight(inFlight, 'token', work),
			singleFlight(inFlight, 'token', work)
		];

		expect(runs).toBe(1);

		gate.resolve('the-new-pair');
		expect(await Promise.all(callers)).toEqual(['the-new-pair', 'the-new-pair', 'the-new-pair']);
		expect(runs).toBe(1);
	});

	it('does not collapse callers with different keys', async () => {
		const inFlight = new Map<string, Promise<string>>();
		let runs = 0;

		const work = (value: string) => async () => {
			runs++;
			return value;
		};

		const [a, b] = await Promise.all([
			singleFlight(inFlight, 'one', work('a')),
			singleFlight(inFlight, 'two', work('b'))
		]);

		expect([a, b]).toEqual(['a', 'b']);
		expect(runs).toBe(2);
	});

	// A key held after the work settles would pin a spent refresh token forever,
	// and every later request would be handed a token muallim-api has already rotated
	// away — the exact reuse this exists to prevent.
	it('releases the key once the work settles, so a later caller runs again', async () => {
		const inFlight = new Map<string, Promise<number>>();
		let runs = 0;

		const work = async () => ++runs;

		expect(await singleFlight(inFlight, 'token', work)).toBe(1);
		expect(inFlight.size).toBe(0);

		expect(await singleFlight(inFlight, 'token', work)).toBe(2);
		expect(runs).toBe(2);
	});

	it('releases the key when the work rejects, and does not cache the failure', async () => {
		const inFlight = new Map<string, Promise<string>>();
		let runs = 0;

		const failing = async () => {
			runs++;
			throw new Error('muallim-api is down');
		};

		await expect(singleFlight(inFlight, 'token', failing)).rejects.toThrow('muallim-api is down');
		expect(inFlight.size).toBe(0);

		// The next caller must retry rather than inherit the old rejection.
		expect(await singleFlight(inFlight, 'token', async () => 'recovered')).toBe('recovered');
		expect(runs).toBe(1);
	});

	it('shares one rejection with every concurrent caller', async () => {
		const inFlight = new Map<string, Promise<string>>();
		const gate = deferred<string>();
		let runs = 0;

		const work = () => {
			runs++;
			return gate.promise;
		};

		const callers = [
			singleFlight(inFlight, 'token', work).catch((e: Error) => e.message),
			singleFlight(inFlight, 'token', work).catch((e: Error) => e.message)
		];

		gate.reject(new Error('refused'));
		expect(await Promise.all(callers)).toEqual(['refused', 'refused']);
		expect(runs).toBe(1);
	});

	// A synchronous throw must not leave the key registered, or the token would be
	// pinned to a promise nobody holds.
	it('does not register a key when the work throws synchronously', () => {
		const inFlight = new Map<string, Promise<never>>();

		expect(() =>
			singleFlight(inFlight, 'token', () => {
				throw new Error('constructed badly');
			})
		).toThrow('constructed badly');

		expect(inFlight.size).toBe(0);
	});
});
