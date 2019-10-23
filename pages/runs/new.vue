<template>
  <div class="section">
    <div class="container">

      <h1 class="title">New Run</h1>
      <h2 class="subtitle">Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Morbi leo
        risus, porta ac consectetur ac, vestibulum at eros.</h2>
      <hr>
      <form @submit.prevent="postForm">

        <b-field label="Sample">
          <!--          {{sam.name}}-->
        </b-field>


        <div class="columns">
          <div class="column">
            <b-field label="Name" message="Sed posuere consectetur est at lobortis.">
              <b-input
                expanded="true"
                name="name"
                v-model="run.name"
                minlength="5"
                maxlength="20"
                required
                id="name">
              </b-input>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Insert size" message="Sed posuere consectetur est at lobortis.">
              <b-input placeholder="Number"
                       expanded="true"
                       type="number"
                       min="0">
              </b-input>
            </b-field>
          </div>
        </div>

        <div class="columns">

          <div class="column">
            <b-field label="Sequencing provider" message="Sed posuere consectetur est at lobortis.">
              <b-select placeholder="Select a sequencing provider" expanded="true">
                <option
                  v-for="option in sequencingProviders"
                  :value="option.id"
                  :key="option.id">
                  {{ option.name }}
                </option>
              </b-select>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Sequencing technology" message="Sed posuere consectetur est at lobortis.">
              <b-select placeholder="Select a sequencing technology" expanded="true">
                <option
                  v-for="option in sequencingTechnologies"
                  :value="option.id"
                  :key="option.id">
                  {{ option.name }}
                </option>
              </b-select>
            </b-field>
          </div>
        </div>


        <div class="columns">
          <div class="column">
            <b-field label="Library source" message="Sed posuere consectetur est at lobortis.">
              <b-select placeholder="Select a library source" expanded="true">
                <option
                  v-for="option in librarySources"
                  :value="option.id"
                  :key="option.id">
                  {{ option.name }}
                </option>
              </b-select>
            </b-field>
          </div>

          <div class="column">
            <b-field label="Library selection" message="Sed posuere consectetur est at lobortis.">
              <b-select placeholder="Select a library selection" expanded="true">
                <option
                  v-for="option in librarySelections"
                  :value="option.id"
                  :key="option.id">
                  {{ option.name }}
                </option>
              </b-select>
            </b-field>
          </div>


        </div>
        <div class="columns">
          <div class="column">
            <b-field label="Library type" message="Sed posuere consectetur est at lobortis.">
              <b-select placeholder="Select a library type" expanded="true">
                <option
                  v-for="option in libraryTypes"
                  :value="option.id"
                  :key="option.id">
                  {{ option.name }}
                </option>
              </b-select>
            </b-field>
          </div>


          <div class="column">
            <b-field label="Library strategy" message="Sed posuere consectetur est at lobortis.">
              <b-select placeholder="Select a library strategy" expanded="true">
                <option
                  v-for="option in libraryStrategies"
                  :value="option.id"
                  :key="option.id">
                  {{ option.name }}
                </option>
              </b-select>
            </b-field>
          </div>

        </div>

        <hr>

        Supporting Files


        <hr>

        Raw read data

        //TODO any reason not to provide processed here?

        <!--<div class="buttons is-right">-->
        <button type="submit" class="button is-success">Create run</button>
        <!--</div>-->
      </form>
    </div>
  </div>
</template>

<script>
    export default {
        middleware: 'auth',
        asyncData({store, route, $axios, error}) {

            if (!route.query.sample) {
                error({statusCode: 500, message: 'Project not found'});
            }

            return $axios.get('/sample', {params: {id: route.query.sample}})
                .then(res => {
                    if (res.status === 200) {
                        return {
                            sample: res.data.sample,
                            run: {
                                sample: res.data.sample.id,
                                libraryType: null,
                                sequencingProvider: null,
                                sequencingTechnologie: null,
                                librarySource: null,
                                librarySelection: null,
                                libraryStrategy: null,
                                insertSize: null,
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
        computed: {
            libraryTypes() {
                return JSON.parse(JSON.stringify(this.$store.state.libraryTypes))
            },
            sequencingProviders() {
                return JSON.parse(JSON.stringify(this.$store.state.sequencingProviders))
            },
            sequencingTechnologies() {
                return JSON.parse(JSON.stringify(this.$store.state.sequencingTechnologies))
            },
            librarySources() {
                return JSON.parse(JSON.stringify(this.$store.state.librarySources))
            },
            librarySelections() {
                return JSON.parse(JSON.stringify(this.$store.state.librarySelections))
            },
            libraryStrategies() {
                return JSON.parse(JSON.stringify(this.$store.state.libraryStrategies))
            },

        }
        // asyncData({store, route, $axios, error}) {
        //
        //   if (!route.query.project) {
        //     error({statusCode: 500, message: 'Project not found'});
        //   }
        //
        //   return $axios.get('/project', {params: {id: route.query.project}})
        //     .then(res => {
        //       if (res.status === 200) {
        //         return {
        //           project: res.data.project,
        //           sample: {
        //             project: res.data.project.id,
        //             scientificName: '',
        //             commonName: null,
        //             ncbi: '',
        //             conditions: '',
        //           }
        //         }
        //       }
        //       error({statusCode: 500, message: 'Project not found'});
        //     })
        //     .catch(err => {
        //       console.error(err);
        //       error({statusCode: 500, message: 'Project not found'});
        //     });
        //
        //
        // },
        // methods: {
        //   postForm() {
        //     this.sample.owner = this.$auth.user.username; //required
        //     this.sample.group = this.project.group;
        //     this.sample.project = this.project._id; //required
        //     // this.project.tags = this.tags;
        //     this.$axios.post('/samples/new', this.sample)
        //       .then(result => {
        //         this.$buefy.toast.open({
        //           message: 'Sample created!',
        //           type: 'is-success'
        //         });
        //         // this.$router.push({
        //         //   path: '/projects'
        //         // })
        //         console.log('result', result.data);
        //         this.$router.push({
        //           name: 'sample',
        //           params: {id: result.data.sample._id}
        //         })
        //       })
        //       .catch(err => {
        //         console.error(err);
        //         this.$buefy.dialog.alert({
        //           title: 'Error',
        //           message: err.message,
        //           type: 'is-danger',
        //           hasIcon: true
        //         })
        //       })
        //   }
        // }
    }
</script>
