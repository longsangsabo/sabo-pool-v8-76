import { test, expect } from '@playwright/test';

test.describe('Real-time Ranking System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display real-time ranking updates', async ({ page }) => {
    // Navigate to leaderboard
    await page.click('text=Leaderboard');

    // Wait for initial ranking load
    await expect(page.locator('[data-testid="ranking-list"]')).toBeVisible();

    // Mock real-time update
    await page.evaluate(() => {
      // Simulate WebSocket message for ranking update
      window.dispatchEvent(
        new CustomEvent('ranking-update', {
          detail: {
            player_id: 'test-player-1',
            new_rank: 5,
            points: 1500,
          },
        })
      );
    });

    // Verify ranking updated
    await expect(
      page.locator('[data-testid="player-rank"]:has-text("5")')
    ).toBeVisible();
  });

  test('should show ELO changes after match', async ({ page }) => {
    // Navigate to match history
    await page.click('text=Match History');

    // Click on a match
    await page.click('[data-testid="match-card"]:first-child');

    // Verify ELO change displayed
    await expect(page.locator('[data-testid="elo-change"]')).toBeVisible();
  });

  test('should filter rankings by season', async ({ page }) => {
    await page.click('text=Leaderboard');

    // Select different season
    await page.selectOption('[data-testid="season-selector"]', 'season-2');

    // Verify rankings changed
    await expect(
      page.locator('[data-testid="season-indicator"]')
    ).toContainText('Season 2');
  });
});
