<template>
  <div>


    <div class="navbar-custom">
      <div class="navbar-left-custom">
        <div class="navbar-brand">
          <nuxt-link class="navbar-item-custom no-hover" to="/">
            <img src="/icon_28_white_outline.png" alt="Logo" width="28" height="28">
          </nuxt-link>
        </div>

       <nuxt-link class="navbar-item-custom has-text-weight-bold" to="/projects" v-if="this.$auth.loggedIn">
          Projects
        </nuxt-link>
      </div>


      <!-- <div class="navbar-center-custom"> -->
      <!-- <NavSearch v-if="this.$auth.loggedIn"/> -->
      <!-- </div> -->


      <div class="navbar-right-custom">

        <NavSearch v-if="this.$auth.loggedIn"/>

        <div class="navbar-item-custom has-dropdown is-hoverable" v-if="this.$auth.loggedIn">

          <div class="dropdown is-right">
            <div class="dropdown-trigger">
              <a aria-haspopup="true" aria-controls="dropdown-menu" class="with-arrow">
                <b-icon
                  icon="account-circle-outline"
                  size="is-medium"
                  class="mr-1-tablet"
                >
                </b-icon>
                <!--<font-awesome-icon :icon="['far', 'user-circle']" class="fa-2x mr-1-tablet"/>-->
                <!--<div class="is-hidden-mobile">{{this.$auth.user.name}}</div>-->
              </a>
            </div>
            <div class="dropdown-menu" id="dropdown-menu" role="menu">
              <div class="dropdown-content">


                <nuxt-link :to="{ name: 'user', query: { username: this.$auth.user.username }}" class="dropdown-item">
                  <b-icon
                    icon="account"
                    size="is-small">
                  </b-icon>
                  {{this.$auth.user.name}}
                  <!--Your profile-->
                </nuxt-link>

                <nuxt-link to="/admin" class="dropdown-item" v-if="this.$store.getters.isAdmin">
                  <b-icon
                    icon="shield-account-outline"
                    size="is-small">
                  </b-icon>
                  Admin
                </nuxt-link>
                <hr class="dropdown-divider">
                <nuxt-link to="/help" class="dropdown-item">
                  <b-icon
                    icon="help-circle-outline"
                    size="is-small">
                  </b-icon>
                  Help
                </nuxt-link>
                <nuxt-link to="/settings" class="dropdown-item">
                  <b-icon
                    icon="settings-outline"
                    size="is-small">
                  </b-icon>
                  Settings
                </nuxt-link>
                <a class="dropdown-item" v-on:click="LogOut">
                  <b-icon
                    icon="logout"
                    size="is-small">
                  </b-icon>
                  Sign out
                </a>


              </div>
            </div>
          </div>

        </div>


        <div class="navbar-item-custom" v-else>
          <div class="buttons">
            <nuxt-link to="/signin" class="button is-white" aria-role="menuitem">Log in</nuxt-link>
          </div>
        </div>
      </div>
    </div>


  </div>

</template>

<script>
    import NavSearch from '~/components/NavSearch.vue'

    export default {
        name: 'HeadAfterLogin',
        components: {NavSearch},
        methods: {
            async LogOut() {
                await this.$auth.logout();
                this.$buefy.toast.open('Logged out');
                this.$router.push({
                    path: '/'
                })
            }
        },
        mounted() {
            function getAll(selector) {
                return Array.prototype.slice.call(document.querySelectorAll(selector), 0);
            }

            var $dropdowns = getAll('.dropdown:not(.is-hoverable)');

            if ($dropdowns.length > 0) {
                $dropdowns.forEach(function ($el) {
                    $el.addEventListener('click', function (event) {
                        event.stopPropagation();
                        $el.classList.toggle('is-active');
                    });
                });

                document.addEventListener('click', function (event) {
                    closeDropdowns();
                });
            }

            function closeDropdowns() {
                $dropdowns.forEach(function ($el) {
                    $el.classList.remove('is-active');
                });
            }
        }
    }
</script>

<style>
  /*.fake-navbar-item {*/
  /*align-items: center;*/
  /*color: #fff;*/
  /*display: flex;*/
  /*flex-grow: 0;*/
  /*flex-shrink: 0;*/
  /*font-size: 16px;*/
  /*font-weight: 400;*/
  /*height: 64px;*/
  /*line-height: 24px;*/
  /*padding: 0.5rem 0.75rem;*/
  /*position: relative;*/
  /*}*/

  /*.navbar-right-custom {*/
  /*margin-left: auto;*/
  /*display: flex;*/


  /*}*/

  /*@media screen and (max-width: 1023px) {*/
  /*.navbar-right-custom {*/
  /*flex-grow: 1;*/
  /*flex-shrink: 0;*/
  /*align-items: stretch;*/
  /*}*/
  /*}*/


  /*.mail-status.unread {*/
  /*position: absolute;*/
  /*top: 10px;*/
  /*left: 10px;*/
  /*z-index: 2;*/
  /*width: 14px;*/
  /*height: 14px;*/
  /*color: #fff;*/
  /*background-image: linear-gradient(#54a3ff, #006eed);*/
  /*background-clip: padding-box;*/
  /*border: 2px solid #24292e;*/
  /*border-radius: 50%;*/
  /*}*/

  /*.navbar-menu, .burger, .navbar-burger {*/
  /*display: none;*/
  /*}*/

  @media screen and (min-width: 769px) {
    .mr-1-tablet {
      margin-right: 8px;
    }
  }
</style>

