/**
 * The accounts `make seed` writes into the development database, for the buttons
 * that fill the login form while somebody is working on it.
 *
 * In `$lib/server`, which is the guarantee. SvelteKit refuses to import anything
 * under that path into client code — a build error, not a lint rule — so this
 * password cannot reach a browser by being referenced from the wrong file.
 *
 * A `{#if dev}` around a client-side import does work: `dev` folds to `false` and
 * the module is shaken out, which was measured rather than assumed. It just
 * cannot be relied on. It holds because nothing else in the page happens to
 * reference the module, and the day something does — a type import that stops
 * being a type, a helper pulled out to be shared — the branch stops rendering and
 * the password ships anyway, silently, with no failing test to say so.
 *
 * The boundary does not depend on what a bundler noticed. `demoAccounts()`
 * returns nothing outside development, so the page has nothing to render even if
 * somebody deletes the `{#if}` in front of it.
 */
import { dev } from '$app/environment';
export interface DemoAccount {
	email: string;
	password: string;
	/** What this account is for, in the words the seeder uses. */
	role: string;
}

const PASSWORD = 'demo-password-please-change';

const ACCOUNTS: DemoAccount[] = [
	{ email: 'demo@muallim.test', password: PASSWORD, role: 'Owner' },
	{ email: 'instructor@muallim.test', password: PASSWORD, role: 'Instructor' },
	{ email: 'marker@muallim.test', password: PASSWORD, role: 'Marker' },
	{ email: 'student@muallim.test', password: PASSWORD, role: 'Student' }
];

/** The seeded accounts in development, and an empty list everywhere else. */
export function demoAccounts(): DemoAccount[] {
	return dev ? ACCOUNTS : [];
}
