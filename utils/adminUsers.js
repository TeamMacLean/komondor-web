/**
 * Who counts as an ENA admin.
 * @module utils/adminUsers
 *
 * Six call sites used to test membership with
 * `process.env.ENA_ADMINS.includes(username)`. That is a **substring** test
 * against the raw environment string, so with
 * `ENA_ADMINS=['deeks', 'macleand', 'taz23vul', 'admin']` a user called `s`,
 * `ee`, `land` or `min` passed it. komondor-api fixed the identical bug in
 * `FULL_RECORDS_ACCESS_USERS` (BREAKING_CHANGES §2); this is the web-side twin.
 *
 * Note this gate is cosmetic — it decides which controls render. The real check
 * belongs on the API. Getting it right still matters: showing a user an action
 * the server will refuse is its own kind of bug.
 */

/**
 * Parses the `ENA_ADMINS` environment variable into a list of usernames.
 *
 * Deliberately tolerant of how the variable is actually written in deployment.
 * All of these parse to `["a", "b"]`:
 *
 *   ["a", "b"]      JSON
 *   ['a', 'b']      the form this project's .env uses — not valid JSON
 *   a,b             plain comma-separated
 *
 * Usernames never contain commas or quotes, so splitting on commas and peeling
 * off surrounding quotes covers every form without needing a real parser.
 *
 * @returns {string[]} The configured usernames; empty if unset or unparseable.
 */
export const getEnaAdmins = () => {
  const raw = process.env.ENA_ADMINS;

  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return [];
  }

  return raw
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((entry) =>
      entry
        .trim()
        .replace(/^['"]|['"]$/g, "")
        .trim()
    )
    .filter(Boolean);
};

/**
 * Whether a username is an ENA admin. Matched exactly, never as a substring.
 *
 * @param {string} [username] - The username to check.
 * @returns {boolean}
 */
export const isEnaAdmin = (username) => {
  if (!username || typeof username !== "string") {
    return false;
  }
  return getEnaAdmins().includes(username);
};

export default { getEnaAdmins, isEnaAdmin };
