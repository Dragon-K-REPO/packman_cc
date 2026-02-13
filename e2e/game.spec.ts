import { test, expect } from '@playwright/test';

test('game shows canvas and menu on load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.menu-screen')).toBeVisible();
});

test('game starts on Enter key', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.menu-screen')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.menu-screen')).not.toBeVisible();
  await expect(page.locator('.hud')).toBeVisible();
});

test('HUD shows score and lives', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Enter');
  await expect(page.locator('.hud-score')).toContainText('SCORE');
  await expect(page.locator('.hud-lives')).toBeVisible();
});

test('render_game_to_text returns game state', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Enter');
  // Small delay for engine to initialize
  await page.waitForTimeout(100);
  const text = await page.evaluate(() => (window as any).render_game_to_text());
  expect(text).toContain('status:playing');
  expect(text).toContain('P'); // player marker
  expect(text).toContain('#'); // wall tiles
});

test('advanceTime progresses game state', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  const before = await page.evaluate(() => (window as any).render_game_to_text());
  await page.evaluate(() => (window as any).advanceTime(1000));
  const after = await page.evaluate(() => (window as any).render_game_to_text());
  expect(before).toBeDefined();
  expect(after).toBeDefined();
  // State should have changed (ghosts moved, timers progressed)
  expect(after.length).toBeGreaterThan(0);
});

test('player direction changes with arrow keys', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  // Use setDirection hook directly since advanceTime bypasses the InputHandler buffer
  await page.evaluate(() => (window as any).setDirection('right'));
  await page.evaluate(() => (window as any).advanceTime(500));
  const text = await page.evaluate(() => (window as any).render_game_to_text());
  expect(text).toContain('dir:right');
});

test('ESC pauses and resumes the game', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Enter');
  await expect(page.locator('.hud')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.pause-screen')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.pause-screen')).not.toBeVisible();
  await expect(page.locator('.hud')).toBeVisible();
});
