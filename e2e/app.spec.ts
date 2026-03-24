import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test('loads the app and shows header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('PianoHero')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/app-loaded.png' });
  });

  test('shows Library tab by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Song Library')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/library-default.png' });
  });

  test('navigates to Practice tab', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Practice/ }).click();
    await expect(page.getByText('Practice Mode')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/practice-tab.png' });
  });

  test('navigates to Game tab', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Game/ }).click();
    await expect(page.getByTestId('falling-notes-canvas')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/game-tab.png' });
  });

  test('navigates to Settings tab', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Settings/ }).click();
    await expect(page.getByTestId('settings-page')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/settings-tab.png' });
  });

  test('navigates between all tabs', async ({ page }) => {
    await page.goto('/');

    // Library -> Game
    await page.getByRole('button', { name: /Game/ }).click();
    await expect(page.getByTestId('falling-notes-canvas')).toBeVisible();

    // Game -> Settings
    await page.getByRole('button', { name: /Settings/ }).click();
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // Settings -> Practice
    await page.getByRole('button', { name: /Practice/ }).click();
    await expect(page.getByText('Practice Mode')).toBeVisible();

    // Practice -> Home (Library)
    await page.getByRole('button', { name: /Home/ }).click();
    await expect(page.getByText('Song Library')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/nav-cycle-complete.png' });
  });
});
