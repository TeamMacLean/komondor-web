# Nuxt 3 Migration Plan 🚀

**Date:** November 11, 2024  
**Migration:** Nuxt 2.18.1 → Nuxt 3.x  
**Status:** Planning Phase

---

## ⚠️ Important: This is a Major Breaking Change

Nuxt 3 is a complete rewrite with significant breaking changes:
- Vue 2 → Vue 3 (Composition API, new reactivity)
- Webpack → Vite (faster builds)
- Vuex → Pinia (recommended state management)
- Different plugin/middleware APIs
- Auto-imports for components and composables
- TypeScript-first approach

## 📋 Pre-Migration Checklist

### Current Stack Analysis
- [x] Nuxt 2.18.1
- [x] Vue 2.x
- [x] Vuex store (store/index.js)
- [x] @nuxtjs/auth (NOT compatible with Nuxt 3)
- [x] @nuxtjs/axios (needs migration)
- [x] Buefy (NO official Nuxt 3 support)
- [x] Multiple Vue 2 plugins (v-tooltip, v-clipboard, etc.)
- [x] Sass/SCSS styling
- [x] Custom middleware (admin.js)

### Critical Breaking Changes

#### 1. Authentication (@nuxtjs/auth)
**Problem:** @nuxtjs/auth does NOT work with Nuxt 3  
**Solutions:**
- Option A: Use `@sidebase/nuxt-auth` (popular alternative)
- Option B: Use `nuxt-auth-utils` 
- Option C: Build custom auth with composables
- **Recommended:** @sidebase/nuxt-auth

#### 2. Buefy UI Framework
**Problem:** Buefy has NO official Nuxt 3 support  
**Solutions:**
- Option A: Switch to Bulma + custom Vue 3 components
- Option B: Switch to Vuetify 3 (material design)
- Option C: Switch to PrimeVue (has Nuxt 3 module)
- Option D: Switch to Naive UI
- **Recommended:** Bulma + custom components (minimal changes) OR PrimeVue

#### 3. Vuex Store
**Problem:** Vuex is in maintenance mode  
**Solution:** Migrate to Pinia (official Vue 3 state management)

#### 4. Vue 2 Plugins
**Need Updates:**
- `v-tooltip` → Use `floating-vue` for Vue 3
- `v-clipboard2` → Use `vue-clipboard3` for Vue 3
- `v-runtime-template` → May not have Vue 3 version

## 🎯 Migration Strategy

### Phase 1: Dependency Updates (BREAKING)

```json
{
  "dependencies": {
    "nuxt": "^3.13.0",
    "vue": "^3.4.0",
    "vue-router": "^4.4.0",
    
    // State Management
    "@pinia/nuxt": "^0.5.0",
    "pinia": "^2.2.0",
    
    // HTTP Client (replaces @nuxtjs/axios)
    "@nuxt/http": "^3.0.0",
    // OR use native fetch/ofetch (built-in to Nuxt 3)
    
    // Auth (replaces @nuxtjs/auth)
    "@sidebase/nuxt-auth": "^0.9.0",
    
    // PWA
    "@vite-pwa/nuxt": "^0.10.0",
    
    // UI Framework Options:
    // Option A: Keep Bulma, drop Buefy
    "bulma": "^1.0.0",
    
    // Option B: Switch to PrimeVue
    "@primevue/nuxt-module": "^0.3.0",
    "primevue": "^3.50.0",
    
    // Updated plugins
    "floating-vue": "^5.2.0",  // replaces v-tooltip
    "vue-clipboard3": "^2.0.0", // replaces vue-clipboard2
    
    // Keep these
    "@mdi/font": "^7.4.0",
    "bulma": "^1.0.0",
    "moment": "^2.30.0",
    "papaparse": "^5.4.0",
    "uuid": "^10.0.0",
    "spark-md5": "^3.0.2",
    "lodash-es": "^4.17.21",
    "jsonwebtoken": "^9.0.2",
    
    // Uppy (check Vue 3 compatibility)
    "@uppy/core": "^3.0.0",
    "@uppy/dashboard": "^3.0.0",
    "@uppy/drag-drop": "^3.0.0",
    "@uppy/tus": "^3.0.0"
  },
  "devDependencies": {
    "@nuxt/test-utils": "^3.13.0",
    "@vue/test-utils": "^2.4.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "vitest": "^3.2.0",
    "@vitest/ui": "^3.2.0",
    "playwright": "^1.56.0",
    "@playwright/test": "^1.56.0"
  }
}
```

### Phase 2: File Structure Changes

#### New Files to Create:
```
komondor-web/
├── app.vue                    # NEW: Root app component
├── nuxt.config.ts             # Renamed from .js to .ts
├── tsconfig.json              # NEW: TypeScript config (optional but recommended)
└── composables/               # NEW: Auto-imported composables
    └── useAuth.ts
```

