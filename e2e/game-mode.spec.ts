import { test, expect } from '@playwright/test';

test.describe('Game Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Select a song to enter game mode
    await page.getByTestId('song-card-love-story').click();
  });

  test('shows game canvas and controls', async ({ page }) => {
    await expect(page.getByTestId('falling-notes-canvas')).toBeVisible();
    await expect(page.getByTestId('score-display')).toBeVisible();
    await expect(page.getByTestId('difficulty-selector')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/game-mode-ready.png' });
  });

  test('shows Play button before starting', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Play/ })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/game-play-button.png' });
  });

  test('starts game with countdown', async ({ page }) => {
    await page.getByRole('button', { name: /Play/ }).click();
    // Countdown should appear (canvas renders it)
    await page.screenshot({ path: 'e2e/screenshots/game-countdown.png' });
    // Wait for countdown to finish
    await page.waitForTimeout(4000);
    // Pause button should appear
    await expect(page.getByRole('button', { name: /Pause/ })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/game-playing.png' });
  });

  test('pause and resume', async ({ page }) => {
    await page.getByRole('button', { name: /Play/ }).click();
    await page.waitForTimeout(4000);
    await page.getByRole('button', { name: /Pause/ }).click();
    await expect(page.getByRole('button', { name: /Resume/ })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/game-paused.png' });
    await page.getByRole('button', { name: /Resume/ }).click();
    await expect(page.getByRole('button', { name: /Pause/ })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/game-resumed.png' });
  });

  test('score display shows initial values', async ({ page }) => {
    await expect(page.getByTestId('score-points')).toContainText('0');
    await expect(page.getByTestId('accuracy-display')).toContainText('100.0%');
    await page.screenshot({ path: 'e2e/screenshots/game-initial-score.png' });
  });

  test('difficulty selector works in game mode', async ({ page }) => {
    const diffSelector = page.getByTestId('difficulty-selector');
    await expect(diffSelector).toBeVisible();
    await diffSelector.getByRole('radio', { name: /Medium/ }).click();
    await page.screenshot({ path: 'e2e/screenshots/game-difficulty-medium.png' });
  });

  test('piano keyboard visible below canvas', async ({ page }) => {
    await expect(page.getByTestId('piano-keyboard')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/game-with-keyboard.png' });
  });
});
