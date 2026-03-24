import { test, expect } from '@playwright/test';

test.describe('Mobile responsiveness (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('nav is scrollable and does not overflow', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();

    // Body should not have horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test('song library grid collapses to single column', async ({ page }) => {
    await page.goto('/');
    const grid = page.getByTestId('song-grid');
    await expect(grid).toBeVisible();

    // Check that grid items stack vertically (grid-cols-1 at this width)
    const gridBox = await grid.boundingBox();
    const firstCard = grid.locator('[data-testid^="song-card-"]').first();
    const cardBox = await firstCard.boundingBox();

    if (gridBox && cardBox) {
      // Card should be nearly full width of grid
      expect(cardBox.width).toBeGreaterThan(gridBox.width * 0.85);
    }
  });

  test('no horizontal scrollbar on main pages', async ({ page }) => {
    await page.goto('/');

    // Check library
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2;
    });
    expect(overflow).toBe(true);
  });

  test('header does not clip', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    if (headerBox) {
      expect(headerBox.width).toBeLessThanOrEqual(375 + 1);
    }
  });
});

test.describe('Tablet responsiveness (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('song grid shows 2 columns', async ({ page }) => {
    await page.goto('/');
    const grid = page.getByTestId('song-grid');
    await expect(grid).toBeVisible();

    const cards = grid.locator('[data-testid^="song-card-"]');
    const count = await cards.count();
    if (count >= 2) {
      const first = await cards.nth(0).boundingBox();
      const second = await cards.nth(1).boundingBox();
      if (first && second) {
        // On tablet, 2 cards should be side by side (similar Y position)
        expect(Math.abs(first.y - second.y)).toBeLessThan(10);
      }
    }
  });
});
