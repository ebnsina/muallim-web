# CLAUDE.md — `muallim-web`

SvelteKit frontend for a multi-tenant LMS. Read `GUIDELINES.md` before writing code; it is the authoritative engineering contract. This file is the short version plus the things that are easy to get wrong.

## What this repo is

The first client of `muallim-api` (sibling repo at `../muallim-api`). It owns presentation; the API owns the domain. The seam between them is the API's generated OpenAPI 3.1 spec.

## Stack

Svelte 5.56 (runes) · SvelteKit 2.69 · TypeScript strict · Tailwind 4.3 (`@tailwindcss/vite`) · `@hugeicons/svelte` 1.1 + `@hugeicons/core-free-icons` 4.2 · `openapi-fetch` + `openapi-typescript`.

## Commands

```bash
pnpm install
pnpm dev
pnpm gen:api        # regenerate src/lib/api/schema.d.ts from muallim-api's OpenAPI spec
pnpm check          # svelte-check + tsc
pnpm lint
pnpm test
pnpm build
```

## Rules that are easy to violate

**Docs are part of the change, not a follow-up.** A rule in this file that the code has outgrown is worse than no rule: it is a confident instruction to do the wrong thing, and the next person — or the next model — will follow it. So when a convention changes, CLAUDE.md changes in the _same_ commit; when a page or a component is added, the docs that describe the system say so. This has already bitten: three rules here ("hover is a scale", "a card's colour is neutral", "reordering is not up/down buttons") went false while the product moved, and nothing failed to tell us. Nothing ever will — a stale doc has no test.

**Comments are one line, two at most.** Say the one thing the markup or code cannot. No multi-paragraph essays — trim to the load-bearing sentence.

**Never assume a library API.** Query Context7 (`resolve-library-id` → `query-docs`) before writing against any dependency. Svelte 5 and Tailwind 4 both broke long-standing patterns, and training data lags releases.

**Two traps, both recent, both widely mis-remembered.** Icons come from Hugeicons: import the glyph from `@hugeicons/core-free-icons` and render it through the local `Icon` component (a thin wrapper over `@hugeicons/svelte`), e.g. `import { BookOpen01Icon } from '@hugeicons/core-free-icons'`. Do not reach for `lucide-svelte`/`@lucide/svelte`. Tailwind 4 configures in CSS via `@import "tailwindcss"` + `@theme` with the `@tailwindcss/vite` plugin; there is no `tailwind.config.js`.

**Runes only.** No `export let`, no `$:`. `$derived` for anything computable; `$effect` only for genuine side effects, never to sync one piece of state into another.

**All API access goes through the typed client** in `src/lib/server/api.ts`, from the server, always. A raw `fetch()` to `muallim-api` from a component is a rejection, and there is no browser-side client to reach for. `schema.d.ts` is generated and gitignored — never hand-edit it.

**`muallim-api` is same-origin at `/api`,** routed there by the edge (a Vite proxy in dev) with `Host` preserved, because `Host` is what selects the workspace. Never call `muallim-api` on a direct address: `Host` is a forbidden header for `fetch` and Node drops it, so the request quietly resolves the wrong workspace.

**Fetch in `load`, never in `onMount`.** Use the `fetch` passed to `load`. Mutations are form actions with `use:enhance`, not `onclick` + `fetch`.

**`src/lib/server/` never reaches the client.** Secrets live there.

**Every error path renders deliberately.** `error(404, ...)` from `load`; `+error.svelte` boundaries; `handleError` in `hooks.server.ts` logs the real error and returns only a safe shape with a correlation ID; `src/error.html` is the last resort and must not depend on the app bundle. Know the trap: an error in the _root_ layout's `load` cannot be caught by any `+error.svelte` — it falls through to `error.html`.

**A validation error is a sentence about a field, so it sits under the field.** Pass it to `Field`'s `error` prop (plain danger-toned text under the control, wired to `aria-describedby`, and the control goes `invalid`) — not an `Alert` banner at the top of the page, which shouts about one input from across the room. `Alert` is for what a _page_ has to say: an action that failed, a session that expired, a thing that was saved.

**Loading, empty, error, and success are four states.** A component handling only success is unfinished.

**Accessibility is a build-time constraint, not a later ticket.** WCAG 2.2 AA. Semantic HTML, keyboard reachable, visible focus, real `<label>`s, `aria-hidden` on decorative icons, contrast verified not eyeballed. It is a procurement gate for institutional customers, and retrofitting it is exactly what sank the incumbents.

**Performance is the competitive claim.** SSR by default, no fetch waterfalls, explicit image dimensions, guard the bundle.

## Design conventions (the user keeps repeating these — do not forget)

