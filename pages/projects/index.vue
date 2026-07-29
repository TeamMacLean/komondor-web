<template>
  <div class="section">
    <div class="container">
      <h1 class="title">{{ pageTitle }}</h1>

      <ProjectList show-new-button="true" />
    </div>
  </div>
</template>

<script>
import ProjectList from "~/components/projects/ProjectList.vue";

export default {
  components: {
    ProjectList,
  },
  middleware: "auth",
  fetch({ store }) {
    return Promise.all([
      store.dispatch("refreshProjects"),
      store.dispatch("refreshGroups"),
    ]);
  },
  computed: {
    pageTitle() {
      return this.$store.getters.isAdmin ? "Projects" : "Your Projects";
    },
  },
};
</script>
