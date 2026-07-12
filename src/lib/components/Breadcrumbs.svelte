<script lang="ts">
	import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';

	export type Crumb = {
		label: string;
		href?: string;
	};

	type Props = {
		crumbs: Crumb[];
		/** `inverse` for a trail standing on an aurora, where the page's grays vanish. */
		tone?: 'default' | 'inverse';
		class?: string;
	};

	let { crumbs, tone = 'default', class: className }: Props = $props();

	/*
		The last crumb is where you are, so it is never a link.

		Enforced here rather than asked of every caller. A page that appended a crumb
		pointing at itself would render a link that reloads the page you are on, and
		announce itself to a screen reader as somewhere else to go.
	*/
	const trail = $derived(
		crumbs.map((crumb, index) => (index === crumbs.length - 1 ? { label: crumb.label } : crumb))
	);
</script>

<!--
	An ordered list, because the order is the meaning.

	These pages used to carry one link — "Back to the lesson" — which answers where
	the button goes and not where the reader is. A learner four levels into a course
	could not name the course they were in.

	The last crumb is the current page: `aria-current="page"`, and not a link. The
	separators are decoration and are hidden, or a screen reader reads "Courses,
	arrow right, Optics" out loud.
-->
<nav aria-label="Breadcrumb" class={className}>
	<ol
		class={[
			'flex flex-wrap items-center gap-1.5 text-sm',
			tone === 'inverse' ? 'text-on-solid/75' : 'text-muted'
		]}
	>
		{#each trail as crumb, index (crumb.label + index)}
			<li class="flex min-w-0 items-center gap-1.5">
				{#if index > 0}
					<Icon icon={ArrowRight01Icon} class="size-3.5 shrink-0 opacity-60" />
				{/if}

				{#if crumb.href}
					<a
						href={crumb.href}
						class={[
							'max-w-[16ch] truncate rounded-control underline-offset-4 transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:max-w-[24ch]',
							tone === 'inverse'
								? 'hover:text-on-solid focus-visible:ring-on-solid'
								: 'hover:text-text focus-visible:ring-ring'
						]}
						title={crumb.label}
					>
						{crumb.label}
					</a>
				{:else}
					<span
						aria-current="page"
						class={[
							'max-w-[18ch] truncate font-medium sm:max-w-[32ch]',
							tone === 'inverse' ? 'text-on-solid' : 'text-text'
						]}
						title={crumb.label}
					>
						{crumb.label}
					</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
