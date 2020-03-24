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
          <Uploader ref="additionalUploader" :onUploadStatusChange="onUploaderChange" />
        </b-field>

        <hr />

        <!--<div class="buttons is-right">-->
        <div v-if="selectedGroup && selectedGroup.sendToEna">
          <div class="field">
            <b-checkbox v-model="project.doNotSendToEna">Request that this not be sent to ENA</b-checkbox>
            <p
              class="help"
              v-if="!project.doNotSendToEna"
            >Checking this will require you to give a reason why.</p>
          </div>

          <div class="field" v-if="project.doNotSendToEna">
            <b-input
              v-model="project.doNotSendToEnaReason"
              type="textarea"
              minlength="50"
              placeholder="I believe this project should not be submitted to ENA because..."
              required
            ></b-input>
          </div>

          <hr />
        </div>

        <button type="submit" class="button is-success" :disabled="!canSubmit">Create project</button>
      </form>
    </div>
  </div>
</template>


<script>
import Uploader from "~/components/uploads/Uploader.vue";
import { v4 as uuidv4 } from "uuid";

export default {
  middleware: "auth",
  components: { Uploader },
  // mounted(){
  //   this.$refs.additionalUploads.on('canSubmit', function(){

  //   })
  // },
  data() {
    return {
      additionalUploadsComplete: true,
      project: {
        name: "",
        group: null,
        shortDesc: "",
        longDesc: "",
        isSelectOnly: false,
        doNotSendToEna: false,
        doNotSendToEnaReason: null,
        additionalFiles: []
      }
    };
  },
  fetch({ store }) {
    return store.dispatch("refreshGroups");
  },
  computed: {
    canSubmit() {
      return this.additionalUploadsComplete;
    },
    selectedGroup() {
      if (this.project.group) {
        const found = this.$store.state.groups.filter(
          f => f._id === this.project.group
        );
        if (found.length) {
          return found[0];
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
  },
  methods: {
    onUploaderChange(val) {
      //
      if (typeof val === "boolean") {
        this.additionalUploadsComplete = val;
      }
      this.updateAdditionalFiles();
    },
    updateAdditionalFiles() {
      if (this.$refs["additionalUploader"]) {
        this.project.additionalFiles = this.$refs[
          "additionalUploader"
        ].getFiles();
      }
    },
    postForm() {
      this.updateAdditionalFiles();

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
          // console.error(err);
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
