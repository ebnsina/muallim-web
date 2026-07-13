import {
	Analytics01Icon,
	Award01Icon,
	Certificate01Icon,
	Clock01Icon,
	HeartHandshakeIcon,
	DashboardSquare01Icon,
	LiveStreaming01Icon,
	MagicWand01Icon,
	Megaphone01Icon,
	Message01Icon,
	Package01Icon,
	Briefcase01Icon,
	Quiz01Icon,
	School01Icon,
	ServerStack01Icon,
	Shield01Icon,
	SquareLock01Icon,
	TeachingIcon,
	UserGroup03Icon,
	UserGroupIcon
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/svelte';

/*
	The solution pages, one per audience, kept out of their markup.

	One rule: every line here is a thing the product does. A page that narrates its
	own gaps — "coming soon", "not yet ready for the RFP" — reads as an apology, and
	nobody buys an apology. The way to stay honest is to write nothing you cannot
	demonstrate, not to publish a list of what is missing.
*/

interface Point {
	icon: IconSvgElement;
	title: string;
	body: string;
}

export interface Segment {
	slug: string;
	/** Short label for the nav and dropdown. */
	nav: string;
	/** One line under the label in the dropdown. */
	tagline: string;
	heroIcon: IconSvgElement;
	eyebrow: string;
	headline: string;
	blurb: string;
	/** A real screenshot of the running app. Never a stock photo, never a drawing. */
	shot: { src: string; alt: string; path: string };
	today: Point[];
	/** One capability worth dwelling on, drawn straight from `today`. */
	highlight: { label: string; title: string; body: string; points: string[] };
}

export const SEGMENTS: Segment[] = [
	{
		slug: 'nonprofits',
		nav: 'Nonprofits & community',
		tagline: 'Teach and grow a community, free',
		heroIcon: HeartHandshakeIcon,
		eyebrow: 'For nonprofits & community builders',
		headline: 'Teach it for free. Grow the community around it.',
		blurb:
			'Open enrollment, a forum where questions get answered in the open, and announcements that reach every member — in the app and in their inbox.',
		shot: {
			src: '/marketing/forum.webp',
			alt: 'A community board: threads with their author, their age, and how many replies they drew.',
			path: 'muallim.app/forum'
		},
		today: [
			{
				icon: Award01Icon,
				title: 'Free courses, open enrollment',
				body: 'Publish a course and let anyone you invite join it. No checkout stands between a learner and the material.'
			},
			{
				icon: Message01Icon,
				title: 'A forum and Q&A',
				body: 'Threads per space, questions answered in the open, so the community teaches itself as much as you do.'
			},
			{
				icon: Megaphone01Icon,
				title: 'Announcements that reach everyone',
				body: 'Post once and it fans out to every member — in-app and by email digest — so news does not depend on who happened to log in.'
			}
		],
		highlight: {
			label: 'Community',
			title: 'A community will teach itself, given somewhere to do it.',
			body: 'Threads per space, questions answered on the lesson they were asked about, and an announcement that reaches everyone at once. This is the part that turns a course into a place people come back to.',
			points: [
				'Threads and replies, scoped per space',
				'Questions answered where everyone can learn from them',
				'Announcements delivered in-app and by email'
			]
		}
	},
	{
		slug: 'creators',
		nav: 'Solo creators',
		tagline: 'Build it, teach it, sell it',
		heroIcon: TeachingIcon,
		eyebrow: 'For solo creators',
		headline: 'Build it, teach it, prove it. Sell it.',
		blurb:
			'Authoring, quizzes that mark themselves, a gradebook, certificates with a serial anyone can check — and a price in your own currency, paid into your own account.',
		shot: {
			src: '/marketing/editor.webp',
			alt: 'The course editor: topics with their lessons, each row draggable, each lesson previewable.',
			path: 'muallim.app/teach/medicine-the-canon'
		},
		today: [
			{
				icon: TeachingIcon,
				title: 'Author and publish',
				body: 'Write lessons, structure a curriculum, and put it in a catalog learners can browse.'
			},
			{
				icon: Quiz01Icon,
				title: 'Quizzes and assignments',
				body: 'Eleven question types that mark themselves, plus essays and file uploads that come to you.'
			},
			{
				icon: MagicWand01Icon,
				title: 'Draft with AI',
				body: 'Generate a course outline, lesson copy, or a quiz from a lesson — each a draft you edit before it is saved.'
			},
			{
				icon: Certificate01Icon,
				title: 'Gradebook & certificates',
				body: 'A running gradebook, and a certificate issued the moment a learner earns it.'
			},
			{
				icon: Award01Icon,
				title: 'Gamification',
				body: 'Points and a leaderboard that give learners a reason to come back to the next lesson.'
			}
		],
		highlight: {
			label: 'The whole loop',
			title: 'One person, and still the whole teaching loop.',
			body: 'From the first lesson to the certificate at the end — and the payment that came before it. Nothing here needs a second tool bolted on, and nothing needs a team to operate.',
			points: [
				'Curriculum authoring and a public catalog',
				'Self-marking quizzes, hand-marked essays, a gradebook',
				'Certificates, points and a leaderboard',
				'A price in your currency, paid into your own account'
			]
		}
	},
	{
		slug: 'schools',
		nav: 'Schools & academies',
		tagline: 'Roles, marking, and isolation',
		heroIcon: School01Icon,
		eyebrow: 'For schools & academies',
		headline: 'Run the school. Not the software.',
		blurb:
			'Four roles with least privilege, invitations and member management, a gradebook that grades against the scale you define, and every academy isolated in the database itself.',
		shot: {
			src: '/marketing/grading.webp',
			alt: 'The grading scales page: the default scale, and a new one being built band by band.',
			path: 'muallim.app/teach/grading'
		},
		today: [
			{
				icon: UserGroup03Icon,
				title: 'Roles & member management',
				body: 'Owners, instructors, markers, and students, each seeing only what their role allows. Invite, promote, and remove people as staff and cohorts change.'
			},
			{
				icon: Analytics01Icon,
				title: 'A real gradebook',
				body: 'Every attempt and assignment, per learner, per course, in one place staff can read at a glance.'
			},
			{
				icon: Shield01Icon,
				title: 'Per-workspace isolation',
				body: 'Each academy is a separate tenant, enforced in the database itself — one school can never see another’s data.'
			}
		],
		highlight: {
			label: 'Operations',
			title: 'The day-to-day, handled.',
			body: 'Roles, invitations, enrollment, marking and isolation are the operational core of a school, and they are the parts a term actually runs on. Staff change, cohorts change, and the workspace keeps up.',
			points: [
				'Multi-role RBAC with least privilege',
				'Invitations and member management',
				'Isolation enforced by row-level security'
			]
		}
	},
	{
		slug: 'coaching',
		nav: 'Coaching businesses',
		tagline: 'Keep a cohort moving',
		heroIcon: UserGroup03Icon,
		eyebrow: 'For coaching businesses',
		headline: 'A cohort needs somewhere to be, between the sessions.',
		blurb:
			'A forum and open Q&A, announcements that reach everyone at once, a program built as lessons and quizzes, and a dashboard that tells each client what is due next.',
		shot: {
			src: '/marketing/dashboard.webp',
			alt: 'A learner dashboard: courses in progress, lessons completed, and a calendar of what is due.',
			path: 'muallim.app/dashboard'
		},
		today: [
			{
				icon: Message01Icon,
				title: 'A place for your cohort',
				body: 'A forum and open Q&A where clients ask, answer, and keep the momentum between sessions.'
			},
			{
				icon: Megaphone01Icon,
				title: 'Keep everyone in step',
				body: 'Announcements reach every member at once, in-app and by email, so nobody misses what comes next.'
			},
			{
				icon: Quiz01Icon,
				title: 'Structured programs',
				body: 'Turn a coaching arc into lessons and quizzes, with a gradebook to see who is keeping up.'
			}
		],
		highlight: {
			label: 'Community',
			title: 'The week between two sessions is where cohorts are lost.',
			body: 'The forum, the Q&A, and the announcements are what keeps a cohort warm across that week — and the dashboard tells each client, without being asked, what is owed and when it is late.',
			points: [
				'A forum and Q&A scoped to your cohort',
				'Announcements delivered in-app and by email',
				'Courses and quizzes to structure the program'
			]
		}
	},
	{
		slug: 'agencies',
		nav: 'Agencies',
		tagline: 'An isolated tenant per client',
		heroIcon: Briefcase01Icon,
		eyebrow: 'For agencies',
		headline: 'One deployment. A separate school for every client.',
		blurb:
			'Each client is an isolated tenant on its own domain, with its own roles, its own members, and its own catalog — enforced in the database, not by a filter somebody has to remember to write.',
		shot: {
			src: '/marketing/course.webp',
			alt: 'A course page: the preview video, the level, the rating, the instructor, and the enrol panel.',
			path: 'muallim.app/courses/medicine-the-canon'
		},
		today: [
			{
				icon: ServerStack01Icon,
				title: 'A tenant per client',
				body: 'Each client workspace is fully isolated, enforced in the database — no client ever sees another.'
			},
			{
				icon: MagicWand01Icon,
				title: 'Custom domains',
				body: 'Point a client’s own domain at their workspace; the edge routing that makes that work is built.'
			},
			{
				icon: Shield01Icon,
				title: 'Roles within each client',
				body: 'Owners, instructors, and markers per workspace, so a client’s own staff run their own space.'
			}
		],
		highlight: {
			label: 'Foundation',
			title: 'The hard part is the isolation, and it is not optional here.',
			body: 'A workspace is resolved from the host, and every query is scoped to it with row-level security behind that as the net. Two clients on the same deployment cannot see one another, and no amount of forgetting a WHERE clause changes it.',
			points: [
				'Full data isolation per client tenant',
				'A custom domain per client, routed at the edge',
				'Independent roles and members inside each workspace'
			]
		}
	}
];

export function segmentBySlug(slug: string): Segment | undefined {
	return SEGMENTS.find((s) => s.slug === slug);
}
