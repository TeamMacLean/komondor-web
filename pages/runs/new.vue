<template>
  <div class="section">
    <div class="container">
      <h1 class="title">New Run for {{ sample.name }}</h1>
      <h2 class="subtitle">
        Define the sequencing parameters and provide the raw read files for this
        run.
      </h2>
      <hr />

      <form @submit.prevent="submitForm">
        <!-- Run Metadata -->
        <div class="columns">
          <div class="column">
            <b-field
              label="Run Name*"
              :type="{ 'is-danger': validationErrors.name }"
              :message="validationErrors.name"
            >
              <b-input v-model.trim="run.name" required></b-input>
            </b-field>
          </div>
          <div class="column">
            <b-field
              label="Sequencing Provider*"
              :type="{ 'is-danger': validationErrors.sequencingProvider }"
              :message="validationErrors.sequencingProvider"
            >
              <b-input
                v-model.trim="run.sequencingProvider"
                placeholder="e.g., 'Novogene', 'Earlham Institute'"
                required
              ></b-input>
            </b-field>
          </div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field
              label="Library Type*"
              :type="{ 'is-danger': validationErrors.libraryType }"
              :message="validationErrors.libraryType"
            >
              <b-select v-model="run.libraryType" expanded required>
                <option :value="null" disabled>Select a library type</option>
                <option
                  v-for="opt in libraryTypes"
                  :key="opt._id"
                  :value="opt.value"
                >
                  {{ opt.value }}
                </option>
              </b-select>
            </b-field>
          </div>
          <div class="column">
            <b-field
              label="Sequencing Technology*"
              :type="{ 'is-danger': validationErrors.sequencingTechnology }"
              :message="validationErrors.sequencingTechnology"
            >
              <b-select v-model="run.sequencingTechnology" expanded required>
                <option :value="null" disabled>Select a technology</option>
                <option
                  v-for="opt in sequencingTechnologies"
                  :key="opt._id"
                  :value="opt.value"
                >
                  {{ opt.value }}
                </option>
              </b-select>
            </b-field>
          </div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field
              label="Library Source*"
              :type="{ 'is-danger': validationErrors.librarySource }"
              :message="validationErrors.librarySource"
            >
              <b-select v-model="run.librarySource" expanded required>
                <option :value="null" disabled>Select a source</option>
                <option
                  v-for="opt in librarySources"
                  :key="opt._id"
                  :value="opt.value"
                >
                  {{ opt.value }}
                </option>
              </b-select>
            </b-field>
          </div>
          <div class="column">
            <b-field
              label="Library Selection*"
              :type="{ 'is-danger': validationErrors.librarySelection }"
              :message="validationErrors.librarySelection"
            >
              <b-select v-model="run.librarySelection" expanded required>
                <option :value="null" disabled>
                  Select a selection method
                </option>
                <option
                  v-for="opt in librarySelections"
                  :key="opt._id"
                  :value="opt.value"
                >
                  {{ opt.value }}
                </option>
              </b-select>
            </b-field>
          </div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field
              label="Library Strategy*"
              :type="{ 'is-danger': validationErrors.libraryStrategy }"
              :message="validationErrors.libraryStrategy"
            >
              <b-select v-model="run.libraryStrategy" expanded required>
                <option :value="null" disabled>Select a strategy</option>
                <option
                  v-for="opt in libraryStrategies"
                  :key="opt._id"
                  :value="opt.value"
                >
                  {{ opt.value }}
                </option>
              </b-select>
            </b-field>
          </div>
          <div class="column">
            <b-field
              label="Insert Size"
              message="The insert size of the library, if applicable."
            >
              <b-input v-model="run.insertSize" type="number"></b-input>
            </b-field>
          </div>
        </div>

        <hr />

        <!-- Raw Read Files -->
        <h3 class="title is-4">Raw Read Files*</h3>
        <p class="subtitle is-6">
          You must provide the raw sequence files for this run.
        </p>
        <b-tabs v-model="activeTab" type="is-boxed">
          <b-tab-item label="HPC Transfer" value="hpc-mv">
            <HpcFileValidator
              v-model="hpcValidatedFiles"
              :sample-id="sample._id"
            />
          </b-tab-item>

          <b-tab-item
            label="Local Filesystem Upload"
            value="local-filesystem"
            :disabled="isLocalFilesystemDisabled"
          >
            <Uploader
              ref="rawUploader"
              :paired="libraryTypeObject && libraryTypeObject.paired"
              :indexed="libraryTypeObject && libraryTypeObject.indexed"
              :allowed-extensions="
                libraryTypeObject && libraryTypeObject.extensions
              "
            />
          </b-tab-item>
        </b-tabs>

        <hr />

        <!-- Additional Files -->
        <h3 class="title is-4">Additional Files</h3>
        <p class="subtitle is-6">
          Optionally, upload any documentation specific to this run.
        </p>
        <Uploader ref="additionalUploader" />
        <CollapsibleUploaderHelp />

        <hr />

        <!-- Submission Area -->
        <FormConsentCheckbox v-model="consent" />
        <hr />
        <b-button
          type="submit"
          native-type="submit"
          class="is-success"
          :loading="isSubmitting"
          :disabled="!canSubmit"
        >
          Create Run
        </b-button>
      </form>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import Uploader from "~/components/uploads/Uploader.vue";
