<script lang="ts">
	import { Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';
	import { browser } from '$app/environment';

	/*
		The source of truth is the attribute on <html>, stamped before the first
		paint by the script in app.html. This component reads it rather than keeping
		its own copy, so the two can never disagree.
	*/
	let theme = $state<'light' | 'dark'>(
		browser && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
	);

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;

		try {
			localStorage.setItem('theme', theme);
		} catch {
			// A refusal to persist is not a reason to refuse to switch.
		}
	}

	const next = $derived(theme === 'dark' ? 'light' : 'dark');
</script>

<button
	type="button"
	onclick={toggle}
	aria-label="Switch to {next} theme"
	title="Switch to {next} theme"
	class="inline-flex size-9 items-center justify-center rounded-full border border-border
	       bg-surface-raised text-muted transition-colors hover:bg-surface-hover hover:text-text"
>
	<Icon icon={theme === 'dark' ? Sun03Icon : Moon02Icon} class="size-4" />
</button>
