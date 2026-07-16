<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowTurnBackwardIcon,
		CancelCircleIcon,
		CheckmarkCircle02Icon,
		Clock01Icon,
		MoneyReceive01Icon
	} from '@hugeicons/core-free-icons';
	import type { IconSvgElement } from '@hugeicons/svelte';
	import { Alert, Badge, Button, EmptyState, Icon, Page, PageHeader } from '$lib/components';
	import { gatewayLabel, orderLabel, orderTone, type OrderStatus } from '$lib/billing';
	import { formatMoney } from '$lib/money';
	import { toast } from '$lib/toast.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

	const ICONS: Record<OrderStatus, IconSvgElement> = {
		paid: CheckmarkCircle02Icon,
		pending: Clock01Icon,
		failed: CancelCircleIcon,
		refunded: ArrowTurnBackwardIcon
	};

	// A refund moves real money, so it is asked about before it is done. The question
	// takes the place of the button, in the button's own cell: no dialog, no jump.
	let confirming = $state<string | null>(null);
	let refunding = $state<string | null>(null);
</script>

<svelte:head><title>Sales — Muallim</title></svelte:head>

<Page width="full">
	<PageHeader
		title="Sales"
		description="Every order this workspace has taken. You are the merchant: the money is yours, and so is the refund."
	>
		{#snippet actions()}
			<Button href={resolve('/teach')} variant="secondary" size="sm">Your courses</Button>
		{/snippet}
	</PageHeader>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	{#if data.orders.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={MoneyReceive01Icon}
				title="No sales yet"
				description="Put a price on a course and set up a way to take payment, and every order appears here."
			/>
		</div>
	{:else}
		<div class="mt-8 overflow-x-auto rounded-card bg-surface-raised shadow-card">
			<table class="w-full border-collapse text-sm">
				<caption class="sr-only">
					Every order: the course, its price, how it ended, how it was paid, and when.
				</caption>

				<thead>
					<tr class="border-b border-border bg-surface-sunken text-left">
						<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Course</th>
						<th scope="col" class="px-4 py-3 font-medium">Price</th>
						<th scope="col" class="px-4 py-3 font-medium">Status</th>
						<th scope="col" class="px-4 py-3 font-medium">Paid with</th>
						<th scope="col" class="px-4 py-3 font-medium">Placed</th>
						<th scope="col" class="px-4 py-3 font-medium">Paid</th>
						<!-- Wide enough for the question the button turns into: asking must not
						     widen the table under the reader. -->
						<th scope="col" class="w-48 px-4 py-3 text-right font-medium">
							<span class="sr-only">Refund</span>
						</th>
					</tr>
				</thead>

				<tbody>
					{#each data.orders as order (order.id)}
						<tr class="border-b border-border last:border-0 hover:bg-surface-sunken">
							<th scope="row" class="px-4 py-3 text-left font-normal whitespace-nowrap">
								{#if order.course}
									<a
										class="underline-grow font-medium"
										href={resolve(`/teach/${order.course.slug}`)}
									>
										{order.course.title}
									</a>
								{:else}
									<!-- Not one of this author's courses. The order is still theirs to see. -->
									<span class="text-muted numeral text-xs">{order.course_id}</span>
								{/if}
							</th>

							<td class="numeral px-4 py-3 whitespace-nowrap">{formatMoney(order.price)}</td>

							<td class="px-4 py-3">
								<Badge tone={orderTone(order.status)} icon={ICONS[order.status]}>
									{orderLabel(order.status)}
								</Badge>
							</td>

							<td class="text-muted px-4 py-3">{gatewayLabel(order.gateway)}</td>

							<td class="text-muted numeral px-4 py-3 whitespace-nowrap">
								{when.format(new Date(order.created_at))}
							</td>

							<td class="text-muted numeral px-4 py-3 whitespace-nowrap">
								{order.paid_at ? when.format(new Date(order.paid_at)) : '—'}
							</td>

							<td class="px-4 py-3 text-right whitespace-nowrap">
								{#if order.status === 'paid'}
									{#if confirming === order.id}
										<form
											method="POST"
											action="?/refund"
											class="flex items-center justify-end gap-2"
											use:enhance={() => {
												refunding = order.id;
												return async ({ result, update }) => {
													await update();
													refunding = null;
													confirming = null;

													if (result.type === 'failure' || result.type === 'error') return;
													toast.success('Refunded. The learner has been unenrolled.');
												};
											}}
										>
											<input type="hidden" name="id" value={order.id} />

											<!-- The sum it names is the one in this row, two cells to the left; the
											     label stays short so asking cannot widen the table. -->
											<Button
												type="submit"
												variant="danger"
												size="sm"
												loading={refunding === order.id}
												disabled={refunding === order.id}
												aria-label="Yes, refund {formatMoney(order.price)}"
											>
												<Icon icon={ArrowTurnBackwardIcon} class="size-4" />
												Yes, refund
											</Button>

											<Button
												type="button"
												variant="ghost"
												size="sm"
												onclick={() => (confirming = null)}
											>
												Keep
											</Button>
										</form>
									{:else}
										<Button
											variant="secondary"
											size="sm"
											onclick={() => (confirming = order.id)}
											aria-label="Refund {formatMoney(order.price)}"
										>
											<Icon icon={ArrowTurnBackwardIcon} class="size-4" />
											Refund
										</Button>
									{/if}
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</Page>
