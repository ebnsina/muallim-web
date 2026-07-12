<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowLeft01Icon, ArrowRight01Icon, Calendar03Icon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';
	import { cn } from '$lib/utils';

	/** One thing owed, exactly as muallim-api reports it. */
	export type Deadline = {
		assignment_id: string;
		lesson_id: string;
		title: string;
		course_slug: string;
		course_title: string;
		due_at: string;
		overdue: boolean;
		allow_late: boolean;
	};

	type Props = {
		deadlines: Deadline[];
		class?: string;
	};

	let { deadlines, class: className }: Props = $props();

	/*
		Every date here is the reader's own local one, because a deadline is a date a
		person keeps in their head, not a UTC instant. `overdue` is the exception: it
		comes from muallim-api, decided against muallim-api's clock, because a browser's
		"now" is whatever its owner set it to and the deadline is not theirs to move.
	*/
	const now = new Date();
	const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
	const todayKey = dayKey(now);

	// The month on screen. It starts on the one the reader is in, and the arrows
	// move it — the window muallim-api answers for spans two or three months.
	let cursor = $state(new Date(now.getFullYear(), now.getMonth(), 1));

	const byDay = $derived.by(() => {
		const map = new Map<string, Deadline[]>();
		for (const deadline of deadlines) {
			const key = dayKey(new Date(deadline.due_at));
			const day = map.get(key) ?? [];
			day.push(deadline);
			map.set(key, day);
		}
		return map;
	});

	// The grid: whole weeks, starting Monday, so the leading and trailing days
	// belong to the neighbouring months and are drawn faint rather than left out.
	// A calendar with a ragged first row is a calendar you have to count along.
	const weeks = $derived.by(() => {
		const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
		const offset = (first.getDay() + 6) % 7; // Sunday=0 → Monday=0
		const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);

		/*
			Always six weeks, even when the month spans five.

			The rows were counted per month, which is tidier and wrong: July needs five
			and August needs six, so pressing the arrow between them moved everything
			below the calendar by a row. A control that resizes when you use it is a
			control you have to re-find after every press. The sixth row is the
			neighbouring month's days, drawn faint — it was going to draw them anyway.
		*/
		return Array.from({ length: 6 }, (_, week) =>
			Array.from({ length: 7 }, (_, day) => {
				const date = new Date(
					start.getFullYear(),
					start.getMonth(),
					start.getDate() + week * 7 + day
				);
				return {
					date,
					key: dayKey(date),
					inMonth: date.getMonth() === cursor.getMonth(),
					items: byDay.get(dayKey(date)) ?? []
				};
			})
		);
	});

	const monthLabel = $derived(
		new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(cursor)
	);

	// Two letters, from the reader's locale, so the header is not seven English
	// abbreviations pretending to be universal.
	const weekdays = Array.from({ length: 7 }, (_, i) =>
		new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(2024, 0, 1 + i))
	);

	const dueLabel = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });

	// The day being read. It starts on the soonest thing owed rather than on today,
	// because today is usually empty and an empty panel teaches nobody anything.
	const soonest = $derived(deadlines[0] ? dayKey(new Date(deadlines[0].due_at)) : todayKey);
	let picked = $state<string | null>(null);
	const selected = $derived(picked ?? soonest);
	const showing = $derived(byDay.get(selected) ?? []);

	function step(months: number) {
		cursor = new Date(cursor.getFullYear(), cursor.getMonth() + months, 1);
	}

	// Midnight today, kept apart from `now`: `setHours` mutates, and a helper that
	// quietly moved the clock it was reading would be a bug nobody could see.
	const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

	/** How far off, in the words a person would use. */
	function whenever(deadline: Deadline): string {
		const due = new Date(deadline.due_at);
		const days = Math.round(
			(new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() - midnight) / 86_400_000
		);
		if (deadline.overdue) return days === 0 ? 'Due today' : `${Math.abs(days)} days late`;
		if (days === 0) return 'Due today';
		if (days === 1) return 'Due tomorrow';
		return `In ${days} days`;
	}
</script>

