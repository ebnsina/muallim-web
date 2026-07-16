import { env } from '$env/dynamic/private';
import { createAnthropicChat } from '@tanstack/ai-anthropic';
import { createOpenaiImage } from '@tanstack/ai-openai';
import { createGeminiImage } from '@tanstack/ai-gemini';

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

/**
 * Image generation lives here too, and behind its own key, so a workspace can
 * have the writing assistant without the thumbnail one — or neither. Same
 * provider-agnostic rule: `AI_IMAGE_PROVIDER` picks the adapter, the key and
 * model come from private env, and swapping providers changes nothing else.
 * A per-provider default model means a key alone is enough to switch it on.
 */
const IMAGE_DEFAULT_MODEL = { openai: 'gpt-image-1', gemini: 'imagen-4.0-generate-001' } as const;

/** True when an image-provider key is configured; gates the button and the route. */
export function imageEnabled(): boolean {
	return Boolean(env.AI_IMAGE_API_KEY);
}

/** The image adapter for the selected provider, or null when no key is set. The
 *  model is validated by the provider at request time; the cast lets an env
 *  override name any of its models. */
export function imageAdapter() {
	const key = env.AI_IMAGE_API_KEY;
	if (!key) return null;

	const provider = env.AI_IMAGE_PROVIDER === 'gemini' ? 'gemini' : 'openai';
	const model = env.AI_IMAGE_MODEL || IMAGE_DEFAULT_MODEL[provider];

	if (provider === 'gemini') {
		type Model = Parameters<typeof createGeminiImage>[0];
		return createGeminiImage(model as Model, key);
	}
	type Model = Parameters<typeof createOpenaiImage>[0];
	return createOpenaiImage(model as Model, key);
}
