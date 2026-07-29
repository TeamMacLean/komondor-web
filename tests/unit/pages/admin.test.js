import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import AdminPage from "../../../pages/admin/index.vue";

/**
 * These tests drive `createOption`/`deleteOption` directly rather than mounting
 * the whole admin page: the methods are where the API contract lives, and
 * mounting drags in five Buefy tab panels of unrelated markup.
 */
const createContext = ({
  post = vi.fn(),
  del = vi.fn(),
  dispatch = vi.fn().mockResolvedValue(true),
} = {}) => {
  const toastOpen = vi.fn();
  const context = {
    $axios: { post, delete: del },
    $store: { dispatch, state: {} },
    $buefy: {
      toast: { open: toastOpen },
      dialog: { confirm: vi.fn(), prompt: vi.fn() },
    },
    libraryTypes: [],
    ...AdminPage.methods,
  };
  return { context, toastOpen, dispatch, post, del };
};

const COLLECTION = {
  key: "librarySources",
  label: "Library sources",
  singular: "Library Source",
  endpoint: "/options/librarysource",
  refresh: "refreshLibrarySources",
};

const rejection = (status, data) => {
  const err = new Error(`Request failed with status code ${status}`);
  err.isAxiosError = true;
  err.config = { url: COLLECTION.endpoint, method: "post" };
  err.response = { status, data };
  return err;
};

const lastToast = (toastOpen) =>
  toastOpen.mock.calls[toastOpen.mock.calls.length - 1][0];

describe("admin page — option collections", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("covers every collection the API exposes, exactly once", () => {
    const collections = AdminPage.data().optionCollections;
    expect(collections.map((c) => c.endpoint).sort()).toEqual([
      "/options/libraryselection",
      "/options/librarysource",
      "/options/librarystrategy",
      "/options/librarytype",
      "/options/sequencingtechnology",
    ]);
  });

  describe("createOption", () => {
    it("posts the value and reloads the list on success", async () => {
      const { context, toastOpen, dispatch, post } = createContext({
        post: vi
          .fn()
          .mockResolvedValue({ status: 200, data: { doc: { _id: "1" } } }),
      });

      await context.createOption(COLLECTION, "Novogene");

      expect(post).toHaveBeenCalledWith("/options/librarysource", {
        value: "Novogene",
      });
      expect(dispatch).toHaveBeenCalledWith("refreshLibrarySources");
      expect(lastToast(toastOpen)).toMatchObject({
        message: "Added: Novogene",
        type: "is-success",
      });
    });

    // Success used to be inferred purely from axios not throwing.
    it("does not claim success when the server returns no saved document", async () => {
      const { context, toastOpen, dispatch } = createContext({
        post: vi.fn().mockResolvedValue({ status: 200, data: {} }),
      });

      await context.createOption(COLLECTION, "Novogene");

      expect(dispatch).not.toHaveBeenCalled();
      expect(lastToast(toastOpen)).toMatchObject({ type: "is-danger" });
      expect(lastToast(toastOpen).message).toContain("did not confirm");
    });

    it("does not claim success for a 200 that carries an error body", async () => {
      const { context, toastOpen, dispatch } = createContext({
        post: vi.fn().mockResolvedValue({
          status: 200,
          data: { error: "Something went wrong" },
        }),
      });

      await context.createOption(COLLECTION, "Novogene");

      expect(dispatch).not.toHaveBeenCalled();
      expect(lastToast(toastOpen)).toMatchObject({
        message: "Something went wrong",
        type: "is-danger",
      });
    });

    // The API's real reason used to be discarded in favour of "Failed to save
    // option", with a second generic toast from the global interceptor.
    it("shows the API's own reason for a rejected value", async () => {
      const { context, toastOpen } = createContext({
        post: vi.fn().mockRejectedValue(
          rejection(400, {
            error: '"value" is required and must be a non-empty string',
            requestId: "abc",
          })
        ),
      });

      await context.createOption(COLLECTION, "");

      expect(lastToast(toastOpen)).toMatchObject({
        message: '"value" is required and must be a non-empty string',
        type: "is-danger",
      });
    });

    it("warns rather than confirming when the reload fails", async () => {
      const { context, toastOpen } = createContext({
        post: vi
          .fn()
          .mockResolvedValue({ status: 200, data: { doc: { _id: "1" } } }),
        dispatch: vi.fn().mockResolvedValue(false),
      });

      await context.createOption(COLLECTION, "Novogene");

      expect(lastToast(toastOpen)).toMatchObject({ type: "is-warning" });
      expect(lastToast(toastOpen).message).toContain("could not be reloaded");
    });

    it("opens exactly one toast per attempt", async () => {
      const { context, toastOpen } = createContext({
        post: vi.fn().mockRejectedValue(rejection(500, { error: "boom" })),
      });

      await context.createOption(COLLECTION, "Novogene");

      expect(toastOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteOption", () => {
    const option = { _id: "507f1f77bcf86cd799439011", value: "Novogene" };

    it("sends the id in the request body and reloads", async () => {
      const { context, toastOpen, dispatch, del } = createContext({
        del: vi.fn().mockResolvedValue({ status: 200, data: {} }),
      });

      await context.deleteOption(COLLECTION, option);

      expect(del).toHaveBeenCalledWith("/options/librarysource", {
        data: { id: option._id },
      });
      expect(dispatch).toHaveBeenCalledWith("refreshLibrarySources");
      expect(lastToast(toastOpen)).toMatchObject({
        message: "Deleted: Novogene",
        type: "is-success",
      });
    });

    // DELETE now answers 404 when nothing matched (BREAKING_CHANGES §4), where
    // it used to be idempotently 200.
    it("reports a stale option rather than confirming a delete", async () => {
      const { context, toastOpen, dispatch } = createContext({
        del: vi
          .fn()
          .mockRejectedValue(rejection(404, { error: "Option not found" })),
      });

      await context.deleteOption(COLLECTION, option);

      expect(dispatch).not.toHaveBeenCalled();
      expect(lastToast(toastOpen)).toMatchObject({
        message: "Option not found",
        type: "is-danger",
      });
    });

    it("reports a rejected id", async () => {
      const { context, toastOpen } = createContext({
        del: vi
          .fn()
          .mockRejectedValue(
            rejection(400, { error: '"id" is not a valid ID' })
          ),
      });

      await context.deleteOption(COLLECTION, option);

      expect(lastToast(toastOpen).message).toBe('"id" is not a valid ID');
    });

    it("opens exactly one toast per attempt", async () => {
      const { context, toastOpen } = createContext({
        del: vi.fn().mockResolvedValue({ status: 200, data: {} }),
      });

      await context.deleteOption(COLLECTION, option);

      expect(toastOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe("optionsFor", () => {
    it("returns a detached copy so the template cannot mutate store state", () => {
      const stored = [{ _id: "1", value: "BAM" }];
      const { context } = createContext();
      context.$store.state.librarySources = stored;

      const result = context.optionsFor(COLLECTION);

      expect(result).toEqual(stored);
      expect(result[0]).not.toBe(stored[0]);
    });

    it("returns an empty list for a collection not yet loaded", () => {
      const { context } = createContext();
      expect(context.optionsFor(COLLECTION)).toEqual([]);
    });
  });
});
