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
                @click="searchType('project')"
                :disabled="getDisabledStatus('projects')"
              ></b-menu-item>
              <b-menu-item
                icon="flask-outline"
                :label="getComputedLabel('samples')"
                :active="type === 'sample'"
                @click="searchType('sample')"
                :disabled="getDisabledStatus('samples')"
              ></b-menu-item>
              <b-menu-item 
                icon="dna"                 
                :label="getComputedLabel('runs')"
                :active="type === 'run'" 
                @click="searchType('run')"
                :disabled="getDisabledStatus('runs')"
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
              <div v-if="!totalResultsLength">
                <p v-if="totalResultsLength" class="title is-4">Select type to search</p>
                <p v-else class="title is-5">No results found for "{{query}}".</p>
              </div>
              <div v-else>
                <p class="title is-4">Showing {{typeResultsLength}} {{type}} {{countLingo}} for "{{query}}"</p>
                <div v-if="type === 'project'">
                  <ProjectList :projects="results.projects" showNewButton="false" />
                </div>
                <div v-if="type === 'sample'">
                  <SampleList :samples="results.samples" showNewButton="false" />
                </div>
                <div v-if="type === 'run'">
                  <RunList :runs="results.runs" showNewButton="false" />
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
  watch: {
    '$route.query': '$fetch'
  },
  async fetch(){
    this.query = this.$route.query.query
    this.searchAndUpdateType();
  },
  data() {
    return {
      isSearching: false,
      type: null,
      query: this.$route.query.query,
      results: {},
      error: null
    };
  },
  mounted() {
    this.searchAndUpdateType();
  },
  computed: {
    countLingo() {
      if (this.type && this.results && this.results[(this.type + 's')] && this.results[(this.type + 's')].length){
        return this.type + ' ' + (this.results[(this.type + 's')].length !== 1)
          ? "results"
          : "result"
      } else {
        return '';
      }
    },
    totalResultsLength() {
      const total = this.results.projects?.length + this.results.samples?.length + this.results.runs?.length;
      return total || 0;
    },
    typeResultsLength() {
      var result = this.results && this.results[(this.type + 's')] && this.results[(this.type + 's')].length;
      return result;
    }
  },
  methods: {
    setQuery(query) {
      this.query = query || "";
    },
    setType() {
      this.type = type || "project";
    },
    searchAndUpdateType() {
      this.isSearching = true;
      let url = "/search";

      this.$axios
        .get(url, {
          params: {
            query: this.$route.query.query
          }
        })
        .then(res => {
          this.isSearching = false;
          // console.log('asda ', this.results)
          var parsedObj = JSON.parse(JSON.stringify(res.data.results))

          this.results = {};

          this.results.projects = parsedObj.projects
          this.results.samples = parsedObj.samples
          this.results.runs = parsedObj.runs
          var totalResultsLength = 
            this.results.projects ? this.results.projects.length : 0 + 
            this.results.samples ? this.results.samples.length : 0 + 
            this.results.runs ? this.results.runs.length : 0
          ;

          if (this.results.projects && this.results.projects.length){
            this.type = 'project'
          } else if (this.results.samples && this.results.samples.length){
            this.type = 'sample'
          } else if (this.results.runs && this.results.runs.length){
            this.type = 'run'
          // } else if (!totalResultsLength) {
          //   this.type = null;
          } else {
            this.type = null;
          }
          //console.log('lamb', this.results)
        })
        .catch(err => {
          this.isSearching = false;
          this.error = err;
        });
    },
    // searchProjects() {
    //   this.$router.push({
    //     name: "search",
    //     query: { type: "project", query: this.query }
    //   });
    // },
    searchType(type) {
      this.type = type;
    },
    getComputedLabel(type) {
      return `${type.charAt(0).toUpperCase() + type.slice(1)} (${ this.results?.[type]?.length })`
    },
    getDisabledStatus(type) {
      const result = !this.results?.[type]?.length
      // console.log('res', this.results?.projects?.length, result ? 'disabled' : 'not disabled')
      return result
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