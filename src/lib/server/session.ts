import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { serverApi } from './api';

/**
 * The session lives in two httpOnly cookies, written by this server and never
 * readable by a script in the page. lms-api returns its tokens in a response
 * body because it also serves a mobile app and a WordPress plugin; a browser
 * client should not keep them anywhere JavaScript can reach.
 */
const ACCESS_COOKIE = 'lms_at';
const REFRESH_COOKIE = 'lms_rt';

/** Matches lms-api's RefreshTokenTTL. */
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Shaved off the access cookie's lifetime so the cookie expires slightly before
 * the token it holds. Otherwise a request lands in the window where we still
 * believe the token is good and lms-api has already stopped accepting it, which
 * surfaces as a spurious 401 rather than a refresh.
 */
const EXPIRY_SKEW_SECONDS = 30;

export interface Tokens {
	access_token: string;
	refresh_token: string;
	expires_in: number;
}

/**
 * `lax` rather than `strict`: every link this system mails — verify an address,
 * reset a password, accept an invitation — is a top-level navigation from
 * another origin, and `strict` would withhold the session on arrival.
 */
function cookieOptions(maxAge: number) {
	return {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		maxAge
	} as const;
}

export function setSession(cookies: Cookies, tokens: Tokens): void {
	cookies.set(
		ACCESS_COOKIE,
		tokens.access_token,
		cookieOptions(Math.max(1, tokens.expires_in - EXPIRY_SKEW_SECONDS))
	);
	cookies.set(REFRESH_COOKIE, tokens.refresh_token, cookieOptions(REFRESH_MAX_AGE));
}

export function clearSession(cookies: Cookies): void {
	cookies.delete(ACCESS_COOKIE, { path: '/' });
	cookies.delete(REFRESH_COOKIE, { path: '/' });
}

/**
 * In-flight refreshes, keyed by the refresh token being spent.
 *
 * This is not an optimisation. lms-api rotates a refresh token on every use and
 * treats a token presented twice as theft — it revokes the entire session
 * family, logging the user out of every device. Two requests arriving together
 * with the same expired access cookie would each try to spend the same refresh
 * token, and the second would look exactly like a stolen one.
 *
 * Collapsing them means the token is spent once and both requests get the same
 * new pair. Across several Node replicas the race returns, because this map is
 * per process; a shared lock is the fix if that day comes.
 */
const inFlight = new Map<string, Promise<Tokens | null>>();

function refreshOnce(origin: string, refreshToken: string): Promise<Tokens | null> {
	// Keyed on the token alone. A refresh token is 256 bits of entropy issued by
	// one workspace, so it cannot collide across origins.
	const existing = inFlight.get(refreshToken);
	if (existing) return existing;

	const pending = exchangeRefreshToken(origin, refreshToken).finally(() => {
		inFlight.delete(refreshToken);
	});

	inFlight.set(refreshToken, pending);
	return pending;
}

/**
 * Trades a refresh token for a new pair. Returns null when the session is over —
 * expired, revoked, or detected as reused. All three look the same to us, which
 * is deliberate on the API's side: telling the bearer of a stolen token that we
 * spotted the theft tells the thief.
 */
async function exchangeRefreshToken(origin: string, refreshToken: string): Promise<Tokens | null> {
	try {
		const { data } = await serverApi(origin).POST('/v1/auth/refresh', {
			body: { refresh_token: refreshToken }
		});
		return data ? (data as Tokens) : null;
	} catch {
		// lms-api is unreachable. Treat it as no session rather than a crash: the
		// visitor sees a login page instead of a 500.
		return null;
	}
}

/**
 * Returns a usable access token, refreshing when the old one has expired, or
 * null when there is no session.
 *
 * Called once per request from `handle`, which is the single point where a
 * refresh can happen — and therefore the only place the rotation race above has
 * to be defended.
 */
export async function resolveAccessToken(cookies: Cookies, origin: string): Promise<string | null> {
	const access = cookies.get(ACCESS_COOKIE);
	if (access) return access;

	const refresh = cookies.get(REFRESH_COOKIE);
	if (!refresh) return null;

	const tokens = await refreshOnce(origin, refresh);
	if (!tokens) {
		clearSession(cookies);
		return null;
	}

	setSession(cookies, tokens);
	return tokens.access_token;
}

export { safeRedirect } from './redirect';