#### Directories Remain Same:
- `pages/` - Still used for routing
- `components/` - Still used, now auto-imported
- `assets/` - Still used for styles
- `public/` - Replaces `static/`
- `middleware/` - Still used, different syntax
- `plugins/` - Still used, different syntax
- `layouts/` - Still used

#### Directories to Migrate:
- `store/` → Convert Vuex to Pinia stores in `stores/`

### Phase 3: Code Refactoring

#### 3.1 Nuxt Config Migration

**From:** `nuxt.config.js`
```javascript
export default {
  render: { ssr: false },
  modules: ['@nuxtjs/axios', '@nuxtjs/auth', 'nuxt-buefy'],
  axios: { baseURL: process.env.API_URL },
  auth: { /* config */ }
}
```

**To:** `nuxt.config.ts`
```typescript
export default defineNuxtConfig({
  ssr: false,
  modules: [
    '@pinia/nuxt',
    '@sidebase/nuxt-auth',
    '@vite-pwa/nuxt'
  ],
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL || 'http://localhost:8000'
    }
  },
  auth: {
    baseURL: process.env.API_URL,
    provider: {
      type: 'local',
      endpoints: {
        signIn: { path: '/login', method: 'post' },
        signOut: { path: '/logout', method: 'post' },
        getSession: { path: '/me', method: 'get' }
      }
    }
  }
})
```

#### 3.2 Store Migration (Vuex → Pinia)

**From:** `store/index.js` (Vuex)
```javascript
export const state = () => ({
  projects: [],
  users: []
})

export const mutations = {
  setProjects(state, projects) {
    state.projects = projects
  }
}

export const actions = {
  async refreshProjects({ commit }) {
    const { data } = await this.$axios.get('/projects')
    commit('setProjects', data.projects)
  }
}
```

**To:** `stores/main.ts` (Pinia)
```typescript
import { defineStore } from 'pinia'

export const useMainStore = defineStore('main', {
  state: () => ({
    projects: [] as Project[],
    users: [] as User[],
    samples: [] as Sample[],
    runs: [] as Run[]
  }),
  
  getters: {
    filteredProjects: (state) => (filterText: string) => {
      if (!filterText) return state.projects
      return state.projects.filter(p => 
        p.name.toLowerCase().includes(filterText.toLowerCase())
      )
    }
  },
  
  actions: {
    async refreshProjects() {
      const { data } = await $fetch('/projects')
      this.projects = data.projects
    }
  }
})
```

#### 3.3 Component Migration

**From:** Vue 2 Options API
```vue
<template>
  <div>{{ message }}</div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello'
    }
  },
  computed: {
    ...mapState(['projects'])
  },
  methods: {
    ...mapActions(['refreshProjects'])
  },
  mounted() {
    this.refreshProjects()
  }
}
</script>
```

**To:** Vue 3 Composition API (Recommended)
```vue
<template>
  <div>{{ message }}</div>
</template>

<script setup lang="ts">
const message = ref('Hello')
const store = useMainStore()

const { projects } = storeToRefs(store)

onMounted(async () => {
  await store.refreshProjects()
})
</script>
```

#### 3.4 Plugin Migration

**From:** `plugins/auth.js`
```javascript
export default ({ $axios, redirect, store }) => {
  $axios.onError(error => {
    if (error.response.status === 401) {
      redirect('/signin')
    }
  })
}
```

**To:** `plugins/auth.ts`
```typescript
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  
  nuxtApp.hook('app:error', (error) => {
    if (error.statusCode === 401) {
      router.push('/signin')
    }
  })
})
```

#### 3.5 Middleware Migration

**From:** `middleware/admin.js`
```javascript
export default function ({ store, redirect }) {
  if (!store.getters.isAdmin) {
    return redirect('/')
  }
}
```

**To:** `middleware/admin.ts`
```typescript
export default defineNuxtRouteMiddleware((to, from) => {
  const { status, data } = useAuth()
  
  if (status.value !== 'authenticated' || !data.value?.isAdmin) {
    return navigateTo('/')
  }
})
```

#### 3.6 Composables (New Pattern)

Create `composables/useAuth.ts`:
```typescript
export const useAuth = () => {
  const { data, status, signIn, signOut } = useAuth()
  
  const isAuthenticated = computed(() => status.value === 'authenticated')
  const isAdmin = computed(() => data.value?.isAdmin ?? false)
  
  return {
    user: data,
    status,
    isAuthenticated,
    isAdmin,
    signIn,
    signOut
  }
}
```

### Phase 4: Test Updates

#### Update Vitest Config
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts']
  }
})
```

#### Update Test Utils
```typescript
// tests/setup.ts
import { config } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

