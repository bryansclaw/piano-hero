import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Analytics")');
  });

  test('dashboard loads', async ({ page }) => {
    await expect(page.getByTestId('analytics-dashboard')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/analytics-dashboard.png' });
  });

  test('stats cards are visible', async ({ page }) => {
    await expect(page.getByTestId('stats-cards')).toBeVisible();
  });

  test('practice time chart renders', async ({ page }) => {
    await expect(page.getByTestId('practice-chart')).toBeVisible();
  });

  test('accuracy chart renders', async ({ page }) => {
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
  });

  test('key heatmap renders', async ({ page }) => {
    await expect(page.getByTestId('key-heatmap')).toBeVisible();
  });

  test('shows empty state message', async ({ page }) => {
    await expect(page.getByText(/No sessions recorded/)).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/analytics-empty.png' });
  });
});
