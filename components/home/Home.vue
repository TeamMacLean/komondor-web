<template>
  <div id="home">
    <div class="columns is-gapless">
      <!-- Sidebar for Projects -->
      <aside class="column is-3 is-2-fullhd has-background-light sidebar">
        <div class="sidebar-inner">
          <div class="sidebar-header">
            <h2 class="title is-5 mb-0">
              Projects
              <span v-if="projects.length" class="project-count">
                {{ projects.length }}
              </span>
            </h2>
            <nuxt-link to="/projects/new" class="button is-success is-small">
              <b-icon icon="plus" size="is-small" />
              <span>New</span>
            </nuxt-link>
          </div>

          <b-field class="mb-3">
            <b-input
              v-model="projectFilterText"
              placeholder="Find a project..."
              icon="magnify"
              clearable
            ></b-input>
          </b-field>

          <nav id="sidebar-projects" aria-label="Projects">
            <b-loading :is-full-page="false" :active="isLoading"></b-loading>
            <ul class="project-list">
              <li v-for="project in displayedProjects" :key="project._id">
                <nuxt-link
                  :to="{ name: 'project', query: { id: project._id } }"
                  class="project-link"
                >
                  <b-icon
                    icon="folder-text-outline"
                    size="is-small"
                    class="project-icon"
                  />
                  <!-- The tooltip sits on the name, not the whole row, so it
                       does not stack on top of the storage icon's own one. -->
                  <span
                    v-tooltip="{
                      content: project.name,
                      html: false,
                      delay: 500,
                      placement: 'bottom-start',
                    }"
                    class="project-name"
                    >{{ project.name }}</span
                  >
                  <StorageBadge :storage="project.storage" compact />
                </nuxt-link>
              </li>
            </ul>
            <button
              v-if="canShowMore"
              type="button"
              class="button is-small is-fullwidth show-more"
              @click="showAll"
            >
              Show all {{ filteredProjects.length }} projects
            </button>
            <p v-if="emptyMessage" class="is-size-7 has-text-grey px-2 py-3">
              {{ emptyMessage }}
            </p>

            <!-- Follows the list rather than being pinned to the bottom: the
                 sidebar is 100vh tall but starts below the navbar, so a pinned
                 footer would sit under the fold until the page scrolls. -->
            <div v-if="storageKey.length" class="storage-key">
              <p class="storage-key-title">Storage</p>
              <ul>
                <li v-for="item in storageKey" :key="item.text">
                  <StorageBadge
                    :storage="item.storage"
                    compact
                    aria-hidden="true"
                  />
                  <span>{{ item.text }}</span>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="column is-9 is-10-fullhd">
        <div class="section fill-height">
          <h1 class="title is-2 mb-4">
            TSL Raw Sequencing Data Upload Website
          </h1>
          <p class="subtitle is-5 has-text-grey mt-2 mb-6">
            Manage your projects, samples, and sequencing runs
          </p>

          <div class="columns is-multiline mb-6">
            <div class="column is-6">
              <div class="box h-100">
                <h2 class="title is-4">
                  <b-icon icon="rocket-launch" class="mr-2" type="is-primary" />
                  Quick Start
                </h2>
                <div class="content">
                  <p>New here? Check out our resources to get started:</p>
                  <ul>
                    <li>
                      <a href="/help"><strong>FAQ</strong></a> - Common
                      questions and answers.
                    </li>
                    <li>
                      <a href="/upload-instructions.html"
                        ><strong>Detailed User Guide</strong></a
                      >
                      - Step-by-step instructions.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div v-if="isAdmin" class="column is-6">
              <div class="box h-100">
                <h3 class="title is-4">
                  <b-icon icon="shield-account" class="mr-2" type="is-danger" />
                  Admin
                </h3>
                <div class="content">
                  <p>
                    <a href="/export" class="button is-small is-light"
                      >Export run data as CSV</a
                    >
                  </p>
                </div>
              </div>
            </div>
          </div>

          <b-message type="is-info" has-icon class="mb-6">
            <strong>New Bulk Upload Feature:</strong> Power users can now enter
            multiple projects, samples, and runs using a single CSV file. If you
            are interested in beta testing this feature, please contact George
            for more info. Once this has been tested more thoroughly, it will be
            released to more users publicly.
          </b-message>

          <div class="container">
            <h3 class="title is-4 mb-4">
              <b-icon icon="history" class="mr-2" />
              Most Recently Added
            </h3>
            <b-loading :is-full-page="false" :active="isLoading"></b-loading>
            <div v-if="!isLoading">
              <template v-if="displayedNews.length">
                <NewsCard
                  v-for="newsItem in displayedNews"
                  :key="newsItem._id"
                  :news="newsItem"
                />
              </template>
              <p v-else class="is-size-6 has-text-grey box">
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
import NewsCard from "./NewsCard.vue";
import StorageBadge from "~/components/storage/StorageBadge.vue";
import { isEnaAdmin } from "~/utils/adminUsers";
import { storageIndicator } from "~/utils/storageState";

