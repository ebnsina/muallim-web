// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		/**
		 * The shape of `page.error`. `correlationId` is echoed by lms-api on every
		 * response, so a user can quote it and we can find the matching log line.
		 */
		interface Error {
			message: string;
			correlationId?: string;
		}

		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
