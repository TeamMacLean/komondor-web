<template>
  <div>

    <div class="field is-grouped">
      <p class="control is-expanded">
        <input class="input" type="text" placeholder="Find a sample" v-model="filterText">
      </p>
      <p class="control" v-if="project"><!--new sample-->
        <nuxt-link :to="{ name: 'samples-new', query: { project: project._id }}" class="button is-success">New
        </nuxt-link>
      </p>
    </div>
    <div class="columns" v-for="i in Math.ceil(filteredSamples.length / 2)">
      <div class="column is-6" v-for="sample in filteredSamples.slice((i - 1) * 2, i * 2)">
        <SampleCard :sample="sample"/>
      </div>
    </div>
  </div>
</template>

<script>
  import SampleCard from './SampleCard.vue'

  export default {
    components: {
      SampleCard
    },
    props: ['project', 'samples'],
    data() {
      return {
        filterText: ''
      }
    },
    computed: {
      samplesList() {
        if (this.samples) {
          return this.samples
        } else {
          return this.$store.state.samples;
        }
      },
      filteredSamples() {
        const self = this;
        return self.samplesList.filter(p => p.scientificName.toLowerCase().indexOf(self.filterText.toLowerCase()) > -1)
      }
    }
  }
</script>
