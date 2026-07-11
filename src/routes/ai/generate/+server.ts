import { error } from '@sveltejs/kit';
import { chat, toServerSentEventsResponse } from '@tanstack/ai';
import { aiAdapter } from '$lib/server/ai';
import type { RequestHandler } from './$types';

// One system prompt for every text surface. The caller's message carries the
// specific instruction and context; the model returns only the content, so the
// stream can drop straight into a form field.
const SYSTEM = [
	'You are a writing assistant inside an online-course platform, helping an instructor draft course content.',
	'Return only the requested content — no preamble, no sign-off, no markdown code fences, no explanation of what you did.',
	'Write in clear, plain English at a level a learner can read. Never invent facts, prices, or credentials.'
].join(' ');

export const POST: RequestHandler = async ({ request, locals }) => {
	// Authoring is instructor work; the draft is still saved through the
	// permission-checked API, but generation itself is gated on a session.
	if (!locals.accessToken) error(401, 'Sign in to use AI.');

	const adapter = aiAdapter();
	if (!adapter) error(501, 'AI is not configured on this server.');

	const { messages } = await request.json();

	const abortController = new AbortController();
	const stream = chat({
		adapter,
		messages,
		systemPrompts: [SYSTEM],
		modelOptions: { temperature: 0.6, max_tokens: 1200 },
		abortController
	});

	return toServerSentEventsResponse(stream, { abortController });
};
