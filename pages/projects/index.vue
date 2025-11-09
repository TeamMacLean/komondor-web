<template>
  <div class="section">
    <div class="container">

      <h1 class="title">{{ pageTitle }}</h1>

      <ProjectList showNewButton="true"/>


    </div>
  </div>
</template>

<script>
  import ProjectList from '~/components/projects/ProjectList.vue'

  export default {
    middleware: 'auth',
    components: {
      ProjectList
    },
    fetch({store}) {
      return Promise.all([
        store.dispatch('refreshProjects'),
        store.dispatch('refreshGroups')
      ])
    },
    computed: {
      pageTitle() {
        return this.$store.getters.isAdmin ? 'Projects' : 'Your Projects'
      }
    }
  }
</script>
