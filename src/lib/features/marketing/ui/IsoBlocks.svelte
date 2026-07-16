<script lang="ts">
	/*
		A stack of blocks, drawn isometrically: the pieces a school is built from.

		Not a render — there is no 3D pipeline here and no asset pack, so each block is
		three shaded faces and four studs, laid out on an isometric grid. It reads as
		built rather than photographed, which is honest about what it is.

		The dashed line threads the stack the way the product threads the parts: a
		register, a timetable, a report card, one thing. Nothing moves — it is a
		picture, and a picture that performs is a picture somebody has to wait for.
	*/
	type Props = {
		/** The hue family, so a card's blocks belong to the card. */
		tone?: 'lime' | 'lav';
	};
	let { tone = 'lime' }: Props = $props();

	const ramp = $derived(
		tone === 'lime'
			? { top: '#eaf5cf', left: '#c4e84b', right: '#93b93a', stud: '#f4faE4', line: '#7e9c2a' }
			: { top: '#efedfb', left: '#c9c3f0', right: '#9990d8', stud: '#f7f6fd', line: '#6f63c9' }
	);

	// Where each block sits on the isometric grid, in column/row/height.
	const blocks = [
		{ x: 0, y: 1, z: 0 },
		{ x: 1, y: 0, z: 0 },
		{ x: 1, y: 1, z: 0 },
		{ x: 2, y: 1, z: 0 },
		{ x: 1, y: 1, z: 1 }
	];

	// Half-width, quarter-height, wall depth: the isometric cell.
	const W = 30;
	const H = 15;
	const D = 22;

	// Grid to screen. Painter's order: back to front, bottom to top.
	const placed = $derived(
		blocks
			.map((b) => ({
				...b,
				sx: 100 + (b.x - b.y) * W,
				sy: 96 + (b.x + b.y) * (H / 2) - b.z * D
			}))
			.sort((a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z)
	);

	const id = $props.id();
</script>

<span class="blocks" aria-hidden="true">
	<svg viewBox="0 0 200 200" fill="none">
		<defs>
			<linearGradient id="top-{id}" x1="0" y1="0" x2="0.6" y2="1">
				<stop offset="0%" stop-color={ramp.stud} />
				<stop offset="100%" stop-color={ramp.top} />
			</linearGradient>
			<linearGradient id="left-{id}" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color={ramp.left} />
				<stop offset="100%" stop-color={ramp.right} />
			</linearGradient>
		</defs>

		<!-- The thread through the stack, drawn on the way past. -->
		<path
			class="thread"
			d="M8 150c26-6 40 14 62 6M130 120c24 10 44-6 62 2"
			stroke={ramp.line}
			stroke-width="2"
			stroke-dasharray="5 6"
			stroke-linecap="round"
			pathLength="100"
		/>

		{#each placed as b (`${b.x}-${b.y}-${b.z}`)}
			<g class="block">
				<!-- Left wall, right wall, then the lid: the order a brick is seen in. -->
				<path
					d="M{b.sx - W} {b.sy} L{b.sx} {b.sy + H} L{b.sx} {b.sy + H + D} L{b.sx - W} {b.sy + D} Z"
					fill="url(#left-{id})"
				/>
				<path
					d="M{b.sx + W} {b.sy} L{b.sx} {b.sy + H} L{b.sx} {b.sy + H + D} L{b.sx + W} {b.sy + D} Z"
					fill={ramp.right}
				/>
				<path
					d="M{b.sx} {b.sy - H} L{b.sx + W} {b.sy} L{b.sx} {b.sy + H} L{b.sx - W} {b.sy} Z"
					fill="url(#top-{id})"
				/>
				<!-- Studs, on the diagonals of the lid. -->
				{#each [[-0.5, 0], [0, -0.5], [0, 0.5], [0.5, 0]] as [dx, dy] (`${dx}-${dy}`)}
					<ellipse
						cx={b.sx + dx * W}
						cy={b.sy + dy * H * 2}
						rx="7"
						ry="3.6"
						fill={ramp.stud}
						opacity="0.9"
					/>
				{/each}
			</g>
		{/each}
	</svg>
</span>

<style>
	.blocks {
		position: absolute;
		right: -3rem;
		bottom: -3.5rem;
		z-index: 0;
		display: block;
		width: 24rem;
		height: 24rem;
		pointer-events: none;
		opacity: 0.9;
	}
	.blocks svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.thread {
		stroke-dashoffset: 0;
	}
</style>
