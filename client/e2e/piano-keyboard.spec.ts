import { test, expect } from '@playwright/test';

test.describe('Piano Keyboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Go to game mode with a song to see keyboard
    await page.getByTestId('song-card-love-story').click();
  });

  test('renders piano keyboard', async ({ page }) => {
    const keyboard = page.getByTestId('piano-keyboard');
    await expect(keyboard).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/keyboard-rendered.png' });
  });

  test('renders 88 keys', async ({ page }) => {
    const keys = page.getByTestId('piano-keyboard').getByRole('button');
    await expect(keys).toHaveCount(88);
    await page.screenshot({ path: 'e2e/screenshots/keyboard-88-keys.png' });
  });

  test('keys are clickable', async ({ page }) => {
    const c4 = page.getByRole('button', { name: 'C4' });
    await expect(c4).toBeVisible();
    await c4.click();
    await page.screenshot({ path: 'e2e/screenshots/keyboard-c4-clicked.png' });
  });

  test('has accessible labels on keys', async ({ page }) => {
    // Check some specific key labels
    await expect(page.getByRole('button', { name: 'C4' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'A4' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'C#4' })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/keyboard-labels.png' });
  });

  test('keyboard in practice mode', async ({ page }) => {
    await page.getByRole('button', { name: /Practice/ }).click();
    const keyboard = page.getByTestId('piano-keyboard');
    await expect(keyboard).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/keyboard-practice-mode.png' });
  });
});
