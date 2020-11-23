<template>
  <div class="section">
    <div class="container">
      <div v-if="project">
        <p class="title">
          <!-- <b-icon icon="folder-text-outline" size="is-small" class="has-text-grey" /> -->
          {{project.name}}
        </p>

        <p class="subtitle">
          <nuxt-link
            :to="{ name: 'user', query: { username: project.owner }}"
            class="has-text-text"
          >
            <b-icon icon="account-outline" size="is-small" class="has-text-grey"></b-icon>
            {{project.owner}}
          </nuxt-link>
          <br />
          <b-icon icon="account-multiple-outline" size="is-small" class="has-text-grey" />
          {{project.group.name}}
        </p>

        <b-field label="Short Description">{{project.shortDesc}}</b-field>
        <b-field label="Long Description">{{project.longDesc}}</b-field>

        <b-field label="Additional files">
          <AdditionalFileList :files="additionalFiles" :parentPath="project.path" />
        </b-field>

        <hr />

        <p class="title is-4">Samples</p>
        <SampleList
          v-if="project.samples"
          :project="project"
          :samples="project.samples"
          showNewButton="true"
        />
      </div>
    </div>
  </div>
</template>

<script>
import SampleList from "../components/samples/SampleList";
import AdditionalFileList from "../components/AdditionalFileList";
export default {
  components: { SampleList, AdditionalFileList },
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

          const verifiedAdditionalFileNames = res.data.project.additionalFiles.map(rf => rf.file.originalName);     
          const actualAdditionalFileNames = res.data.actualAdditionalFiles ? 
            JSON.parse(JSON.stringify(res.data.actualAdditionalFiles)) : 
            []
          ;         
          const additionalFilesWithVerifiedField = actualAdditionalFileNames.map(additionalFileName => ({
            fileName: additionalFileName,
            verified: !!verifiedAdditionalFileNames.includes(additionalFileName)
          }));       
          
          return {
            project: res.data.project,
            additionalFiles: additionalFilesWithVerifiedField,
          };

        } else {
          error({ statusCode: 501, message: "Project not found" });
        }
      })
      .catch(err => {
        console.error(err);
        error({ statusCode: 501, message: "Project not found" });
      });
  },
  computed: {
    canSubmitToENA() {
      return true;
    }
  }
};
</script>
