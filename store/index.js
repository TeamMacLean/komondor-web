export const state = () => ({
  // stock: null,
  user: null,
  users: [],
  refreshingUsers:false,
  groups: [],
  refreshingGroups:false,
  projects: [],
  refreshingProjects:false,
  samples: [],
  refreshingSamples:false,
  runs:[],
  refreshingRuns:false,
  news: [],
  refreshingNews:false,
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
  }

};

export const actions = {
  async nuxtServerInit(store, context) {
  },
  async refreshNews({store,commit}) {
    // commit('refreshingNews', true);
    return this.$axios.get('/api/news')
      .then(({data}) => {
        commit('setNews', data.news);
      })
      .catch(err => {
      })
      .finally(()=>{
        // commit('refreshingNews', false);
      })

  },
  async refreshUsers({commit}) {
    // commit('refreshingUsers', true);
    return this.$axios.get('/api/users')
      .then(({data}) => {
        commit('setUsers', data.users);
      })
      .catch((err) => {
      })
      .finally(()=>{
        // commit('refreshingUsers', false);
      })
  },
  async refreshGroups({commit}) {
    // commit('refreshingGroups', true);
    return this.$axios.get('/api/groups')
      .then(({data}) => {
        commit('setGroups', data.groups);
      })
      .catch((err) => {
      })
      .finally(()=>{
        // commit('refreshingGroups', false);
      })
  },
  async refreshProjects({commit}) {
    // commit('refreshingProjects', true);
    return this.$axios.get('/api/projects')
      .then(({data}) => {
        commit('setProjects', data.projects);
      })
      .catch((err) => {
      })
      .finally(()=>{
        // commit('refreshingProjects', false);
      })
  },
  async refreshSamples({commit}) {
    // commit('refreshingSamples', true);
    return this.$axios.get('/api/samples')
      .then(({data}) => {
        commit('setSamples', data.samples);
      })
      .catch((err) => {
      })
      .finally(()=>{
        // commit('refreshingSamples', false);
      })
  },
  async refreshRuns({commit}) {
    // commit('refreshingRuns', true);
    return this.$axios.get('/api/runs')
      .then(({data}) => {
        commit('setRuns', data.runs);
      })
      .catch((err) => {
      })
      .finally(()=>{
        // commit('refreshingRuns', false);
      })
  },



};
