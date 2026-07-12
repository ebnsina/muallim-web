# Frontend

## Stack

Svelte 5 (runes) · SvelteKit 2 · TypeScript strict · Tailwind 4 (configured in CSS, no `tailwind.config.js`) · [`@lucide/svelte`](https://lucide.dev) icons · `openapi-fetch` + `openapi-typescript` · `adapter-node`.

## Design tokens

Tokens live in `src/routes/layout.css` under `@theme`. A colour hardcoded in a component is a colour that cannot be themed, and every tenant will want to theme.

Accessibility is a build-time constraint, not a later ticket: WCAG 2.2 AA, verified contrast, keyboard reachable, `prefers-reduced-motion` and `prefers-color-scheme` honoured.

## Provenance

Scaffolded with the official Svelte CLI. To recreate the same configuration:

```sh
npx sv@0.16.2 create --template minimal --types ts \
  --add prettier eslint vitest="usages:unit" tailwindcss="plugins:none" sveltekit-adapter="adapter:node" \
  --no-download-check --no-install .
```

Note that current SvelteKit has no `svelte.config.js` — the adapter and `compilerOptions.runes` are configured through the `sveltekit()` plugin in `vite.config.ts`.
