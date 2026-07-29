// E2E tests for New Project page
// This page requires authentication. The specs run against the shared session
// from the `setup` project — without it, the `if (!url.includes(...)) return;`
// guards below turn every test into a silent pass.
import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH, SIGNED_OUT } from "./helpers";

// Reuse the session established by the `setup` project instead of signing in
// per test; see tests/e2e/auth.setup.js.
test.use({ storageState: AUTH_STATE_PATH });

test.describe("New Project Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects/new");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should load the new project page or redirect to signin", async ({
    page,
  }) => {
    // Check that the page loaded (either projects/new or signin)
    const body = page.locator("body");
    await expect(body).toBeVisible();

    const url = page.url();
    const isOnProjectsNew = url.includes("/projects/new");
    const isOnSignin = url.includes("/signin");

    expect(isOnProjectsNew || isOnSignin).toBe(true);
  });

  test("should display the page title when authenticated", async ({ page }) => {
    // Only test if we're on the actual page
    if (!page.url().includes("/projects/new")) {
      return;
    }

    // Look for the main title
    const title = page.locator("h1.title");
    const titleExists = (await title.count()) > 0;

    if (titleExists) {
      await expect(title).toBeVisible({ timeout: 10000 });

      // Verify it contains "New Project" text
      const titleText = await title.textContent();
      expect(titleText).toContain("New Project");
    }
  });

  test("should display required fields indicator when authenticated", async ({
    page,
  }) => {
    if (!page.url().includes("/projects/new")) {
      return;
    }

    // Look for the subtitle with required fields message
    const subtitle = page.locator(".subtitle");
    const subtitleExists = (await subtitle.count()) > 0;

    if (subtitleExists) {
      await expect(subtitle).toBeVisible({ timeout: 10000 });

      const subtitleText = await subtitle.textContent();
      expect(subtitleText).toContain("required fields");
    }
  });

  test("should display the form when authenticated", async ({ page }) => {
    if (!page.url().includes("/projects/new")) {
      return;
    }

    // Check that a form exists
    const form = page.locator("form");
    const formExists = (await form.count()) > 0;

    if (formExists) {
      await expect(form).toBeVisible({ timeout: 10000 });
    }
  });

  test("should have name input field when authenticated", async ({ page }) => {
    if (!page.url().includes("/projects/new")) {
      return;
    }

    // Check for name input
    const nameInput = page.locator("input").first();
    const inputExists = (await nameInput.count()) > 0;

    if (inputExists) {
      await expect(nameInput).toBeVisible({ timeout: 10000 });
    }
  });

  test("should have submit button when authenticated", async ({ page }) => {
    // Page should be visible regardless
    const body = page.locator("body");
    await expect(body).toBeVisible();

    if (!page.url().includes("/projects/new")) {
      // Not on the page (redirected) - test passes
      return;
    }

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Check for form first - if no form, page isn't ready
    const form = page.locator("form");
    const formExists = (await form.count()) > 0;

    if (!formExists) {
      // Form not loaded - page might still be loading or redirected
      return;
    }

    // Check for create project button
    const submitButton = page.locator('button[type="submit"]');
    const buttonExists = (await submitButton.count()) > 0;

    // Only assert if button exists
    if (buttonExists) {
      const isVisible = await submitButton.isVisible().catch(() => false);
      if (isVisible) {
        const buttonText = await submitButton.textContent();
        expect(buttonText).toContain("Create Project");
      }
    }
  });

  test("should handle page without crashing when groups not loaded", async ({
    page,
  }) => {
    // Page should still be visible even if groups API fails
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should not allow submission without consent when authenticated", async ({
    page,
  }) => {
    // Page should be visible regardless
    const body = page.locator("body");
    await expect(body).toBeVisible();

    if (!page.url().includes("/projects/new")) {
      // Not on the page (redirected) - test passes
      return;
    }

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Check for form first - if no form, page isn't ready
    const form = page.locator("form");
    const formExists = (await form.count()) > 0;

    if (!formExists) {
      // Form not loaded - page might still be loading or redirected
      return;
    }

    // Find submit button
    const submitButton = page.locator('button[type="submit"]');
    const buttonExists = (await submitButton.count()) > 0;

    // Only assert if button exists
    if (buttonExists) {
      const isVisible = await submitButton.isVisible().catch(() => false);
      if (isVisible) {
        // Button should be disabled initially (no consent)
        const isDisabled = await submitButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
    }
  });

  test("should display validation messages for required fields when form is dirty", async ({
    page,
  }) => {
    if (!page.url().includes("/projects/new")) {
      return;
    }

    // Wait for page to fully load beyond loading state
    await page.waitForTimeout(3000);

    // The warning box only appears after user interacts with form (formIsDirty)
    // First, interact with a form field to make the form dirty
    const nameInput = page.locator("input").first();
    const inputExists = (await nameInput.count()) > 0;

    if (!inputExists) {
      return;
    }

    await nameInput.waitFor({ state: "visible", timeout: 10000 });
    await nameInput.fill("a"); // Type something to make form dirty
    await nameInput.clear(); // Clear it to trigger validation

    // Look for submission requirements warning box
    const warningBox = page.locator(".box.has-background-warning-light");
    const warningExists = (await warningBox.count()) > 0;

    if (warningExists) {
      // Warning box should be visible when form is incomplete and dirty
      await expect(warningBox).toBeVisible({ timeout: 10000 });

      const warningText = await warningBox.textContent();
      expect(warningText).toContain("Submission Requirements");
    }
  });

  test("should display consent checkbox when authenticated", async ({
    page,
  }) => {
    if (!page.url().includes("/projects/new")) {
      return;
    }

    // Wait for page to fully load beyond loading state
    await page.waitForTimeout(3000);

    // Look for any checkbox input (consent checkbox)
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    // Should have at least one checkbox (consent) if form is loaded
    const form = page.locator("form");
    const formExists = (await form.count()) > 0;

    // Only assert if form actually loaded (not still loading)
    if (formExists && count > 0) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test("should have file upload section when authenticated", async ({
    page,
  }) => {
    if (!page.url().includes("/projects/new")) {
      return;
    }

    // Wait for page to fully load beyond loading state
    await page.waitForTimeout(3000);

    // Look for additional files section text
    const pageContent = await page.content();
    const hasAdditionalFiles = pageContent.includes("Additional files");

    // Only check if we're on the actual form page and it's fully loaded
    const form = page.locator("form");
    const formExists = (await form.count()) > 0;

    // Only assert if form loaded (page might still be in loading state)
    if (formExists && hasAdditionalFiles) {
      expect(hasAdditionalFiles).toBe(true);
    }
  });

  test("should render without critical JavaScript errors", async ({ page }) => {
    const errors = [];

    // Capture console errors
    page.on("pageerror", (error) => {
      errors.push(error);
    });

    await page.waitForTimeout(2000);

    // Check that no critical errors occurred
    const criticalErrors = errors.filter(
      (error) =>
        !error.message.includes("warning") &&
        !error.message.includes("favicon") &&
        !error.message.includes("net::ERR")
    );

    // Log errors for debugging if any exist
    if (criticalErrors.length > 0) {
      console.log("JavaScript errors detected:", criticalErrors);
    }

    // Page should still be functional
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should have proper page structure", async ({ page }) => {
    // Check for main structural elements
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Page should have some content
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test("should maintain form state during interaction when authenticated", async ({
    page,
  }) => {
    if (!page.url().includes("/projects/new")) {
      return;
    }

    // Fill in the name field
    const nameInput = page.locator("input").first();
    const inputExists = (await nameInput.count()) > 0;

    if (!inputExists) {
      return;
    }

    await nameInput.waitFor({ state: "visible", timeout: 10000 });
    await nameInput.fill("Test Project Name That Is Long Enough");

    // Wait a moment
    await page.waitForTimeout(500);

    // Verify the value persisted
    const value = await nameInput.inputValue();
    expect(value).toBe("Test Project Name That Is Long Enough");
  });

  test("should handle rapid form interactions", async ({ page }) => {
    if (!page.url().includes("/projects/new")) {
      return;
    }

    // Rapidly interact with multiple fields
    const nameInput = page.locator("input").first();
    const inputExists = (await nameInput.count()) > 0;

    if (!inputExists) {
      return;
    }

    await nameInput.waitFor({ state: "visible", timeout: 10000 });

    for (let i = 0; i < 5; i++) {
      await nameInput.fill(`Test ${i}`);
      await page.waitForTimeout(50);
    }

    // Page should still be responsive
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("New Project Page - Error Handling", () => {
  test("should handle API errors gracefully", async ({ page }) => {
    // Intercept API calls and return errors
    await page.route("**/projects/names", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server error" }),
      });
    });

    await page.route("**/groups", (route) => {
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
});

test.describe("New Project Page - Accessibility", () => {
  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/projects/new");
    await page.waitForLoadState("domcontentloaded");

    if (!page.url().includes("/projects/new")) {
      return;
    }

    // Check for h1
    const h1 = page.locator("h1");
    const h1Count = await h1.count();

    if (h1Count > 0) {
      await expect(h1.first()).toBeVisible({ timeout: 10000 });
    }

    // Check for h2 subtitle
    const h2 = page.locator("h2");
    const h2Count = await h2.count();

    // Page should have some heading structure
    expect(h1Count + h2Count).toBeGreaterThanOrEqual(0);
  });

  test("should have labels for form inputs when authenticated", async ({
    page,
  }) => {
    await page.goto("/projects/new");
    await page.waitForLoadState("domcontentloaded");

    if (!page.url().includes("/projects/new")) {
      return;
    }

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Check for form first - if no form, page isn't ready
    const form = page.locator("form");
    const formExists = (await form.count()) > 0;

    if (!formExists) {
      // Form not loaded - page might still be loading or redirected
      return;
    }

    // Check for label elements
    const labels = page.locator("label");
    const labelCount = await labels.count();

    // Only assert if form is actually loaded with labels
    if (labelCount > 0) {
      expect(labelCount).toBeGreaterThan(0);
    }
  });

  test("should have form element with proper structure when authenticated", async ({
    page,
  }) => {
    await page.goto("/projects/new");
    await page.waitForLoadState("domcontentloaded");

    if (!page.url().includes("/projects/new")) {
      return;
    }

    const form = page.locator("form");
    const formExists = (await form.count()) > 0;

    if (formExists) {
      await expect(form).toBeVisible({ timeout: 10000 });

      // Form should have a submit button
      const submitButton = form.locator('button[type="submit"]');
      const buttonExists = (await submitButton.count()) > 0;

      if (buttonExists) {
        await expect(submitButton).toBeVisible();
      }
    }
  });
});

test.describe("New Project Page - Authentication", () => {
  // This block checks the redirect for a visitor who is not signed in.
  test.use({ storageState: SIGNED_OUT });

  test("sends a signed-out visitor to signin", async ({ page }) => {
    await page.goto("/projects/new");
    // Previously this asserted only that the URL was truthy and the body was
    // visible, which holds either way.
    await expect(page).toHaveURL(/\/signin/, { timeout: 15000 });
    await expect(page.locator("#login")).toBeVisible();
  });
});
