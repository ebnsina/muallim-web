<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ThemeToggle, Toaster } from '$lib/components';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!--
	The toggle floats rather than living in a header, because there is no header
	yet. When there is one, it moves into it and this wrapper goes away.
-->
<div class="fixed top-4 right-4 z-50">
	<ThemeToggle />
</div>

{@render children()}

<Toaster />
