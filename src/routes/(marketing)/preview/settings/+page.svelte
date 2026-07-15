<script lang="ts">
	/**
	 * The settings / preferences list, composed from the marketing UI kit — a frosted
	 * Card of switch rows (IconChip · title · supporting text · Toggle), closed by a
	 * Button. No bespoke CSS beyond the page's own aurora stage. Live at
	 * /preview/settings.
	 */
	import { Card, Toggle, IconChip, Button } from '$lib/features/marketing/ui';
	import {
		Pulse01Icon,
		Comment01Icon,
		Calendar01Icon,
		Mail01Icon
	} from '@hugeicons/core-free-icons';

	let rows = $state([
		{
			icon: Pulse01Icon,
			tone: 'brand' as const,
			title: 'Activity Alerts',
			desc: 'Be informed about activity, like login alerts.',
			on: true
		},
		{
			icon: Comment01Icon,
			tone: 'indigo' as const,
			title: 'Comments',
			desc: 'Comments on your posts and replies.',
			on: false
		},
		{
			icon: Calendar01Icon,
			tone: 'amber' as const,
			title: 'Reminders',
			desc: 'Get timely alerts for important tasks and events.',
			on: false
		},
		{
			icon: Mail01Icon,
			tone: 'teal' as const,
			title: 'Messages',
			desc: 'Stay informed about new direct messages.',
			on: false
		}
	]);
</script>

<svelte:head><title>Muallim — settings preview</title></svelte:head>

<div class="stage">
	<Card class="w-full max-w-[30rem]">
		<header>
			<h1 class="title">Notification settings</h1>
			<p class="sub">Stay updated with important alerts, messages, and activities.</p>
		</header>

		<ul class="list">
			{#each rows as row (row.title)}
				<li class="row">
					<IconChip icon={row.icon} tone={row.tone} />
					<span class="text">
						<span class="row-title">{row.title}</span>
						<span class="row-desc">{row.desc}</span>
					</span>
					<Toggle bind:checked={row.on} label={row.title} />
				</li>
			{/each}
		</ul>

		<Button class="mt-6 w-full justify-center">Save</Button>
	</Card>
</div>

<style>
	/* A soft aurora behind the card, the light answer to the dark reference's glow. */
	.stage {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 2rem 1.25rem;
		background-color: var(--bg);
		background-image:
			radial-gradient(
				38rem 30rem at 18% 6%,
				color-mix(in oklab, var(--brand) 30%, transparent),
				transparent 60%
			),
			radial-gradient(
				34rem 28rem at 100% 96%,
				color-mix(in oklab, var(--indigo) 26%, transparent),
				transparent 60%
			),
			radial-gradient(
				30rem 24rem at 78% 12%,
				color-mix(in oklab, var(--amber) 18%, transparent),
				transparent 60%
			);
		background-repeat: no-repeat;
	}

	.title {
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		margin: 0;
	}
	.sub {
		margin: 0.4rem 0 0;
		color: var(--muted);
		font-size: 0.92rem;
		line-height: 1.5;
	}

	.list {
		list-style: none;
		margin: 1.5rem 0 0;
		padding: 0;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 1rem 0;
		border-top: 1px solid var(--line);
	}
	.row:first-child {
		border-top: 0;
		padding-top: 0.25rem;
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
		flex: 1;
	}
	.row-title {
		font-weight: 600;
		font-size: 0.98rem;
	}
	.row-desc {
		color: var(--muted);
		font-size: 0.85rem;
		line-height: 1.4;
	}
</style>
