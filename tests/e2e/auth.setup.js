import { test as setup } from "@playwright/test";
import { signIn, AUTH_STATE_PATH } from "./helpers";

/**
 * Signs in once and saves the session for the specs that need it.
 *
 * Signing in inside each test's `beforeEach` meant roughly 120 form logins per
 * run against a single dev server, which was slow and intermittently timed out
 * under parallel load. Specs opt in with
 * `test.use({ storageState: AUTH_STATE_PATH })`.
 */
setup("authenticate", async ({ page }) => {
  await signIn(page);
  await page.context().storageState({ path: AUTH_STATE_PATH });
});
