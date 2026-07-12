# muallim-web

SvelteKit frontend for a multi-tenant learning management system.

It owns presentation. [`muallim-api`](../muallim-api) owns the domain. The seam between them is that API's generated OpenAPI 3.1 document, from which this app generates a fully typed client — so a breaking change upstream fails `pnpm check` here rather than in production.

## Stack

Svelte 5 (runes) · SvelteKit 2 · TypeScript strict · Tailwind 4 · `openapi-fetch` + `openapi-typescript` · `adapter-node`.

## Quickstart

Needs a running `muallim-api` on `http://localhost:8080`, which `vite.config.ts` proxies to `/api`.

```bash
pnpm install
pnpm gen:api        # generate the typed client from ../muallim-api's spec
pnpm dev
```

Full setup, development commands, and deployment notes are in [docs/installation.md](docs/installation.md).

## Documentation

- [Installation](docs/installation.md) — requirements, setup, the typed client, development, deployment
- [Architecture](docs/architecture.md) — server-only API calls, how a workspace is addressed, sticky sessions, errors
- [Frontend](docs/frontend.md) — stack, design tokens, accessibility, provenance
- [Testing](docs/testing.md) — unit and end-to-end suites, what they cover, CI
- [GUIDELINES.md](GUIDELINES.md) — the engineering contract

## Contributing

Read [GUIDELINES.md](GUIDELINES.md) first. It is the engineering contract, and a change that violates it should not merge.

## License

Not yet licensed.
