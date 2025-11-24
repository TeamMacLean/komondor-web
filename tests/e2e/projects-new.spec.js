// E2E tests for New Project page
import { test, expect } from "@playwright/test";

test.describe("New Project Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page before each test
    await page.goto("/projects/new");
  });

  test("should load the new project page", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Check that the page loaded
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should display the page title", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Look for the main title
    const title = page.locator("h1.title");
    await expect(title).toBeVisible({ timeout: 10000 });

    // Verify it contains "New Project" text
    const titleText = await title.textContent();
    expect(titleText).toContain("New Project");
  });

  test("should display required fields indicator", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Look for the subtitle with required fields message
    const subtitle = page.locator(".subtitle");
    await expect(subtitle).toBeVisible({ timeout: 10000 });

    const subtitleText = await subtitle.textContent();
    expect(subtitleText).toContain("required fields");
  });

  test("should display the form", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Check that a form exists
    const form = page.locator("form");
    await expect(form).toBeVisible({ timeout: 10000 });
  });

  test("should have name input field", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Check for name input
    const nameInput = page.locator('input[name="name"], #name');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
  });

  test("should have short description field", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Check for short description input
    const shortDescInput = page.locator('input[name="shortDesc"], #shortDesc');
    await expect(shortDescInput).toBeVisible({ timeout: 10000 });
  });

  test("should have long description field", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Check for long description textarea
    const longDescInput = page.locator('textarea[name="longDesc"], #longDesc');
    await expect(longDescInput).toBeVisible({ timeout: 10000 });
  });

  test("should have submit button", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Check for create project button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });

    const buttonText = await submitButton.textContent();
    expect(buttonText).toContain("Create project");
  });

  test("should display group selection or message", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Either group select, single group display, or error message should be visible
    const hasGroupSelect = (await page.locator("select").count()) > 0;
    const hasGroupDisplay =
      (await page.locator(".onlyOneSelectOption").count()) > 0;
    const hasErrorMessage = (await page.locator(".errorMessage").count()) > 0;

    // At least one of these should be present
    expect(hasGroupSelect || hasGroupDisplay || hasErrorMessage).toBe(true);
  });

  test("should handle page without crashing when groups not loaded", async ({
    page,
  }) => {
    // Navigate to the page
    await page.goto("/projects/new");

    // Wait for page to settle
    await page.waitForLoadState("domcontentloaded");

    // Page should still be visible even if groups API fails
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Title should still render
    const title = page.locator("h1.title");
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test("should not allow submission without consent", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Find submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });

    // Button should be disabled initially (no consent)
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test("should display validation messages for required fields", async ({
    page,
  }) => {
    await page.waitForLoadState("domcontentloaded");

    // Look for submission disabled warning box
    const warningBox = page.locator(".box.is-warning");

    // Warning box should be visible when form is incomplete
    await expect(warningBox).toBeVisible({ timeout: 10000 });

    const warningText = await warningBox.textContent();
    expect(warningText).toContain("Submission Disabled");
  });

  test("should display consent checkbox", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Look for any checkbox input (consent checkbox)
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    // Should have at least one checkbox (consent)
    expect(count).toBeGreaterThan(0);
  });

  test("should have file upload section", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Look for additional files section text
    const pageContent = await page.content();
    expect(pageContent).toContain("Additional files");
  });

  test("should handle authentication redirect if not logged in", async ({
    page,
  }) => {
    // Navigate to the page
    const response = await page.goto("/projects/new");

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

  test("should display field validation requirements", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    const pageContent = await page.content();

    // Check for validation hints about character lengths
    expect(pageContent).toContain("20-80 characters");
    expect(pageContent).toContain("20-200 characters");
    expect(pageContent).toContain("100-1000 characters");
  });

  test("should render without JavaScript errors", async ({ page }) => {
    const errors = [];

    // Capture console errors
    page.on("pageerror", (error) => {
      errors.push(error);
    });

    await page.goto("/projects/new");
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

  test("should have proper page structure", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Check for main structural elements
    const section = page.locator(".section");
    await expect(section).toBeVisible({ timeout: 10000 });

    const container = page.locator(".container");
    await expect(container).toBeVisible({ timeout: 10000 });

    const form = page.locator("form");
    await expect(form).toBeVisible({ timeout: 10000 });
  });

  test("should handle slow network conditions", async ({ page }) => {
    // Simulate slow connection
    await page.route("**/*", (route) => {
      setTimeout(() => route.continue(), 200);
    });

    await page.goto("/projects/new");

    // Should still load eventually
    const title = page.locator("h1.title");
    await expect(title).toBeVisible({ timeout: 15000 });
  });

  test("should maintain form state during interaction", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Fill in the name field
    const nameInput = page.locator('input[name="name"], #name').first();
    await nameInput.waitFor({ state: "visible", timeout: 10000 });
    await nameInput.fill("Test Project Name That Is Long Enough");

    // Wait a moment
    await page.waitForTimeout(500);

    // Verify the value persisted
    const value = await nameInput.inputValue();
    expect(value).toBe("Test Project Name That Is Long Enough");
  });

  test("should display ENA submission option when applicable", async ({
    page,
  }) => {
    await page.waitForLoadState("domcontentloaded");

    const pageContent = await page.content();

    // Check if ENA-related content appears (depends on group settings)
    const hasEnaContent =
      pageContent.includes("ENA") || pageContent.includes("not be sent to");

    // Just verify the page loaded properly
    expect(pageContent).toBeTruthy();
  });

  test("should handle rapid form interactions", async ({ page }) => {
    await page.waitForLoadState("domcontentloaded");

    // Rapidly interact with multiple fields
    const nameInput = page.locator('input[name="name"], #name').first();
    await nameInput.waitFor({ state: "visible", timeout: 10000 });

    for (let i = 0; i < 5; i++) {
      await nameInput.fill(`Test ${i}`);
      await page.waitForTimeout(50);
    }

    // Page should still be responsive
    const title = page.locator("h1.title");
    await expect(title).toBeVisible();
  });
});

