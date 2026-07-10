<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight01Icon, Mortarboard02Icon } from '@hugeicons/core-free-icons';
	import { Badge, EmptyState, Icon, Page, PageHeader, Row } from '$lib/components';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' });
</script>

<svelte:head><title>Certificates — Muallim</title></svelte:head>

<Page width="wide">
	<PageHeader
		title="Your certificates"
		description="Earned by finishing a course. Each has a number anybody can verify."
	/>

	{#if data.certificates.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={Mortarboard02Icon}
				title="No certificates yet"
				description="Finish a course and its certificate appears here."
			/>
		</div>
	{:else}
		<ul class="mt-8 space-y-2">
			{#each data.certificates as certificate (certificate.serial)}
				<li>
					<Row href={resolve(`/certificates/${certificate.serial}`)}>
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
