/**
 * Reveal an element as it scrolls into view — a fade and a short rise, once.
 *
 * The one rule this is built around: **content is visible without it**. The hidden
 * start state is added by this action, in JavaScript, so a browser that never runs
 * it — or a reader who asked for no motion — sees the element as it always was. A
 * past component hid its contents behind an IntersectionObserver and vanished the
 * day the observer did not fire; a reveal must never be able to lose the thing it
 * reveals.
 *
 * So: no JS → visible. Reduced motion → visible, no animation. Observed and on
 * screen → it animates in and the observer lets go. It only ever adds.
 */
export function reveal(node: HTMLElement, delay = 0) {
	// The reader asked for stillness. Leave the element exactly as it is.
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	// Set the hidden start here, not in the markup: markup with no script attached
	// would keep it hidden forever. Actions run before the first paint, so this does
	// not flash for anything that starts below the fold.
	node.classList.add('reveal-init');
	if (delay) node.style.setProperty('--reveal-delay', `${delay}ms`);

	const show = () => {
		node.classList.remove('reveal-init');
		node.classList.add('reveal-in');
	};

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				show();
				io.disconnect();
			}
		},
		// Fire a little before the element is fully in view, so it is already settling
		// by the time it is read rather than moving under the eye.
		{ rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
	);
	io.observe(node);

	// Already on screen when this attached — a deep link, a short page, a reload
	// partway down. Reveal now rather than waiting for a scroll that will not come.
	// Content is never left waiting on the observer, which is the whole point.
	const rect = node.getBoundingClientRect();
	if (rect.top < window.innerHeight && rect.bottom > 0) {
		show();
		io.disconnect();
	}

	return {
		destroy() {
			io.disconnect();
		}
	};
}
