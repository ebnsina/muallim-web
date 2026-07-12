<script lang="ts">
	import type { Segment } from './Donut.svelte';

	type Props = {
		segments: Segment[];
		hovered?: string | null;
		/** Names what the rows are, for the table this legend actually is. */
		caption: string;
	};

	let { segments, hovered = $bindable(null), caption }: Props = $props();

	const total = $derived(segments.reduce((sum, s) => sum + s.value, 0));

	function share(value: number): number {
		return total === 0 ? 0 : Math.round((value / total) * 100);
	}
</script>

<!--
	A table, not a list of coloured dots.

	It is the legend and the table view at once: identity is carried by the label and
	the number, never by the colour alone, so this reads correctly to somebody who
	cannot tell the swatches apart and to a screen reader, which gets figures instead
	of a description of a picture of them.

	Hovering a row lights its slice, and hovering a slice lights its row — the same
	`hovered` value, bound in both directions.
-->
<table class="w-full text-sm">
	<caption class="sr-only">{caption}</caption>
	<thead class="sr-only">
		<tr>
			<th scope="col">Status</th>
			<th scope="col">Learners</th>
			<th scope="col">Share</th>
		</tr>
	</thead>
	<tbody>
		{#each segments as segment (segment.key)}
			<tr
				class={[
					'transition-opacity',
					hovered && hovered !== segment.key ? 'opacity-40' : 'opacity-100'
				]}
				onmouseenter={() => (hovered = segment.key)}
				onmouseleave={() => (hovered = null)}
				onfocusin={() => (hovered = segment.key)}
				onfocusout={() => (hovered = null)}
			>
				<th scope="row" class="py-1.5 pr-3 text-left font-normal">
					<!--
						A button, because it is focusable and announces itself as operable: the
						keyboard must reach the same highlighting the pointer does, and a row that
						lights only on hover is a row half the readers never light. Tabbing to it
						lights the slice; the row's own focus handlers do that for the whole row.
					-->
					<button
						type="button"
						class="flex items-center gap-2.5 rounded-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						aria-pressed={hovered === segment.key}
						onclick={() => (hovered = hovered === segment.key ? null : segment.key)}
					>
						<span class={['size-2.5 shrink-0 rounded-full bg-current', segment.tone]}></span>
						{segment.label}
					</button>
				</th>
				<td class="numeral py-1.5 pr-3 text-right font-medium">{segment.value}</td>
				<td class="text-muted numeral py-1.5 text-right text-xs">{share(segment.value)}%</td>
			</tr>
		{/each}
	</tbody>
</table>
