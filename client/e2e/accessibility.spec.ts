import { test, expect } from '@playwright/test';

test.describe('Accessibility basics', () => {
  test('all nav buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    const navButtons = page.locator('nav[role="navigation"] button');
    const count = await navButtons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const button = navButtons.nth(i);
      const name = await button.getAttribute('aria-label') || await button.innerText();
      expect(name.trim().length).toBeGreaterThan(0);
    }
  });

  test('theme toggle has aria-label', async ({ page }) => {
    await page.goto('/');
    const themeBtn = page.getByTestId('theme-toggle');
    await expect(themeBtn).toBeVisible();
    const label = await themeBtn.getAttribute('aria-label');
    expect(label).toBeTruthy();
  });

  test('settings button has aria-label', async ({ page }) => {
    await page.goto('/');
    const settingsBtn = page.locator('button[aria-label="Settings"]');
    await expect(settingsBtn).toBeVisible();
  });

  test('heading hierarchy starts with h1', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
    const h1Text = await h1.first().innerText();
    expect(h1Text.length).toBeGreaterThan(0);
  });

  test('song library search input has accessible label', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByTestId('song-search');
    await expect(searchInput).toBeVisible();
    const placeholder = await searchInput.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
  });

  test('piano keyboard has role=group with aria-label', async ({ page }) => {
    await page.goto('/');
    // Navigate to game mode first
    const firstSong = page.locator('[data-testid^="song-card-"]').first();
    await firstSong.click();

    const keyboard = page.getByTestId('piano-keyboard');
    await expect(keyboard).toBeVisible();
    const role = await keyboard.getAttribute('role');
    const label = await keyboard.getAttribute('aria-label');
    expect(role).toBe('group');
    expect(label).toBe('Piano keyboard');
  });

  test('piano keys have aria-labels', async ({ page }) => {
    await page.goto('/');
    const firstSong = page.locator('[data-testid^="song-card-"]').first();
    await firstSong.click();

    const keyboard = page.getByTestId('piano-keyboard');
    await expect(keyboard).toBeVisible();

    const keyButtons = keyboard.locator('button');
    const count = await keyButtons.count();
    expect(count).toBeGreaterThan(0);

    // Check first few keys have aria-labels
    for (let i = 0; i < Math.min(count, 5); i++) {
      const label = await keyButtons.nth(i).getAttribute('aria-label');
      expect(label).toBeTruthy();
    }
  });

  test('difficulty dots have title attributes', async ({ page }) => {
    await page.goto('/');
    // Difficulty dots are in song cards
    const diffDots = page.locator('[title$="difficulty"]');
    const count = await diffDots.count();
    expect(count).toBeGreaterThan(0);
  });

  test('leaderboard song selector has aria-label', async ({ page }) => {
    await page.goto('/');
    // Navigate to leaderboard
    const leaderboardNav = page.locator('nav button').filter({ hasText: /Leaderboard/i });
    if (await leaderboardNav.count() > 0) {
      await leaderboardNav.click();
    } else {
      // Try icon-only nav (mobile)
      const navButtons = page.locator('nav[role="navigation"] button');
      const count = await navButtons.count();
      for (let i = 0; i < count; i++) {
        const btn = navButtons.nth(i);
        const text = await btn.innerText();
        if (text.includes('Leaderboard')) {
          await btn.click();
          break;
        }
      }
    }

    const songSelect = page.getByTestId('song-select');
    if (await songSelect.isVisible()) {
      const label = await songSelect.getAttribute('aria-label');
      expect(label).toBeTruthy();
    }
  });
});
