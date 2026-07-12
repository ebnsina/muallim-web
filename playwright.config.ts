import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

/**
 * Where the worker writes mail. A test reads it to follow an invitation link;
 * there is no other way to accept one, because muallim-api mails the token and
 * returns it to nobody.
 */
export const MAIL_FILE = path.resolve('e2e/.mail/mail.jsonl');

/*
	Ports of their own, never the development ones.

	`make run` puts muallim-api on :8080 against `muallim`, and `pnpm dev` puts this app on
	:5173. These tests run against `muallim_test`, which holds no demo accounts at all.
	Sharing a port meant one of two failures, depending on who started first: the
	suite quietly ran against the development database, or it left an API on :8080
	answering for `muallim_test` — where `demo@muallim.test` does not exist, so signing
	in with the credentials `make seed` printed said the credentials were wrong.

	Neither is a thing anyone should have to diagnose. They are different servers
	on different databases, so they get different ports.
*/
const API_URL = process.env.MUALLIM_API_URL ?? 'http://localhost:8081';
const WEB_URL = 'http://localhost:5174';

/**
 * The database is the one thing these tests do not bring up. Everything else —
 * muallim-api, its worker, and this app — starts here, so `pnpm test:e2e` is one
 * command against a Postgres that `make db-create && make migrate` has prepared.
 */
/**
 * These tests run against `muallim_test`, not the development database.
 *
 * They register the workspace's owner, which only works while the workspace is
 * unclaimed — so they need a database that starts empty and stays theirs.
 * `make seed` prepares the `localhost` workspace in both.
 */
export const apiEnv = {
	MUALLIM_ENV: 'development',
	MUALLIM_DATABASE_URL:
		process.env.MUALLIM_TEST_DATABASE_URL ??
		'postgres://muallim:muallim@localhost:5432/muallim_test?sslmode=disable',
	MUALLIM_ADDR: ':8081',
	MUALLIM_JWT_SECRET: 'an-end-to-end-test-signing-secret-of-enough-bytes',
	MUALLIM_LOG_LEVEL: 'warn',

	/*
		muallim-api throttles anything that verifies a credential, because each Argon2id
		verification allocates 64 MiB and an unlimited login endpoint is a
		memory-exhaustion primitive. The default budget is ten attempts, and a suite
		that signs in from one address blows through it — the symptom is a page
		saying "Too many attempts", several tests in, at whichever one happens to be
		unlucky.

		Raised rather than disabled: the middleware still runs, and a test that
		wanted to assert on a 429 could still lower it.
	*/
	MUALLIM_AUTH_RATE_BURST: '1000',
	MUALLIM_AUTH_RATE_EVERY: '10ms',

	/*
		The `embed` video source renders an author's own URL, so it is off unless a
		deployment names the hosts it trusts. Naming one here is what lets the suite
		assert that every other host is refused — with an empty allowlist the source
		is simply unavailable, and "refused because unconfigured" would pass a test
		meant to prove "refused because unlisted".
	*/
	MUALLIM_EMBED_ALLOWED_HOSTS: 'player.example.test',

	/*
		The object store. Without it muallim-api refuses every upload with a 503, and the
		assignment suite fails for a reason that has nothing to do with the browser.

		This is the MinIO `make storage-up` starts, and the same bucket the Go tests
		use. They do not collide: every object key begins with a workspace id.
	*/
	MUALLIM_S3_ENDPOINT: process.env.MUALLIM_TEST_S3_ENDPOINT ?? 'http://localhost:9002',
	MUALLIM_S3_BUCKET: 'muallim-uploads',
	MUALLIM_S3_ACCESS_KEY: 'muallim',
	MUALLIM_S3_SECRET_KEY: 'muallim-secret-key',
	MUALLIM_S3_REGION: 'auto',
	MUALLIM_S3_PATH_STYLE: 'true'
};

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,

	/*
		The worker is started here rather than as a `webServer`, because it listens
		on nothing: `webServer` identifies a process by the URL it answers, and
		giving the worker the API's URL would make Playwright find the API already
		up and never start the worker at all.
	*/
	globalSetup: './e2e/worker.setup.ts',

	// One worker. These tests share a workspace: muallim-api resolves it from the Host
	// header, and there is only one host. They create uniquely named courses and
	// accounts rather than pretending to be isolated.
	workers: 1,

	/*
		On CI, annotate the diff *and* write a report worth downloading. The github
		reporter alone leaves the upload step with nothing to collect, and a failing
		end-to-end test is exactly when someone wants the trace.
	*/
	reporter: process.env.CI
		? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
		: 'list',

	/*
		Ten seconds, not the default five. Every sign-in costs an Argon2id
		verification, which allocates 64 MiB and is slow by design — that is what
		makes an offline attack expensive. A test that signs in while the worker is
		also hashing occasionally needs longer than five seconds, and a flaky suite
		teaches people to rerun it rather than read it.
	*/
	expect: { timeout: 10_000 },
	use: { baseURL: WEB_URL, trace: 'retain-on-failure', actionTimeout: 10_000 },

	projects: [
		{ name: 'setup', testMatch: /global\.setup\.ts/ },
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			dependencies: ['setup']
		}
	],

	/*
		Never reused, on CI or off it.

		A server already answering on this port was started by someone else, with
		someone else's environment — a different database, a different signing key,
		a different object store. Reusing it saves ten seconds and spends them again
		the first time somebody wonders why a test that passes alone fails in company.
	*/
	webServer: [
		{
			command: 'go run ./cmd/api',
			cwd: '../muallim-api',
			url: `${API_URL}/v1/healthz`,
			env: apiEnv,
			timeout: 120_000,
			reuseExistingServer: false
		},
		{
			command: 'pnpm dev --port 5174',
			url: WEB_URL,
			env: { ...process.env, MUALLIM_API_URL: API_URL },
			timeout: 120_000,
			reuseExistingServer: false
		}
	]
});
