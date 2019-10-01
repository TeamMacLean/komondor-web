<template>
  <div class="section">
    <div class="container">

      <h1 class="title">New Project</h1>
      <h2 class="subtitle">Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Morbi leo
        risus, porta ac consectetur ac, vestibulum at eros.</h2>
      <hr>
      <form @submit.prevent="postForm">

        <div class="columns">

          <div class="column">
            <!--Name-->
            <b-field label="Name" message="A short, informative name to identify your project.">
              <b-input
                name="name"
                v-model="project.name"
                minlength="20"
                maxlength="80"
                required
                id="name">
              </b-input>
            </b-field>
          </div>


          <div class="column">
            <!--Group-->
            <b-field label="Group" message="The group that this projects belongs to.">
              <b-select placeholder="Select a group" v-model="project.group" required>
                <option
                  v-for="group in $store.state.groups"
                  :value="group._id"
                  :key="group._id">
                  {{ group.name }}
                </option>
              </b-select>
            </b-field>

          </div>
        </div>

        <!--Short desc-->
        <b-field label="Short description" message="One short, descriptive sentence of what the project is about.">
          <b-input
            name="shortDesc"
            v-model="project.shortDesc"
            minlength="20"
            required
            id="shortDesc">
          </b-input>
        </b-field>


        <!--Long desc-->
        <b-field label="Long description"
                 message="A longer description/abstract of what the project is about.">
          <b-input
            type="textarea"
            v-model="project.longDesc"
            minlength="100"
            required
            name="longDesc"
            id="longDesc">
          </b-input>
        </b-field>


        <!--<b-field label="Tags">-->
        <!--<b-taginput-->
        <!--v-model="tags"-->
        <!--:data="filteredTags"-->
        <!--autocomplete-->
        <!--:allow-new="true"-->
        <!--icon="tag"-->
        <!--placeholder="Add a tag"-->
        <!--maxlength="10"-->
        <!--maxtags="5"-->
        <!--@typing="getFilteredTags">-->
        <!--</b-taginput>-->
        <!--</b-field>-->
        <!--<hr>-->

        <hr>

        <b-field label="Additional files"
                 message="Please upload any documentation obtained from the sequencing provider, including copies of the communication. If the documentation pertains only to a certain sample or data set, then please add it there instead.">
          <Uploader uploadID="uploadID"/>
        </b-field>


        <hr>

        <!--<div class="buttons is-right">-->
        <button type="submit" class="button is-success">Create project</button>
        <!--</div>-->
      </form>
    </div>
  </div>
</template>


<script>

  // const initTags = ['type1', 'type2'];

  import Uploader from '~/components/uploads/uploader.vue';
  import uuidv1 from 'uuid/v1';

  export default {
    middleware: 'auth',
    components: {Uploader},
    data() {
      return {
        // tags: [],
        // filteredTags: initTags,
        dropFiles: [],
        project: {
          name: '',
          group: null,
          shortDesc: '',
          longDesc: '',
          isSelectOnly: false,
          uploadID: uuidv1()
        }
      }
    },
    fetch({store}) {
      // return Promise.all([
      //   store.dispatch('refreshProjects'),
      return store.dispatch('refreshGroups')
      // store.dispatch('refreshUsers')
      // ])
    },
    methods: {
      // getFilteredTags(text) {
      //   this.filteredTags = initTags.filter((option) => {
      //     return option
      //       .toString()
      //       .toLowerCase()
      //       .indexOf(text.toLowerCase()) >= 0
      //   })
      // },
      postForm() {
        this.project.owner = this.$auth.user.username; //required
        // this.project.tags = this.tags;
        this.$axios.post('/api/projects/new', this.project)
          .then(result => {


            this.$buefy.toast.open({
              message: 'Project created!',
              type: 'is-success'
            });
            this.$router.push({
              name: 'project',
              params: {id: result.data.project._id}
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

<style>

</style>
