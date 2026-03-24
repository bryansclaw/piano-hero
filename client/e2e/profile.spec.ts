import { test, expect } from '@playwright/test';

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Profile")');
  });

  test('profile page loads', async ({ page }) => {
    await expect(page.getByTestId('profile')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/profile.png' });
  });

  test('username is displayed', async ({ page }) => {
    await expect(page.getByTestId('username-display')).toBeVisible();
  });

  test('level is displayed', async ({ page }) => {
    await expect(page.getByTestId('level-display')).toBeVisible();
  });

  test('avatar is displayed', async ({ page }) => {
    await expect(page.getByTestId('avatar-display')).toBeVisible();
  });

  test('XP bar is displayed', async ({ page }) => {
    await expect(page.getByTestId('xp-bar')).toBeAttached();
  });

  test('streak is displayed', async ({ page }) => {
    await expect(page.getByTestId('streak-display')).toBeVisible();
  });

  test('avatar selection works', async ({ page }) => {
    await page.getByTestId('avatar-option-3').click();
    await page.screenshot({ path: 'e2e/screenshots/profile-avatar.png' });
  });

  test('username edit works', async ({ page }) => {
    // Click the edit button next to username
    await page.getByTestId('username-display').locator('..').locator('button').click();
    await expect(page.getByTestId('username-input')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/profile-edit.png' });
  });
});
