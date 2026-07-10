<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components';

	let { children } = $props();

	/*
		Says when the page has handlers on it.

		Most of this app works before hydration — a form posts, a link navigates —
		which is the point, and which is why nothing else needs this. A file input is
		the exception: choosing a file before its `change` listener exists fires an
		event into nothing, and the page sits there looking exactly as it would if
		the upload had simply not been asked for.

		The end-to-end suite waits on this rather than on a timeout. A person is
		never fast enough for it to matter; Playwright always is.
	*/
	$effect(() => {
		document.documentElement.dataset.hydrated = '';
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{@render children()}

<Toaster />
