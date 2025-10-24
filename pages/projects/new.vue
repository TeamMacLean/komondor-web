<template>
  <div class="section">
    <div class="container">
      <h1 class="title">New Project</h1>
      <h3 class="subtitle">
        <i> Ensure required fields (*) are filled in before submitting. </i>
      </h3>
      <hr />
      <form @submit.prevent="postForm">
        <div class="columns">
          <div class="column">
            <!--Name-->
            <b-field
              label="Name*"
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
              v-if="areMultipleAvailableGroups"
              label="Group*"
              message="The group that this project belongs to."
            >
              <b-select
                v-model="project.group"
                placeholder="Select a group"
                required
              >
                <option
                  v-for="group in availableGroups"
                  :key="group._id"
                  :value="group._id"
                >
                  {{ group.name }}
                </option>
              </b-select>
            </b-field>
            <b-field
              v-else-if="onlyOneGroup"
              label="Group*"
              message="The group that this project belongs to. (Defaulted as the only group available to you. Contact system admin to create new groups if required.)"
            >
              <div class="onlyOneSelectOption">
                <!-- <input v-model="project.group" type="hidden" /> -->
                {{ availableGroups[0].name }}
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
          label="Short description*"
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
          label="Long description*"
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
        <FormConsentCheckbox :initial="consent" :on-toggle="onToggleConsent" />

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
            consent: false,
            project: {
              name: "",
              group: "",
              shortDesc: "",
              longDesc: "",
              doNotSendToEna: false,
              doNotSendToEnaReason: null,
              additionalFiles: [],
            },
          };
        } else {
          error({ statusCode: 501, message: "Unknown error" });
        }
      })
      .catch((err) => {
        console.error("Error fetching project names:", err); // More specific error log
        error({ statusCode: 501, message: "Unknown error" });
      });
  },
  async fetch({ store }) {
    await store.dispatch("refreshGroups");
  },
  computed: {
    user() {
      return this.$auth?.user || null;
    },
    availableGroups() {
      const availableGroupsResult = this.$store.state.groups.filter(
        (f) => !f.deleted
      );
      return availableGroupsResult;
    },
    areMultipleAvailableGroups() {
      return this.availableGroups.length > 1;
    },
    onlyOneGroup() {
      return this.availableGroups.length === 1;
    },
    isWarningStyleForNameInput() {
      return this.bad.nameList.includes(this.project.name) ? "is-danger" : "";
    },
    canSubmit() {
      const allFieldsFilled =
        (this.project.group || this.onlyOneGroup) &&
        this.project.name &&
        this.project.shortDesc &&
        this.project.longDesc;

      const isEnaReasonValid = this.project.doNotSendToEna
        ? this.project.doNotSendToEnaReason &&
          this.project.doNotSendToEnaReason.length >= 50
        : true;

      return (
        this.additionalUploadsComplete &&
        !this.isWarningStyleForNameInput &&
        !this.isSubmitting &&
        allFieldsFilled &&
        this.consent &&
        isEnaReasonValid
      );
    },
    selectedGroup() {
      if (this.project.group) {
        const found = this.availableGroups.filter(
          (f) => f._id === this.project.group
        );
        if (found.length) {
          return found[0];
        } else {
          // --- DEBUGGING: Log error if selected group ID doesn't match any found group ---
          // This might indicate an issue with the stored group ID or the filtering.
          console.error("Selected group ID not found in available groups.", {
            selectedGroupId: this.project.group,
            availableGroupsCount: this.availableGroups.length,
            errorContext: "selectedGroup computed property",
            currentUser: this.$auth?.user,
          });
          return null;
        }
      } else {
        return null;
      }
    },
  },
  watch: {
    availableGroups: {
      handler(newGroups) {
        if (newGroups.length === 0) {
          console.error(
            "No groups found for project creation. Cannot proceed without a group.",
            {
              currentUser: this.$auth?.user,
              groupsInStore: this.availableGroups,
              filteredGroups: newGroups,
              errorContext: "Group selection watcher",
            }
          );
        } else if (newGroups.length === 1 && !this.project.group) {
          this.project.group = newGroups[0]._id;
        }
      },
      immediate: true,
    },
    "project.name": {
      // Handler is not strictly needed here as computed property handles it
    },
    "project.doNotSendToEna": {
      handler(newValue) {
        if (!newValue) {
          this.project.doNotSendToEnaReason = null;
        }
      },
    },
  },
  methods: {
    onToggleConsent(newState) {
      this.consent = newState;
    },
    onUploaderChange() {
      this.updateAdditionalFiles();
    },
    updateAdditionalFiles() {
      if (this.$refs["additionalUploader"]) {
        this.project.additionalFiles =
          this.$refs["additionalUploader"].getFiles();
      }
    },
    postForm() {
      const targetUsername = this.$auth?.user?.username;
      if (!targetUsername) {
        console.error("Authentication Error: User or username missing.", {
          auth: this.$auth,
          user: this.$auth?.user,
          errorContext: "postForm - User authentication check",
        });
        throw new Error(
          "Issue authenticating you. Please sign in and out of this website and try again."
        );
      }

      this.isSubmitting = true;
      this.updateAdditionalFiles();

      // Handle group selection logic if only one group is available
      if (this.onlyOneGroup) {
        this.project.group = this.availableGroups[0]._id;
      }

      // Assign the owner of the project
      this.project.owner = targetUsername;

      this.$axios
        .post("/projects/new", this.project)
        .then((result) => {
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
          }, 3000);
        })
        .catch((err) => {
          setTimeout(() => {
            console.error("Error submitting form:", err);
            var errorMessage = err.message;
            if (err.message.includes("500")) {
              errorMessage =
                "Unknown 500 error from server. Sorry about that. " +
                "Your project details might have been partially saved. " +
                "Uploads may exist on the server but might not be linked to the project. " +
                "Please check the website and notify the system admin of the time this error occurred.";
            } else if (err.response?.data?.error) {
              errorMessage = err.response.data.error;
            } else {
              errorMessage =
                "An unexpected error occurred. Please try again or contact support.";
            }

            this.$buefy.dialog.alert({
              title: "Error",
              message: errorMessage,
              type: "is-danger",
              hasIcon: false,
            });
            this.isSubmitting = false;
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