**Reach for the design system first.** Use the components in `src/lib/components` and the semantic tokens (`bg-surface`, `text-muted`, `accent`/`success`/`warning`/`danger` with their `-surface`/`-text`/`-border`, `.numeral`, `rounded-card`/`rounded-control`). If a piece is missing, build it to the same pattern and reuse it — never one-off inline styling that drifts from the rest.

**Never invent data.** Show only what the API returns. No points/PX, streaks, "insights", task/module/quiz counts, or hours unless there is a real field behind them. A number nobody can check is worse than no number — the user has flagged this more than once.

**Every surface is paper on a shadow.** A loose card lying _on_ the page — one of a scatter, a list of rows, a stat tile — is `<Card float>` (or `<Row float>`): white, no border, `shadow-card`. A border is only for something _in_ the page: a divider between rows, a table's cells, a field. This replaced the old "a border separates and nothing else does" rule after the user pointed out that half the app was drawing surfaces with a box and half with a shadow. Hover deepens the shadow and lifts two pixels — the `.lift` class in `layout.css`, whose transform lives inside `prefers-reduced-motion: no-preference` (a transform whose _transition_ is stripped does not stop moving, it starts jumping).

**Aurora is the brand's own light, and it is the product's only "picture".** `.aurora` plus `aurora-1..5` (a CSS gradient mesh + SVG grain). `auroraFor(seed)` hashes a slug to a stable variant, so a course wears the same colour in the catalog, on its page, and in the editor. It carries the band, a course cover, the certificate's emblem panel, the leaderboard podium, the profile header. Everything on it inverts: `text-on-solid`, `Button variant="glass"`, `Stars tone="inverse"`, `Difficulty tone="inverse"`, `Breadcrumbs tone="inverse"` — the page's greys were chosen against white paper and vanish on it. `@media print` neutralizes `.aurora` (a dark gradient on paper is an inkjet's cartridge); `.aurora-ink` opts back in, and only the certificate uses it.

**Corners are squircles.** `.squircle` (1rem) and `.squircle-sm` (0.75rem) set `border-radius` _and_ `corner-shape: squircle`; where the browser lacks `corner-shape` the radius stands alone. An inner radius is concentric with the one outside it only when it is smaller by exactly the gap — get that wrong and the corner wobbles, which is the one place two curves can visibly disagree.

**One mark that moves, not many that light up.** A row of mutually-exclusive choices (the band's nav, the lesson's tabs, the course editor's tools) uses the shared `Pill` class in `src/lib/pill.svelte.ts`: one fill measured from the active element and slid to it. Six backgrounds fading in and out is the same information with none of the continuity. It measures the DOM (label widths depend on a webfont that arrives after the markup) and re-measures on navigation, resize, and `document.fonts.ready`. It is `aria-hidden` — `aria-current`/`aria-selected` carries the meaning.

**A link that leaves says so.** `ActionLink` (trailing up-right arrow) for "See the leaderboard", "All courses", "Your certificates". Inline links use `.underline-grow`, an underline painted as a background so it can animate — `text-decoration` has no interpolable size.

**A headline figure rolls.** `<Numeral countUp value={n} suffix="%" />` — the odometer starts at nothing and rolls up on arrival, for the one figure a page or tile is _about_. Never in a table row or a dense list (forty rolling numbers is a slot machine), and never where the text has to be read as a sentence: `Numeral` keeps ten digits of every place in the DOM and hides them from assistive tech, so `getByText('3 of 5')` — and a person selecting the text — sees something else entirely.

**A course card is a poster.** `CourseCard` is a square aurora cover — title at the top, difficulty and lesson count at the foot — over a white block carrying the summary, the rating, the byline and the learner count. The catalog and Teach use the _same_ card (Teach adds a `status` chip and an `actions` snippet); the same course looking like two different things depending on the page was a bug the user named. The card's link is a **stretched overlay**, not a wrapper, because the byline and the publish button are links/buttons of their own — an anchor inside an anchor is not something HTML has an answer for.

**Cards: reach for `TintCard`.** The card shell (a `rounded-2xl` frame with a light border and small inset, a `rounded-xl` slate panel, a corner glyph, hover-scale) lives in `src/lib/components/TintCard.svelte`. It takes the panel body as its `children` snippet and an optional `footer` snippet. Use it for anything card-shaped — the catalogue (`CourseCard` wraps it) and the Teach list already do — rather than re-deriving the frame inline. In a grid it is full-height with the footer pinned to the bottom, so actions line up across a row.

**A clickable card needs no "Open" button.** If the whole card is an `<a>`, do not add an Open/View button that only repeats the click; spend the footer on something the reader does not already know (a difficulty, a state), not on a second copy of the link.

**Create and edit forms get their own route.** A form is a page (`/teach/new`, `/teach/{slug}`), reached by a button from the list — not an inline panel stacked above the list it belongs to. The list stays a list.

**Forms: reach for `Sheet`.** `src/lib/components/Sheet.svelte` splits a card into a `header` snippet, `children` (the content), and a `footer` snippet, ruled between. Wrap it in a `<form>` and put the submit `Button` in the footer. Use it for form-shaped pages rather than a bare `Card` with a trailing button.

**Badges: default style, capitalized, with an icon.** The `Badge` component sets `capitalize` (so an API's `draft` reads as `Draft`) and takes an `icon` — a status wears a mark, not a colour alone. No `font-mono`; that was tried and dropped.

**Reordering is drag, keyboard, _and_ buttons.** Sortable lists (the curriculum's sections and lessons) use `@thisux/sveltednd` with a `.drag-handle` grip — and, since the user asked, explicit up/down buttons beside it that call the same `nudge` function the arrow keys do. A drag is a gesture; moving a section up one place is a decision, and a decision should not require a steady hand. The grip is a real `<button>`: Arrow Up / Down move its row, so the reorder is reachable without a mouse (WCAG). The list is a writable `$derived` of the loaded data — a drop or a keypress assigns the new order for an instant response, submits the whole order to a reorder action, and the next load resettles it. Two traps that cost real debugging: (1) **don't nest drop zones** — a lesson row inside a section's own droppable has its drop swallowed by the section; put the section's `use:draggable`/`use:droppable` on its header row, not the whole card. (2) **reassign the whole `$derived`, never mutate a nested item** (`topics = topics.map(...)`, not `topic.lessons = next`) or the change won't render. Keep it smooth: reorders `animate:flip` so rows glide, `postOrder` does **not** `invalidateAll` on success (the optimistic order already matches the server, so a reload would only flash), and the package's loud default feedback (hard blue line, dashed boxes) is replaced by one thin accent insertion line in local `:global(.drop-before/.drop-after)` styles — its stylesheet can't be imported (exports block the subpath) anyway.

**A metric wears an icon, not a coloured dot.** A stat or legend uses a tinted icon tile (`bg-{tone}-surface text-{tone}-text`), never a bare colour dot: a dot is a key nobody was handed.

**Ratings use `Stars`.** `src/lib/components/Stars.svelte` renders a 0–5 rating. Read-only by default (an `aria-label`'d row); pass `name` to make it an accessible radio group that `bind:value` writes to — that is the review form's input. Fill comes from `text-accent [&_*]:fill-current` on the icon, because the `Icon` wrapper does not forward `fill`. Reuse it wherever a rating shows (course header, review wall, teach analytics) rather than drawing stars inline.

**Nothing on a page may jump** — see the rule near the top of this section: reserve the space, or animate the height with `transition:slide`. Never snap.

**The copy is American; the API is British.** `enrolments` is a Postgres table, a Go package and a JSON field, so every property, path, form action and enum keeps the server's spelling (`data.enrolments`, `?/enrol`, `after_enrolment`, `EnrolmentView`). Everything a person _reads_ — labels, headings, toasts, comments — is American: enroll, enrollment, catalog, color, center. The two disagree on purpose, and only at the boundary where one side is read by people and the other by machines.

**A form's submit sits at its bottom-right, and every action button carries an icon.** Exceptions, all deliberate: a lone CTA with no fields ("Mark as complete"), a `w-full` submit, a row action positioned by its container, and a filter bar's inline button.

**An editor is one tool at a time.** The course editor (`/teach/[slug]`) is four tabs — Curriculum (the default, because it is what an author came for), Announcements, Insights, Settings — not four tools stacked down 2,700 pixels. Tab state is local, not in the URL: every write goes through `use:enhance`, so the tab survives the edits made in it, which is all it has to survive.

**Pages use the width they have.** `Page width="full"` (max-w-7xl, aligned with the header) for lists, grids, and anything with a sidebar; `wide` (max-w-5xl) for forms and tables; `prose` (max-w-2xl) only for something to read. Do not leave a page stranded in a narrow column with empty gutters.

**Nothing on a page may jump.** Anything that changes size when a reader uses it — a disclosure opening, a filter emptying a list, a month with six weeks where the last one had five — moves everything under it, and the reader loses the line they were on. Two rules, and they are not negotiable:

- **A control does not resize when you use it.** Reserve the space it will need: the mini calendar draws six week-rows in every month, not five in July and six in August, because paging the month must not move the page. The same reasoning gives the catalogue's summary a two-line minimum and the dashboard's stat tiles a fixed grid.
- **What must change height, animates.** A body appearing in one frame _is_ a jump, however small. Reveal it with `transition:slide` at `DURATION.base` — the eye can follow a height it watched grow, and it cannot follow one that was suddenly there. Svelte's transitions compile to CSS animations, so `prefers-reduced-motion` already collapses them to nothing; a reader who asked for stillness gets the content, immediately, without the movement.

Reserve, or animate. Never snap.

**The marketing site has its own look — keep to it.** Landing (`src/routes/+page.svelte`) plus a per-audience page at `/solutions/[slug]`, one template driven by `src/lib/content/segments.ts` (nonprofits, creators, schools, coaching, agencies). Conventions the user converged on, the hard way:

- **Dark hero, light body.** The hero is a full-bleed dark aurora band (`.hero-blue` + `AuroraBackdrop`), fixed-dark in either theme; the rest of the page follows the app theme, **light by default** — do not lock it dark. A quiet page-wide `PageAurora` carries the hero's colour behind everything.
- **Header floats, then leaves.** `MarketingHeader` is `absolute` over the hero (white nav via `overDark`) and scrolls away — not sticky, no border. Menu (Solutions dropdown, Pricing) sits left by the logo; Sign in + Contact sales sit right. No "Courses". Buttons are pills (`Button pill`); the app keeps `rounded-control`.
- **Sections separate by rounded tinted panels, not borders.** A shaded block is `rounded-3xl bg-surface-sunken`, inset with `px-4 sm:px-6`. No `border-t` dividers between sections.
- **Cards: `Card aurora`.** The tint blooms on **hover** (a `::before` cross-fade in `.card-aurora`), not at rest. FAQ items are plain — no aurora — and animate open/close with `transition:slide`, one at a time, centred.
- **Show the product, framed.** The bento is one browser-chrome frame around real design-system UI (a dashboard), not tilted floating widgets.
- **Honesty is the voice.** Solution pages split into "works today" and "on the roadmap"; the roadmap is a two-up split with its card vertically centred so a single item never leaves an empty grid; section eyebrows are text, not `Badge`s.
- **The copy is behind the product — a known gap, queued.** `src/lib/content/landing.ts` lists a fraction of what actually ships: the gradebook and grading scales, certificate templates, the forum, the leaderboard and badges, notifications and the email digest, prerequisites, content drip, assignment upload and marking, the question bank and image question types, reviews, notes and highlights, dashboard deadlines, invitations and roles are all built and mostly unmentioned. When this is picked up: audit `landing.ts` against the route tree and the OpenAPI spec before writing a word, keep the "works today" vs "on the roadmap" split, and do not invent a feature to fill a grid cell. The risk here is the reverse of the usual one — the page is under-claiming, not over-claiming.
- **Placeholders are flagged.** Pricing numbers, the logo strip, and hero/segment images are Unsplash/invented placeholders marked in-code — replace before launch. Icons are verified Hugeicons only.

## AI Studio

Generation runs **here, in `muallim-web`'s server**, never in the Go API — so provider keys stay server-side and the OpenAPI contract carries no streaming-LLM surface other clients can't honour. The pieces:

- **One engine.** `src/lib/server/ai.ts` holds the provider (TanStack AI, Anthropic adapter) and reads the key + model from `$env/dynamic/private`. Provider-agnostic: swap the adapter, nothing else moves. `aiEnabled()` gates everything — **no key means the AI controls are hidden and the forms are unchanged**, never a broken button.
- **One endpoint.** `/ai/generate` (a session-guarded `+server.ts` streaming SSE). Deliberately **not** under `/api`, which proxies to muallim-api.
- **The draft is not the record.** AI streams a draft the author edits; **saving goes through the existing permission-checked catalog/assess endpoints**, and muallim-api's validator refuses a malformed generated question exactly as it would a hand-typed one. Never write generated content live.
- **Two SSR traps.** `@tanstack/ai-svelte` ships an uncompiled `.svelte` file, so it lives in `ssr.noExternal` (alongside `@hugeicons/svelte`). And the AI components (`AiField`, `AiQuiz`, `AiOutline`) are imported **directly**, never re-exported from the `$lib/components` barrel — the barrel is on every page's import path, and the AI SDK has no business in the landing's bundle.

## Git

Author every commit as `ebnsina <ebnsina.me@gmail.com>`, configured **per repo**:

```bash
git config user.name "ebnsina" && git config user.email "ebnsina.me@gmail.com"
```

Do **not** add a `Co-Authored-By: Claude` trailer, or any other identity. Remote uses the `github-es` SSH host alias (`git@github-es:ebnsina/muallim-web.git`).

`docs/` holds the installation, architecture, frontend, and testing guides, and is committed. `docs/plan.md` and `data/` are gitignored and must never be committed — no plans, no roadmap, no secrets.

Conventional, imperative commit subjects: `feat(quiz-player): restore answers after a failed submit`.