<div class={cn('flex flex-col', className)}>
	<div class="flex items-center justify-between gap-2">
		<p class="flex items-center gap-2 text-sm font-medium">
			<Icon icon={Calendar03Icon} class="text-muted size-4" strokeWidth={2} />
			{monthLabel}
		</p>

		<div class="flex items-center gap-1">
			<button
				type="button"
				class="text-muted hover:bg-surface-sunken hover:text-text flex size-6 items-center justify-center rounded-md"
				onclick={() => step(-1)}
				aria-label="Previous month"
			>
				<Icon icon={ArrowLeft01Icon} class="size-4" strokeWidth={2} />
			</button>
			<button
				type="button"
				class="text-muted hover:bg-surface-sunken hover:text-text flex size-6 items-center justify-center rounded-md"
				onclick={() => step(1)}
				aria-label="Next month"
			>
				<Icon icon={ArrowRight01Icon} class="size-4" strokeWidth={2} />
			</button>
		</div>
	</div>

	<!--
		A table, because a month *is* one: seven columns of weekdays, and a screen
		reader that reads "Thursday, 16" rather than a bare number in a soup of divs.
	-->
	<table class="mt-3 w-full border-separate border-spacing-y-0.5">
		<caption class="sr-only">Assignments due, by date</caption>
		<thead>
			<tr>
				{#each weekdays as weekday (weekday)}
					<th scope="col" class="text-muted pb-1 text-center text-[0.65rem] font-medium">
						{weekday.slice(0, 2)}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each weeks as week, index (index)}
				<tr>
					{#each week as day (day.key)}
						{@const due = day.items.length > 0}
						{@const late = day.items.some((item) => item.overdue)}
						<td class="text-center">
							{#if due}
								<!-- A day with work owed is a button, because there is something to read
								     about it. A day with none is text: nothing happens when you press it. -->
								<button
									type="button"
									onclick={() => (picked = day.key)}
									aria-pressed={selected === day.key}
									class={cn(
										'numeral relative mx-auto flex size-8 items-center justify-center rounded-md text-xs font-semibold',
										late
											? 'bg-danger-surface text-danger-text hover:bg-danger-surface/70'
											: 'bg-accent-surface text-accent-text hover:bg-accent-surface/70',
										selected === day.key &&
											'ring-2 ring-accent ring-offset-1 ring-offset-surface-raised',
										!day.inMonth && 'opacity-50'
									)}
									aria-label="{day.items.length} due {dueLabel.format(day.date)}"
								>
									{day.date.getDate()}
									{#if day.items.length > 1}
										<span class="numeral absolute -top-1 -right-1 text-[0.6rem]">
											{day.items.length}
										</span>
									{/if}
								</button>
							{:else}
								<span
									class={cn(
										'numeral mx-auto flex size-8 items-center justify-center rounded-md text-xs',
										day.key === todayKey && 'border border-border-strong font-semibold',
										day.inMonth ? 'text-text' : 'text-muted/40'
									)}
								>
									{day.date.getDate()}
								</span>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>

	<!--
		What is owed on the chosen day, and never a number alone: colour says overdue,
		and so do the words, because colour on its own says nothing to a reader who
		cannot see it.
	-->
	<div class="mt-3 border-t border-border pt-3">
		{#if deadlines.length === 0}
			<p class="text-muted text-xs">Nothing due. Every assignment is handed in.</p>
		{:else if showing.length === 0}
			<p class="text-muted text-xs">Nothing due on this day.</p>
		{:else}
			<ul class="space-y-2">
				{#each showing as deadline (deadline.assignment_id)}
					<li>
						<a
							class="group block"
							href={resolve(
								`/courses/${deadline.course_slug}/lessons/${deadline.lesson_id}/assignment`
							)}
						>
							<p class="truncate text-sm font-medium group-hover:underline">{deadline.title}</p>
							<p class="text-muted mt-0.5 flex items-center gap-1.5 truncate text-xs">
								<span
									class={deadline.overdue ? 'text-danger-text font-medium' : 'text-accent-text'}
								>
									{whenever(deadline)}
								</span>
								·
								<span class="truncate">{deadline.course_title}</span>
							</p>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
