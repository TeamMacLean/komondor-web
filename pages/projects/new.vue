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
              :type="isWarningStyleForNameInput"
              message="Find a suitable short name for your project, 20-80 characters in length, something that you can memorise and that also works reasonably well to present your study to the public"
            >
              <b-input
                id="name"
                v-model="project.name"
                name="name"
                minlength="20"
                maxlength="80"
                required
              ></b-input>
            </b-field>
          </div>

          <div class="column">
            <!--Group-->
            <b-field
              v-if="$store.state.groups.filter((f) => !f.deleted).length > 1"
              label="Group"
              message="The group that this project belongs to."
            >
              <b-select
                v-model="project.group"
                placeholder="Select a group"
                required
              >
                <option
                  v-for="group in $store.state.groups.filter((f) => !f.deleted)"
                  :key="group._id"
                  :value="group._id"
                >
                  {{ group.name }}
                </option>
              </b-select>
            </b-field>
            <b-field
              v-else-if="
                $store.state.groups.filter((f) => !f.deleted).length === 1
              "
              label="Group"
              message="The group that this project belongs to. (Defaulted as the only group available to you. Contact system admin to create new groups if required.)"
            >
              <div class="onlyOneSelectOption">
                {{ $store.state.groups.filter((f) => !f.deleted)[0].name }}
              </div>
            </b-field>
            <b-field v-else>
              <div class="errorMessage">
                Error: no groups found. Please contact your system administrator
                to proceed.
              </div>
            </b-field>
          </div>
        </div>
        <!--Short desc-->
        <b-field
          label="Short description"
          message="One to three short descriptive sentences, 20-200 characters in length, that provide information about the study."
        >
          <b-input
            id="shortDesc"
            v-model="project.shortDesc"
            name="shortDesc"
            minlength="20"
            maxlength="200"
            required
          ></b-input>
        </b-field>

        <!--Long desc-->
        <b-field
          label="Long description"
          message="Provide an abstract about the study, 100-1000 characters in length. It is a required field for ENA and if you already have an abstract for a publication ready, then by all  means use it. If not, simply copy or embellish the short description and paste it here."
        >
          <b-input
            id="longDesc"
            v-model="project.longDesc"
            type="textarea"
            minlength="100"
            maxlength="1000"
            required
            name="longDesc"
          ></b-input>
        </b-field>

        <hr />

        <b-field
          label="Additional files"
          message="Please upload any documentation obtained from the sequencing provider, including copies of the communication. If the documentation pertains only to a certain sample or data set, then please add it there instead. Note: this is NOT the place to upload raw sequence files."
        >
          <Uploader
            ref="additionalUploader"
            :on-upload-status-change="onUploaderChange"
          />
        </b-field>
        <CollapsibleUploaderHelp />
        <hr />

        <!--<div class="buttons is-right">-->
        <div v-if="selectedGroup && selectedGroup.sendToEna">
          <div class="field">
            <b-checkbox v-model="project.doNotSendToEna"
              >Request that this not be sent to ENA</b-checkbox
            >
            <p v-if="!project.doNotSendToEna" class="help">
              Checking this will require you to give a reason why.
            </p>
          </div>

          <div v-if="project.doNotSendToEna" class="field">
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

        <!-- TEMP -->
        <FormConsentCheckbox :initial="true" />

        <hr />

        <button type="submit" class="button is-success" :disabled="!canSubmit">
          Create project
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import Uploader from "~/components/uploads/Uploader.vue";
import FormConsentCheckbox from "~/components/formHelpers/FormConsentCheckbox";
import CollapsibleUploaderHelp from "~/components/formHelpers/CollapsibleUploaderHelp";

