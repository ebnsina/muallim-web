import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

/**
 * The address of muallim-api as reached from this machine during development.
 * In production nothing points here: the edge routes /api itself.
 */
const apiTarget = process.env.MUALLIM_API_URL ?? 'http://localhost:8080';

export default defineConfig({
	/*
		Both ship uncompiled `.svelte` files that Node cannot load during SSR, so Vite
		has to bundle and compile them rather than leave them externalised. Without
		this the server render throws on the first page that draws an icon
		(@hugeicons/svelte) or mounts an AI control (@tanstack/ai-svelte's create-chat).
	*/
	ssr: { noExternal: ['@hugeicons/svelte', '@tanstack/ai-svelte'] },

	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	server: {
		/*
			Stands in for the production edge, which serves this app at
			acme.muallim.com/ and routes acme.muallim.com/api/* to muallim-api with the Host
			header intact. Reproducing that here means development and production
			differ in no way that matters: one origin, no CORS, and muallim-api resolves
			the workspace from a Host it can trust because we set it.

			`changeOrigin` stays false on purpose. Rewriting Host to the target would
			make every request resolve the workspace named after muallim-api's own
			address, which is the bug this whole arrangement exists to avoid.
		*/
		proxy: {
			'/api': {
				target: apiTarget,
				changeOrigin: false,
				rewrite: (path) => path.replace(/^\/api/, '')
			}
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
