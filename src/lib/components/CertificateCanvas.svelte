<script lang="ts">
	import { aspectRatio, displayText, type LayoutElement, type Orientation } from '$lib/certdesign';

	/*
		A self-contained renderer for a certificate design at any size. It draws the
		background, an accent frame, and each layout element positioned by fraction,
		filling placeholders with their sample text. It owns no editing — the designer
		lays its own interactive handles over the same coordinate model.

		Fonts scale with the canvas because sizes are `cqw` (a percent of the
		container's width), which is why one component serves both a thumbnail and a
		full sheet. It does not reuse the legacy `Certificate.svelte`.
	*/
	type Props = {
		orientation: Orientation;
		layout: LayoutElement[];
		accent?: string;
		backgroundColor?: string;
		backgroundUrl?: string | null;
		class?: string;
	};

	let {
		orientation,
		layout,
		accent = '#7c3aed',
		backgroundColor = '#ffffff',
		backgroundUrl = null,
		class: className = ''
	}: Props = $props();

	// A signed absolute URL is used as-is; an API-relative path is reached through
	// the same `/api` edge every other call goes through.
	const bgSrc = $derived(
		backgroundUrl
			? /^https?:\/\//.test(backgroundUrl)
				? backgroundUrl
				: `/api${backgroundUrl}`
			: null
	);
</script>

<div
	class="certcanvas {className}"
	style:aspect-ratio={String(aspectRatio(orientation))}
	style:background-color={backgroundColor}
>
	{#if bgSrc}
		<img class="certcanvas__bg" src={bgSrc} alt="" aria-hidden="true" />
	{/if}

	<div class="certcanvas__frame" style:border-color={accent}></div>

	{#each layout as el (el.id)}
		<div
			class="certcanvas__el"
			style:left="{el.x * 100}%"
			style:top="{el.y * 100}%"
			style:width="{el.w * 100}%"
			style:font-size="{el.fontSize * 100}cqw"
			style:font-weight={el.fontWeight}
			style:color={el.color}
			style:text-align={el.align}
		>
			{displayText(el)}
		</div>
	{/each}
</div>

<style>
	.certcanvas {
		container-type: inline-size;
		position: relative;
		width: 100%;
		overflow: hidden;
		border-radius: 0.5rem;
	}

	.certcanvas__bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.certcanvas__frame {
		position: absolute;
		inset: 3cqw;
		border: 0.4cqw solid;
		border-radius: 0.25rem;
		pointer-events: none;
	}

	.certcanvas__el {
		position: absolute;
		line-height: 1.2;
		white-space: pre-wrap;
		word-break: break-word;
	}
</style>
