<template>
  <div class="section">
    <div class="container">

      <!-- TODO: (COULD DO:) if admin, remove 'Your' -->
      <h1 class="title">Your Projects</h1>

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
  }
</script>
