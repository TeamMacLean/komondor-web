<template>
  <div id="home">
    <div class="columns is-gapless">
      <div class="column is-3 is-2-fullhd has-background-light sidebar">
        <div class="section">
          <div class="container">
            <h2 class="title is-5">
              Projects
              <nuxt-link
                to="/projects/new"
                class="button is-success is-small is-pulled-right"
                >New</nuxt-link
              >
              <div class="is-clearfix"></div>
            </h2>

            <b-field>
              <b-input
                v-model="projectFilterText"
                placeholder="Find a project..."
                @input="showAll"
              ></b-input>
            </b-field>
            <ul id="sidebar-projects">
              <b-loading
                :is-full-page="false"
                :active="$store.state.refreshingProjects"
                :can-cancel="false"
              ></b-loading>
              <li
                v-for="(project, index) in filteredProjects"
                :key="index"
                v-tooltip="{
                  content: `<div><p>${
                    /*getMultilinedName(*/ project.name /*)*/
                  }</p></div>`,
                  delay: {
                    show: 750,
                    hide: 2500,
                  },
                  placement: 'bottom-center',
                }"
              >
                <div class="truncate mb-2">
                  <nuxt-link
                    :to="{ name: 'project', query: { id: project._id } }"
                    class="has-text-weight-bold"
                  >
                    <b-icon
                      icon="folder-text-outline"
                      size="is-small"
                      class="has-text-grey"
                    />
                    {{ project.name }}
                  </nuxt-link>
                </div>
              </li>
              <li style="margin-top: 8px">
                <a
                  v-if="canShowMore"
                  class="has-text-black is-size-7"
                  @click="showAll"
                >
                  Show more
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="column is-9 is-10-fullhd">
        <div class="section fill-height">
          <h1 class="title is-2">Welcome to sequences.tsl.ac.uk!</h1>

          <div class="site-down">
            Site is temporarily down (19-10-2022). We are working to resolve the
            issue as soon as possible.
          </div>

          <h2 class="title is-4">Quick start</h2>
          <div>
            Check out our <a href="/help">FAQ</a> or read our
            <a href="/upload-instructions.html">Detailed User Guide</a>.
          </div>
          <br />

          <div v-if="!!showAdminSection">
            <h2 class="title is-4">Admin links</h2>
            <div>
              <a href="/export">Export run data as CSV</a>
            </div>
            <br />
          </div>

          <div v-if="$store.state.news.length" class="container">
            <h2 class="title is-4">Most recently added</h2>

            <b-loading
              :is-full-page="false"
              :active="$store.state.refreshingNews"
              :can-cancel="false"
            ></b-loading>
            <NewsCard
              v-for="(news, index) in $store.state.news"
              :key="index"
              :news="news"
            ></NewsCard>
          </div>
          <!-- lazy v-else. use slots TODO -->
          <div v-else class="container">
            <h2 class="title is-5">Most recently added</h2>

            <b-loading
              :is-full-page="false"
              :active="$store.state.refreshingNews"
              :can-cancel="false"
            ></b-loading>
            <div>
              No new projects from your group(s) added using this website
              recently!
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NewsCard from "./NewsCard";
export default {
  components: { NewsCard },
  data() {
    return {
      showingAll: false,
      projectFilterText: "",
      defaultProjectCount: 20,
    };
  },
  computed: {
    renderHome() {
      return this.$store.state.auth.loggedIn;
    },
    projects() {
      return this.$store.state.projects;
    },
    canShowMore() {
      return (
        this.filteredProjects.length &&
        !this.showingAll &&
        this.filteredProjects.length >= this.defaultProjectCount
      );
    },
    filteredProjects() {
      const self = this;
      const fp = self.$store.getters.filteredProjects(self.projectFilterText);
      // return fp;
      if (this.showingAll) {
        return fp;
      } else {
        return fp.slice(0, 20);
      }
    },
    showAdminSection() {
      return process.env.ENA_ADMINS.includes(this.$auth.$state.user.username);
    },
  },
  mounted() {
    if (this.$store.state.auth.loggedIn) {
      return Promise.all([
        this.$store.dispatch("refreshProjects"),
        this.$store.dispatch("refreshNews"),
      ]);
    }
  },
  methods: {
    showAll() {
      this.showingAll = true;
    },
    // getMultilinedName(name){
    //   if (!/\s/.test(name)){
    //     //break it up
    //     var newName = name
    //     var totalLength = name.length
    //     var addSpaceTargetIndex = 21;
    //     for (var i = 0; i < totalLength; i++){
    //       if (i === addSpaceTargetIndex){
    //         newName = newName.slice(0, addSpaceTargetIndex) + "-" + newName.slice(addSpaceTargetIndex);
    //         addSpaceTargetIndex = (addSpaceTargetIndex + addSpaceTargetIndex + 1)
    //         totalLength++
    //       }
    //     }
    //     return newName;
    //   } else {
    //     return name
    //   }
    // }
  },
};
</script>
<style>
.site-down {
  background-color: #ffcc00;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
  color: red;
}
</style>
