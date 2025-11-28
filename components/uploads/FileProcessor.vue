<template>
  <div>
    <h4 class="subtitle is-5 mb-3">
      <b-icon icon="file-document-multiple" size="is-small" class="mr-2"></b-icon>
      Files to Process
    </h4>
    <p class="mb-3 has-text-grey">
      <span v-if="source === 'hpc-mv'">
        Select the read files you want to include and enter the expected MD5 checksum for each.
      </span>
      <span v-else>
        Enter the expected MD5 checksum for each uploaded file.
      </span>
    </p>

    <!-- File list -->
    <div
      class="box"
      v-for="(file, index) in selectableFiles"
      :key="file.name"
    >
      <div class="columns is-vcentered is-mobile">
        <!-- Checkbox only for HPC -->
        <div v-if="source === 'hpc-mv'" class="column is-narrow">
          <b-checkbox
            v-model="selectedFileNames"
            :native-value="file.name"
            :disabled="validationComplete"
            @input="onFileSelectionChange(file.name, $event)"
          ></b-checkbox>
        </div>
        <div class="column">
          <p class="has-text-weight-medium">{{ file.name }}</p>
        </div>
      </div>

      <!-- MD5 input (show when file is selected) -->
      <div v-if="isFileSelected(file.name)" class="mt-2">
        <b-field
          :type="getMd5FieldType(file.name)"
          :message="getMd5FieldMessage(file.name)"
        >
          <b-input
            v-model="fileMd5Inputs[file.name]"
            placeholder="Enter expected MD5 checksum (32 hex characters)"
            :disabled="isValidating || validationComplete"
            @input="onMd5Input(file.name)"
          ></b-input>
        </b-field>
      </div>

      <!-- Validation status -->
      <div v-if="fileValidationStatus[file.name]" class="mt-2">
        <span :class="getStatusClass(fileValidationStatus[file.name].status)">
          <b-icon
            :icon="getStatusIcon(fileValidationStatus[file.name].status)"
            size="is-small"
          ></b-icon>
          {{ fileValidationStatus[file.name].message }}
        </span>
      </div>
    </div>

    <!-- Indexing Section (for indexed library types) -->
    <div
      v-if="indexed && selectedNonChecksumFiles.length > 0"
      class="box mt-4"
      style="background-color: #fff8e6; border: 1px solid #ffe08a"
    >
      <h4 class="title is-5 mb-3">
        <b-icon icon="file-star" size="is-small" class="mr-2"></b-icon>
        Index File Selection
      </h4>
      <p class="mb-3 has-text-grey">
        Select which file is the index file. There must be at least one
        non-index file.
      </p>
      <b-field label="Index File">
        <b-select
          v-model="indexFile"
          placeholder="Select the index file"
          :disabled="validationComplete"
          expanded
        >
          <option :value="null">-- Select index file --</option>
          <option
            v-for="file in getFilesForIndexSelect()"
            :key="file.name"
            :value="file.name"
          >
            {{ file.name }}
          </option>
        </b-select>
      </b-field>
      <p v-if="indexFile" class="help is-success">
        <b-icon icon="check" size="is-small"></b-icon>
        Index file selected: {{ indexFile }}
      </p>
      <p
        v-if="!indexFile && selectedNonChecksumFiles.length > 0"
        class="help is-danger"
      >
        You must select an index file.
      </p>
      <p
        v-if="indexFile && selectedNonChecksumFiles.length <= 1"
        class="help is-danger"
      >
        You must have at least one non-index file selected.
      </p>
    </div>

    <!-- Pairing Section (for paired library types) -->
    <div
      v-if="paired && selectedNonChecksumFiles.length >= 2"
      class="box mt-4"
      style="background-color: #e8f4f8; border: 1px solid #3e8ed0"
    >
      <h4 class="title is-5 mb-3">
        <b-icon icon="link-variant" size="is-small" class="mr-2"></b-icon>
        File Pairing
      </h4>
      <p class="mb-3 has-text-grey">
        Link paired-end read files together. At least one pairing is required.
        <span v-if="indexed">Files used as index cannot be paired.</span>
      </p>

      <!-- Existing pairings -->
      <div
        v-for="(pairing, index) in filePairings"
        :key="index"
        class="box mb-3"
        style="background-color: white"
      >
        <div class="columns is-vcentered">
          <div class="column">
            <b-field label="File 1">
              <b-select
                v-model="pairing.file1"
                placeholder="Select first file"
                :disabled="validationComplete"
                expanded
              >
                <option :value="null">-- Select file --</option>
                <option
                  v-for="file in getFilesForPairingSelect(pairing, false)"
                  :key="file.name"
                  :value="file.name"
                >
                  {{ file.name }}
                </option>
              </b-select>
            </b-field>
          </div>
          <div class="column is-narrow has-text-centered">
            <b-icon
              icon="link-variant"
              size="is-medium"
              class="has-text-info"
            ></b-icon>
          </div>
          <div class="column">
            <b-field label="File 2">
              <b-select
                v-model="pairing.file2"
                placeholder="Select second file"
                :disabled="validationComplete || !pairing.file1"
                expanded
              >
                <option :value="null">-- Select file --</option>
                <option
                  v-for="file in getFilesForPairingSelect(pairing, true)"
                  :key="file.name"
                  :value="file.name"
                >
                  {{ file.name }}
                </option>
              </b-select>
            </b-field>
          </div>
          <div class="column is-narrow">
            <b-button
              type="is-danger"
              icon-left="delete"
              :disabled="validationComplete"
              @click="removePairing(index)"
            >
            </b-button>
          </div>
        </div>
        <p v-if="pairing.file1 && pairing.file2" class="help is-success">
          <b-icon icon="check" size="is-small"></b-icon>
          Pairing complete
        </p>
      </div>

      <!-- Add pairing button -->
      <b-button
        v-if="filesAvailableForPairing.length >= 2"
        type="is-info"
        icon-left="plus"
        :disabled="validationComplete"
        @click="addPairing"
      >
        Add Pairing
      </b-button>

      <p v-if="filePairings.length === 0" class="help is-danger mt-2">
        At least one file pairing is required for paired library types.
      </p>
      <p v-else-if="isPairingValid" class="help is-success mt-2">
        <b-icon icon="check" size="is-small"></b-icon>
        {{ filePairings.length }} pairing(s) configured.
      </p>
    </div>

    <!-- Validation button -->
    <div class="mt-4">
      <b-button
        v-if="!validationComplete"
        @click="validateChecksums"
        :loading="isValidating"
        :disabled="!canStartValidation"
        type="is-info"
      >
        {{ validationButtonText }}
      </b-button>
      <b-button
        v-if="validationComplete"
        @click="resetValidation"
        type="is-warning"
        icon-left="refresh"
      >
        Start Over (Reset Validation)
      </b-button>
      <p
        v-if="
          !canStartValidation &&
          selectedNonChecksumFiles.length > 0 &&
          !validationComplete
        "
        class="help is-danger mt-2"
      >
        <span v-if="!allMd5sEntered"
          >Please enter a valid MD5 checksum for all selected files.</span
        >
        <span v-else-if="paired && !isPairingValid">
          At least one file pairing is required.</span
        >
        <span v-else-if="indexed && !isIndexingValid">
          Please select an index file and ensure there is at least one
          non-index file.</span
        >
      </p>
    </div>

    <!-- Validation progress -->
    <div v-if="isValidating" class="mt-4">
      <p class="has-text-weight-semibold mb-2">
        Validating checksums... ({{ validationProgress }}/{{
          selectedNonChecksumFiles.length
        }})
      </p>
      <progress
        class="progress is-primary"
        :value="validationProgress"
        :max="selectedNonChecksumFiles.length"
      ></progress>
    </div>

    <!-- Success message -->
    <div
      v-if="validatedFiles.length > 0 && validationComplete"
      class="mt-4 notification is-success"
    >
      <div class="is-flex is-align-items-center">
        <b-icon icon="lock-check" size="is-medium" class="mr-3"></b-icon>
        <div>
          <p class="has-text-weight-semibold is-size-5">
            <strong>{{ validatedFiles.length }}</strong> file(s) validated and
            locked for submission
          </p>
          <p class="mt-2">
            All MD5 checksums have been verified.
            <span v-if="paired">
              {{ filePairings.length }} file pairing(s) configured.</span
            >
            <span v-if="indexed"> Index file: {{ indexFile }}.</span>
            Files are now locked to prevent accidental changes. Click "Start
            Over" above if you need to modify your selection.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SparkMD5 from "spark-md5";
