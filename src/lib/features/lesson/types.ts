/**
 * The shapes this feature's components take as props, named against the generated
 * schema rather than restated: a field the API drops should fail this build.
 */
import type { components } from '$lib/api/schema';

export type Highlight = components['schemas']['HighlightView'];

// A thread on a lesson, not a quiz question. `QuestionView` is the quiz's, and the
// two are one careless import away from each other.
export type Question = components['schemas']['ThreadView'];
export type Answer = components['schemas']['AnswerView'];
