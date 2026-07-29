import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { state, getters, mutations, actions } from "~/store/index";

/**
 * Store actions read `this.$axios`, which Nuxt injects. Calling them with an
 * explicit `this` is enough to exercise them.
 */
const withAxios = ($axios) => ({ $axios });

const rejection = (status, data = {}) => {
  const err = new Error(`Request failed with status code ${status}`);
  err.isAxiosError = true;
  err.config = { url: "/x", method: "get" };
  err.response = { status, data };
  return err;
};

/**
 * Every refresh action shares one shape: GET a URL, commit one mutation with
 * one field of the body, default to [], report success as a boolean.
 */
const REFRESH_ACTIONS = [
  ["refreshNews", "/news", "setNews", "news"],
  ["refreshUsers", "/users", "setUsers", "users"],
  ["refreshGroups", "/groups", "setGroups", "groups"],
  ["refreshProjects", "/projects", "setProjects", "projects"],
  ["refreshSamples", "/samples", "setSamples", "samples"],
  ["refreshRuns", "/runs", "setRuns", "runs"],
  ["refreshLibraryTypes", "/options/librarytype", "setLibraryTypes", "options"],
  [
    "refreshSequencingTechnologies",
    "/options/sequencingtechnology",
    "setSequencingTechnologies",
    "options",
  ],
  [
    "refreshLibrarySources",
    "/options/librarysource",
    "setLibrarySources",
    "options",
  ],
  [
    "refreshLibrarySelections",
    "/options/libraryselection",
    "setLibrarySelections",
    "options",
  ],
  [
    "refreshLibraryStrategies",
    "/options/librarystrategy",
    "setLibraryStrategies",
    "options",
  ],
];

describe("store state", () => {
  it("starts every collection as an empty array", () => {
    const initial = state();
    [
      "users",
      "groups",
      "projects",
      "samples",
      "runs",
      "news",
      "libraryTypes",
      "sequencingTechnologies",
      "librarySources",
      "librarySelections",
      "libraryStrategies",
    ].forEach((key) => {
      expect(initial[key]).toEqual([]);
    });
    expect(initial.user).toBeNull();
    expect(initial.hasReceivedMD5Warning).toBe(false);
  });
});

describe("store getters", () => {
  describe("isAdmin", () => {
    it("is true only for a logged-in user carrying the isAdmin claim", () => {
      expect(
        getters.isAdmin({ auth: { loggedIn: true, user: { isAdmin: true } } })
      ).toBe(true);
    });

    it("is false for a logged-in user without the claim", () => {
      expect(
        getters.isAdmin({ auth: { loggedIn: true, user: { isAdmin: false } } })
      ).toBe(false);
      expect(
        getters.isAdmin({ auth: { loggedIn: true, user: { username: "bob" } } })
      ).toBe(false);
    });

    it("is false when logged out or when auth is absent", () => {
      expect(getters.isAdmin({ auth: { loggedIn: false, user: null } })).toBe(
        false
      );
      expect(getters.isAdmin({})).toBe(false);
    });
  });

  describe.each([
    ["filteredProjects", "projects"],
    ["filteredSamples", "samples"],
    ["filteredRuns", "runs"],
  ])("%s", (getterName, key) => {
    const source = {
      [key]: [{ name: "Alpha" }, { name: "beta" }, { name: "GAMMA" }],
    };

    it("matches case-insensitively", () => {
      expect(getters[getterName](source)("ALPHA")).toEqual([{ name: "Alpha" }]);
      expect(getters[getterName](source)("gamma")).toEqual([{ name: "GAMMA" }]);
    });

    it("matches on a substring", () => {
      expect(getters[getterName](source)("et")).toEqual([{ name: "beta" }]);
    });

    it("returns everything for an empty filter", () => {
      expect(getters[getterName](source)("")).toBe(source[key]);
      expect(getters[getterName](source)(null)).toBe(source[key]);
      expect(getters[getterName](source)(undefined)).toBe(source[key]);
    });

    it("returns nothing when no name matches", () => {
      expect(getters[getterName](source)("zzz")).toEqual([]);
    });
  });
});

describe("store mutations", () => {
  it("assigns each collection", () => {
    const s = state();
    mutations.setProjects(s, [{ name: "p" }]);
    mutations.setLibraryTypes(s, [{ value: "BAM" }]);
    mutations.setHasReceivedMD5WarningMutation(s, true);

    expect(s.projects).toEqual([{ name: "p" }]);
    expect(s.libraryTypes).toEqual([{ value: "BAM" }]);
    expect(s.hasReceivedMD5Warning).toBe(true);
  });
});

describe("store refresh actions", () => {
  let commit;

  beforeEach(() => {
    commit = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe.each(REFRESH_ACTIONS)("%s", (name, url, mutation, field) => {
    it(`GETs ${url} and commits ${mutation}`, async () => {
      const payload = [{ _id: "1" }];
      const $axios = {
        get: vi.fn().mockResolvedValue({ data: { [field]: payload } }),
      };

      const result = await actions[name].call(withAxios($axios), { commit });

      expect($axios.get).toHaveBeenCalledWith(url);
      expect(commit).toHaveBeenCalledWith(mutation, payload);
      expect(result).toBe(true);
    });

    it("commits an empty array when the field is missing", async () => {
      const $axios = { get: vi.fn().mockResolvedValue({ data: {} }) };

      const result = await actions[name].call(withAxios($axios), { commit });

      expect(commit).toHaveBeenCalledWith(mutation, []);
      expect(result).toBe(true);
    });

    // The contract the admin page relies on: a background refresh must not
    // reject (that becomes an unhandled promise), but a caller that has just
    // written to the API needs to know whether the reload actually happened.
    it("resolves false instead of rejecting when the request fails", async () => {
      const $axios = { get: vi.fn().mockRejectedValue(rejection(500)) };

      const result = await actions[name].call(withAxios($axios), { commit });

      expect(result).toBe(false);
      expect(commit).not.toHaveBeenCalled();
    });
  });
});

describe("refreshOptions", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const OPTION_ACTIONS = [
    "refreshLibraryTypes",
    "refreshSequencingTechnologies",
    "refreshLibrarySources",
    "refreshLibrarySelections",
    "refreshLibraryStrategies",
  ];

  it("dispatches all five option refreshes", async () => {
    const dispatch = vi.fn().mockResolvedValue(true);

    const result = await actions.refreshOptions({ dispatch });

    expect(dispatch).toHaveBeenCalledTimes(5);
    OPTION_ACTIONS.forEach((name) => {
      expect(dispatch).toHaveBeenCalledWith(name);
    });
    expect(result).toBe(true);
  });

  it("reports false when any single collection failed to reload", async () => {
    const dispatch = vi
      .fn()
      .mockImplementation((name) =>
        Promise.resolve(name !== "refreshLibrarySources")
      );

    expect(await actions.refreshOptions({ dispatch })).toBe(false);
  });

  it("still dispatches the rest when one fails", async () => {
    const dispatch = vi
      .fn()
      .mockImplementation((name) =>
        Promise.resolve(name !== "refreshLibraryTypes")
      );

    await actions.refreshOptions({ dispatch });

    expect(dispatch).toHaveBeenCalledTimes(5);
  });
});

describe("setHasReceivedMD5Warning", () => {
  it("commits the flag", () => {
    const commit = vi.fn();
    actions.setHasReceivedMD5Warning({ commit });
    expect(commit).toHaveBeenCalledWith(
      "setHasReceivedMD5WarningMutation",
      true
    );
  });
});
