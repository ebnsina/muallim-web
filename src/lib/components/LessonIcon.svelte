<script lang="ts">
	import {
		File01Icon,
		HelpCircleIcon,
		LiveStreaming01Icon,
		Package01Icon,
		PlayCircleIcon,
		Task01Icon
	} from '@hugeicons/core-free-icons';
	import type { IconSvgElement } from '@hugeicons/svelte';
	import Icon from './Icon.svelte';

	type Props = {
		contentType: string;
		class?: string;
	};

	let { contentType, class: className = 'size-4' }: Props = $props();

	/*
		The seven `content_type` values the schema allows, and a fallback.

		A lesson type this list has not heard of gets the page icon rather than
		nothing: a row with a hole where its icon should be reads as a broken row, and
		muallim-api will add a type here before this file hears about it.
	*/
	const ICONS: Record<string, IconSvgElement> = {
		text: File01Icon,
		video: PlayCircleIcon,
		quiz: HelpCircleIcon,
		assignment: Task01Icon,
		live: LiveStreaming01Icon,
		scorm: Package01Icon,
		h5p: Package01Icon
	};
</script>

<Icon icon={ICONS[contentType] ?? File01Icon} class={className} />
