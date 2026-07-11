import {
	Analytics01Icon,
	Award01Icon,
	Certificate01Icon,
	Clock01Icon,
	DashboardSquare01Icon,
	LiveStreaming01Icon,
	MagicWand01Icon,
	Megaphone01Icon,
	Message01Icon,
	Package01Icon,
	Quiz01Icon,
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

	Same two rules as the landing: `today` is built and works now, `roadmap` is
	not and the page says so where the reader can see it. The `verdict` is the
	honest part — who this is ready for, and who should wait. A marketing page that
	names its own gaps is the only kind worth trusting.
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
	/** Placeholder photo (Unsplash) — swap for a licensed image before launch. */
	image: string;
	imageAlt: string;
	today: Point[];
	/** One capability worth dwelling on, drawn straight from `today`. */
	highlight: { label: string; title: string; body: string; points: string[] };
	roadmap: Point[];
	/** The honest bottom line: ready for whom, and who should wait. */
	verdict: { ready: string; wait: string };
}

export const SEGMENTS: Segment[] = [
	{
		slug: 'nonprofits',
		nav: 'Nonprofits & community',
		tagline: 'Teach and grow a community, free',
		heroIcon: UserGroupIcon,
		eyebrow: 'For nonprofits & community builders',
		headline: 'Everything you need is already here.',
		blurb:
			'Free courses, open enrolment, and a community layer that keeps people coming back — with no dependency on the paid pieces still being built.',
		image:
			'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=70',
		imageAlt: 'Volunteers gathered around a table, learning together',
		today: [
			{
				icon: Award01Icon,
				title: 'Free courses, open enrolment',
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
			title: 'The part that keeps a community alive is the part you get today.',
			body: 'The forum, the Q&A, and announcements are built, tested, and running. They are the core of "teach and grow your community," and none of them wait on the commerce work still to come.',
			points: [
				'Threads and replies, scoped per space',
				'Questions answered where everyone can learn from them',
				'Announcements delivered in-app and by email'
			]
		},
		roadmap: [
			{
				icon: Package01Icon,
				title: 'Donations & paid tiers',
				body: 'Taking money — for a supporter tier or a paid workshop — arrives with the commerce work. Everything free works now.'
			}
		],
		verdict: {
			ready: 'You can run a full community learning programme today, end to end, at no cost.',
			wait: 'If taking donations or membership fees in-platform is essential, that piece is still ahead.'
		}
	},
	{
		slug: 'creators',
		nav: 'Solo creators',
		tagline: 'Build and teach now, sell soon',
		heroIcon: TeachingIcon,
		eyebrow: 'For solo creators',
		headline: 'Build it, teach it, prove it. Selling is next.',
		blurb:
			'Authoring, quizzes, a gradebook, certificates, and gamification all work today. The one gap is checkout — so you can build and teach your course now, and sell it the moment commerce lands.',
		image:
			'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=70',
		imageAlt: 'A teacher explaining at a whiteboard',
		today: [
			{
				icon: TeachingIcon,
				title: 'Author and publish',
				body: 'Write lessons, structure a curriculum, and put it in a catalogue learners can browse.'
			},
			{
				icon: Quiz01Icon,
				title: 'Quizzes and assignments',
				body: 'Nine question types that mark themselves, plus essays and file uploads that come to you.'
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
			label: 'What works today',
			title: 'Every part of building and running a course is here.',
			body: 'From the first lesson to the certificate at the end, the whole teaching loop is built and tested. The only thing you cannot do yet is charge for it.',
			points: [
				'Curriculum authoring and a public catalogue',
				'Self-marking quizzes, hand-marked essays, a gradebook',
				'Certificates and a points leaderboard'
			]
		},
		roadmap: [
			{
				icon: Package01Icon,
				title: 'Checkout & orders',
				body: 'Selling a course — pricing, checkout, orders — arrives with Stripe in the commerce phase. Until then, build and teach for free.'
			}
		],
		verdict: {
			ready: 'You can build, launch, and teach a complete course today.',
			wait: 'If your first move is to charge for it, selling is the one piece still on the way.'
		}
	},
	{
		slug: 'schools',
		nav: 'Schools & academies',
		tagline: 'Run it today, procure it later',
		heroIcon: Shield01Icon,
		eyebrow: 'For schools & academies',
		headline: 'Ready to run. Not yet ready for the RFP.',
		blurb:
			'Multi-role access, member management, a gradebook, and hard per-workspace isolation are built. What an institutional procurement adds — the standards moat — is honestly still ahead.',
		image:
			'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=70',
		imageAlt: 'Students seated in a lecture hall',
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
			title: 'The day-to-day of running a school already works.',
			body: 'Roles, enrolment, marking, and isolation are the operational core, and they are built and tested. What is missing is not how you teach — it is what a procurement office checks off.',
			points: [
				'Multi-role RBAC with least privilege',
				'Invitations and member management',
				'Isolation enforced by row-level security'
			]
		},
		roadmap: [
			{
				icon: SquareLock01Icon,
				title: 'SSO — SAML & LTI 1.3',
				body: 'Single sign-on and launching from an existing LMS are the first things an institution asks for. Both are in the standards phase.'
			},
			{
				icon: ServerStack01Icon,
				title: 'SCORM & interoperable content',
				body: 'Importing and playing standards-based course packages, so existing material comes with you.'
			},
			{
				icon: Certificate01Icon,
				title: 'Accessibility — WCAG & VPAT',
				body: 'A documented accessibility conformance report, the paperwork a public tender requires.'
			},
			{
				icon: UserGroupIcon,
				title: 'Cohorts',
				body: 'Grouping learners into intakes that move through a course together.'
			}
		],
		verdict: {
			ready:
				'A department or academy can teach and administer courses today with proper roles and isolation.',
			wait: 'If you are answering a formal RFP, the standards moat — LTI, SSO, SCORM, VPAT — is still being built.'
		}
	},
	{
		slug: 'coaching',
		nav: 'Coaching businesses',
		tagline: 'Community now, live sessions soon',
		heroIcon: Message01Icon,
		eyebrow: 'For coaching businesses',
		headline: 'The community is here. The live room is coming.',
		blurb:
			'Forum, Q&A, and announcements give a coaching cohort a place to gather today. Live sessions, scheduling, and selling are the pieces still ahead.',
		image:
			'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=70',
		imageAlt: 'A small group in a coaching session',
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
				title: 'Structured programmes',
				body: 'Turn a coaching arc into lessons and quizzes, with a gradebook to see who is keeping up.'
			}
		],
		highlight: {
			label: 'Community',
			title: 'Between-session engagement is the part that is built.',
			body: 'The forum, Q&A, and announcements are running today. They are what keeps a cohort warm between the live moments — and they do not wait on anything.',
			points: [
				'A forum and Q&A scoped to your cohort',
				'Announcements delivered in-app and by email',
				'Courses and quizzes to structure the programme'
			]
		},
		roadmap: [
			{
				icon: LiveStreaming01Icon,
				title: 'Live classes',
				body: 'Running a session over Zoom or Meet from inside the workspace is ahead, not here.'
			},
			{
				icon: Clock01Icon,
				title: 'Scheduling & cohorts',
				body: 'Booking sessions and moving an intake through a programme together are still to come.'
			},
			{
				icon: Package01Icon,
				title: 'Selling packages',
				body: 'Charging for a coaching package arrives with the commerce work.'
			}
		],
		verdict: {
			ready:
				'You can host the community around your coaching today — the forum, Q&A, and announcements.',
			wait: 'If live sessions, scheduling, or in-platform payment are core to your offer, those are still ahead.'
		}
	},
	{
		slug: 'agencies',
		nav: 'Agencies',
		tagline: 'Isolated client tenants, per domain',
		heroIcon: ServerStack01Icon,
		eyebrow: 'For agencies',
		headline: 'The tenancy is solid. The console is next.',
		blurb:
			'Every client is already an isolated tenant on its own custom domain. What is missing is the layer above — one console to run them all, and white-label theming.',
		image:
			'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=70',
		imageAlt: 'An open-plan office with a team at work',
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
			title: 'The hard part — isolation at the edge — is done.',
			body: 'Multi-tenancy and per-client custom domains are the foundation an agency is built on, and both are working today. What is left sits on top of it.',
			points: [
				'Full data isolation per client tenant',
				'A custom domain per client, routed at the edge',
				'Independent roles and members inside each workspace'
			]
		},
		roadmap: [
			{
				icon: DashboardSquare01Icon,
				title: 'An agency console',
				body: 'Managing many client workspaces from one place — the layer above the individual tenants — is ahead.'
			},
			{
				icon: MagicWand01Icon,
				title: 'White-label theming',
				body: 'Reskinning each client workspace to their brand, beyond the domain, is still to come.'
			}
		],
		verdict: {
			ready: 'You can stand up isolated, custom-domain workspaces for each client today.',
			wait: 'If you need one console over many clients or full white-label theming, that agency layer is next.'
		}
	}
];

export function segmentBySlug(slug: string): Segment | undefined {
	return SEGMENTS.find((s) => s.slug === slug);
}
