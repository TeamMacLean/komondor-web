export const state = () => ({
  // stock: null,
  users: [],
  user: null,
  groups: [],
  projects: [],
  samples: [],
  runs:[],
  news: []
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

  getCachedProjectById: state => (id) => {
    const found = state.projects.filter(p => {
      return p.id === id;
    });
    if (found.length) {
      return found[0];
    } else {
      return null;
    }
  },
  getCachedSampleById: state => (id) => {
    const found = state.samples.filter(p => {
      return p.id === id;
    });
    if (found.length) {
      return found[0];
    } else {
      return null;
    }
  }
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
  }

};

export const actions = {
  async nuxtServerInit(store, context) {
  },
  async refreshNews({store,commit}) {

    return this.$axios.get('/api/news')
      .then(({data}) => {
        commit('setNews', data.news);
      })
      .catch(err => {
        // commit('setNews', [])
      })

  },
  async refreshUsers({commit}) {
    return this.$axios.get('/api/users')
      .then(({data}) => {
        commit('setUsers', data.users);
      })
      .catch((err) => {
        // commit('setUsers', []);
      })
  },
  async refreshGroups({commit}) {
    return this.$axios.get('/api/groups')
      .then(({data}) => {
        commit('setGroups', data.groups);
      })
      .catch((err) => {
        // commit('setGroups', []);
      })
  },
  async refreshProjects({commit}) {
    return this.$axios.get('/api/projects')
      .then(({data}) => {
        commit('setProjects', data.projects);
      })
      .catch((err) => {
        // commit('setProjects', []);
      })
  },
  async refreshSamples({commit}) {
    return this.$axios.get('/api/samples')
      .then(({data}) => {
        commit('setSamples', data.samples);
      })
      .catch((err) => {
        // commit('setSamples', []);
      })
  },
  async refreshRuns({commit}) {
    return this.$axios.get('/api/runs')
      .then(({data}) => {
        commit('setRuns', data.runs);
      })
      .catch((err) => {
        // commit('setRuns', []);
      })
  },



};
