# lms-web

SvelteKit frontend for a multi-tenant learning management system.

It owns presentation. [`lms-api`](../lms-api) owns the domain. The seam between them is that API's generated OpenAPI 3.1 document, from which this app generates a fully typed client — so a breaking change upstream fails `pnpm check` here rather than in production.

## Requirements

Node 24, pnpm 11. A running `lms-api` on `http://localhost:8080`, which `vite.config.ts` proxies to `/api`. Override with `LMS_API_URL`.

## Getting started

```bash
pnpm install
pnpm gen:api        # generate the typed client from ../lms-api's spec
pnpm dev
```

The home page renders the live state of `lms-api`. With the API stopped it reports _unreachable_ and still returns HTTP 200 — the API going down degrades the page, it does not crash it.

## The typed API client

```bash
cd ../lms-api && make spec    # writes bin/openapi.json
cd ../lms-web  && pnpm gen:api
```

`src/lib/api/schema.d.ts` is generated and gitignored; never hand-edit it. Everything reaching `lms-api` goes through `src/lib/server/api.ts`. A raw `fetch()` to the API from a component is a rejection.

Every call is made from the server. Authenticated reads have no choice — the access token lives in an httpOnly cookie so that no script in the page can read it — and the anonymous reads follow, because what `lms-api` returns depends on whether a token accompanied the request. There is no browser-side API client.

## How a workspace is addressed

`lms-api` resolves the workspace from the `Host` header: it strips the port and takes the first label as the subdomain, or matches a custom domain. The host a request arrives on decides which workspace answers it.

So this app and the API share an origin, and the edge routes between them:

```
acme.lms.com/            → lms-web
acme.lms.com/api/v1/*    → lms-api   (strip /api, keep Host)
school.edu/api/v1/*      → lms-api   (a custom domain, same rule)
```

Three things follow. There is no cross-origin request, so no CORS and no preflight. `Host` arrives correct without anyone forwarding a header `lms-api` would have to be persuaded to trust. And a custom domain works the moment its DNS points at us.

`vite.config.ts` proxies `/api` to `http://localhost:8080` in development so the two environments differ in nothing that matters. It sets `changeOrigin: false` deliberately: rewriting `Host` to the target would make every request resolve the workspace named after `lms-api`'s own address.

Calling `lms-api` on an internal address instead, while overriding `Host`, is not an option — `Host` is a forbidden header name for `fetch`, and Node drops it silently. A request that went that way would resolve the wrong workspace, or none, and nothing would say so.

Behind a TLS-terminating edge, set `ORIGIN` (or `PROTOCOL_HEADER`/`HOST_HEADER`) for `adapter-node`, or `url.origin` will be `http://` and every API call this app makes will address the wrong scheme.

## Development

```bash
pnpm check          # svelte-check + tsc
pnpm lint           # prettier + eslint
pnpm test           # unit tests, then end-to-end
pnpm test:unit      # vitest
pnpm test:e2e       # playwright
pnpm build
```

## CI

`.github/workflows/ci.yml` checks out both repos side by side, because that is how they sit on a developer's disk: the typed client is generated from `lms-api`'s spec, and the end-to-end suite starts `lms-api` and its worker from `../lms-api`.

It then runs `pnpm lint`, `pnpm check`, the unit tests, and the full Playwright suite against a real Postgres 17 — whose `lms` role is `NOSUPERUSER NOBYPASSRLS`, so the tenant isolation those tests rely on is actually enforced.

## End-to-end tests

```bash
cd ../lms-api && make db-create && make migrate && make seed
cd ../lms-web && pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright starts `lms-api`, its job worker, and this app. Postgres is the one thing it does not bring up.

They run against `lms_test`, not the development database, because they register the workspace's owner — which only works while the workspace is unclaimed. The first run claims it; every run after signs in.

A student is provisioned by invitation, because that is the only way to join a workspace. `lms-api` mails the link and returns it to nobody, so the worker runs with `LMS_MAIL_FILE` set and the setup reads the link out of that file. It is the same path a real student walks.

The suite covers the boundaries that are expensive to get wrong: a draft is invisible to strangers and 404 by its own address; a preview lesson is readable and a gated one is 404, never 403; the authoring pages are forbidden to a student rather than merely ineffective; enrolling opens the gated lesson and completing every lesson reaches 100%; and `forgot-password` says the same thing about an address that exists and one that does not.

## Stack

Svelte 5 (runes) · SvelteKit 2 · TypeScript strict · Tailwind 4 (configured in CSS, no `tailwind.config.js`) · [`@lucide/svelte`](https://lucide.dev) icons · `openapi-fetch` + `openapi-typescript` · `adapter-node`.

Design tokens live in `src/routes/layout.css` under `@theme`. A colour hardcoded in a component is a colour that cannot be themed, and every tenant will want to theme.

## Errors

Nothing renders a blank screen and nothing renders a stack trace.

- `src/routes/+error.svelte` — distinguishes 404 from 5xx, and always offers a way out.
- `handleError` in `src/hooks.server.ts` — logs the real error against a correlation ID, returns only a safe shape. The ID is shown to the user so they can quote it.
- `src/error.html` — last resort for errors that escape the root layout. Depends on no bundle, no stylesheet, no font.

Accessibility is a build-time constraint, not a later ticket: WCAG 2.2 AA, verified contrast, keyboard reachable, `prefers-reduced-motion` and `prefers-color-scheme` honoured.

## Provenance

Scaffolded with the official Svelte CLI. To recreate the same configuration:

```sh
npx sv@0.16.2 create --template minimal --types ts \
  --add prettier eslint vitest="usages:unit" tailwindcss="plugins:none" sveltekit-adapter="adapter:node" \
  --no-download-check --no-install .
```

Note that current SvelteKit has no `svelte.config.js` — the adapter and `compilerOptions.runes` are configured through the `sveltekit()` plugin in `vite.config.ts`.

## Contributing

Read [GUIDELINES.md](GUIDELINES.md) first. It is the engineering contract, and a change that violates it should not merge.

## License

Not yet licensed.
