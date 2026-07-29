// ===================================================================================
//                                    STATE
// ===================================================================================

export const state = () => ({
  user: null,
  users: [],
  groups: [],
  projects: [],
  samples: [],
  runs: [],
  news: [],
  libraryTypes: [],
  sequencingTechnologies: [],
  librarySources: [],
  librarySelections: [],
  libraryStrategies: [],
  hasReceivedMD5Warning: false,
});

// ===================================================================================
//                                    GETTERS
// ===================================================================================

export const getters = {
  isAdmin: (state) => {
    return !!(state.auth && state.auth.loggedIn && state.auth.user.isAdmin);
  },
  filteredProjects: (state) => (filterText) => {
    if (filterText && filterText.length) {
      const lowerCaseFilter = filterText.toLowerCase();
      return state.projects.filter((p) =>
        p.name.toLowerCase().includes(lowerCaseFilter)
      );
    }
    return state.projects;
  },
  filteredSamples: (state) => (filterText) => {
    if (filterText && filterText.length) {
      const lowerCaseFilter = filterText.toLowerCase();
      return state.samples.filter((p) =>
        p.name.toLowerCase().includes(lowerCaseFilter)
      );
    }
    return state.samples;
  },
  filteredRuns: (state) => (filterText) => {
    if (filterText && filterText.length) {
      const lowerCaseFilter = filterText.toLowerCase();
      return state.runs.filter((p) =>
        p.name.toLowerCase().includes(lowerCaseFilter)
      );
    }
    return state.runs;
  },
};

// ===================================================================================
//                                    MUTATIONS
// ===================================================================================

export const mutations = {
  setUsers(state, users) {
    state.users = users;
  },
  setUser(state, user) {
    state.user = user;
  },
  setGroups(state, groups) {
    state.groups = groups;
  },
  setProjects(state, projects) {
    state.projects = projects;
  },
  setSamples(state, samples) {
    state.samples = samples;
  },
  setRuns(state, runs) {
    state.runs = runs;
  },
  setNews(state, news) {
    state.news = news;
  },
  setLibraryTypes(state, list) {
    state.libraryTypes = list;
  },
  setSequencingTechnologies(state, list) {
    state.sequencingTechnologies = list;
  },
  setLibrarySources(state, list) {
    state.librarySources = list;
  },
  setLibrarySelections(state, list) {
    state.librarySelections = list;
  },
  setLibraryStrategies(state, list) {
    state.libraryStrategies = list;
  },
  setHasReceivedMD5WarningMutation(state, bool) {
    state.hasReceivedMD5Warning = bool;
  },
};

// ===================================================================================
//                                    ACTIONS
// ===================================================================================

/**
 * Every `refresh*` action absorbs its own failure and resolves to a boolean:
 * `true` if the collection was reloaded, `false` if the request failed. They
 * deliberately do not reject — most callers fire them in the background and a
 * rejection there becomes an unhandled promise — but a caller that has just
 * written to the API needs to know whether the list it is about to show is
 * actually current. The admin page uses this to avoid reporting a write as
 * complete when the reload behind it failed.
 */
export const actions = {
  async nuxtServerInit() {
    // This action is kept for potential future server-side initializations.
  },

  // --- DATA REFRESH ACTIONS ---

  async refreshNews({ commit }) {
    try {
      const { data } = await this.$axios.get("/news");
      commit("setNews", data.news || []);
      return true;
    } catch (error) {
      console.error("Failed to refresh news:", error);
      return false;
    }
  },
  async refreshUsers({ commit }) {
    try {
      const { data } = await this.$axios.get("/users");
      commit("setUsers", data.users || []);
      return true;
    } catch (error) {
      console.error("Failed to refresh users:", error);
      return false;
    }
  },
  async refreshGroups({ commit }) {
    try {
      const { data } = await this.$axios.get("/groups");
      commit("setGroups", data.groups || []);
      return true;
    } catch (error) {
      console.error("Failed to refresh groups:", error);
      return false;
    }
  },
  async refreshProjects({ commit }) {
    try {
      const { data } = await this.$axios.get("/projects");
      commit("setProjects", data.projects || []);
      return true;
    } catch (error) {
      console.error("Failed to refresh projects:", error);
      return false;
    }
  },
  async refreshSamples({ commit }) {
    try {
      const { data } = await this.$axios.get("/samples");
      commit("setSamples", data.samples || []);
      return true;
    } catch (error) {
      console.error("Failed to refresh samples:", error);
      return false;
    }
  },
  async refreshRuns({ commit }) {
    try {
      const { data } = await this.$axios.get("/runs");
      commit("setRuns", data.runs || []);
      return true;
    } catch (error) {
      console.error("Failed to refresh runs:", error);
      return false;
    }
  },

  // --- FORM OPTIONS ACTIONS ---

  async refreshLibraryTypes({ commit }) {
    try {
      const { data } = await this.$axios.get("/options/librarytype");
      commit("setLibraryTypes", data.options || []);
      return true;
    } catch (error) {
      console.error("Failed to refresh library types:", error);
      return false;
    }
  },
  async refreshSequencingTechnologies({ commit }) {
    try {
      const { data } = await this.$axios.get("/options/sequencingtechnology");
      commit("setSequencingTechnologies", data.options || []);
      return true;
    } catch (error) {
      console.error("Failed to refresh sequencing technologies:", error);
      return false;
    }
  },
  async refreshLibrarySources({ commit }) {
    try {
      const { data } = await this.$axios.get("/options/librarysource");
      commit("setLibrarySources", data.options || []);
      return true;
    } catch (error) {
      console.error("Failed to refresh library sources:", error);
      return false;
    }
  },
  async refreshLibrarySelections({ commit }) {
    try {
      const { data } = await this.$axios.get("/options/libraryselection");
      commit("setLibrarySelections", data.options || []);
      return true;
    } catch (error) {
      console.error("Failed to refresh library selections:", error);
      return false;
    }
  },
  async refreshLibraryStrategies({ commit }) {
    try {
      const { data } = await this.$axios.get("/options/librarystrategy");
      commit("setLibraryStrategies", data.options || []);
      return true;
    } catch (error) {
      console.error("Failed to refresh library strategies:", error);
      return false;
    }
  },

  /**
   * Dispatches all form-option refreshes in parallel.
   *
   * @returns {Promise<boolean>} True only if every collection reloaded.
   */
  async refreshOptions({ dispatch }) {
    // The individual actions absorb their own failures, so Promise.all cannot
    // reject here — it resolves to one boolean per collection.
    const results = await Promise.all([
      dispatch("refreshLibraryTypes"),
      dispatch("refreshSequencingTechnologies"),
      dispatch("refreshLibrarySources"),
      dispatch("refreshLibrarySelections"),
      dispatch("refreshLibraryStrategies"),
    ]);

    return results.every(Boolean);
  },

  // --- MISC ACTIONS ---

  setHasReceivedMD5Warning({ commit }) {
    commit("setHasReceivedMD5WarningMutation", true);
  },
};
