<template>
  <div id="home">
    <div class="columns is-gapless">
      <div class="column is-3 is-3-fullhd">

        <div class="section">
          <div class="container">
            <h2 class="title is-5">
              Projects
              <nuxt-link to="/projects/new" class="button is-success is-small is-pulled-right">
                New
              </nuxt-link>
              <div class="is-clearfix"></div>
            </h2>

            <b-field>
              <b-input placeholder="Find a project..." v-model="projectFilterText" @input="showAll"></b-input>
            </b-field>
            <ul id="sidebar-projects">
              <b-loading :is-full-page="false" :active="$store.state.refreshingProjects" :can-cancel="false"></b-loading>
              <li v-for="project in filteredProjects" v-tooltip.top-center='project.name'>
                <div class="truncate mb-2">

                  <nuxt-link :to="{ name: 'project', query: { id: project._id }}"
                             class="has-text-weight-bold">
                    <b-icon
                      icon="alpha-p-box-outline"
                      size="is-small"
                      class="has-text-grey">
                    </b-icon>
                    {{project.name}}
                  </nuxt-link>
                </div>
              </li>
              <li style="margin-top:8px;">
                <a class="has-text-black is-size-7" @click="showAll" v-if="filteredProjects.length && !showingAll">Show
                  more</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="column is-9 is-9-fullhd has-background-light">

        <div class="section fill-height">
          <div class="container">

            <h2 class="title is-5">
              Recently added
            </h2>

            <b-loading :is-full-page="false" :active="$store.state.refreshingNews" :can-cancel="false"></b-loading>
            <NewsCard v-for="(news, index) in $store.state.news" :news="news" :key="index"></NewsCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import NewsCard from './NewsCard';

  export default {
    components: {NewsCard},
    data() {
      return {
        showingAll: false,
        projectFilterText: '',
      }
    },
    mounted() {
      if (this.$store.state.auth.loggedIn) {
        return Promise.all([
          this.$store.dispatch('refreshProjects'),
          this.$store.dispatch('refreshNews')
        ])
      }
    },
    methods: {
      showAll() {
        this.showingAll = true;
      }
    },
    computed: {
      renderHome() {
        return this.$store.state.auth.loggedIn
      },
      projects() {
        return this.$store.state.projects;
      },
      filteredProjects() {
        const self = this;
        const fp = self.$store.getters.filteredProjects(self.projectFilterText);
        // return fp;
        if (this.showingAll) {
          return fp
        } else {
          return fp.slice(0, 20);
        }
      }
    }
  }
</script>
