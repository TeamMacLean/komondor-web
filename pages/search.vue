<template>
  <div>
    <section class="section">
      <div class="columns">
        <div class="column is-3">
          <b-menu>
            <b-menu-list>
              <b-menu-item
                icon="folder-text-outline"
                :label="getComputedLabel('projects')"
                :active="type === 'project'"
                :disabled="getDisabledStatus('projects')"
                @click="searchType('project')"
              ></b-menu-item>
              <b-menu-item
                icon="flask-outline"
                :label="getComputedLabel('samples')"
                :active="type === 'sample'"
                :disabled="getDisabledStatus('samples')"
                @click="searchType('sample')"
              ></b-menu-item>
              <b-menu-item
                icon="dna"
                :label="getComputedLabel('runs')"
                :active="type === 'run'"
                :disabled="getDisabledStatus('runs')"
                @click="searchType('run')"
              ></b-menu-item>
              <!-- <b-menu-item
                icon="current-dc"
                label="Reads"
                :active="type === 'read'"
                @click="searchReads"
              ></b-menu-item>-->
            </b-menu-list>
          </b-menu>
        </div>
        <div class="column is-9">
          <div class="container">
            <b-notification
              v-if="error"
              type="is-danger"
              aria-close-label="Close notification"
              role="alert"
              >{{ error }}</b-notification
            >
            <!-- <b-icon pack="fas" icon="sync-alt" size="is-large" custom-class="fa-spin"></b-icon> -->
            <div v-if="isSearching">
              <b-notification :closable="false">
                Searching...
                <b-loading
                  :is-full-page="false"
                  :active="true"
                  :can-cancel="false"
                ></b-loading>
              </b-notification>
            </div>
            <div v-if="!isSearching">
              <div v-if="!totalResultsLength">
                <p v-if="totalResultsLength" class="title is-4">
                  Select type to search
                </p>
                <p v-else class="title is-5">
                  No results found for "{{ query }}".
                </p>
              </div>
              <div v-else>
                <p class="title is-4">
                  Showing {{ typeResultsLength }} {{ type }}
                  {{ countLingo }} for "{{ query }}"
                </p>
                <div v-if="type === 'project'">
                  <ProjectList
                    :projects="results.projects"
                    show-new-button="false"
                  />
                </div>
                <div v-if="type === 'sample'">
                  <SampleList
                    :samples="results.samples"
                    show-new-button="false"
                  />
                </div>
                <div v-if="type === 'run'">
                  <RunList :runs="results.runs" show-new-button="false" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import ProjectList from "../components/projects/ProjectList.vue";
import SampleList from "../components/samples/SampleList.vue";
import RunList from "../components/runs/RunList.vue";
import { getApiErrorMessage, readErrorBody } from "~/utils/apiError";

export default {
  components: { ProjectList, SampleList, RunList },
  data() {
    return {
      isSearching: false,
      type: null,
      query: this.$route.query.query,
      results: {},
      error: null,
    };
  },
  async fetch() {
    this.query = this.$route.query.query;
    this.searchAndUpdateType();
  },
  computed: {
    countLingo() {
      if (
        this.type &&
        this.results &&
        this.results[this.type + "s"] &&
        this.results[this.type + "s"].length
      ) {
        return this.type + " " + (this.results[this.type + "s"].length !== 1)
          ? "results"
          : "result";
      } else {
        return "";
      }
    },
    totalResultsLength() {
      const total =
        this.results.projects?.length +
        this.results.samples?.length +
        this.results.runs?.length;
      return total || 0;
    },
    typeResultsLength() {
      var result =
        this.results &&
        this.results[this.type + "s"] &&
        this.results[this.type + "s"].length;
      return result;
    },
  },
  watch: {
    "$route.query": "$fetch",
  },
  mounted() {
    this.searchAndUpdateType();
  },
  methods: {
    // `setQuery` and `setType` were removed: neither had a call site, and
    // `setType` referenced an undefined `type`, so it would have thrown a
    // ReferenceError if anything had ever called it.
    searchAndUpdateType() {
      this.isSearching = true;
      let url = "/search";

      this.$axios
        .get(url, {
          params: {
            query: this.$route.query.query,
          },
        })
        .then((res) => {
          this.isSearching = false;
          this.error = null;

          // The /search/* routes answer 200 with `{results: [], error}` when the
          // search itself failed, so "no matches" and "it broke" look alike
          // until you read the body (BREAKING_CHANGES §6).
          const bodyError = readErrorBody(res.data);
          if (bodyError) {
            this.error = bodyError;
            this.results = {};
            this.type = null;
            return;
          }

          var parsedObj = JSON.parse(JSON.stringify(res.data.results || {}));

          this.results = {};

          this.results.projects = parsedObj.projects;
          this.results.samples = parsedObj.samples;
          this.results.runs = parsedObj.runs;

          if (this.results.projects && this.results.projects.length) {
            this.type = "project";
          } else if (this.results.samples && this.results.samples.length) {
            this.type = "sample";
          } else if (this.results.runs && this.results.runs.length) {
            this.type = "run";
          } else {
            this.type = null;
          }
        })
        .catch((err) => {
          this.isSearching = false;
          console.error("Search failed:", err);
          this.error = getApiErrorMessage(err, {
            fallback: "Search failed. Please try again.",
          });
        });
    },
    searchType(type) {
      this.type = type;
    },
    getComputedLabel(type) {
      return `${type.charAt(0).toUpperCase() + type.slice(1)} (${
        this.results?.[type]?.length
      })`;
    },
    getDisabledStatus(type) {
      const result = !this.results?.[type]?.length;
      return result;
    },
  },
};
</script>

<style scoped>
@media (max-width: 769px) {
  .menu-list {
    display: flex;
  }
  .menu-list li {
    flex-grow: 1;
    text-align: center;
  }
}
</style>
