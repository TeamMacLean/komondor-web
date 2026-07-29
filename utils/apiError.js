/**
 * Turning a komondor-api failure into text a user can act on.
 * @module utils/apiError
 *
 * The API signals failure in three different ways, and the endpoint alone does
 * not tell you which one you are about to get:
 *
 *   1. Non-2xx with `{error, detail, requestId}` — the `handleError` helper in
 *      komondor-api, used by most routes.
 *   2. **200** with `{error}` — `/read-file` and `/directory-files` only. This
 *      contract is deliberately preserved in the API (BREAKING_CHANGES §9), but
 *      those same routes answer **403** with `{error}` for a rejected path, so
 *      a caller needs both branches.
 *   3. Non-2xx with `{message}` — `/login`, and nothing else.
 *
 * Reading `err.message` off an axios rejection yields "Request failed with
 * status code 401"; reading `data.message` yields `undefined` everywhere but
 * `/login`. Both were happening in this codebase. Everything here exists so
 * call sites stop guessing.
 */

/** Shown when the failure carries nothing worth repeating to a user. */
export const GENERIC_ERROR_MESSAGE =
  "An unexpected error occurred. Please try again.";

/** Shown when the request never reached the API at all. */
export const NETWORK_ERROR_MESSAGE =
  "Unable to reach the server. Please check your connection and that the API is running.";

/**
 * Pulls the human-readable part out of an API error body.
 *
 * Handles both `{error}` (every route) and `{message}` (`/login`), and ignores
 * a non-string `error` — an `Error` serialises to `{}` and older API builds
 * could put one here.
 *
 * @param {*} data - A parsed response body.
 * @returns {string} The message, or "" if the body carries none.
 */
export const readErrorBody = (data) => {
  if (!data || typeof data !== "object") {
    return "";
  }
  const raw = typeof data.error === "string" ? data.error : data.message;
  return typeof raw === "string" && raw.trim() ? raw.trim() : "";
};

/**
 * Whether a resolved response is actually a failure.
 *
 * Only `/read-file` and `/directory-files` can do this — they answer 200 with
 * `{error}` rather than a non-2xx status.
 *
 * @param {object} response - An axios response.
 * @returns {boolean}
 */
export const isBodyError = (response) =>
  Boolean(readErrorBody(response && response.data));

/**
 * The message to show for a failed request, whichever way it failed.
 *
 * Accepts an axios rejection, a plain `Error`, a string, or a resolved-but-
 * failed response from the "200 with body.error" routes.
 *
 * @param {*} error - The rejection, error or response to describe.
 * @param {object} [options]
 * @param {string} [options.fallback] - Used when nothing better is available.
 * @param {boolean} [options.includeRef=false] - Append the API's `requestId`
 *   when present. Worth it for long-running or support-prone operations
 *   (checksum verification); noise on a routine validation message.
 * @returns {string} A message safe to put in front of a user.
 */
export const getApiErrorMessage = (error, options = {}) => {
  const { fallback = GENERIC_ERROR_MESSAGE, includeRef = false } = options;

  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error.trim() || fallback;
  }

  // An axios rejection carries `response`; a resolved 200-with-error response
  // carries `data` directly. Accept either.
  const body = error.response ? error.response.data : error.data;
  const fromBody = readErrorBody(body);

  if (fromBody) {
    const requestId = body && body.requestId;
    return includeRef && requestId
      ? `${fromBody} (Ref: ${requestId})`
      : fromBody;
  }

  // No response at all means the request never completed — a down API, CORS, or
  // a dropped connection. axios reports this as a bare "Network Error", which
  // is not something to show a user.
  const isAxiosRejection = Boolean(error.isAxiosError || error.config);
  if (isAxiosRejection && !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  // A plain Error thrown by our own code — its message is ours, so it is fit to
  // display. An axios rejection's message is "Request failed with status code
  // 400", which is not.
  if (!isAxiosRejection && typeof error.message === "string" && error.message) {
    return error.message;
  }

  return fallback;
};

/**
 * The HTTP status of a failure, when there was one.
 *
 * @param {*} error - An axios rejection.
 * @returns {number|null} The status, or null if the request never completed.
 */
export const getApiErrorStatus = (error) => {
  const status = error && error.response && error.response.status;
  return typeof status === "number" ? status : null;
};

/**
 * Failure conditions of `GET /directory-files`, and how to describe each one.
 *
 * These mirror the messages thrown in komondor-api `routes/directory-files.js`.
 * There is no machine-readable code on that endpoint, so matching the text is
 * the only option available to a consumer.
 *
 * Matched by a loose pattern rather than string equality on purpose: an exact
 * comparison breaks silently the moment the API rewords a message, whereas an
 * unmatched pattern here falls through to `describeDirectoryError`'s default,
 * which still shows the server's own wording and the resolved path. Worse
 * copy, not a wrong answer.
 */
export const DIRECTORY_ERROR_PATTERNS = [
  {
    pattern: /issue reading/i,
    describe: (path) =>
      `Cannot access directory: the path "${path}" could not be read.`,
  },
  {
    pattern: /does not exist/i,
    describe: (path) =>
      `Directory not found: the path "${path}" does not exist.`,
  },
  {
    pattern: /no files found/i,
    describe: (path) =>
      `Empty directory: the directory "${path}" exists but contains no files.`,
  },
  {
    pattern: /access denied/i,
    describe: (path) =>
      `Access denied: the path "${path}" is outside the HPC transfer area.`,
  },
  {
    pattern: /missing targetdirectoryname/i,
    describe: () => "No directory name was sent to the server.",
  },
  {
    pattern: /not configured/i,
    describe: () =>
      "The HPC transfer area is not configured on the server. This needs an administrator.",
  },
];

/**
 * Describes a `/directory-files` failure in terms of the path the user typed.
 *
 * @param {*} error - An axios rejection, or a 200 response carrying `{error}`.
 * @param {string} fullPath - The resolved HPC path, for the message.
 * @returns {string} A message naming the path the user actually entered.
 */
export const describeDirectoryError = (error, fullPath) => {
  const raw = getApiErrorMessage(error, { fallback: "" });

  if (!raw) {
    return `Could not read "${fullPath}". Please try again.`;
  }

  const match = DIRECTORY_ERROR_PATTERNS.find(({ pattern }) =>
    pattern.test(raw)
  );

  // Unrecognised: show the server's own words alongside the path, so the user
  // still learns which directory failed and support still sees the real cause.
  return match ? match.describe(fullPath) : `${raw} (path: "${fullPath}")`;
};

export default {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  readErrorBody,
  isBodyError,
  getApiErrorMessage,
  getApiErrorStatus,
  DIRECTORY_ERROR_PATTERNS,
  describeDirectoryError,
};
