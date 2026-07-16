<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<!--
	The institution's pages, full-width in the global shell. The section used to carry
	its own left rail; the modules now live in the app sidebar (`AppSidebar`), so a
	second nav here would be the two sidebars the shell exists to avoid. `+layout.server.ts`
	still gates this section on `academics:manage`.
-->
{@render children()}
