import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import {
	automationCreateSchema,
	automationEditSchema,
	type AutomationEvent,
	type EventKey
} from '$lib/automations';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

const NEXT = '/login?next=%2Fmanage%2Fautomations';

/*
	The emails a workspace sends by itself. Two lists: the rules that have been
	written, and the events they may fire on with the placeholders each offers.
	The second is what the form is built from — a placeholder muallim-api does not
	know for the chosen event is refused when the rule is saved.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, NEXT);

	const api = authedApi(url.origin, locals.accessToken);

	const [rulesRes, eventsRes] = await Promise.all([
		api.GET('/v1/automations'),
		api.GET('/v1/automations/events')
	]);

	if (rulesRes.error || !rulesRes.data) {
		error(
			rulesRes.response?.status ?? 500,
			problemMessage(rulesRes.error, 'We couldn’t load your automations. Please try again.')
		);
	}

	// Without the events there is nothing to write a rule against, but the rules that
	// exist still read: the page degrades to a list with the writing shut off.
	const eventsError =
		eventsRes.error || !eventsRes.data
			? problemMessage(
					eventsRes.error,
					'We couldn’t load the list of things an email can be sent for, so nothing new can be written just now.'
				)
			: null;

	const events: AutomationEvent[] = (eventsRes.data?.events ?? []).map((e) => ({
		event: e.event,
		placeholders: e.placeholders ?? []
	}));

	setHeaders({ 'cache-control': 'private, no-store' });

	return { rules: rulesRes.data.rules ?? [], events, eventsError };
};

export const actions: Actions = {
	/* Write a rule. Off unless the author ticked it on. */
	create: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, NEXT);

		const parsed = parseForm(automationCreateSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { event, subject, body, enabled } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/automations', {
			// The event arrives as form text, so it is narrowed rather than parsed as the
			// enum: a third event shipping server-side then reaches this page with no
			// release here. muallim-api is the judge — it refuses one it does not know.
			body: { event: event as EventKey, subject, body, enabled }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t save that automation. Please try again.')
			});
		}

		return { created: data.rule };
	},

	/* Edit the mail, or switch the rule on and off from the form. The event stays put. */
	update: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, NEXT);

		const parsed = parseForm(automationEditSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { id, subject, body, enabled } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).PUT('/v1/automations/{id}', {
			params: { path: { id } },
			body: { subject, body, enabled }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t save that automation. Please try again.')
			});
		}

		return { updated: data.rule };
	},

	/*
		The switch on the row. Enabled is a real state — on means the next learner who
		enrols gets this — so it travels alone, without the rest of the form.
	*/
	toggle: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, NEXT);

		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const enabled = String(form.get('enabled') ?? '') === 'true';

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).PUT('/v1/automations/{id}', {
			params: { path: { id } },
			body: { enabled }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(
					problem,
					enabled
						? 'We couldn’t switch that automation on. Please try again.'
						: 'We couldn’t switch that automation off. Please try again.'
				)
			});
		}

		return { updated: data.rule };
	},

	/* Delete a rule. A 204 carries no body, so the absence of a problem is the success. */
	remove: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, NEXT);

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/automations/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t delete that automation. Please try again.')
			});
		}

		return { removed: id };
	}
};
