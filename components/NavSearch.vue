<template>
  <div class="navbar-item custom-width">
    <div class="control has-addons custom-width-child">
      <b-autocomplete
        open-on-focus
        rounded
        v-model="query"
        :data="results"
        placeholder="Search or jump to..."
        :loading="isFetching"
        @typing="getAsyncData"
        custom-class="can-expand"
        icon="magnify"
        @select="onSelect"
        max-height="500px"
      >
        <template slot="header">
          <div class="truncate">
            <nuxt-link :to="{ name: 'search', query: { query: query }}" v-if="query && query.length">
              Search whole site for
              <strong>{{shortText}}</strong>
            </nuxt-link>
          </div>
        </template>
        <template slot="empty">
          <div v-if="query && query.length">No results for {{query}}</div>
          <div v-else>Type in the search bar to see results</div>
        </template>
        <template slot-scope="props">
          <div class="truncate" v-if="props.option.type=='project'">
            <b-icon icon="folder-text-outline" size="is-small" class="has-text-grey"></b-icon>
            <span class="truncate">{{props.option.name}}</span>
          </div>
          <div class="truncate" v-if="props.option.type=='sample'">
            <b-icon icon="flask-outline" size="is-small" class="has-text-grey"></b-icon>
            <span class="truncate">{{props.option.name}}</span>
          </div>
          <div class="truncate" v-if="props.option.type=='run'">
            <b-icon icon="dna" size="is-small" class="has-text-grey"></b-icon>
            <span class="truncate">{{props.option.name}}</span>
          </div>
        </template>
      </b-autocomplete>
    </div>
  </div>
</template>

<script>
import debounce from "lodash/debounce";

export default {
  data() {
    return {
      results: [],
      selected: null,
      isFetching: false,
      query: ""
    };
  },
  computed: {
    shortText() {

      const trimmed = this.query && this.query.length && this.query.trimStart().trimEnd()
      const substringed = trimmed && trimmed.length && trimmed.substring(0, 8) + "..." + trimmed.slice(-8)

      return this.query && this.query.length && this.query.length > 12
        ? substringed
        : this.query;
    }
  },
  methods: {
    onSelect: function(item) {
      this.query = "";
      this.results = [];
      this.selected = null;
      this.isFetching = true;
      this.$router.push({
        path: item.type,
        query: { id: item._id }
      });
      this.isFetching = false;
    },
    // TODO can't get this to work
    // @keyup.enter="searchEntireSite"
    // searchEntireSite: function() {
    //   if (query){
    //     this.$router.push({ path: 'search', query: { query: query } })
    //   }
    // },
    getAsyncData: debounce(function(query) {
      this.isFetching = true;
      this.results = [];

      const lowercaseQuery = query.toLowerCase()

      this.$axios
        .get("/search", { params: { query: lowercaseQuery } })
        .then(res => {
          this.isFetching = false;

          const { projects, samples, runs } = res.data.results;

          //TODO sort data
          if (projects) {
            projects.map(p => {
              p.type = "project";
              this.results.push(p);
            });
          }
          if (samples) {
            samples.map(p => {
              p.type = "sample";
              this.results.push(p);
            });
          }
          if (runs) {
            runs.map(p => {
              p.type = "run";
              this.results.push(p);
            });
          }
        })
        .catch(err => {
          this.isFetching = false;
          this.results = [];
          console.error(err);
        });

      // this.data = this.$store.getters.filteredProjects(query);
    }, 800)
  }
};
</script>

<style scoped>

.custom-width {
  width: 100%;
  max-width: 500px;
}

.custom-width-child {
  width: 100%;
  max-width: 499px;
}

</style>
