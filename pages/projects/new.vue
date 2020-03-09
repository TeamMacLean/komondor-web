<template>
  <div class="section">
    <div class="container">
      <h1 class="title">New Project</h1>
      <!-- <h2 class="subtitle">
        Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Morbi leo
        risus, porta ac consectetur ac, vestibulum at eros.
      </h2>-->
      <hr />
      <form @submit.prevent="postForm">
        <div class="columns">
          <div class="column">
            <!--Name-->
            <b-field
              label="Name"
              message="Find a suitable short name for your project, something that you can memorise and  that also works reasonably well to present your study to the public"
            >
              <b-input
                name="name"
                v-model="project.name"
                minlength="20"
                maxlength="80"
                required
                id="name"
              ></b-input>
            </b-field>
          </div>

          <div class="column">
            <!--Group-->
            <b-field label="Group" message="The group that this project belongs to.">
              <b-select placeholder="Select a group" v-model="project.group" required>
                <option
                  v-for="group in $store.state.groups.filter((f)=>!f.deleted)"
                  :value="group._id"
                  :key="group._id"
                >{{ group.name }}</option>
              </b-select>
            </b-field>
          </div>
        </div>

        <!--Short desc-->
        <b-field
          label="Short description"
          message="One to three short descriptive sentences that provide information about the study."
        >
          <b-input
            name="shortDesc"
            v-model="project.shortDesc"
            minlength="20"
            required
            id="shortDesc"
          ></b-input>
        </b-field>

        <!--Long desc-->
        <b-field
          label="Long description"
          message="The purpose of this field is to provide an abstract about the study. It is a required field for ENA and if you already have an abstract for a publication ready, then by all  means use it. If not, simply copy the short description and paste it here."
        >
          <b-input
            type="textarea"
            v-model="project.longDesc"
            minlength="100"
            required
            name="longDesc"
            id="longDesc"
          ></b-input>
        </b-field>

        <hr />

        <b-field
          label="Additional files"
          message="Please upload any documentation obtained from the sequencing provider, including copies of the communication. If the documentation pertains only to a certain sample or data set, then please add it there instead."
        >
          <Uploader :uploadID="project.additionalUploadID" ref="additionalUploads" />
        </b-field>

        <hr />

        <!--<div class="buttons is-right">-->
        <div class="field">
          <b-checkbox v-model="doNotSendToEna">Request that this not be sent to ENA</b-checkbox>
          <p
            class="help"
            v-if="!doNotSendToEna"
          >Checking this will require you to give a reason why.</p>
        </div>

        <div class="field" v-if="doNotSendToEna">
          <b-input
            v-model="doNotSendToEnaReason"
            type="textarea"
            minlength="50"
            placeholder="I believe this project should not be submitted to ENA because..."
            required
          ></b-input>
        </div>

        <hr />

        <button type="submit" class="button is-success" :disabled="!canSubmit">Create project</button>
      </form>
    </div>
  </div>
</template>


<script>
import Uploader from "~/components/uploads/Uploader.vue";
import uuidv4 from "uuid/v4";

export default {
  middleware: "auth",
  components: { Uploader },
  // mounted(){
  //   this.$refs.additionalUploads.on('canSubmit', function(){
      
  //   })
  // },
  data() {
    return {
      doNotSendToEna: false,
      doNotSendToEnaReason: null,
      dropFiles: [],
      project: {
        name: "",
        group: null,
        shortDesc: "",
        longDesc: "",
        isSelectOnly: false,
        additionalUploadID: uuidv4()
      }
    };
  },
  fetch({ store }) {
    return store.dispatch("refreshGroups");
  },
  computed: {
    canSubmit() {
      // console.log(this.$refs.additionalUploads)/
      return true;
    }
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
      this.$axios
        .post("/projects/new", this.project)
        .then(result => {
          this.$buefy.toast.open({
            message: "Project created!",
            type: "is-success"
          });
          this.$router.push({
            name: "project",
            query: { id: result.data.project._id }
          });
        })
        .catch(err => {
          console.error(err);
          this.$buefy.dialog.alert({
            title: "Error",
            message: err.message,
            type: "is-danger",
            hasIcon: false
          });
        });
    }
  }
};
</script>

<style>
</style>
