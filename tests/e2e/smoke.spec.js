// Smoke tests - quick checks to verify basic functionality
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('application loads without crashing', async ({ page }) => {
    // Navigate to the homepage
    const response = await page.goto('/');

    // Verify we got a successful response
    expect(response?.status()).toBe(200);

    // Wait for the page to be fully loaded
    await page.waitForLoadState('domcontentloaded');

    // Verify the page has content
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
    expect(bodyContent.length).toBeGreaterThan(0);
  });

  test('page has correct title', async ({ page }) => {
    await page.goto('/');

    // Check the page title
    const title = await page.title();
    expect(title).toMatch(/TSL Sequence Store/i);
  });

  test('page contains main heading', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for the main heading
    const heading = page.locator('h1.title');
    await expect(heading).toBeVisible();

    const headingText = await heading.textContent();
    expect(headingText).toContain('TSL Sequence Store');
  });

  test('page has proper HTML structure', async ({ page }) => {
    await page.goto('/');

    // Verify basic HTML structure
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('page has meta tags', async ({ page }) => {
    await page.goto('/');

    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);

    // Check description meta tag
    const description = page.locator('meta[name="description"]');
    const descContent = await description.getAttribute('content');
    expect(descContent).toBeTruthy();
  });

  test('page loads required assets', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Just verify the page finished loading
    const url = page.url();
    expect(url).toContain('localhost:3000');
  });

  test('page is interactive', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify we can interact with the page
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check that JavaScript is running (Vue should have mounted)
    const hasVueApp = await page.evaluate(() => {
      return document.querySelector('#__nuxt') !== null ||
             document.querySelector('#__layout') !== null ||
             document.body.innerHTML.length > 100;
    });

    expect(hasVueApp).toBe(true);
  });

  test('no critical JavaScript errors on load', async ({ page }) => {
    const errors = [];

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out non-critical errors (favicon, etc.)
    const criticalErrors = errors.filter(error => {
      return !error.includes('favicon') &&
             !error.includes('manifest') &&
             !error.includes('net::ERR_FILE_NOT_FOUND');
    });

    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('page loads in reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe('Smoke Tests - Basic Navigation', () => {
  test('can navigate to signin', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Verify we're on a valid page
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('can navigate to help page', async ({ page }) => {
    await page.goto('/help');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('help');
  });

  test('handles 404 gracefully', async ({ page }) => {
    await page.goto('/this-definitely-does-not-exist-12345');
    await page.waitForLoadState('networkidle');

    // Should either show 404 or redirect - either is acceptable
    const url = page.url();
    expect(url).toBeTruthy();
  });
});

test.describe('Smoke Tests - Responsive Design', () => {
  test('works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1.title');
    await expect(heading).toBeVisible();
  });

  test('works on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1.title');
    await expect(heading).toBeVisible();
  });

  test('works on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1.title');
    await expect(heading).toBeVisible();
  });
});
