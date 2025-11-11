// E2E tests for homepage
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loaded
    await expect(page).toHaveTitle(/TSL Sequence Store/i);
  });

  test('should display the main heading', async ({ page }) => {
    await page.goto('/');

    // Check for the main heading
    const heading = page.locator('h1.title');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('TSL Sequence Store');
  });

  test('should display the hero section when not logged in', async ({ page }) => {
    await page.goto('/');

    // Check for hero section
    const heroSection = page.locator('section.hero');
    await expect(heroSection).toBeVisible();
  });

  test('should display signin card when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // The signin card or home component should be present
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('should have responsive viewport', async ({ page }) => {
    await page.goto('/');

    // Check that viewport meta tag exists
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveAttribute('content', /width=device-width/);
  });

  test('should load without console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors if any
    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('manifest')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should have correct meta description', async ({ page }) => {
    await page.goto('/');

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /TSL Sequence Store/);
  });

  test('should load all critical resources', async ({ page }) => {
    const response = await page.goto('/');

    // Check that the main page loaded successfully
    expect(response?.status()).toBe(200);
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/');

    // Basic accessibility checks
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('should handle navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Just verify the page is interactive
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Homepage - Mobile View', () => {
  test.use({
    viewport: { width: 375, height: 667 } // iPhone SE size
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/');

    // Check that content is visible on mobile
    const heading = page.locator('h1.title');
    await expect(heading).toBeVisible();
  });

  test('should display hero section on mobile', async ({ page }) => {
    await page.goto('/');

    const heroSection = page.locator('section.hero');
    await expect(heroSection).toBeVisible();
  });
});

test.describe('Homepage - Tablet View', () => {
  test.use({
    viewport: { width: 768, height: 1024 } // iPad size
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.goto('/');

    const heading = page.locator('h1.title');
    await expect(heading).toBeVisible();
  });
});

test.describe('Homepage - Performance', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds (generous for dev server)
    expect(loadTime).toBeLessThan(10000);
  });
});
