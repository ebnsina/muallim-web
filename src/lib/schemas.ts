import { z } from 'zod';

/*
	Every form's rules, once — read by the page and by the action. The bounds are
	muallim-api's own (`bin/openapi.json`); a number invented here that the server
	does not share is a form that accepts what the API will refuse.
*/

/** The HTML constraints, as attributes. Spread them onto the control. */
export const LIMITS = {
	name: { required: true, maxlength: 120 },
	password: { required: true, minlength: 12, maxlength: 1000 },
	courseTitle: { required: true, maxlength: 200 },
	courseSummary: { maxlength: 500 },
	courseSlug: { maxlength: 200 },
	sectionTitle: { required: true, maxlength: 300 },
	lessonTitle: { required: true, maxlength: 300 },
	lessonContent: { maxlength: 200000 },
	videoUrl: { maxlength: 2000 },
	durationSeconds: { type: 'number', min: 0, max: 86400, step: 1 },
	dripDays: { type: 'number', min: 0, max: 3650, step: 1 },
	releaseDate: { type: 'datetime-local' },
	prerequisite: { required: true },
	announcementTitle: { required: true, maxlength: 200 },
	announcementBody: { required: true, maxlength: 5000 },
	quizTitle: { required: true, maxlength: 200 },
	quizDescription: { maxlength: 2000 },
	passingPercent: { type: 'number', min: 0, max: 100, step: 1 },
	timeLimit: { type: 'number', min: 0, step: 1 },
	maxAttempts: { type: 'number', min: 0, step: 1 },
	questionPrompt: { required: true, maxlength: 4000 },
	questionPoints: { type: 'number', min: 0, max: 1000, step: 1 },
	questionExplanation: { maxlength: 4000 },
	assignmentTitle: { required: true, maxlength: 200 },
	assignmentInstructions: { maxlength: 8000 },
	assignmentPoints: { required: true, type: 'number', min: 0, max: 1000, step: 1 },
	assignmentFiles: { required: true, type: 'number', min: 1, max: 20, step: 1 },
	deadline: { type: 'datetime-local' },
	boardTitle: { required: true, maxlength: 200 },
	boardDescription: { maxlength: 20000 },
	threadTitle: { required: true, maxlength: 200 },
	threadBody: { required: true, maxlength: 20000 },
	reply: { required: true, maxlength: 20000 },
	scaleName: { required: true, maxlength: 100 },
	templateName: { required: true, maxlength: 100 },
	templateHeading: { required: true, maxlength: 200 },
	templateBody: { required: true, maxlength: 4000 },
	templateSignatory: { maxlength: 200 },
	reviewBody: { maxlength: 4000 },

	// The gateway's own keys. `public_id` is the API's 200; every secret part is kept
	// well under its 4000, because bKash's three are packed into that one field.
	gatewayPublicId: { required: true, maxlength: 200 },
	gatewaySecret: { required: true, maxlength: 500 },

	inviteEmail: { required: true, type: 'email', maxlength: 320 },
	memberRole: { required: true },
	certificateSerial: { required: true, minlength: 4, maxlength: 64 },
	revokeReason: { required: true, maxlength: 500 }
} as const;

// `.trim()` before `.min(1)`: the browser's `required` asks whether a character was
// typed, and a space is a character.
const text = (max: number, missing: string) =>
	z.string().trim().min(1, missing).max(max, `That is longer than ${max} characters.`);

const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `That is longer than ${max} characters.`)
		.optional()
		.transform((value) => value ?? '');

/** A whole number in a range. FormData is strings, so it coerces. */
const wholeNumber = (min: number, max: number, message: string) =>
	z.coerce.number({ error: message }).int(message).min(min, message).max(max, message);

/** A whole number with a floor and no ceiling — the API sets none either. */
const wholeAtLeast = (min: number, message: string) =>
	z.coerce.number({ error: message }).int(message).min(min, message);

// Blank means "leave it alone", so an empty box is not a zero and not a date.
const blankIsAbsent = (value: unknown) => (value === '' ? undefined : value);

const optionalWholeNumber = (min: number, max: number, message: string) =>
	z.preprocess(blankIsAbsent, wholeNumber(min, max, message).optional());

/** What a `datetime-local` produces: blank, or something `Date` can read. */
const optionalDateTime = (message: string) =>
	z.preprocess(
		blankIsAbsent,
		z
			.string()
			.refine((value) => !Number.isNaN(Date.parse(value)), message)
			.optional()
	);

