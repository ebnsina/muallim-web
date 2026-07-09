# Engineering Guidelines — `lms-web`

These are rules, not suggestions. A change that violates one should not merge.

---

## 1. Never assume an API

Before writing against SvelteKit, Svelte, Tailwind, Lucide, or any dependency, **look up its current documentation**. Svelte 5 and Tailwind 4 both broke long-standing patterns, and model training data lags releases. Use Context7 (`resolve-library-id` → `query-docs`) ahead of a general web search.

Two specific traps, because both are recent and both are widely mis-remembered:

- The icon package is **`@lucide/svelte`** (v1.23+). The old `lucide-svelte` is legacy and stalled at 1.0.1. Do not install it.
- Tailwind 4 configures through **CSS** (`@import "tailwindcss"` + `@theme`) and the `@tailwindcss/vite` plugin. There is no `tailwind.config.js` and no PostCSS pipeline unless you deliberately add one.

If a doc and the compiler disagree, the compiler is right.

---

## 2. The API contract

`lms-api` (sibling repo, `../lms-api`) owns the domain. This app owns presentation. The seam is the generated OpenAPI 3.1 spec.

```bash
pnpm gen:api      # regenerates src/lib/api/schema.d.ts from lms-api's spec
```

`schema.d.ts` is **generated and gitignored**. Never hand-edit it. All API access goes through the typed `openapi-fetch` client in `src/lib/server/api.ts`; a raw `fetch()` to the API from a component is a rejection.

The consequence, which is the point: a breaking change in `lms-api` fails `pnpm check` here, at build time, rather than in production.

Do not duplicate backend domain rules in the client. Validate for _user experience_ (immediate feedback); the server validates for _correctness_. When they disagree, the server wins.

### `lms-api` is same-origin, at `/api`

The edge serves this app at `acme.lms.com/` and routes `acme.lms.com/api/*` to `lms-api`, preserving `Host`. A Vite proxy does the same in development. Nothing here is cross-origin, so there is no CORS, no preflight, and no `Origin` header to forge during SSR.

**`Host` decides the workspace.** `lms-api` strips the port and takes the first label as the subdomain, so a request must reach it carrying the host the _browser_ addressed. Calling `lms-api` on an internal address while overriding `Host` does not work: `Host` is a forbidden header name for `fetch`, and Node drops it silently — the request succeeds, against the wrong workspace, and nothing says so. Never introduce a second, direct route to `lms-api`. The dev proxy sets `changeOrigin: false` for the same reason.

**Every call to `lms-api` is made from the server**, through `src/lib/server/api.ts`, which takes `url.origin` from the request being served. Authenticated reads have no choice: the access token is in an httpOnly cookie so that no script in the page can read it. Anonymous reads follow, because what `lms-api` returns depends on whether a token accompanied the request — an author sees drafts, an enrolled learner sees lesson bodies. There is no browser-side API client, and a relative `/api` URL in a universal `load` would not reach the proxy during SSR anyway.

**Refreshing happens in exactly one place, and sessions are sticky.** `lms-api` rotates a refresh token on every use and treats one presented twice as theft — it revokes the whole session family. `hooks.server.ts` is the only place a refresh occurs, and it collapses concurrent attempts onto one in-flight promise. That map is per process, so **the edge must route a browser to one replica by hashing the `lms_rt` cookie.** Adding a second place that refreshes, or load-balancing round-robin, logs users out of every device through a race that reproduces rarely and never while you are watching.

**Only whitelisted response headers survive SSR serialization.** SvelteKit embeds SSR `fetch` responses in the HTML for hydration and hides every header not named by `filterSerializedResponseHeaders`; reading a hidden one throws. `openapi-fetch` reads `content-length` to decide whether a response has a body, so `handle` in `hooks.server.ts` permits `content-length` and `content-type` — and nothing else, because whatever is listed there ends up in the page source. Never add `set-cookie` or `authorization` to that list.

---

## 3. Svelte 5 — runes

Runes only. `export let`, `$:`, and the legacy store-contract-in-components are all dead code paths here.

```svelte
<script lang="ts">
	let { course, onEnrol }: Props = $props();
	let query = $state('');
	let filtered = $derived(lessons.filter((l) => l.title.includes(query)));

	$effect(() => {
		/* only for genuine side effects — never to sync state */
	});
</script>
```

- `$derived` for anything computable from existing state. Reaching for `$effect` to assign to another `$state` means you wanted `$derived`.
- `$effect` is for escaping to non-reactive systems: subscriptions, timers, imperative DOM, analytics. Always return a cleanup function when the effect creates something that outlives a tick.
- Props are typed with an explicit `interface Props`. No implicit `any`.
- Shared reactive state lives in `.svelte.ts` files using `$state`, exported as a getter-bearing object — not as a bare mutable export, which loses reactivity across module boundaries.

## 4. Structure

```
src/
  lib/
    api/          generated schema + RFC 9457 problem helpers
    components/   presentational, no data fetching, no direct API calls
    features/     feature-scoped composites (course-builder/, quiz-player/, ...)
    server/       server-only code, incl. api.ts — the ONLY place fetch touches
                  lms-api. NEVER importable from a component.
    state/        *.svelte.ts shared runes
    utils/
  routes/
```

- `src/lib/server/` may never be imported by client code. SvelteKit enforces this; do not try to route around it.
- A component in `lib/components/` does not fetch. Data arrives via `load` and flows down as props.
- Feature code lives in `lib/features/`. Route files stay thin: `+page.svelte` composes, it does not implement.

## 5. Data loading

