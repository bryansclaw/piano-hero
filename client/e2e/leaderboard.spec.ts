import { test, expect } from '@playwright/test';

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Leaderboard")');
  });

  test('leaderboard loads', async ({ page }) => {
    await expect(page.getByTestId('leaderboard')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/leaderboard.png' });
  });

  test('global tab shows leaderboard rows', async ({ page }) => {
    const rows = page.getByTestId('leaderboard-row');
    await expect(rows.first()).toBeVisible();
  });

  test('tabs switch between global and friends', async ({ page }) => {
    await page.getByTestId('friends-tab').click();
    await expect(page.getByTestId('friend-input')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/leaderboard-friends.png' });

    await page.getByTestId('global-tab').click();
    await expect(page.getByTestId('friend-input')).not.toBeVisible();
  });

  test('song selector works', async ({ page }) => {
    await expect(page.getByTestId('song-select')).toBeVisible();
  });

  test('weekly challenge is displayed', async ({ page }) => {
    await expect(page.getByTestId('weekly-challenge')).toBeVisible();
  });

  test('achievements section is displayed', async ({ page }) => {
    await expect(page.getByTestId('social-feed')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/leaderboard-achievements.png' });
  });
});