config.global.plugins = [createTestingPinia()]
```

## 📝 Step-by-Step Migration Process

### Step 1: Backup
```bash
git checkout -b nuxt3-migration
git add -A
git commit -m "Backup before Nuxt 3 migration"
```

### Step 2: Clean Install
```bash
rm -rf node_modules package-lock.json .nuxt
```

### Step 3: Update package.json
Update all dependencies to Nuxt 3 compatible versions

### Step 4: Create app.vue
```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

### Step 5: Rename static/ to public/
```bash
mv static public
```

### Step 6: Update nuxt.config
Convert to TypeScript and update syntax

### Step 7: Migrate Store
Convert Vuex store to Pinia

### Step 8: Update Components
Convert to Composition API where beneficial

### Step 9: Update Plugins
Use new plugin syntax

### Step 10: Update Middleware
Use new middleware syntax

### Step 11: Install & Test
```bash
npm install
npm run dev
npm test
npm run build
```

## 🚧 Migration Challenges & Solutions

### Challenge 1: Buefy Components
**Problem:** Buefy not compatible with Nuxt 3  
**Solution Options:**

1. **Keep Bulma CSS + Create wrapper components**
   ```vue
   <!-- components/BButton.vue -->
   <template>
     <button class="button" :class="classes">
       <slot />
     </button>
   </template>
   ```

2. **Switch to PrimeVue**
   - Has Nuxt 3 module
   - Similar component API
   - More migration work

### Challenge 2: $axios → $fetch
**Problem:** @nuxtjs/axios doesn't exist in Nuxt 3  
**Solution:** Use built-in $fetch or composables

```typescript
// Before
this.$axios.get('/projects')

// After (Option 1: $fetch)
$fetch('/projects')

// After (Option 2: useFetch)
const { data } = await useFetch('/projects')

// After (Option 3: useAsyncData)
const { data } = await useAsyncData('projects', () => $fetch('/projects'))
```

### Challenge 3: Auth System
**Problem:** @nuxtjs/auth incompatible  
**Solution:** Use @sidebase/nuxt-auth

```typescript
// In components
const { data, status, signIn, signOut } = useAuth()

// Check auth status
if (status.value === 'authenticated') {
  console.log('User:', data.value)
}
```

## ⏱️ Estimated Timeline

- **Phase 1: Setup & Dependencies** - 2 hours
- **Phase 2: Core Files** - 2 hours
- **Phase 3: Store Migration** - 2 hours
- **Phase 4: Component Updates** - 4-8 hours (depending on count)
- **Phase 5: Plugin/Middleware** - 2 hours
- **Phase 6: Testing & Fixes** - 4-8 hours
- **Phase 7: UI Framework** - 4-8 hours (if replacing Buefy)

**Total Estimated Time:** 20-32 hours

## ✅ Testing Checklist

- [ ] App runs in dev mode (`npm run dev`)
- [ ] App builds successfully (`npm run build`)
- [ ] All pages load correctly
- [ ] Authentication works (login/logout)
- [ ] API calls work
- [ ] State management works
- [ ] Routing works
- [ ] Middleware works
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] No console errors
- [ ] Performance is good

## 📚 Resources

- [Nuxt 3 Documentation](https://nuxt.com/)
- [Nuxt 2 to 3 Migration Guide](https://nuxt.com/docs/migration/overview)
- [Vue 3 Migration Guide](https://v3-migration.vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [@sidebase/nuxt-auth](https://sidebase.io/nuxt-auth/getting-started)
- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html)

## ⚠️ Risk Assessment

**High Risk:**
- Auth system complete rewrite
- Buefy → Alternative UI framework
- Multiple Vue 2 plugins need alternatives

**Medium Risk:**
- Vuex → Pinia migration
- Plugin/middleware syntax changes
- API call refactoring

**Low Risk:**
- File structure changes
- Nuxt config updates
- Test updates

## 🎯 Recommendation

**Option 1: Full Migration (Recommended for long-term)**
- Complete Nuxt 3 upgrade
- Replace Buefy with modern alternative
- Use Composition API
- Full TypeScript

**Option 2: Incremental (Lower risk)**
- Stay on Nuxt 2 for now
- Gradually update dependencies
- Plan migration for later

**Option 3: Hybrid (Compromise)**
- Migrate to Nuxt 3
- Keep Options API initially
- Gradually adopt Composition API
- Use Bulma + custom components (avoid full UI framework migration)

## 📊 Decision Matrix

| Factor | Nuxt 2 (Current) | Nuxt 3 (Migrate) |
|--------|------------------|------------------|
| Performance | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Dev Experience | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Future Support | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Migration Effort | ⭐⭐⭐⭐⭐ | ⭐ |
| Breaking Changes | None | Many |
| Time Investment | None | 20-32 hours |

---

**Status:** Ready to proceed with migration  
**Recommended Approach:** Option 3 (Hybrid)  
**Next Step:** Begin Phase 1 - Dependency Updates