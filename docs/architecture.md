# Architecture

This app owns presentation. [`muallim-api`](../../muallim-api) owns the domain. The seam between them is that API's generated OpenAPI 3.1 document. `GUIDELINES.md` is the engineering contract; this document is how the two halves fit together.

## Every call is made from the server

Everything reaching `muallim-api` goes through `src/lib/server/api.ts`. A raw `fetch()` to the API from a component is a rejection.

Authenticated reads have no choice — the access token lives in an httpOnly cookie so that no script in the page can read it — and the anonymous reads follow, because what `muallim-api` returns depends on whether a token accompanied the request: an author sees drafts, an enrolled learner sees lesson bodies. There is no browser-side API client.

## How a workspace is addressed

`muallim-api` resolves the workspace from the `Host` header: it strips the port and takes the first label as the subdomain, or matches a custom domain. The host a request arrives on decides which workspace answers it.

So this app and the API share an origin, and the edge routes between them:

```
acme.muallim.com/            → muallim-web
acme.muallim.com/api/v1/*    → muallim-api   (strip /api, keep Host)
school.edu/api/v1/*          → muallim-api   (a custom domain, same rule)
```

Three things follow. There is no cross-origin request, so no CORS and no preflight. `Host` arrives correct without anyone forwarding a header `muallim-api` would have to be persuaded to trust. And a custom domain works the moment its DNS points at us.

`vite.config.ts` proxies `/api` to `http://localhost:8080` in development so the two environments differ in nothing that matters. It sets `changeOrigin: false` deliberately: rewriting `Host` to the target would make every request resolve the workspace named after `muallim-api`'s own address.

Calling `muallim-api` on an internal address instead, while overriding `Host`, is not an option — `Host` is a forbidden header name for `fetch`, and Node drops it silently. A request that went that way would resolve the wrong workspace, or none, and nothing would say so.

## Sessions must be sticky

**Running more than one replica requires the edge to route a browser to one of them, by hashing the `muallim_rt` cookie.** This is a correctness requirement, not a performance one.

`muallim-api` rotates a refresh token on every use, and treats a token presented twice as theft: it revokes the whole session family and logs the user out of every device. Two requests arriving together with the same expired access cookie — two tabs, a prefetch, a page and its subresource — each try to spend the same refresh token, and the second looks exactly like a stolen one.

`hooks.server.ts` is the only place a refresh happens, and it collapses concurrent attempts onto a single in-flight promise (`src/lib/server/single-flight.ts`, unit-tested). That map lives in one process. Spread the two requests across two replicas and the collapse never happens.

```
edge: hash(muallim_rt cookie) → replica N
```

With nginx that is `hash $cookie_muallim_rt consistent;` in the `upstream` block. Any load balancer that hashes on that specific cookie will do — but check what yours actually keys on. Hashing the whole `Cookie` header does not work: it also carries `muallim_at`, which changes on every refresh, so a browser would hop replicas at exactly the moment it must not.

The residual: a replica restart moves a browser to a process with an empty map, so a refresh in flight at that moment can still race. It resolves by re-authenticating, which is the right outcome of losing a session. The alternative — a shared lock — means a database in the presentation tier, and this app deliberately has none.

## Errors

Nothing renders a blank screen and nothing renders a stack trace.

- `src/routes/+error.svelte` — distinguishes 404 from 5xx, and always offers a way out.
- `handleError` in `src/hooks.server.ts` — logs the real error against a correlation ID, returns only a safe shape. The ID is shown to the user so they can quote it.
- `src/error.html` — last resort for errors that escape the root layout. Depends on no bundle, no stylesheet, no font.
