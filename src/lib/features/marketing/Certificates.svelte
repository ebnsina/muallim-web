<script lang="ts">
	import { resolve } from '$app/paths';
	import { CheckmarkBadge01Icon, Search01Icon } from '@hugeicons/core-free-icons';
	import { Card, Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
</script>

<section id="certificates" class="px-6 py-20 sm:py-28">
	<div class="hero-panel squircle mx-auto max-w-6xl overflow-hidden ring-1 ring-border">
		<div class="grid items-center gap-14 px-6 py-16 sm:px-12 lg:grid-cols-2 lg:gap-20">
			<div use:inview>
				<p
					class="flex items-center gap-3 text-xs font-semibold tracking-[0.14em] text-accent-text uppercase"
				>
					<span class="h-px w-6 bg-accent-border" aria-hidden="true"></span>
					Certificates
				</p>

				<h2 class="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
					A certificate is only worth the check behind it
				</h2>

				<p class="mt-5 text-lg leading-relaxed text-pretty text-muted">
					Every certificate a workspace issues carries a serial, and the serial answers to anyone —
					an employer, a registrar, a parent — with no account and no login. Withdraw one and the
					serial still answers. It says the certificate was withdrawn.
				</p>

				<a
					href={resolve('/verify')}
					class="underline-grow mt-8 inline-flex items-center gap-2 font-medium text-accent-text"
				>
					<Icon icon={Search01Icon} class="size-4" />
					Check a serial
				</a>
			</div>

			<!-- The verification answer, in the shape it comes back in. -->
			<div use:inview={{ delay: 120 }}>
				<Card float class="p-7 sm:p-8">
					<p class="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Specimen</p>

					<p class="numeral mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
						MLM-7QK4-2F8D-19XA
					</p>

					<div class="mt-6 flex items-center gap-3 border-t border-border pt-6">
						<span
							class="flex size-9 shrink-0 items-center justify-center rounded-pill bg-success-surface text-success-text"
						>
							<Icon icon={CheckmarkBadge01Icon} class="size-5" />
						</span>
						<p class="text-sm leading-relaxed">
							<span class="font-medium">Valid.</span>
							<span class="text-muted">
								Issued by the workspace that taught the course, on the date it was earned.
							</span>
						</p>
					</div>

					<p class="mt-5 text-xs leading-relaxed text-muted">
						A revoked serial returns the same page and says so, rather than going missing — a
						certificate that disappears is a certificate nobody can disprove.
					</p>
				</Card>
			</div>
		</div>
	</div>
</section>
