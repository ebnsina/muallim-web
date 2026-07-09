# lms-web

SvelteKit frontend for a multi-tenant learning management system.

It owns presentation. [`lms-api`](../lms-api) owns the domain. The seam between them is that API's generated OpenAPI 3.1 document, from which this app generates a fully typed client — so a breaking change upstream fails `pnpm check` here rather than in production.

## Requirements

Node 24, pnpm 11. A running `lms-api` on `http://localhost:8080`.

## Getting started

```bash
pnpm install
pnpm gen:api        # generate the typed client from ../lms-api's spec
pnpm dev
```

The home page renders the live state of `lms-api`. With the API stopped it reports *unreachable* and still returns HTTP 200 — the API going down degrades the page, it does not crash it.

## The typed API client

```bash
cd ../lms-api && make spec    # writes bin/openapi.json
cd ../lms-web  && pnpm gen:api
```

`src/lib/api/schema.d.ts` is generated and gitignored; never hand-edit it. Everything reaching `lms-api` goes through the client in `src/lib/api/`. A raw `fetch()` to the API from a component is a rejection.

## Development

```bash
pnpm check          # svelte-check + tsc
pnpm lint           # prettier + eslint
pnpm test           # vitest
pnpm build
```

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
