<template>
  <div>
    <section class="section">
      <div class="columns">
        <div class="column is-2">
          <b-menu>
            <b-menu-list>
              <b-menu-item
                icon="folder-text-outline"
                label="Projects"
                :active="type === 'project'"
                @click="searchProjects"
              ></b-menu-item>
              <b-menu-item
                icon="flask-outline"
                label="Samples"
                :active="type === 'sample'"
                @click="searchSamples"
              ></b-menu-item>
              <b-menu-item icon="dna" label="Runs" :active="type === 'run'" @click="searchRuns"></b-menu-item>
              <!-- <b-menu-item
                icon="current-dc"
                label="Reads"
                :active="type === 'read'"
                @click="searchReads"
              ></b-menu-item>-->
            </b-menu-list>
          </b-menu>
        </div>
        <div class="column is-10">
          <div class="container">
            <b-notification
              v-if="this.error"
              type="is-danger"
              aria-close-label="Close notification"
              role="alert"
            >{{this.error}}</b-notification>
            <!-- <b-icon pack="fas" icon="sync-alt" size="is-large" custom-class="fa-spin"></b-icon> -->
            <div v-if="isSearching">
              <b-notification :closable="false">
                Searching...
                <b-loading :is-full-page="false" :active="true" :can-cancel="false"></b-loading>
              </b-notification>
            </div>
            <div v-if="!isSearching">
              <div v-if="!type">
                <p class="title is-4">Select type to search</p>
              </div>
              <div v-if="results.length">
                <p class="title is-4">Showing {{results.length}} {{countLingo}} for "{{query}}"</p>
                <div v-if="type === 'project'">
                  <ProjectList :projects="results" showNewButton="false" />
                </div>
                <div v-if="type === 'sample'">
                  <SampleList :samples="results" showNewButton="false" />
                </div>
                <div v-if="type === 'run'">
                  <RunList :runs="results" showNewButton="false" />
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
import ProjectList from "../components/projects/ProjectList";
import SampleList from "../components/samples/SampleList";
import RunList from "../components/runs/RunList";

export default {
  components: { ProjectList, SampleList, RunList },
  watchQuery: function(newQuery, oldQuery) {
    this.type = newQuery.type;
    this.query = newQuery.query;
    this.search();
  },
  data() {
    return {
      isSearching: false,
      type: this.$route.query.type || "project",
      query: this.$route.query.query,
      results: [],
      error: null
    };
  },
  mounted() {
    this.search();
  },
  computed: {
    countLingo() {
      return this.results.length && this.results.length > 1
        ? "results"
        : "result";
    }
  },
  methods: {
    setQuery(query) {
      this.query = query || "";
    },
    setType() {
      this.type = type || "project";
    },
    search() {
      this.isSearching = true;
      let url = "/search";

      if (this.type) {
        url = `${url}/${this.type}`;
      }
      this.$axios
        .get(url, {
          params: {
            query: this.$route.query.query
          }
        })
        .then(res => {
          this.isSearching = false;
          this.results = res.data.results;
        })
        .catch(err => {
          this.isSearching = false;
          this.error = err;
        });
    },
    searchProjects() {
      this.$router.push({
        name: "search",
        query: { type: "project", query: this.query }
      });
    },
    searchSamples() {
      this.$router.push({
        name: "search",
        query: { type: "sample", query: this.query }
      });
    },
    searchRuns() {
      this.$router.push({
        name: "search",
        query: { type: "run", query: this.query }
      });
    }
    // searchReads() {
    //   this.$router.push({
    //     name: "search",
    //     query: { type: "read", query: this.query }
    //   });
    // }
  }
};
</script>


<style scoped>
@media (max-width: 769px) {
  .menu-list {
    display: flex;
  }
  .menu-list li {
    /* width:25%; */
    flex-grow: 1;
    text-align: center;
  }
}
</style>