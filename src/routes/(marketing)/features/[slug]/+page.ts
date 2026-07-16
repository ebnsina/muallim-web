import { error } from '@sveltejs/kit';
import { FEATURES, featureBySlug, GROUPS } from '$lib/content/features';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => FEATURES.map((f) => ({ slug: f.slug }));

export const load: PageLoad = ({ params }) => {
	const feature = featureBySlug(params.slug);
	if (!feature) error(404, "We couldn't find that feature.");

	const group = GROUPS.find((g) => g.key === feature.group);
	if (!group) error(500, 'That feature is filed under a group that does not exist.');

	// Resolved here rather than in the markup: a dangling slug should be a build-time
	// mistake in the content file, not a hole in the page.
	const related = feature.related
		.map(featureBySlug)
		.filter((f) => f !== undefined)
		.filter((f) => f.slug !== feature.slug);

	return { feature, group, related };
};
