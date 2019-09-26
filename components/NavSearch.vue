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
        @select="onSelect">


        <template slot="header">
          <div class="truncate">
            <nuxt-link to="#">Search site for {{shortText}}</nuxt-link>
          </div>

        </template>
        <!--<template slot="empty">No results for {{name}}</template>-->
        <template slot-scope="props">
          <div class="truncate">
            {{ props.option.name }}
          </div>
        </template>

      </b-autocomplete>
    </div>
  </div>
</template>

<script>

  import debounce from 'lodash/debounce'

  export default {
    data() {
      return {
        data: [],
        selected: null,
        isFetching: false,
        name: '',
      }
    },
    computed: {
      shortText() {
        return this.name && this.name.length > 9 ? this.name.substring(0, 5) + '...' + this.name.slice(-3) : this.name
      }
    },
    methods: {
      onSelect: function (item) {
        console.log(item, 'selected');
      },
      getAsyncData: debounce(function (name) {
        this.data = this.$store.getters.filteredProjects(name);
      }, 500)
    }
  }
</script>

<style>
  /*.autocomplete .dropdown-menu {*/
  /*max-width: 50vw;*/
  /*}*/
</style>
