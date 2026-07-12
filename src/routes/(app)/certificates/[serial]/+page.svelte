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

	<!--
		The mat. A certificate on a page is a sheet of paper lying on a desk; on a mat it
		is a thing that was awarded. It does not print — see the print rule in layout.css
		— because a dark gradient behind a document is an inkjet's whole cartridge and a
		document nobody can read on paper.
	-->
	<div class="aurora rounded-card p-4 sm:p-8 print:p-0">
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
	</div>

	<p class="text-muted mx-auto mt-8 max-w-2xl text-center text-sm print:hidden">
		Anybody can verify this certificate at
		<a class="underline-grow break-all" href={resolve(`/verify/${certificate.serial}`)}>
			{verifyUrl}
		</a>
	</p>
</Page>
