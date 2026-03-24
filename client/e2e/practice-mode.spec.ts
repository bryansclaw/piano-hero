import { test, expect } from '@playwright/test';

test.describe('Practice Mode', () => {
  test('shows practice mode with message when no song selected', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Practice/ }).click();
    await expect(page.getByText('Practice Mode')).toBeVisible();
    await expect(page.getByText(/Select a song from the Library/)).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/practice-no-song.png' });
  });

  test('shows sheet music and keyboard after selecting a song', async ({ page }) => {
    await page.goto('/');
    // Select a song first
    await page.getByTestId('song-card-love-story').click();
    // Now go to practice
    await page.getByRole('button', { name: /Practice/ }).click();
    await expect(page.getByText('Practice Mode')).toBeVisible();
    await expect(page.getByTestId('sheet-music')).toBeVisible();
    await expect(page.getByTestId('piano-keyboard')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/practice-with-song.png' });
  });

  test('displays song title in practice mode', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('song-card-love-story').click();
    await page.getByRole('button', { name: /Practice/ }).click();
    await expect(page.getByText(/Love Story/)).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/practice-song-title.png' });
  });
});
