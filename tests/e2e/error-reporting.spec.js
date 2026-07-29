import { test, expect } from "@playwright/test";
import { signIn, waitForApp, captureToasts } from "./helpers";

/**
 * End-to-end cover for how API failures reach the user.
 *
 * Two things used to go wrong and only show up when the interceptor and the
 * component ran together, which is why this is an e2e spec:
 *
 *  1. The global interceptor toasted for every status code and then re-rejected,
 *     so a handled error produced two toasts.
 *  2. It read `data.message`, which no route but /login sends, so its half of
 *     the pair was always the generic fallback and the API's real reason was
 *     discarded.
 *
 * The API requests below are intercepted and answered locally, so nothing is
 * written to or removed from the database.
 */

test.describe("API errors reach the user once, with the API's own reason", () => {
  test("a failed login shows the API's message, not axios's", async ({
    page,
  }) => {
    await page.goto("/signin");
    await waitForApp(page);

    await page.locator('input[type="text"]').first().fill("testadmin");
    await page
      .locator('input[type="password"]')
      .first()
      .fill("definitely-wrong");
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/login") && r.request().method() === "POST"
      ),
      page.locator('button[type="submit"]').first().click(),
    ]);

    const message = page.locator("#login .message, #login article").first();
    await expect(message).toContainText("Bad credentials");
    // The regression: SigninCard assigned the raw axios error to `error`.
    await expect(message).not.toContainText("status code");
  });

  test("a rejected option shows the API's reason exactly once", async ({
    page,
  }) => {
    await page.route("**/options/sequencingtechnology", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: '"value" is required and must be a non-empty string',
          detail: '"value" is required and must be a non-empty string',
          requestId: "e2e-stub",
        }),
      });
    });

    await signIn(page);
    await page.goto("/admin");
    await waitForApp(page);
    await expect(
      page.locator("label.label", { hasText: /^Sequencing technologies$/ })
    ).toBeVisible();

    const toasts = await captureToasts(page, async () => {
      await page
        .locator("div.field", { hasText: "Sequencing technologies" })
        .getByRole("button", { name: "New" })
        .first()
        .click();

      const dialog = page.locator(".modal.is-active, .dialog").first();
      await expect(dialog).toBeVisible();
      await dialog.locator("input").first().fill("E2E_STUB");
      await dialog.getByRole("button", { name: /^OK$/i }).click();
    });

    // Was two: a generic one from the interceptor plus "Failed to save option".
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toContain(
      '"value" is required and must be a non-empty string'
    );
    expect(toasts[0]).not.toContain("Invalid request");
  });

  test("a 404 on delete is reported, not swallowed as success", async ({
    page,
  }) => {
    await page.route("**/options/sequencingtechnology", async (route) => {
      if (route.request().method() !== "DELETE") return route.continue();
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Option not found",
          requestId: "e2e-stub",
        }),
      });
    });

    await signIn(page);
    await page.goto("/admin");
    await waitForApp(page);

    const field = page.locator("div.field", {
      hasText: "Sequencing technologies",
    });
    await expect(field).toBeVisible();

    const toasts = await captureToasts(page, async () => {
      await field.locator(".tag .delete, .tag button.delete").first().click();

      const dialog = page.locator(".modal.is-active, .dialog").first();
      await expect(dialog).toBeVisible();
      await dialog
        .getByRole("button", { name: /^(OK|Delete|Confirm)$/i })
        .first()
        .click();
    });

    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toContain("Option not found");
    expect(toasts[0]).not.toContain("Deleted:");
  });

  test("an unreachable API is reported once, not five times", async ({
    page,
  }) => {
    await signIn(page);

    // /admin dispatches five option refreshes at once on mount.
    await page.route("**/options/**", (route) => route.abort("failed"));

    const toasts = await captureToasts(
      page,
      async () => {
        await page.goto("/admin");
        await waitForApp(page);
        await page.waitForTimeout(1500);
      },
      { acrossNavigation: true }
    );

    const networkToasts = toasts.filter((text) =>
      text.includes("Unable to reach the server")
    );
    // One per failed request before the cooldown was added — five on this page.
    expect(networkToasts).toHaveLength(1);
  });
});
