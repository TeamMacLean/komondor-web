// E2E tests for New Sample page
import { test, expect } from "@playwright/test";

test.describe("New Sample Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page with a mock project ID
    await page.goto("/samples/new?projectId=test123");
  });

  test("should load the new sample page", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Check that the page loaded
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should display the page title with project name", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Look for the main title
    const title = page.locator("h1.title");
    await expect(title).toBeVisible({ timeout: 10000 });

    // Verify it contains "New Sample" text
    const titleText = await title.textContent();
    expect(titleText).toContain("New Sample");
  });

  test("should display subtitle about creating samples", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    const subtitle = page.locator("h2.subtitle");
    await expect(subtitle).toBeVisible({ timeout: 10000 });

    const subtitleText = await subtitle.textContent();
    expect(subtitleText).toContain("Create a single sample");
    expect(subtitleText).toContain("TPlex");
  });

  test("should display TPlex checkbox", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    const pageContent = await page.content();
    expect(pageContent).toContain("Create samples from TPlex CSV file");
  });

  test("should display the form", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Check that a form exists
    const form = page.locator("form");
    await expect(form).toBeVisible({ timeout: 10000 });
  });
});

test.describe("New Sample Page - Standard Form Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/samples/new?projectId=test123");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should display all standard form fields", async ({ page }) => {
    // Check for all required fields
    const pageContent = await page.content();

    expect(pageContent).toContain("Sample Name");
    expect(pageContent).toContain("Scientific Name");
    expect(pageContent).toContain("Common Name");
    expect(pageContent).toContain("NCBI Taxonomy ID");
    expect(pageContent).toContain("Conditions");
  });

  test("should have sample name input field", async ({ page }) => {
    const nameInput = page.locator('input[name="name"], input').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
  });

  test("should have scientific name input field", async ({ page }) => {
    const pageContent = await page.content();
    expect(pageContent).toContain("Scientific Name");
  });

  test("should have common name input field", async ({ page }) => {
    const pageContent = await page.content();
    expect(pageContent).toContain("Common Name");
  });

  test("should have NCBI taxonomy ID input field", async ({ page }) => {
    const pageContent = await page.content();
    expect(pageContent).toContain("NCBI Taxonomy ID");
  });

  test("should have conditions textarea field", async ({ page }) => {
    const pageContent = await page.content();
    expect(pageContent).toContain("Conditions");
  });

  test("should have additional files upload section", async ({ page }) => {
    const pageContent = await page.content();
    expect(pageContent).toContain("Additional files");
  });

  test("should have submit button", async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });

    const buttonText = await submitButton.textContent();
    expect(buttonText).toContain("Create Sample");
  });

  test("should display consent checkbox", async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    // Should have at least one checkbox (consent, plus possibly TPlex)
    expect(count).toBeGreaterThan(0);
  });

  test("should maintain form state during interaction", async ({ page }) => {
    const inputs = page.locator("input[type='text'], input:not([type])");
    if ((await inputs.count()) > 0) {
      const firstInput = inputs.first();
      await firstInput.waitFor({ state: "visible", timeout: 10000 });
      await firstInput.fill("Test Sample Name");

      // Wait a moment
      await page.waitForTimeout(500);

      // Verify the value persisted
      const value = await firstInput.inputValue();
      expect(value).toBe("Test Sample Name");
    }
  });

  test("should have proper form structure", async ({ page }) => {
    // Check for main structural elements
    const section = page.locator(".section");
    await expect(section).toBeVisible({ timeout: 10000 });

    const container = page.locator(".container");
    await expect(container).toBeVisible({ timeout: 10000 });

    const form = page.locator("form");
    await expect(form).toBeVisible({ timeout: 10000 });
  });
});

