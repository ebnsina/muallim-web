import { z } from 'zod';
import type { components } from '$lib/api/schema';

/*
	The transport module's types and its forms' rules. muallim-api works in minor units
	(poisha); an admin types major ones (taka), so a route's fare is a major number the
	action multiplies before the request leaves — `fees` is the reference. A route holds
	its fleet; a student rides one route, and a second assignment is refused with 409.
*/

export type Route = components['schemas']['RouteView'];
export type Vehicle = components['schemas']['VehicleView'];
export type Assignment = components['schemas']['TransportAssignmentView'];

/** Major units to minor: an admin prices a fare in taka, the API is told poisha. */
export const MINOR_PER_MAJOR = 100;

/** A vehicle's driver and seats, as one line — an unnamed driver shows the plate alone. */
export function vehicleSubtitle(vehicle: Vehicle): string {
	const parts: string[] = [];
	if (vehicle.driver_name) parts.push(vehicle.driver_name);
	if (vehicle.driver_phone) parts.push(vehicle.driver_phone);
	parts.push(`${vehicle.capacity} ${vehicle.capacity === 1 ? 'seat' : 'seats'}`);
	return parts.join(' · ');
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

/** A fare, as an admin types it: major units, more than nothing. The action multiplies. */
const fare = z.coerce
	.number({ error: 'A fare is a number.' })
	.positive('A fare is more than nothing.')
	.max(1_000_000, 'That is more than this system will bill.');

const currency = z
	.string()
	.trim()
	.length(3, 'A currency is three letters, like BDT or USD.')
	.transform((value) => value.toUpperCase());

/*
	A transport route: a named service with a per-rider fare, optionally described. The
	fare is major units in the box; the action sends minor.
*/
export const createRouteSchema = z.object({
	name: text(120, 'Give the route a name.'),
	description: optionalText(500),
	fare,
	currency
});

/*
	A vehicle on a route: its plate, how many it seats, and who drives it. The plate and
	a capacity are the two things it cannot do without; the driver's name and phone place
	it.
*/
export const addVehicleSchema = z.object({
	registration_no: text(40, 'Give the vehicle a registration number.'),
	capacity: z.coerce
		.number({ error: 'A capacity is a number.' })
		.int('A capacity is a whole number.')
		.positive('A capacity is more than nothing.')
		.max(1000, 'That is more than one vehicle seats.'),
	driver_name: optionalText(120),
	driver_phone: optionalText(40)
});

/*
	Assigning a student to a route. The route and the student are required; the stop names
	where they board. A student rides one route, so a second assignment is the API's 409.
*/
export const assignStudentSchema = z.object({
	route_id: z.uuid('Choose a route.'),
	student_id: z.uuid('Choose a student.'),
	stop_name: optionalText(120)
});

/** The HTML constraints for the transport forms, as attributes. Spread them onto the control. */
export const TRANSPORT_LIMITS = {
	name: { required: true, maxlength: 120 },
	description: { maxlength: 500 },
	fare: { required: true, type: 'number', min: 0, step: '0.01' },
	currency: { required: true, maxlength: 3, minlength: 3 },
	registration: { required: true, maxlength: 40 },
	capacity: { required: true, type: 'number', min: 1, step: '1' },
	driverName: { maxlength: 120 },
	driverPhone: { maxlength: 40 },
	stopName: { maxlength: 120 }
} as const;
