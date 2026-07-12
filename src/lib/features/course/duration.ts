/**
 * How a syllabus states a length.
 *
 * Both were written twice — once on the course page and once on the lesson — and
 * a second copy of a formatter is a second answer to the same question.
 */

/** Minutes, as a number. The unit is rendered beside it, never inside it. */
export function minutes(seconds: number): number {
	return Math.round(seconds / 60);
}

/** "5h 47m". Under an hour it is minutes, because "0h 47m" is not how anyone says it. */
export function span(seconds: number): string {
	const total = Math.round(seconds / 60);
	const hours = Math.floor(total / 60);
	return hours === 0 ? `${total}m` : `${hours}h ${total % 60}m`;
}
