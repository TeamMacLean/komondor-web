<template>
  <div id="home">
    <div class="columns is-gapless">
      <div class="column is-3 is-2-fullhd has-background-light sidebar">
        <div class="section">
          <div class="container">
            <h2 class="title is-5">
              Projects
              <nuxt-link to="/projects/new" class="button is-success is-small is-pulled-right">New</nuxt-link>
              <div class="is-clearfix"></div>
            </h2>

            <b-field>
              <b-input placeholder="Find a project..." v-model="projectFilterText" @input="showAll"></b-input>
            </b-field>
            <ul id="sidebar-projects">
              <b-loading
                :is-full-page="false"
                :active="$store.state.refreshingProjects"
                :can-cancel="false"
              ></b-loading>
              <li
                v-for="(project,index) in filteredProjects"
                :key="index"
                v-tooltip="{
                  content:`<div><p>${/*getMultilinedName(*/project.name/*)*/}</p></div>`,
                  delay: {
                    show: 750,
                    hide: 2500,
                  },
                  placement: 'bottom-center',
                }"
              >
                <div class="truncate mb-2">
                  <nuxt-link
                    :to="{ name: 'project', query: { id: project._id }}"
                    class="has-text-weight-bold"
                  >
                    <b-icon icon="folder-text-outline" size="is-small" class="has-text-grey"/>
                    {{project.name}}
                  </nuxt-link>
                </div>
              </li>
              <li style="margin-top:8px;">
                <a class="has-text-black is-size-7" @click="showAll" v-if="canShowMore">
                  Show
                  more
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="column is-9 is-10-fullhd">
        <div class="section fill-height">

          <div class="container" v-if="$store.state.news.length">
            <h2 class="title is-5">Most recently added</h2>

            <b-loading
              :is-full-page="false"
              :active="$store.state.refreshingNews"
              :can-cancel="false"
            ></b-loading>
            <NewsCard v-for="(news, index) in $store.state.news" :news="news" :key="index"></NewsCard>
          </div>
          <!-- lazy v-else. use slots TODO -->
          <div v-else class="container">
            <h2 class="title is-5">Most recently added</h2>

            <b-loading
              :is-full-page="false"
              :active="$store.state.refreshingNews"
              :can-cancel="false"
            ></b-loading>
            <div>No new projects from your group(s) added using this website recently!</div>
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
      defaultProjectCount: 20
    };
  },
  mounted() {
    if (this.$store.state.auth.loggedIn) {
      return Promise.all([
        this.$store.dispatch("refreshProjects"),
        this.$store.dispatch("refreshNews")
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
    }
  }
};
</script>
