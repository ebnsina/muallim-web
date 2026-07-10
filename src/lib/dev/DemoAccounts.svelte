<script lang="ts">
	import { CodeIcon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';
	import type { DemoAccount } from '$lib/server/demo-accounts';

	type Props = {
		/**
		 * From the page's loader, which read them from `$lib/server`. Only the type
		 * crosses that boundary at build time; the passwords arrive over the wire, in
		 * a response the server writes in development and nowhere else.
		 */
		accounts: DemoAccount[];
		/** Called with the account to sign in as. The parent owns the fields. */
		onpick: (account: DemoAccount) => void;
	};

	let { accounts, onpick }: Props = $props();
</script>

<!--
	Rendered only when the loader sent accounts, which it does only in development.
	It carries a password, and the border it wears says so: this is scaffolding,
	not a feature, and it should not be mistakable for one at a glance.

	It fills the form rather than submitting it. Watching the fields populate is
	how you know which account you are about to be, and a button that signs you in
	before you have read its label is a button you press by accident.
-->
<section
	class="mt-8 rounded-card border border-dashed border-warning-border bg-warning-surface/40 p-4"
	aria-labelledby="demo-accounts-heading"
>
	<p
		id="demo-accounts-heading"
		class="flex items-center gap-2 text-xs font-medium text-warning-text"
	>
		<Icon icon={CodeIcon} class="size-3.5" />
		Development only
	</p>

	<p class="text-muted mt-1 text-xs">
		Seeded accounts. Click one to fill the form; they all share one password.
	</p>

	<div class="mt-3 flex flex-wrap gap-2">
		{#each accounts as account (account.email)}
			<button
				type="button"
				class="rounded-full border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
				onclick={() => onpick(account)}
			>
				{account.role}
			</button>
		{/each}
	</div>
</section>
