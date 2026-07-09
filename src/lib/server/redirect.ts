/**
 * Restricts a post-login redirect to a path on this site.
 *
 * An unchecked `?next=` is an open redirect: a link that lands on an attacker's
 * page having passed through ours, and looked legitimate the whole way. A
 * protocol-relative `//evil.test` is a URL rather than a path, which is the case
 * a leading-slash test alone would miss — and a backslash is folded to a slash
 * by some browsers, so `/\evil.test` is the same attack wearing a hat.
 *
 * Kept apart from `session.ts` so it can be tested without SvelteKit's ambient
 * modules, which is worth one file for a function whose failure mode is phishing.
 */
export function safeRedirect(next: string | null | undefined, fallback = '/dashboard'): string {
	if (!next) return fallback;
	if (!next.startsWith('/')) return fallback;
	if (next.startsWith('//')) return fallback;
	if (next.includes('\\')) return fallback;
	return next;
}
