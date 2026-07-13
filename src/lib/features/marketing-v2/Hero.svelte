<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight01Icon, ShoppingBag01Icon } from '@hugeicons/core-free-icons';
	import { AuroraBackdrop, Button, Icon, Numeral } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import { FIGURES } from './content';

	const here = resolve('/v2');

	// Illustrative: the shape of the gradebook, not anybody's real marks.
	const ROWS = [
		{ who: 'Amina Yusuf', quiz: '9/10', task: '18/20', grade: 'A', tone: 'pass' },
		{ who: 'Idris Bello', quiz: '7/10', task: '15/20', grade: 'B', tone: 'pass' },
		{ who: 'Layla Haddad', quiz: '8/10', task: '—', grade: 'To mark', tone: 'wait' }
	];
</script>

<section class="hero-blue relative isolate overflow-hidden text-white">
	<AuroraBackdrop />

	<div class="mx-auto max-w-6xl px-6 pt-32 pb-16 sm:pt-40 sm:pb-24">
		<div class="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
			<div use:inview>
				<a
					href="{here}#sales"
					class="inline-flex items-center gap-2 rounded-pill bg-white/10 py-1.5 pr-3 pl-1.5 text-sm text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20"
				>
					<span class="rounded-pill bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
						New
					</span>
					<Icon icon={ShoppingBag01Icon} class="size-4" />
					Sell a course from your own payment account
				</a>

				<h1 class="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
					Teach it. Mark it. Certify it. Sell it.
				</h1>

				<p class="mt-6 max-w-2xl text-lg text-pretty text-white/75 sm:text-xl">
					Muallim is a learning platform for a school, an academy, or one person with a course to
					teach. Author it, set the work, mark what comes back, issue a certificate anyone can
					check, and take the money in your own account.
				</p>

				<div class="mt-10 flex flex-wrap items-center gap-3">
					<Button href={resolve('/register')} size="lg" pill>
						Create a workspace
						<Icon icon={ArrowRight01Icon} class="size-4" />
					</Button>
					<Button href="{here}#capabilities" variant="glass" size="lg" pill>
						See everything it does
					</Button>
				</div>
			</div>

			<!-- The gradebook, in the shape it ships in. -->
			<div use:inview={{ delay: 120 }}>
				<div class="squircle border border-white/15 bg-white/10 p-5 backdrop-blur-md sm:p-6">
					<div class="flex items-center justify-between gap-4">
						<p class="text-sm font-medium">Gradebook</p>
						<p class="text-xs text-white/60">Foundations of Arabic Grammar</p>
					</div>

					<table class="mt-5 w-full text-left text-sm">
						<thead class="text-xs text-white/55">
							<tr>
								<th scope="col" class="pb-3 font-medium">Learner</th>
								<th scope="col" class="pb-3 font-medium">Quiz</th>
								<th scope="col" class="pb-3 font-medium">Assignment</th>
								<th scope="col" class="pb-3 text-right font-medium">Grade</th>
							</tr>
						</thead>
						<tbody>
							{#each ROWS as row (row.who)}
								<tr class="border-t border-white/10">
									<th scope="row" class="py-3 font-normal whitespace-nowrap">{row.who}</th>
									<td class="numeral py-3 text-white/70">{row.quiz}</td>
									<td class="numeral py-3 text-white/70">{row.task}</td>
									<td class="py-3 text-right">
										<span
											class="inline-flex rounded-pill px-2.5 py-0.5 text-xs font-medium whitespace-nowrap
											       {row.tone === 'pass' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60'}"
										>
											{row.grade}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>

					<p class="mt-5 border-t border-white/10 pt-4 text-xs text-white/60">
						Graded against a scale the workspace defines, not one we chose for you.
					</p>
				</div>
			</div>
		</div>

		<!-- Three figures, and all three are countable in the API's own schema. -->
		<dl class="mt-20 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
			{#each FIGURES as figure, i (figure.label)}
				<div class="bg-white/5 p-6 backdrop-blur-sm" use:inview={{ delay: i * 80 }}>
					<dt class="text-4xl font-semibold">
						<Numeral countUp value={figure.value} />
					</dt>
					<dd class="mt-2">
						<span class="font-medium text-white/90">{figure.label}</span>
						<span class="mt-1 block text-sm text-white/60">{figure.note}</span>
					</dd>
				</div>
			{/each}
		</dl>
	</div>
</section>
