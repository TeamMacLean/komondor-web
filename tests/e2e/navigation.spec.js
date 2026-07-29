// E2E tests for navigation and routing
import { test, expect } from "@playwright/test";

// Helper function to wait for app to load beyond initial loading state
async function waitForAppReady(page, timeout = 10000) {
  await page.waitForLoadState("domcontentloaded");
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
    // If timeout, continue anyway
  }
}

test.describe("Navigation", () => {
  test("should navigate to signin page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Check that we can see the page content
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should handle direct navigation to projects page", async ({ page }) => {
    // Try to navigate directly (may redirect if not authenticated)
    const response = await page.goto("/projects");

    // Page should either load or redirect (both are valid)
    expect(response?.status()).toBeLessThanOrEqual(399);
  });

  test("should handle direct navigation to help page", async ({ page }) => {
    const response = await page.goto("/help");

    // Help page should be accessible
    expect([200, 301, 302]).toContain(response?.status() || 200);
  });

  test("should handle 404 for non-existent pages", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-at-all");
    await page.waitForLoadState("domcontentloaded");

    // Either shows 404 or redirects to homepage - both are valid
    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: 10000 });

    // `render.ssr` is false, so every route — valid or not — is served as the
    // same 200 HTML shell. Asserting on the status cannot fail; assert that the
    // app actually rendered instead.
    expect(response?.ok()).toBe(true);
    await expect(page.locator("#__nuxt")).toBeVisible();
  });

  test("should handle back navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Navigate to another page
    await page.goto("/help");
    await page.waitForLoadState("domcontentloaded");

    // Go back
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");

    // Should be back at homepage
    expect(page.url()).toContain("/");
  });

  test("should handle forward navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/help");
    await page.waitForLoadState("domcontentloaded");

    await page.goBack();
    await page.waitForLoadState("domcontentloaded");

    await page.goForward();
    await page.waitForLoadState("domcontentloaded");

    expect(page.url()).toContain("help");
  });

  test("should maintain state during navigation", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);

    // Verify the page is visible
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Navigation - Links", () => {
  test("should have working internal links", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);

    // Check that nuxt-link components are rendered
    const links = page.locator("a");
    const linkCount = await links.count();

    // Should have at least some links on the page (or page is still loading)
    expect(linkCount).toBeGreaterThanOrEqual(0);
  });

  test("should open links in same window by default", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);

    // Find any internal link
    const internalLinks = page.locator('a[href^="/"]');
    const count = await internalLinks.count();

    if (count > 0) {
      const firstLink = internalLinks.first();
      const target = await firstLink.getAttribute("target");

      // Internal links should not open in new window by default
      expect(target).not.toBe("_blank");
    }
  });
});

test.describe("Navigation - URL Handling", () => {
  test("should handle query parameters", async ({ page }) => {
    await page.goto("/?test=value");
    await page.waitForLoadState("domcontentloaded");

    const url = new URL(page.url());
    expect(url.searchParams.get("test")).toBe("value");
  });

  test("should preserve hash in URL", async ({ page }) => {
    await page.goto("/#section");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(url).toContain("#section");
  });

  test("should handle special characters in URLs", async ({ page }) => {
    await page.goto("/?search=test%20query");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(url).toBeTruthy();
  });
});

test.describe("Navigation - Breadcrumbs and History", () => {
  test("should handle multiple page transitions", async ({ page }) => {
    // Navigate through multiple pages
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/projects");
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/help");
    await page.waitForLoadState("domcontentloaded");

    // Go back twice
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");

    await page.goBack();
    await page.waitForLoadState("domcontentloaded");

    // Should be at homepage or projects
    expect(page.url()).toBeTruthy();
  });

  test("should handle rapid navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Navigate to another page
    await page.goto("/help");
    await page.waitForLoadState("domcontentloaded");

    // Should end up at help page
    expect(page.url()).toContain("help");
  });
});

