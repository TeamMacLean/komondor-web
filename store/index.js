export const state = () => ({
  // stock: null,
  user: null,
  users: [],
  refreshingUsers: false,
  groups: [],
  refreshingGroups: false,
  projects: [],
  refreshingProjects: false,
  samples: [],
  refreshingSamples: false,
  runs: [],
  refreshingRuns: false,
  news: [],
  refreshingNews: false,
  libraryTypes: [],
  sequencingProviders: [],
  sequencingTechnologies: [],
  librarySources: [],
  librarySelections: [],
  libraryStrategies: [],
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
  setSequencingProviders(state, list) {
    state.sequencingProviders = list;
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

};

export const actions = {
  async nuxtServerInit(store, context) {
  },
  async refreshNews({store, commit}) {
    // commit('refreshingNews', true);
    return this.$axios.get('/news')
      .then(({data}) => {
        commit('setNews', data.news);
      })
      .catch(err => {
      })

  },
  async refreshUsers({commit}) {
    // commit('refreshingUsers', true);
    return this.$axios.get('/users')
      .then(({data}) => {
        commit('setUsers', data.users);
      })
      .catch((err) => {
      })
  },
  async refreshGroups({commit}) {
    // commit('refreshingGroups', true);
    return this.$axios.get('/groups')
      .then(({data}) => {
        commit('setGroups', data.groups);
      })
      .catch((err) => {
      })
  },
  async refreshProjects({commit}) {
    // commit('refreshingProjects', true);
    return this.$axios.get('/projects')
      .then(({data}) => {
        commit('setProjects', data.projects);
      })
      .catch((err) => {
      })
  },
  async refreshSamples({commit}) {
    // commit('refreshingSamples', true);
    return this.$axios.get('/samples')
      .then(({data}) => {
        commit('setSamples', data.samples);
      })
      .catch((err) => {
      })
  },
  async refreshRuns({commit}) {
    // commit('refreshingRuns', true);
    return this.$axios.get('/runs')
      .then(({data}) => {
        commit('setRuns', data.runs);
      })
      .catch((err) => {
      })
  },
  async refreshLibraryTypes({commit}) {
    return this.$axios.get('/runs')
      .then(({data}) => {
        commit('setRuns', data.runs);
      })
      .catch((err) => {
      })
  },
  async refreshSequencingProviders({commit}) {
    return this.$axios.get('/runs')
      .then(({data}) => {
        commit('setRuns', data.runs);
      })
      .catch((err) => {
      })
  },
  async refreshSequencingTechnologies({commit}) {
    return this.$axios.get('/runs')
      .then(({data}) => {
        commit('setRuns', data.runs);
      })
      .catch((err) => {
      })
  },
  async refreshLibrarySources({commit}) {
    return this.$axios.get('/runs')
      .then(({data}) => {
        commit('setRuns', data.runs);
      })
      .catch((err) => {
      })
  },
  async refreshLibrarySelections({commit}) {
    return this.$axios.get('/runs')
      .then(({data}) => {
        commit('setRuns', data.runs);
      })
      .catch((err) => {
      })
  },
  async refreshLibraryStrategies({commit}) {
    return this.$axios.get('/runs')
      .then(({data}) => {
        commit('setRuns', data.runs);
      })
      .catch((err) => {
      })
  },

  async refreshLibraryAndSequencingStuff({commit}) {

  }


};
