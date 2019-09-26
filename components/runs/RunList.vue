<template>
  <div>

    <div class="field is-grouped">
      <p class="control is-expanded">
        <input class="input" type="text" placeholder="Find a run" v-model="filterText">
      </p>
      <p class="control" v-if="sample"><!--new run-->
        <nuxt-link :to="{ name: 'runs-new', query: { sample: sample._id }}" class="button is-success">New
        </nuxt-link>
      </p>
    </div>
    <div class="columns" v-for="i in Math.ceil(filteredRuns.length / 2)">
      <div class="column is-6" v-for="run in filteredRuns.slice((i - 1) * 2, i * 2)">
        <RunCard :run="run"/>
      </div>
    </div>
  </div>
</template>

<script>
  import RunCard from './RunCard.vue'

  export default {
    components: {
      RunCard
    },
    props: ['sample', 'runs'],
    data() {
      return {
        filterText: ''
      }
    },
    computed: {
      runsList() {
        if (this.runs) {
          return this.runs
        } else {
          return this.$store.state.runs;
        }
      },
      filteredRuns() {
        const self = this;
        return self.runsList.filter(p => p.scientificName.toLowerCase().indexOf(self.filterText.toLowerCase()) > -1)
      }
    }
  }
</script>
