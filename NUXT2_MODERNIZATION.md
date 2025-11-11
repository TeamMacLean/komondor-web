# Nuxt 2 Modernization Plan 🚀

**Date:** November 11, 2024  
**Current Version:** Nuxt 2.18.1  
**Target:** Modernized Nuxt 2 (Latest stable)  
**Status:** Implementation Ready

---

## 🎯 Goals

Keep Nuxt 2 but modernize and improve:
1. ✅ Update to latest Nuxt 2.x (2.18.x)
2. ✅ Improve code quality and organization
3. ✅ Add TypeScript support (optional, gradual)
4. ✅ Optimize build performance
5. ✅ Better testing coverage
6. ✅ Improve developer experience
7. ✅ Keep everything working (zero breaking changes)

---

## 📦 Current State Analysis

### ✅ Already Done
- [x] Node 24 compatibility
- [x] Nuxt 2.18.1 (latest)
- [x] Vitest + Playwright testing setup
- [x] Clean build (no deprecation warnings)
- [x] Modern Sass (Dart Sass)

### 🎯 To Improve
- [ ] Code organization and structure
- [ ] TypeScript definitions for better IDE support
- [ ] Composables pattern (can be used in Nuxt 2!)
- [ ] Better error handling
- [ ] Performance optimizations
- [ ] Documentation improvements
- [ ] More test coverage

---

## 🔧 Modernization Steps

### Step 1: Add TypeScript Support (Optional, Non-Breaking)

Nuxt 2 supports TypeScript without breaking JavaScript:

```bash
npm install -D @nuxt/typescript-build @nuxt/types
```

**nuxt.config.js** (can stay .js):
```javascript
export default {
  buildModules: [
    '@nuxt/typescript-build'
  ],
  typescript: {
    typeCheck: false // Set true when ready
  }
}
```

Create `tsconfig.json`:
```json
{
  "extends": "@nuxt/typescript-build",
  "compilerOptions": {
    "target": "ES2018",
    "module": "ESNext",
    "moduleResolution": "Node",
    "lib": ["ESNext", "ESNext.AsyncIterable", "DOM"],
    "esModuleInterop": true,
    "allowJs": true,
    "sourceMap": true,
    "strict": false,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "~/*": ["./*"],
      "@/*": ["./*"]
    },
    "types": [
      "@nuxt/types",
      "@types/node"
    ]
  }
}
```

**Benefits:**
- Better IDE autocomplete
- Type checking (optional)
- Gradual migration (mix .js and .ts)
- No breaking changes

### Step 2: Create Composables Directory (Nuxt 2 Compatible)

```bash
mkdir composables
```

**composables/useApi.js**:
```javascript
export const useApi = () => {
  const { $axios } = useContext()
  
  const fetchWithErrorHandling = async (url, options = {}) => {
    try {
      const response = await $axios(url, options)
      return { data: response.data, error: null }
    } catch (error) {
      console.error(`API Error: ${url}`, error)
      return { data: null, error }
    }
  }
  
  return {
    get: (url) => fetchWithErrorHandling(url, { method: 'GET' }),
    post: (url, data) => fetchWithErrorHandling(url, { method: 'POST', data }),
    put: (url, data) => fetchWithErrorHandling(url, { method: 'PUT', data }),
    delete: (url) => fetchWithErrorHandling(url, { method: 'DELETE' })
  }
}
```

**composables/useState.js**:
```javascript
export const useLocalState = (key, initialValue) => {
  const state = ref(initialValue)
  
  const setState = (newValue) => {
    state.value = newValue
  }
  
  return [state, setState]
}
```

### Step 3: Improve Store Organization

Keep Vuex but organize better:

**Current:** Single `store/index.js`

**Improved:** Split by domain
```
store/
├── index.js          # Root store
├── auth.js           # Auth module
├── projects.js       # Projects module
├── samples.js        # Samples module
├── runs.js           # Runs module
└── options.js        # Options module
```

