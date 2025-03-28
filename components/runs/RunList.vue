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
      <p class="control" v-if="sample && showNewButton">
        <nuxt-link
          :to="{ name: 'runs-new', query: { sample: sample._id }}"
          class="button is-success"
        >New</nuxt-link>
      </p>
    </div>
    <div class="columns" v-for="i in Math.ceil(filteredRuns.length / 2)" :key="i">
      <div class="column is-6" v-for="run in filteredRuns.slice((i - 1) * 2, i * 2)" :key="run._id">
        <RunCard :run="run" />
      </div>
    </div>
  </div>
</template>

<script>
import RunCard from "./RunCard.vue";

export default {
  components: {
    RunCard
  },
  props: ["sample", "runs", "showNewButton"],
  data() {
    return {
      filterText: "",
      groupFilter: null,
      sortBy: 0
    };
  },
  computed: {
    runsList() {
      if (this.runs) {
        return this.runs;
      } else {
        return this.$store.state.runs;
      }
    },
    filteredRuns() {
      // const self = this;
      // return self.runsList.filter(
      //   p => p.name.toLowerCase().indexOf(self.filterText.toLowerCase()) > -1
      // );
       const self = this;
      let filteredByGroup = self.runsList;
      if (self.groupFilter && self.groupFilter !== -1) {
        filteredByGroup = self.runsList.filter(p => {
          const groupName = p.group._id || p.group;
          return groupName === self.groupFilter;
        });
      }
      filteredByGroup = filteredByGroup.filter(
        p => p.name.toLowerCase().indexOf(self.filterText.toLowerCase()) > -1
      );
      filteredByGroup = filteredByGroup.sort((a, b) => {
         
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
