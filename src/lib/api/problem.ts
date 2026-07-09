/**
 * RFC 9457 Problem Details, as rendered by lms-api. Every error response from
 * the API has this shape, whichever layer produced it.
 */
export interface Problem {
	title: string;
	status: number;
	detail?: string;
	instance?: string;
	correlation_id?: string;
}

/** Narrows an unknown error payload to a Problem document. */
export function isProblem(value: unknown): value is Problem {
	if (typeof value !== 'object' || value === null) return false;

	const candidate = value as Record<string, unknown>;
	return typeof candidate.title === 'string' && typeof candidate.status === 'number';
}

/**
 * Extracts a message safe to render. The API never puts internals in `detail`,
 * so it is quotable as-is; anything else falls back to a generic string rather
 * than surfacing a raw exception to a learner.
 */
export function problemMessage(value: unknown, fallback = 'Something went wrong.'): string {
	if (isProblem(value)) return value.detail ?? value.title;
	return fallback;
}

/** The correlation ID, when the payload carries one. */
export function problemCorrelationId(value: unknown): string | undefined {
	return isProblem(value) ? value.correlation_id : undefined;
}
