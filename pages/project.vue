<template>
  <div class="section">
    <div class="container">
      <div v-if="project">
        <p class="title break-all">
          <!-- <b-icon icon="folder-text-outline" size="is-small" class="has-text-grey" /> -->
          {{project.name}}
        </p>

        <p class="subtitle">
          <b-icon icon="account-outline" size="is-small" class="has-text-grey"></b-icon>
          {{project.owner}}
          <br />
          <b-icon icon="account-multiple-outline" size="is-small" class="has-text-grey"></b-icon>
          {{project.group.name}}
        </p>
        <p>{{project.shortDesc}}</p>
        <p>{{project.longDesc}}</p>

        files:{{project.additionalFiles}}
        <hr />

        <p class="title is-4">Samples</p>
        <SampleList v-if="project.samples" :project="project" :samples="project.samples"></SampleList>
      </div>
    </div>
  </div>
</template>

<script>
import SampleList from "../components/samples/SampleList";

export default {
  components: { SampleList },
  middleware: ["auth"],

  asyncData({ route, $axios, error, store }) {
    //TODO check if can view

    if (!route.query.id) {
      error({ statusCode: 404, message: "Project not found" });
    }

    //TODO use cached project if available
    // const cachedProject = store.getters.getCachedProjectById(route.query.id);
    // if (cachedProject) {
    //   return Promise.resolve({
    //     project: cachedProject
    //   })
    // }

    return $axios
      .get("/project", { params: { id: route.query.id } })
      .then(res => {
        if (res.status === 200 && res.data.project) {
          // res.data.project.samples = [];
          console.log("project", res.data.project);
          return {
            project: res.data.project
          };
        } else {
          error({ statusCode: 501, message: "Project not found" });
        }
      })
      .catch(err => {
        console.error(err);
        error({ statusCode: 501, message: "Project not found" });
      });
  }
};
</script>
