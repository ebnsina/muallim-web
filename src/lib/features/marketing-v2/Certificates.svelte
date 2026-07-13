<script lang="ts">
	import { resolve } from '$app/paths';
	import { CheckmarkBadge01Icon, Search01Icon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
</script>

<section id="certificates" class="hero-blue relative isolate overflow-hidden px-6 py-24 text-white">
	<div class="grain pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true"></div>

	<div class="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
		<div use:inview>
			<p class="flex items-center gap-3 text-xs font-semibold tracking-[0.14em] uppercase">
				<span class="h-px w-6 bg-white/30" aria-hidden="true"></span>
				Certificates
			</p>

			<h2 class="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
				A certificate is only worth the check behind it
			</h2>

			<p class="mt-5 text-lg leading-relaxed text-pretty text-white/70">
				Every certificate a workspace issues carries a serial, and the serial answers to anyone — an
				employer, a registrar, a parent — with no account and no login. Withdraw one and the serial
				still answers. It says the certificate was withdrawn.
			</p>

			<a
				href={resolve('/verify')}
				class="underline-grow mt-8 inline-flex items-center gap-2 font-medium text-white"
			>
				<Icon icon={Search01Icon} class="size-4" />
				Check a serial
			</a>
		</div>

		<!-- The verification answer, in the shape it comes back in. -->
		<div use:inview={{ delay: 120 }}>
			<div class="squircle bg-white/8 p-6 ring-1 ring-white/15 backdrop-blur-md sm:p-8">
				<p class="text-xs tracking-[0.14em] text-white/45 uppercase">Specimen</p>

				<p class="numeral mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
					MLM-7QK4-2F8D-19XA
				</p>

				<div class="mt-6 flex items-center gap-2.5 border-t border-white/10 pt-6">
					<Icon icon={CheckmarkBadge01Icon} class="size-5 shrink-0 text-white" />
					<p class="text-sm">
						<span class="font-medium">Valid.</span>
						<span class="text-white/60">
							Issued by the workspace that taught the course, on the date it was earned.
						</span>
					</p>
				</div>

				<p class="mt-5 text-xs leading-relaxed text-white/45">
					A revoked serial returns the same page and says so, rather than going missing — a
					certificate that disappears is a certificate nobody can disprove.
				</p>
			</div>
		</div>
	</div>
</section>
