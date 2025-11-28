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
              <b-select
                v-model="run.libraryType"
                expanded
                required
                :disabled="hasFilesSelected"
              >
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
            <p class="help has-text-danger" v-if="hasFilesSelected">
              <b-icon icon="lock" size="is-small"></b-icon>
              To change library type, click "Start Over" in the file selection
              section below.
            </p>
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

        <!-- STEP 1: SELECT FILES -->
        <section class="mb-6">
          <h3 class="title is-4">
            <span class="tag is-info is-medium mr-2">Step 1</span>
            Select Files*
          </h3>
          <p class="subtitle is-6 mb-4">
            Choose how you want to provide the raw sequence files for this run.
          </p>

          <!-- Upload Method Selection -->
          <div class="field mb-4">
            <b-radio
              v-model="uploadMethod"
              native-value="hpc-mv"
              :disabled="hasFilesSelected"
              @input="onUploadMethodChange"
            >
              <strong>HPC Transfer</strong>
              <span class="has-text-grey ml-2"
                >- Select files from the HPC transfer area</span
              >
            </b-radio>
          </div>
          <div class="field mb-4">
            <b-radio
              v-model="uploadMethod"
              native-value="local-filesystem"
              :disabled="hasFilesSelected"
              @input="onUploadMethodChange"
            >
              <strong>Local Filesystem Upload</strong>
              <span class="has-text-grey ml-2"
                >- Upload files from your computer</span
              >
            </b-radio>
          </div>

          <!-- HPC Directory Finder -->
          <div v-if="uploadMethod === 'hpc-mv'" class="box">
            <HpcDirectoryFinder
              ref="hpcFinder"
              :sample-id="sample._id"
              :allowed-extensions="
                libraryTypeObject && libraryTypeObject.extensions
              "
              :paired="libraryTypeObject && libraryTypeObject.paired"
              :indexed="libraryTypeObject && libraryTypeObject.indexed"
              :disabled="!run.libraryType"
              @files-found="handleHpcFilesFound"
            />
          </div>

          <!-- Local Filesystem Upload -->
          <div v-if="uploadMethod === 'local-filesystem'" class="box">
            <Uploader
              ref="rawUploader"
              :paired="libraryTypeObject && libraryTypeObject.paired"
              :indexed="libraryTypeObject && libraryTypeObject.indexed"
              :allowed-extensions="
                libraryTypeObject && libraryTypeObject.extensions
              "
              :disabled="!run.libraryType"
              @confirm="handleLocalFilesConfirmed"
              @restart="handleLocalUploadRestart"
            />
          </div>
        </section>

        <!-- STEP 2: PROCESS FILES -->
        <section v-if="hasFilesToProcess" class="mb-6">
          <h3 class="title is-4">
            <span class="tag is-info is-medium mr-2">Step 2</span>
            Process Files
          </h3>
          <p class="subtitle is-6 mb-4">
            <span v-if="uploadMethod === 'hpc-mv'">
              Select the files you want to include and enter MD5 checksums for
              validation.
            </span>
            <span v-else>
              Enter MD5 checksums for your uploaded files to verify integrity.
            </span>
          </p>

          <div class="box">
            <FileProcessor
              ref="fileProcessor"
              v-model="processedFiles"
              :files="filesToProcess"
              :source="uploadMethod"
              :paired="libraryTypeObject && libraryTypeObject.paired"
              :indexed="libraryTypeObject && libraryTypeObject.indexed"
              :directory-name="hpcDirectoryName"
            />
          </div>
        </section>

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
import { CHECKSUM_EXTENSIONS } from "~/utils/constants";
import Uploader from "~/components/uploads/Uploader.vue";
import HpcDirectoryFinder from "~/components/uploads/HpcDirectoryFinder.vue";
import FileProcessor from "~/components/uploads/FileProcessor.vue";
import FormConsentCheckbox from "~/components/formHelpers/FormConsentCheckbox.vue";
import CollapsibleUploaderHelp from "~/components/formHelpers/CollapsibleUploaderHelp.vue";

