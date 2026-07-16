import type { Action } from 'svelte/action';

/*
	A small drag action for the Course Builder, and nothing beyond it.

	It rides the browser's native HTML5 drag events rather than raw pointer maths:
	the platform already handles the drag image, the cursor, autoscroll near an
	edge, and touch fallback, and re-implementing those is where a hand-rolled
	pointer drag goes wrong. A heavy dnd library is not pulled in for what these
	four listeners do.

	Each draggable carries a *zone* (which list it belongs to) and an *id*. On drop
	the action reports the source zone+id and the target zone+index, and the page
	decides what that means — a reorder within a list, or a move across two. The
	action never mutates anything; it only says what was dropped where.
*/

const MIME = 'application/x-muallim-dnd';

export interface DropDetail {
	fromZone: string;
	id: string;
	toZone: string;
	/** The index in the target zone the item was dropped before. */
	toIndex: number;
}

interface DraggableParams {
	zone: string;
	id: string;
	/** Zones that share a group accept each other — how a lesson crosses modules. */
	group?: string;
	disabled?: boolean;
}

/*
	A payload shared between the source and the targets, in a module variable.

	`dataTransfer.getData` is unreadable during `dragover` (the spec only exposes it
	on `drop`), yet a target needs the source's zone *while* dragging to decide
	whether it will accept it. So the id and zone ride here, and dataTransfer
	carries only the marker MIME so a foreign drag (a file, a selection) is ignored.
*/
let active: { zone: string; id: string; group?: string } | null = null;

/*
	Marks an element as a drag source. Apply it to a *handle*: the whole card is
	what moves and what the drop-index maths measures (`[data-dnd-item]`), but the
	card is draggable=false so the inputs inside it stay selectable and focusable.
	Only the handle carries the drag, and the card rides along as the drag image.
*/
export const draggable: Action<HTMLElement, DraggableParams> = (node, params) => {
	let current = params;

	// The card this handle belongs to — what moves, and what the zone measures.
	const card = (): HTMLElement => node.closest<HTMLElement>('[data-dnd-item]') ?? node;

	function onDragStart(event: DragEvent) {
		if (current.disabled || !event.dataTransfer) return;
		active = { zone: current.zone, id: current.id, group: current.group };
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData(MIME, current.id);
		const el = card();
		event.dataTransfer.setDragImage(el, 16, 16);
		// Deferred: setting it now would capture the drag image mid-frame, ghosting it.
		requestAnimationFrame(() => el.setAttribute('data-dragging', 'true'));
	}

	function onDragEnd() {
		active = null;
		card().removeAttribute('data-dragging');
	}

	node.setAttribute('draggable', current.disabled ? 'false' : 'true');
	node.addEventListener('dragstart', onDragStart);
	node.addEventListener('dragend', onDragEnd);

	return {
		update(next: DraggableParams) {
			current = next;
			node.setAttribute('draggable', next.disabled ? 'false' : 'true');
		},
		destroy() {
			node.removeEventListener('dragstart', onDragStart);
			node.removeEventListener('dragend', onDragEnd);
		}
	};
};

interface ZoneParams {
	zone: string;
	/** A zone accepts its own items, plus any source sharing this group. */
	group?: string;
	onDrop: (detail: DropDetail) => void;
}

/*
	Marks a list as a drop zone. The index is computed from the pointer's position
	against the mid-point of each `[data-dnd-item]` child, so a drop lands *between*
	rows the way the reader expects, not merely "into the list".
*/
export const dropzone: Action<HTMLElement, ZoneParams> = (node, params) => {
	let current = params;

	function willAccept(): boolean {
		if (!active) return false;
		if (active.zone === current.zone) return true;
		return Boolean(current.group) && active.group === current.group;
	}

	function indexAt(clientY: number): number {
		const items = [...node.querySelectorAll<HTMLElement>('[data-dnd-item]')].filter(
			(el) => el.getAttribute('data-dragging') !== 'true'
		);
		for (let i = 0; i < items.length; i++) {
			const box = items[i].getBoundingClientRect();
			if (clientY < box.top + box.height / 2) return i;
		}
		return items.length;
	}

	function onDragOver(event: DragEvent) {
		if (!willAccept()) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		node.setAttribute('data-dropping', 'true');
	}

	function onDragLeave(event: DragEvent) {
		// Only clear when the pointer truly left the zone, not when it crossed a child.
		if (!node.contains(event.relatedTarget as Node)) node.removeAttribute('data-dropping');
	}

	function onDrop(event: DragEvent) {
		node.removeAttribute('data-dropping');
		if (!active || !willAccept()) return;
		event.preventDefault();
		const detail: DropDetail = {
			fromZone: active.zone,
			id: active.id,
			toZone: current.zone,
			toIndex: indexAt(event.clientY)
		};
		current.onDrop(detail);
	}

	node.addEventListener('dragover', onDragOver);
	node.addEventListener('dragleave', onDragLeave);
	node.addEventListener('drop', onDrop);

	return {
		update(next: ZoneParams) {
			current = next;
		},
		destroy() {
			node.removeEventListener('dragover', onDragOver);
			node.removeEventListener('dragleave', onDragLeave);
			node.removeEventListener('drop', onDrop);
		}
	};
};
