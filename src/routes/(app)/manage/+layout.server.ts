import { error, redirect } from '@sveltejs/kit';
import { canManageInstitution } from '$lib/roles';
import type { LayoutServerLoad } from './$types';

/*
	The management section is for whoever holds `academics:manage` — owner and admin.

	muallim-api is the real control: every page here calls it, and it answers 403 to
	anyone else. This guard is so the section refuses at its door with a clean 403
	rather than letting a student walk into a shell of pages that each fail on load.
	No session at all is a login redirect, because there is nothing to refuse yet.
*/
export const load: LayoutServerLoad = async ({ locals, parent, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const { user } = await parent();
	if (!canManageInstitution(user)) {
		error(
			403,
			'Only owners and admins can open this area. Ask someone who runs your workspace for access.'
		);
	}

	return { user };
};
