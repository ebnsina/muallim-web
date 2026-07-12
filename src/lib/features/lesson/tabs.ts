/**
 * Notes, marks and the discussion are three things a reader does *about* a lesson,
 * not three more things to scroll past to reach the next one. They share one panel
 * below the text, and the tabs pick between them.
 */
export type Tab = 'notes' | 'highlights' | 'discussion';

/**
 * A destructive control that is always on screen is clutter on every row it is not
 * wanted on. It appears when the row does — on hover, and on focus, so the keyboard
 * reaches what the mouse does.
 *
 * Only where a pointer can hover: `lg:` rather than a bare `opacity-0`, because on a
 * touch screen there is no hover state to reveal it with, and an invisible delete
 * button is a delete button nobody has.
 */
export const REVEAL_ON_HOVER =
	'shrink-0 rounded-control p-1 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 lg:focus-visible:opacity-100';

/**
 * The same, keyed to the answer's own row: an answer sits inside a question's card,
 * and a bare `group-hover` there would reveal every answer's control at once the
 * moment the pointer touched the card.
 */
export const REVEAL_ON_ANSWER_HOVER =
	'shrink-0 rounded-control p-1 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:opacity-0 lg:group-hover/answer:opacity-100 lg:group-focus-within/answer:opacity-100 lg:focus-visible:opacity-100';
