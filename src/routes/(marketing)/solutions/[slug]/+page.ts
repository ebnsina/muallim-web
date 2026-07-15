import { error } from '@sveltejs/kit';
import { SEGMENTS, segmentBySlug } from '$lib/content/segments';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => SEGMENTS.map((s) => ({ slug: s.slug }));

export const load: PageLoad = ({ params }) => {
	const segment = segmentBySlug(params.slug);
	if (!segment) error(404, 'No such solution page.');
	return { segment };
};
