import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { OWNER, STUDENT, STUDENT_STATE } from './accounts';
import { publishedCourse } from './course';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

/**
 * A single-lesson course the student finishes, which issues a certificate.
 *
 * `publishedCourse` builds a two-lesson course; finishing both is what completes
 * it. The certificate is written by the transaction that completes the course —
 * there is no other way to make one, which is the point.
 */
async function earnCertificate(request: APIRequestContext, courseSlug: string) {
	const course = await publishedCourse(request, courseSlug);

	const login = await request.post('/api/v1/auth/login', {
		data: { email: STUDENT.email, password: STUDENT.password }
	});
	const token = (await login.json()).tokens.access_token as string;
	const auth = { Authorization: `Bearer ${token}` };

	await request.post(`/api/v1/courses/${course.slug}/enrol`, { headers: auth });
	for (const lessonId of [course.previewLessonId, course.gatedLessonId]) {
		await request.post(`/api/v1/lessons/${lessonId}/complete`, {
			headers: auth,
			data: { complete: true }
		});
	}

	const mine = await request.get('/api/v1/me/certificates', { headers: auth });
	const list = (await mine.json()).certificates as { serial: string; course_title: string }[];
	const earned = list.find((c) => c.course_title === course.title);
	if (!earned) throw new Error('finishing the course issued no certificate');
	return { course, serial: earned.serial };
}

test.describe('a learner who finishes a course', () => {
	test.use({ storageState: STUDENT_STATE });

	test('earns a certificate and can open it', async ({ page, request }) => {
		const { course, serial } = await earnCertificate(request, slug('earn'));

		await page.goto('/certificates');
		await expect(page.getByText(course.title)).toBeVisible();
		await expect(page.getByText(serial)).toBeVisible();

		await page.getByRole('link', { name: course.title }).click();
		await expect(page).toHaveURL(`/certificates/${serial}`);

		// The certificate names the learner and the course, and carries its number.
		const sheet = page.getByRole('article');
		await expect(sheet).toContainText(STUDENT.name);
		await expect(sheet).toContainText(course.title);
		await expect(sheet).toContainText(serial);
	});
});

test.describe('verifying a certificate', () => {
	// No session at all. This is the employer, the admissions office, the stranger.
	test.use({ storageState: { cookies: [], origins: [] } });

	test('anybody can read it by its number, without signing in', async ({ page, request }) => {
		const { course, serial } = await earnCertificate(request, slug('verify'));

		await page.goto(`/verify/${serial}`);

		const sheet = page.getByRole('article');
		await expect(sheet).toContainText(STUDENT.name);
		await expect(sheet).toContainText(course.title);
		await expect(page.getByText('valid')).toBeVisible();

		// There is a way in, but no signed-in header: nobody is signed in.
		await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);
	});

	test('a number nobody issued is not found', async ({ page }) => {
		const response = await page.goto('/verify/CERT-0000-0000-0000-0000');
		expect(response?.status()).toBe(404);
	});

	/**
	 * A revoked certificate still answers, and says it was withdrawn.
	 *
	 * A code that stopped resolving is indistinguishable from one that was never
	 * real, which is the answer a forger wants. So the page keeps working and tells
	 * the truth instead.
	 */
	test('a withdrawn certificate still resolves, and says so', async ({ page, request }) => {
		const { serial } = await earnCertificate(request, slug('revoke'));

		// Revoke it as the owner, through the API.
		const login = await request.post('/api/v1/auth/login', {
			data: { email: OWNER.email, password: OWNER.password }
		});
		const token = (await login.json()).tokens.access_token as string;
		const revoked = await request.post(`/api/v1/certificates/${serial}/revoke`, {
			headers: { Authorization: `Bearer ${token}` },
			data: { reason: 'Issued in error.' }
		});
		expect(revoked.ok()).toBe(true);

		await page.goto(`/verify/${serial}`);
		await expect(page.getByText('has been withdrawn')).toBeVisible();
		await expect(page.getByText('Issued in error.')).toBeVisible();
	});
});
