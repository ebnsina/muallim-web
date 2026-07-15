<script lang="ts">
	import { PaintBrush01Icon, Delete02Icon, Tick02Icon } from '@hugeicons/core-free-icons';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	/**
	 * Draw a freehand answer and attach it — the learner's answer to a `draw_image`
	 * question, which a person marks.
	 *
	 * The drawing is a canvas. On attach it is exported to a PNG and handed to
	 * `upload`, which the page wires to the API's presigned-upload flow; the object
	 * key it returns goes into a hidden field, and that key is the answer. Nothing is
	 * graded automatically — an instructor opens the drawing and marks it.
	 */
	let {
		name,
		backdrop,
		upload
	}: {
		name: string;
		backdrop?: string;
		/** Sends the PNG to the store and returns its key, or null on failure. */
		upload: (blob: Blob) => Promise<string | null>;
	} = $props();

	const WIDTH = 480;
	const HEIGHT = 320;

	let canvas = $state<HTMLCanvasElement | null>(null);
	let drawing = false;
	let dirty = $state(false);
	let busy = $state(false);
	let key = $state('');

	function context(): CanvasRenderingContext2D | null {
		return canvas?.getContext('2d') ?? null;
	}

	// The backdrop is painted onto the canvas so the exported PNG carries it — an
	// instructor sees the drawing over what it was drawn on. Redrawn on clear too.
	function paintBackdrop() {
		const ctx = context();
		if (!ctx) return;
		ctx.clearRect(0, 0, WIDTH, HEIGHT);
		if (!backdrop) return;

		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = () => ctx.drawImage(image, 0, 0, WIDTH, HEIGHT);
		image.src = backdrop;
	}

	$effect(() => {
		if (canvas) paintBackdrop();
	});

	function at(event: PointerEvent): { x: number; y: number } {
		const rect = canvas!.getBoundingClientRect();
		return {
			x: ((event.clientX - rect.left) / rect.width) * WIDTH,
			y: ((event.clientY - rect.top) / rect.height) * HEIGHT
		};
	}

	function start(event: PointerEvent) {
		const ctx = context();
		if (!ctx) return;
		drawing = true;
		const p = at(event);
		ctx.beginPath();
		ctx.moveTo(p.x, p.y);
		ctx.lineWidth = 2.5;
		ctx.lineCap = 'round';
		ctx.strokeStyle = '#1c2230';
		canvas!.setPointerCapture(event.pointerId);
	}

	function move(event: PointerEvent) {
		if (!drawing) return;
		const ctx = context();
		if (!ctx) return;
		const p = at(event);
		ctx.lineTo(p.x, p.y);
		ctx.stroke();
		dirty = true;
		// A new drawing invalidates a previously attached one.
		key = '';
	}

	function stop() {
		drawing = false;
	}

	function clear() {
		paintBackdrop();
		dirty = false;
		key = '';
	}

	async function attach() {
		if (!canvas || !dirty) return;
		busy = true;
		try {
			const blob = await new Promise<Blob | null>((resolve) =>
				canvas!.toBlob((b) => resolve(b), 'image/png')
			);
			if (!blob) return;
			const returned = await upload(blob);
			if (returned) key = returned;
		} finally {
			busy = false;
		}
	}
</script>

<div class="space-y-2">
	<canvas
		bind:this={canvas}
		width={WIDTH}
		height={HEIGHT}
		onpointerdown={start}
		onpointermove={move}
		onpointerup={stop}
		onpointerleave={stop}
		aria-label="Drawing area"
		class="block w-full max-w-full touch-none rounded-card border border-border bg-white"
		style="aspect-ratio: {WIDTH} / {HEIGHT}"
	></canvas>

	<input type="hidden" {name} value={key} />

	<div class="flex items-center gap-3">
		<Button type="button" variant="secondary" onclick={attach} disabled={!dirty || busy}>
			<Icon icon={Tick02Icon} class="size-4" />
			{busy ? 'Attaching…' : key ? 'Attached' : 'Attach drawing'}
		</Button>
		<Button type="button" variant="ghost" onclick={clear} disabled={busy}>
			<Icon icon={Delete02Icon} class="size-4" />
			Clear
		</Button>
		<span class="text-muted flex items-center gap-1.5 text-xs" role="status">
			<Icon icon={PaintBrush01Icon} class="size-3.5" />
			{#if key}
				Drawing attached.
			{:else if dirty}
				Attach your drawing before you submit.
			{:else}
				Draw your answer above.
			{/if}
		</span>
	</div>
</div>
