<template>
  <div>
    <div class="field is-grouped">
      <p class="control is-expanded is-hidden-mobile">
        <input class="input" type="text" placeholder="Filter by name" v-model="filterText" />
      </p>
      <div class="control">
        <div class="select">
          <b-select placeholder="Filter by group" v-model="groupFilter">
            <option :value="-1" :key="-1">All</option>
            <option
              v-for="group in $store.state.groups"
              :value="group._id"
              :key="group._id"
            >{{ group.name }}</option>
          </b-select>
        </div>
      </div>
      <div class="control">
        <div class="select">
          <b-select placeholder="Sort by" v-model="sortBy">
            <option :value="0">Date</option>
            <option :value="1">Name</option>
          </b-select>
        </div>
      </div>
      <p class="control" v-if="project && !showNewButton">
        <nuxt-link
          :to="{ name: 'samples-new', query: { project: project._id }}"
          class="button is-success"
        >New</nuxt-link>
      </p>
    </div>
    <div class="columns" v-for="i in Math.ceil(filteredSamples.length / 2)" :key="i">
      <div
        class="column is-6"
        v-for="sample in filteredSamples.slice((i - 1) * 2, i * 2)"
        :key="sample._id"
      >
        <SampleCard :sample="sample" />
      </div>
    </div>
  </div>
</template>

<script>
import SampleCard from "./SampleCard.vue";

export default {
  components: {
    SampleCard
  },
  props: ["project", "samples", "showNewButton"],
  data() {
    return {
      filterText: "",
      groupFilter: null,
      sortBy: 0
    };
  },
  computed: {
    samplesList() {
      if (this.samples) {
        return this.samples;
      } else {
        return this.$store.state.samples;
      }
    },
    filteredSamples() {
      // const self = this;
      // return self.samplesList.filter(
      //   p => p.name.toLowerCase().indexOf(self.filterText.toLowerCase()) > -1
      // );
      const self = this;
      let filteredByGroup = self.samplesList;
      if (self.groupFilter && self.groupFilter !== -1) {
        filteredByGroup = self.samplesList.filter(p => {
          const groupName = p.group._id || p.group;
          return groupName === self.groupFilter;
        });
      }
      filteredByGroup = filteredByGroup.filter(
        p => p.name.toLowerCase().indexOf(self.filterText.toLowerCase()) > -1
      );
      filteredByGroup = filteredByGroup.sort((a, b) => {
        console.log(this.sortBy === 0, this.sortBy === 1);
        if (this.sortBy === 0) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } else {
          return a.name.localeCompare(b.name);
        }
      });
      return filteredByGroup;
    }
  }
};
</script>