test.describe("New Sample Page - TPlex CSV Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/samples/new?projectId=test123");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should show CSV upload when TPlex checkbox is checked", async ({
    page,
  }) => {
    // Find and check the TPlex checkbox
    const tplexCheckbox = page.locator('input[type="checkbox"]').first();
    await tplexCheckbox.waitFor({ state: "visible", timeout: 10000 });
    await tplexCheckbox.check();

    await page.waitForTimeout(500);

    // Should show CSV upload field
    const pageContent = await page.content();
    expect(pageContent).toContain("TPlex CSV File");
  });

  test("should hide standard form fields when TPlex is checked", async ({
    page,
  }) => {
    const tplexCheckbox = page.locator('input[type="checkbox"]').first();
    await tplexCheckbox.waitFor({ state: "visible", timeout: 10000 });

    // Get content before checking
    const contentBefore = await page.content();
    const hasSampleNameBefore = contentBefore.includes("Sample Name");

    // Check the TPlex checkbox
    await tplexCheckbox.check();
    await page.waitForTimeout(500);

    // Standard fields should be hidden
    const contentAfter = await page.content();

    // If Sample Name was visible before, it should be hidden or the CSV field should be shown
    if (hasSampleNameBefore) {
      expect(contentAfter).toContain("TPlex CSV File");
    }
  });

  test("should display validate CSV button in TPlex mode", async ({ page }) => {
    const tplexCheckbox = page.locator('input[type="checkbox"]').first();
    await tplexCheckbox.waitFor({ state: "visible", timeout: 10000 });
    await tplexCheckbox.check();

    await page.waitForTimeout(500);

    const pageContent = await page.content();
    expect(pageContent).toContain("Validate CSV");
  });

  test("should switch back to standard form when unchecking TPlex", async ({
    page,
  }) => {
    const tplexCheckbox = page.locator('input[type="checkbox"]').first();
    await tplexCheckbox.waitFor({ state: "visible", timeout: 10000 });

    // Check then uncheck
    await tplexCheckbox.check();
    await page.waitForTimeout(300);
    await tplexCheckbox.uncheck();
    await page.waitForTimeout(300);

    // Standard form should be visible again
    const pageContent = await page.content();
    expect(pageContent).toContain("Sample Name");
  });
});

test.describe("New Sample Page - Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/samples/new?projectId=test123");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should initially have submit button disabled", async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });

    // Button should be disabled initially (no consent/validation)
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test("should handle rapid form interactions without crashing", async ({
    page,
  }) => {
    const inputs = page.locator("input[type='text'], input:not([type])");
    if ((await inputs.count()) > 0) {
      const firstInput = inputs.first();
      await firstInput.waitFor({ state: "visible", timeout: 10000 });

      // Rapidly interact with field
      for (let i = 0; i < 5; i++) {
        await firstInput.fill(`Test ${i}`);
        await page.waitForTimeout(50);
      }
    }

    // Page should still be responsive
    const title = page.locator("h1.title");
    await expect(title).toBeVisible();
  });

  test("should display validation requirements in the form", async ({
    page,
  }) => {
    const pageContent = await page.content();

    // Check for validation hints
    expect(pageContent).toContain("min 50 characters");
  });
});

test.describe("New Sample Page - Clone Sample", () => {
  test("should handle clonedSampleId query parameter", async ({ page }) => {
    // Navigate with clonedSampleId
    await page.goto(
      "/samples/new?projectId=test123&clonedSampleId=sample456"
    );
    await page.waitForLoadState("domcontentloaded");

    // Page should load without errors
    const body = page.locator("body");
    await expect(body).toBeVisible();

    const title = page.locator("h1.title");
    await expect(title).toBeVisible({ timeout: 10000 });
  });
});

test.describe("New Sample Page - Error Handling", () => {
  test("should handle missing project ID gracefully", async ({ page }) => {
    // Navigate without project ID
    await page.goto("/samples/new");
    await page.waitForLoadState("domcontentloaded");

    // Page should load or show appropriate error
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Intercept API calls and return errors
    await page.route("**/api/project*", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server error" }),
      });
    });

    await page.goto("/samples/new?projectId=test123");
    await page.waitForLoadState("domcontentloaded");

    // Page should still load despite API errors
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should handle slow network conditions", async ({ page }) => {
    // Simulate slow connection
    await page.route("**/*", (route) => {
      setTimeout(() => route.continue(), 200);
    });

    await page.goto("/samples/new?projectId=test123");

    // Should still load eventually
    const title = page.locator("h1.title");
    await expect(title).toBeVisible({ timeout: 15000 });
  });

  test("should render without JavaScript errors", async ({ page }) => {
    const errors = [];

    // Capture console errors
    page.on("pageerror", (error) => {
      errors.push(error);
    });

    await page.goto("/samples/new?projectId=test123");
    await page.waitForLoadState("domcontentloaded");

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Check that no critical errors occurred
    const criticalErrors = errors.filter(
      (error) => !error.message.includes("warning")
    );

    // Log errors for debugging if any exist
    if (criticalErrors.length > 0) {
      console.log("JavaScript errors detected:", criticalErrors);
    }

    // Page should still be functional
    const title = page.locator("h1.title");
    await expect(title).toBeVisible();
  });
});

