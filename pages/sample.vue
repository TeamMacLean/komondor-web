<template>
  <div class="section">
    <div class="container">
      <div v-if="sample">
        <div class="title-wrapper">
          <div class="title">
            {{ sample.scientificName }}
          </div>
          <AddAccessionModal
            v-if="!!showAddAcession"
            type="sample"
            :type-id="sample._id"
            :initial-accessions="sample.accessions"
          />
        </div>

        <p class="subtitle">
          <nuxt-link
            :to="{ name: 'user', query: { username: sample.owner } }"
            class="has-text-text"
          >
            <b-icon
              icon="account-outline"
              size="is-small"
              class="has-text-grey"
            ></b-icon>
            {{ sample.owner }}
          </nuxt-link>
          <br />
          <b-icon
            icon="account-multiple-outline"
            size="is-small"
            class="has-text-grey"
          ></b-icon>
          {{ sample.group.name }}
          <br />
          <nuxt-link
            :to="{ name: 'project', query: { id: sample.project._id } }"
            class="has-text-text"
          >
            <b-icon
              icon="folder-text-outline"
              size="is-small"
              class="has-text-grey"
            ></b-icon>
            {{ sample.project.name }}
          </nuxt-link>
          <br />
          <b-icon icon="home-lock" size="is-small" class="has-text-grey" />
          Sample accession numbers:{{
            sample.accessions && sample.accessions.length
              ? ` ${sample.accessions.join(", ")}`
              : ` unknown`
          }}
        </p>

        <div class="columns">
          <div class="column">
            <b-field label="Scientific Name">
              <p>{{ sample.scientificName }}</p>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Common Name">
              <p>{{ sample.commonName }}</p>
            </b-field>
          </div>
          <div class="column">
            <b-field label="NCBI Taxonomy ID">
              <p>{{ sample.ncbi }}</p>
            </b-field>
          </div>
        </div>

        <b-field label="Conditions">
          <p>{{ sample.conditions }}</p>
        </b-field>

        <b-field label="Additional Files">
          <AdditionalFileList
            :files="additionalFiles"
            :parent-path="sample.path"
          />
        </b-field>
        <hr />
        <p class="title is-4">Runs</p>
        <RunList
          v-if="sample.runs"
          :sample="sample"
          :runs="sample.runs"
          show-new-button="true"
        />
      </div>
    </div>
  </div>
</template>

<script>
import RunList from "../components/runs/RunList";
import AdditionalFileList from "../components/AdditionalFileList";
import AddAccessionModal from "../components/AddAccessionModal";
export default {
  components: { RunList, AdditionalFileList, AddAccessionModal },
  middleware: ["auth"],
  asyncData({ route, $axios, error }) {
    //TODO check if can view

    if (!route.query.id) {
      error({ statusCode: 404, message: "Sample not found" });
    }

    //use cached project if available
    // const cachedProject = store.getters.getCachedSampleById(route.query.id);
    // if (cachedProject) {
    //   return Promise.resolve({
    //     project: cachedProject
    //   })
    // }

    return $axios
      .get("/sample", { params: { id: route.query.id } })
      .then((res) => {
        if (res.status === 200 && res.data.sample) {
          const verifiedAdditionalFileNames =
            res.data.sample.additionalFiles.map((rf) => rf.file.originalName);
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
            sample: res.data.sample,
            additionalFiles: additionalFilesWithVerifiedField,
          };
        } else {
          error({ statusCode: 501, message: "Sample not found" });
        }
      })
      .catch((err) => {
        console.error(err);
        error({ statusCode: 501, message: "Sample not found" });
      });
  },
  computed: {
    showAddAcession() {
      if (this?.$auth?.$state?.user?.username && process?.env?.ENA_ADMINS) {
        return process.env.ENA_ADMINS.includes(this.$auth.$state.user.username);
      } else {
        return false;
      }
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
