import {
	AiBrain01Icon,
	Analytics01Icon,
	Award01Icon,
	Book02Icon,
	Book04Icon,
	Bus01Icon,
	Calendar03Icon,
	CalendarSetting01Icon,
	Certificate01Icon,
	CheckmarkBadge01Icon,
	ClipboardIcon,
	Clock01Icon,
	FileValidationIcon,
	Home01Icon,
	IdIcon,
	Invoice01Icon,
	LiveStreaming01Icon,
	Mail01Icon,
	Megaphone01Icon,
	Message02Icon,
	MessageMultiple01Icon,
	Money04Icon,
	Notification01Icon,
	PaintBoardIcon,
	Package01Icon,
	Quiz01Icon,
	Quran01Icon,
	Route02Icon,
	School01Icon,
	SecurityCheckIcon,
	ServerStack01Icon,
	Shield01Icon,
	Store01Icon,
	Structure01Icon,
	Tag01Icon,
	Task01Icon,
	TaskDone01Icon,
	TeachingIcon,
	Time04Icon,
	UserAdd01Icon,
	UserMultipleIcon,
	UserSharingIcon,
	Video01Icon,
	Wallet01Icon,
	Briefcase01Icon
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/svelte';

/*
	Every feature that ships, one entry each, kept out of the markup.

	The rule is `segments.ts`'s rule: every line here is a thing the product does
	today. Nothing is written that could not be demonstrated on a live workspace —
	no roadmap, no "coming soon", no invented numbers, logos, or customers. Counts
	stated here (the 15 quiz types) are counted from the API, not remembered.
*/

export type GroupKey =
	'teaching' | 'assessment' | 'community' | 'academic' | 'operations' | 'families' | 'platform';

export interface Group {
	key: GroupKey;
	name: string;
	/** One line under the group heading on the index. */
	blurb: string;
	icon: IconSvgElement;
}

export interface Feature {
	slug: string;
	group: GroupKey;
	/** Short label — the index card title and the page's nav name. */
	name: string;
	/** One line on the index card. */
	tagline: string;
	icon: IconSvgElement;
	headline: string;
	blurb: string;
	/** What it does today. Three to five lines, each demonstrable. */
	today: string[];
	/** Slugs of features a reader of this one tends to want next. */
	related: string[];
}

export const GROUPS: Group[] = [
	{
		key: 'teaching',
		name: 'Teaching & learning',
		blurb:
			'Build a course in the order you teach it, and put it in front of the people who need it.',
		icon: TeachingIcon
	},
	{
		key: 'assessment',
		name: 'Assessment & certificates',
		blurb: 'Set the work, mark it, and hand out something worth keeping at the end.',
		icon: Quiz01Icon
	},
	{
		key: 'community',
		name: 'Community & live teaching',
		blurb: 'A course is a place, not a file drop — somewhere to ask, answer, and meet.',
		icon: Message02Icon
	},
	{
		key: 'academic',
		name: 'The academic office',
		blurb:
			'Admission to result card — the register, the exam, and the year your institution runs on.',
		icon: School01Icon
	},
	{
		key: 'operations',
		name: 'Money & operations',
		blurb: 'Fees, salaries, books, buses, and beds — the parts of a school that are not a lesson.',
		icon: Money04Icon
	},
	{
		key: 'families',
		name: 'Families & communication',
		blurb: 'Keep guardians in the loop without a phone call for every question.',
		icon: UserSharingIcon
	},
	{
		key: 'platform',
		name: 'The platform',
		blurb: 'The foundations underneath all of it — your data, your people, your money.',
		icon: ServerStack01Icon
	}
];

export const FEATURES: Feature[] = [
	// ── Teaching & learning ──────────────────────────────────────────────────
	{
		slug: 'courses-and-curriculum',
		group: 'teaching',
		name: 'Courses & curriculum',
		tagline: 'Topics and lessons, in the order you teach them',
		icon: Book02Icon,
		headline: 'A course is a shape, not a folder of files.',
		blurb:
			'Build a curriculum out of topics and the lessons inside them, drag a row to move it, and publish when it is ready — not before.',
		today: [
			'Topics with lessons inside them, each one dragged into the order you want',
			'Write a lesson in text, attach a video, or both',
			'A draft stays invisible to learners until you publish it — nobody stumbles on half a course',
			'A public catalogue page per course, with a preview lesson you choose to open',
			'Reorder a whole topic in one go, without renumbering anything by hand'
		],
		related: ['video-lessons', 'drip-and-prerequisites', 'course-plan-builder']
	},
	{
		slug: 'video-lessons',
		group: 'teaching',
		name: 'Video lessons',
		tagline: 'YouTube, Vimeo, or a link you paste',
		icon: Video01Icon,
		headline: 'Your video, wherever it already lives.',
		blurb:
			'Paste a YouTube or Vimeo link and the lesson plays it inline. Nothing to re-upload, and no video bill to pay us.',
		today: [
			'YouTube and Vimeo links, turned into a clean player on the lesson',
			'A link is checked when you save it — a video nobody can watch is refused then, rather than discovered by a learner later',
			'YouTube plays through its no-cookie player',
			'Mark one lesson as a free preview and it plays on the course page, before anyone enrols'
		],
		related: ['courses-and-curriculum', 'live-classes', 'course-analytics']
	},
	{
		slug: 'drip-and-prerequisites',
		group: 'teaching',
		name: 'Drip & prerequisites',
		tagline: 'Release it when they are ready for it',
		icon: Clock01Icon,
		headline: 'Nobody learns lesson nine on day one.',
		blurb:
			'Release lessons on a schedule, one after another, or on a date — and require the courses that should come first.',
		today: [
			'Open a lesson a set number of days after the learner enrols, so a cohort moves together',
			'Or release lessons in sequence, each unlocking as the one before it is finished',
			'Or set a date, and the lesson opens on it',
			'Require one course to be finished before another can be started — and a loop is refused when you set it up, not discovered later',
			'A locked lesson says it is locked and when it opens, rather than simply vanishing'
		],
		related: ['courses-and-curriculum', 'learning-paths', 'course-analytics']
	},
	{
		slug: 'learning-paths',
		group: 'teaching',
		name: 'Learning paths',
		tagline: 'An ordered track through several courses',
		icon: Route02Icon,
		headline: 'A subject is usually more than one course.',
		blurb:
			'String courses into an ordered track, and show a learner how far along the whole thing they are.',
		today: [
			'An ordered track of courses, arranged the way the subject actually builds',
			'Progress across the whole path, not just the course someone is sitting in',
			'A learner sees what is next without being told'
		],
		related: ['course-bundles', 'drip-and-prerequisites', 'courses-and-curriculum']
	},
	{
		slug: 'course-bundles',
		group: 'teaching',
		name: 'Course bundles',
		tagline: 'Group courses and grant them together',
		icon: Package01Icon,
		headline: 'Sell the set, not the pieces.',
		blurb:
			'Group courses into a bundle and hand over the lot at once — one action enrols a learner in every course in it.',
		today: [
			'Group any courses into a named bundle',
			'Granting a bundle enrols the learner in every course inside it, in one step',
			'Price a bundle in taka like any other course'
		],
		related: ['learning-paths', 'payments', 'categories-and-tags']
	},
	{
		slug: 'categories-and-tags',
		group: 'teaching',
		name: 'Categories & tags',
		tagline: 'A catalogue people can actually search',
		icon: Tag01Icon,
		headline: 'Twenty courses need shelves. Two hundred need a system.',
		blurb: 'Sort the catalogue into categories and tag across them, so a learner finds the course.',
		today: [
			'Categories to file a course under, and tags that cut across them',
			'Browse and filter the catalogue by either',
			'Organise the whole catalogue from one screen rather than course by course'
		],
		related: ['courses-and-curriculum', 'course-bundles', 'learning-paths']
	},
	{
		slug: 'course-plan-builder',
		group: 'teaching',
		name: 'Course-plan builder',
		tagline: 'Sketch the course before you build it',
		icon: Structure01Icon,
		headline: 'Plan it on a canvas, not in your head.',
		blurb:
			'A free-form board for laying out a course before a single lesson is written — drag the pieces until the shape is right.',
		today: [
			'A blank canvas where you place and move the parts of a course freely',
			'Your layout is saved with the workspace, not on one person’s laptop',
			'A background image of your own behind the plan'
		],
		related: ['courses-and-curriculum', 'ai-assistance', 'certificate-designer']
	},
	{
		slug: 'ai-assistance',
		group: 'teaching',
		name: 'AI assistance',
		tagline: 'Start from a draft, not a blank page',
		icon: AiBrain01Icon,
		headline: 'The blank page is the hard part. Skip it.',
		blurb:
			'Ask for a course outline, a set of quiz questions, or a thumbnail, and edit what comes back. Everything it makes is a draft with your name on it.',
		today: [
			'Draft a course outline from a topic you name',
			'Draft quiz questions from a lesson you have already written',
			'Generate a thumbnail image for a course',
			'Every draft lands in the editor for you to change — nothing is saved or published until you say so',
			'Switched off unless your workspace is set up for it, and the button says so plainly rather than disappearing'
		],
		related: ['courses-and-curriculum', 'quizzes', 'course-plan-builder']
	},
	{
		slug: 'course-analytics',
		group: 'teaching',
		name: 'Course analytics',
		tagline: 'See where learners actually stop',
		icon: Analytics01Icon,
		headline: 'The lesson everyone quits on is worth knowing about.',
		blurb: 'Enrolments, progress, and completion per course, in one place instead of a guess.',
		today: [
			'Enrolments per course, split into active, completed, and gone quiet',
			'Average progress and a completion rate, rather than a feeling',
			'What learners rated the course, alongside how many finished it',
			'An institution-wide view too: today’s attendance, outstanding fees, and the size of the school'
		],
		related: ['courses-and-curriculum', 'marking-and-gradebook', 'leaderboard-and-badges']
	},

	// ── Assessment & certificates ────────────────────────────────────────────
	{
		slug: 'quizzes',
		group: 'assessment',
		name: 'Quizzes',
		tagline: '15 question types, marked the moment they submit',
		icon: Quiz01Icon,
		headline: 'Fifteen ways to ask. Thirteen mark themselves.',
		blurb:
			'From true-or-false to placing a pin on a diagram or plotting a graph — nearly all of them graded the instant a learner submits.',
		today: [
			'Fifteen question types: true or false, single choice, multiple choice, fill in the blanks, short answer, ordering, matching, a numeric range, image answering, image matching, a puzzle, a pin dropped on an image, a graph to plot, an essay, and a drawing',
			'Thirteen of the fifteen are marked automatically, the moment the learner presses submit',
			'Essays and drawings go to a person to mark — the two a machine has no business judging',
			'The answers never travel to the browser with the question, so a quiz cannot be read out of the page'
		],
		related: ['assignments', 'marking-and-gradebook', 'ai-assistance']
	},
	{
		slug: 'assignments',
		group: 'assessment',
		name: 'Assignments',
		tagline: 'Real work, handed in as a real file',
		icon: Task01Icon,
		headline: 'Some work is a file, not a multiple choice.',
		blurb: 'Set an assignment, take the upload, and mark it with a comment the learner can read.',
		today: [
			'Set an assignment on any course and take file uploads against it',
			'A submission arrives in a marking queue rather than an inbox',
			'Mark it with a score and written feedback',
			'The learner sees their mark and your comment on the assignment itself'
		],
		related: ['quizzes', 'marking-and-gradebook', 'certificates']
	},
	{
		slug: 'marking-and-gradebook',
		group: 'assessment',
		name: 'Marking & gradebook',
		tagline: 'Every mark, per learner, in one place',
		icon: TaskDone01Icon,
		headline: 'One place that knows how everybody is doing.',
		blurb:
			'A queue for the work waiting to be marked, and a gradebook that adds it all up against the scale you define.',
		today: [
			'A marking queue, so the work waiting on a human is a list rather than a memory',
			'Every quiz attempt and assignment, per learner, per course',
			'Define your own grading scale, band by band, instead of accepting somebody else’s',
			'A marker role that can mark and nothing else'
		],
		related: ['quizzes', 'assignments', 'roles-and-permissions']
	},
	{
		slug: 'certificates',
		group: 'assessment',
		name: 'Certificates',
		tagline: 'Issued on completion, checkable by anyone',
		icon: Certificate01Icon,
		headline: 'A certificate nobody can check is a picture.',
		blurb:
			'Issued the moment a learner earns it, with a serial an employer can verify without an account.',
		today: [
			'Issued automatically the moment a learner completes the course',
			'A serial number anyone can check — no login, no phone call to the office',
			'Revoke one that should not stand, and the check says so',
			'A learner keeps every certificate they have earned in one place'
		],
		related: ['certificate-designer', 'marking-and-gradebook', 'courses-and-curriculum']
	},
	{
		slug: 'certificate-designer',
		group: 'assessment',
		name: 'Certificate designer',
		tagline: 'Design the certificate on a canvas',
		icon: PaintBoardIcon,
		headline: 'Your seal, your signature, your layout.',
		blurb:
			'Place every element of the certificate exactly where you want it, over a background of your own.',
		today: [
			'Drag each piece of the certificate wherever it belongs — nothing is locked to a template',
			'Your own background image behind it',
			'The design is saved with the workspace and used for every certificate it issues'
		],
		related: ['certificates', 'id-card-designer', 'course-plan-builder']
	},

	// ── Community & live teaching ────────────────────────────────────────────
	{
		slug: 'forum',
		group: 'community',
		name: 'Forum & Q&A',
		tagline: 'Questions answered in the open',
		icon: Message02Icon,
		headline: 'Answer it once, where everyone can read it.',
		blurb:
			'A forum for the long conversations, and a question box on the lesson itself — so the fortieth learner to wonder does not have to ask.',
		today: [
			'Discussion spaces with threads and replies, either across the whole workspace or tied to one course',
			'A separate Q&A on the lesson itself, so a question is asked where it came up and answered in the open',
			'The community starts teaching itself as much as you do'
		],
		related: ['chat', 'notifications', 'live-classes']
	},
	{
		slug: 'chat',
		group: 'community',
		name: 'Chat',
		tagline: 'Course channels, direct messages, groups',
		icon: MessageMultiple01Icon,
		headline: 'The quick question does not belong in a forum thread.',
		blurb:
			'A channel per course, direct messages between two people, and group chats — arriving live, without a refresh.',
		today: [
			'A chat channel for each course',
			'Direct messages between any two people in the workspace',
			'Group chats for a batch, a staffroom, or a project',
			'Messages appear as they are sent — nobody presses refresh'
		],
		related: ['forum', 'notifications', 'live-classes']
	},
	{
		slug: 'live-classes',
		group: 'community',
		name: 'Live classes',
		tagline: 'Your own Meet or Zoom link, on the schedule',
		icon: LiveStreaming01Icon,
		headline: 'Keep the tool you already teach on.',
		blurb:
			'Schedule a live session against a course and paste your own Meet or Zoom link. Learners find it where the rest of the course is.',
		today: [
			'Schedule a live session on any course, with a date and time',
			'Bring your own link — Meet, Zoom, or anything else you already pay for',
			'Learners see what is coming next to their lessons, not in a separate email',
			'Nothing new to install, and no video minutes to buy from us'
		],
		related: ['chat', 'timetable', 'academic-calendar']
	},
	{
		slug: 'leaderboard-and-badges',
		group: 'community',
		name: 'Leaderboard & badges',
		tagline: 'A reason to come back tomorrow',
		icon: Award01Icon,
		headline: 'Progress is more fun when it shows.',
		blurb:
			'Points for the work learners do, badges for the milestones, and a board that ranks them.',
		today: [
			'Points earned for the work a learner actually completes',
			'Badges for reaching a milestone worth marking',
			'A leaderboard across the workspace'
		],
		related: ['course-analytics', 'notifications', 'certificates']
	},
	{
		slug: 'notifications',
		group: 'community',
		name: 'Notifications',
		tagline: 'Told once, in the app and by email',
		icon: Notification01Icon,
		headline: 'News should not depend on who happened to log in.',
		blurb: 'The things worth knowing reach people where they are — in the app, and in their inbox.',
		today: [
			'In-app notifications for the things that concern a person',
			'Announcements that reach every member at once',
			'Email delivery, so nothing waits for the next login'
		],
		related: ['chat', 'guardian-notices', 'email-automations']
	},

	// ── The academic office ──────────────────────────────────────────────────
	{
		slug: 'admissions',
		group: 'academic',
		name: 'Admissions',
		tagline: 'Application to enrolled student, in one step',
		icon: UserAdd01Icon,
		headline: 'Admissions should not live in a WhatsApp thread.',
		blurb:
			'Take applications properly, and when you admit one, the student and their guardian exist — no retyping.',
		today: [
			'Applications arrive in one list instead of a phone, an inbox, and a notebook',
			'Admitting an applicant creates the student and the guardian in the same step',
			'Nothing is typed twice, so nothing is typed differently the second time'
		],
		related: ['students', 'classes-and-sections', 'parent-portal']
	},
	{
		slug: 'students',
		group: 'academic',
		name: 'Students',
		tagline: 'The roll, and who belongs to whom',
		icon: UserMultipleIcon,
		headline: 'One record per student, and it is the real one.',
		blurb: 'Every student in the institution, the class they are in, and the guardian behind them.',
		today: [
			'A record per student, linked to their class and section',
			'Guardians attached to the students who are actually theirs',
			'The roll the register, the exam, and the fee invoice all read from'
		],
		related: ['admissions', 'classes-and-sections', 'attendance']
	},
	{
		slug: 'classes-and-sections',
		group: 'academic',
		name: 'Classes & sections',
		tagline: 'Classes, sections, and the subjects taught in them',
		icon: School01Icon,
		headline: 'The shape of the school, written down once.',
		blurb:
			'Classes divided into sections, with the subjects each one is taught — named the way your institution names them, not the way an American school would.',
		today: [
			'Classes, and the sections inside them',
			'You name the levels yourself and set their order: Class 1 to Class 10 for a school, or Ebtedayee, Dakhil, Alim, Fazil and Kamil for a madrasa',
			'Subjects assigned to the classes that take them',
			'Move a whole class up at the end of the year, or graduate them, in one step',
			'Set it up once and the register, the timetable, and the report card all read from it'
		],
		related: ['students', 'academic-years', 'timetable']
	},
	{
		slug: 'academic-years',
		group: 'academic',
		name: 'Academic years & terms',
		tagline: 'The year, and the terms inside it',
		icon: CalendarSetting01Icon,
		headline: 'A school year is a container. Everything sits in one.',
		blurb:
			'Define the year and its terms, so results and records belong to a period rather than a pile.',
		today: [
			'Academic years, each divided into your own terms',
			'Exams and results belong to a term, so last year stays last year',
			'Roll into a new year without losing the old one'
		],
		related: ['classes-and-sections', 'exams-and-report-cards', 'academic-calendar']
	},
	{
		slug: 'attendance',
		group: 'academic',
		name: 'Attendance',
		tagline: 'The register, class by class, day by day',
		icon: ClipboardIcon,
		headline: 'The register, without the register book.',
		blurb: 'Mark a class present in a few taps, and have the record still be there in March.',
		today: [
			'Take the register for a class on a date, in one screen',
			'A day-by-day record per student that does not depend on a book surviving the year',
			'Guardians can see their own child’s attendance, and only their own child’s'
		],
		related: ['students', 'classes-and-sections', 'parent-portal']
	},
	{
		slug: 'exams-and-report-cards',
		group: 'academic',
		name: 'Exams & report cards',
		tagline: 'GPA 5.0 out of the box, or a scale you band yourself',
		icon: CheckmarkBadge01Icon,
		headline: 'Results, on the scale your board actually uses.',
		blurb:
			'Set exams, enter marks, and let them roll up into a report card on the GPA 5.0 scale — the Bangladesh default, out of the box.',
		today: [
			'Exams per term, with marks entered against the students who sat them',
			'GPA 5.0 is the scale a new workspace starts with — A+ down to F, already banded',
			'Or build your own scale band by band, if your institution grades another way',
			'Marks roll up into a report card you can hand to a family'
		],
		related: ['academic-years', 'marking-and-gradebook', 'parent-portal']
	},
	{
		slug: 'hifz',
		group: 'academic',
		name: 'Hifz tracking',
		tagline: 'Quran memorisation, sura by sura',
		icon: Quran01Icon,
		headline: 'Memorisation is a record, not a recollection.',
		blurb:
			'Track what each student has memorised and revised, so progress survives a change of teacher.',
		today: [
			'A record of what a student has memorised and where they are up to',
			'Progress that belongs to the institution rather than one teacher’s memory',
			'Guardians can follow their own child’s hifz from the portal'
		],
		related: ['students', 'parent-portal', 'exams-and-report-cards']
	},
	{
		slug: 'timetable',
		group: 'academic',
		name: 'Timetable',
		tagline: 'Who teaches what, when, and where',
		icon: Time04Icon,
		headline: 'One timetable everybody is reading from.',
		blurb: 'The week laid out per class, so nobody is teaching from a photocopy of a photocopy.',
		today: [
			'A timetable per class, across the week',
			'Subjects and staff against the periods they belong to',
			'One version, and it is the current one'
		],
		related: ['classes-and-sections', 'staff', 'academic-calendar']
	},
	{
		slug: 'academic-calendar',
		group: 'academic',
		name: 'Academic calendar',
		tagline: 'Terms, holidays, and exam weeks',
		icon: Calendar03Icon,
		headline: 'The year, where everyone can see it.',
		blurb: 'Holidays, exam weeks, and events on one calendar instead of a notice nobody kept.',
		today: [
			'Events, holidays, and exam periods on one calendar',
			'The whole institution reads the same dates',
			'No more asking the office when the term ends'
		],
		related: ['academic-years', 'timetable', 'guardian-notices']
	},

	// ── Money & operations ───────────────────────────────────────────────────
	{
		slug: 'fees',
		group: 'operations',
		name: 'Fees & invoices',
		tagline: 'Invoice, collect, and know who has paid',
		icon: Invoice01Icon,
		headline: 'Who has paid, without opening three books.',
		blurb:
			'Invoice students, take the money through your own bKash or SSLCommerz account, and see what is outstanding.',
		today: [
			'Invoices raised against the students who owe them',
			'Every amount in taka, to the poisha — never a rounded-off float',
			'What is paid and what is outstanding, in one list',
			'Guardians can see their own child’s fees in the portal'
		],
		related: ['payments', 'ledger', 'parent-portal']
	},
	{
		slug: 'payments',
		group: 'operations',
		name: 'Payments',
		tagline: 'bKash and SSLCommerz — and you are the merchant',
		icon: Store01Icon,
		headline: 'You collect the money. We never hold it.',
		blurb:
			'The learner pays your own bKash or SSLCommerz account, so your school is the merchant and the money is yours from the moment it moves. Stripe is there for learners paying from abroad.',
		today: [
			'bKash and SSLCommerz through your own merchant account',
			'Stripe for international learners',
			'Your school is the merchant of record — it owns its money, its refunds, and its disputes',
			'Price a course in taka, or leave it free by giving it no price at all',
			'Refund from the workspace, and the enrolment goes back with the money'
		],
		related: ['fees', 'ledger', 'course-bundles']
	},
	{
		slug: 'staff',
		group: 'operations',
		name: 'Staff',
		tagline: 'The people who work there',
		icon: Briefcase01Icon,
		headline: 'The staffroom, on the record.',
		blurb: 'A record for every member of staff, and the timetable and payroll that read from it.',
		today: [
			'A record per member of staff',
			'The same list the timetable and the payroll draw on',
			'Staff change without anything else needing to be rewritten'
		],
		related: ['payroll', 'timetable', 'roles-and-permissions']
	},
	{
		slug: 'payroll',
		group: 'operations',
		name: 'Payroll',
		tagline: 'Salaries, on the record',
		icon: Wallet01Icon,
		headline: 'Salaries, in the same system as everything else.',
		blurb: 'Run staff pay where the staff records already are, in taka, with a trail behind it.',
		today: [
			'Salaries recorded against the staff they belong to',
			'Amounts in taka, to the poisha',
			'It feeds the same ledger the rest of the money does'
		],
		related: ['staff', 'ledger', 'fees']
	},
	{
		slug: 'ledger',
		group: 'operations',
		name: 'Income & expense ledger',
		tagline: 'Every taka in, every taka out',
		icon: Money04Icon,
		headline: 'What came in, what went out, and nothing in between.',
		blurb:
			'One ledger for the institution’s money, so the answer is a screen rather than an afternoon.',
		today: [
			'Income and expenses recorded in one place',
			'Every amount in taka, to the poisha',
			'The money question answered without reconciling three books'
		],
		related: ['fees', 'payroll', 'payments']
	},
	{
		slug: 'library',
		group: 'operations',
		name: 'Library',
		tagline: 'Books, and who has them',
		icon: Book04Icon,
		headline: 'The book is either on the shelf or with a name.',
		blurb: 'A catalogue of what the library holds, and a record of what is out and with whom.',
		today: [
			'A catalogue of the books the institution holds',
			'Issue a book to a student and know it is with them',
			'The overdue question, answered from a screen'
		],
		related: ['students', 'transport', 'hostel']
	},
	{
		slug: 'transport',
		group: 'operations',
		name: 'Transport',
		tagline: 'Routes, and who rides them',
		icon: Bus01Icon,
		headline: 'Which bus, and who is on it.',
		blurb:
			'Routes and the students assigned to them, on the record rather than in the driver’s head.',
		today: [
			'Routes for the institution’s transport',
			'Students assigned to the route they actually take',
			'A guardian’s question answered without a phone call'
		],
		related: ['students', 'library', 'hostel']
	},
	{
		slug: 'hostel',
		group: 'operations',
		name: 'Hostel',
		tagline: 'Rooms, and who sleeps in them',
		icon: Home01Icon,
		headline: 'Every bed accounted for.',
		blurb:
			'Rooms and the students allocated to them — the residential half of the institution, recorded.',
		today: [
			'Rooms, and the students allocated to each',
			'Who is resident, and where',
			'The record the office needs when a guardian rings'
		],
		related: ['students', 'transport', 'library']
	},

	// ── Families & communication ─────────────────────────────────────────────
	{
		slug: 'parent-portal',
		group: 'families',
		name: 'Parent & pupil portal',
		tagline: 'A guardian sees their own child. Only their own.',
		icon: UserSharingIcon,
		headline: 'Answer the question before it is asked.',
		blurb:
			'Guardians and students read their own attendance, fees, and hifz — checked twice, so one family can never read another’s.',
		today: [
			'A guardian reads their own child’s attendance, fees, and hifz',
			'Checked twice — by permission, and by whether the child is actually theirs',
			'One family can never see another family’s record',
			'Fewer calls to the office for things the office already knows'
		],
		related: ['guardian-notices', 'attendance', 'fees']
	},
	{
		slug: 'guardian-notices',
		group: 'families',
		name: 'Guardian notices',
		tagline: 'By email, by SMS, or both',
		icon: Megaphone01Icon,
		headline: 'Reach the guardian on the thing they actually carry.',
		blurb:
			'Send a notice to guardians by email, by SMS, or both — because not every parent reads email.',
		today: [
			'Notices to guardians by email',
			'Notices by SMS, for the guardians email never reaches',
			'Or both at once, when it matters enough',
			'Sent once, delivered to everyone it concerns'
		],
		related: ['parent-portal', 'notifications', 'email-automations']
	},
	{
		slug: 'email-automations',
		group: 'families',
		name: 'Email automations',
		tagline: 'When this happens, send that',
		icon: Mail01Icon,
		headline: 'The welcome email nobody has to remember to send.',
		blurb:
			'Say what should happen when a learner enrols or finishes a course, and it happens — every time, without anyone doing it.',
		today: [
			'A rule you write once: when a learner enrols, send them this email',
			'The same for when a learner finishes the course — the congratulations nobody has to remember',
			'Write the learner’s name and the course title into the email and they are filled in for you',
			'It runs whether or not anybody is watching, and the four-hundredth learner gets what the fourth got'
		],
		related: ['notifications', 'guardian-notices', 'courses-and-curriculum']
	},
	{
		slug: 'id-card-designer',
		group: 'families',
		name: 'ID card designer',
		tagline: 'Design the card, then print the school',
		icon: IdIcon,
		headline: 'One design, every student.',
		blurb: 'Lay out a student ID card exactly as you want it, over a background of your own.',
		today: [
			'Place every element of the card freely — no fixed template',
			'Your own background behind the design',
			'The layout is saved with the workspace and reused for every card'
		],
		related: ['certificate-designer', 'students', 'admissions']
	},

	// ── The platform ─────────────────────────────────────────────────────────
	{
		slug: 'workspaces',
		group: 'platform',
		name: 'Your own workspace',
		tagline: 'Your school’s data is nobody else’s',
		icon: ServerStack01Icon,
		headline: 'Your data is separated, not filtered.',
		blurb:
			'Every institution gets its own workspace, kept apart in the database itself — not by a rule somebody has to remember to write.',
		today: [
			'Each school, college, madrasa, or coaching centre is its own workspace',
			'The separation is enforced by the database, underneath the software — not by a filter someone could forget',
			'One institution can never read another’s students, fees, or results',
			'Your own web address pointing at your own workspace'
		],
		related: ['roles-and-permissions', 'audit-trail', 'payments']
	},
	{
		slug: 'roles-and-permissions',
		group: 'platform',
		name: 'Roles & permissions',
		tagline: 'Everyone sees their own job, and no more',
		icon: Shield01Icon,
		headline: 'A marker should not be able to delete a course.',
		blurb:
			'Owners, instructors, markers, students, and guardians — each given what their job needs and nothing beyond it.',
		today: [
			'Roles for owners, instructors, markers, students, and guardians',
			'Each role is given the least it needs to do the work',
			'Joining is by invitation — nobody adds themselves to your school',
			'Invite, promote, and remove people as staff and cohorts change'
		],
		related: ['workspaces', 'audit-trail', 'staff']
	},
	{
		slug: 'audit-trail',
		group: 'platform',
		name: 'Audit trail',
		tagline: 'Who did what, and when',
		icon: SecurityCheckIcon,
		headline: 'Every consequential action leaves a mark.',
		blurb:
			'A record of what was done and by whom, written at the same moment as the thing it describes.',
		today: [
			'A record of the actions that matter, and who took them',
			'Written together with the change itself, so the two can never disagree',
			'Failed sign-in attempts are recorded too — the ones worth knowing about'
		],
		related: ['roles-and-permissions', 'workspaces', 'payments']
	},
	{
		slug: 'money-in-taka',
		group: 'platform',
		name: 'Money in taka',
		tagline: 'Taka to the poisha, with lakh grouping',
		icon: FileValidationIcon,
		headline: 'Money that adds up, in the currency you use.',
		blurb:
			'Every amount is kept in whole poisha, never a rounded-off decimal — and shown in taka the way Bangladesh writes it.',
		today: [
			'Taka by default, shown with lakh and crore grouping',
			'Amounts stored exactly, to the poisha — a fee cannot drift by a paisa',
			'A workspace outside Bangladesh can price in its own currency instead'
		],
		related: ['payments', 'fees', 'ledger']
	}
];

export function featureBySlug(slug: string): Feature | undefined {
	return FEATURES.find((f) => f.slug === slug);
}

export function featuresIn(group: GroupKey): Feature[] {
	return FEATURES.filter((f) => f.group === group);
}
