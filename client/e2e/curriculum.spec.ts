import { test, expect } from '@playwright/test';

test.describe('Curriculum', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Curriculum")');
  });

  test('curriculum page renders', async ({ page }) => {
    await expect(page.getByTestId('curriculum')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/curriculum.png' });
  });

  test('skill tree shows all 5 paths', async ({ page }) => {
    await expect(page.getByTestId('skill-paths')).toBeVisible();
    await expect(page.getByTestId('path-fundamentals')).toBeVisible();
    await expect(page.getByTestId('path-chords')).toBeVisible();
    await expect(page.getByTestId('path-sightReading')).toBeVisible();
    await expect(page.getByTestId('path-technique')).toBeVisible();
    await expect(page.getByTestId('path-songMastery')).toBeVisible();
  });

  test('lesson navigation works', async ({ page }) => {
    await expect(page.getByTestId('lesson-grid')).toBeVisible();
    await expect(page.getByTestId('lesson-fund-01')).toBeVisible();
    
    // Click first lesson
    await page.getByTestId('lesson-fund-01').click();
    await expect(page.getByTestId('lesson-detail')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/curriculum-lesson.png' });
  });

  test('switching paths shows different lessons', async ({ page }) => {
    await page.getByTestId('path-chords').click();
    await expect(page.getByTestId('lesson-chord-01')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/curriculum-chords.png' });
  });

  test('progress bar is visible', async ({ page }) => {
    await expect(page.getByTestId('path-progress')).toBeAttached();
  });

  test('practice plan can be shown', async ({ page }) => {
    await page.getByTestId('practice-plan-btn').click();
    await expect(page.getByTestId('practice-plan')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/curriculum-plan.png' });
  });
});
