<template>
  <div>

    <div class="field is-grouped">
      <p class="control is-expanded">
        <input class="input" type="text" placeholder="Find a project" v-model="filterText">
      </p>
      <div class="control">
        <div class="select">
          <b-select placeholder="Filter by group" v-model="groupFilter">
            <option :value="-1" :key="-1">All</option>
            <option
              v-for="group in $store.state.groups"
              :value="group._id"
              :key="group._id">
              {{ group.name }}
            </option>
          </b-select>
        </div>
      </div>
      <p class="control">
        <nuxt-link to="/projects/new" class="button is-success">
          New
        </nuxt-link>
      </p>
    </div>
    <div class="columns" v-for="i in Math.ceil(filteredProjects.length / 2)">
      <div class="column is-6" v-for="project in filteredProjects.slice((i - 1) * 2, i * 2)">
        <ProjectCard :project="project"/>
      </div>
    </div>
  </div>
</template>

<script>
  import ProjectCard from './ProjectCard.vue'

  export default {
    components: {
      ProjectCard
    },
    props: ['projects'],
    data() {
      return {
        filterText: '',
        groupFilter: null
      }
    },
    computed: {
      projectsList() {
        if (this.projects) {
          return this.projects
        } else {
          return this.$store.state.projects;
        }
      },
      filteredProjects() {
        const self = this;
        let filteredByGroup = self.projectsList;
        if (self.groupFilter && self.groupFilter !== -1) {


          filteredByGroup = self.projectsList.filter(p => {
            const groupName = p.group._id || p.group;
            return groupName === self.groupFilter
          });
        }
        return filteredByGroup.filter(p => p.name.toLowerCase().indexOf(self.filterText.toLowerCase()) > -1)
      }
    }
  }
</script>
