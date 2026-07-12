<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight01Icon, Mortarboard02Icon } from '@hugeicons/core-free-icons';
	import { Badge, Card, EmptyState, Icon, Numeral, Page, Row } from '$lib/components';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' });
</script>

<svelte:head><title>Certificates — Muallim</title></svelte:head>

<Page width="wide">
	<!--
		The aurora, spent here for the same reason it is spent on the course you are
		part-way through: this is the page that is *about* having finished something. An
		award that looks like a filing cabinet is an award nobody frames.
	-->
	<Card surface="aurora" class="flex items-center gap-5 p-6 sm:p-8">
		<span
			class="hidden size-14 shrink-0 items-center justify-center rounded-full bg-on-solid/15 sm:flex"
		>
			<Icon icon={Mortarboard02Icon} class="size-7" />
		</span>

		<div class="min-w-0">
			<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Your certificates</h1>
			<p class="mt-1.5 text-sm text-on-solid/80">
				{#if data.certificates.length === 0}
					Earned by finishing a course. Each has a number anybody can verify.
				{:else}
					<Numeral countUp value={data.certificates.length} />
					{data.certificates.length === 1 ? 'certificate' : 'certificates'}, each with a number
					anybody can verify.
				{/if}
			</p>
		</div>
	</Card>

	{#if data.certificates.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={Mortarboard02Icon}
				title="No certificates yet"
				description="Finish a course and its certificate appears here."
			/>
		</div>
	{:else}
		<!--
			The anchor is outside the card so the whole certificate is the target, and the
			focus ring is drawn on it — a ring on the card inside would be a ring around
			something that is not what the keyboard is on.
		-->
		<ul class="mt-8 space-y-2">
			{#each data.certificates as certificate (certificate.serial)}
				<li>
					<Row float href={resolve(`/certificates/${certificate.serial}`)} class="lift">
						<div class="min-w-0">
							<p class="flex items-center gap-2 font-medium">
								<span class="truncate">{certificate.course_title}</span>
								{#if certificate.revoked}
									<Badge tone="danger">Withdrawn</Badge>
								{/if}
							</p>
							<p class="text-muted numeral text-xs">
								{certificate.serial} · {dateFormat.format(new Date(certificate.issued_at))}
							</p>
						</div>

						<Icon icon={ArrowRight01Icon} class="text-muted size-4 shrink-0" />
					</Row>
				</li>
			{/each}
		</ul>
	{/if}
</Page>
