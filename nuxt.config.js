require('dotenv').config();

export default {
  mode: 'universal',
  server: {
    port: process.env.PORT || 3000, // default: 3000
    host: process.env.HOST || 'localhost', // default: localhost
  },
  head: {
    title: process.env.npm_package_name || '',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      {charset: 'utf-8'},
      {name: 'viewport', content: 'width=device-width, initial-scale=1'},
      {hid: 'description', name: 'description', content: process.env.npm_package_description || ''}
    ],
    // link: [{rel: 'icon', type: 'image/x-icon', href: '/icons/favicon.ico'}],
  },
  // serverMiddleware: [
  //   bodyParser.json(),
  //   bodyParser.urlencoded({extended: false}),
  //   '~'
  // ],
  loading: {color: '#31CF65'},
  css: ['~/assets/main.scss'],
  plugins: [{src: '~/plugins/v-tooltip', ssr: false}],
  modules: [
    '@nuxtjs/pwa',
    '@nuxtjs/axios',
    '@nuxtjs/auth',
    'nuxt-buefy',
    // 'nuxt-fontawesome', //V
  ],
  pwa:{
    meta:{
      theme_color:'#8D80FA'
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
          login: {url: '/login', method: 'post', propertyName: 'token'},
          logout: false,
          // logout: {url: '/logout', method: 'post'},
          user: {url: '/me', method: 'get', propertyName: 'user'}
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
    linkActiveClass: 'is-active',
  },
  build: {
    postcss: {
      preset: {
        features: {
          customProperties: false
        }
      }
    },
    extend(config, ctx) {
    }
  }
}