// ----------------------------------------------------------------- courses

export const newCourseSchema = z.object({
	title: text(200, 'Give the course a title.'),
	summary: optionalText(500),

	// Blank is legal: the action derives it from the title.
	slug: optionalText(200)
});

export const sectionSchema = z.object({
	title: text(300, 'Give the section a title.')
});

/** Renaming asks for the same thing in the past tense: the section already exists. */
export const renameSectionSchema = z.object({
	title: text(300, 'A section needs a title.')
});

export const lessonSchema = z.object({
	title: text(300, 'Give the lesson a title.')
});

/** The whole lesson editor. The drip fields are absent in the modes that ignore them. */
export const lessonEditSchema = z.object({
	title: text(300, 'A lesson needs a title.'),
	content: optionalText(200000),
	video_url: optionalText(2000),
	duration_seconds: wholeNumber(0, 86400, 'Duration must be a whole number of seconds.'),
	available_after_days: optionalWholeNumber(
		0,
		3650,
		'Days after enrolling must be a whole number, zero or more.'
	),
	available_at: optionalDateTime('That release date is not a date.')
});

export const announcementSchema = z.object({
	title: text(200, 'Give the announcement a title.'),
	body: text(5000, 'An announcement needs something to say.')
});

export const prerequisiteSchema = z.object({
	requires_slug: text(200, 'Choose a course to require.')
});

// ------------------------------------------------------------------ assess

export const quizTitleSchema = z.object({
	title: text(200, 'A quiz needs a title.')
});

export const quizSettingsSchema = z.object({
	title: text(200, 'A quiz needs a title.'),
	description: optionalText(2000),
	passing_percent: wholeNumber(0, 100, 'The passing grade is a percentage, 0 to 100.'),
	time_limit_seconds: wholeAtLeast(0, 'The time limit is a whole number of seconds, zero or more.'),
	max_attempts: wholeAtLeast(0, 'Attempts must be a whole number, zero or more.')
});

/*
	Only what a form can decide. Whether an option is correct, whether an ordering
	question may have one — that is muallim-api's, because it is the only thing that
	grades. Two sources of truth about a quiz would be one too many.
*/
export const questionSchema = z.object({
	prompt: text(4000, 'A question needs a prompt.'),

	// Blank means the 1 the form shows, not zero points.
	points: z.preprocess(
		(value) => (value === '' ? 1 : value),
		wholeNumber(0, 1000, 'Points must be a whole number, zero or more.')
	),
	explanation: optionalText(4000)
});

export const assignmentSchema = z.object({
	title: text(200, 'Give the assignment a title.'),
	instructions: optionalText(8000),
	points: wholeNumber(0, 1000, 'Points are a whole number from 0 to 1000.'),
	passing_points: wholeNumber(0, 1000, 'The pass mark is a whole number from 0 to 1000.'),
	max_files: wholeNumber(1, 20, 'A learner may hand in between 1 and 20 files.'),
	max_bytes: wholeNumber(1, 1_073_741_824, 'Choose a size for the largest file.'),

	// Blank clears the deadline, which is a thing an author means.
	due_at: optionalDateTime('That deadline is not a date.')
});

// ------------------------------------------------------------------- forum

export const boardSchema = z.object({
	title: text(200, 'Give the board a title.'),
	description: optionalText(20000),

	// Blank is legal: a board with no course is the workspace's own.
	course_slug: optionalText(200)
});

export const threadSchema = z.object({
	title: text(200, 'Give the thread a title.'),
	body: text(20000, 'Write something to start the thread.')
});

export const replySchema = z.object({
	body: text(20000, 'Write a reply first.')
});

// ------------------------------------------------------------------ grades

export const scaleNameSchema = z.object({
	name: text(100, 'Give the scale a name.')
});

// A scale's bands are checked by `scale-editor.ts` — they are rules about each other,
// not about one field, so they are not a schema's job.

export const certificateTemplateSchema = z.object({
	name: text(100, 'Give the template a name.'),
	title: text(200, 'A certificate needs a heading.'),
	body: text(4000, 'A certificate needs something to say.'),
	signatory: optionalText(200)
});

/** A mark, bounded by the assignment's own maximum — so the max is a parameter. */
// `z.coerce.number()` reads '' as 0, and 0 is a grade — so a blank box would mark a
// zero. It is refused first, and the max is the assignment's own.
export const gradeSchema = (maxPoints: number) =>
	z.object({
		points: z.preprocess(
			blankIsAbsent,
			wholeNumber(0, maxPoints, `A grade is a whole number from 0 to ${maxPoints}.`)
		),
		feedback: optionalText(8000)
	});

