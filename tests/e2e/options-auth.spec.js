import { test, expect } from "@playwright/test";

/**
 * komondor-api now requires a bearer token for POST/DELETE on /options/*.
 * Those routes were previously unauthenticated, and nothing in the admin page
 * sets an Authorization header explicitly — it relies entirely on @nuxtjs/auth
 * attaching one to the shared axios instance.
 *
 * These tests prove that header is actually present on the wire. The requests
 * are intercepted and fulfilled locally, so no option is written to or removed
 * from the database.
 */

const ADMIN_USER = process.env.E2E_ADMIN_USER || "testadmin";
const ADMIN_PASS = process.env.E2E_ADMIN_PASS || "testpass";

/** Logs in through the real signin form and waits for the session to settle. */
async function signIn(page) {
  await page.goto("/signin");
  await page.locator('input[type="text"]').first().fill(ADMIN_USER);
  await page.locator('input[type="password"]').first().fill(ADMIN_PASS);
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/login") && r.request().method() === "POST"
    ),
    page.locator('button[type="submit"]').first().click(),
  ]);
  // The auth module fetches /me before the session is usable.
  await page.waitForResponse((r) => r.url().includes("/me")).catch(() => {});
}

test.describe("admin options writes carry an auth token", () => {
  test("POST /options/* sends an Authorization header", async ({ page }) => {
    let captured = null;

    await page.route("**/options/sequencingtechnology", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        return route.continue();
      }
      // Capture and answer locally — nothing reaches the database.
      captured = {
        authorization:
          request.headers()["authorization"] ||
          request.headers()["Authorization"] ||
          null,
        body: request.postData(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ doc: { _id: "stub", value: "E2E_STUB" } }),
      });
    });

    await signIn(page);
    await page.goto("/admin");
    await expect(
      page.locator("label.label", { hasText: /^Sequencing technologies$/ })
    ).toBeVisible();

    // "New" under the Sequencing technologies field opens a prompt dialog.
    await page
      .locator("div.field", { hasText: "Sequencing technologies" })
      .getByRole("button", { name: "New" })
      .first()
      .click();

    const dialog = page.locator(".modal.is-active, .dialog").first();
    await expect(dialog).toBeVisible();
    await dialog.locator("input").first().fill("E2E_STUB");
    await dialog.getByRole("button", { name: /^OK$/i }).click();

    await expect.poll(() => captured, { timeout: 10000 }).not.toBeNull();

    expect(captured.authorization).toBeTruthy();
    expect(captured.authorization).toMatch(/^Bearer .+/);
    expect(JSON.parse(captured.body)).toMatchObject({ value: "E2E_STUB" });
  });

  test("DELETE /options/* sends an Authorization header", async ({ page }) => {
    let captured = null;

    await page.route("**/options/sequencingtechnology", async (route) => {
      const request = route.request();
      if (request.method() !== "DELETE") {
        return route.continue();
      }
      captured = {
        authorization: request.headers()["authorization"] || null,
        body: request.postData(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      });
    });

    await signIn(page);
    await page.goto("/admin");
    await expect(
      page.locator("label.label", { hasText: /^Sequencing technologies$/ })
    ).toBeVisible();

    // Each existing option renders as a closable tag; closing one deletes it.
    const firstTagClose = page
      .locator("div.field", { hasText: "Sequencing technologies" })
      .locator(".tag.is-delete, .delete")
      .first();
    await firstTagClose.click();

    // Deletion is behind a confirm dialog.
    const confirm = page.locator(".modal.is-active, .dialog").first();
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: /^OK$/i }).click();

    await expect.poll(() => captured, { timeout: 10000 }).not.toBeNull();

    expect(captured.authorization).toMatch(/^Bearer .+/);
  });
});

/**
 * The tests above stub the API out. This one lets the request run all the way
 * through to a live komondor-api, which is the only way to prove the token the
 * browser sends is one the API actually accepts.
 *
 * It creates a uniquely-named option and then deletes it, so the collection is
 * left exactly as it was found.
 */
test.describe.serial("admin options round-trip against a live API", () => {
  const OPTION_NAME = `E2E_ROUNDTRIP_${Date.now()}`;

  test("creates and then deletes an option end to end", async ({ page }) => {
    const statuses = [];
    page.on("response", (response) => {
      if (response.url().includes("/options/sequencingtechnology")) {
        statuses.push({
          method: response.request().method(),
          status: response.status(),
        });
      }
    });

    await signIn(page);
    await page.goto("/admin");
    const field = page.locator("div.field", {
      hasText: "Sequencing technologies",
    });
    await expect(
      page.locator("label.label", { hasText: /^Sequencing technologies$/ })
    ).toBeVisible();

    // --- create ---
    await field.getByRole("button", { name: "New" }).first().click();
    const prompt = page.locator(".modal.is-active, .dialog").first();
    await expect(prompt).toBeVisible();
    await prompt.locator("input").first().fill(OPTION_NAME);
    await prompt.getByRole("button", { name: /^OK$/i }).click();

    // The option is only visible if the API accepted the write.
    await expect(field.getByText(OPTION_NAME)).toBeVisible({ timeout: 10000 });

    const post = statuses.find((s) => s.method === "POST");
    expect(post, "a POST should have been sent").toBeTruthy();
    expect(post.status, "POST must not be rejected as unauthorised").toBe(200);

    // --- delete, restoring the collection ---
    // Each option is one <li> containing a closable tag; the close control
    // lives inside that tag.
    await field
      .locator("li", { hasText: OPTION_NAME })
      .locator("a.delete, .delete")
      .first()
      .click();

    const confirm = page.locator(".modal.is-active, .dialog").first();
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: /^OK$/i }).click();

    await expect(field.getByText(OPTION_NAME)).toHaveCount(0, {
      timeout: 10000,
    });

    const del = statuses.find((s) => s.method === "DELETE");
    expect(del, "a DELETE should have been sent").toBeTruthy();
    expect(del.status, "DELETE must not be rejected as unauthorised").toBe(200);
  });
});
