<template>
  <div class="navbar-item">
    <div class="control has-addons">
      <b-autocomplete
        rounded
        v-model="query"
        :data="results"
        placeholder="Search or jump to.."
        field="title"
        :loading="isFetching"
        @typing="getAsyncData"
        custom-class="can-expand"
        icon="magnify"
        @select="onSelect"
      >
        <template slot="header">
          <div class="truncate">
            <nuxt-link :to="{ query: 'search', query: { query: query }}">
              Search whole site for
              <strong>{{shortText}}</strong>
            </nuxt-link>
          </div>
        </template>
        <template slot="empty">No results for {{query}}</template>
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
      return this.query && this.query.length > 7
        ? this.query.substring(0, 3) + "..." + this.query.slice(-3)
        : this.query;
    }
  },
  methods: {
    onSelect: function(item) {
      this.$router.push({
        query: item.type,
        query: { id: item._id }
      });
    },
    getAsyncData: debounce(function(query) {
      this.isFetching = true;
      this.results.length = 0;
      this.$axios
        .get("/search", { params: { query: query } })
        .then(res => {
          this.isFetching = false;
          //TODO sort data
          if (res.data.results.project) {
            res.data.results.projects.map(p => {
              p.type = "project";
              this.results.push(p);
            });
          }
          if (res.data.results.samples) {
            res.data.results.samples.map(p => {
              p.type = "sample";
              this.results.push(p);
            });
          }
          if (res.data.results.runs) {
            res.data.results.runs.map(p => {
              p.type = "run";
              this.results.push(p);
            });
          }
        })
        .catch(err => {
          this.isFetching = false;
          this.results.length = 0;
          console.error(err);
        });

      // this.data = this.$store.getters.filteredProjects(query);
    }, 500)
  }
};
</script>
