<template>
  <div class="section">
    <div class="container">
      <div v-if="project">
        <div class="title-wrapper">
          <div class="title">
            <!-- <b-icon icon="folder-text-outline" size="is-small" class="has-text-grey" /> -->
            {{ project.name }}
          </div>
          <AddAccessionModal
            v-if="!!showAddAcession"
            type="project"
            :type-id="project._id"
          />
        </div>

        <p class="subtitle">
          <nuxt-link
            :to="{ name: 'user', query: { username: project.owner } }"
            class="has-text-text"
          >
            <b-icon
              icon="account-outline"
              size="is-small"
              class="has-text-grey"
            ></b-icon>
            {{ project.owner }}
          </nuxt-link>
          <br />
          <b-icon
            icon="account-multiple-outline"
            size="is-small"
            class="has-text-grey"
          />
          {{ project.group.name }}
          <br />
          <b-icon icon="home-lock" size="is-small" class="has-text-grey" />
          Accession number{{
            project.accession ? `: ${project.accession}` : ` unknown`
          }}
          <br />
          <b-icon
            icon="calendar-account"
            size="is-small"
            class="has-text-grey"
          />
          ENA release date{{
            project.releaseDate ? `: ${project.releaseDate}` : ` unknown`
          }}
        </p>

        <b-field label="Short Description">{{ project.shortDesc }}</b-field>
        <b-field label="Long Description">{{ project.longDesc }}</b-field>

        <b-field label="Additional files">
          <AdditionalFileList
            :files="additionalFiles"
            :parent-path="project.path"
          />
        </b-field>

        <hr />

        <p class="title is-4">Samples</p>
        <SampleList
          v-if="project.samples"
          :project="project"
          :samples="project.samples"
          show-new-button="true"
        />
      </div>
    </div>
  </div>
</template>

<script>
import SampleList from "../components/samples/SampleList";
import AdditionalFileList from "../components/AdditionalFileList";
import AddAccessionModal from "../components/AddAccessionModal";
export default {
  components: { SampleList, AdditionalFileList, AddAccessionModal },
  middleware: ["auth"],

  asyncData({ route, $axios, error }) {
    if (!route.query.id) {
      error({ statusCode: 404, message: "Project not found" });
    }

    return $axios
      .get("/project", { params: { id: route.query.id } })
      .then((res) => {
        if (res.status === 200 && res.data.project) {
          const verifiedAdditionalFileNames =
            res.data.project.additionalFiles.map((rf) => rf.file.originalName);
          const actualAdditionalFileNames = res.data.actualAdditionalFiles
            ? JSON.parse(JSON.stringify(res.data.actualAdditionalFiles))
            : [];
          const additionalFilesWithVerifiedField =
            actualAdditionalFileNames.map((additionalFileName) => ({
              fileName: additionalFileName,
              verified:
                !!verifiedAdditionalFileNames.includes(additionalFileName),
            }));

          return {
            project: res.data.project,
            additionalFiles: additionalFilesWithVerifiedField,
          };
        } else {
          error({ statusCode: 501, message: "Project not found" });
        }
      })
      .catch((err) => {
        console.error(err);
        error({ statusCode: 501, message: "Project not found" });
      });
  },
  computed: {
    canSubmitToENA() {
      return true;
    },
    showAddAcession() {
      return process.env.ENA_ADMINS.includes(this.$auth.$state.user.username);
    },
  },
};
</script>
<style>
.title-wrapper {
  display: flex;
  justify-content: space-between;
}
</style>