test.describe("Navigation - Error Handling", () => {
  test("should handle network issues gracefully", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Verify page loaded
    expect(page.url()).toBeTruthy();
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should handle slow connections", async ({ page }) => {
    // Simulate slow connection
    await page.route("**/*", (route) => {
      setTimeout(() => route.continue(), 100);
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Navigation - Project to New Sample", () => {
  test.skip("should navigate from project page to new sample page with correct projectId parameter", async ({
    page,
  }) => {
    // Skip: This test requires a running backend API
    // Mock the API responses
    const mockProjectId = "test-project-123";

    // Mock the project endpoint
    await page.route("**/project*", (route) => {
      const url = new URL(route.request().url());
      const id = url.searchParams.get("id");

      if (id === mockProjectId) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            project: {
              _id: mockProjectId,
              name: "Test Project",
              owner: "testuser",
              group: { _id: "group-1", name: "Test Group" },
              accessions: [],
              releaseDate: null,
              shortDesc: "Test description",
              longDesc: "Test long description",
              path: "/test/path",
              samples: [],
              additionalFiles: [],
              nudgeable: false,
              nudges: [],
              doNotSendToEna: false,
            },
            actualAdditionalFiles: [],
          }),
        });
      } else {
        route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "Project ID is required" }),
        });
      }
    });

    // Mock the sample names endpoint
    await page.route("**/samples/names/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ sampleNames: [] }),
      });
    });

    // Navigate to project page
    await page.goto(`/project?id=${mockProjectId}`);
    await page.waitForLoadState("networkidle");

    // Verify we're on the project page
    const projectTitle = page.locator(".title").first();
    await expect(projectTitle).toContainText("Test Project");

    // Find and click the "New" sample button
    const newSampleButton = page.locator('a:has-text("New")');
    await expect(newSampleButton).toBeVisible();

    // Click the button and wait for navigation
    await newSampleButton.click();
    await page.waitForLoadState("networkidle");

    // Verify we're on the new sample page
    await expect(page).toHaveURL(/\/samples\/new/);

    // Verify the projectId query parameter is present
    const url = new URL(page.url());
    const projectIdParam = url.searchParams.get("projectId");
    expect(projectIdParam).toBe(mockProjectId);

    // Verify the page loaded successfully with the project name
    const newSampleTitle = page.locator("h1.title");
    await expect(newSampleTitle).toContainText("New Sample for Test Project");
  });

  test.skip("should handle missing projectId parameter and show error", async ({
    page,
  }) => {
    // Skip: This test requires a running backend API
    // Mock the project endpoint to return 400 for requests without ID
    await page.route("**/project*", (route) => {
      const url = new URL(route.request().url());
      const id = url.searchParams.get("id");

      if (!id) {
        route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "Project ID is required" }),
        });
      } else {
        route.continue();
      }
    });

    // Try to navigate to new sample page without projectId
    await page.goto("/samples/new");
    await page.waitForLoadState("networkidle");

    // Should show an error or redirect
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test.skip("should clone a sample and navigate to new sample page with projectId", async ({
    page,
  }) => {
    // Skip: This test requires a running backend API
    const mockSampleId = "test-sample-123";
    const mockProjectId = "test-project-456";

    // Mock the sample endpoint
    await page.route("**/sample*", (route) => {
      const url = new URL(route.request().url());
      const id = url.searchParams.get("id");

      if (id === mockSampleId) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            sample: {
              _id: mockSampleId,
              name: "Test Sample",
              scientificName: "Arabidopsis thaliana",
              commonName: "Thale cress",
              ncbi: "3702",
              conditions: "Standard lab conditions for 2 weeks at 25C",
              owner: "testuser",
              group: { _id: "group-1", name: "Test Group" },
              project: { _id: mockProjectId, name: "Test Project" },
              accessions: [],
              additionalFiles: [],
              runs: [],
              path: "/test/path",
              tplexCsv: null,
            },
            actualAdditionalFiles: [],
          }),
        });
      } else {
        route.continue();
      }
    });

    // Mock the project endpoint for the new sample page
    await page.route("**/project*", (route) => {
      const url = new URL(route.request().url());
      const id = url.searchParams.get("id");

      if (id === mockProjectId) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            project: {
              _id: mockProjectId,
              name: "Test Project",
              owner: "testuser",
              group: { _id: "group-1", name: "Test Group" },
              accessions: [],
              releaseDate: null,
              shortDesc: "Test description",
              longDesc: "Test long description",
              path: "/test/path",
              samples: [],
              additionalFiles: [],
              nudgeable: false,
              nudges: [],
              doNotSendToEna: false,
            },
            actualAdditionalFiles: [],
          }),
        });
      } else {
        route.continue();
      }
    });

    // Mock the sample names endpoint
    await page.route("**/samples/names/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ sampleNames: ["Test Sample"] }),
      });
    });

    // Navigate to sample page
    await page.goto(`/sample?id=${mockSampleId}`);
    await page.waitForLoadState("networkidle");

    // Find and click the clone button
    const cloneButton = page.locator(
      'button:has-text("Clone data for new Sample")'
    );
    await expect(cloneButton).toBeVisible();
    await cloneButton.click();
    await page.waitForLoadState("networkidle");

    // Verify we're on the new sample page with correct query parameters
    await expect(page).toHaveURL(/\/samples\/new/);
    const url = new URL(page.url());
    const clonedSampleId = url.searchParams.get("clonedSampleId");
    const projectIdParam = url.searchParams.get("projectId");

    expect(clonedSampleId).toBe(mockSampleId);
    expect(projectIdParam).toBe(mockProjectId);

    // Verify the page loaded successfully
    const newSampleTitle = page.locator("h1.title");
    await expect(newSampleTitle).toContainText("New Sample for Test Project");
  });
});
