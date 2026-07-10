import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { OWNER, OWNER_STATE } from './accounts';
import { publishedCourse } from './course';
import { ready } from './hydration';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

const name = (base: string) => `${base} ${randomUUID().slice(0, 6)}`;

test.describe('grading scales', () => {
	test.use({ storageState: OWNER_STATE });

	test('an author creates one and it appears in the list', async ({ page }) => {
		await page.goto('/teach/grading');
		await ready(page);

		// The built-in default is there, marked, and has no Remove button.
		await expect(page.getByText('Built in').first()).toBeVisible();

		const scaleName = name('Pass or fail');
		await page.getByLabel('Name').fill(scaleName);
		// The form starts as pass/fail — the smallest valid scale — so it is ready to save.
		await page.getByRole('button', { name: 'Create scale' }).click();

		await expect(page.getByText(`Saved “${scaleName}”.`)).toBeVisible();
		await expect(page.getByText(scaleName, { exact: true })).toBeVisible();
	});

	/**
	 * The client refuses a scale that cannot grade, before it is sent.
	 *
	 * `internal/grade` refuses it too — the button being disabled is a courtesy, not
	 * the control — but an author should see the problem in place, not read a 422.
	 */
	test('will not save a scale with no pass band', async ({ page }) => {
		await page.goto('/teach/grading');
		await ready(page);

		await page.getByLabel('Name').fill(name('Cruel'));
		// Uncheck the only pass band.
		await page.getByRole('checkbox').first().uncheck();

		await expect(page.getByText('Mark at least one band as a pass.')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Create scale' })).toBeDisabled();
	});
});

test.describe('certificate templates', () => {
	test.use({ storageState: OWNER_STATE });

	test('an author writes one and the preview renders their words', async ({ page }) => {
		await page.goto('/teach/certificates');
		await ready(page);

		// The preview substitutes the placeholders against the sample learner.
		const preview = page.getByRole('article');
		await expect(preview).toContainText('Ada Lovelace');

		// Editing the heading updates the preview live.
		await page.getByLabel('Heading').fill('Diploma of Distinction');
		await expect(preview.getByRole('heading', { name: 'Diploma of Distinction' })).toBeVisible();

		const templateName = name('Formal');
		await page.getByLabel('Name').fill(templateName);
		await page.getByRole('button', { name: 'Create template' }).click();

		await expect(page.getByText(`Saved “${templateName}”.`)).toBeVisible();
		await expect(page.getByText(templateName, { exact: true })).toBeVisible();
	});

	// A course can be pointed at a template, from its own settings.
	test('a course can be pointed at a template', async ({ page, request }) => {
		const templateName = name('Course template');

		// Make a template first.
		await page.goto('/teach/certificates');
		await ready(page);
		await page.getByLabel('Name').fill(templateName);
		await page.getByRole('button', { name: 'Create template' }).click();
		await expect(page.getByText(`Saved “${templateName}”.`)).toBeVisible();

		const course = await publishedCourse(request, slug('cert'));
		await page.goto(`/teach/${course.slug}`);
		await ready(page);

		await page.getByLabel('Certificate template').selectOption({ label: templateName });
		await page.getByRole('button', { name: 'Apply' }).click();
		await expect(page.getByText('Certificate template updated.')).toBeVisible();

		// The course now carries the template. Read it from the API — the authoritative
		// record, which no navigation can race with — and confirm its id is the one
		// just created.
		const login = await request.post('/api/v1/auth/login', {
			data: { email: OWNER.email, password: OWNER.password }
		});
		const token = (await login.json()).tokens.access_token as string;

		const templates = await request.get('/api/v1/certificate-templates', {
			headers: { Authorization: `Bearer ${token}` }
		});
		const created = ((await templates.json()).templates as { id?: string; name: string }[]).find(
			(t) => t.name === templateName
		);

		const config = await request.get(`/api/v1/courses/${course.slug}/certificate-template`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		expect((await config.json()).template_id).toBe(created?.id);
	});
});