import HpcFileValidator from "~/components/uploads/HpcFileValidator.vue";
import FormConsentCheckbox from "~/components/formHelpers/FormConsentCheckbox.vue";
import CollapsibleUploaderHelp from "~/components/formHelpers/CollapsibleUploaderHelp.vue";

export default {
  name: "NewRun",
  components: {
    Uploader,
    HpcFileValidator,
    FormConsentCheckbox,
    CollapsibleUploaderHelp,
  },
  middleware: "auth",

  async asyncData({ $axios, params, error, route }) {
    try {
      const sampleResponse = await $axios.get("/sample", {
        params: { id: params.id || route.query.sampleId },
      });
      const namesResponse = await $axios.get(
        `/runs/names/${sampleResponse.data.sample._id}`
      );
      return {
        sample: sampleResponse.data.sample,
        existingRunNames: namesResponse.data.runNames || [],
      };
    } catch (err) {
      console.error("Failed to load initial data for new run page:", err);
      return error({
        statusCode: 404,
        message: "Parent sample not found or API error.",
      });
    }
  },

  data() {
    return {
      run: {
        name: "",
        sequencingProvider: "",
        libraryType: null,
        sequencingTechnology: null,
        librarySource: null,
        librarySelection: null,
        libraryStrategy: null,
        insertSize: null,
      },
      activeTab: "hpc-mv", // 'hpc-mv' or 'local-filesystem'
      hpcValidatedFiles: [], // From HpcFileValidator component
      consent: false,
      isSubmitting: false,
    };
  },

  async created() {
    await this.$store.dispatch("refreshOptions");
    if (this.$route.query.clonedRunId) {
      await this.initializeFromClonedRun(this.$route.query.clonedRunId);
    }
  },

  computed: {
    ...mapState([
      "libraryTypes",
      "sequencingTechnologies",
      "librarySources",
      "librarySelections",
      "libraryStrategies",
    ]),

    libraryTypeObject() {
      if (!this.run.libraryType) return null;
      return this.libraryTypes.find((lt) => lt.value === this.run.libraryType);
    },

    isLocalFilesystemDisabled() {
      return this.libraryTypeObject?.indexed || false;
    },

    uploadsAreComplete() {
      const additionalComplete =
        this.$refs.additionalUploader?.isUploadComplete() ?? true;

      let rawComplete = false;
      if (this.activeTab === "hpc-mv") {
        rawComplete =
          this.hpcValidatedFiles && this.hpcValidatedFiles.length > 0;
      } else {
        rawComplete = this.$refs.rawUploader?.isUploadComplete() ?? false;
      }

      return additionalComplete && rawComplete;
    },

    validationErrors() {
      const errors = {};
      const { run } = this;

      if (!run.name) errors.name = "Run name is required.";
      else if (run.name.length < 3 || run.name.length > 80)
        errors.name = "Name must be between 3 and 80 characters.";
      else if (this.existingRunNames.includes(run.name))
        errors.name = "This run name is already in use for this sample.";

      if (!run.sequencingProvider)
        errors.sequencingProvider = "Sequencing provider is required.";
      if (!run.libraryType) errors.libraryType = "Library type is required.";
      if (!run.sequencingTechnology)
        errors.sequencingTechnology = "Sequencing technology is required.";
      if (!run.librarySource)
        errors.librarySource = "Library source is required.";
      if (!run.librarySelection)
        errors.librarySelection = "Library selection is required.";
      if (!run.libraryStrategy)
        errors.libraryStrategy = "Library strategy is required.";

      // Raw files validation
      if (this.activeTab === "hpc-mv" && this.hpcValidatedFiles.length === 0) {
        errors.rawFiles = "HPC files must be selected and validated.";
      } else if (this.activeTab === "local-filesystem") {
        const rawUploader = this.$refs.rawUploader;
        if (!rawUploader || rawUploader.getFiles().length === 0) {
          errors.rawFiles = "At least one raw read file must be uploaded.";
        }
      }

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

  methods: {
    async initializeFromClonedRun(clonedRunId) {
      try {
        const { data } = await this.$axios.get("/run", {
          params: { id: clonedRunId },
        });
        const clonedRun = data.run;
        if (clonedRun) {
          this.run.name = `${clonedRun.name || ""}_clone`;
          this.run.sequencingProvider = clonedRun.sequencingProvider || "";
          this.run.libraryType = clonedRun.libraryType || null;
          this.run.sequencingTechnology =
            clonedRun.sequencingTechnology || null;
          this.run.librarySource = clonedRun.librarySource || null;
          this.run.librarySelection = clonedRun.librarySelection || null;
          this.run.libraryStrategy = clonedRun.libraryStrategy || null;
          this.run.insertSize = clonedRun.insertSize || null;
          this.$buefy.toast.open({
            message: "Form pre-filled from cloned run.",
            type: "is-info",
          });
        }
      } catch (err) {
        console.error("Error fetching cloned run:", err);
        this.$buefy.toast.open({
          message: "Could not fetch data for cloning.",
          type: "is-warning",
        });
      }
    },

    async submitForm() {
      if (!this.canSubmit) {
        this.$buefy.toast.open({
          message: "Please correct the errors before submitting.",
          type: "is-warning",
        });
        return;
      }
      this.isSubmitting = true;

      let rawFilesPayload = [];
      let rawFilesUploadInfo = { method: this.activeTab };

      if (this.activeTab === "hpc-mv") {
        rawFilesPayload = this.hpcValidatedFiles;
        // relativePath might be part of hpcValidatedFiles, assuming it's structured correctly
        rawFilesUploadInfo.relativePath =
          this.hpcValidatedFiles[0]?.relativePath;
      } else {
        rawFilesPayload = this.$refs.rawUploader.getFiles();
      }

      const payload = {
        ...this.run,
        sample: this.sample._id,
        group: this.sample.project.group,
        owner: this.$auth.user.username,
        additionalFiles: this.$refs.additionalUploader?.getFiles() || [],
        rawFiles: rawFilesPayload,
        rawFilesUploadInfo,
      };

      try {
        const response = await this.$axios.post("/runs/new", payload);
        this.$buefy.toast.open({
          message: "Run created successfully!",
          type: "is-success",
        });
        this.$router.push({
          name: "run",
          query: { id: response.data.run._id },
        });
      } catch (err) {
        console.error("Error creating run:", err);
        this.$buefy.dialog.alert({
          title: "Submission Failed",
          message: err.response?.data?.error || "An unexpected error occurred.",
          type: "is-danger",
        });
      } finally {
        this.isSubmitting = false;
      }
    },
  },

  watch: {
    "run.libraryType"(newValue, oldValue) {
      if (newValue !== oldValue) {
        // Reset raw uploader if library type changes, as constraints might change
        if (this.$refs.rawUploader) {
          this.$refs.rawUploader.clear();
        }
        // If the new type forces HPC, switch to it
        if (this.isLocalFilesystemDisabled) {
          this.activeTab = "hpc-mv";
        }
      }
    },
  },
};
</script>

<style scoped>
/* Add any specific styles for this page here */
</style>
