import { env } from '$env/dynamic/private';
import { createAnthropicChat } from '@tanstack/ai-anthropic';

/**
 * The AI provider lives here and nowhere the browser can reach. Provider-agnostic
 * by design: swap `createAnthropicChat` for another `@tanstack/ai-*` adapter and
 * nothing else changes. The key and model come from private env, so a workspace
 * with no key simply has AI switched off rather than a broken button.
 */
export const AI_MODEL = env.AI_MODEL || 'claude-sonnet-4-5';

/** True when a provider key is configured; gates the UI and the endpoint. */
export function aiEnabled(): boolean {
	return Boolean(env.ANTHROPIC_API_KEY);
}

/** The chat adapter, or null when no key is set. The model is validated by the
 *  provider at request time; the cast lets an env override name any of its models. */
export function aiAdapter() {
	const key = env.ANTHROPIC_API_KEY;
	type Model = Parameters<typeof createAnthropicChat>[0];
	return key ? createAnthropicChat(AI_MODEL as Model, key) : null;
}
