import { test, expect } from '@playwright/test';

test.describe('Tournament Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create a new tournament', async ({ page }) => {
    // Navigate to tournaments page
    await page.click('text=Tournaments');

    // Click create tournament button
    await page.click('text=Create Tournament');

    // Fill tournament form
    await page.fill('[data-testid="tournament-name"]', 'Test Tournament');
    await page.fill(
      '[data-testid="tournament-description"]',
      'Test tournament description'
    );
    await page.fill('[data-testid="tournament-prize-pool"]', '1000000');
    await page.fill('[data-testid="tournament-max-participants"]', '32');

    // Select tournament type
    await page.selectOption(
      '[data-testid="tournament-type"]',
      'single-elimination'
    );

    // Set start date
    await page.fill('[data-testid="tournament-start-date"]', '2024-12-01');

    // Submit form
    await page.click('text=Create Tournament');

    // Verify tournament was created
    await expect(
      page.locator('text=Tournament created successfully')
    ).toBeVisible();
  });

  test('should display tournament list', async ({ page }) => {
    await page.click('text=Tournaments');

    // Check if tournaments are displayed
    await expect(
      page.locator('[data-testid="tournament-card"]')
    ).toHaveCount.greaterThan(0);
  });

  test('should join tournament', async ({ page }) => {
    await page.click('text=Tournaments');

    // Click on first tournament
    await page.click('[data-testid="tournament-card"]:first-child');

    // Click join button
    await page.click('text=Join Tournament');

    // Verify joined
    await expect(
      page.locator('text=You have joined this tournament')
    ).toBeVisible();
  });
});