**Example: store/projects.js**:
```javascript
export const state = () => ({
  list: [],
  current: null,
  loading: false
})

export const getters = {
  filtered: (state) => (filterText) => {
    if (!filterText) return state.list
    return state.list.filter(p => 
      p.name.toLowerCase().includes(filterText.toLowerCase())
    )
  },
  byId: (state) => (id) => {
    return state.list.find(p => p.id === id)
  }
}

export const mutations = {
  SET_LIST(state, projects) {
    state.list = projects
  },
  SET_CURRENT(state, project) {
    state.current = project
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  }
}

export const actions = {
  async fetchAll({ commit }) {
    commit('SET_LOADING', true)
    try {
      const { data } = await this.$axios.get('/projects')
      commit('SET_LIST', data.projects)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async fetchById({ commit }, id) {
    commit('SET_LOADING', true)
    try {
      const { data } = await this.$axios.get(`/projects/${id}`)
      commit('SET_CURRENT', data.project)
    } catch (error) {
      console.error('Failed to fetch project:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  }
}
```

### Step 4: Add Utils Directory

Create reusable utility functions:

```
utils/
├── validators.js     # Form validation
├── formatters.js     # Date, number formatting
├── constants.js      # App constants
└── helpers.js        # General helpers
```

**utils/validators.js**:
```javascript
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validateRequired = (value) => {
  return value !== null && value !== undefined && value !== ''
}

export const validateMinLength = (value, minLength) => {
  return value && value.length >= minLength
}
```

**utils/formatters.js**:
```javascript
import moment from 'moment'

export const formatDate = (date, format = 'YYYY-MM-DD') => {
  return moment(date).format(format)
}

export const formatRelativeTime = (date) => {
  return moment(date).fromNow()
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
```

### Step 5: Improve Error Handling

**plugins/error-handler.js**:
```javascript
export default ({ $axios, store, redirect, app }) => {
  // Global axios error handler
  $axios.onError((error) => {
    const code = parseInt(error.response?.status)
    
    switch (code) {
      case 400:
        app.$buefy.toast.open({
          message: 'Invalid request',
          type: 'is-danger'
        })
        break
      case 401:
        // Unauthorized - redirect to login
        store.dispatch('auth/logout')
        redirect('/signin')
        break
      case 403:
        app.$buefy.toast.open({
          message: 'Access denied',
          type: 'is-danger'
        })
        break
      case 404:
        app.$buefy.toast.open({
          message: 'Resource not found',
          type: 'is-warning'
        })
        break
      case 500:
        app.$buefy.toast.open({
          message: 'Server error. Please try again later.',
          type: 'is-danger'
        })
        break
      default:
        if (error.response?.data?.message) {
          app.$buefy.toast.open({
            message: error.response.data.message,
            type: 'is-danger'
          })
        }
    }
    
    return Promise.reject(error)
  })
  
  // Global response interceptor for success messages
  $axios.onResponse((response) => {
    if (response.data?.message && response.config.method !== 'get') {
      app.$buefy.toast.open({
        message: response.data.message,
        type: 'is-success'
      })
    }
    return response
  })
}
```

### Step 6: Add Environment Types

**types/env.d.ts**:
```typescript
declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        API_URL: string
        HOST: string
        PORT: string
        HPC_DATASTORE_ROOT: string
        DATAHOG_DEATH: string
        ENA_ADMINS: string
      }
    }
  }
}
```

**types/vue.d.ts**:
```typescript
import Vue from 'vue'
import { NuxtAxiosInstance } from '@nuxtjs/axios'
import { Auth } from '@nuxtjs/auth-next'

declare module 'vue/types/vue' {
  interface Vue {
    $axios: NuxtAxiosInstance
    $auth: Auth
  }
}

declare module '@nuxt/types' {
  interface NuxtAppOptions {
    $axios: NuxtAxiosInstance
    $auth: Auth
  }
  
  interface Context {
    $axios: NuxtAxiosInstance
    $auth: Auth
  }
}
```

### Step 7: Improve Nuxt Config

