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
              :allowed-extensions="
                libraryTypeObject && libraryTypeObject.extensions
              "
              :paired="libraryTypeObject && libraryTypeObject.paired"
              :indexed="libraryTypeObject && libraryTypeObject.indexed"
              :disabled="!run.libraryType"
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
              @files-changed="resetMd5Validation"
            />
            <div class="box mt-4" v-if="rawFilesForLocalUpload.length">
              <h4 class="title is-5">MD5 Checksum Validation</h4>
              <p class="mb-4">
                Enter the expected MD5 checksum for each non-checksum file, then
                validate. This ensures file integrity during upload.
              </p>

              <!-- MD5 input for each file -->
              <div
                v-for="file in nonChecksumLocalFiles"
                :key="file.data.name"
                class="box mb-3"
              >
                <p class="has-text-weight-medium mb-2">{{ file.data.name }}</p>
                <b-field
                  :type="getLocalMd5FieldType(file.data.name)"
                  :message="getLocalMd5FieldMessage(file.data.name)"
                >
                  <b-input
                    v-model="localFileMd5Inputs[file.data.name]"
                    placeholder="Enter expected MD5 checksum (32 hex characters)"
                    :disabled="isHashing"
                    @input="onLocalMd5Input(file.data.name)"
                  ></b-input>
                </b-field>

                <!-- Validation status -->
                <div
                  v-if="fileStatuses.find((s) => s.name === file.data.name)"
                  class="mt-2"
                >
                  <span :class="getLocalStatusClass(file.data.name)">
                    <b-icon
                      :icon="
                        fileStatuses.find((s) => s.name === file.data.name)
                          .statusIcon
                      "
                      size="is-small"
                    ></b-icon>
                    {{
                      fileStatuses.find((s) => s.name === file.data.name).status
                    }}
                    <strong
                      v-if="
                        fileStatuses.find((s) => s.name === file.data.name)
                          .calculatedMd5
                      "
                      class="is-family-monospace ml-2"
                    >
                      Calculated:
                      {{
                        fileStatuses.find((s) => s.name === file.data.name)
                          .calculatedMd5
                      }}
                    </strong>
                  </span>
                </div>
              </div>

              <!-- Checksum files (no MD5 required) -->
              <div
                v-for="file in checksumLocalFiles"
                :key="file.data.name"
                class="box mb-3"
                style="background-color: #f5f5f5"
              >
                <p class="has-text-weight-medium">
                  {{ file.data.name }}
                  <span class="tag is-light is-small ml-2"
                    >checksum file - no validation required</span
                  >
                </p>
              </div>

              <div class="mt-4">
                <b-button
                  @click="validateMd5s"
                  :loading="isHashing"
                  :disabled="!canStartLocalValidation"
                  type="is-info"
                >
                  Validate MD5 Checksums
                </b-button>
                <p
                  v-if="
                    !canStartLocalValidation && nonChecksumLocalFiles.length > 0
                  "
                  class="help is-danger mt-2"
                >
                  Please enter a valid MD5 checksum for all files before
                  validating.
                </p>
              </div>

              <!-- Validation progress -->
              <div v-if="isHashing" class="mt-4">
                <p class="has-text-weight-semibold mb-2">
                  Validating checksums... ({{ validationProgressLocal }}/{{
                    nonChecksumLocalFiles.length
                  }})
                </p>
                <progress
                  class="progress is-primary"
                  :value="validationProgressLocal"
                  :max="nonChecksumLocalFiles.length"
                ></progress>
              </div>
            </div>
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
import SparkMD5 from "spark-md5";
import { CHECKSUM_EXTENSIONS } from "~/utils/constants";
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
  watchQuery: ["sample"],

  async asyncData({ $axios, params, error, route }) {
    try {
      // Get sampleId from query params (not route params for this page)
      const sampleId = route.query.sample;

      console.log("=== NEW RUN PAGE asyncData ===");
      console.log("params:", JSON.stringify(params));
      console.log("route.query:", JSON.stringify(route.query));
      console.log("route.path:", route.path);
      console.log("sampleId extracted:", sampleId);
      console.log("==============================");

      if (!sampleId) {
        console.error("ERROR: No sampleId in query parameters");
        return error({
          statusCode: 400,
          message: "Sample ID is required. Please navigate from a sample page.",
        });
      }

      console.log("Fetching sample with ID:", sampleId);
      const sampleResponse = await $axios.get("/sample", {
        params: { id: sampleId },
      });

      console.log(
        "Sample fetched successfully:",
        sampleResponse.data.sample.name
      );

      const namesResponse = await $axios.get(
        `/runs/names/${sampleResponse.data.sample._id}`
      );

      console.log("Run names fetched successfully");

      return {
        sample: sampleResponse.data.sample,
        existingRunNames: namesResponse.data.runNames || [],
      };
    } catch (err) {
      console.error("Failed to load initial data for new run page:", err);
      console.error("Error details:", err.response?.data || err.message);
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
      activeTab: "hpc-mv",
      hpcValidatedFiles: [],
      consent: false,
      isSubmitting: false,
      // MD5 Validation State
      isHashing: false,
      md5ValidationComplete: false,
      fileStatuses: [], // { name, status, md5, statusIcon, statusType, calculatedMd5 }
      localFileMd5Inputs: {}, // { fileName: 'user entered md5' }
      validationProgressLocal: 0,
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

    rawFilesForLocalUpload() {
      return this.$refs.rawUploader?.getFiles() || [];
    },

    nonChecksumLocalFiles() {
      return this.rawFilesForLocalUpload.filter(
        (f) => !this.isChecksumFile(f.data.name)
      );
    },

    checksumLocalFiles() {
      return this.rawFilesForLocalUpload.filter((f) =>
        this.isChecksumFile(f.data.name)
      );
    },

    canStartLocalValidation() {
      if (this.nonChecksumLocalFiles.length === 0) return false;
      if (this.isHashing) return false;

      // All non-checksum files must have valid MD5 format
      const md5Regex = /^[a-fA-F0-9]{32}$/;
      return this.nonChecksumLocalFiles.every((file) => {
        const md5 = this.localFileMd5Inputs[file.data.name];
        return md5 && md5Regex.test(md5.trim());
      });
    },

    allLocalChecksumsValidated() {
      if (this.nonChecksumLocalFiles.length === 0) return false;

      // All non-checksum files must have 'valid' status
      return this.nonChecksumLocalFiles.every((file) => {
        const status = this.fileStatuses.find((s) => s.name === file.data.name);
        return status && status.status === "Verified";
      });
    },

    libraryTypeObject() {
      if (!this.run.libraryType) return null;
      return this.libraryTypes.find((lt) => lt.value === this.run.libraryType);
    },

    isLocalFilesystemDisabled() {
      return this.libraryTypeObject?.indexed || false;
    },

    uploadsAreComplete() {
      const additionalComplete =
        this.$refs.additionalUploader &&
        typeof this.$refs.additionalUploader.isUploadComplete === "function"
          ? this.$refs.additionalUploader.isUploadComplete()
          : true;
      let rawComplete = false;
      if (this.activeTab === "hpc-mv") {
        rawComplete = true; // HPC uploads are handled pre-validation
      } else {
        rawComplete =
          this.$refs.rawUploader &&
          typeof this.$refs.rawUploader.isUploadComplete === "function"
            ? this.$refs.rawUploader.isUploadComplete()
            : true;
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
      if (this.activeTab === "hpc-mv") {
        if (this.hpcValidatedFiles.length === 0)
          errors.rawFiles = "HPC files must be selected and validated.";
        else {
          // Validate file count for HPC files
          const fileCountValidation = this.validateRawFileCount(
            this.hpcValidatedFiles
          );
          if (!fileCountValidation.valid) {
            errors.rawFiles = fileCountValidation.message;
          }
        }
      } else {
        if (this.rawFilesForLocalUpload.length === 0) {
          errors.rawFiles = "At least one raw read file must be uploaded.";
        } else if (!this.md5ValidationComplete) {
          errors.md5 = "You must validate the MD5 checksums of all raw files.";
        } else {
          // Validate file count for local uploads
          const fileCountValidation = this.validateRawFileCount(
            this.rawFilesForLocalUpload
          );
          if (!fileCountValidation.valid) {
            errors.rawFiles = fileCountValidation.message;
          }
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
    /**
     * Get filename from a file object, handling both HPC (file.name) and local (file.data.name) formats
     */
    getFileName(file) {
      return file.name || file.data?.name || "";
    },

    validateRawFileCount(files) {
      // Filter out checksum files for counting
      const nonChecksumFiles = files.filter(
        (file) => !this.isChecksumFile(this.getFileName(file))
      );
      const count = nonChecksumFiles.length;

      if (!this.libraryTypeObject) {
        return { valid: true, message: "" };
      }

      const paired = this.libraryTypeObject.paired || false;

      if (paired) {
        // At least 2 files
        if (count < 2) {
          return {
            valid: false,
            message: `Paired library requires at least 2 files (excluding checksum files). Found ${count}.`,
          };
        }
      } else {
        // At least 1 file
        if (count < 1) {
          return {
            valid: false,
            message: `At least 1 file is required (excluding checksum files). Found ${count}.`,
          };
        }
      }

      return { valid: true, message: "" };
    },
    resetMd5Validation() {
      this.md5ValidationComplete = false;
      this.fileStatuses = [];
      this.localFileMd5Inputs = {};
      this.validationProgressLocal = 0;
    },

    // Helper methods for local file MD5 validation UI
    isValidMd5Format(md5) {
      const md5Regex = /^[a-fA-F0-9]{32}$/;
      return md5 && md5Regex.test(md5.trim());
    },

    getLocalMd5FieldType(fileName) {
      const md5 = this.localFileMd5Inputs[fileName];
      if (!md5) return "";
      if (this.isValidMd5Format(md5)) return "is-success";
      return "is-danger";
    },

    getLocalMd5FieldMessage(fileName) {
      const md5 = this.localFileMd5Inputs[fileName];
      if (!md5) return "Required: 32 hexadecimal characters";
      if (this.isValidMd5Format(md5)) return "Valid MD5 format";
      return "Invalid format: MD5 must be exactly 32 hexadecimal characters (0-9, a-f)";
    },

    getLocalStatusClass(fileName) {
      const status = this.fileStatuses.find((s) => s.name === fileName);
      if (!status) return "";
      if (status.statusType === "is-success") return "has-text-success";
      if (status.statusType === "is-danger") return "has-text-danger";
      if (status.statusType === "is-primary") return "has-text-info";
      return "has-text-grey";
    },

    onLocalMd5Input(fileName) {
      // Clear validation status when MD5 input changes
      const index = this.fileStatuses.findIndex((s) => s.name === fileName);
      if (index !== -1) {
        this.fileStatuses.splice(index, 1);
      }
      this.md5ValidationComplete = false;
    },

    validateMd5s() {
      // Only validate non-checksum files
      const filesToValidate = this.nonChecksumLocalFiles;
      if (!filesToValidate.length) return;
      if (!this.canStartLocalValidation) return;

      this.isHashing = true;
      this.fileStatuses = [];
      this.validationProgressLocal = 0;

      const processFile = (index) => {
        if (index >= filesToValidate.length) {
          this.isHashing = false;
          this.md5ValidationComplete = this.allLocalChecksumsValidated;

          if (this.allLocalChecksumsValidated) {
            this.$buefy.toast.open({
              message: "All MD5 checksums verified successfully!",
              type: "is-success",
            });
          } else {
            this.$buefy.toast.open({
              message:
                "Some checksums failed verification. Please check and correct.",
              type: "is-danger",
            });
          }
          return;
        }

        const fileWrapper = filesToValidate[index];
        const file = fileWrapper.data;
        const expectedMd5 = this.localFileMd5Inputs[file.name]
          ?.trim()
          .toLowerCase();

        // Add status entry
        this.fileStatuses.push({
          name: file.name,
          status: "Calculating...",
          md5: expectedMd5,
          calculatedMd5: null,
          statusIcon: "sync",
          statusType: "is-primary",
        });

        const statusIndex = this.fileStatuses.length - 1;
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const spark = new SparkMD5.ArrayBuffer();
            spark.append(e.target.result);
            const calculatedMd5 = spark.end();

            const matches = calculatedMd5 === expectedMd5;

            this.fileStatuses[statusIndex].calculatedMd5 = calculatedMd5;
            if (matches) {
              this.fileStatuses[statusIndex].status = "Verified";
              this.fileStatuses[statusIndex].statusIcon = "check-circle";
              this.fileStatuses[statusIndex].statusType = "is-success";
            } else {
              this.fileStatuses[
                statusIndex
              ].status = `Mismatch! Expected: ${expectedMd5}`;
              this.fileStatuses[statusIndex].statusIcon = "close-circle";
              this.fileStatuses[statusIndex].statusType = "is-danger";
            }
          } catch (err) {
            this.fileStatuses[statusIndex].status =
              "Error calculating checksum";
            this.fileStatuses[statusIndex].statusIcon = "alert-circle";
            this.fileStatuses[statusIndex].statusType = "is-danger";
          }

          this.validationProgressLocal = index + 1;
          processFile(index + 1);
        };

        reader.onerror = () => {
          this.fileStatuses[statusIndex].status = "File Read Error";
          this.fileStatuses[statusIndex].statusIcon = "alert-circle";
          this.fileStatuses[statusIndex].statusType = "is-danger";
          this.validationProgressLocal = index + 1;
          processFile(index + 1);
        };

        reader.readAsArrayBuffer(file);
      };

      processFile(0);
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
        rawFilesUploadInfo.relativePath =
          this.hpcValidatedFiles[0]?.relativePath;
      } else {
        // For local uploads, filter out checksum files and enrich with verified MD5s
        const nonChecksumFiles = this.rawFilesForLocalUpload.filter(
          (f) => !this.isChecksumFile(f.data.name)
        );

        rawFilesPayload = nonChecksumFiles.map((file) => {
          const status = this.fileStatuses.find(
            (s) => s.name === file.data.name
          );
          // Use the calculated MD5 (which was verified against user input)
          return {
            ...file,
            md5: status ? status.calculatedMd5 : null,
          };
        });
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

        // Include request ID for easier debugging if available
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

  watch: {
    "run.libraryType"(newValue, oldValue) {
      if (newValue !== oldValue) {
        if (this.$refs.rawUploader) this.$refs.rawUploader.clear();
        this.resetMd5Validation();
        if (this.isLocalFilesystemDisabled) this.activeTab = "hpc-mv";
      }
    },
    activeTab() {
      this.resetMd5Validation();
    },
  },
};
</script>

<style scoped>
/* Scoped styles here */
</style>
