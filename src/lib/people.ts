import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';
import type { Role } from '$lib/schemas';

export type Member = components['schemas']['MemberView'];
export type Invitation = components['schemas']['InvitationView'];
export type MemberStatus = Member['status'];
export type InvitationStatus = Invitation['status'];

/** What a role is called in the UI. The API's enum is lowercase; a table is read. */
export function roleLabel(role: Role): string {
	switch (role) {
		case 'owner':
			return 'Owner';
		case 'admin':
			return 'Admin';
		case 'instructor':
			return 'Instructor';
		case 'student':
			return 'Student';
		case 'guardian':
			return 'Guardian';
	}
}

/** One line on what a role may do, under the picker. The API is the authority. */
export function roleHint(role: Role): string {
	switch (role) {
		case 'owner':
			return 'Everything, including billing and the workspace itself.';
		case 'admin':
			return 'Everything except the workspace itself. May invite and remove people.';
		case 'instructor':
			return 'Authors courses and marks work. May see the member list.';
		case 'student':
			return 'Takes courses.';
		case 'guardian':
			return 'A parent. Reads their own child’s attendance, fees and progress, and nothing else.';
	}
}

/** Suspended is not a warning, it is a stop: the person cannot sign in. */
export function memberTone(status: MemberStatus): BadgeTone {
	switch (status) {
		case 'active':
			return 'success';
		case 'suspended':
			return 'danger';
	}
}

/** Only a pending invitation is outstanding; the other three are history. */
export function invitationTone(status: InvitationStatus): BadgeTone {
	switch (status) {
		case 'pending':
			return 'warning';
		case 'accepted':
			return 'success';
		case 'revoked':
			return 'neutral';
		case 'expired':
			return 'neutral';
	}
}

/** Withdrawing anything else is a request muallim-api refuses; the button is not drawn. */
export function isOutstanding(invitation: Invitation): boolean {
	return invitation.status === 'pending';
}
