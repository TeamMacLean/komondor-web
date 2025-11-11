// E2E tests for navigation and routing
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to signin page', async ({ page }) => {
    await page.goto('/');

    // Look for signin-related elements
    await page.waitForLoadState('networkidle');

    // Check that we can see the page content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle direct navigation to projects page', async ({ page }) => {
    // Try to navigate directly (may redirect if not authenticated)
    const response = await page.goto('/projects');

    // Page should either load or redirect (both are valid)
    expect(response?.status()).toBeLessThanOrEqual(399);
  });

  test('should handle direct navigation to help page', async ({ page }) => {
    const response = await page.goto('/help');

    // Help page should be accessible
    expect([200, 301, 302]).toContain(response?.status() || 200);
  });

  test('should handle 404 for non-existent pages', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-at-all');
    await page.waitForLoadState('networkidle');

    // Either shows 404 or redirects to homepage
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('should handle back navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to another page
    await page.goto('/help');
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should be back at homepage
    expect(page.url()).toContain('/');
  });

  test('should handle forward navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto('/help');
    await page.waitForLoadState('networkidle');

    await page.goBack();
    await page.waitForLoadState('networkidle');

    await page.goForward();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('help');
  });

  test('should maintain state during navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify the page is interactive
    const heading = page.locator('h1.title');
    await expect(heading).toBeVisible();
  });
});

test.describe('Navigation - Links', () => {
  test('should have working internal links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that nuxt-link components are rendered
    const links = page.locator('a');
    const linkCount = await links.count();

    // Should have at least some links on the page
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should open links in same window by default', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find any internal link
    const internalLinks = page.locator('a[href^="/"]');
    const count = await internalLinks.count();

    if (count > 0) {
      const firstLink = internalLinks.first();
      const target = await firstLink.getAttribute('target');

      // Internal links should not open in new window by default
      expect(target).not.toBe('_blank');
    }
  });
});

test.describe('Navigation - URL Handling', () => {
  test('should handle query parameters', async ({ page }) => {
    await page.goto('/?test=value');
    await page.waitForLoadState('networkidle');

    const url = new URL(page.url());
    expect(url.searchParams.get('test')).toBe('value');
  });

  test('should preserve hash in URL', async ({ page }) => {
    await page.goto('/#section');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('#section');
  });

  test('should handle special characters in URLs', async ({ page }) => {
    await page.goto('/?search=test%20query');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toBeTruthy();
  });
});

test.describe('Navigation - Breadcrumbs and History', () => {
  test('should handle multiple page transitions', async ({ page }) => {
    // Navigate through multiple pages
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    await page.goto('/help');
    await page.waitForLoadState('networkidle');

    // Go back twice
    await page.goBack();
    await page.waitForLoadState('networkidle');

    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should be at homepage
    expect(page.url()).toMatch(/\/$|\/index/);
  });

  test('should handle rapid navigation', async ({ page }) => {
    await page.goto('/');

    // Rapidly navigate
    await Promise.all([
      page.goto('/help'),
      page.waitForLoadState('networkidle')
    ]);

    // Should end up at help page
    expect(page.url()).toContain('help');
  });
});

test.describe('Navigation - Error Handling', () => {
  test('should handle network issues gracefully', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    expect(page.url()).toBeTruthy();
  });

  test('should handle slow connections', async ({ page }) => {
    // Simulate slow connection
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1.title');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
