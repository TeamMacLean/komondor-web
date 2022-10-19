<template>
  <div>
    <div class="navbar-custom">
      <div class="navbar-left-custom">
        <div class="navbar-brand">
          <nuxt-link class="navbar-item-custom no-hover" to="/">
            <img src="/icon_28.png" alt="Logo" width="28" height="28" />
            <!-- <h1 class="title is-3 has-text-white">Sequence Store</h1> -->
            <!-- Home -->
          </nuxt-link>
        </div>

        <nuxt-link
          v-if="$auth.loggedIn"
          class="navbar-item-custom has-text-weight-bold"
          to="/"
        >
          Home
        </nuxt-link>

        <nuxt-link
          v-if="$auth.loggedIn"
          class="navbar-item-custom has-text-weight-bold"
          to="/projects"
        >
          Projects
        </nuxt-link>
      </div>

      <div class="nav-search-wrapper">
        <NavSearch v-if="$auth.loggedIn" />
      </div>

      <div class="navbar-menu">
        <div class="navbar-end">
          <b-dropdown
            close-on-click
            position="is-bottom-left"
            append-to-body
            aria-role="menu"
            trap-focus
          >
            <button
              slot="trigger"
              slot-scope="{ active }"
              class="button is-primary"
            >
              <b-icon
                icon="account-circle-outline"
                size="is-medium"
                class="mr-1-tablet"
              ></b-icon>
              <b-icon :icon="active ? 'menu-up' : 'menu-down'"></b-icon>
            </button>

            <!-- 
              HACKY using 'close-on-click' and css to have easier modal close functionaliyt
              TODO consider reading buefy modal docs
            -->
            <div class="close-mobile-modal has-text-right">
              Press 'Esc' to close
              <!-- <b-icon icon="close" size="is-medium"></b-icon> -->
            </div>

            <b-dropdown-item aria-role="listitem">
              <nuxt-link
                v-if="$auth.loggedIn"
                :to="{
                  name: 'user',
                  query: { username: $auth.user.username },
                }"
                class="dropdown-item"
              >
                <b-icon icon="account" size="is-small"></b-icon>
                {{ $auth.user.name }}
              </nuxt-link>
            </b-dropdown-item>

            <b-dropdown-item aria-role="listitem">
              <nuxt-link
                v-if="$store.getters.isAdmin"
                to="/admin"
                class="dropdown-item"
              >
                <b-icon icon="shield-account-outline" size="is-small"></b-icon
                >Admin
              </nuxt-link>
            </b-dropdown-item>

            <hr class="dropdown-divider" />

            <b-dropdown-item aria-role="listitem">
              <nuxt-link to="/help" class="dropdown-item">
                <b-icon icon="help-circle-outline" size="is-small"></b-icon>Help
              </nuxt-link>
            </b-dropdown-item>

            <b-dropdown-item aria-role="listitem">
              <a class="dropdown-item" @click="LogOut">
                <b-icon icon="logout" size="is-small"></b-icon>Sign out
              </a>
            </b-dropdown-item>
          </b-dropdown>
        </div>
      </div>
    </div>

    <!-- Matomo GEORGE REMOVES
    <script>
      var _paq = window._paq = window._paq || [];
      /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
      _paq.push(['trackPageView']);
      _paq.push(['enableLinkTracking']);
      (function() {
        var u= https://matomo.researchcomputing.nbi.ac.uk/;
        _paq.push(['setTrackerUrl', u+'matomo.php']);
        _paq.push(['setSiteId', '6']);
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
      })();
    </script>
    End Matomo Code -->
  </div>
</template>

<script>
import NavSearch from "~/components/NavSearch.vue";

export default {
  name: "HeadAfterLogin",
  components: { NavSearch },
  mounted() {
    function getAll(selector) {
      return Array.prototype.slice.call(document.querySelectorAll(selector), 0);
    }

    var $dropdowns = getAll(".dropdown:not(.is-hoverable)");

    if ($dropdowns.length > 0) {
      $dropdowns.forEach(function ($el) {
        $el.addEventListener("click", function (event) {
          event.stopPropagation();
          $el.classList.toggle("is-active");
        });
      });

      document.addEventListener("click", function () {
        closeDropdowns();
      });
    }

    function closeDropdowns() {
      $dropdowns.forEach(function ($el) {
        $el.classList.remove("is-active");
      });
    }
  },
  methods: {
    async LogOut() {
      await this.$auth.logout();
      this.$buefy.toast.open("Logged out");
      this.$router.push({
        path: "/",
      });
    },
  },
};
</script>

<style scoped>
.nav-search-wrapper {
  display: flex;
  flex-grow: 10;
  justify-content: center;
}
.close-mobile-modal {
  margin-right: 10px;
}

/* MEDIA QUERIES */

@media screen and (max-width: 1023px) {
  .navbar-menu {
    display: contents;
  }
}

@media screen and (max-width: 768px) {
  .nav-search-wrapper {
    display: none;
  }
}

@media screen and (min-width: 769px) {
  .mr-1-tablet {
    margin-right: 8px;
  }
}

@media screen and (min-width: 1024px) {
  .close-mobile-modal {
    display: none;
  }
}
</style>
