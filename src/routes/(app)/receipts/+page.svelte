<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		ArrowTurnBackwardIcon,
		CancelCircleIcon,
		CheckmarkCircle02Icon,
		Clock01Icon,
		Invoice01Icon
	} from '@hugeicons/core-free-icons';
	import type { IconSvgElement } from '@hugeicons/svelte';
	import { Badge, Button, EmptyState, Page, PageHeader } from '$lib/components';
	import { orderLabel, orderTone, type OrderStatus } from '$lib/billing';
	import { formatMoney } from '$lib/money';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

	// A status wears a mark, not a color alone.
	const ICONS: Record<OrderStatus, IconSvgElement> = {
		paid: CheckmarkCircle02Icon,
		pending: Clock01Icon,
		failed: CancelCircleIcon,
		refunded: ArrowTurnBackwardIcon
	};
</script>

<svelte:head><title>Purchases — Muallim</title></svelte:head>

<Page width="wide">
	<PageHeader
		title="Purchases"
		description="Every course you have bought from this workspace. A refund is issued by the workspace itself — it is the merchant, not Muallim."
	/>

	{#if data.orders.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={Invoice01Icon}
				title="Nothing bought yet"
				description="Courses you buy appear here with what you paid and when."
			>
				{#snippet action()}
					<Button href={resolve('/courses')} size="sm">Browse courses</Button>
				{/snippet}
			</EmptyState>
		</div>
	{:else}
		<div class="mt-8 overflow-x-auto rounded-card bg-surface-raised shadow-card">
			<table class="w-full border-collapse text-sm">
				<caption class="sr-only">Your orders: the course, what it cost, and how it ended.</caption>

				<thead>
					<tr class="border-b border-border bg-surface-sunken text-left">
						<th scope="col" class="px-4 py-3 font-medium">Course</th>
						<th scope="col" class="px-4 py-3 font-medium">Price</th>
						<th scope="col" class="px-4 py-3 font-medium">Status</th>
						<th scope="col" class="px-4 py-3 font-medium">Date</th>
					</tr>
				</thead>

				<tbody>
					{#each data.orders as order (order.id)}
						<tr class="border-b border-border last:border-0 hover:bg-surface-sunken">
							<th scope="row" class="px-4 py-3 text-left font-normal">
								{#if order.course}
									<a
										class="underline-grow font-medium"
										href={resolve(`/courses/${order.course.slug}`)}
									>
										{order.course.title}
									</a>
								{:else}
									<!-- The order is real; the course is not in the catalog this reader sees. -->
									<span class="text-muted">No longer listed</span>
								{/if}
							</th>

							<td class="numeral px-4 py-3 whitespace-nowrap">{formatMoney(order.price)}</td>

							<td class="px-4 py-3">
								<Badge tone={orderTone(order.status)} icon={ICONS[order.status]}>
									{orderLabel(order.status)}
								</Badge>
							</td>

							<td class="text-muted numeral px-4 py-3 whitespace-nowrap">
								{when.format(new Date(order.paid_at ?? order.created_at))}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</Page>
