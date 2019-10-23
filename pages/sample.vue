<template>
  <div class="section">
    <div class="container">
      <div v-if="sample">

        <p class="title">
          <b-icon
            icon="alpha-s-box-outline"
            size="is-medium"
            class="has-text-grey">
          </b-icon>
          {{sample.scientificName}}
        </p>

        <p class="subtitle">
          <b-icon
            icon="account-outline"
            size="is-small"
            class="has-text-grey">
          </b-icon>
          {{sample.owner}}
          <br>
          <b-icon
            icon="account-multiple-outline"
            size="is-small"
            class="has-text-grey">
          </b-icon>
          {{sample.group.name}}
        </p>

        <hr>
        <p class="title is-4">Runs</p>
        <RunList :sample="sample" :samples="sample.runs"></RunList>
      </div>
    </div>

  </div>
</template>

<script>
  import RunList from "../components/runs/RunList";

  export default {
    components: {RunList},
    middleware: ['auth'],
    asyncData({route, $axios, error, store}) {
      //TODO check if can view

      if (!route.query.id) {
        error({statusCode: 404, message: 'Sample not found'})
      }

      //use cached project if available
      // const cachedProject = store.getters.getCachedSampleById(route.query.id);
      // if (cachedProject) {
      //   return Promise.resolve({
      //     project: cachedProject
      //   })
      // }

      return $axios.get('/sample', {params: {id: route.query.id}})
        .then(res => {
          if (res.status === 200 && res.data.sample) {
            // res.data.project.samples = [];
            return {
              sample: res.data.sample
            }
          } else {
            error({statusCode: 501, message: 'Sample not found'})
          }
        })
        .catch(err => {
          console.error(err);
          error({statusCode: 501, message: 'Sample not found'})
        })


    }
  }
</script>