export default {
  name: "NewRun",
  components: {
    Uploader,
    HpcDirectoryFinder,
    FileProcessor,
    FormConsentCheckbox,
    CollapsibleUploaderHelp,
  },
  middleware: "auth",
  watchQuery: ["sample"],

  async asyncData({ $axios, params, error, route }) {
    try {
      const sampleId = route.query.sample;

      if (!sampleId) {
        return error({
          statusCode: 400,
          message: "Sample ID is required. Please navigate from a sample page.",
        });
      }

      const sampleResponse = await $axios.get("/sample", {
        params: { id: sampleId },
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
        statusCode: err.response?.status || 500,
        message:
          err.response?.data?.message || "Sample not found or API error.",
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
      // Upload method selection
      uploadMethod: "hpc-mv",
      pendingUploadMethod: null, // For confirmation modal
      // HPC files
      hpcDiscoveredFiles: [],
      hpcDirectoryName: "",
      // Local files
      localUploadedFiles: [],
      localFilesConfirmed: false,
      // Processed files (output from FileProcessor)
      processedFiles: [],
      // Form state
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
      // No restrictions - local filesystem upload works for all library types
      return false;
    },

    // Check if any files are currently selected/discovered
    hasFilesSelected() {
      return (
        this.hpcDiscoveredFiles.length > 0 ||
        this.localFilesConfirmed ||
        this.processedFiles.length > 0
      );
    },

    // Files to pass to FileProcessor
    filesToProcess() {
      if (this.uploadMethod === "hpc-mv") {
        return this.hpcDiscoveredFiles;
      } else {
        return this.localFilesConfirmed ? this.localUploadedFiles : [];
      }
    },

    hasFilesToProcess() {
      return this.filesToProcess.length > 0;
    },

    uploadsAreComplete() {
      // Additional files uploader
      const additionalComplete = true; // Additional files are optional

      // Raw files must be processed
      if (this.processedFiles.length === 0) return false;

      return additionalComplete;
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
      if (this.processedFiles.length === 0) {
        errors.rawFiles =
          "Raw files must be selected, have MD5 checksums validated, and be processed.";
      } else {
        // Validate file count
        const fileCountValidation = this.validateRawFileCount(
          this.processedFiles
        );
        if (!fileCountValidation.valid) {
          errors.rawFiles = fileCountValidation.message;
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
          message: "Failed to load cloned run data.",
          type: "is-danger",
        });
      }
    },

    isChecksumFile(fileName) {
      const lowerFileName = fileName.toLowerCase();
      return CHECKSUM_EXTENSIONS.some((ext) => lowerFileName.endsWith(ext));
    },

    getFileName(file) {
      return file.name || file.data?.name || "";
    },

    validateRawFileCount(files) {
      const nonChecksumFiles = files.filter(
        (file) => !this.isChecksumFile(this.getFileName(file))
      );
      const count = nonChecksumFiles.length;

      if (!this.libraryTypeObject) {
        return { valid: true, message: "" };
      }

      const paired = this.libraryTypeObject.paired || false;

      if (paired) {
        if (count < 2) {
          return {
            valid: false,
            message: `Paired library requires at least 2 files. Found ${count}.`,
          };
        }
      } else {
        if (count < 1) {
          return {
            valid: false,
            message: `At least 1 file is required. Found ${count}.`,
          };
        }
      }

      return { valid: true, message: "" };
    },

    clearAllFiles() {
      this.hpcDiscoveredFiles = [];
      this.hpcDirectoryName = "";
      this.localUploadedFiles = [];
      this.localFilesConfirmed = false;
      this.processedFiles = [];

      // Clear component refs
      if (this.$refs.hpcFinder) {
        this.$refs.hpcFinder.clear();
      }
      if (this.$refs.rawUploader) {
        this.$refs.rawUploader.clear();
      }
    },

    // Handle upload method change with confirmation
    onUploadMethodChange(newMethod) {
      if (this.hasFilesSelected && newMethod !== this.uploadMethod) {
        // Store the pending method and show confirmation
        this.pendingUploadMethod = newMethod;
        this.$buefy.dialog.confirm({
          title: "Switch Upload Method?",
          message:
            "Switching upload methods will remove all selected files and you will have to start over. Are you sure?",
          confirmText: "Yes, Switch",
          cancelText: "Cancel",
          type: "is-warning",
          onConfirm: () => {
            this.clearAllFiles();
            this.uploadMethod = this.pendingUploadMethod;
            this.pendingUploadMethod = null;
          },
          onCancel: () => {
            // Revert to previous method
            this.pendingUploadMethod = null;
          },
        });
      }
    },

    // Handle library type change with confirmation
    onLibraryTypeChange(newValue) {
      const oldValue = this.run.libraryType;

      if (this.hasFilesSelected && newValue !== oldValue) {
        this.$buefy.dialog.confirm({
          title: "Change Library Type?",
          message:
            "Changing the library type will clear all selected files and you will have to start over. Are you sure?",
          confirmText: "Yes, Change",
          cancelText: "Cancel",
          type: "is-warning",
          onConfirm: () => {
            this.clearAllFiles();
            this.run.libraryType = newValue;
          },
          onCancel: () => {
            // Revert
            this.$nextTick(() => {
              this.run.libraryType = oldValue;
            });
          },
        });
      }
    },

    // Handle HPC files found
    handleHpcFilesFound(files, directoryName) {
      this.hpcDiscoveredFiles = files;
      this.hpcDirectoryName = directoryName;
      this.processedFiles = [];
    },

    // Handle local files confirmed
    handleLocalFilesConfirmed(files) {
      this.localUploadedFiles = files;
      this.localFilesConfirmed = true;
      this.processedFiles = [];
    },

    // Handle local upload restart
    handleLocalUploadRestart() {
      this.localUploadedFiles = [];
      this.localFilesConfirmed = false;
      this.processedFiles = [];
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

      let rawFilesPayload = this.processedFiles;
      let rawFilesUploadInfo = { method: this.uploadMethod };

      if (this.uploadMethod === "hpc-mv") {
        rawFilesUploadInfo.relativePath = this.hpcDirectoryName;
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
          message: "Run creation started! MD5 validation is in progress.",
          type: "is-success",
          duration: 5000,
        });
        this.$router.push({
          name: "run",
          query: { id: response.data.run._id },
        });
      } catch (err) {
        console.error("Error creating run:", err);
        const errorData = err.response?.data;
        let errorMessage = errorData?.error || "An unexpected error occurred.";

        if (errorData?.requestId) {
          errorMessage += `<br><br><small>Reference ID: ${errorData.requestId}</small>`;
        }

        this.$buefy.dialog.alert({
          title: "Submission Failed",
          message: errorMessage,
          type: "is-danger",
        });
      } finally {
        this.isSubmitting = false;
      }
    },
  },

  watch: {},
};
</script>

<style scoped>
.mb-6 {
  margin-bottom: 2rem;
}
</style>
