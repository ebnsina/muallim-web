<script lang="ts">
	/**
	 * A light take on the settings / preferences list — the pattern from the dark
	 * reference: a modal card holding switch list items (leading icon tile · title ·
	 * supporting text · trailing toggle), closed by a primary CTA. Same structure,
	 * light surfaces, the marketing tokens (berry brand, Mona Sans). Live at
	 * /preview/settings.
	 */
	import { Icon } from '$lib/components';
	import {
		Pulse01Icon,
		Comment01Icon,
		Calendar01Icon,
		Mail01Icon
	} from '@hugeicons/core-free-icons';

	let rows = $state([
		{
			icon: Pulse01Icon,
			tone: 'brand',
			title: 'Activity Alerts',
			desc: 'Be informed about activity, like login alerts.',
			on: true
		},
		{
			icon: Comment01Icon,
			tone: 'indigo',
			title: 'Comments',
			desc: 'Comments on your posts and replies.',
			on: false
		},
		{
			icon: Calendar01Icon,
			tone: 'amber',
			title: 'Reminders',
			desc: 'Get timely alerts for important tasks and events.',
			on: false
		},
		{
			icon: Mail01Icon,
			tone: 'teal',
			title: 'Messages',
			desc: 'Stay informed about new direct messages.',
			on: false
		}
	]);
</script>

<svelte:head><title>Muallim — settings preview</title></svelte:head>

<div class="st">
	<div class="st-stage">
		<section class="st-card" aria-labelledby="st-title">
			<header class="st-head">
				<h1 id="st-title" class="st-title">Notification settings</h1>
				<p class="st-sub">Stay updated with important alerts, messages, and activities.</p>
			</header>

			<ul class="st-list">
				{#each rows as row (row.title)}
					<li class="st-row">
						<span class="st-ic st-ic-{row.tone}"><Icon icon={row.icon} class="size-5" /></span>
						<span class="st-text">
							<span class="st-row-title">{row.title}</span>
							<span class="st-row-desc">{row.desc}</span>
						</span>
						<button
							type="button"
							role="switch"
							aria-checked={row.on}
							aria-label={row.title}
							class="st-toggle"
							class:on={row.on}
							onclick={() => (row.on = !row.on)}
						>
							<span class="st-knob"></span>
						</button>
					</li>
				{/each}
			</ul>

			<button type="button" class="st-save">Save</button>
		</section>
	</div>
</div>

<style>
	.st {
		/* Berry brand + the icon spectrum + warm-neutral tokens, matching /preview. */
		--brand: #9d174d;
		--brand-strong: #831843;
		--brand-tint: #fbe3ee;
		--indigo: #4f46e5;
		--indigo-tint: #e8e7fb;
		--teal: #0d9488;
		--teal-tint: #d8f2ee;
		--amber: #c2620c;
		--amber-tint: #fbebd9;

		--ink: #211820;
		--muted: #6b5f66;
		--line: #ece7ea;
		--bg: #faf7f9;
		--surface: #ffffff;
		--surface-2: #f7f3f5;

		--body: 'Mona Sans Variable', ui-sans-serif, system-ui, -apple-system, sans-serif;

		color: var(--ink);
		font-family: var(--body);
	}

	/* A soft berry aurora behind the card, the light answer to the dark reference's
	   ambient glow. */
	.st-stage {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 2rem 1.25rem;
		background-color: var(--bg);
		background-image:
			radial-gradient(
				40rem 30rem at 25% 0%,
				color-mix(in oklab, var(--brand) 16%, transparent),
				transparent 60%
			),
			radial-gradient(
				34rem 26rem at 100% 100%,
				color-mix(in oklab, var(--indigo) 12%, transparent),
				transparent 60%
			);
		background-repeat: no-repeat;
	}

	.st-card {
		width: 100%;
		max-width: 30rem;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 22px;
		padding: 1.75rem;
	}

	.st-title {
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		margin: 0;
	}
	.st-sub {
		margin: 0.4rem 0 0;
		color: var(--muted);
		font-size: 0.92rem;
		line-height: 1.5;
	}

	.st-list {
		list-style: none;
		margin: 1.5rem 0 0;
		padding: 0;
	}
	.st-row {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 1rem 0;
		border-top: 1px solid var(--line);
	}
	.st-row:first-child {
		border-top: 0;
		padding-top: 0.25rem;
	}

	.st-ic {
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 12px;
	}
	.st-ic-brand {
		background: var(--brand-tint);
		color: var(--brand);
	}
	.st-ic-indigo {
		background: var(--indigo-tint);
		color: var(--indigo);
	}
	.st-ic-amber {
		background: var(--amber-tint);
		color: var(--amber);
	}
	.st-ic-teal {
		background: var(--teal-tint);
		color: var(--teal);
	}

	.st-text {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
		flex: 1;
	}
	.st-row-title {
		font-weight: 600;
		font-size: 0.98rem;
	}
	.st-row-desc {
		color: var(--muted);
		font-size: 0.85rem;
		line-height: 1.4;
	}

	/* The switch: a pill track with a knob that slides, brand-filled when on. */
	.st-toggle {
		flex: 0 0 auto;
		width: 3rem;
		height: 1.65rem;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--surface-2);
		padding: 0;
		cursor: pointer;
		position: relative;
		transition:
			background 0.16s ease,
			border-color 0.16s ease;
	}
	.st-toggle.on {
		background: var(--brand);
		border-color: var(--brand);
	}
	.st-toggle:focus-visible {
		outline: 2px solid var(--brand);
		outline-offset: 2px;
	}
	.st-knob {
		position: absolute;
		top: 50%;
		left: 0.18rem;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 999px;
		background: #fff;
		transform: translateY(-50%);
		box-shadow: 0 1px 2px rgba(33, 24, 32, 0.25);
		transition: left 0.16s ease;
	}
	.st-toggle.on .st-knob {
		left: calc(100% - 1.43rem);
	}

	.st-save {
		margin-top: 1.5rem;
		width: 100%;
		padding: 0.95rem 1.5rem;
		border: 0;
		border-radius: 0.75rem;
		font: inherit;
		font-weight: 600;
		font-size: 1.02rem;
		color: #fff;
		cursor: pointer;
		background: linear-gradient(180deg, var(--brand), var(--brand-strong));
		transition: filter 0.12s ease;
	}
	.st-save:hover {
		filter: brightness(1.06);
	}

	@media (prefers-reduced-motion: reduce) {
		.st-toggle,
		.st-knob,
		.st-save {
			transition: none;
		}
	}
</style>
