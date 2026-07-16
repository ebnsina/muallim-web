import { z } from 'zod';
import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

/*
	The hostel module's types and its forms' rules. A workspace registers boarding
	buildings, gives each rooms with a capacity, and allocates a student a bed. A room
	fills when its `occupied` reaches its `capacity`, and muallim-api answers a bed too
	many, or a student allocated twice, with a 409 — surfaced here, never invented. The
	bounds are muallim-api's own; a number this form accepts that the server refuses is
	a form that lies.
*/

export type Building = components['schemas']['BuildingView'];
export type Room = components['schemas']['RoomView'];
export type Allocation = components['schemas']['AllocationView'];

/** The states an allocation may be in. muallim-api's enum. */
export const ALLOCATION_STATUSES = ['active', 'vacated'] as const;
export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];

/** What a status is called in the UI. The API's enum is lowercase; a register is read. */
export function allocationStatusLabel(status: AllocationStatus): string {
	switch (status) {
		case 'active':
			return 'Boarding';
		case 'vacated':
			return 'Vacated';
	}
}

/** Active is a bed in use; vacated is boarding history, the bed freed. */
export function allocationStatusTone(status: AllocationStatus): BadgeTone {
	switch (status) {
		case 'active':
			return 'success';
		case 'vacated':
			return 'neutral';
	}
}

/** A room with no bed left. A full room refuses another allocation with a 409. */
export function isRoomFull(room: Room): boolean {
	return room.occupied >= room.capacity;
}

// `.trim()` before `.min(1)`: `required` asks whether a character was typed, and a
// space is a character.
const text = (max: number, missing: string) =>
	z.string().trim().min(1, missing).max(max, `That is longer than ${max} characters.`);

const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `That is longer than ${max} characters.`)
		.optional()
		.transform((value) => value ?? '');

/*
	Registering a building. The name is the one thing it cannot do without; a warden's
	name and phone place a person against it, and both are optional.
*/
export const createBuildingSchema = z.object({
	name: text(120, 'Give the building a name.'),
	warden_name: optionalText(120),
	warden_phone: optionalText(40)
});

/*
	Adding a room to a building. A room number names it; a capacity is how many beds it
	holds — more than nothing, a whole number, since half a bed is not one.
*/
export const addRoomSchema = z.object({
	room_no: text(60, 'Give the room a number.'),
	capacity: z.coerce
		.number({ error: 'A capacity is a number.' })
		.int('A capacity is a whole number of beds.')
		.positive('A room holds at least one bed.')
		.max(1000, 'That is more beds than a room holds.')
});

/*
	Allocating a bed. A room and a student are the whole of it; muallim-api decides
	whether the room has a bed left and whether the student already boards, each its 409.
*/
export const allocateSchema = z.object({
	room_id: z.uuid('Choose a room.'),
	student_id: z.uuid('Choose a student.')
});

/** The HTML constraints for the hostel forms, as attributes. Spread them onto the control. */
export const HOSTEL_LIMITS = {
	name: { required: true, maxlength: 120 },
	wardenName: { maxlength: 120 },
	wardenPhone: { maxlength: 40, type: 'tel' },
	roomNo: { required: true, maxlength: 60 },
	capacity: { required: true, type: 'number', min: 1, step: '1' }
} as const;
