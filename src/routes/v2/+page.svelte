<script lang="ts">
	import { MarketingFooter, PageAurora } from '$lib/components';
	import {
		Assessment,
		Capabilities,
		Certificates,
		Closing,
		Hero,
		Lifecycle,
		Nav,
		Platform,
		Roadmap,
		Sales
	} from '$lib/features/marketing-v2';
</script>

<svelte:head>
	<title>Muallim — teach it, mark it, certify it, sell it</title>
	<meta
		name="description"
		content="A learning platform for schools and creators: courses, quizzes, assignments, a gradebook, a forum, verifiable certificates, and course sales through your own payment account."
	/>
</svelte:head>

<PageAurora />
<Nav />

<main>
	<Hero />
	<Lifecycle />
	<Capabilities />
	<Assessment />
	<Sales />
	<Certificates />
	<Platform />
	<Roadmap />
	<Closing />
</main>

<MarketingFooter />
