/**
 * Global axios interceptors.
 *
 * This plugin deliberately handles only what no single call site can:
 *
 *   - **401** — the session is gone. Clearing auth and redirecting is not a
 *     per-request concern, and every component would otherwise duplicate it.
 *   - **No response at all** — a down API or dropped connection. Components
 *     cannot distinguish this from an ordinary failure without help, and a
 *     background store refresh would swallow it entirely.
 *
 * Everything else — 400, 403, 404, 409, 422, 5xx — is left to the caller, which
 * has the context to say *what* failed and can read the API's own message with
 * `getApiErrorMessage`. This plugin used to toast for all of those and then
 * re-reject, so every handled error produced two toasts: a generic one from
 * here and a specific one from the component. It also read `data.message`,
 * which no route but `/login` sends, so its half of the pair was always the
 * generic fallback.
 *
 * The success-toast interceptor was removed for the same reason: the three
 * routes that return `{message}` on write (`/groups/delete`,
 * `/groups/resurrect`, `/project/toggle-nudgeable`) all have call sites that
 * already show their own confirmation.
 */

import { ToastProgrammatic as Toast } from "buefy";
import { NETWORK_ERROR_MESSAGE } from "~/utils/apiError";

/**
 * How long to suppress repeat "server unreachable" toasts.
 *
 * `refreshOptions` dispatches five requests at once; when the API is down that
 * is five identical toasts, queued one after another.
 */
const NETWORK_TOAST_COOLDOWN_MS = 5000;

export default ({ $axios, store, redirect, app }) => {
  // Guards against a redirect loop when several requests 401 together.
  let isRedirecting = false;
  let lastNetworkToastAt = 0;

  /**
   * Raises a toast from outside a component.
   *
   * Not `app.$buefy`: `app` here is the root Vue *options* object, and
   * nuxt-buefy only does `Vue.use(Buefy)` — it never calls Nuxt's `inject`.
   * So `app.$buefy` is undefined, and the previous `if (app.$buefy)` guard
   * around every branch meant this plugin never showed a toast at all.
   */
  const toast = (options) => Toast.open(options);

  $axios.onError((error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", {
        url,
        status: status || "no response",
        body: error.response?.data ?? error.message,
      });
    }

    // The request never completed: no status to branch on.
    if (!error.response) {
      const now = Date.now();
      if (now - lastNetworkToastAt > NETWORK_TOAST_COOLDOWN_MS) {
        lastNetworkToastAt = now;
        toast({
          message: NETWORK_ERROR_MESSAGE,
          type: "is-danger",
          duration: 5000,
        });
      }
      return Promise.reject(error);
    }

    // A 401 from /login is "wrong password", not "session expired" — the signin
    // form reports that itself.
    const isLoginAttempt = Boolean(url && url.includes("/login"));

    if (status === 401 && !isLoginAttempt && !isRedirecting) {
      isRedirecting = true;

      toast({
        message: "Your session has expired. Please sign in again.",
        type: "is-warning",
        duration: 3000,
      });

      if (app.$auth && store.state.auth?.loggedIn) {
        // Resets the local session; `logout` is disabled on the strategy, so
        // this makes no request of its own.
        Promise.resolve(app.$auth.logout()).catch((err) => {
          console.error("Failed to clear the local session:", err);
        });
      }

      setTimeout(() => {
        redirect("/signin");
        isRedirecting = false;
      }, 500);
    }

    // Every other status belongs to the caller.
    return Promise.reject(error);
  });

  $axios.onRequest((config) => {
    if (process.env.NODE_ENV === "development") {
      console.debug("API Request:", config.method?.toUpperCase(), config.url);
    }
    return config;
  });
};
