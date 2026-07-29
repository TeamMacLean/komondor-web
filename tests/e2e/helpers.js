import { expect } from "@playwright/test";

export const ADMIN_USER = process.env.E2E_ADMIN_USER || "testadmin";
export const ADMIN_PASS = process.env.E2E_ADMIN_PASS || "testpass";

/** Where `auth.setup.js` saves the shared authenticated session. */
export const AUTH_STATE_PATH = "playwright/.auth/user.json";

/** Starts a spec from a clean, signed-out browser context. */
export const SIGNED_OUT = { cookies: [], origins: [] };

/**
 * Signs in through the real form and waits for the session to settle.
 *
 * Most specs in this directory used to navigate straight to a guarded page and
 * then bail out — `if (!page.url().includes("/x")) return;` — which reports a
 * pass without asserting anything. Calling this first means those assertions
 * actually run.
 */
export async function signIn(
  page,
  { username = ADMIN_USER, password = ADMIN_PASS } = {}
) {
  await page.goto("/signin");
  await page.locator('input[type="text"]').first().fill(username);
  await page.locator('input[type="password"]').first().fill(password);

  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/login") && r.request().method() === "POST"
    ),
    page.locator('button[type="submit"]').first().click(),
  ]);

  // @nuxtjs/auth fetches /me before the session is usable.
  await page.waitForResponse((r) => r.url().includes("/me")).catch(() => {});

  // Leaving /signin is the observable signal that the session took. A regex
  // like /\/(?!signin)/ does not test this — it matches the "//" in
  // "http://localhost:3000/signin".
  await expect(page).not.toHaveURL(/\/signin/, { timeout: 15000 });
}

/**
 * Waits for the SPA to render past its loading shell.
 *
 * `render.ssr` is false, so every route — including unknown ones — is served as
 * the same 200 HTML shell. Asserting on the HTTP status therefore proves
 * nothing; wait for content instead.
 */
export async function waitForApp(page, timeout = 15000) {
  await page.waitForLoadState("domcontentloaded");
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
}

/**
 * The observer that records Buefy toasts as they mount.
 *
 * Buefy appends `div.toast` into a `div.notices` container it creates on
 * demand, then removes it on a timer — so toasts have to be recorded as they
 * appear. Both the container and the toast arrive as mutations, so each toast
 * is deduplicated by element identity; counting text would merge two identical
 * toasts, which is exactly the case these tests exist to detect.
 *
 * Dialogs are deliberately excluded: a confirm prompt is not a notification.
 */
const TOAST_RECORDER = () => {
  window.__toasts = [];
  const seen = new WeakSet();

  const record = (element) => {
    if (!element || seen.has(element)) return;
    seen.add(element);
    window.__toasts.push(element.innerText.trim());
  };

  const observer = new MutationObserver((records) => {
    for (const record_ of records) {
      for (const node of record_.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches?.(".toast")) record(node);
        node.querySelectorAll?.(".toast").forEach(record);
      }
    }
  });

  window.__toastObserver = observer;

  // As an init script this runs before the document has a body, and
  // `observe(null)` throws — which would silently disable the recorder.
  const start = () => {
    document.querySelectorAll(".toast").forEach(record);
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.body) {
    start();
  } else {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  }
};

/**
 * Collects the Buefy toasts raised while `action` runs.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Function} action
 * @param {object} [options]
 * @param {boolean} [options.acrossNavigation=false] - Set when `action`
 *   navigates: a new document wipes `window`, so the recorder is installed as
 *   an init script instead of a one-off evaluate.
 * @returns {Promise<string[]>} One entry per toast, in the order they appeared.
 */
export async function captureToasts(
  page,
  action,
  { acrossNavigation = false } = {}
) {
  if (acrossNavigation) {
    await page.addInitScript(TOAST_RECORDER);
  } else {
    await page.evaluate(TOAST_RECORDER);
  }

  await action();

  // Toasts mount a tick after the promise that triggered them settles.
  await page.waitForTimeout(700);

  return page.evaluate(() => {
    window.__toastObserver?.disconnect();
    return window.__toasts || [];
  });
}