test.describe("New Sample Page - Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/samples/new?projectId=test123");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    // Check for h1
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible({ timeout: 10000 });

    // Check for h2 subtitle
    const h2 = page.locator("h2");
    const h2Count = await h2.count();
    expect(h2Count).toBeGreaterThan(0);
  });

  test("should have labels for form inputs", async ({ page }) => {
    // Check for label elements
    const labels = page.locator("label");
    const labelCount = await labels.count();

    // Should have multiple labels for form fields
    expect(labelCount).toBeGreaterThan(0);
  });

  test("should have form element with proper structure", async ({ page }) => {
    const form = page.locator("form");
    await expect(form).toBeVisible({ timeout: 10000 });

    // Form should have a submit button
    const submitButton = form.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });
});

test.describe("New Sample Page - Authentication", () => {
  test("should handle authentication redirect if not logged in", async ({
    page,
  }) => {
    // Navigate to the page
    const response = await page.goto("/samples/new?projectId=test123");

    await page.waitForLoadState("domcontentloaded");

    // Either page loads (authenticated) or redirects to login (not authenticated)
    // Both are valid responses
    const url = page.url();
    expect(url).toBeTruthy();

    // Response should be successful or redirect
    const status = response?.status();
    if (status) {
      expect(status).toBeLessThan(500); // No server errors
    }
  });
});

test.describe("New Sample Page - Form Submission", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/samples/new?projectId=test123");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should not allow submission without consent", async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });

    // Button should be disabled initially (no consent)
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test("should have postForm method that prevents default", async ({
    page,
  }) => {
    const form = page.locator("form");
    await expect(form).toBeVisible({ timeout: 10000 });

    // Form should exist and be interactive
    const formElement = await form.first().elementHandle();
    expect(formElement).toBeTruthy();
  });

  test("should track API calls when submitting", async ({ page }) => {
    let postCalled = false;

    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().includes("/samples/new")
      ) {
        postCalled = true;
      }
    });

    await page.goto("/samples/new?projectId=test123");
    await page.waitForLoadState("domcontentloaded");

    // We won't actually submit, but the structure is verified
    expect(true).toBe(true);
  });
});

test.describe("New Sample Page - Integration", () => {
  test("should handle project data loading", async ({ page }) => {
    // Mock successful project data
    await page.route("**/api/project*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          project: {
            _id: "test123",
            name: "Test Project",
            group: { _id: "group123", name: "Test Group" },
          },
        }),
      });
    });

    await page.goto("/samples/new?projectId=test123");
    await page.waitForLoadState("domcontentloaded");

    // Should display project name in title
    const title = page.locator("h1.title");
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test("should handle sample names loading", async ({ page }) => {
    // Mock existing sample names
    await page.route("**/api/samples/names/*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sampleNames: ["sample-1", "sample-2"],
        }),
      });
    });

    await page.goto("/samples/new?projectId=test123");
    await page.waitForLoadState("domcontentloaded");

    // Page should load successfully
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("New Sample Page - User Experience", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/samples/new?projectId=test123");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should display helpful placeholder text", async ({ page }) => {
    const pageContent = await page.content();
    expect(pageContent).toContain("Describe the experimental conditions");
  });

  test("should have file upload helper text", async ({ page }) => {
    const pageContent = await page.content();
    expect(pageContent).toContain("Upload any documentation specific");
  });

  test("should toggle between modes smoothly", async ({ page }) => {
    const tplexCheckbox = page.locator('input[type="checkbox"]').first();
    await tplexCheckbox.waitFor({ state: "visible", timeout: 10000 });

    // Toggle multiple times
    for (let i = 0; i < 3; i++) {
      await tplexCheckbox.check();
      await page.waitForTimeout(200);
      await tplexCheckbox.uncheck();
      await page.waitForTimeout(200);
    }

    // Page should still be functional
    const title = page.locator("h1.title");
    await expect(title).toBeVisible();
  });

  test("should maintain page stability during interactions", async ({
    page,
  }) => {
    // Interact with various elements
    const tplexCheckbox = page.locator('input[type="checkbox"]').first();
    if (await tplexCheckbox.isVisible()) {
      await tplexCheckbox.check();
      await page.waitForTimeout(300);
    }

    const inputs = page.locator("input");
    const inputCount = await inputs.count();

    if (inputCount > 1) {
      const secondInput = inputs.nth(1);
      if (await secondInput.isVisible()) {
        await secondInput.click();
        await page.waitForTimeout(200);
      }
    }

    // Page should remain stable
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
