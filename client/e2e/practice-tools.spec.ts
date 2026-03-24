import { test, expect } from '@playwright/test';

test.describe('Practice Tools', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Select a song first
    await page.click('[data-testid="song-card-love-story"]');
    await page.waitForTimeout(200);
    // Navigate to practice mode
    await page.click('button:has-text("Practice")');
  });

  test('practice tools panel is visible', async ({ page }) => {
    await expect(page.getByTestId('practice-tools')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/practice-tools.png' });
  });

  test('tempo slider changes value', async ({ page }) => {
    const slider = page.getByTestId('tempo-slider');
    await expect(slider).toBeVisible();
    await slider.fill('75');
    await expect(page.getByText('Tempo: 75%')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/practice-tools-tempo.png' });
  });

  test('metronome toggles on and off', async ({ page }) => {
    const toggle = page.getByTestId('metronome-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(toggle).toContainText('ON');
    await toggle.click();
    await expect(toggle).toContainText('OFF');
  });

  test('loop toggle works', async ({ page }) => {
    await page.getByTestId('loop-toggle').click();
    await expect(page.getByTestId('loop-start')).toBeVisible();
    await expect(page.getByTestId('loop-end')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/practice-tools-loop.png' });
  });

  test('auto speed-up toggle shows target slider', async ({ page }) => {
    await page.getByTestId('autospeed-toggle').click();
    await expect(page.getByTestId('autospeed-target')).toBeVisible();
  });

  test('count-in toggles', async ({ page }) => {
    const toggle = page.getByTestId('countin-toggle');
    await expect(toggle).toContainText('ON');
    await toggle.click();
    await expect(toggle).toContainText('OFF');
  });
});
