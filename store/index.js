
export const state = () => ({
  // stock: null,
  user: null,
  users: [],
  // refreshingUsers: false,
  groups: [],
  // refreshingGroups: false,
  projects: [],
  // refreshingProjects: false,
  samples: [],
  // refreshingSamples: false,
  runs: [],
  // refreshingRuns: false,
  news: [],
  // refreshingNews: false,
  libraryTypes: [],
  sequencingTechnologies: [],
  librarySources: [],
  librarySelections: [],
  libraryStrategies: [],
  hasReceivedMD5Warning: false,
});

export const getters = {
  // isAuthenticated: state => {
  //   return !!state.auth.loggedIn
  // },
  isAdmin: state => {
    return !!(state.auth && state.auth.loggedIn && state.auth.user.isAdmin);
  },
  filteredProjects: state => (filterText) => {
    if (filterText && filterText.length) {
      return state.projects.filter(p => p.name.toLowerCase().indexOf(filterText.toLowerCase()) > -1)
    } else {
      return state.projects;
    }
  },
  filteredSamples: state => (filterText) => {
    if (filterText && filterText.length) {
      return state.samples.filter(p => p.name.toLowerCase().indexOf(filterText.toLowerCase()) > -1)
    } else {
      return state.samples;
    }
  },
  filteredRuns: state => (filterText) => {
    if (filterText && filterText.length) {
      return state.runs.filter(p => p.name.toLowerCase().indexOf(filterText.toLowerCase()) > -1)
    } else {
      return state.runs;
    }
  },

  // getCachedProjectById: state => (id) => {
  //   const found = state.projects.filter(p => {
  //     return p.id === id;
  //   });
  //   if (found.length) {
  //     return found[0];
  //   } else {
  //     return null;
  //   }
  // },
  // getCachedSampleById: state => (id) => {
  //   const found = state.samples.filter(p => {
  //     return p.id === id;
  //   });
  //   if (found.length) {
  //     return found[0];
  //   } else {
  //     return null;
  //   }
  // }
  // filteredGroups: state => (filterText) => {
  //   if (filterText && filterText.length) {
  //     return state.projects.filter(p => p.name.toLowerCase().indexOf(filterText.toLowerCase()) > -1)
  //   } else {
  //     return state.projects;
  //   }
  // },
  // filteredUsers: state => (filterText) => {
  //   if (filterText && filterText.length) {
  //     return state.projects.filter(p => p.name.toLowerCase().indexOf(filterText.toLowerCase()) > -1)
  //   } else {
  //     return state.projects;
  //   }
  // }
};


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
    state.hasReceivedMD5Warning = bool
  },

};

export const actions = {
  async nuxtServerInit(store, context) {
  },
  async refreshNews({ store, commit }) {
    return this.$axios.get('/news')
      .then(({ data }) => {
        commit('setNews', data.news);
      })
      .catch(err => {
        console.error(err);
      })

  },
  async refreshUsers({ commit }) {
    return this.$axios.get('/users')
      .then(({ data }) => {
        commit('setUsers', data.users);
      })
      .catch((err) => {
        console.error(err);
      })
  },
  async refreshGroups({ commit }) {
    return this.$axios.get('/groups')
      .then(({ data }) => {
        commit('setGroups', data.groups);
      })
      .catch((err) => {
        console.error(err);
      })
  },
  async refreshProjects({ commit }) {
    return this.$axios.get('/projects')
      .then(({ data }) => {
        commit('setProjects', data.projects);
      })
      .catch((err) => {
        console.error(err);
      })
  },
  async refreshSamples({ commit }) {
    return this.$axios.get('/samples')
      .then(({ data }) => {
        commit('setSamples', data.samples);
      })
      .catch((err) => {
        console.error(err);
      })
  },
  async refreshRuns({ commit }) {
    return this.$axios.get('/runs')
      .then(({ data }) => {
        commit('setRuns', data.runs);
      })
      .catch((err) => {
        console.error(err);
      })
  },

  async refreshLibraryTypes({ commit }) {
    return this.$axios.get('/options/librarytype')
      .then(({ data }) => {
        commit('setLibraryTypes', data.options);
      })
      .catch((err) => {
        console.error(err);
      })
  },
  async refreshSequencingTechnologies({ commit }) {
    return this.$axios.get('/options/sequencingtechnology')
      .then(({ data }) => {
        commit('setSequencingTechnologies', data.options);
      })
      .catch((err) => {
        console.error(err);
      })
  },
  async refreshLibrarySources({ commit }) {
    return this.$axios.get('/options/librarysource')
      .then(({ data }) => {
        commit('setLibrarySources', data.options);
      })
      .catch((err) => {
        console.error(err);
      })
  },
  async refreshLibrarySelections({ commit }) {
    return this.$axios.get('/options/libraryselection')
      .then(({ data }) => {
        commit('setLibrarySelections', data.options);
      })
      .catch((err) => {
        console.error(err);
      })
  },
  async refreshLibraryStrategies({ commit }) {
    return this.$axios.get('/options/librarystrategy')
      .then(({ data }) => {
        commit('setLibraryStrategies', data.options);
      })
      .catch((err) => {
        console.error(err);
      })
  },

  async refreshOptions({ commit, dispatch }) {

    return Promise.all([
      dispatch('refreshLibraryTypes'),
      dispatch('refreshSequencingTechnologies'),
      dispatch('refreshLibrarySources'),
      dispatch('refreshLibrarySelections'),
      dispatch('refreshLibraryStrategies'),
    ])

  },
  async setHasReceivedMD5Warning({ commit }) {
    // this.hasReceivedMD5Warning=false,
    return commit('setHasReceivedMD5WarningMutation', true)
  }


};
