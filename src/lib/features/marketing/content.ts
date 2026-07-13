/**
 * The v2 landing's copy, audited against `../muallim-api/bin/openapi.json` and the
 * app's route tree. Every line here is a feature that ships; the roadmap is separate
 * and badged.
 */
import type { IconSvgElement } from '@hugeicons/svelte';
import {
	Award01Icon,
	BookOpen01Icon,
	Building01Icon,
	BubbleChatIcon,
	CodeIcon,
	Quiz01Icon,
	Shield01Icon,
	SquareLock02Icon,
	UserGroupIcon
} from '@hugeicons/core-free-icons';

/** The loop a course actually runs. Every step is a route in the app today. */
export const LIFECYCLE = [
	{ step: 'Author', line: 'Topics, lessons, video, a preview anyone can watch before enrolling.' },
	{ step: 'Enroll', line: 'Invite a cohort, let learners join, or sell the course outright.' },
	{ step: 'Assess', line: 'Quizzes that grade themselves and assignments learners upload to.' },
	{ step: 'Mark', line: 'A queue of what is waiting, a gradebook, your own grading scale.' },
	{ step: 'Certify', line: 'A certificate with a serial anyone can check without signing in.' }
] as const;

export type Group = {
	icon: IconSvgElement;
	title: string;
	items: string[];
};

/** Everything that ships, grouped by who it is for. */
export const GROUPS: Group[] = [
	{
		icon: BookOpen01Icon,
		title: 'Building a course',
		items: [
			'Topics and lessons, reordered by drag, by keyboard, or by the buttons beside them',
			'Text and video lessons, with a preview video that plays before anyone enrolls',
			'Prerequisites: a course can require another course first',
			'Drip: release on a fixed date, a number of days after enrolling, or one lesson at a time',
			'Announcements to everyone on the course',
			'A draft is invisible: an unpublished course is filtered out of the catalog, not just hidden from a menu'
		]
	},
	{
		icon: Quiz01Icon,
		title: 'Setting the work',
		items: [
			'Eleven question types, including image answering and image matching',
			'A question bank: save a question once, reuse it in any quiz',
			'Attempts resume where the learner left them',
			'Everything gradable is graded on submit; open-ended answers wait for a person',
			'Assignments with file upload, a submission queue, and late work allowed or refused',
			'Every attempt readable, answer by answer, when you mark it'
		]
	},
	{
		icon: Award01Icon,
		title: 'Grading and certifying',
		items: [
			'A gradebook: every learner, every graded item, in one table',
			'Grading scales you define, and a course picks the one it grades by',
			'Certificate templates, written once and chosen per course',
			'Every certificate carries a serial, and the serial answers without a login',
			'Revoke one and the serial still answers. It says the certificate was withdrawn'
		]
	},
	{
		icon: UserGroupIcon,
		title: 'Studying',
		items: [
			'A dashboard of deadlines: what is owed, and when it is late',
			'Private notes and highlights kept against the lesson they were made in',
			'Progress recomputed the moment a lesson is completed',
			'Reviews and star ratings, written by learners who took the course',
			'Notifications in the app, plus a daily email digest of what went unread'
		]
	},
	{
		icon: BubbleChatIcon,
		title: 'Keeping people around',
		items: [
			'Community boards, threads and replies',
			'Pin a thread, lock a thread, remove a post',
			'Questions asked on a lesson, answered on the lesson',
			'Points, badges, and a workspace leaderboard'
		]
	},
	{
		icon: Building01Icon,
		title: 'Running the workspace',
		items: [
			'One workspace per school or creator, isolated at the database row',
			'Invite by email; owner, admin, instructor and student are the four roles',
			'Enroll somebody yourself, or let them enroll themselves',
			'Analytics for the courses you teach'
		]
	}
];

/** The eleven types, exactly as the API enumerates them. */
export const QUESTION_TYPES = [
	'True or false',
	'Single choice',
	'Multiple choice',
	'Fill in the blanks',
	'Short answer',
	'Ordering',
	'Matching',
	'Open-ended',
	'Numeric range',
	'Image answering',
	'Image matching'
] as const;

/** Why an API-first backend matters to somebody buying one. */
export const PLATFORM = [
	{
		icon: CodeIcon,
		title: 'An OpenAPI 3.1 contract',
		line: 'The spec is generated from the server, so it cannot drift from it. This site is its first client, not its only one.'
	},
	{
		icon: SquareLock02Icon,
		title: 'One API, many schools',
		line: 'The workspace is resolved from the host. Two schools on the same deployment never see one another’s rows.'
	},
	{
		icon: Shield01Icon,
		title: 'Errors you can handle',
		line: 'Every failure is an RFC 9457 problem document with a correlation id. Nothing renders as an unexplained 500.'
	}
] as const;
