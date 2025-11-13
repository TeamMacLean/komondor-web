<template>
  <div id="home">
    <div class="columns is-gapless">
      <!-- Sidebar for Projects -->
      <aside class="column is-3 is-2-fullhd has-background-light sidebar">
        <div class="section">
          <div class="container">
            <div
              class="
                is-flex is-justify-content-space-between is-align-items-center
                mb-4
              "
            >
              <h2 class="title is-5 mb-0">Projects</h2>
              <nuxt-link to="/projects/new" class="button is-success is-small">
                New
              </nuxt-link>
            </div>

            <b-field>
              <b-input
                v-model="projectFilterText"
                placeholder="Find a project..."
                icon="magnify"
                clearable
              ></b-input>
            </b-field>

            <ul id="sidebar-projects">
              <b-loading :is-full-page="false" :active="isLoading"></b-loading>
              <li
                v-for="project in displayedProjects"
                :key="project._id"
                class="truncate mb-2"
              >
                <nuxt-link
                  :to="{ name: 'project', query: { id: project._id } }"
                  class="has-text-weight-bold"
                  v-tooltip="{
                    content: project.name,
                    delay: 500,
                    placement: 'bottom-start',
                  }"
                >
                  <b-icon
                    icon="folder-text-outline"
                    size="is-small"
                    class="has-text-grey mr-1"
                  />
                  {{ project.name }}
                </nuxt-link>
              </li>
              <li v-if="canShowMore" class="mt-2">
                <a class="has-text-black is-size-7" @click="showAll">
                  Show more...
                </a>
              </li>
              <li v-if="!isLoading && projects.length === 0">
                <p class="is-size-7 has-text-grey">No projects found.</p>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="column is-9 is-10-fullhd">
        <div class="section fill-height">
          <h1 class="title is-2">Welcome to sequences.tsl.ac.uk!</h1>

          <h2 class="subtitle is-4">Quick start</h2>
          <p class="block">
            Check out our <a href="/help">FAQ</a> or read our
            <a href="/upload-instructions.html">Detailed User Guide</a>.
          </p>

          <div v-if="isAdmin" class="block">
            <h3 class="title is-4">Admin Links</h3>
            <p><a href="/export">Export run data as CSV</a></p>
          </div>

          <div class="container">
            <h3 class="title is-4">Most Recently Added</h3>
            <b-loading :is-full-page="false" :active="isLoading"></b-loading>
            <div v-if="!isLoading">
              <template v-if="news.length">
                <NewsCard
                  v-for="newsItem in news"
                  :key="newsItem._id"
                  :news="newsItem"
                />
              </template>
              <p v-else class="is-size-6 has-text-grey">
                No new projects have been added from your group(s) recently.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import NewsCard from "./NewsCard";

export default {
  components: {
    NewsCard,
  },
  data() {
    return {
      isLoading: false,
      projectFilterText: "",
      showingAll: false,
      defaultProjectCount: 20,
    };
  },
  computed: {
    ...mapState(["projects", "news"]),

    isLoggedIn() {
      return this.$store.state.auth && this.$store.state.auth.loggedIn;
    },

    isAdmin() {
      // Safely access nested properties and environment variables
      const username = this?.$auth?.$state?.user?.username;
      const enaAdmins = process?.env?.ENA_ADMINS || "";
      return username && enaAdmins.includes(username);
    },

    filteredProjects() {
      if (this.projectFilterText) {
        const lowerCaseFilter = this.projectFilterText.toLowerCase();
        return this.projects.filter((p) =>
          p.name.toLowerCase().includes(lowerCaseFilter)
        );
      }
      return this.projects;
    },

    displayedProjects() {
      if (this.showingAll) {
        return this.filteredProjects;
      }
      return this.filteredProjects.slice(0, this.defaultProjectCount);
    },

    canShowMore() {
      return (
        !this.showingAll &&
        this.filteredProjects.length > this.defaultProjectCount
      );
    },
  },
  async created() {
    if (this.isLoggedIn) {
      this.isLoading = true;
      try {
        await Promise.all([
          this.$store.dispatch("refreshProjects"),
          this.$store.dispatch("refreshNews"),
        ]);
      } catch (error) {
        console.error("Failed to load initial data for home page:", error);
        this.$buefy.toast.open({
          duration: 5000,
          message:
            "Could not load project or news data. Please try again later.",
          position: "is-bottom",
          type: "is-danger",
        });
      } finally {
        this.isLoading = false;
      }
    }
  },
  methods: {
    showAll() {
      this.showingAll = true;
    },
  },
};
</script>

<style scoped>
.sidebar {
  height: calc(100vh - 52px);
  /* 52px is the height of the navbar */
  overflow-y: auto;
  border-right: 1px solid #dbdbdb;
}

.fill-height {
  min-height: calc(100vh - 52px);
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
