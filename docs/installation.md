# Installation

## Requirements

Node 24, pnpm 11. A running [`muallim-api`](../../muallim-api) on `http://localhost:8080`, which `vite.config.ts` proxies to `/api`. Override with `MUALLIM_API_URL`.

## Getting started

```bash
pnpm install
pnpm gen:api        # generate the typed client from ../muallim-api's spec
pnpm dev
```

The home page renders the live state of `muallim-api`. With the API stopped it reports _unreachable_ and still returns HTTP 200 — the API going down degrades the page, it does not crash it.

## The typed API client

```bash
cd ../muallim-api && make spec    # writes bin/openapi.json
cd ../muallim-web && pnpm gen:api
```

`src/lib/api/schema.d.ts` is generated and gitignored; never hand-edit it. A breaking change upstream fails `pnpm check` here rather than in production.

Everything reaching `muallim-api` goes through `src/lib/server/api.ts`. A raw `fetch()` to the API from a component is a rejection — see [architecture.md](architecture.md).

## Development

```bash
pnpm check          # svelte-check + tsc
pnpm lint           # prettier + eslint
pnpm test           # unit tests, then end-to-end
pnpm test:unit      # vitest
pnpm test:e2e       # playwright
pnpm build
```

End-to-end setup is in [testing.md](testing.md).

## Deployment

Behind a TLS-terminating edge, set `ORIGIN` (or `PROTOCOL_HEADER`/`HOST_HEADER`) for `adapter-node`, or `url.origin` will be `http://` and every API call this app makes will address the wrong scheme.

Running more than one replica requires the edge to hash the `muallim_rt` cookie — a correctness requirement, not a performance one. See [architecture.md](architecture.md#sessions-must-be-sticky).