**nuxt.config.js** (Enhanced):
```javascript
require('dotenv').config()

const isDev = process.env.NODE_ENV !== 'production'

export default {
  // Rendering
  render: {
    ssr: false,
  },
  
  // Build Modules (dev only)
  buildModules: [
    // '@nuxt/typescript-build', // Uncomment when ready for TS
  ],
  
  // Global page headers
  head: {
    title: 'TSL Sequence Store',
    htmlAttrs: { lang: 'en' },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'TSL Sequence Store' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'mobile-web-app-capable', content: 'yes' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/icons/favicon.ico' }
    ],
  },
  
  // Runtime config (preferred over env)
  publicRuntimeConfig: {
    apiUrl: process.env.API_URL || 'http://localhost:8000',
    host: process.env.HOST || 'localhost',
    hpcDatastoreRoot: process.env.HPC_DATASTORE_ROOT || '',
    datahogDeath: process.env.DATAHOG_DEATH || '',
    enaAdmins: process.env.ENA_ADMINS || ''
  },
  
  // Server config
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
  },
  
  // Global CSS
  css: ['~/assets/main.scss'],
  
  // Plugins
  plugins: [
    { src: '~/plugins/v-tooltip', ssr: false },
    { src: '~/plugins/v-clipboard', ssr: false },
    { src: '~/plugins/auth', ssr: false },
    { src: '~/plugins/error-handler', ssr: false },
  ],
  
  // Auto import components
  components: true,
  
  // Modules
  modules: [
    '@nuxtjs/pwa',
    '@nuxtjs/axios',
    '@nuxtjs/auth',
    'nuxt-buefy'
  ],
  
  // Axios module configuration
  axios: {
    baseURL: process.env.API_URL || 'http://localhost:8000',
    retry: { retries: 3 },
    debug: isDev
  },
  
  // Auth module configuration
  auth: {
    strategies: {
      local: {
        token: {
          property: 'token',
          global: true,
          required: true,
          type: 'Bearer'
        },
        user: {
          property: 'user',
          autoFetch: true
        },
        endpoints: {
          login: { url: '/login', method: 'post' },
          logout: false,
          user: { url: '/me', method: 'get' }
        }
      }
    },
    redirect: {
      login: '/signin',
      logout: '/',
      callback: '/signin',
      home: '/'
    }
  },
  
  // PWA module configuration
  pwa: {
    icon: {},
    manifest: {
      lang: 'en',
      name: 'TSL Sequence Store',
      short_name: 'SequenceStore',
      display: 'standalone',
      theme_color: '#8D80FA',
      background_color: '#ffffff'
    },
    workbox: {
      dev: false,
      offlineAnalytics: true,
      runtimeCaching: [
        {
          urlPattern: '/api/.*',
          handler: 'NetworkFirst',
          method: 'GET',
          strategyOptions: {
            cacheName: 'api-cache',
            cacheExpiration: {
              maxEntries: 10,
              maxAgeSeconds: 300
            }
          }
        }
      ]
    },
    meta: {
      theme_color: '#8D80FA',
    },
  },
  
  // Buefy configuration
  buefy: {
    css: false,
    materialDesignIcons: false,
  },
  
  // Router configuration
  router: {
    base: '/',
    linkActiveClass: 'is-active',
    middleware: ['auth'] // Apply auth middleware globally
  },
  
  // Build Configuration
  build: {
    // Analyze bundle size (run with: npm run build --analyze)
    analyze: false,
    
    // Extend webpack config
    extend(config) {
      config.resolve.alias['vue'] = 'vue/dist/vue.common'
    },
    
    // PostCSS configuration
    postcss: {
      preset: {
        features: {
          'custom-properties': false
        }
      }
    },
    
    // Sass loader configuration
    loaders: {
      scss: {
        sassOptions: {
          silenceDeprecations: [
            'legacy-js-api',
            'import',
            'global-builtin',
            'color-functions',
            'slash-div',
          ],
        },
      },
    },
    
    // Optimization
    optimization: {
      splitChunks: {
        chunks: 'all',
        automaticNameDelimiter: '.',
        name: !isDev,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            name: 'vendor'
          }
        }
      }
    },
    
    // Transpile dependencies if needed
    transpile: [],
    
    // Disable source maps in production for smaller builds
    ...(!isDev && {
      productionSourceMap: false,
      sourceMap: false
    })
  },
  
  // Loading bar
  loading: { 
    color: '#31CF65',
    height: '3px'
  },
  
  // Telemetry
  telemetry: false
}
```

### Step 8: Add JSDoc Comments

Even without TypeScript, JSDoc provides type hints:

```javascript
/**
 * Fetch all projects from the API
 * @param {Object} context - Vuex action context
 * @param {Function} context.commit - Vuex commit function
 * @returns {Promise<void>}
 */
async refreshProjects({ commit }) {
  try {
    const { data } = await this.$axios.get('/projects')
    commit('setProjects', data.projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    throw error
  }
}

/**
 * Format a date relative to now
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  return moment(date).fromNow()
}
```

### Step 9: Add More Tests

