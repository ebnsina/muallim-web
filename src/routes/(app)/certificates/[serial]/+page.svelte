<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Copy01Icon, PrinterIcon, Tick02Icon } from '@hugeicons/core-free-icons';
	import { Breadcrumbs, Button, Certificate, Icon, Page } from '$lib/components';
	import { toast } from '$lib/toast.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const certificate = $derived(data.certificate);

	const issuedAt = $derived(
		new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
			new Date(certificate.issued_at)
		)
	);

	const crumbs = $derived([
		{ label: 'Certificates', href: resolve('/certificates') },
		{ label: certificate.course_title }
	]);

	// The public URL anybody can check this against. Built from the origin so it is
	// the workspace's real host, not a hardcoded domain.
	const verifyUrl = $derived(`${page.url.origin}/verify/${certificate.serial}`);

	let copied = $state(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(verifyUrl);
			copied = true;
			toast.success('Verification link copied.');
			setTimeout(() => (copied = false), 2000);
		} catch {
			// Clipboard access can be denied. The link is on the page to select by hand.
			toast.danger('Could not copy. The link is shown below.');
		}
	}
</script>

<svelte:head><title>Certificate — {certificate.course_title}</title></svelte:head>

<Page width="wide">
	<Breadcrumbs {crumbs} class="print:hidden" />

	<!--
		The actions do not print. Somebody printing a certificate does not want a
		"Copy link" button baked into the paper.
	-->
	<div class="mt-4 mb-8 flex flex-wrap gap-3 print:hidden">
		<Button variant="secondary" size="sm" onclick={() => window.print()}>
			<span class="flex items-center gap-2"><Icon icon={PrinterIcon} class="size-4" /> Print</span>
		</Button>

		<Button variant="secondary" size="sm" onclick={copy}>
			<span class="flex items-center gap-2">
				<Icon icon={copied ? Tick02Icon : Copy01Icon} class="size-4" />
				{copied ? 'Copied' : 'Copy verification link'}
			</span>
		</Button>
	</div>

	<Certificate
		title={certificate.title}
		learnerName={certificate.learner_name}
		courseTitle={certificate.course_title}
		{issuedAt}
		body={certificate.body}
		signatory={certificate.signatory}
		serial={certificate.serial}
		revoked={certificate.revoked}
	/>

	<p class="text-muted mx-auto mt-8 max-w-2xl text-center text-sm print:hidden">
		Anybody can verify this certificate at
		<a
			class="break-all underline underline-offset-4"
			href={resolve(`/verify/${certificate.serial}`)}
		>
			{verifyUrl}
		</a>
	</p>
</Page>
