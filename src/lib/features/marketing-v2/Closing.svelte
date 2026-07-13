<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
	import { Button, Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
</script>

<section class="px-4 pt-8 pb-24 sm:px-6">
	<div class="mx-auto max-w-6xl">
		<div
			class="aurora aurora-1 squircle overflow-hidden px-6 py-16 text-center sm:px-16 sm:py-24"
			use:inview
		>
			<h2 class="text-3xl font-semibold tracking-tight text-balance text-on-solid sm:text-4xl">
				Open a workspace and put a course in it.
			</h2>
			<p class="mx-auto mt-4 max-w-xl text-pretty text-on-solid/75">
				Nothing to install. Author a course, invite the first learner, and see what comes back
				through the marking queue.
			</p>

			<div class="mt-10 flex flex-wrap justify-center gap-3">
				<Button href={resolve('/register')} variant="glass" size="lg" pill>
					Create a workspace
					<Icon icon={ArrowRight01Icon} class="size-4" />
				</Button>
				<Button href={resolve('/login')} variant="glass" size="lg" pill>Sign in</Button>
			</div>
		</div>
	</div>
</section>
