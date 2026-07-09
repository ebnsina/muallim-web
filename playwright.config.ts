import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

/**
 * Where the worker writes mail. A test reads it to follow an invitation link;
 * there is no other way to accept one, because lms-api mails the token and
 * returns it to nobody.
 */
export const MAIL_FILE = path.resolve('e2e/.mail/mail.jsonl');

const API_URL = process.env.LMS_API_URL ?? 'http://localhost:8080';
const WEB_URL = 'http://localhost:5173';

/**
 * The database is the one thing these tests do not bring up. Everything else —
 * lms-api, its worker, and this app — starts here, so `pnpm test:e2e` is one
 * command against a Postgres that `make db-create && make migrate` has prepared.
 */
/**
 * These tests run against `lms_test`, not the development database.
 *
 * They register the workspace's owner, which only works while the workspace is
 * unclaimed — so they need a database that starts empty and stays theirs.
 * `make seed` prepares the `localhost` workspace in both.
 */
export const apiEnv = {
	LMS_ENV: 'development',
	LMS_DATABASE_URL:
		process.env.LMS_TEST_DATABASE_URL ??
		'postgres://lms:lms@localhost:5432/lms_test?sslmode=disable',
	LMS_JWT_SECRET: 'an-end-to-end-test-signing-secret-of-enough-bytes',
	LMS_LOG_LEVEL: 'warn',

	/*
		lms-api throttles anything that verifies a credential, because each Argon2id
		verification allocates 64 MiB and an unlimited login endpoint is a
		memory-exhaustion primitive. The default budget is ten attempts, and a suite
		that signs in from one address blows through it — the symptom is a page
		saying "Too many attempts", several tests in, at whichever one happens to be
		unlucky.

		Raised rather than disabled: the middleware still runs, and a test that
		wanted to assert on a 429 could still lower it.
	*/
	LMS_AUTH_RATE_BURST: '1000',
	LMS_AUTH_RATE_EVERY: '10ms'
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

	// One worker. These tests share a workspace: lms-api resolves it from the Host
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

	webServer: [
		{
			command: 'go run ./cmd/api',
			cwd: '../lms-api',
			url: `${API_URL}/v1/healthz`,
			env: apiEnv,
			timeout: 120_000,
			reuseExistingServer: !process.env.CI
		},
		{
			command: 'pnpm dev --port 5173',
			url: WEB_URL,
			timeout: 120_000,
			reuseExistingServer: !process.env.CI
		}
	]
});