export default {
  name: "NewProject",
  components: { Uploader, FormConsentCheckbox, CollapsibleUploaderHelp },
  middleware: "auth",
  // mounted(){
  //   console.log('mounted, this.isSubmitting:', this.isSubmitting, 'canSubmit:', this.canSubmit);
  // },
  asyncData({ $axios, error }) {
    return $axios
      .get("/projects/names")
      .then((res) => {
        if (res.status === 200 && res.data.projectsNames) {
          return {
            isSubmitting: false,
            additionalUploadsComplete: true,
            bad: {
              nameList: res.data.projectsNames,
            },
            project: {
              name: "",
              group: "",
              shortDesc: "",
              longDesc: "",

              /** TEMP DATA 
              name: "Hot shooting war #" + Math.round(Math.random() * 10000),
              group: "bioinformatics",
              shortDesc:
                "Vestibulum id ligula porta felis euismod semper. Maecenas sed diam eget risus varius blandit sit amet non magna.",
              longDesc:
                "Donec ullamcorper nulla non metus auctor fringilla. Nullam id dolor id nibh ultricies vehicula ut id elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum id ligula porta felis euismod semper.",
              */
              doNotSendToEna: false,
              doNotSendToEnaReason: null,
              additionalFiles: [],
            } /*,
            isSubmitting: false, TODO for loading style on button when applicable / i can get to work */,
          };
        } else {
          error({ statusCode: 501, message: "Unknown error" });
        }
      })
      .catch((err) => {
        console.error(err);
        error({ statusCode: 501, message: "Unknown error" });
      });
  },
  fetch({ store }) {
    // NB don't need return necessarily
    return store.dispatch("refreshGroups");
  },
  computed: {
    isWarningStyleForNameInput() {
      return this.bad.nameList.includes(this.project.name) ? "is-danger" : "";
    },
    canSubmit() {
      if (
        this.additionalUploadsComplete &&
        !this.isWarningStyleForNameInput &&
        !this.isSubmitting
      ) {
        return true;
      } else {
        return false;
      }
    },
    selectedGroup() {
      if (this.project.group) {
        const found = this.$store.state.groups.filter(
          (f) => f._id === this.project.group
        );
        if (found.length) {
          return found[0];
        } else {
          return null;
        }
      } else {
        return null;
      }
    },
  },
  methods: {
    onUploaderChange() {
      //
      // if (typeof val === "boolean") {
      //   this.additionalUploadsComplete = val;
      // }
      this.updateAdditionalFiles();
    },
    updateAdditionalFiles() {
      if (this.$refs["additionalUploader"]) {
        this.project.additionalFiles =
          this.$refs["additionalUploader"].getFiles();
      }
    },
    // processInvalidFormFieldError(errorMessage, badListKey, newBadItem){
    //   this.bad[badListKey].push(newBadItem);
    //   this.$buefy.dialog.alert({
    // },
    // isFormValid() {
    //   const wrongNameLength = false;
    //   if (wrongNameLength){
    //     this.processInvalidFormFieldError('Project name not the correct length', 'nameList', this.project.name)
    //     return false;
    //   }
    //   return true;
    // },
    postForm() {
      const targetUsername = this.$auth.user.username;
      if (!targetUsername) {
        throw new Error(
          "Issue authenticating you. Please sign in and out of this website and try again."
        );
      }

      this.isSubmitting = true;
      console.log(
        "posting form, this.isSubmitting:",
        this.isSubmitting,
        "canSubmit:",
        this.canSubmit
      );

      this.updateAdditionalFiles();

      // HACKY
      if (this.$store.state.groups.filter((f) => !f.deleted).length === 1) {
        this.project.group = this.$store.state.groups.filter(
          (f) => !f.deleted
        )[0]._id;
      }

      // HACK
      this.project.owner = targetUsername; //required

      this.$axios
        .post("/projects/new", this.project)
        .then((result) => {
          // HACK ensure file uploads in db/hpc before reading
          setTimeout(() => {
            this.$buefy.toast.open({
              message: "Project created!",
              type: "is-success",
            });

            this.$router.push({
              name: "project",
              query: { id: result.data.project._id },
            });

            this.isSubmitting = false;
            console.log(
              "succesful form, this.isSubmitting:",
              this.isSubmitting,
              "canSubmit:",
              this.canSubmit
            );
          }, 3000);
        })
        .catch((err) => {
          setTimeout(() => {
            console.error(err);
            var errorMessage = err.message;
            if (err.message.includes("500")) {
              const type = "Project";
              errorMessage =
                "Unknown 500 error from server. Sorry about that." +
                "\n" +
                type +
                " info may have registered in database." +
                "\nUploads are on remote server, but may not have been registered in database and/or moved to HPC." +
                "\nPlease check all this using this website, and notify system admin of when this happened, and which data you need cleaning up.";
            }
            this.$buefy.dialog.alert({
              title: "Error",
              message: errorMessage,
              type: "is-danger",
              hasIcon: false,
            });
            this.isSubmitting = false;
            console.log(
              "error submitting, this.isSubmitting:",
              this.isSubmitting,
              "canSubmit:",
              this.canSubmit
            );
          }, 2000);
        });
    },
  },
};
</script>

<style>
.checkbox-label {
  padding-left: 0.5rem;
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
