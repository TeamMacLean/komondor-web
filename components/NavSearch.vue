<template>
  <div class="navbar-item">
    <div class="control has-addons">
      <b-autocomplete
        rounded
        v-model="name"
        :data="data"
        placeholder="Search or jump to.."
        field="title"
        :loading="isFetching"
        @typing="getAsyncData"
        custom-class="can-expand"
        icon="magnify"
        @select="onSelect"
      >
        <!-- <template slot="header">
          <div class="truncate">
            <nuxt-link to="#">Search site for {{shortText}}</nuxt-link>
          </div>
        </template>-->
        <!--<template slot="empty">No results for {{name}}</template>-->
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
      data: [],
      selected: null,
      isFetching: false,
      name: ""
    };
  },
  computed: {
    shortText() {
      return this.name && this.name.length > 9
        ? this.name.substring(0, 5) + "..." + this.name.slice(-3)
        : this.name;
    }
  },
  methods: {
    onSelect: function(item) {
      this.$router.push({
        name: item.type,
        query: { id: item._id }
      });
    },
    getAsyncData: debounce(function(name) {
      this.$axios
        .get("/search", { params: { name: name } })
        .then(res => {
          this.data.length = 0;
          //TODO sort data
          res.data.results.projects.map(p => {
            p.type = "project";
            this.data.push(p);
          });

          res.data.results.samples.map(p => {
            p.type = "sample";
            this.data.push(p);
          });

          res.data.results.runs.map(p => {
            p.type = "run";
            this.data.push(p);
          });

          console.log(this.data);
        })
        .catch(err => {
          this.data.length = 0;
          console.error(err);
        });

      // this.data = this.$store.getters.filteredProjects(name);
    }, 500)
  }
};
</script>

<style>
/*.autocomplete .dropdown-menu {*/
/*max-width: 50vw;*/
/*}*/
</style>
