import { test, expect } from '@playwright/test';

test.describe('Song Library', () => {
  test('renders song grid with Taylor Swift songs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('song-grid')).toBeVisible();
    await expect(page.getByText('Love Story')).toBeVisible();
    await expect(page.getByText('Shake It Off')).toBeVisible();
    await expect(page.getByText('Anti-Hero')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/song-grid.png' });
  });

  test('search filters songs', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByTestId('song-search');
    await searchInput.fill('Cruel');
    await expect(page.getByText('Cruel Summer')).toBeVisible();
    await expect(page.getByText('Love Story')).not.toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/song-search-filtered.png' });
  });

  test('search shows no results for nonsense', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByTestId('song-search');
    await searchInput.fill('xyznonexistent123');
    await expect(page.getByTestId('no-results')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/song-search-no-results.png' });
  });

  test('clearing search shows all songs again', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByTestId('song-search');
    await searchInput.fill('Love Story');
    await expect(page.getByText('Shake It Off')).not.toBeVisible();
    await searchInput.fill('');
    await expect(page.getByText('Shake It Off')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/song-search-cleared.png' });
  });

  test('clicking a song navigates to game mode', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('song-card-love-story').click();
    // Should be in game mode now
    await expect(page.getByTestId('falling-notes-canvas')).toBeVisible();
    await expect(page.getByTestId('difficulty-selector')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/song-selected-game.png' });
  });

  test('shows BPM and album info on cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('119 BPM')).toBeVisible(); // Love Story BPM
    await expect(page.getByText(/Fearless/).first()).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/song-card-details.png' });
  });
});
