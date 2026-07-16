<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		ArrowLeft01Icon,
		Delete02Icon,
		FloppyDiskIcon,
		ImageUpload01Icon,
		TextAlignCenterIcon,
		TextAlignLeftIcon,
		TextAlignRightIcon
	} from '@hugeicons/core-free-icons';
	import {
		addElement,
		aspectRatio,
		ALIGNMENTS,
		displayText,
		ELEMENT_KINDS,
		kindSpec,
		normalizeLayout,
		removeElement,
		updateElement,
		type Align,
		type ElementKind,
		type LayoutElement,
		type Orientation
	} from '$lib/certdesign';
	import { Alert, Button, CertificateCanvas, Card, Icon, Input, Label } from '$lib/components';
	import { actionMessage, callAction } from '$lib/form';
	import { putToStore, type SignedUpload } from '$lib/upload';
	import { toast } from '$lib/toast.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// The editable document. Seeded once from the server; from here the page owns
	// it, so a background upload's re-read never discards unsaved layout work. The
	// snapshot is captured to a plain const so seeding is explicitly a one-time read.
	// svelte-ignore state_referenced_locally
	const seed = data.design;
	let name = $state(seed.name);
	let orientation = $state<Orientation>(seed.orientation as Orientation);
	let accent = $state(seed.accent ?? '#7c3aed');
	let backgroundColor = $state(seed.background_color ?? '#ffffff');
	let backgroundUrl = $state<string | null>(seed.background_url ?? null);
	let layout = $state<LayoutElement[]>(normalizeLayout(seed.layout));

	let selectedId = $state<string | null>(null);
	let saving = $state(false);
	let uploadingBg = $state(false);
	let errorMessage = $state<string | null>(null);

	let canvasEl = $state<HTMLDivElement | null>(null);
	let bgInput = $state<HTMLInputElement | null>(null);

	const selected = $derived(layout.find((el) => el.id === selectedId) ?? null);
	const bgSrc = $derived(
		backgroundUrl
			? /^https?:\/\//.test(backgroundUrl)
				? backgroundUrl
				: `/api${backgroundUrl}`
			: null
	);
	const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

	function patch(id: string, change: Partial<LayoutElement>) {
		layout = updateElement(layout, id, change);
	}

	function add(kind: ElementKind) {
		layout = addElement(layout, kind);
		selectedId = layout[layout.length - 1].id;
	}

	function remove(id: string) {
		layout = removeElement(layout, id);
		if (selectedId === id) selectedId = null;
	}

	function clamp(n: number, lo: number, hi: number) {
		return Math.min(hi, Math.max(lo, n));
	}

	/**
	 * Pointer drag as a fraction of the canvas. It reports incremental deltas in
	 * CSS pixels; the caller turns them into the 0..1 coordinates the layout speaks.
	 */
	function draggable(
		node: HTMLElement,
		opts: { onstart?: () => void; onmove: (dx: number, dy: number) => void; stop?: boolean }
	) {
		let px = 0;
		let py = 0;
		let dragging = false;

		function down(e: PointerEvent) {
			if (e.button !== 0) return;
			if (opts.stop) e.stopPropagation();
			e.preventDefault();
			dragging = true;
			px = e.clientX;
			py = e.clientY;
			node.setPointerCapture(e.pointerId);
			opts.onstart?.();
		}
		function move(e: PointerEvent) {
			if (!dragging) return;
			opts.onmove(e.clientX - px, e.clientY - py);
			px = e.clientX;
			py = e.clientY;
		}
		function up(e: PointerEvent) {
			if (!dragging) return;
			dragging = false;
			try {
				node.releasePointerCapture(e.pointerId);
			} catch {
				/* pointer already released */
			}
		}

		node.addEventListener('pointerdown', down);
		node.addEventListener('pointermove', move);
		node.addEventListener('pointerup', up);
		node.addEventListener('pointercancel', up);

		return {
			update(next: typeof opts) {
				opts = next;
			},
			destroy() {
				node.removeEventListener('pointerdown', down);
				node.removeEventListener('pointermove', move);
				node.removeEventListener('pointerup', up);
				node.removeEventListener('pointercancel', up);
			}
		};
	}

	function moveElement(el: LayoutElement, dx: number, dy: number) {
		const rect = canvasEl?.getBoundingClientRect();
		if (!rect) return;
		patch(el.id, {
			x: clamp(el.x + dx / rect.width, 0, 1 - el.w),
			y: clamp(el.y + dy / rect.height, 0, 0.98)
		});
	}

	function resizeElement(el: LayoutElement, dx: number) {
		const rect = canvasEl?.getBoundingClientRect();
		if (!rect) return;
		patch(el.id, { w: clamp(el.w + dx / rect.width, 0.08, 1 - el.x) });
	}

	function nudge(e: KeyboardEvent, el: LayoutElement) {
		const step = e.shiftKey ? 0.02 : 0.005;
		let handled = true;
		if (e.key === 'ArrowLeft') patch(el.id, { x: clamp(el.x - step, 0, 1 - el.w) });
		else if (e.key === 'ArrowRight') patch(el.id, { x: clamp(el.x + step, 0, 1 - el.w) });
		else if (e.key === 'ArrowUp') patch(el.id, { y: clamp(el.y - step, 0, 0.98) });
		else if (e.key === 'ArrowDown') patch(el.id, { y: clamp(el.y + step, 0, 0.98) });
		else if (e.key === 'Backspace' || e.key === 'Delete') remove(el.id);
		else handled = false;
		if (handled) e.preventDefault();
	}

	async function save() {
		saving = true;
		errorMessage = null;
		try {
			const payload = JSON.stringify({
				name,
				orientation,
				accent,
				background_color: backgroundColor,
				layout
			});
			const result = await callAction('?/save', { payload });
			if (result.type === 'success') {
				toast.success('Design saved.');
			} else {
				errorMessage = actionMessage(result, 'Could not save that design.');
				toast.danger(errorMessage);
			}
		} finally {
			saving = false;
		}
	}

	async function uploadBackground(file: File) {
		if (!IMAGE_TYPES.includes(file.type)) {
			toast.danger('A background must be a PNG, JPEG, or WebP.');
			return;
		}
		if (file.size > 5_000_000) {
			toast.danger('A background must be under 5 MB.');
			return;
		}

		uploadingBg = true;
		try {
			const signed = await callAction('?/presignBackground', {
				content_type: file.type,
				bytes: file.size
			});
			if (signed.type !== 'success') {
				toast.danger(actionMessage(signed, 'That image could not be uploaded.'));
				return;
			}

			const upload = signed.data?.backgroundUpload as SignedUpload;
			await putToStore(upload, file);

			const confirmed = await callAction('?/confirmBackground', { key: upload.key });
			if (confirmed.type !== 'success') {
				toast.danger(actionMessage(confirmed, 'That image could not be saved.'));
				return;
			}

			backgroundUrl = (confirmed.data?.backgroundUrl as string | null) ?? backgroundUrl;
			toast.success('Background updated.');
		} catch (problem) {
			toast.danger(problem instanceof Error ? problem.message : 'That upload failed.');
		} finally {
			uploadingBg = false;
			if (bgInput) bgInput.value = '';
		}
	}