**tests/unit/store/projects.test.js**:
```javascript
import { describe, it, expect, vi } from 'vitest'
import { state, getters, mutations, actions } from '~/store/projects'

describe('Projects Store', () => {
  describe('state', () => {
    it('should have initial state', () => {
      const s = state()
      expect(s.list).toEqual([])
      expect(s.current).toBeNull()
      expect(s.loading).toBe(false)
    })
  })
  
  describe('getters', () => {
    it('should filter projects', () => {
      const s = {
        list: [
          { id: 1, name: 'Project Alpha' },
          { id: 2, name: 'Project Beta' }
        ]
      }
      
      const filtered = getters.filtered(s)('alpha')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('Project Alpha')
    })
  })
  
  describe('mutations', () => {
    it('should set projects list', () => {
      const s = state()
      const projects = [{ id: 1, name: 'Test' }]
      
      mutations.SET_LIST(s, projects)
      expect(s.list).toBe(projects)
    })
  })
})
```

### Step 10: Performance Optimizations

**1. Lazy load routes:**
```javascript
// pages/admin/index.vue
export default {
  components: {
    AdminPanel: () => import('~/components/admin/AdminPanel.vue')
  }
}
```

**2. Add loading states:**
```vue
<template>
  <div>
    <div v-if="$fetchState.pending">Loading...</div>
    <div v-else-if="$fetchState.error">Error loading data</div>
    <div v-else>{{ data }}</div>
  </div>
</template>

<script>
export default {
  async fetch() {
    this.data = await this.$axios.$get('/api/data')
  },
  data() {
    return {
      data: null
    }
  }
}
</script>
```

**3. Use keep-alive for cached components:**
```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <Header />
    <keep-alive>
      <Nuxt />
    </keep-alive>
  </div>
</template>
```

---

## 📋 Implementation Checklist

### Phase 1: Documentation & Organization
- [x] Create modernization plan
- [ ] Document current architecture
- [ ] Add JSDoc comments to key functions
- [ ] Create README for each major directory

### Phase 2: Code Structure
- [ ] Create `composables/` directory
- [ ] Create `utils/` directory
- [ ] Split store into modules
- [ ] Add TypeScript types (optional)

### Phase 3: Error Handling
- [ ] Add global error handler plugin
- [ ] Add error boundaries in key components
- [ ] Improve error messages
- [ ] Add retry logic for API calls

### Phase 4: Testing
- [ ] Add store tests
- [ ] Add utils tests
- [ ] Add more component tests
- [ ] Improve E2E test coverage

### Phase 5: Performance
- [ ] Add lazy loading for heavy components
- [ ] Optimize images
- [ ] Add caching strategies
- [ ] Bundle size analysis

### Phase 6: Developer Experience
- [ ] Add ESLint rules
- [ ] Add Prettier config
- [ ] Add pre-commit hooks (husky)
- [ ] Improve dev server performance

---

## 🎯 Quick Wins (Do First)

1. **Add composables directory** - 15 min
2. **Split store into modules** - 30 min
3. **Add error handler plugin** - 20 min
4. **Create utils directory** - 15 min
5. **Improve nuxt.config.js** - 20 min
6. **Add more tests** - 1 hour

**Total:** ~2.5 hours for major improvements!

---

## 📊 Benefits

### Before
- Single large store file
- No composables/utils
- Basic error handling
- Limited tests
- No TypeScript support

### After
- Organized modular store
- Reusable composables
- Comprehensive error handling
- Good test coverage
- TypeScript support (optional)
- Better performance
- Improved DX

---

## 🚀 Getting Started

```bash
# 1. Create new directories
mkdir -p composables utils types

# 2. Start with utils (safest)
touch utils/validators.js
touch utils/formatters.js
touch utils/constants.js

# 3. Add composables
touch composables/useApi.js
touch composables/useState.js

# 4. Split store (one at a time)
touch store/projects.js
touch store/samples.js
touch store/runs.js

# 5. Run tests to ensure nothing breaks
npm test

# 6. Run build to verify
npm run build
```

---

## 📚 Resources

- [Nuxt 2 Documentation](https://v2.nuxt.com/)
- [Vue 2 Style Guide](https://v2.vuejs.org/v2/style-guide/)
- [Vuex Best Practices](https://vuex.vuejs.org/guide/)
- [Testing Vue Components](https://v1.test-utils.vuejs.org/)

---

**Status:** Ready to implement  
**Risk Level:** Low (non-breaking changes)  
**Time Investment:** 2-8 hours (depending on depth)  
**ROI:** High (better maintainability, performance, DX)