- Use `load` in `+page.server.ts`. Fetching in `onMount` for initial page data is a rejection — it breaks SSR, and it breaks the loading and error boundaries you get for free.
- Anything that calls `lms-api`, holds a secret, or reads the session belongs in `+page.server.ts` or `+layout.server.ts`. That is nearly everything: see §2.
- In a universal `load`, use the `fetch` it provides. It carries cookies and dedupes against SSR.
- Mutations are **form actions** with progressive enhancement (`use:enhance`), not `onclick` handlers firing `fetch`. Forms work before JavaScript loads; that is not nostalgia, it is the accessibility and reliability baseline.

---

## 6. Error handling — every case, deliberately

Nothing renders a blank screen. Nothing renders a raw stack trace.

### Expected errors — `error()`

Throw them from `load`. SvelteKit renders the nearest `+error.svelte`, and the message is safe to show the user.

```ts
import { error } from '@sveltejs/kit';

export const load = async ({ params, fetch }) => {
	const {
		data,
		error: apiError,
		response
	} = await api.GET('/v1/courses/{id}', {
		params: { path: { id: params.id } },
		fetch
	});
	if (response.status === 404) error(404, 'Course not found');
	if (apiError) error(response.status, apiError.detail ?? 'Something went wrong');
	return { course: data };
};
```

### Unexpected errors — `handleError`

Anything thrown that was not an `error()` becomes a 500, and its message is replaced with a generic one. That default is correct: never leak internals. Implement `handleError` in `src/hooks.server.ts` (and `hooks.client.ts`) to log the real error, attach a correlation ID, and return only the safe shape.

Extend `App.Error` in `src/app.d.ts` so `page.error` is typed and carries that ID.

### The boundaries

| File                          | Catches                                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/+error.svelte`    | Root fallback — 404 and everything uncaught below.                                                                                                         |
| `src/routes/**/+error.svelte` | Errors from `load` in that subtree. Add one wherever a bespoke recovery makes sense.                                                                       |
| `src/error.html`              | Last resort. Renders when the error escapes the root layout's `load`, or comes from `handle`. **Must be plain HTML with no dependency on the app bundle.** |

Know the trap: an error thrown in a `+layout.server.ts` is caught by the `+error.svelte` **above** that layout, not beside it. An error in the _root_ layout's `load` cannot be caught by any `+error.svelte` at all — it falls through to `src/error.html`. Test that path.

A `+error.svelte` distinguishes 404 from 5xx and offers a route out — a link home, a retry, a search. "An error occurred" with no exit is a dead end.

### Elsewhere

- Every `await` in a form action returns a typed `fail()` with the submitted values, so the form re-renders populated rather than blank.
- Network failure and offline are states, not exceptions. Render them.
- Loading, empty, error, and success are **four** states. A component that only handles success is unfinished.

---

## 7. Accessibility — WCAG 2.2 AA, from commit one

This is a build-time constraint, not a later ticket. It is a procurement gate for every institutional customer, and retrofitting it is precisely what has sunk the incumbents.

- Semantic HTML first. A `<div onclick>` is a rejection; it is a `<button>`.
- Every interactive element is keyboard-reachable, in a sensible order, with a visible focus ring. Never `outline: none` without a replacement.
- Icons are decorative unless they are the only label. `@lucide/svelte` icons get `aria-hidden="true"` when adjacent to text, and an accessible name when standing alone.
- Contrast ≥ 4.5:1 for body text, 3:1 for large text and UI boundaries. Verify, do not eyeball.
- Forms: every input has a real `<label>`. Errors are associated via `aria-describedby` and announced.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- Video requires captions. This is also why the API auto-transcribes.
- Do not fight the `svelte-check` a11y warnings. They are almost always correct.

## 8. Styling & icons

Tailwind 4, configured in CSS via `@theme`. Design tokens — colour, spacing, radius, type scale — are defined once there and never hardcoded in a component. No arbitrary values (`w-[347px]`) outside a genuine one-off.

Icons come from **`@lucide/svelte`**, imported per-icon so they tree-shake:

```svelte
import {BookOpen} from '@lucide/svelte';
```

Never a barrel import of the whole set. Never an inline SVG for an icon that Lucide already has, and never a second icon library — one system, consistently applied.

## 9. Performance

Performance is the competitive claim; the incumbents are slow and we say so. Do not undermine it.

- Server-render by default. Opt out of SSR only with a stated reason.
- No waterfalls: parallelise independent fetches in `load`.
- Stream slow, non-critical data by returning a promise from `load` and awaiting it in `{#await}`.
- Images have explicit `width`/`height` to hold layout. Lazy-load below the fold.
- Watch the bundle. A dependency that ships more bytes than the feature is worth does not merge.

## 10. TypeScript

`strict: true`. No `any` — use `unknown` and narrow. No non-null assertion (`!`) to silence the compiler; if a value can be null, handle null. Types for API payloads come from `schema.d.ts` and are never re-declared by hand.

---

## 11. Git & commits

```bash
git config user.name  "ebnsina"
git config user.email "ebnsina.me@gmail.com"
```

Set **per repo**, never globally. Do **not** add a `Co-Authored-By` trailer or any other identity.

Remote uses the `github-es` SSH host alias: `git@github-es:ebnsina/lms-web.git`.

`docs/` and `data/` are gitignored and never committed.

Conventional, imperative subjects, one logical change per commit:

```
feat(course-builder): add drag-and-drop topic reordering
fix(quiz-player): restore answers after a failed submit
```

## 12. Before you push

```bash
pnpm check          # svelte-check + tsc
pnpm lint
pnpm test
pnpm build
```

CI runs all of it. A red build does not merge.