/** One question's award, when a marker is grading an attempt by hand. */
export const awardSchema = (maxPoints: number) =>
	z.object({
		points: z.preprocess(
			blankIsAbsent,
			wholeNumber(0, maxPoints, 'The award must be a whole number of points, zero or more.')
		)
	});

/*
	A course's preview. Source and URL travel together — the API refuses one without
	the other — and `none` needs no URL, so the refinement asks for one only when
	somebody is actually serving the clip.
*/
export const previewSchema = z
	.object({
		preview_source: z.enum(['none', 'youtube', 'vimeo', 'embed', 'hosted']),
		preview_url: optionalText(2000)
	})
	.refine((v) => v.preview_source === 'none' || v.preview_url !== '', {
		path: ['preview_url'],
		message: 'Paste the link to the preview.'
	});

/*
	A course's price, as an author types it: major units, because nobody prices a
	course at 120000 paisa. The action multiplies; the API is told minor units.
*/
export const priceSchema = z.object({
	amount: z.coerce
		.number({ error: 'A price is a number.' })
		.positive('A price is more than nothing.')
		.max(1_000_000, 'That is more than this system will sell a course for.'),
	currency: z.string().trim().length(3, 'A currency is three letters, like BDT or USD.')
});

// ------------------------------------------------------- gateway credentials

/** SSLCommerz: a store id and a store password. Both go straight to the API. */
export const sslcommerzSchema = z.object({
	public_id: text(200, 'The store id is missing.'),
	secret: text(500, 'The store password is missing.')
});

/*
	bKash: an app key, and three secrets the web packs into one JSON string.

	The API's `secret` is a single write-only field; the driver reads an object out of
	it. Three inputs here, one field on the wire — see `packBkashSecret`.
*/
export const bkashSchema = z.object({
	public_id: text(200, 'The app key is missing.'),
	app_secret: text(500, 'The app secret is missing.'),
	username: text(500, 'The username is missing.'),
	password: text(500, 'The password is missing.')
});

// --------------------------------------------------------------------- Q&A

export const questionAskSchema = z.object({
	body: text(5000, 'Write your question first.')
});

export const answerSchema = z.object({
	body: text(5000, 'Write your answer first.')
});

// ------------------------------------------------------------------ review

export const reviewSchema = z.object({
	rating: wholeNumber(1, 5, 'Choose a rating from 1 to 5 stars.'),
	body: optionalText(4000)
});

// ------------------------------------------------------------------ people

/** The roles muallim-api knows. An unknown one is refused here as it is there. */
export const ROLES = ['owner', 'admin', 'instructor', 'student'] as const;
export type Role = (typeof ROLES)[number];

const role = z.enum(ROLES, { error: 'Choose a role.' });

export const invitationSchema = z.object({
	email: z.email('Enter a valid email address.').max(320, 'That is longer than 320 characters.'),
	role
});

export const memberRoleSchema = z.object({ role });

/** Your own name. Trimmed here as the API trims it there. */
export const renameSchema = z.object({
	name: text(120, 'A name cannot be empty.')
});

/*
	Your own password.

	The current one is asked for because the API asks for it: a token alone cannot
	set a new password, or a stolen session would be a lost account. The new one is
	confirmed here and not there — the API has no second field to compare, and a
	typo in a password nobody can see is a lockout.
*/
export const changePasswordSchema = z
	.object({
		current_password: text(1000, 'Your current password is missing.'),
		new_password: z
			.string()
			.min(12, 'A password must be at least 12 characters.')
			.max(1000, 'That is longer than 1000 characters.'),
		confirm_password: z.string()
	})
	.refine((v) => v.new_password === v.confirm_password, {
		path: ['confirm_password'],
		message: 'The two passwords do not match.'
	});

// ------------------------------------------------------- certificate revocation

/** The number a certificate carries. muallim-api takes 4 to 64 characters. */
export const certificateLookupSchema = z.object({
	serial: text(64, 'Enter the certificate number.').min(
		4,
		'A certificate number is at least 4 characters.'
	)
});

export const revokeCertificateSchema = certificateLookupSchema.extend({
	reason: text(500, 'Say why the certificate is being withdrawn.')
});
