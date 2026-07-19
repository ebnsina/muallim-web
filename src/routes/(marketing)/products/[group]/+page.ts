import { error } from '@sveltejs/kit';
import { GROUPS, groupByKey, featuresIn } from '$lib/content/features';
import type { EntryGenerator, PageLoad } from './$types';

// One page per group, prerendered — the seven products, not forty-four features.
export const entries: EntryGenerator = () => GROUPS.map((g) => ({ group: g.key }));

export const load: PageLoad = ({ params }) => {
	const group = groupByKey(params.group);
	if (!group) error(404, "We couldn't find that product.");
	return {
		group,
		features: featuresIn(group.key),
		others: GROUPS.filter((g) => g.key !== group.key)
	};
};
