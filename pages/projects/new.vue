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
              message="Find a suitable short name for your project, 20-80 characters in length, something that you can memorise and that also works reasonably well to present your study to the public"
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
            <b-field 
              label="Group" message="The group that this project belongs to."
              v-if="$store.state.groups.filter((f)=>!f.deleted).length > 1"
            >
              <b-select 
                placeholder="Select a group" v-model="project.group" required
              >
                <option
                  v-for="group in $store.state.groups.filter((f)=>!f.deleted)"
                  :value="group._id"
                  :key="group._id"
                >
                  {{ group.name }}
                </option>
              </b-select>
            </b-field>
            <b-field 
              v-else-if="$store.state.groups.filter((f)=>!f.deleted).length === 1"
              label="Group" message="The group that this project belongs to. (Defaulted as only 1 group available to you.)">

              <div
                class="onlyOneSelectOption"
                
              >
                {{ $store.state.groups.filter((f)=>!f.deleted)[0].name }}
              </div>
            </b-field>
            <b-field  v-else>
              <div class="errorMessage">Error: no groups found. Please contact your system administrator to proceed.</div>
            </b-field>
          </div>
        </div>
        <!--Short desc-->
        <b-field
          label="Short description"
          message="One to three short descriptive sentences, 20-200 characters in length, that provide information about the study."
        >
          <b-input
            name="shortDesc"
            v-model="project.shortDesc"
            minlength="20"
            maxlength="200"
            required
            id="shortDesc"
          ></b-input>
        </b-field>

        <!--Long desc-->
        <b-field
          label="Long description"
          message="Provide an abstract about the study, 100-1000 characters in length. It is a required field for ENA and if you already have an abstract for a publication ready, then by all  means use it. If not, simply copy or embellish the short description and paste it here."
        >
          <b-input
            type="textarea"
            v-model="project.longDesc"
            minlength="100"
            maxlength="1000"
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

        <FormConsentCheckbox />
        
        <hr />

        <button 
          type="submit" class="button is-success" :disabled="!canSubmit"
        >
          Create project
        </button>
      </form>
    </div>
  </div>
</template>


<script>
import Uploader from "~/components/uploads/Uploader.vue";
import FormConsentCheckbox from "~/components/formHelpers/formConsentCheckbox"
import { v4 as uuidv4 } from "uuid";

export default {
  middleware: "auth",
  components: { Uploader, FormConsentCheckbox },
  // mounted(){
    // this.$refs.additionalUploads.on('canSubmit', function(){

    // })
  // },
  data() {
    return {
      additionalUploadsComplete: true,
      project: {
        name: 'Well hello there travel-hare',
        group: null,
        /* change to empty string */ shortDesc: "Donec ullamcorper nulla non metus auctor fringilla. Donec sed odio dui. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Maecenas sed diam eget risus varius blandit sit amet non magna. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.",
        /* change to empty string */ longDesc: "Donec ullamcorper nulla non metus auctor fringilla. Donec sed odio dui. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Maecenas sed diam eget risus varius blandit sit amet non magna. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.",
        isSelectOnly: false,
        doNotSendToEna: false,
        doNotSendToEnaReason: null,
        additionalFiles: []
      }/*,
      isSubmitting: false, TODO for loading style on button when applicable / i can get to work */
    };
  },
  fetch({ store }) {
    // NB don't need return necessarily
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

      // console.log('eggs are yellow')
      // this.isSubmitting = true;

      this.updateAdditionalFiles();

      // HACKY
      if (this.$store.state.groups.filter((f)=>!f.deleted).length === 1){
        this.project.group = this.$store.state.groups.filter((f)=>!f.deleted)[0]._id;
      }

      this.project.owner = this.$auth.user.username; //required
      // this.project.tags = this.tags;
      this.$axios
        .post("/projects/new", this.project)
        .then(result => {

          // HACK ensure additional upload file is in db before
          // looking up for it in view project page
          setTimeout(() => {
            this.$buefy.toast.open({
              message: "Project created!",
              type: "is-success"
            });

            // unnecessary?
            // this.isSubmitting = false;

            this.$router.push({
              name: "project",
              query: { id: result.data.project._id }
            });
          }, 100)
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
.checkbox-label {
  padding-left: .5rem;
}

.onlyOneSelectOption {
  height: 35px;
  display: flex;
  align-items: center;
}

.errorMessage {
  color: #f14668;
  display: block;
}
</style>
