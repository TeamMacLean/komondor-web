require('dotenv').config();

export default {
  mode: 'universal',
  render: {
    ssr: false
  },
  http: {
    // global, so try to avoid
    headers: {
      'Access-Control-Allow-Origin': '*',
      // 'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS, PUT, PATCH, DELETE',
      // 'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization, Origin, Accept',
      // 'Access-Control-Allow-Credentials': false,
    }
  },
  env: {
    // baseURL: process.env.HOST,
    API_URL: process.env.API_URL,
    HOST: process.env.HOST,
    HPC_DATASTORE_ROOT: process.env.HPC_DATASTORE_ROOT,
    DATAHOG_DEATH: process.env.DATAHOG_DEATH,
  },
  server: {
    port: process.env.PORT || 3000, // default: 3000
    host: process.env.HOST || 'localhost', // default: localhost
  },
  head: {
    title: 'TSL Sequence Store',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'TSL Sequence Store' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'mobile-web-app-capable', content: 'yes' }
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/icons/favicon.ico' }],
  },
  // serverMiddleware: [
  //   bodyParser.json(),
  //   bodyParser.urlencoded({extended: false}),
  //   '~'
  // ],
  loading: { color: '#31CF65' },
  css: ['~/assets/main.scss'],
  plugins: [
    { src: '~/plugins/v-tooltip', ssr: false },
    { src: '~/plugins/v-clipboard', ssr: false },
  ],
  modules: [
    '@nuxtjs/pwa',
    '@nuxtjs/axios',
    '@nuxtjs/auth',
    'nuxt-buefy',
    // 'nuxt-fontawesome', //V
  ],
  pwa: {
    icon: {},
    manifest: {
      lang: 'en',
      name: "TSL Sequence Store",
      short_name: "SequenceStore",
      display: 'standalone',
      theme_color: '#8D80FA',
    },
    workbox: {
      dev: false // Put workbox module into development mode based on current NODE_ENV variable
    },
    meta: {
      theme_color: '#8D80FA'
    }
  },
  buefy: {
    css: false,
    materialDesignIcons: false,
    // defaultIconPack: 'mdi',
    // defaultIconPack: 'fas',
    // defaultIconComponent: 'font-awesome-icon'
  },
  axios: {
    baseURL: process.env.API_URL
  },
  auth: {
    strategies: {
      local: {
        endpoints: {
          login: { url: '/login', method: 'post', propertyName: 'token' },
          logout: false,
          // logout: {url: '/logout', method: 'post'},
          user: { url: '/me', method: 'get', propertyName: 'user' }
        },
        // tokenRequired: true,
        // tokenType: 'bearer'
      }
    },
    redirect: {
      login: '/signin',
    }
  },
  router: {
    base: '/',
    linkActiveClass: 'is-active',
  },
  build: {
    extend(config, { isDev, isClient }) {
      config.resolve.alias["vue"] = "vue/dist/vue.common";
    },
    postcss: {
      preset: {
        features: {
          customProperties: false
        }
      }
    }
  }
}
