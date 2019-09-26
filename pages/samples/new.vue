<template>
  <div class="section">
    <div class="container">

      <h1 class="title">New Sample</h1>
      <h2 class="subtitle">Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Morbi leo
        risus, porta ac consectetur ac, vestibulum at eros.</h2>
      <hr>
      <form @submit.prevent="postForm">

        <b-field label="Project">
          {{project.name}}
        </b-field>


        <div class="columns">
          <div class="column">
            <b-field label="Name" message="Sed posuere consectetur est at lobortis.">
              <b-input
                name="name"
                v-model="sample.name"
                minlength="20"
                maxlength="80"
                required
                id="name">
              </b-input>
            </b-field>
          </div>
          <div class="column">

          </div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field label="Scientific Name" message="Sed posuere consectetur est at lobortis.">
              <b-input
                name="scientificName"
                v-model="sample.scientificName"
                minlength="5"
                required
                id="scientificName">
              </b-input>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Common Name" message="Sed posuere consectetur est at lobortis.">
              <b-input
                name="commonName"
                v-model="sample.commonName"
                minlength="5"
                required
                id="commonName">
              </b-input>
            </b-field>
          </div>
          <div class="column">
            <b-field label="NCBI" message="Sed posuere consectetur est at lobortis.">
              <b-input
                name="ncbi"
                v-model="sample.ncbi"
                minlength="5"
                type="number"
                required
                id="ncbi">
              </b-input>
            </b-field>
          </div>
        </div>

        <b-field label="Conditions" message="Sed posuere consectetur est at lobortis.">
          <b-input
            type="textarea"
            v-model="sample.conditions"
            minlength="100"
            required
            name="conditions"
            id="conditions">
          </b-input>
        </b-field>


        <hr>

        <!--<div class="buttons is-right">-->
        <button type="submit" class="button is-success">Create sample</button>
        <!--</div>-->
      </form>
    </div>
  </div>
</template>

<script>
  export default {
    middleware: 'auth',
    asyncData({store, route, $axios, error}) {

      if (!route.query.project) {
        error({statusCode: 500, message: 'Project not found'});
      }

      return $axios.get('/api/project', {params: {id: route.query.project}})
        .then(res => {
          if (res.status === 200) {
            return {
              project: res.data.project,
              sample: {
                project: res.data.project.id,
                scientificName: '',
                commonName: null,
                ncbi: '',
                conditions: '',
              }
            }
          }
          error({statusCode: 500, message: 'Project not found'});
        })
        .catch(err => {
          console.error(err);
          error({statusCode: 500, message: 'Project not found'});
        });


    },
    methods: {
      postForm() {
        this.sample.owner = this.$auth.user.username; //required
        this.sample.group = this.project.group;
        this.sample.project = this.project._id; //required
        // this.project.tags = this.tags;
        this.$axios.post('/api/samples/new', this.sample)
          .then(result => {
            this.$buefy.toast.open({
              message: 'Sample created!',
              type: 'is-success'
            });
            // this.$router.push({
            //   path: '/projects'
            // })
            console.log('result', result.data);
            this.$router.push({
              name: 'sample',
              params: {id: result.data.sample._id}
            })
          })
          .catch(err => {
            console.error(err);
            this.$buefy.dialog.alert({
              title: 'Error',
              message: err.message,
              type: 'is-danger',
              hasIcon: true
            })
          })
      }
    }
  }
</script>
