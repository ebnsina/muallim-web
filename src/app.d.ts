// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		/**
		 * The shape of `page.error`. `correlationId` is echoed by muallim-api on every
		 * response, so a user can quote it and we can find the matching log line.
		 */
		interface Error {
			message: string;
			correlationId?: string;
		}

		/**
		 * `accessToken` is resolved once per request in `hooks.server.ts`, and is
		 * null when there is no session. It never leaves the server: the token lives
		 * in an httpOnly cookie so that no script in the page can read it, and
		 * putting it in `PageData` would publish it into the HTML.
		 */
		interface Locals {
			accessToken: string | null;
		}

		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
