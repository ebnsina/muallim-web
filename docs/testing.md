# Testing

```bash
pnpm test:unit      # vitest
pnpm test:e2e       # playwright
pnpm test           # both
```

## End-to-end

```bash
cd ../muallim-api && make db-create && make migrate && make seed && make storage-up
cd ../muallim-web && pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright starts `muallim-api`, its job worker, and this app. Postgres and MinIO are the two things it does not bring up — `make storage-up` starts MinIO on `:9002`, and without it every assignment upload fails.

It runs on `:8081` and `:5174`, not the development ports, and it never reuses a server that is already listening. `muallim_test` holds no demo accounts, so an end-to-end API left answering on `:8080` would tell you the credentials `make seed` printed were wrong. Development and the suite can run side by side.

They run against `muallim_test`, not the development database, because they register the workspace's owner — which only works while the workspace is unclaimed. The first run claims it; every run after signs in.

A student is provisioned by invitation, because that is the only way to join a workspace. `muallim-api` mails the link and returns it to nobody, so the worker runs with `MUALLIM_MAIL_FILE` set and the setup reads the link out of that file. It is the same path a real student walks.

## What the suite covers

The boundaries that are expensive to get wrong: a draft is invisible to strangers and 404 by its own address; a preview lesson is readable and a gated one is 404, never 403; the authoring pages are forbidden to a student rather than merely ineffective; enrolling opens the gated lesson and completing every lesson reaches 100%; and `forgot-password` says the same thing about an address that exists and one that does not.

`assignment.spec.ts` covers the one leg nothing else can. A learner's browser PUTs the file straight to the object store, on another origin, with a URL `muallim-api` signed and a `Content-Length` the browser fills in itself — a header a script is forbidden to set, which is exactly what makes the signed size a limit rather than a suggestion. No unit test can see that, and neither can a Go test.

## CI

`.github/workflows/ci.yml` checks out both repos side by side, because that is how they sit on a developer's disk: the typed client is generated from `muallim-api`'s spec, and the end-to-end suite starts `muallim-api` and its worker from `../muallim-api`.

It then runs `pnpm lint`, `pnpm check`, the unit tests, and the full Playwright suite against a real Postgres 17 — whose `muallim` role is `NOSUPERUSER NOBYPASSRLS`, so the tenant isolation those tests rely on is actually enforced.
