<template>
  <div class="section">
    <div class="container">
      <h1 class="title">New Project</h1>
      <h2 class="subtitle">
        Ensure required fields (*) are filled in before submitting.
      </h2>
      <hr />

      <form @submit.prevent="submitForm">
        <!-- Project Name & Group -->
        <div class="columns">
          <div class="column">
            <b-field
              label="Name*"
              :type="{ 'is-danger': validationErrors.name }"
              :message="validationErrors.name || nameMessage"
            >
              <b-input
                v-model.trim="project.name"
                minlength="20"
                maxlength="80"
                required
              ></b-input>
            </b-field>
          </div>
          <div class="column">
            <b-field
              label="Group*"
              message="The group this project belongs to."
            >
              <b-select
                v-model="project.group"
                placeholder="Select a group"
                required
                :disabled="availableGroups.length <= 1"
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
          </div>
        </div>

        <!-- Descriptions -->
        <b-field
          label="Short description*"
          :type="{ 'is-danger': validationErrors.shortDesc }"
          :message="validationErrors.shortDesc || shortDescMessage"
        >
          <b-input
            v-model.trim="project.shortDesc"
            minlength="20"
            maxlength="200"
            required
          ></b-input>
        </b-field>

        <b-field
          label="Long description*"
          :type="{ 'is-danger': validationErrors.longDesc }"
          :message="validationErrors.longDesc || longDescMessage"
        >
          <b-input
            v-model.trim="project.longDesc"
            type="textarea"
            minlength="100"
            maxlength="1000"
            required
          ></b-input>
        </b-field>

        <hr />

        <!-- File Uploader -->
        <b-field
          label="Additional files"
          message="Upload documentation from the sequencing provider here. Do NOT upload raw sequence files. Do not click 'Done' when finished, it will cancel your upload instead."
        >
          <Uploader ref="additionalUploader" />
        </b-field>
        <CollapsibleUploaderHelp />

        <hr />

        <!-- ENA Submission Options -->
        <div v-if="selectedGroup && selectedGroup.sendToEna">
          <b-field>
            <b-checkbox v-model="project.doNotSendToEna">
              Request that this project is NOT sent to ENA
            </b-checkbox>
          </b-field>

          <b-field
            v-if="project.doNotSendToEna"
            :type="{ 'is-danger': validationErrors.enaReason }"
            :message="validationErrors.enaReason"
            class="mt-4"
          >
            <b-input
              v-model.trim="project.doNotSendToEnaReason"
              type="textarea"
              minlength="50"
              placeholder="Provide a clear reason why this project should be exempt from ENA submission..."
              required
            ></b-input>
          </b-field>
          <hr />
        </div>

        <!-- Validation Summary -->
        <div
          v-if="!canSubmit && formIsDirty"
          class="box has-background-warning-light"
        >
          <p class="title is-6 has-text-warning-dark">
            Submission Requirements
          </p>
          <ul>
            <li v-for="(error, key) in validationErrors" :key="key">
              <b-icon
                icon="alert-circle"
                type="is-danger"
                size="is-small"
              ></b-icon>
              {{ error }}
            </li>
            <li v-if="!uploadsAreComplete">
              <b-icon
                icon="alert-circle"
                type="is-danger"
                size="is-small"
              ></b-icon>
              All file uploads must be complete or cancelled.
            </li>
            <li v-if="!consent">
              <b-icon
                icon="alert-circle"
                type="is-danger"
                size="is-small"
              ></b-icon>
              You must consent to the terms before submitting.
            </li>
          </ul>
        </div>

        <!-- Consent & Submission -->
        <FormConsentCheckbox v-model="consent" />
        <hr />
        <b-button
          type="submit"
          native-type="submit"
          class="is-success"
          :loading="isSubmitting"
          :disabled="!canSubmit"
        >
          Create Project
        </b-button>
      </form>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import Uploader from "~/components/uploads/Uploader.vue";
import FormConsentCheckbox from "~/components/formHelpers/FormConsentCheckbox.vue";
import CollapsibleUploaderHelp from "~/components/formHelpers/CollapsibleUploaderHelp.vue";

