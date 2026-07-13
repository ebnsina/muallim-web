import { browser } from '$app/environment';

/** What the reader chose. `system` is a choice too — it means "follow the OS". */
export type ThemeMode = 'system' | 'light' | 'dark';

/** What is actually painted. `system` resolves to one of these. */
export type Theme = 'light' | 'dark';

const KEY = 'theme';

const query = browser ? matchMedia('(prefers-color-scheme: dark)') : null;

function stored(): ThemeMode {
	try {
		const value = localStorage.getItem(KEY);
		return value === 'light' || value === 'dark' ? value : 'system';
	} catch {
		// Private browsing can refuse localStorage. Following the system is the default.
		return 'system';
	}
}

/*
	The theme, as state.

	`system` is not persisted as a value — it is the *absence* of one, which is what
	the boot script in app.html reads: no key means ask the OS. So choosing it clears
	the key rather than writing "system", and the two agree without sharing code.

	The OS can change under a reader who chose `system` — sundown on a Mac does it —
	so the media query is listened to, not merely read once at boot.
*/
class ThemeState {
	mode = $state<ThemeMode>(browser ? stored() : 'system');
	#system = $state<Theme>(query?.matches ? 'dark' : 'light');

	constructor() {
		query?.addEventListener('change', (event) => {
			this.#system = event.matches ? 'dark' : 'light';
			this.#paint();
		});
	}

	/** What is on the screen right now. */
	get resolved(): Theme {
		return this.mode === 'system' ? this.#system : this.mode;
	}

	set(mode: ThemeMode) {
		this.mode = mode;
		this.#paint();

		try {
			if (mode === 'system') localStorage.removeItem(KEY);
			else localStorage.setItem(KEY, mode);
		} catch {
			// A refusal to persist is not a reason to refuse to switch.
		}
	}

	#paint() {
		if (browser) document.documentElement.dataset.theme = this.resolved;
	}
}

export const theme = new ThemeState();
