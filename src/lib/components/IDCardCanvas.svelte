<script lang="ts">
	import {
		aspectRatio,
		displayText,
		kindSpec,
		type CardData,
		type LayoutElement,
		type Orientation
	} from '$lib/idcard';

	/*
		A self-contained renderer for an ID-card template at any size. It draws the
		background, an accent bar, and each layout element positioned by fraction,
		filling text elements from a supplied data record (or the sample values in
		the editor). The `photo` element renders a bordered box, or an `<img>` when a
		photo URL is supplied.

		Fonts scale with the canvas because sizes are `cqw` (a percent of the
		container's width), which is why one component serves both a thumbnail and a
		full card. Mirrors `CertificateCanvas` and owns no editing.
	*/
	type Props = {
		orientation: Orientation;
		layout: LayoutElement[];
		accent?: string;
		backgroundColor?: string;
		backgroundUrl?: string | null;
		/** The card's real values, keyed by element kind. Omitted in the editor. */
		data?: CardData;
		/** A signed or absolute URL for the `photo` element, if there is one. */
		photoUrl?: string | null;
		class?: string;
	};

	let {
		orientation,
		layout,
		accent = '#7c3aed',
		backgroundColor = '#ffffff',
		backgroundUrl = null,
		data,
		photoUrl = null,
		class: className = ''
	}: Props = $props();

	// A signed absolute URL is used as-is; an API-relative path is reached through
	// the same `/api` edge every other call goes through.
	function edge(url: string | null): string | null {
		if (!url) return null;
		return /^https?:\/\//.test(url) ? url : `/api${url}`;
	}

	const bgSrc = $derived(edge(backgroundUrl));
	const photoSrc = $derived(edge(photoUrl));
</script>

<div
	class="idcanvas {className}"
	style:aspect-ratio={String(aspectRatio(orientation))}
	style:background-color={backgroundColor}
>
	{#if bgSrc}
		<img class="idcanvas__bg" src={bgSrc} alt="" aria-hidden="true" />
	{/if}

	<div class="idcanvas__bar" style:background-color={accent}></div>

	{#each layout as el (el.id)}
		{#if kindSpec(el.kind).photo}
			<div
				class="idcanvas__photo"
				style:left="{el.x * 100}%"
				style:top="{el.y * 100}%"
				style:width="{el.w * 100}%"
				style:border-color={accent}
			>
				{#if photoSrc}
					<img src={photoSrc} alt="" aria-hidden="true" />
				{:else}
					<span style:color={el.color} style:font-size="{el.fontSize * 100}cqw">Photo</span>
				{/if}
			</div>
		{:else}
			<div
				class="idcanvas__el"
				style:left="{el.x * 100}%"
				style:top="{el.y * 100}%"
				style:width="{el.w * 100}%"
				style:font-size="{el.fontSize * 100}cqw"
				style:font-weight={el.fontWeight}
				style:color={el.color}
				style:text-align={el.align}
			>
				{displayText(el, data)}
			</div>
		{/if}
	{/each}
</div>

<style>
	.idcanvas {
		container-type: inline-size;
		position: relative;
		width: 100%;
		overflow: hidden;
		border-radius: 0.75rem;
	}

	.idcanvas__bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.idcanvas__bar {
		position: absolute;
		inset: 0 0 auto 0;
		height: 4cqw;
	}

	.idcanvas__el {
		position: absolute;
		line-height: 1.2;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.idcanvas__photo {
		position: absolute;
		aspect-ratio: 4 / 5;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border: 0.6cqw solid;
		border-radius: 0.5rem;
		background: color-mix(in srgb, currentColor 4%, transparent);
	}

	.idcanvas__photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
