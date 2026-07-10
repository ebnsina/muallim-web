/**
 * Uploading a file to the object store, from the browser.
 *
 * The bytes never pass through lms-api and never pass through this server. The
 * API signs a URL that accepts exactly one object of exactly one size; the
 * browser PUTs to it; then the API is told the key, checks with the store what
 * is really there, and only then writes a row.
 *
 * That means the sequence is three requests, two of them to our own origin and
 * the middle one to somebody else's. This module owns the middle one and the
 * arithmetic around it. The pure parts are here so they can be tested without a
 * bucket, a browser, or a network.
 */

/** What `presign-upload` hands back, flattened to what `fetch` wants. */
export interface SignedUpload {
	upload_url: string;
	method: string;
	/** As Go writes them: one header name, many values. */
	headers: Record<string, string[]>;
	key: string;
}

/**
 * Header names `fetch` refuses to let a script set.
 *
 * The browser sets these itself, from the request it is actually making. Passing
 * them anyway is not an error — they are dropped in silence — but dropping them
 * here says out loud that they were never ours to send.
 *
 * This is what makes the size limit hold. `Content-Length` is inside the
 * signature, and the only value the browser will ever put there is the true
 * length of the body. A script cannot declare one size and send another, because
 * a script cannot declare a size at all.
 */
const BROWSER_OWNED = new Set(['content-length', 'host', 'connection', 'transfer-encoding']);

/**
 * The signed headers, as `fetch` wants them, minus the ones it will not take.
 *
 * Everything left is inside the signature. Dropping one, renaming one, or
 * changing a value produces a request the store refuses.
 */
export function flattenHeaders(headers: Record<string, string[]>): Record<string, string> {
	const flat: Record<string, string> = {};

	for (const [name, values] of Object.entries(headers)) {
		if (values.length === 0 || BROWSER_OWNED.has(name.toLowerCase())) continue;
		flat[name] = values.join(', ');
	}

	return flat;
}

/**
 * Bytes, as a person reads them.
 *
 * Powers of two, labelled with the units everyone actually uses. `KiB` is
 * correct and nobody wants it in a file list.
 */
export function formatBytes(bytes: number): string {
	if (bytes < 1000) return `${bytes} B`;

	const units = ['KB', 'MB', 'GB'];
	let value = bytes / 1024;
	let unit = 0;

	while (value >= 1000 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}

	// One decimal below ten — "1.4 MB" — and none above, because "14.3 MB" is
	// three digits of precision nobody is using.
	return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

export type DeadlineState = 'none' | 'open' | 'late' | 'closed';

/**
 * Where a learner stands against the deadline, from the same three facts the API
 * decides on. The API decides for real, in the transaction; this only chooses a
 * sentence.
 */
export function deadlineState(
	dueAt: string | null | undefined,
	allowLate: boolean,
	now: Date
): DeadlineState {
	if (!dueAt) return 'none';

	const due = new Date(dueAt);
	if (now <= due) return 'open';

	return allowLate ? 'late' : 'closed';
}

/**
 * Why a file cannot be uploaded, or null when it can.
 *
 * The store enforces the size and the API enforces the count; this is the same
 * refusal said early, in the page, before a learner watches a doomed upload run
 * to the end of a 25 MB progress bar.
 */
export function rejectFile(
	file: { name: string; size: number },
	limits: { maxBytes: number; maxFiles: number; attached: number }
): string | null {
	if (file.size === 0) return `${file.name} is empty.`;

	if (file.size > limits.maxBytes) {
		return `${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(limits.maxBytes)}.`;
	}

	if (limits.attached >= limits.maxFiles) {
		return `You may attach ${limits.maxFiles} ${limits.maxFiles === 1 ? 'file' : 'files'}.`;
	}

	return null;
}

/**
 * PUT one file to the store.
 *
 * No credentials: the signature is the credential, and it is in the URL. Sending
 * a cookie to a third-party origin because a same-origin call two lines up
 * needed one is how a session token ends up in somebody else's access log.
 */
export async function putToStore(upload: SignedUpload, file: File): Promise<void> {
	const response = await fetch(upload.upload_url, {
		method: upload.method,
		headers: flattenHeaders(upload.headers),
		body: file,
		credentials: 'omit',
		mode: 'cors'
	});

	if (!response.ok) {
		// The store's own body is XML addressed to a machine, and quoting it at a
		// learner tells them about our bucket. Whatever went wrong, no row was
		// written and nothing needs undoing.
		throw new Error(`${file.name} could not be uploaded.`);
	}
}
