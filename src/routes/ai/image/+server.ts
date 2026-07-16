import { error, json } from '@sveltejs/kit';
import { generateImage } from '@tanstack/ai';
import { imageAdapter } from '$lib/server/ai';
import type { RequestHandler } from './$types';

// One instruction wrapped around the instructor's own words, verbatim. The model
// returns a clean cover with no text baked in — a caption belongs on the card,
// not burned into the pixels — while the description the author typed still leads.
const PROMPT_PREFIX = 'A clean, modern course cover illustration, no text:';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Same gate as the text route: generation is instructor work behind a session,
	// even though the picture is saved through the permission-checked API afterwards.
	if (!locals.accessToken) error(401, 'Sign in to use AI.');

	const adapter = imageAdapter();
	if (!adapter) error(501, 'Image generation is not configured on this server.');

	const body = await request.json().catch(() => ({}));
	const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
	if (!prompt) error(422, 'Describe the thumbnail you want.');

	let result;
	try {
		result = await generateImage({
			adapter,
			prompt: `${PROMPT_PREFIX} ${prompt}`,
			size: '1024x1024'
		});
	} catch {
		// The provider's own error may name a model or a quota; neither is the
		// instructor's to read, and nothing was saved, so it is one clean sentence.
		error(502, 'The image provider could not generate that. Try again.');
	}

	// Exactly one of `url` or `b64Json` is present. Base64 becomes a data URL the
	// browser can turn straight into a Blob; a hosted URL is passed through as is.
	const image = result.images[0];
	if (!image) error(502, 'The image provider returned nothing. Try again.');

	if ('b64Json' in image && image.b64Json) {
		return json({ image: `data:image/png;base64,${image.b64Json}`, mimeType: 'image/png' });
	}
	if ('url' in image && image.url) {
		return json({ image: image.url, mimeType: 'image/png' });
	}

	error(502, 'The image provider returned nothing usable. Try again.');
};
