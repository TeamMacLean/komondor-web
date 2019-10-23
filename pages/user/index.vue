<template>
  <div class="section">
    <div class="container">
      <div class="columns">
        <div class="column is-4 is-3-desktop">

          <div class="columns is-mobile is-multiline">
            <div class="column is-4-mobile is-full-tablet">
              <img :src="icon" alt="User image" class="image" style="width:100%;">

            </div>
            <div class="column is-8-mobile is-full-tablet">
              <h1 class="title">{{fullName}}</h1>
              <h2 class="subtitle">{{username}}</h2>
              <p>
                <font-awesome-icon :icon="['fas', 'users']" style="margin-right:8px;"/>
                {{company}}
              </p>
              <p>
                <font-awesome-icon :icon="['far', 'envelope']" style="margin-right:8px;"/>
                <a :href="'mailto:'+email" target="_blank">{{email}}</a></p>
            </div>
          </div>


        </div>
        <div class="column is-8 is-9-desktop">
          <h1 class="title is-4">{{pronown}} Projects</h1>

          <ProjectList :projects="projects"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import ProjectList from '~/components/projects/ProjectList.vue'
  import Identicon from 'identicon.js';

  export default {
    middleware: 'auth',
    components: {
      ProjectList
    },
    fetch({store}) {

      return Promise.all([
        // store.dispatch('refreshProjects'),
        store.dispatch('refreshGroups')
      ])
    },
    asyncData({route, $axios, error}) {

      function userNotFound() {
        error({statusCode: 404, message: 'User not found'})
      }

      if (!route.query.id && !route.query.username) {
        userNotFound()
      }

      return $axios.get('/user', {params: {username: route.query.username, projects: true}})
        .then(res => {
          if (res.status === 200) {
            if (res.data.user) {
              return {
                user: res.data.user
              }
            } else {
              userNotFound()
            }
          } else {
            userNotFound()
          }
        })
        .catch(err => {
          console.error(err);
          userNotFound()
        })
    },
    computed: {

      icon() {
        const placeholder = 'https://bulma.io/images/placeholders/256x256.png';
        if (this.user) {
          try {
            var data = new Identicon(this.user.username+this.user._id, 256).toString();
            return 'data:image/png;base64,' + data;
          } catch (err) {
            console.error(err);
            return placeholder
          }
        } else {
          return placeholder
        }
      },

      username() {
        if (this.user) {
          return this.user.username
        }
        if (this.$route.query.username) {
          return this.$route.query.username;
        }
        return 'unknown'
      },
      fullName() {
        if (this.user) {
          return this.user.name
        }
        if (this.$route.query.username) {
          return this.$route.query.username;
        }
        return 'unknown'
      },
      email() {
        if (this.user) {
          return this.user.email
        }
        if (this.$route.query.username) {
          return this.$route.query.username;
        }
        return 'unknown'
      },
      company() {
        if (this.user) {
          return this.user.company
        }
        if (this.$route.query.username) {
          return this.$route.query.username;
        }
        return 'unknown'
      },
      projects() {
        if (this.user) {
          return this.user.projects
        } else {
          return []
        }
      },

      pronown() {
        if (this.$auth.user.username === this.$route.query.username) {
          return "Your"
        } else {
          return this.fullName + "'s";
        }
      }
    }
  }
</script>
