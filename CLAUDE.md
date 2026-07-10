# CLAUDE.md — `lms-web`

SvelteKit frontend for a multi-tenant LMS. Read `GUIDELINES.md` before writing code; it is the authoritative engineering contract. This file is the short version plus the things that are easy to get wrong.

## What this repo is

The first client of `lms-api` (sibling repo at `../lms-api`). It owns presentation; the API owns the domain. The seam between them is the API's generated OpenAPI 3.1 spec.

## Stack

Svelte 5.56 (runes) · SvelteKit 2.69 · TypeScript strict · Tailwind 4.3 (`@tailwindcss/vite`) · `@hugeicons/svelte` 1.1 + `@hugeicons/core-free-icons` 4.2 · `openapi-fetch` + `openapi-typescript`.

## Commands

```bash
pnpm install
pnpm dev
pnpm gen:api        # regenerate src/lib/api/schema.d.ts from lms-api's OpenAPI spec
pnpm check          # svelte-check + tsc
pnpm lint
pnpm test
pnpm build
```

## Rules that are easy to violate

**Never assume a library API.** Query Context7 (`resolve-library-id` → `query-docs`) before writing against any dependency. Svelte 5 and Tailwind 4 both broke long-standing patterns, and training data lags releases.

**Two traps, both recent, both widely mis-remembered.** Icons come from Hugeicons: import the glyph from `@hugeicons/core-free-icons` and render it through the local `Icon` component (a thin wrapper over `@hugeicons/svelte`), e.g. `import { BookOpen01Icon } from '@hugeicons/core-free-icons'`. Do not reach for `lucide-svelte`/`@lucide/svelte`. Tailwind 4 configures in CSS via `@import "tailwindcss"` + `@theme` with the `@tailwindcss/vite` plugin; there is no `tailwind.config.js`.

**Runes only.** No `export let`, no `$:`. `$derived` for anything computable; `$effect` only for genuine side effects, never to sync one piece of state into another.

**All API access goes through the typed client** in `src/lib/server/api.ts`, from the server, always. A raw `fetch()` to `lms-api` from a component is a rejection, and there is no browser-side client to reach for. `schema.d.ts` is generated and gitignored — never hand-edit it.

**`lms-api` is same-origin at `/api`,** routed there by the edge (a Vite proxy in dev) with `Host` preserved, because `Host` is what selects the workspace. Never call `lms-api` on a direct address: `Host` is a forbidden header for `fetch` and Node drops it, so the request quietly resolves the wrong workspace.

**Fetch in `load`, never in `onMount`.** Use the `fetch` passed to `load`. Mutations are form actions with `use:enhance`, not `onclick` + `fetch`.

**`src/lib/server/` never reaches the client.** Secrets live there.

**Every error path renders deliberately.** `error(404, ...)` from `load`; `+error.svelte` boundaries; `handleError` in `hooks.server.ts` logs the real error and returns only a safe shape with a correlation ID; `src/error.html` is the last resort and must not depend on the app bundle. Know the trap: an error in the _root_ layout's `load` cannot be caught by any `+error.svelte` — it falls through to `error.html`.

**Loading, empty, error, and success are four states.** A component handling only success is unfinished.

**Accessibility is a build-time constraint, not a later ticket.** WCAG 2.2 AA. Semantic HTML, keyboard reachable, visible focus, real `<label>`s, `aria-hidden` on decorative icons, contrast verified not eyeballed. It is a procurement gate for institutional customers, and retrofitting it is exactly what sank the incumbents.

**Performance is the competitive claim.** SSR by default, no fetch waterfalls, explicit image dimensions, guard the bundle.

## Design conventions (the user keeps repeating these — do not forget)

**Reach for the design system first.** Use the components in `src/lib/components` and the semantic tokens (`bg-surface`, `text-muted`, `accent`/`success`/`warning`/`danger` with their `-surface`/`-text`/`-border`, `.numeral`, `rounded-card`/`rounded-control`). If a piece is missing, build it to the same pattern and reuse it — never one-off inline styling that drifts from the rest.

**Never invent data.** Show only what the API returns. No points/PX, streaks, "insights", task/module/quiz counts, or hours unless there is a real field behind them. A number nobody can check is worse than no number — the user has flagged this more than once.

**Hover is a scale, not a shadow.** Cards and tiles lift with a small `transition-transform hover:scale-[1.02]`, not `hover:shadow-*`.

**Tints are pastel washes, badges are frosted.** For decorative colour beyond the four semantic tokens, generate a hue with `courseHue()` in `src/lib/tint.ts` and paint it as a theme-aware `oklch(L C var(--h))` (pale in light, muted in dark). Chips over a tint are translucent + `backdrop-blur-sm`, not solid.

**Cards: a tinted panel inset in a lighter frame.** A `rounded-2xl` outer with a light border (`border-border/60`) and a small `p-1` inset, a `rounded-xl` tinted panel inside, the plain action on a strip below.

**The landing page redesign is deferred** — the user asked to leave `src/routes/+page.svelte` (marketing) for later.

## Git

Author every commit as `ebnsina <ebnsina.me@gmail.com>`, configured **per repo**:

```bash
git config user.name "ebnsina" && git config user.email "ebnsina.me@gmail.com"
```

Do **not** add a `Co-Authored-By: Claude` trailer, or any other identity. Remote uses the `github-es` SSH host alias (`git@github-es:ebnsina/lms-web.git`).

`docs/` and `data/` are gitignored and must never be committed — no plans, no roadmap, no secrets in the public repo.

Conventional, imperative commit subjects: `feat(quiz-player): restore answers after a failed submit`.