export default {
  components: {
    NewsCard,
    StorageBadge,
  },
  data() {
    return {
      isLoading: false,
      projectFilterText: "",
      showingAll: false,
      defaultProjectCount: 15,
      maxNewsCount: 10,
    };
  },
  computed: {
    ...mapState(["projects", "news"]),

    displayedNews() {
      return this.news.slice(0, this.maxNewsCount);
    },

    isLoggedIn() {
      return this.$store.state.auth && this.$store.state.auth.loggedIn;
    },

    isAdmin() {
      // Named for the box it gates, which links to the ENA CSV export — this is
      // ENA-admin, not the `isAdmin` token claim behind $store.getters.isAdmin.
      return isEnaAdmin(this?.$auth?.$state?.user?.username);
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

    emptyMessage() {
      if (this.isLoading) {
        return "";
      }
      if (this.projects.length === 0) {
        return "No projects found.";
      }
      if (this.filteredProjects.length === 0) {
        return `No projects match “${this.projectFilterText}”.`;
      }
      return "";
    },

    /* One entry per storage icon currently in the list, so the icons explain
       themselves without hovering. Keyed on the label: the "copied to AWS"
       icon has two meanings depending on whether HPC preservation is set. */
    storageKey() {
      const isAdmin = Boolean(this.$store?.getters?.isAdmin);
      const entries = new Map();
      for (const project of this.displayedProjects) {
        const indicator = storageIndicator(project.storage, { isAdmin });
        if (indicator && !entries.has(indicator.text)) {
          entries.set(indicator.text, {
            text: indicator.text,
            storage: project.storage,
          });
        }
      }
      return [...entries.values()];
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
#home > .columns {
  min-height: calc(100vh - 52px);
}

.sidebar {
  border-right: 1px solid #dbdbdb;
}

/* Bulma's .section padding (3rem at desktop) left a narrow column even
   narrower; the list needs the width more than the margin does. */
.sidebar-inner {
  padding: 1.5rem 1rem;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.project-count {
  display: inline-block;
  margin-left: 0.375rem;
  padding: 0 0.5rem;
  border-radius: 9999px;
  background-color: #e8e8e8;
  color: #4a4a4a;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.5;
  vertical-align: middle;
}

#sidebar-projects {
  /* Positioned so the b-loading overlay covers the list, not the page. */
  position: relative;
}

/* Spelled out rather than inherited: an unscoped `ul` rule elsewhere in the
   app (CollapsibleUploaderHelp) adds a square bullet and an indent to every
   list once it has loaded. */
.project-list,
.storage-key ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.project-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.25rem;
  padding: 0.375rem 0.5rem;
  border-radius: 6px;
  color: #4a4a4a;
}

.project-link:hover {
  background-color: rgba(10, 10, 10, 0.05);
  color: #363636;
}

.project-link:focus-visible {
  outline: 2px solid #3273dc;
  outline-offset: -2px;
}

.project-icon {
  flex-shrink: 0;
  color: #7a7a7a;
}

/* min-width: 0 lets the name shrink below its text width inside the flex row,
   which is what makes the ellipsis appear instead of a hard clip. */
.project-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.show-more {
  margin-top: 0.5rem;
}

.storage-key {
  margin: 1rem 0.5rem 0;
  padding-top: 0.75rem;
  border-top: 1px solid #dbdbdb;
  color: #7a7a7a;
  font-size: 0.75rem;
}

.storage-key-title {
  margin-bottom: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.storage-key li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.storage-key li + li {
  margin-top: 0.25rem;
}

/* Stick the sidebar only where it sits beside the content — Bulma stacks the
   columns below the tablet breakpoint, and a full-height sticky column there
   would push the main content off screen. `top: 0` rather than the navbar
   height: the navbar is not fixed, so once it scrolls away the sidebar should
   sit flush with the viewport instead of leaving a gap where it used to be. */
@media screen and (min-width: 769px) {
  .sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    align-self: flex-start;
    display: flex;
    flex-direction: column;
  }

  /* Pin the title and search field; only the project list scrolls. */
  .sidebar-inner {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  #sidebar-projects {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }
}

.fill-height {
  min-height: calc(100vh - 52px);
}

.h-100 {
  height: 100%;
}
</style>
