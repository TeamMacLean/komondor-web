<template>
  <div class="section">
    <div class="container">
      <div v-if="run">
        <p class="title">
          <!-- <b-icon
            icon="flask-outline"
            size="is-medium"
            class="has-text-grey">
          </b-icon>-->
          {{run.name}}
        </p>

        <p class="subtitle">
          <b-icon icon="account-outline" size="is-small" class="has-text-grey"></b-icon>
          {{run.owner}}
          <br />
          <b-icon icon="account-multiple-outline" size="is-small" class="has-text-grey"></b-icon>
          {{run.group.name}}
          <br />
          <nuxt-link
            :to="{ name: 'sample', query: { id: run.sample._id }}"
            class="has-text-text"
          >
            <b-icon icon="flask-outline" size="is-small" class="has-text-grey"></b-icon>
            {{run.sample.name}}
          </nuxt-link>
        </p>

        <div class="columns">
          <div class="column"></div>
          <div class="column"></div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field label="Sequencing Provider">
              <p>{{run.sequencingProvider}}</p>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Sequencing Technology">
              <p>{{run.sequencingTechnology}}</p>
            </b-field>
          </div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field label="Library Source">
              <p>{{run.librarySource}}</p>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Library Selection">
              <p>{{run.librarySelection}}</p>
            </b-field>
          </div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field label="Library Type">
              <p>{{run.libraryType}}</p>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Library Strategy">
              <p>{{run.libraryStrategy}}</p>
            </b-field>
          </div>
        </div>

        <b-field label="Insert Size">
          <p>{{run.insertSize}}</p>
        </b-field>

        <b-field label="Raw Files">
          <FileList :files="run.rawFiles" />
        </b-field>
        <b-field label="Additional Files">
          <FileList additional="true" :files="run.additionalFiles" />
        </b-field>
        <hr />
        <!-- <p class="title is-4">Runs</p>
        <RunList :sample="sample" :samples="sample.runs"></RunList>-->
      </div>
    </div>
  </div>
</template>

<script>
// import RunList from "../components/runs/RunList";
import FileList from "../components/FileList";
export default {
  components: {
    FileList
  },
  middleware: ["auth"],
  asyncData({ route, $axios, error, store }) {
    //TODO check if can view

    if (!route.query.id) {
      error({ statusCode: 404, message: "Run not found" });
    }

    //use cached project if available
    // const cachedProject = store.getters.getCachedSampleById(route.query.id);
    // if (cachedProject) {
    //   return Promise.resolve({
    //     project: cachedProject
    //   })
    // }

    return $axios
      .get("/run", { params: { id: route.query.id } })
      .then(res => {
        if (res.status === 200 && res.data.run) {
          // res.data.project.samples = [];
          console.log(res.data.run);
          return {
            run: res.data.run
          };
        } else {
          error({ statusCode: 501, message: "Run not found" });
        }
      })
      .catch(err => {
        console.error(err);
        error({ statusCode: 501, message: "Run not found" });
      });
  }
};
</script>
