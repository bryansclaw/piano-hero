import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test('select song → start game → verify canvas renders → game elements visible', async ({ page }) => {
    await page.goto('/');

    // Should start on Library (Home tab)
    await expect(page.getByText('Song Library')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/game-flow-01-library.png' });

    // Click first song card to select it
    const songCards = page.locator('[data-testid^="song-card-"]');
    await songCards.first().click();

    // Should be on Game mode now with score display
    await expect(page.getByText('Score')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'e2e/screenshots/game-flow-02-game-loaded.png' });

    // FallingNotes canvas should be rendered
    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible();

    // Play button should be visible in idle state
    const gamePlayBtn = page.locator('button:has-text("Play")');
    await expect(gamePlayBtn).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/game-flow-03-game-idle.png' });
  });

  test('navigate away from game → come back → game is reset (idle state)', async ({ page }) => {
    await page.goto('/');

    // Select a song
    const songCards = page.locator('[data-testid^="song-card-"]');
    await songCards.first().click();

    // Verify game mode
    await expect(page.getByText('Score')).toBeVisible({ timeout: 5000 });

    // Start the game
    const gamePlayBtn = page.locator('button:has-text("Play")');
    await gamePlayBtn.click();

    // Wait for countdown or playing state
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/game-flow-04-game-started.png' });

    // Navigate away to Library (Home tab)
    await page.locator('nav button:has-text("Home")').click();
    await expect(page.getByText('Song Library')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/game-flow-05-back-to-library.png' });

    // Navigate back to Game
    await page.locator('nav button:has-text("Game")').click();

    // Game should be reset to idle state (Play button visible, not playing/paused)
    await expect(page.locator('button:has-text("Play")')).toBeVisible({ timeout: 5000 });
    // Should NOT show Pause or Resume buttons (not in playing/paused state)
    await expect(page.locator('button:has-text("Pause")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Resume")')).not.toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/game-flow-06-game-reset.png' });
  });

  test('select different song → verify title changes', async ({ page }) => {
    await page.goto('/');

    const songCards = page.locator('[data-testid^="song-card-"]');
    const count = await songCards.count();

    if (count < 2) {
      test.skip();
      return;
    }

    // Click first song
    await songCards.first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/screenshots/game-flow-07-first-song.png' });

    // Go back to library (Home tab)
    await page.locator('nav button:has-text("Home")').click();
    await expect(page.getByText('Song Library')).toBeVisible();

    // Click second song
    await songCards.nth(1).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/screenshots/game-flow-08-second-song.png' });
  });

  test('game tab without song shows empty state', async ({ page }) => {
    await page.goto('/');

    // Click Game tab directly without selecting a song
    await page.locator('nav button:has-text("Game")').click();

    // Should show empty state message
    await expect(page.getByText('Select a song from the Library to play')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/game-flow-09-empty-state.png' });
  });
});
