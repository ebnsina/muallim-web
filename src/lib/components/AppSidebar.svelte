<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { fade, fly } from 'svelte/transition';
	import {
		Analytics01Icon,
		Award01Icon,
		BankIcon,
		BubbleChatIcon,
		BookOpen01Icon,
		Building03Icon,
		Bus01Icon,
		Calendar01Icon,
		Calendar03Icon,
		Cancel01Icon,
		ChampionIcon,
		Coins01Icon,
		CourseIcon,
		DashboardSquare01Icon,
		DiplomaIcon,
		IdentityCardIcon,
		LibraryIcon,
		Megaphone01Icon,
		Note04Icon,
		PackageIcon,
		Route02Icon,
		Tag01Icon,
		TaskDaily01Icon,
		TeachingIcon,
		UserAdd01Icon,
		UserGroupIcon,
		UserMultiple02Icon,
		Wallet01Icon
	} from '@hugeicons/core-free-icons';
	import type { IconSvgElement } from '@hugeicons/svelte';
	import { DURATION, easeOut } from '$lib/motion';
	import { cn } from '$lib/utils';
	import Icon from './Icon.svelte';

	type Props = {
		user?: { name: string; email: string; role: string };
		/** Shown only to somebody who may author. A courtesy; muallim-api is the control. */
		canAuthor?: boolean;
		/** Shown only to somebody who holds `user:manage`. The same courtesy. */
		canManagePeople?: boolean;
		/** Shown only to somebody who holds `academics:manage`. The same courtesy. */
		canManageInstitution?: boolean;
		/** The mobile drawer's open state, driven by the header's menu button. */
		open?: boolean;
	};

	let {
		user,
		canAuthor = false,
		canManagePeople = false,
		canManageInstitution = false,
		open = $bindable(false)
	}: Props = $props();

	type Item = { href: string; label: string; icon: IconSvgElement; show: boolean };
	type Group = { label: string; items: Item[] };

	// The app's destinations, grouped by what a person is here to do. A group with
	// no visible item is not drawn — an empty heading is a promise the nav breaks.
	const groups = $derived(
		(
			[
				{
					label: 'Learn',
					items: [
						{
							href: resolve('/dashboard'),
							label: 'Dashboard',
							icon: DashboardSquare01Icon,
							show: Boolean(user)
						},
						{ href: resolve('/courses'), label: 'Courses', icon: BookOpen01Icon, show: true },
						{
							href: resolve('/leaderboard'),
							label: 'Leaderboard',
							icon: ChampionIcon,
							show: Boolean(user)
						},
						{
							href: resolve('/certificates'),
							label: 'Certificates',
							icon: Award01Icon,
							show: Boolean(user)
						}
					]
				},
				{
					label: 'Community',
					items: [
						{
							href: resolve('/forum'),
							label: 'Community',
							icon: UserGroupIcon,
							show: Boolean(user)
						},
						{
							href: resolve('/chat'),
							label: 'Chat',
							icon: BubbleChatIcon,
							show: Boolean(user)
						},
						{
							href: resolve('/people'),
							label: 'People',
							icon: UserMultiple02Icon,
							show: canManagePeople
						}
					]
				},
				{
					label: 'Teach',
					items: [
						{ href: resolve('/teach'), label: 'Teach', icon: TeachingIcon, show: canAuthor },
						{
							href: resolve('/teach/course-builder'),
							label: 'Course builder',
							icon: CourseIcon,
							show: canAuthor
						},
						{
							href: resolve('/teach/certificate-builder'),
							label: 'Certificate builder',
							icon: DiplomaIcon,
							show: canAuthor
						},
						{
							href: resolve('/teach/id-cards'),
							label: 'ID cards',
							icon: IdentityCardIcon,
							show: canManageInstitution
						},
						{
							href: resolve('/teach/learning-paths'),
							label: 'Learning paths',
							icon: Route02Icon,
							show: canAuthor
						},
						{
							href: resolve('/teach/bundles'),
							label: 'Bundles',
							icon: PackageIcon,
							show: canAuthor
						},
						{
							href: resolve('/teach/taxonomy'),
							label: 'Categories & tags',
							icon: Tag01Icon,
							show: canAuthor
						}
					]
				},
				// The institution's modules, lifted out of the old `/manage` sub-nav and split
				// by what a school runs them for. All gated on `academics:manage`; a group with
				// nobody to show it is dropped below, so a student never meets an empty heading.
				{
					label: 'Institution',
					items: [
						{
							href: resolve('/manage'),
							label: 'Overview',
							icon: DashboardSquare01Icon,
							show: canManageInstitution
						},
						{
							href: resolve('/manage/reports'),
							label: 'Reports',
							icon: Analytics01Icon,
							show: canManageInstitution
						}
					]
				},
				{
					label: 'Academics',
					items: [
						{
							href: resolve('/manage/admissions'),
							label: 'Admissions',
							icon: UserAdd01Icon,
							show: canManageInstitution
						},
						{
							href: resolve('/manage/students'),
							label: 'Students',
							icon: UserMultiple02Icon,
							show: canManageInstitution
						},
						{
							href: resolve('/manage/attendance'),
							label: 'Attendance',
							icon: TaskDaily01Icon,
							show: canManageInstitution
						},
						{
							href: resolve('/manage/exams'),
							label: 'Exams',
							icon: Note04Icon,
							show: canManageInstitution
						},
						{
							href: resolve('/manage/hifz'),
							label: 'Hifz',
							icon: BookOpen01Icon,
							show: canManageInstitution
						},
						{
							href: resolve('/manage/timetable'),
							label: 'Timetable',
							icon: Calendar03Icon,
							show: canManageInstitution
						}
					]
				},
				{
					label: 'Finance',
					items: [
						{
							href: resolve('/manage/fees'),
							label: 'Fees',
							icon: Coins01Icon,
							show: canManageInstitution
						},
						{
							href: resolve('/manage/payroll'),
							label: 'Payroll',
							icon: Wallet01Icon,
							show: canManageInstitution
						},
						{
							href: resolve('/manage/ledger'),
							label: 'Accounts',
							icon: BankIcon,
							show: canManageInstitution
						}
					]
				},
				{
					label: 'Operations',
					items: [
						{
							href: resolve('/manage/library'),
							label: 'Library',
							icon: LibraryIcon,
							show: canManageInstitution
						},
						{
							href: resolve('/manage/transport'),
							label: 'Transport',
							icon: Bus01Icon,
							show: canManageInstitution
						},
						{
							href: resolve('/manage/hostel'),
							label: 'Hostel',
							icon: Building03Icon,
							show: canManageInstitution
						}
					]
				},
				{
					label: 'Campus',
					items: [
						{
							href: resolve('/manage/staff'),
							label: 'Staff',
							icon: UserGroupIcon,
							show: canManageInstitution
						},
						{
							href: resolve('/manage/notices'),
							label: 'Notices',
							icon: Megaphone01Icon,
							show: canManageInstitution
						},
						{
							href: resolve('/manage/calendar'),
							label: 'Calendar',
							icon: Calendar01Icon,
							show: canManageInstitution
						}
					]
				}
			] satisfies Group[]
		)
			.map((group) => ({ ...group, items: group.items.filter((item) => item.show) }))
			.filter((group) => group.items.length > 0)
	);

	// Section roots light only on an exact match; every other destination lights when
	// the path is under it, so /courses/abc keeps "Courses" marked and /manage/students
	// does not also light "Overview". Copied from the old manage sub-nav — one rule.
	const roots = new Set<string>([resolve('/dashboard'), resolve('/manage')]);
	const current = (href: string) =>
		roots.has(href)
			? page.url.pathname === href
			: page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);

	// Navigating closes the drawer; left open it covers the page it just reached.
	afterNavigate(() => (open = false));

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') open = false;
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#snippet list()}
	{#each groups as group (group.label)}
		<div class="mb-5 last:mb-0">
			<p class="px-3 pb-1.5 text-[0.7rem] font-semibold tracking-wide text-muted/70 uppercase">
				{group.label}
			</p>
			<ul class="flex flex-col gap-0.5">
				{#each group.items as item (item.href)}
					{@const active = current(item.href)}
					<li>
						<a
							href={item.href}
							aria-current={active ? 'page' : undefined}
							class={cn(
								'flex items-center gap-2.5 rounded-control px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
								active
									? 'bg-surface-active text-text'
									: 'text-muted hover:bg-surface-hover hover:text-text'
							)}
						>
							<Icon icon={item.icon} class="size-4 shrink-0" />
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
{/snippet}

<!--
	The rail, on a wide screen. Sticky under the band, so the destinations stay put
	as the page beside them scrolls. Its own scroll if the list ever outgrows the
	viewport, so a long nav never traps the page under it.
-->
<nav
	aria-label="Sections"
	class="sticky top-24 hidden max-h-[calc(100dvh-7rem)] w-60 shrink-0 overflow-y-auto py-8 pr-2 lg:block"
>
	{@render list()}
</nav>

<!--
	The same list as a drawer, below `lg`. The header's menu button toggles `open`;
	a backdrop and Escape close it, so it never traps the page it slid over.
-->
{#if open}
	<div class="fixed inset-0 z-40 lg:hidden">
		<button
			type="button"
			aria-label="Close menu"
			class="absolute inset-0 bg-black/40"
			onclick={() => (open = false)}
			transition:fade={{ duration: DURATION.instant }}
		></button>

		<nav
			aria-label="Sections"
			class="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto bg-surface-raised p-4 shadow-card"
			transition:fly={{ x: -320, duration: DURATION.base, easing: easeOut }}
		>
			<div class="mb-4 flex items-center justify-between">
				<span class="px-2 text-sm font-semibold text-text">Menu</span>
				<button
					type="button"
					aria-label="Close menu"
					class="rounded-control p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					onclick={() => (open = false)}
				>
					<Icon icon={Cancel01Icon} class="size-5" />
				</button>
			</div>
			{@render list()}
		</nav>
	</div>
{/if}