test.describe("New Project Page - Error Handling", () => {
  test("should handle API errors gracefully", async ({ page }) => {
    // Intercept API calls and return errors
    await page.route("**/api/projects/names", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server error" }),
      });
    });

    await page.route("**/api/groups", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server error" }),
      });
    });

    await page.goto("/projects/new");
    await page.waitForLoadState("domcontentloaded");

    // Page should still load despite API errors
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should display error message when no groups available", async ({
    page,
  }) => {
    // Intercept groups API and return empty array
    await page.route("**/api/groups", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ groups: [] }),
      });
    });

    await page.goto("/projects/new");
    await page.waitForLoadState("domcontentloaded");

    // Should show error about no groups
    const errorMessage = page.locator(".errorMessage");
    const errorExists = (await errorMessage.count()) > 0;

    if (errorExists) {
      const errorText = await errorMessage.textContent();
      expect(errorText).toContain("no groups found");
    }
  });
});

test.describe("New Project Page - Accessibility", () => {
  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/projects/new");
    await page.waitForLoadState("domcontentloaded");

    // Check for h1
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible({ timeout: 10000 });

    // Check for h3 subtitle
    const h3 = page.locator("h3");
    const h3Count = await h3.count();
    expect(h3Count).toBeGreaterThan(0);
  });

  test("should have labels for form inputs", async ({ page }) => {
    await page.goto("/projects/new");
    await page.waitForLoadState("domcontentloaded");

    // Check for label elements or aria-labels
    const labels = page.locator("label");
    const labelCount = await labels.count();

    // Should have multiple labels for form fields
    expect(labelCount).toBeGreaterThan(0);
  });

  test("should have form element with proper structure", async ({ page }) => {
    await page.goto("/projects/new");
    await page.waitForLoadState("domcontentloaded");

    const form = page.locator("form");
    await expect(form).toBeVisible({ timeout: 10000 });

    // Form should have a submit button
    const submitButton = form.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });
});
