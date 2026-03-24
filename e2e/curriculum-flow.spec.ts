import { test, expect } from '@playwright/test';

test.describe('Curriculum Flow', () => {
  test('open curriculum → click available lesson → verify game mode opens', async ({ page }) => {
    await page.goto('/');

    // Navigate to Curriculum
    await page.click('button:has-text("Curriculum")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/curriculum-01-overview.png' });

    // Should see skill paths
    await expect(page.getByText('Fundamentals')).toBeVisible();

    // Click on Fundamentals path to expand it
    await page.click('text=Fundamentals');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/screenshots/curriculum-02-fundamentals.png' });

    // Click the first available lesson (Middle C Position)
    const startButtons = page.locator('button:has-text("Start")');
    const startCount = await startButtons.count();
    if (startCount > 0) {
      await startButtons.first().click();

      // Should be in game mode now
      await expect(page.getByText('Score')).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: 'e2e/screenshots/curriculum-03-lesson-game.png' });

      // Should show Play button in idle state
      const playBtn = page.locator('button:has-text("Play")');
      await expect(playBtn).toBeVisible();
    }
  });

  test('go back from game to curriculum → curriculum still shows correctly', async ({ page }) => {
    await page.goto('/');

    // Navigate to Curriculum
    await page.click('button:has-text("Curriculum")');
    await page.waitForTimeout(500);

    // Expand a path and start a lesson
    await page.click('text=Fundamentals');
    await page.waitForTimeout(300);

    const startButtons = page.locator('button:has-text("Start")');
    const startCount = await startButtons.count();
    if (startCount > 0) {
      await startButtons.first().click();

      // Should be in game mode
      await expect(page.getByText('Score')).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: 'e2e/screenshots/curriculum-04-in-game.png' });

      // Go back to Curriculum
      await page.click('button:has-text("Curriculum")');
      await page.waitForTimeout(500);

      // Curriculum should show correctly
      await expect(page.getByText('Fundamentals')).toBeVisible();
      await page.screenshot({ path: 'e2e/screenshots/curriculum-05-back-to-curriculum.png' });
    }
  });
});