export default {
  name: "NewProject",
  components: { Uploader, FormConsentCheckbox, CollapsibleUploaderHelp },
  middleware: "auth",

  async asyncData({ $axios, error }) {
    try {
      const response = await $axios.get("/projects/names");
      return { existingProjectNames: response.data.projectNames || [] };
    } catch (err) {
      console.error("Failed to fetch existing project names:", err);
      error({
        statusCode: 500,
        message: "Could not load initial data. Please try again later.",
      });
      return { existingProjectNames: [] };
    }
  },

  async fetch({ store }) {
    if (store.state.groups.length === 0) {
      await store.dispatch("refreshGroups");
    }
  },

  data() {
    return {
      project: {
        name: "",
        group: "",
        shortDesc: "",
        longDesc: "",
        doNotSendToEna: false,
        doNotSendToEnaReason: "",
      },
      consent: false,
      isSubmitting: false,
      formIsDirty: false, // Tracks if user has interacted with the form
      existingProjectNames: [], // Fallback if asyncData doesn't provide it
      bad: {
        nameList: [], // Stores existing project names for validation
      },
    };
  },

  computed: {
    ...mapState(["groups"]),

    // --- Form Field Messages ---
    nameMessage() {
      return "A short, memorable name for your project (20-80 characters).";
    },
    shortDescMessage() {
      return "A one-sentence description of the study (20-200 characters).";
    },
    longDescMessage() {
      return "An abstract for the study, suitable for public archives like ENA (100-1000 characters).";
    },

    // --- Data Sources & Selections ---
    availableGroups() {
      const groups = this.$store.state.groups;
      if (!groups || !Array.isArray(groups)) {
        console.error("Groups not loaded or not an array", {
          groups,
          storeState: this.$store.state,
          errorContext: "availableGroups computed property",
        });
        return [];
      }
      const availableGroupsResult = groups.filter((f) => !f.deleted);
      return availableGroupsResult;
    },
    areMultipleAvailableGroups() {
      return this.availableGroups.length > 1;
    },
    onlyOneGroup() {
      return this.availableGroups.length === 1;
    },
    selectedGroup() {
      if (!this.project.group) return null;
      return this.availableGroups.find((g) => g._id === this.project.group);
    },
    uploadsAreComplete() {
      if (
        this.$refs.additionalUploader &&
        typeof this.$refs.additionalUploader.isUploadComplete === "function"
      ) {
        return this.$refs.additionalUploader.isUploadComplete();
      }
      return true; // Assume complete if uploader isn't mounted or method not available
    },

    // --- Validation Logic ---
    validationErrors() {
      const errors = {};

      // Name validation
      if (!this.project.name) errors.name = "Project name is required.";
      else if (this.project.name.length < 20 || this.project.name.length > 80)
        errors.name = "Name must be between 20 and 80 characters.";
      else if (
        this.existingProjectNames &&
        this.existingProjectNames.includes(this.project.name)
      )
        errors.name = "This project name is already in use.";

      // Group validation
      if (!this.project.group) errors.group = "A group must be selected.";

      // Description validation
      if (!this.project.shortDesc)
        errors.shortDesc = "Short description is required.";
      else if (
        this.project.shortDesc.length < 20 ||
        this.project.shortDesc.length > 200
      )
        errors.shortDesc =
          "Short description must be between 20 and 200 characters.";

      if (!this.project.longDesc)
        errors.longDesc = "Long description is required.";
      else if (
        this.project.longDesc.length < 100 ||
        this.project.longDesc.length > 1000
      )
        errors.longDesc =
          "Long description must be between 100 and 1000 characters.";

      // ENA reason validation
      if (
        this.project.doNotSendToEna &&
        (!this.project.doNotSendToEnaReason ||
          this.project.doNotSendToEnaReason.length < 50)
      )
        errors.enaReason =
          "A reason for not sending to ENA (min 50 chars) is required.";

      return errors;
    },

    canSubmit() {
      if (this.isSubmitting) return false;
      return (
        Object.keys(this.validationErrors).length === 0 &&
        this.consent &&
        this.uploadsAreComplete
      );
    },
  },

  watch: {
    // Auto-select group if only one is available
    availableGroups: {
      handler(newGroups) {
        if (newGroups.length === 1 && !this.project.group) {
          this.project.group = newGroups[0]._id;
        }
      },
      immediate: true,
    },
    // Watch any project property to mark the form as "dirty"
    "project.name": function () {
      this.formIsDirty = true;
    },
    "project.group": function () {
      this.formIsDirty = true;
    },
    "project.shortDesc": function () {
      this.formIsDirty = true;
    },
    "project.longDesc": function () {
      this.formIsDirty = true;
    },
    consent: function () {
      this.formIsDirty = true;
    },
  },

  mounted() {
    // Initialize bad.nameList with existing project names
    this.bad.nameList = this.existingProjectNames || [];
  },

  methods: {
    async submitForm() {
      if (!this.canSubmit) {
        this.formIsDirty = true; // Show validation errors if trying to submit an invalid form
        this.$buefy.toast.open({
          message: "Please correct the errors before submitting.",
          type: "is-warning",
          position: "is-bottom",
        });
        return;
      }
      this.isSubmitting = true;

      const additionalFiles = this.$refs.additionalUploader?.getFiles() || [];
      const payload = {
        ...this.project,
        additionalFiles,
        owner: this.$auth.user.username,
      };

      try {
        const response = await this.$axios.post("/projects/new", payload);
        this.$buefy.toast.open({
          message: "Project created successfully!",
          type: "is-success",
          duration: 3000,
        });
        // Redirect to the newly created project page
        this.$router.push({
          name: "project",
          query: { id: response.data.project._id },
        });
      } catch (err) {
        console.error("Error creating project:", err);
        const errorMessage =
          err.response?.data?.error ||
          "An unexpected error occurred. Please check the details and try again.";

        this.$buefy.dialog.alert({
          title: "Submission Failed",
          message: errorMessage,
          type: "is-danger",
          hasIcon: true,
          icon: "alert-circle-outline",
          ariaRole: "alertdialog",
          ariaModal: true,
        });
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style scoped>
/* Scoped styles can go here if needed */
</style>
