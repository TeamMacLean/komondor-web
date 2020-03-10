<template>
  <div class="section">
    <div class="container">
      <div v-if="sample">
        <p class="title">
          <!-- <b-icon
            icon="flask-outline"
            size="is-medium"
            class="has-text-grey">
          </b-icon>-->
          {{sample.scientificName}}
        </p>

        <p class="subtitle">
          <nuxt-link :to="{ name: 'user', query: { username: sample.owner }}" class="has-text-text">
            <b-icon icon="account-outline" size="is-small" class="has-text-grey"></b-icon>
            {{sample.owner}}
          </nuxt-link>
          <br />
          <b-icon icon="account-multiple-outline" size="is-small" class="has-text-grey"></b-icon>
          {{sample.group.name}}
          <br />
          <nuxt-link
            :to="{ name: 'project', query: { id: sample.project._id }}"
            class="has-text-text"
          >
            <b-icon icon="folder-text-outline" size="is-small" class="has-text-grey"></b-icon>
            {{sample.project.name}}
          </nuxt-link>
        </p>

        <div class="columns">
          <div class="column">
            <b-field label="Scientific Name">
              <p>{{sample.scientificName}}</p>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Common Name">
              <p>{{sample.commonName}}</p>
            </b-field>
          </div>
          <div class="column">
            <b-field label="NCBI Taxonomy ID">
              <p>{{sample.ncbi}}</p>
            </b-field>
          </div>
        </div>

        <b-field label="Conditions">
          <p>{{sample.conditions}}</p>
        </b-field>

        <b-field label="Additional Files">
          <FileList additional="true," :files="sample.additionalFiles" />
        </b-field>
        <hr />
        <p class="title is-4">Runs</p>
        <RunList v-if="sample.runs" :sample="sample" :runs="sample.runs" showNewButton="true"/>
      </div>
    </div>
  </div>
</template>

<script>
import RunList from "../components/runs/RunList";
import FileList from "../components/FileList";
export default {
  components: { RunList, FileList },
  middleware: ["auth"],
  asyncData({ route, $axios, error, store }) {
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
      .then(res => {
        if (res.status === 200 && res.data.sample) {
          // res.data.project.samples = [];

          return {
            sample: res.data.sample
          };
        } else {
          error({ statusCode: 501, message: "Sample not found" });
        }
      })
      .catch(err => {
        console.error(err);
        error({ statusCode: 501, message: "Sample not found" });
      });
  }
};
</script>
