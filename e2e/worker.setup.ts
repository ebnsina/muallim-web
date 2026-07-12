import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { apiEnv, MAIL_FILE } from '../playwright.config';

/**
 * Starts `muallim-api`'s job worker for the duration of the run, and returns the
 * function Playwright calls to stop it.
 *
 * The worker delivers the invitation email that `global.setup.ts` reads to
 * provision a student. Without it the invitation sits in `river_job` forever and
 * the setup times out waiting for a link that never arrives.
 */
export default async function globalSetup() {
	// Stamped once, here, before any worker process is forked, so every spec that
	// imports `STUDENT` agrees on the address. A per-module `Date.now()` would
	// give each worker its own.
	process.env.E2E_RUN_ID ??= String(Date.now());

	// Truncated, not appended to. A previous run's invitation link is expired and
	// would be found first.
	fs.mkdirSync(path.dirname(MAIL_FILE), { recursive: true });
	fs.writeFileSync(MAIL_FILE, '');

	const worker = spawn('go', ['run', './cmd/worker'], {
		cwd: path.resolve('../muallim-api'),
		env: { ...process.env, ...apiEnv, MUALLIM_MAIL_FILE: MAIL_FILE },
		stdio: 'ignore',
		// Its own process group, so the kill below reaches `go run`'s child too —
		// `go run` compiles to a temporary binary and execs it, and killing the
		// parent leaves that binary running and holding the queue.
		detached: true
	});

	worker.unref();

	return () => {
		if (worker.pid) {
			try {
				process.kill(-worker.pid, 'SIGTERM');
			} catch {
				// Already gone. Nothing to do, and nothing worth failing a run over.
			}
		}
	};
}