import { CHECKSUM_EXTENSIONS } from "~/utils/constants";

// MD5 is 32 hexadecimal characters
const MD5_REGEX = /^[a-fA-F0-9]{32}$/;

export default {
  name: "FileProcessor",
  props: {
    // v-model for output
    value: {
      type: Array,
      default: () => [],
    },
    // Input files from either HPC or local upload
    files: {
      type: Array,
      required: true,
    },
    // Source method: 'hpc-mv' or 'local-filesystem'
    source: {
      type: String,
      required: true,
      validator: (v) => ["hpc-mv", "local-filesystem"].includes(v),
    },
    // Library type properties
    paired: {
      type: Boolean,
      default: false,
    },
    indexed: {
      type: Boolean,
      default: false,
    },
    // For HPC validation API
    directoryName: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      isValidating: false,
      validationComplete: false,
      validatedFiles: [],
      // For HPC: which files are selected (by name)
      // For local: all files are auto-selected
      selectedFileNames: [],
      // MD5 validation state
      fileMd5Inputs: {}, // { fileName: 'user entered md5' }
      fileValidationStatus: {}, // { fileName: { status, message, calculatedMd5 } }
      validationProgress: 0,
      // Pairing state
      filePairings: [], // Array of { file1: fileName, file2: fileName }
      // Indexing state
      indexFile: null,
    };
  },
  computed: {
    // Filter out checksum files
    selectableFiles() {
      return this.files.filter((file) => !this.isChecksumFile(file.name));
    },
    // Get selected files as objects
    selectedNonChecksumFiles() {
      if (this.source === "local-filesystem") {
        // All files are auto-selected for local upload
        return this.selectableFiles;
      }
      // For HPC, filter by selectedFileNames
      return this.selectableFiles.filter((f) =>
        this.selectedFileNames.includes(f.name)
      );
    },
    // Files available for pairing
    filesAvailableForPairing() {
      const pairedFileNames = this.filePairings.flatMap((p) => [
        p.file1,
        p.file2,
      ]);
      return this.selectedNonChecksumFiles.filter(
        (f) => !pairedFileNames.includes(f.name) && f.name !== this.indexFile
      );
    },
    isPairingValid() {
      if (!this.paired) return true;
      return this.filePairings.length > 0;
    },
    isIndexingValid() {
      if (!this.indexed) return true;
      if (!this.indexFile) return false;
      const nonIndexFiles = this.selectedNonChecksumFiles.filter(
        (f) => f.name !== this.indexFile
      );
      return nonIndexFiles.length > 0;
    },
    validationButtonText() {
      const parts = ["Validate MD5"];
      if (this.paired) parts.push("Pairing");
      if (this.indexed) parts.push("Indexing");
      return parts.join(" & ");
    },
    allMd5sEntered() {
      return this.selectedNonChecksumFiles.every((file) => {
        const md5 = this.fileMd5Inputs[file.name];
        return md5 && MD5_REGEX.test(md5.trim());
      });
    },
    canStartValidation() {
      if (this.selectedNonChecksumFiles.length === 0) return false;
      if (this.isValidating) return false;
      if (!this.allMd5sEntered) return false;
      if (!this.isPairingValid) return false;
      if (!this.isIndexingValid) return false;
      return true;
    },
    allChecksumsValidated() {
      if (this.selectedNonChecksumFiles.length === 0) return false;
      return this.selectedNonChecksumFiles.every((file) => {
        const status = this.fileValidationStatus[file.name];
        return status && status.status === "valid";
      });
    },
  },
  watch: {
    // When files change, reset state
    files: {
      immediate: true,
      handler(newFiles) {
        this.resetState();
        // For local uploads, auto-select all files
        if (this.source === "local-filesystem") {
          this.selectedFileNames = newFiles
            .filter((f) => !this.isChecksumFile(f.name))
            .map((f) => f.name);
        }
      },
    },
    paired() {
      this.resetPairingAndIndexing();
    },
    indexed() {
      this.resetPairingAndIndexing();
    },
  },
  methods: {
    isChecksumFile(fileName) {
      const lowerFileName = fileName.toLowerCase();
      return CHECKSUM_EXTENSIONS.some((ext) => lowerFileName.endsWith(ext));
    },
    isFileSelected(fileName) {
      if (this.source === "local-filesystem") {
        return !this.isChecksumFile(fileName);
      }
      return this.selectedFileNames.includes(fileName);
    },
    isValidMd5Format(md5) {
      return md5 && MD5_REGEX.test(md5.trim());
    },
    getMd5FieldType(fileName) {
      const md5 = this.fileMd5Inputs[fileName];
      if (!md5) return "";
      if (this.isValidMd5Format(md5)) return "is-success";
      return "is-danger";
    },
    getMd5FieldMessage(fileName) {
      const md5 = this.fileMd5Inputs[fileName];
      if (!md5) return "Required: 32 hexadecimal characters";
      if (this.isValidMd5Format(md5)) return "Valid MD5 format";
      return "Invalid format: MD5 must be exactly 32 hexadecimal characters (0-9, a-f)";
    },
    getStatusClass(status) {
      switch (status) {
        case "valid":
          return "has-text-success";
        case "invalid":
          return "has-text-danger";
        case "error":
          return "has-text-danger";
        case "validating":
          return "has-text-info";
        default:
          return "has-text-grey";
      }
    },
    getStatusIcon(status) {
      switch (status) {
        case "valid":
          return "check-circle";
        case "invalid":
          return "close-circle";
        case "error":
          return "alert-circle";
        case "validating":
          return "sync";
        default:
          return "clock-outline";
      }
    },
    onFileSelectionChange(fileName, selectedNames) {
      if (!selectedNames.includes(fileName)) {
        // Clear MD5 input and status when deselected
        this.$delete(this.fileMd5Inputs, fileName);
        this.$delete(this.fileValidationStatus, fileName);
        // Remove from pairings
        this.filePairings = this.filePairings.filter(
          (p) => p.file1 !== fileName && p.file2 !== fileName
        );
        // Clear index if this was the index file
        if (this.indexFile === fileName) {
          this.indexFile = null;
        }
      }
    },
    onMd5Input(fileName) {
      this.$delete(this.fileValidationStatus, fileName);
    },
    resetState() {
      this.isValidating = false;
      this.validationComplete = false;
      this.validatedFiles = [];
      this.selectedFileNames = [];
      this.fileMd5Inputs = {};
      this.fileValidationStatus = {};
      this.validationProgress = 0;
      this.filePairings = [];
      this.indexFile = null;
      this.$emit("input", []);
    },
    resetPairingAndIndexing() {
      this.filePairings = [];
      this.indexFile = null;
      if (this.validationComplete) {
        this.resetValidation();
      }
    },
    resetValidation() {
      this.validationComplete = false;
      this.fileValidationStatus = {};
      this.validationProgress = 0;
      this.validatedFiles = [];
      this.$emit("input", []);
      this.$buefy.toast.open({
        message: "Validation reset. You can now modify your selections.",
        type: "is-info",
      });
    },
    // Pairing methods
    addPairing() {
      this.filePairings.push({ file1: null, file2: null });
    },
    removePairing(index) {
      this.filePairings.splice(index, 1);
    },
    getFilesForPairingSelect(currentPairing, isFile2 = false) {
      const usedInOtherPairings = this.filePairings
        .filter((p) => p !== currentPairing)
        .flatMap((p) => [p.file1, p.file2])
        .filter(Boolean);

      const otherFileInPairing = isFile2
        ? currentPairing.file1
        : currentPairing.file2;

      return this.selectedNonChecksumFiles.filter(
        (f) =>
          !usedInOtherPairings.includes(f.name) &&
          f.name !== otherFileInPairing &&
          f.name !== this.indexFile
      );
    },
    // Indexing methods
    getFilesForIndexSelect() {
      const pairedFileNames = this.filePairings
        .flatMap((p) => [p.file1, p.file2])
        .filter(Boolean);
      return this.selectedNonChecksumFiles.filter(
        (f) => !pairedFileNames.includes(f.name)
      );
    },
    // MD5 validation
    async validateChecksums() {
      if (!this.canStartValidation) return;

      this.isValidating = true;
      this.validationProgress = 0;

      const filesToValidate = this.selectedNonChecksumFiles;

      for (let i = 0; i < filesToValidate.length; i++) {
        const file = filesToValidate[i];
        const expectedMd5 = this.fileMd5Inputs[file.name]?.trim();

        this.$set(this.fileValidationStatus, file.name, {
          status: "validating",
          message: "Calculating checksum...",
        });

        try {
          let calculatedMd5;

          if (this.source === "hpc-mv") {
            // Server-side validation for HPC files
            const response = await this.$axios.post(
              "/directory-files/verify-md5",
              {
                directoryName: this.directoryName,
                fileName: file.name,
                expectedMd5,
              }
            );
            calculatedMd5 = response.data.calculatedMd5;
          } else {
            // Client-side validation for local files
            calculatedMd5 = await this.calculateMd5(file.data);
          }

          const matches =
            calculatedMd5.toLowerCase() === expectedMd5.toLowerCase();

          if (matches) {
            this.$set(this.fileValidationStatus, file.name, {
              status: "valid",
              message: `Checksum verified: ${calculatedMd5}`,
              calculatedMd5,
            });
          } else {
            this.$set(this.fileValidationStatus, file.name, {
              status: "invalid",
              message: `Mismatch! Expected: ${expectedMd5}, Calculated: ${calculatedMd5}`,
              calculatedMd5,
            });
          }
        } catch (e) {
          console.error(`Error validating ${file.name}:`, e);
          const errorData = e.response?.data;
          let errorMessage = errorData?.error || "Failed to validate checksum";
          if (errorData?.requestId) {
            errorMessage += ` (Ref: ${errorData.requestId})`;
          }
          this.$set(this.fileValidationStatus, file.name, {
            status: "error",
            message: errorMessage,
          });
        }

        this.validationProgress = i + 1;
      }

      this.isValidating = false;

      if (this.allChecksumsValidated) {
        this.confirmSelection();
        this.$buefy.toast.open({
          message:
            "All validations passed! Files, MD5 checksums, and settings are now locked.",
          type: "is-success",
          duration: 5000,
        });
      } else {
        this.$buefy.toast.open({
          message:
            "Some checksums failed validation. Please check and correct.",
          type: "is-danger",
        });
      }
    },
    // Calculate MD5 for local file using SparkMD5
    calculateMd5(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const spark = new SparkMD5.ArrayBuffer();
          spark.append(e.target.result);
          resolve(spark.end());
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsArrayBuffer(file);
      });
    },
    confirmSelection() {
      // Build sibling map for paired files
      const siblingMap = {};
      if (this.paired) {
        this.filePairings.forEach((pairing) => {
          if (pairing.file1 && pairing.file2) {
            siblingMap[pairing.file1] = pairing.file2;
            siblingMap[pairing.file2] = pairing.file1;
          }
        });
      }

      const formattedFiles = this.selectedNonChecksumFiles.map((file) => {
        const status = this.fileValidationStatus[file.name];
        const fileData = {
          name: file.name,
          md5: this.fileMd5Inputs[file.name]?.trim() || null,
          calculatedMd5: status?.calculatedMd5 || null,
        };

        // Add source-specific data
        if (this.source === "hpc-mv") {
          fileData.relativePath = this.directoryName;
        } else {
          // Local file data
          fileData.data = file.data;
          fileData.uploadName = file.uploadName;
        }

        // Add pairing info
        if (this.paired && siblingMap[file.name]) {
          fileData.sibling = siblingMap[file.name];
          fileData.paired = true;
        } else if (this.paired) {
          fileData.paired = false;
        }

        // Add indexing info
        if (this.indexed) {
          fileData.indexed = file.name === this.indexFile;
        }

        return fileData;
      });

      this.validatedFiles = formattedFiles;
      this.validationComplete = true;
      this.$emit("input", this.validatedFiles);
    },
  },
};
</script>

<style scoped>
.box {
  padding: 1rem;
  margin-bottom: 0.5rem;
}
</style>
