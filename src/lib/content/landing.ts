import {
	AiBrain01Icon,
	Analytics01Icon,
	Certificate01Icon,
	Clock01Icon,
	LanguageSkillIcon,
	MagicWand01Icon,
	Message01Icon,
	Mortarboard02Icon,
	Quiz01Icon,
	Shield01Icon,
	SquareLock01Icon,
	UserGroup03Icon,
	VideoReplayIcon
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/svelte';

/*
	The landing page's copy, kept out of its markup.

	Two rules govern this file, and they are worth stating because a marketing page
	is the easiest place in a codebase to write something untrue.

	  1. A feature with no `status` is built and works today. Try it.
	  2. A feature with `status: 'planned'` is not, and the page says so where the
	     reader can see it. It is never implied by omission.

	Anything below marked PLACEHOLDER is invented. It exists so the page has a
	shape, and it must be replaced with something real — or deleted — before this
	is shown to anybody who might believe it.
*/

export interface Feature {
	icon: IconSvgElement;
	title: string;
	body: string;
	status?: 'planned';
}

/**
 * PLACEHOLDER. These schools do not exist and nobody uses this yet.
 *
 * A logo strip is a claim that other people trust you, and it is the single most
 * load-bearing sentence on a landing page. Replace these with schools that have
 * actually said yes, in writing, or delete the section — an empty array hides it.
 */
export const LOGOS: string[] = [
	'Bayt al-Hikma',
	'Al-Qarawiyyin',
	'Nizamiyya',
	'Maragheh Observatory',
	'Al-Azhar',
	'Al-Mustansiriya',
	'House of Wisdom',
	'Zaytuna',
	'Al-Andalus Academy',
	'Cordoba College',
	'Samarkand Institute',
	'Bukhara School',
	'Timbuktu Sankoré',
	'Isfahan Seminary'
];

/** What the product does today. Every one of these is exercised by a test. */
export const FEATURES: Feature[] = [
	{
		icon: Quiz01Icon,
		title: 'Quizzes that mark themselves',
		body: 'Eleven kinds of question, from true-or-false to matching pairs and image choices. Students hand one in and the result comes back a moment later, however long the quiz.'
	},
	{
		icon: UserGroup03Icon,
		title: 'Essays come to you',
		body: "Anything a computer shouldn't be judging lands in one tidy list, with the student's work beside it. Give it a mark and a comment; the grade settles itself."
	},
	{
		icon: Clock01Icon,
		title: 'Lessons on your schedule',
		body: 'Open a course all at once, on a chosen date, a few days after each student joins, or one lesson at a time as they finish the last.'
	}
];

export const MORE_FEATURES: Feature[] = [
	{
		icon: SquareLock01Icon,
		title: 'Let people try before they join',
		body: 'Offer a lesson as a free sample. Ask students to finish one course before they start the next.'
	},
	{
		icon: VideoReplayIcon,
		title: 'Videos that simply play',
		body: 'Paste a link from YouTube, Vimeo or Cloudflare Stream. We tidy it up, drop the tracking, and it plays.'
	},
	{
		icon: Mortarboard02Icon,
		title: 'A space of your own',
		body: 'Your courses, your students, your name on the door. Nobody outside your school can see in.'
	},
	{
		icon: Shield01Icon,
		title: 'Students never see the answer',
		body: 'Not in the page, not in the network tab, not in a second attempt. The answer key never leaves our side of the wire.'
	},
	{
		icon: Message01Icon,
		title: 'Tell them why, not just what',
		body: 'Write a note on each question. Students read it once their attempt is marked — never a moment before.'
	},
	{
		icon: Certificate01Icon,
		title: 'Certificates on completion',
		body: 'A signed certificate when a student finishes, that anyone can check without asking you.'
	}
];

/**
 * The AI features. `status: 'planned'` still means not built — the badge on each
 * card is the difference between a roadmap and a lie. Course and quiz generation
 * now ship, so they carry no badge; captions and the class-insight feature do.
 */
export const AI_FEATURES: Feature[] = [
	{
		icon: MagicWand01Icon,
		title: 'A course from one sentence',
		body: 'Describe what you want to teach. Get an outline, the lessons under it, and a draft for each — all of it yours to edit before anything is saved.'
	},
	{
		icon: AiBrain01Icon,
		title: 'Quizzes worth taking',
		body: 'Turn a lesson into questions at the count you choose. Preview them, keep what works — the same validator a hand-written question meets refuses a bad one.'
	},
	{
		icon: LanguageSkillIcon,
		title: 'Captions and translation',
		body: 'Your videos captioned automatically, and your lessons offered in the languages your students read.',
		status: 'planned'
	},
	{
		icon: Analytics01Icon,
		title: 'Where the class is stuck',
		body: 'The question everybody gets wrong, surfaced before you have to notice it yourself.',
		status: 'planned'
	}
];

export interface Step {
	title: string;
	body: string;
}

export const STEPS: Step[] = [
	{ title: 'Claim your school', body: 'One workspace, your name on it. It takes a minute.' },
	{
		title: 'Write a course',
		body: 'Sections, lessons, videos, a quiz at the end. Publish when it is ready, not before.'
	},
	{
		title: 'Invite your students',
		body: 'They enroll, they learn, they are marked. You see who is where.'
	}
];

export interface Plan {
	name: string;
	price: string;
	cadence?: string;
	summary: string;
	features: string[];
	highlighted?: boolean;
	cta: string;
}

/**
 * PLACEHOLDER. There is no billing in this system — not a table, not an endpoint,
 * not a Stripe key. These numbers are invented, and so are the limits beside them:
 * nothing caps a course count or a student count today.
 *
 * A pricing page is a contract offer. Do not publish this one until money can
 * actually change hands, or a person will hand over a card and get an error.
 */
export const PLANS: Plan[] = [
	{
		name: 'Free',
		price: '£0',
		cadence: 'forever',
		summary: 'For one teacher finding out whether this works.',
		features: ['One course', 'Up to 25 students', 'Quizzes and marking', 'Community support'],
		cta: 'Start teaching'
	},
	{
		name: 'Pro',
		price: '£19',
		cadence: 'per month',
		summary: 'For a teacher who is doing this properly.',
		features: [
			'Unlimited courses',
			'Up to 500 students',
			'Drip release and prerequisites',
			'Hosted video',
			'Email support'
		],
		highlighted: true,
		cta: 'Start teaching'
	},
	{
		name: 'School',
		price: 'Talk to us',
		summary: 'For an institution with more than one teacher in it.',
		features: [
			'Everything in Pro',
			'Unlimited students',
			'Instructors and teaching assistants',
			'Your own domain',
			'A person who answers the phone'
		],
		// Every plan's button goes to registration, because that is the only door
		// this system has. A "Get in touch" that lands on a signup form is a button
		// that lies about where it goes.
		cta: 'Start teaching'
	}
];

export interface Question {
	question: string;
	answer: string;
}

/*
	Every answer here is a thing the system does. Two earlier drafts of this list
	answered "what happens if I stop paying" and "can I export my courses" — there
	is no billing and there is no export, so both were promises the product could
	not keep to the first person who asked.
*/
export const FAQS: Question[] = [
	{
		question: 'Do my students need an account?',
		answer:
			'Yes, to take a quiz or track progress. They can read anything you mark as a free sample without one.'
	},
	{
		question: 'Can somebody else mark for me?',
		answer:
			'Yes. A teaching assistant can mark essays without being able to change your course. It is a separate permission, on purpose.'
	},
	{
		question: 'Where do my videos live?',
		answer:
			'Wherever you already put them — YouTube, Vimeo, or Cloudflare Stream. Paste the link and we handle the rest.'
	},
	{
		question: 'Can a student see the answers?',
		answer:
			'No. The answer key never leaves our servers, not even in the page a student is looking at. Your explanation appears once their attempt is marked.'
	},
	{
		question: 'Can I put a timer on a quiz, or limit the attempts?',
		answer:
			'Both. The clock starts when the student does, and changing the limit later never shortens an attempt already under way.'
	},
	{
		question: 'What if a student closes the tab halfway through?',
		answer:
			'Their answers are saved as they go. They come back to the same attempt, not a new one, and it does not cost them a try.'
	}
];