</script>

<svelte:head><title>{name} — Certificate builder — Muallim</title></svelte:head>

<div class="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6">
	<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-3">
			<Button href={resolve('/teach/certificate-builder')} variant="ghost" size="sm">
				<Icon icon={ArrowLeft01Icon} class="size-4" />
				All designs
			</Button>
			<h1 class="text-lg font-semibold">Certificate designer</h1>
		</div>
		<Button onclick={save} disabled={saving}>
			<Icon icon={FloppyDiskIcon} class="size-4" />
			{saving ? 'Saving…' : 'Save'}
		</Button>
	</div>

	{#if errorMessage}
		<Alert tone="danger" class="mb-4" role="alert">{errorMessage}</Alert>
	{/if}

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_300px]">
		<!-- Palette + document settings -->
		<aside class="flex flex-col gap-5">
			<Card class="flex flex-col gap-3">
				<Label for="design-name">Name</Label>
				<Input id="design-name" bind:value={name} maxlength={120} />

				<Label for="orientation">Orientation</Label>
				<div class="flex gap-2" id="orientation">
					{#each ['landscape', 'portrait'] as const as o (o)}
						<Button
							variant={orientation === o ? 'primary' : 'secondary'}
							size="sm"
							class="flex-1 capitalize"
							onclick={() => (orientation = o)}
						>
							{o}
						</Button>
					{/each}
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<Label for="accent">Accent</Label>
						<input
							id="accent"
							type="color"
							class="mt-1 h-9 w-full cursor-pointer rounded-md border border-[var(--color-border-control)]"
							bind:value={accent}
						/>
					</div>
					<div>
						<Label for="bg-color">Background</Label>
						<input
							id="bg-color"
							type="color"
							class="mt-1 h-9 w-full cursor-pointer rounded-md border border-[var(--color-border-control)]"
							bind:value={backgroundColor}
						/>
					</div>
				</div>

				<Label for="bg-image">Background image</Label>
				<input
					bind:this={bgInput}
					id="bg-image"
					type="file"
					class="sr-only"
					accept="image/png,image/jpeg,image/webp"
					disabled={uploadingBg}
					onchange={(e) => {
						const chosen = (e.currentTarget as HTMLInputElement).files?.[0];
						if (chosen) uploadBackground(chosen);
					}}
				/>
				<div class="flex items-center gap-2">
					<Button
						variant="secondary"
						size="sm"
						class="grow"
						disabled={uploadingBg}
						onclick={() => bgInput?.click()}
					>
						<Icon icon={ImageUpload01Icon} class="size-4" />
						{uploadingBg ? 'Uploading…' : backgroundUrl ? 'Replace' : 'Upload'}
					</Button>
					{#if backgroundUrl}
						<Button variant="ghost" size="sm" onclick={() => (backgroundUrl = null)}>Clear</Button>
					{/if}
				</div>
				{#if bgSrc}
					<img src={bgSrc} alt="Background preview" class="h-16 w-full rounded-md object-cover" />
				{/if}
			</Card>

			<Card class="flex flex-col gap-2">
				<p class="text-muted text-xs font-medium tracking-wide uppercase">Add element</p>
				<div class="grid grid-cols-2 gap-2">
					{#each ELEMENT_KINDS as k (k.kind)}
						<Button variant="secondary" size="sm" onclick={() => add(k.kind)}>{k.label}</Button>
					{/each}
				</div>
			</Card>
		</aside>

		<!-- The live editable canvas -->
		<div class="min-w-0">
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				bind:this={canvasEl}
				class="certedit"
				style:aspect-ratio={String(aspectRatio(orientation))}
				style:background-color={backgroundColor}
				role="group"
				aria-label="Certificate canvas"
				onpointerdown={(e) => {
					if (e.target === e.currentTarget) selectedId = null;
				}}
			>
				{#if bgSrc}
					<img class="certedit__bg" src={bgSrc} alt="" aria-hidden="true" />
				{/if}
				<div class="certedit__frame" style:border-color={accent}></div>

				{#each layout as el (el.id)}
					<div
						class="certedit__el"
						class:certedit__el--selected={el.id === selectedId}
						style:left="{el.x * 100}%"
						style:top="{el.y * 100}%"
						style:width="{el.w * 100}%"
						style:font-size="{el.fontSize * 100}cqw"
						style:font-weight={el.fontWeight}
						style:color={el.color}
						style:text-align={el.align}
						role="button"
						tabindex="0"
						aria-label="{kindSpec(el.kind).label}: {displayText(el)}"
						use:draggable={{
							stop: false,
							onstart: () => (selectedId = el.id),
							onmove: (dx, dy) => moveElement(el, dx, dy)
						}}
						onfocus={() => (selectedId = el.id)}
						onkeydown={(e) => nudge(e, el)}
					>
						{displayText(el)}
						{#if el.id === selectedId}
							<span
								class="certedit__handle"
								aria-hidden="true"
								use:draggable={{ stop: true, onmove: (dx) => resizeElement(el, dx) }}
							></span>
						{/if}
					</div>
				{/each}
			</div>
			<p class="text-muted mt-3 text-center text-xs">
				Drag to move · drag the corner to resize · arrow keys nudge the selected element
			</p>
		</div>

		<!-- Properties of the selected element -->
		<aside>
			<Card class="flex flex-col gap-4">
				{#if selected}
					{@const spec = kindSpec(selected.kind)}
					<div class="flex items-center justify-between">
						<h2 class="font-semibold">{spec.label}</h2>
						<Button
							variant="ghost"
							size="sm"
							aria-label="Remove element"
							onclick={() => remove(selected.id)}
						>
							<Icon icon={Delete02Icon} class="size-4" />
						</Button>
					</div>

					{#if spec.authored}
						<div>
							<Label for="el-text">Text</Label>
							<textarea
								id="el-text"
								class="mt-1 w-full resize-y rounded-md border border-[var(--color-border-control)] bg-[var(--color-surface)] p-2 text-sm"
								rows="2"
								maxlength={500}
								placeholder={spec.sample}
								value={selected.text}
								oninput={(e) =>
									patch(selected.id, { text: (e.currentTarget as HTMLTextAreaElement).value })}
							></textarea>
						</div>
					{:else}
						<p class="text-muted text-sm">
							Shows the learner's own {spec.label.toLowerCase()} on an issued certificate. The editor
							previews “{spec.sample}”.
						</p>
					{/if}

					<div>
						<Label for="el-size">Font size</Label>
						<input
							id="el-size"
							type="range"
							min="0.015"
							max="0.12"
							step="0.002"
							class="mt-2 w-full"
							value={selected.fontSize}
							oninput={(e) =>
								patch(selected.id, {
									fontSize: Number((e.currentTarget as HTMLInputElement).value)
								})}
						/>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<Label for="el-weight">Weight</Label>
							<select
								id="el-weight"
								class="mt-1 h-9 w-full rounded-md border border-[var(--color-border-control)] bg-[var(--color-surface)] px-2 text-sm"
								value={String(selected.fontWeight)}
								onchange={(e) =>
									patch(selected.id, {
										fontWeight: Number((e.currentTarget as HTMLSelectElement).value)
									})}
							>
								<option value="400">Regular</option>
								<option value="500">Medium</option>
								<option value="600">Semibold</option>
								<option value="700">Bold</option>
							</select>
						</div>
						<div>
							<Label for="el-color">Colour</Label>
							<input
								id="el-color"
								type="color"
								class="mt-1 h-9 w-full cursor-pointer rounded-md border border-[var(--color-border-control)]"
								value={selected.color}
								oninput={(e) =>
									patch(selected.id, { color: (e.currentTarget as HTMLInputElement).value })}
							/>
						</div>
					</div>

					<div>
						<Label for="el-align">Alignment</Label>
						<div class="mt-1 flex gap-2" id="el-align">
							{#each ALIGNMENTS as a (a)}
								<Button
									variant={selected.align === a ? 'primary' : 'secondary'}
									size="sm"
									class="flex-1"
									aria-label="Align {a}"
									aria-pressed={selected.align === a}
									onclick={() => patch(selected.id, { align: a as Align })}
								>
									<Icon
										icon={a === 'left'
											? TextAlignLeftIcon
											: a === 'right'
												? TextAlignRightIcon
												: TextAlignCenterIcon}
										class="size-4"
									/>
								</Button>
							{/each}
						</div>
					</div>
				{:else}
					<p class="text-muted text-sm">
						Select an element on the canvas to edit it, or add one from the palette.
					</p>
				{/if}
			</Card>

			<Card class="mt-5">
				<p class="text-muted mb-2 text-xs font-medium tracking-wide uppercase">Preview</p>
				<CertificateCanvas {orientation} {layout} {accent} {backgroundColor} {backgroundUrl} />
			</Card>
		</aside>
	</div>
</div>

<style>
	.certedit {
		container-type: inline-size;
		position: relative;
		width: 100%;
		overflow: hidden;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
		touch-action: none;
		user-select: none;
	}

	.certedit__bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.certedit__frame {
		position: absolute;
		inset: 3cqw;
		border: 0.4cqw solid;
		border-radius: 0.25rem;
		pointer-events: none;
	}

	.certedit__el {
		position: absolute;
		line-height: 1.2;
		white-space: pre-wrap;
		word-break: break-word;
		cursor: move;
		outline: 1px dashed transparent;
		outline-offset: 2px;
	}

	.certedit__el:hover {
		outline-color: color-mix(in srgb, var(--color-accent) 60%, transparent);
	}

	.certedit__el--selected {
		outline: 1px solid var(--color-accent);
	}

	.certedit__el:focus-visible {
		outline: 2px solid var(--color-accent);
	}

	.certedit__handle {
		position: absolute;
		right: -6px;
		bottom: -6px;
		width: 14px;
		height: 14px;
		border-radius: 9999px;
		background: var(--color-accent);
		border: 2px solid var(--color-surface);
		cursor: ew-resize;
	}
</style>
