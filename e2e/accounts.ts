import fs from 'node:fs';
import { MAIL_FILE } from '../playwright.config';

export const OWNER = {
	email: 'e2e-owner@example.test',
	name: 'E2E Owner',
	password: 'an-end-to-end-owner-password'
} as const;

/**
 * A fresh address each run. An invitation to an address that is already a member
 * is refused, so reusing one would make the second run depend on the first.
 */
export const STUDENT = {
	email: `e2e-student-${process.env.E2E_RUN_ID ?? Date.now()}@example.test`,
	name: 'E2E Student',
	password: 'an-end-to-end-student-password'
} as const;

export const OWNER_STATE = 'e2e/.auth/owner.json';
export const STUDENT_STATE = 'e2e/.auth/student.json';

/** A message as the file mailer wrote it. */
interface Mail {
	to: string;
	subject: string;
	text: string;
}

/** Every message delivered so far. Absent file means nothing has been sent yet. */
function mailbox(): Mail[] {
	if (!fs.existsSync(MAIL_FILE)) return [];

	return fs
		.readFileSync(MAIL_FILE, 'utf8')
		.split('\n')
		.filter(Boolean)
		.map((line) => JSON.parse(line) as Mail);
}

/**
 * Waits for a message to `to` carrying a link, and returns that link.
 *
 * Mail is delivered by a River job, so it arrives some time after the request
 * that queued it returned. Polling the file is how a test observes the same
 * thing a person would: the link showed up in the inbox.
 */
export async function waitForLink(to: string, path: string, timeoutMs = 20_000): Promise<string> {
	const deadline = Date.now() + timeoutMs;
	const pattern = new RegExp(`http://[^\\s]*${path}\\?token=[A-Za-z0-9_-]+`);

	while (Date.now() < deadline) {
		for (const mail of mailbox().reverse()) {
			if (mail.to !== to) continue;

			const found = mail.text.match(pattern);
			if (found) return found[0];
		}
		await new Promise((resolve) => setTimeout(resolve, 200));
	}

	throw new Error(
		`no mail to ${to} containing a ${path} link within ${timeoutMs}ms. ` +
			`Is cmd/worker running, and is LMS_MAIL_FILE set? Mailbox holds ${mailbox().length} messages.`
	);
}

/** The `token` query parameter of a link. */
export function tokenOf(link: string): string {
	const token = new URL(link).searchParams.get('token');
	if (!token) throw new Error(`link carries no token: ${link}`);
	return token;
}
