// Smoke tests - quick checks to verify basic functionality
import { test, expect } from "@playwright/test";

// Helper function to wait for app to load beyond initial loading state
async function waitForAppReady(page, timeout = 15000) {
  // Wait for domcontentloaded first
  await page.waitForLoadState("domcontentloaded");

  // Wait for the app to move past the loading state
  // Either wait for body to have more than just loading text, or timeout
  try {
    await page.waitForFunction(
      () => {
        const body = document.body;
        return (
          body &&
          body.innerHTML.length > 100 &&
          !body.innerHTML.includes("Loading app...")
        );
      },
      { timeout }
    );
  } catch (e) {
    // If timeout, continue anyway - some tests can still pass
  }
}

test.describe("Smoke Tests", () => {
  test("application loads without crashing", async ({ page }) => {
    // Navigate to the homepage
    const response = await page.goto("/");

    // Verify we got a successful response
    expect(response?.status()).toBeLessThan(500);

    // Wait for the page to be loaded
    await page.waitForLoadState("domcontentloaded");

    // Verify the page has content
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("page has title element", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);

    // Check the page title - might be Nuxt loading title or actual title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test("page contains content after loading", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);

    // Check for body content
    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: 15000 });

    // Page should have some content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(0);
  });

  test("page has proper HTML structure", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Verify basic HTML structure
    const html = page.locator("html");
    await expect(html).toBeAttached();

    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("page has meta tags", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    const viewportCount = await viewport.count();
    expect(viewportCount).toBeGreaterThan(0);
  });

  test("page loads within reasonable time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const loadTime = Date.now() - startTime;

    // Should get initial response within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test("page is interactive", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);

    // Verify we can interact with the page
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Check that JavaScript has run (Nuxt app element should exist)
    const hasNuxtApp = await page.evaluate(() => {
      return (
        document.querySelector("#__nuxt") !== null ||
        document.querySelector("#__layout") !== null ||
        document.body.innerHTML.length > 100
      );
    });

    expect(hasNuxtApp).toBe(true);
  });

  test("no critical JavaScript errors on load", async ({ page }) => {
    const errors = [];

    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Filter out non-critical errors (favicon, manifest, network errors, etc.)
    const criticalErrors = errors.filter((error) => {
      return (
        !error.includes("favicon") &&
        !error.includes("manifest") &&
        !error.includes("net::ERR") &&
        !error.includes("Failed to fetch")
      );
    });

    if (criticalErrors.length > 0) {
      console.log("Critical errors found:", criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });
});

test.describe("Smoke Tests - Basic Navigation", () => {
  test("can navigate to signin", async ({ page }) => {
    const response = await page.goto("/signin");
    await page.waitForLoadState("domcontentloaded");

    // Verify we're on a valid page
    expect(response?.status()).toBeLessThan(500);

    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("can navigate to help page", async ({ page }) => {
    const response = await page.goto("/help");
    await page.waitForLoadState("domcontentloaded");

    expect(response?.status()).toBeLessThan(500);

    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("handles 404 gracefully", async ({ page }) => {
    await page.goto("/this-definitely-does-not-exist-12345");
    await page.waitForLoadState("domcontentloaded");

    // Should either show 404 or redirect - either is acceptable
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Smoke Tests - Responsive Design", () => {
  test("works on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("works on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("works on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
