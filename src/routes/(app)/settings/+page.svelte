<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		Alert02Icon,
		CheckmarkCircle02Icon,
		Mail01Icon,
		Notification02Icon,
		PaintBoardIcon,
		SentIcon,
		UserIcon
	} from '@hugeicons/core-free-icons';
	import {
		ActionLink,
		Alert,
		Badge,
		Button,
		Card,
		Checkbox,
		Icon,
		Page,
		PageHeader,
		ThemeToggle
	} from '$lib/components';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Settings — Muallim</title></svelte:head>

<!--
	Only what muallim-api can actually change.

	No name field and no password field: there is no endpoint behind either, and a
	form that quietly discards what somebody typed is worse than no form at all. The
	theme is the browser's own and never leaves it; the digest is a real preference
	with a real endpoint behind it.
-->
<Page width="wide">
	<PageHeader title="Settings" description="How Muallim looks, and when it writes to you." />

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{:else if form?.resent}
		<Alert class="mt-6" role="status">
			A new confirmation link is on its way. Any earlier link has stopped working.
		</Alert>
	{:else if form?.saved}
		<Alert tone="success" class="mt-6" role="status">Saved.</Alert>
	{/if}

	<!-- ------------------------------------------------------------ appearance -->
	<section class="mt-8">
		<h2 class="flex items-center gap-2.5 text-lg font-semibold">
			<span
				class="flex size-8 items-center justify-center rounded-control bg-accent-surface text-accent-text"
			>
				<Icon icon={PaintBoardIcon} class="size-4.5" strokeWidth={2} />
			</span>
			Appearance
		</h2>

		<Card float class="mt-4 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
			<div>
				<p class="font-medium">Theme</p>
				<!-- It never reaches the server: the theme is stamped before the first paint
				     from a cookie this browser wrote, so it is this browser's decision. -->
				<p class="text-muted mt-1 text-sm">
					Light, dark, or whatever this device is set to. Kept on this browser.
				</p>
			</div>

			<ThemeToggle />
		</Card>
	</section>

	<!-- --------------------------------------------------------- notifications -->
	<section class="mt-10">
		<h2 class="flex items-center gap-2.5 text-lg font-semibold">
			<span
				class="flex size-8 items-center justify-center rounded-control bg-warning-surface text-warning-text"
			>
				<Icon icon={Notification02Icon} class="size-4.5" strokeWidth={2} />
			</span>
			Notifications
		</h2>

		<Card float class="mt-4 p-5 sm:p-6">
			<form method="POST" action="?/setDigest" use:enhance>
				<input type="hidden" name="email_digest" value={(!data.emailDigest).toString()} />
				<label class="flex cursor-pointer items-start gap-3">
					<!-- It submits on change. A settings checkbox with a Save button beside it is
					     a setting people leave unsaved. -->
					<Checkbox
						checked={data.emailDigest}
						onchange={(event) => event.currentTarget.closest('form')?.requestSubmit()}
					/>

					<span>
						<span class="block text-sm font-medium">Email me a daily digest</span>
						<span class="text-muted block text-sm">
							One message a day, with whatever is still unread. Nothing else is emailed.
						</span>
					</span>
				</label>
			</form>

			<p class="mt-4 border-t border-border pt-4">
				<ActionLink href={resolve('/notifications')} tone="muted">
					Read your notifications
				</ActionLink>
			</p>
		</Card>
	</section>

	<!-- --------------------------------------------------------------- account -->
	<section class="mt-10">
		<h2 class="flex items-center gap-2.5 text-lg font-semibold">
			<span
				class="flex size-8 items-center justify-center rounded-control bg-surface-sunken text-muted"
			>
				<Icon icon={UserIcon} class="size-4.5" strokeWidth={2} />
			</span>
			Account
		</h2>

		<Card float class="mt-4 p-5 sm:p-6">
			<dl class="grid gap-5 sm:grid-cols-2">
				<div>
					<dt class="text-muted text-xs tracking-wide uppercase">Name</dt>
					<dd class="mt-1 font-medium">{data.user.name}</dd>
				</div>

				<div>
					<dt class="text-muted text-xs tracking-wide uppercase">Role in this workspace</dt>
					<dd class="mt-1 font-medium capitalize">{data.user.role}</dd>
				</div>

				<div class="sm:col-span-2">
					<dt class="text-muted text-xs tracking-wide uppercase">Email</dt>
					<dd class="mt-1 flex flex-wrap items-center gap-2 font-medium">
						<span class="flex items-center gap-2">
							<Icon icon={Mail01Icon} class="text-muted size-4" />
							{data.user.email}
						</span>

						{#if data.user.email_verified}
							<Badge tone="success" icon={CheckmarkCircle02Icon}>Confirmed</Badge>
						{:else}
							<Badge tone="warning" icon={Alert02Icon}>Not confirmed</Badge>
						{/if}
					</dd>
				</div>
			</dl>

			{#if !data.user.email_verified}
				<form method="POST" action="?/resendVerification" use:enhance class="mt-5 flex justify-end">
					<Button type="submit" variant="secondary" size="sm">
						<Icon icon={SentIcon} class="size-4" />
						Resend the confirmation link
					</Button>
				</form>
			{/if}

			<!--
				No name field, and no password field. muallim-api has no endpoint that changes
				either from a signed-in session — a password is changed through the reset flow,
				which proves the address — so there is nothing here to type into. When the
				endpoints exist, the forms belong here.
			-->
			<p class="text-muted mt-5 border-t border-border pt-4 text-sm">
				To change your password, sign out and use
				<a class="underline-grow text-accent-text" href={resolve('/forgot-password')}>
					forgot password
				</a>
				— it proves the address before it changes anything.
			</p>
		</Card>
	</section>
</Page>
