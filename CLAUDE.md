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

**A card's colour is neutral; meaning goes in a badge or a bar.** Cards are one slate wash (`bg-surface-sunken`), the same for every card — the colour encodes nothing, on purpose. What the card is about is carried by a design-system component inside it: a `Badge` for a state, the `Difficulty` bars for a magnitude. We tried a random rainbow and then a difficulty-keyed hue; both were noise, and the user asked for a single grey/slate instead.

**Cards: reach for `TintCard`.** The card shell (a `rounded-2xl` frame with a light border and small inset, a `rounded-xl` slate panel, a corner glyph, hover-scale) lives in `src/lib/components/TintCard.svelte`. It takes the panel body as its `children` snippet and an optional `footer` snippet. Use it for anything card-shaped — the catalogue (`CourseCard` wraps it) and the Teach list already do — rather than re-deriving the frame inline. In a grid it is full-height with the footer pinned to the bottom, so actions line up across a row.

**A clickable card needs no "Open" button.** If the whole card is an `<a>`, do not add an Open/View button that only repeats the click; spend the footer on something the reader does not already know (a difficulty, a state), not on a second copy of the link.

**Create and edit forms get their own route.** A form is a page (`/teach/new`, `/teach/{slug}`), reached by a button from the list — not an inline panel stacked above the list it belongs to. The list stays a list.

**Forms: reach for `Sheet`.** `src/lib/components/Sheet.svelte` splits a card into a `header` snippet, `children` (the content), and a `footer` snippet, ruled between. Wrap it in a `<form>` and put the submit `Button` in the footer. Use it for form-shaped pages rather than a bare `Card` with a trailing button.

**Badges: default style, capitalized, with an icon.** The `Badge` component sets `capitalize` (so an API's `draft` reads as `Draft`) and takes an `icon` — a status wears a mark, not a colour alone. No `font-mono`; that was tried and dropped.

**Reordering is drag-and-drop, and keyboard.** Sortable lists (the curriculum's sections and lessons) use `@thisux/sveltednd` with a `.drag-handle` grip, not up/down buttons. The grip is a real `<button>`: Arrow Up / Down move its row, so the reorder is reachable without a mouse (WCAG). The list is a writable `$derived` of the loaded data — a drop or a keypress assigns the new order for an instant response, submits the whole order to a reorder action, and the next load resettles it. Two traps that cost real debugging: (1) **don't nest drop zones** — a lesson row inside a section's own droppable has its drop swallowed by the section; put the section's `use:draggable`/`use:droppable` on its header row, not the whole card. (2) **reassign the whole `$derived`, never mutate a nested item** (`topics = topics.map(...)`, not `topic.lessons = next`) or the change won't render. Keep it smooth: reorders `animate:flip` so rows glide, `postOrder` does **not** `invalidateAll` on success (the optimistic order already matches the server, so a reload would only flash), and the package's loud default feedback (hard blue line, dashed boxes) is replaced by one thin accent insertion line in local `:global(.drop-before/.drop-after)` styles — its stylesheet can't be imported (exports block the subpath) anyway.

**A metric wears an icon, not a coloured dot.** A stat or legend uses a tinted icon tile (`bg-{tone}-surface text-{tone}-text`), never a bare colour dot: a dot is a key nobody was handed.

**Ratings use `Stars`.** `src/lib/components/Stars.svelte` renders a 0–5 rating. Read-only by default (an `aria-label`'d row); pass `name` to make it an accessible radio group that `bind:value` writes to — that is the review form's input. Fill comes from `text-accent [&_*]:fill-current` on the icon, because the `Icon` wrapper does not forward `fill`. Reuse it wherever a rating shows (course header, review wall, teach analytics) rather than drawing stars inline.

**Pages use the width they have.** `Page width="full"` (max-w-7xl, aligned with the header) for lists, grids, and anything with a sidebar; `wide` (max-w-5xl) for forms and tables; `prose` (max-w-2xl) only for something to read. Do not leave a page stranded in a narrow column with empty gutters.

**The landing page redesign is deferred** — the user asked to leave `src/routes/+page.svelte` (marketing) for later.

## Git

Author every commit as `ebnsina <ebnsina.me@gmail.com>`, configured **per repo**:

```bash
git config user.name "ebnsina" && git config user.email "ebnsina.me@gmail.com"
```

Do **not** add a `Co-Authored-By: Claude` trailer, or any other identity. Remote uses the `github-es` SSH host alias (`git@github-es:ebnsina/lms-web.git`).

`docs/` and `data/` are gitignored and must never be committed — no plans, no roadmap, no secrets in the public repo.

Conventional, imperative commit subjects: `feat(quiz-player): restore answers after a failed submit`.
