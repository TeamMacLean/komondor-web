import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./helpers";

/**
 * Proves a file actually reaches komondor-api over tus.
 *
 * Nothing else in this suite uploads anything, which left the app's primary
 * function without end-to-end cover. It also leaves the tus request headers
 * untested — the Uppy config used to send "Access-Control-Allow-Origin: *" as a
 * *request* header, which is meaningless and forced a CORS preflight; this test
 * is what backs the claim that removing it was safe.
 *
 * The upload is real: it writes a small text file into komondor-api's `files`
 * directory. Nothing is submitted, so no project, sample or run is created.
 */

test.use({ storageState: AUTH_STATE_PATH });

/** Uppy renders a hidden multi-file input inside its dashboard. */
const UPPY_INPUT = "input.uppy-Dashboard-input";

test.describe("Uppy/tus upload", () => {
  test("uploads a file to the API and reports completion", async ({ page }) => {
    const tusResponses = [];
    page.on("response", (response) => {
      if (response.url().includes("/uploads")) {
        tusResponses.push({
          method: response.request().method(),
          status: response.status(),
        });
      }
    });

    await page.goto("/projects/new");
    await expect(page.locator(".uppy-Dashboard").first()).toBeVisible({
      timeout: 20000,
    });

    // autoProceed is true, so setting the input starts the upload immediately.
    await page
      .locator(UPPY_INPUT)
      .first()
      .setInputFiles({
        name: "e2e-upload-probe.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("komondor-web e2e upload probe\n"),
      });

    // tus creates the upload with POST, then writes it with PATCH.
    await expect
      .poll(() => tusResponses.some((r) => r.method === "PATCH"), {
        timeout: 30000,
      })
      .toBe(true);

    const creation = tusResponses.find((r) => r.method === "POST");
    const write = tusResponses.find((r) => r.method === "PATCH");

    expect(creation, "tus should create the upload").toBeTruthy();
    expect(creation.status).toBe(201);
    expect(write.status).toBe(204);

    // Uppy reports success through the component, which is what the submit
    // handlers read when deciding whether the form can be sent.
    const uploaded = await page.evaluate(async () => {
      const find = (vm) => {
        if (vm.getFiles && vm.uppyInstance) return vm;
        for (const child of vm.$children || []) {
          const found = find(child);
          if (found) return found;
        }
        return null;
      };
      const uploader = find(window.$nuxt);
      if (!uploader) return { error: "uploader component not found" };

      // Give Uppy a moment to settle its post-upload state.
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        files: uploader.getFiles(),
        complete: uploader.isUploadComplete
          ? uploader.isUploadComplete()
          : null,
      };
    });

    expect(uploaded.error).toBeUndefined();
    expect(uploaded.files).toHaveLength(1);

    // getFiles() returns Uppy's own file objects, decorated with `uploadName`
    // taken from the tus upload URL — that name is what the submit handlers send
    // to the API, so it has to be present for a form to be submittable.
    const [file] = uploaded.files;
    expect(file.name).toBe("e2e-upload-probe.txt");
    expect(file.progress.uploadComplete).toBe(true);
    expect(file.uploadURL).toMatch(/\/uploads\/files\/[0-9a-f]{32}$/);
    expect(file.uploadName).toMatch(/^[0-9a-f]{32}$/);
    expect(uploaded.complete).toBe(true);
  });

  // pages/projects/new.vue gates submission on the uploader's isUploadComplete,
  // guarded by `typeof ... === "function"` with a fallback of `true`. The method
  // did not exist, so the gate was dead: the form was submittable with an upload
  // still running.
  test("blocks submission while an upload is still in flight", async ({
    page,
  }) => {
    // Hold the tus PATCH open so the upload cannot finish.
    let release;
    const held = new Promise((resolve) => {
      release = resolve;
    });
    await page.route("**/uploads/**", async (route) => {
      if (route.request().method() !== "PATCH") return route.continue();
      await held;
      return route.continue();
    });

    await page.goto("/projects/new");
    await expect(page.locator(".uppy-Dashboard").first()).toBeVisible({
      timeout: 20000,
    });

    await page
      .locator(UPPY_INPUT)
      .first()
      .setInputFiles({
        name: "e2e-inflight-probe.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("still uploading\n"),
      });

    const readGate = () =>
      page.evaluate(() => {
        const find = (vm) => {
          if (vm.uploadsAreComplete !== undefined && vm.project) return vm;
          for (const child of vm.$children || []) {
            const found = find(child);
            if (found) return found;
          }
          return null;
        };
        const pageVm = find(window.$nuxt);
        return pageVm ? pageVm.uploadsAreComplete : null;
      });

    await expect.poll(readGate, { timeout: 15000 }).toBe(false);

    release();
    await expect.poll(readGate, { timeout: 20000 }).toBe(true);
  });

  test("sends no Access-Control-Allow-Origin request header", async ({
    page,
  }) => {
    // A response header sent as a request header does nothing except make the
    // request non-simple, which forces a preflight on every upload.
    const offending = [];
    page.on("request", (request) => {
      if (!request.url().includes("/uploads")) return;
      const names = Object.keys(request.headers()).map((n) => n.toLowerCase());
      if (names.includes("access-control-allow-origin")) {
        offending.push(request.method());
      }
    });

    await page.goto("/projects/new");
    await expect(page.locator(".uppy-Dashboard").first()).toBeVisible({
      timeout: 20000,
    });

    await page
      .locator(UPPY_INPUT)
      .first()
      .setInputFiles({
        name: "e2e-header-probe.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("header probe\n"),
      });

    await page.waitForTimeout(4000);
    expect(offending).toEqual([]);
  });
});
