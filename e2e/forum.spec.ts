import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { OWNER_STATE } from './accounts';
import { ready } from './hydration';

test.describe('community forum', () => {
	test.use({ storageState: OWNER_STATE });

	test('a moderator opens a board, starts a thread, replies, pins, and locks it', async ({
		page
	}) => {
		const board = `Board ${randomUUID().slice(0, 6)}`;
		const thread = `Thread ${randomUUID().slice(0, 6)}`;
		const reply = `A reply ${randomUUID().slice(0, 6)}`;

		// Open a workspace board from the community index.
		await page.goto('/forum');
		await ready(page);
		await page.getByRole('button', { name: 'New board' }).click();
		await page.getByLabel('Title').fill(board);
		await page.getByRole('button', { name: 'Create board' }).click();
		await expect(page.getByRole('link', { name: new RegExp(board) })).toBeVisible();

		// Enter it and start a thread; posting lands on the thread page.
		await page.getByRole('link', { name: new RegExp(board) }).click();
		await page.getByRole('button', { name: 'New thread' }).click();
		await page.getByLabel('Title').fill(thread);
		await page.getByLabel('Message').fill('The opening message of the thread.');
		await page.getByRole('button', { name: 'Post thread' }).click();
		await expect(page.getByRole('heading', { name: thread })).toBeVisible();

		// Reply to it.
		await page.getByLabel('Write a reply').fill(reply);
		await page.getByRole('button', { name: 'Reply', exact: true }).click();
		await expect(page.getByText(reply)).toBeVisible();
		await expect(page.getByText('1 reply')).toBeVisible();

		// Pin, then lock. As a moderator the reply box stays, so the proof the flags
		// stuck is the controls flipping to their opposites.
		await page.getByRole('button', { name: 'Pin' }).click();
		await expect(page.getByText('Pinned')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Unpin' })).toBeVisible();
		await page.getByRole('button', { name: 'Lock', exact: true }).click();
		await expect(page.getByText('Locked')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Unlock' })).toBeVisible();

		// Delete the thread — back to the board, which is now empty.
		await page.getByRole('button', { name: 'Delete thread' }).click();
		await expect(page).toHaveURL(/\/forum\/spaces\//);
		await expect(page.getByText('No threads yet.')).toBeVisible();
	});
});
