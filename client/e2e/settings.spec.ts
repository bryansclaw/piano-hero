import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Settings/ }).click();
  });

  test('settings page loads', async ({ page }) => {
    await expect(page.getByTestId('settings-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/settings-page.png' });
  });

  test('shows MIDI connection section', async ({ page }) => {
    await expect(page.getByText('MIDI Connection')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/settings-midi.png' });
  });

  test('note names toggle works', async ({ page }) => {
    const toggle = page.getByTestId('note-names-toggle');
    await expect(toggle).toBeVisible();
    // Should be checked by default
    await expect(toggle).toBeChecked();
    // Toggle it off
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    await page.screenshot({ path: 'e2e/screenshots/settings-toggle-off.png' });
    // Toggle back on
    await toggle.click();
    await expect(toggle).toBeChecked();
    await page.screenshot({ path: 'e2e/screenshots/settings-toggle-on.png' });
  });

  test('volume slider works', async ({ page }) => {
    const slider = page.getByTestId('volume-slider');
    await expect(slider).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/settings-volume.png' });
  });

  test('shows Display section', async ({ page }) => {
    await expect(page.getByText('Display')).toBeVisible();
    await expect(page.getByText('Show Note Names')).toBeVisible();
  });

  test('shows Audio section', async ({ page }) => {
    await expect(page.getByText('Audio')).toBeVisible();
    await expect(page.getByText('Volume')).toBeVisible();
  });
});
