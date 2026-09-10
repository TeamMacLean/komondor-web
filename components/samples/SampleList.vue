<template>
  <div>
    <div class="field is-grouped">
      <p class="control is-expanded is-hidden-mobile">
        <input
          v-model="filterText"
          class="input"
          type="text"
          placeholder="Filter by name"
        />
      </p>
      <div class="control">
        <div class="select">
          <b-select v-model="groupFilter" placeholder="Filter by group">
            <option :key="-1" :value="-1">All</option>
            <option
              v-for="group in $store.state.groups"
              :key="group._id"
              :value="group._id"
            >
              {{ group.name }}
            </option>
          </b-select>
        </div>
      </div>
      <div class="control">
        <div class="select">
          <b-select v-model="sortBy" placeholder="Sort by">
            <option :value="0">Date</option>
            <option :value="1">Name</option>
          </b-select>
        </div>
      </div>
      <p v-if="canCreateSample" class="control">
        <nuxt-link
          :to="{ name: 'samples-new', query: { projectId: project._id } }"
          class="button is-success"
          >New</nuxt-link
        >
      </p>
    </div>
    <div
      v-for="i in Math.ceil(filteredSamples.length / 2)"
      :key="i"
      class="columns"
    >
      <div
        v-for="sample in filteredSamples.slice((i - 1) * 2, i * 2)"
        :key="sample._id"
        class="column is-6"
      >
        <SampleCard :sample="sample" :project-storage="effectiveStorage" />
      </div>
    </div>
  </div>
</template>

<script>
import SampleCard from "./SampleCard.vue";
import { describeStorage } from "~/utils/storageState";

export default {
  components: {
    SampleCard,
  },
  props: {
    project: {
      type: Object,
      default: null,
    },
    samples: {
      type: Array,
      default: null,
    },
    showNewButton: {
      type: [Boolean, String],
      default: false,
    },
    projectStorage: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      filterText: "",
      groupFilter: null,
      sortBy: 0,
    };
  },
  computed: {
    effectiveStorage() {
      return this.projectStorage || this.project?.storage || null;
    },
    canCreateSample() {
      const showButton =
        this.showNewButton === true || this.showNewButton === "true";
      return (
        Boolean(this.project) &&
        showButton &&
        !describeStorage(this.effectiveStorage).readOnly
      );
    },
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

      // Warn about samples with null/undefined names
      const samplesWithoutNames = self.samplesList.filter((s) => !s.name);
      if (samplesWithoutNames.length > 0) {
        console.warn(
          `Warning: Found ${samplesWithoutNames.length} sample(s) with null/undefined names:`,
          samplesWithoutNames.map((s) => ({ id: s._id, name: s.name }))
        );
      }
      if (self.groupFilter && self.groupFilter !== -1) {
        filteredByGroup = self.samplesList.filter((p) => {
          const groupName = p.group._id || p.group;
          return groupName === self.groupFilter;
        });
      }
      filteredByGroup = filteredByGroup.filter(
        (p) =>
          p.name &&
          p.name.toLowerCase().indexOf(self.filterText.toLowerCase()) > -1
      );
      filteredByGroup = filteredByGroup.sort((a, b) => {
        if (this.sortBy === 0) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } else {
          // Handle null/undefined names in sorting
          const nameA = a.name || "";
          const nameB = b.name || "";
          return nameA.localeCompare(nameB);
        }
      });
      return filteredByGroup;
    },
  },
};
</script>
