import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// The plugin raises toasts through Buefy's programmatic API rather than
// `app.$buefy`, which is undefined in a Nuxt plugin context — nuxt-buefy only
// calls `Vue.use(Buefy)` and never Nuxt's `inject`.
const toastOpen = vi.fn();
vi.mock("buefy", () => ({
  ToastProgrammatic: {
    open: (...args) => toastOpen(...args),
  },
}));

import errorHandler from "~/plugins/error-handler";
import { NETWORK_ERROR_MESSAGE } from "~/utils/apiError";

/**
 * The plugin registers axios interceptors, so the tests capture the handlers it
 * passes to onError/onRequest and invoke them directly.
 */
const setup = ({ loggedIn = true } = {}) => {
  const handlers = {};
  const $axios = {
    onError: vi.fn((fn) => {
      handlers.onError = fn;
    }),
    onRequest: vi.fn((fn) => {
      handlers.onRequest = fn;
    }),
    onResponse: vi.fn((fn) => {
      handlers.onResponse = fn;
    }),
  };

  const logout = vi.fn().mockResolvedValue(undefined);
  const redirect = vi.fn();
  const store = { state: { auth: { loggedIn } }, commit: vi.fn() };
  const app = { $auth: { logout } };

  errorHandler({ $axios, store, redirect, app });

  return { handlers, $axios, toastOpen, logout, redirect, store, app };
};

/** An axios rejection with a response, as every non-2xx produces. */
const rejection = (status, data = {}, url = "/options/librarytype") => {
  const err = new Error(`Request failed with status code ${status}`);
  err.isAxiosError = true;
  err.config = { url, method: "post" };
  err.response = { status, data };
  return err;
};

/** An axios rejection with no response, as a down API produces. */
const networkFailure = (url = "/projects") => {
  const err = new Error("Network Error");
  err.isAxiosError = true;
  err.config = { url, method: "get" };
  return err;
};

const expectRejects = async (promise, expected) => {
  await expect(promise).rejects.toBe(expected);
};

describe("error-handler plugin", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    toastOpen.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("registers an error and a request interceptor", () => {
    const { $axios } = setup();
    expect($axios.onError).toHaveBeenCalledTimes(1);
    expect($axios.onRequest).toHaveBeenCalledTimes(1);
  });

  // The success-toast interceptor was removed: the three routes that return
  // {message} on write all have call sites that show their own confirmation,
  // so it only ever produced a second toast.
  it("does not register a response interceptor", () => {
    const { $axios } = setup();
    expect($axios.onResponse).not.toHaveBeenCalled();
  });

  describe("errors the caller owns", () => {
    // Previously each of these opened a generic toast *and* re-rejected, so the
    // component's own handler produced a second one.
    it.each([400, 403, 404, 409, 422, 500, 502, 503])(
      "does not toast for %i — the call site reports it",
      async (status) => {
        const { handlers, toastOpen } = setup();
        const err = rejection(status, { error: "the real reason" });

        await expectRejects(handlers.onError(err), err);

        expect(toastOpen).not.toHaveBeenCalled();
      }
    );

    it("always re-rejects so the caller still sees the error", async () => {
      const { handlers } = setup();
      const err = rejection(404, { error: "Option not found" });
      await expectRejects(handlers.onError(err), err);
    });
  });

  describe("401", () => {
    it("warns, clears the session and redirects", async () => {
      const { handlers, toastOpen, logout, redirect } = setup();
      const err = rejection(401, {}, "/projects");

      await expectRejects(handlers.onError(err), err);

      expect(toastOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("session has expired"),
          type: "is-warning",
        })
      );
      expect(logout).toHaveBeenCalled();

      expect(redirect).not.toHaveBeenCalled();
      vi.runAllTimers();
      expect(redirect).toHaveBeenCalledWith("/signin");
    });

    it("redirects once when several requests 401 together", async () => {
      const { handlers, toastOpen, redirect } = setup();

      await Promise.all(
        Array.from({ length: 3 }, () =>
          handlers.onError(rejection(401, {}, "/projects")).catch(() => {})
        )
      );

      vi.runAllTimers();
      expect(redirect).toHaveBeenCalledTimes(1);
      expect(toastOpen).toHaveBeenCalledTimes(1);
    });

    // A 401 from /login means "wrong password", not "your session ended".
    // Redirecting to /signin from /signin would be a loop.
    it("leaves a failed login alone", async () => {
      const { handlers, toastOpen, logout, redirect } = setup({
        loggedIn: false,
      });
      const err = rejection(401, { message: "Bad credentials" }, "/login");

      await expectRejects(handlers.onError(err), err);

      vi.runAllTimers();
      expect(toastOpen).not.toHaveBeenCalled();
      expect(logout).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it("does not try to log out a session that is already gone", async () => {
      const { handlers, logout } = setup({ loggedIn: false });
      await handlers.onError(rejection(401, {}, "/projects")).catch(() => {});
      expect(logout).not.toHaveBeenCalled();
    });
  });

  describe("no response at all", () => {
    it("reports that the server is unreachable", async () => {
      const { handlers, toastOpen } = setup();
      const err = networkFailure();

      await expectRejects(handlers.onError(err), err);

      expect(toastOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          message: NETWORK_ERROR_MESSAGE,
          type: "is-danger",
        })
      );
    });

    // refreshOptions fires five requests at once; with the API down that used
    // to be five identical toasts queued one behind another.
    it("collapses a burst of failures into one toast", async () => {
      const { handlers, toastOpen } = setup();

      await Promise.all(
        Array.from({ length: 5 }, () =>
          handlers.onError(networkFailure()).catch(() => {})
        )
      );

      expect(toastOpen).toHaveBeenCalledTimes(1);
    });

    it("toasts again once the cooldown has passed", async () => {
      const { handlers, toastOpen } = setup();

      await handlers.onError(networkFailure()).catch(() => {});
      vi.advanceTimersByTime(5001);
      await handlers.onError(networkFailure()).catch(() => {});

      expect(toastOpen).toHaveBeenCalledTimes(2);
    });
  });

  it("survives a context with no store or $auth", async () => {
    const handlers = {};
    const $axios = {
      onError: vi.fn((fn) => {
        handlers.onError = fn;
      }),
      onRequest: vi.fn(),
    };
    errorHandler({
      $axios,
      store: { state: {} },
      redirect: vi.fn(),
      app: {},
    });

    const err = networkFailure();
    await expect(handlers.onError(err)).rejects.toBe(err);
  });

  it("passes request config through untouched", () => {
    const { handlers } = setup();
    const config = { url: "/projects", method: "get" };
    expect(handlers.onRequest(config)).toBe(config);
  });
});
