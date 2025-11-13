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

export const actions = {
  async nuxtServerInit() {
    // This action is kept for potential future server-side initializations.
  },

  // --- DATA REFRESH ACTIONS ---

  async refreshNews({ commit }) {
    try {
      const { data } = await this.$axios.get("/news");
      commit("setNews", data.news || []);
    } catch (error) {
      console.error("Failed to refresh news:", error);
      // Optionally, you could commit an error state to be handled by the UI.
    }
  },
  async refreshUsers({ commit }) {
    try {
      const { data } = await this.$axios.get("/users");
      commit("setUsers", data.users || []);
    } catch (error) {
      console.error("Failed to refresh users:", error);
    }
  },
  async refreshGroups({ commit }) {
    try {
      const { data } = await this.$axios.get("/groups");
      commit("setGroups", data.groups || []);
    } catch (error) {
      console.error("Failed to refresh groups:", error);
    }
  },
  async refreshProjects({ commit }) {
    try {
      const { data } = await this.$axios.get("/projects");
      commit("setProjects", data.projects || []);
    } catch (error) {
      console.error("Failed to refresh projects:", error);
    }
  },
  async refreshSamples({ commit }) {
    try {
      const { data } = await this.$axios.get("/samples");
      commit("setSamples", data.samples || []);
    } catch (error) {
      console.error("Failed to refresh samples:", error);
    }
  },
  async refreshRuns({ commit }) {
    try {
      const { data } = await this.$axios.get("/runs");
      commit("setRuns", data.runs || []);
    } catch (error) {
      console.error("Failed to refresh runs:", error);
    }
  },

  // --- FORM OPTIONS ACTIONS ---

  async refreshLibraryTypes({ commit }) {
    try {
      const { data } = await this.$axios.get("/options/librarytype");
      commit("setLibraryTypes", data.options || []);
    } catch (error) {
      console.error("Failed to refresh library types:", error);
    }
  },
  async refreshSequencingTechnologies({ commit }) {
    try {
      const { data } = await this.$axios.get("/options/sequencingtechnology");
      commit("setSequencingTechnologies", data.options || []);
    } catch (error) {
      console.error("Failed to refresh sequencing technologies:", error);
    }
  },
  async refreshLibrarySources({ commit }) {
    try {
      const { data } = await this.$axios.get("/options/librarysource");
      commit("setLibrarySources", data.options || []);
    } catch (error) {
      console.error("Failed to refresh library sources:", error);
    }
  },
  async refreshLibrarySelections({ commit }) {
    try {
      const { data } = await this.$axios.get("/options/libraryselection");
      commit("setLibrarySelections", data.options || []);
    } catch (error) {
      console.error("Failed to refresh library selections:", error);
    }
  },
  async refreshLibraryStrategies({ commit }) {
    try {
      const { data } = await this.$axios.get("/options/librarystrategy");
      commit("setLibraryStrategies", data.options || []);
    } catch (error) {
      console.error("Failed to refresh library strategies:", error);
    }
  },

  /**
   * Dispatches all actions related to fetching form options in parallel.
   */
  async refreshOptions({ dispatch }) {
    try {
      await Promise.all([
        dispatch("refreshLibraryTypes"),
        dispatch("refreshSequencingTechnologies"),
        dispatch("refreshLibrarySources"),
        dispatch("refreshLibrarySelections"),
        dispatch("refreshLibraryStrategies"),
      ]);
    } catch (error) {
      // The individual actions already log their errors,
      // so this is a fallback for any Promise.all specific issues.
      console.error("An error occurred while refreshing form options:", error);
    }
  },

  // --- MISC ACTIONS ---

  setHasReceivedMD5Warning({ commit }) {
    commit("setHasReceivedMD5WarningMutation", true);
  },
};
