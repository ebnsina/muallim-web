import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';
import type { StudentStatus } from '$lib/schemas';

export type Student = components['schemas']['StudentView'];
export type Guardian = components['schemas']['GuardianView'];
export type Class = components['schemas']['ClassView'];
export type Section = components['schemas']['SectionView'];

/** What a status is called in the UI. The API's enum is lowercase; a roster is read. */
export function statusLabel(status: StudentStatus): string {
	switch (status) {
		case 'active':
			return 'Active';
		case 'inactive':
			return 'Inactive';
		case 'graduated':
			return 'Graduated';
		case 'transferred':
			return 'Transferred';
	}
}

/** Active is the working state; the other three are a student no longer in class. */
export function statusTone(status: StudentStatus): BadgeTone {
	switch (status) {
		case 'active':
			return 'success';
		case 'inactive':
			return 'warning';
		case 'graduated':
			return 'accent';
		case 'transferred':
			return 'neutral';
	}
}
