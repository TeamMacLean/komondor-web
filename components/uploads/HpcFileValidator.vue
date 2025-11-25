<template>
  <div>
    <b-field
      label="HPC Directory Name"
      :message="`Enter the name of the directory in the HPC transfer area containing your read files. Full path will be: ${hpcPrefix}[your-input]`"
    >
      <div class="field has-addons">
        <p class="control">
          <span class="button is-static">{{ hpcPrefix }}</span>
        </p>
        <p class="control is-expanded">
          <b-input
            v-model="directoryName"
            placeholder="e.g., my-project-reads"
            @input="resetState"
          ></b-input>
        </p>
      </div>
    </b-field>

    <div
      v-if="allowedFileTypes && allowedFileTypes.length > 0"
      class="notification is-info mb-4"
      style="background-color: #3e8ed0; color: white"
    >
      <p class="has-text-weight-semibold mb-2" style="color: white">
        Allowed file extensions for HPC transfer:
      </p>
      <div class="tags">
        <span
          v-for="(ext, index) in allowedFileTypes"
          :key="index"
          class="tag is-light is-medium"
        >
          {{ ext }}
        </span>
      </div>
      <hr class="my-3" style="background-color: rgba(255, 255, 255, 0.3)" />
      <p class="has-text-weight-semibold mb-2" style="color: white">
        File count rules:
      </p>
      <p class="is-size-5" style="color: white">
        {{ fileCountRules }}
      </p>
      <p class="is-size-6 mt-3" style="color: white">
        <strong>Note:</strong> Checksum files (.md5, .sha256, .sha1) are not
        counted in these rules. You may have 0 or many checksum files.
      </p>
      <p class="is-size-6 mt-2" style="color: white">
        <strong>Issues with the logic?</strong> Email
        <a
          href="mailto:george.deeks@tsl.ac.uk"
          style="color: white; text-decoration: underline"
          >george.deeks@tsl.ac.uk</a
        >
      </p>
    </div>

    <b-button
      @click="findFiles"
      :loading="isFinding"
      :disabled="!directoryName || disabled"
      type="is-primary"
      class="mt-2"
    >
      Find Files
    </b-button>

    <div v-if="error" class="notification is-danger is-light mt-4">
      <div class="content">
        <p>
          <b-icon icon="alert-circle-outline" size="is-small"></b-icon>
          <strong>Error:</strong> <span v-html="errorMessage"></span>
        </p>
        <div
          v-if="invalidFiles.length > 0"
          class="mt-3 p-3"
          style="background-color: white; border-radius: 4px"
        >
          <p class="has-text-weight-semibold">Invalid files found:</p>
          <ul>
            <li
              v-for="file in invalidFiles"
              :key="file.name"
              class="has-text-danger"
            >
              {{ file.name }}
            </li>
          </ul>
        </div>
        <div
          v-if="foundFiles.length === 0 && allFilesFromServer.length > 0"
          class="mt-3 p-3"
          style="background-color: white; border-radius: 4px"
        >
          <p class="has-text-weight-semibold">Files found in directory:</p>
          <ul>
            <li v-for="file in allFilesFromServer" :key="file.name">
              {{ file.name }}
              <span
                v-if="isChecksumFile(file.name)"
                class="tag is-small is-light"
                >checksum</span
              >
              <span v-else class="tag is-small">counted</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- File selection with MD5 input -->
    <div v-if="foundFiles.length > 0" class="mt-4">
      <h3 class="subtitle is-6">
        Non-checksum Files Found in '{{ directoryName }}'
      </h3>
      <p class="mb-3 has-text-grey">
        Select the read files you want to include and enter the expected MD5
        checksum for each.
      </p>

      <div
        class="box"
        v-for="(file, index) in selectableFiles"
        :key="file.name"
      >
        <div class="columns is-vcentered is-mobile">
          <div class="column is-narrow">
            <b-checkbox
              v-model="selectedFiles"
              :native-value="file"
              :disabled="validationComplete"
              @input="onFileSelectionChange(file, $event)"
            ></b-checkbox>
          </div>
          <div class="column">
            <p class="has-text-weight-medium">{{ file.name }}</p>
          </div>
        </div>

        <!-- MD5 input (all selectable files require MD5) -->
        <div v-if="isFileSelected(file)" class="mt-2">
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
          Files used as index cannot be paired.
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
    </div>

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
import { CHECKSUM_EXTENSIONS } from "~/utils/constants";
import { getMatchingExtension } from "~/utils/validators";

// MD5 is 32 hexadecimal characters
const MD5_REGEX = /^[a-fA-F0-9]{32}$/;

export default {
  name: "HpcFileValidator",
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    sampleId: {
      type: String,
      required: true,
    },
    allowedExtensions: {
      type: Array,
      default: null,
    },
    paired: {
      type: Boolean,
      default: false,
    },
    indexed: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      directoryName: "",
      isFinding: false,
      isValidating: false,
      validationComplete: false,
      foundFiles: [],
      selectedFiles: [],
      validatedFiles: [],
      error: null,
      invalidFiles: [],
      allFilesFromServer: [],
      // MD5 validation state
      fileMd5Inputs: {}, // { fileName: 'user entered md5' }
      fileValidationStatus: {}, // { fileName: { status: 'pending'|'validating'|'valid'|'invalid'|'error', message: '' } }
      validationProgress: 0,
      // Pairing state (for paired library types)
      filePairings: [], // Array of { file1: fileName, file2: fileName }
      // Indexing state (for indexed library types)
      indexFile: null, // fileName of the selected index file
    };
  },
  computed: {
    selectableFiles() {
      // Only show non-checksum files for selection
      return this.foundFiles.filter((file) => !this.isChecksumFile(file.name));
    },
    hpcPrefix() {
      let prefix =
        process.env.HPC_DIRECTORY_PREFIX ||
        "/tsl/data/tempWebUploadToSequences/";
      if (!prefix.endsWith("/")) {
        prefix += "/";
      }
      return prefix;
    },
    fullDirectoryPath() {
      return this.directoryName ? `${this.hpcPrefix}${this.directoryName}` : "";
    },
    allowedFileTypes() {
      if (this.allowedExtensions && this.allowedExtensions.length > 0) {
        return [...this.allowedExtensions, ...CHECKSUM_EXTENSIONS];
      }
      return null;
    },
    fileCountRules() {
      if (!this.allowedExtensions) return "";
      if (this.paired) {
        return "Paired library: Must have at least 2 files (excluding checksum files).";
      } else {
        return "Single-end library: Must have at least 1 file (excluding checksum files).";
      }
    },
    errorMessage() {
      if (!this.error) return "";
      if (this.error.includes('<a href="mailto:')) {
        return this.error;
      }
      return this.error.replace(
        /george\.deeks@tsl\.ac\.uk/g,
        '<a href="mailto:george.deeks@tsl.ac.uk">george.deeks@tsl.ac.uk</a>'
      );
    },
    selectedNonChecksumFiles() {
      return this.selectedFiles.filter((f) => !this.isChecksumFile(f.name));
    },
    // Files available for pairing (selected, not already paired, not index file)
    filesAvailableForPairing() {
      const pairedFileNames = this.filePairings.flatMap((p) => [
        p.file1,
        p.file2,
      ]);
      return this.selectedNonChecksumFiles.filter(
        (f) => !pairedFileNames.includes(f.name) && f.name !== this.indexFile
      );
    },
    // Check if pairing requirements are met
    isPairingValid() {
      if (!this.paired) return true;
      // Must have at least one pairing
      return this.filePairings.length > 0;
    },
    // Check if indexing requirements are met
    isIndexingValid() {
      if (!this.indexed) return true;
      // Must have an index file selected
      if (!this.indexFile) return false;
      // Must have at least one non-index file
      const nonIndexFiles = this.selectedNonChecksumFiles.filter(
        (f) => f.name !== this.indexFile
      );
      return nonIndexFiles.length > 0;
    },
    // Dynamic validation button text
    validationButtonText() {
      const parts = ["Validate MD5"];
      if (this.paired) parts.push("Pairing");
      if (this.indexed) parts.push("Indexing");
      return parts.join(" & ");
    },
    // Check if all MD5s are entered (valid format)
    allMd5sEntered() {
      return this.selectedNonChecksumFiles.every((file) => {
        const md5 = this.fileMd5Inputs[file.name];
        return md5 && MD5_REGEX.test(md5.trim());
      });
    },
    canStartValidation() {
      if (this.selectedFiles.length === 0) return false;
      if (this.isValidating) return false;

      // All selected non-checksum files must have valid MD5 format
      const allMd5Valid = this.selectedNonChecksumFiles.every((file) => {
        const md5 = this.fileMd5Inputs[file.name];
        return md5 && MD5_REGEX.test(md5.trim());
      });
      if (!allMd5Valid) return false;

      // Check pairing requirements
      if (!this.isPairingValid) return false;

      // Check indexing requirements
      if (!this.isIndexingValid) return false;

      return true;
    },
    allChecksumsValidated() {
      if (this.selectedFiles.length === 0) return false;

      // All selected non-checksum files must have 'valid' status
      return this.selectedNonChecksumFiles.every((file) => {
        const status = this.fileValidationStatus[file.name];
        return status && status.status === "valid";
      });
    },
  },
  methods: {
    resetState() {
      this.foundFiles = [];
      this.selectedFiles = [];
      this.validatedFiles = [];
      this.validationComplete = false;
      this.error = null;
      this.invalidFiles = [];
      this.allFilesFromServer = [];
      this.fileMd5Inputs = {};
      this.fileValidationStatus = {};
      this.validationProgress = 0;
      this.filePairings = [];
      this.indexFile = null;
      this.$emit("input", []);
    },
    resetStateKeepDirectory() {
      // Reset everything except directoryName
      const savedDirectoryName = this.directoryName;
      this.resetState();
      this.directoryName = savedDirectoryName;

      // Show a toast to inform the user
      if (savedDirectoryName) {
        this.$buefy.toast.open({
          message:
            "Library type changed. Please click 'Find Files' again to re-validate.",
          type: "is-info",
          duration: 4000,
        });
      }
    },
    validateFileExtension(fileName) {
      if (!this.allowedFileTypes || this.allowedFileTypes.length === 0) {
        return true;
      }
      return getMatchingExtension(fileName, this.allowedFileTypes) !== null;
    },
    isChecksumFile(fileName) {
      const lowerFileName = fileName.toLowerCase();
      return CHECKSUM_EXTENSIONS.some((ext) => lowerFileName.endsWith(ext));
    },
    isFileSelected(file) {
      return this.selectedFiles.some((f) => f.name === file.name);
    },
    validateFileCount(files) {
      const nonChecksumFiles = files.filter(
        (file) => !this.isChecksumFile(file.name)
      );
      const count = nonChecksumFiles.length;

      if (this.paired) {
        if (count < 2) {
          return {
            valid: false,
            message: `File count mismatch: Your directory contains ${count} file${
              count !== 1 ? "s" : ""
            } (excluding checksum files). Paired libraries require at least 2 files.`,
          };
        }
      } else {
        if (count < 1) {
          return {
            valid: false,
            message: `File count mismatch: Your directory contains no files (excluding checksum files). At least 1 file is required.`,
          };
        }
      }

      return { valid: true, message: "" };
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
    onFileSelectionChange(file, isSelected) {
      if (!isSelected) {
        // Clear MD5 input and status when deselected
        this.$delete(this.fileMd5Inputs, file.name);
        this.$delete(this.fileValidationStatus, file.name);
      }
    },
    onMd5Input(fileName) {
      // Clear validation status when MD5 input changes
      this.$delete(this.fileValidationStatus, fileName);
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
      // Get files not used in other pairings
      const usedInOtherPairings = this.filePairings
        .filter((p) => p !== currentPairing)
        .flatMap((p) => [p.file1, p.file2])
        .filter(Boolean);

      // Also exclude the other file in this pairing
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
    isFilePaired(fileName) {
      return this.filePairings.some(
        (p) => p.file1 === fileName || p.file2 === fileName
      );
    },
    // Indexing methods
    getFilesForIndexSelect() {
      // Index file cannot be part of a pairing
      const pairedFileNames = this.filePairings
        .flatMap((p) => [p.file1, p.file2])
        .filter(Boolean);
      return this.selectedNonChecksumFiles.filter(
        (f) => !pairedFileNames.includes(f.name)
      );
    },
    async findFiles() {
      if (!this.directoryName) return;
      this.resetState();
      this.isFinding = true;
      try {
        console.log("Searching for directory:", this.directoryName);
        const response = await this.$axios.get(
          `/directory-files?targetDirectoryName=${encodeURIComponent(
            this.directoryName
          )}`
        );

        if (response.data.error) {
          let errorMessage = "";
          if (response.data.error === "Issue reading target directory") {
            errorMessage = `Cannot access directory: The path "${this.fullDirectoryPath}" could not be read.`;
          } else if (response.data.error === "Directory does not exist") {
            errorMessage = `Directory not found: The path "${this.fullDirectoryPath}" does not exist.`;
          } else if (
            response.data.error === "No files found in target directory"
          ) {
            errorMessage = `Empty directory: The directory "${this.fullDirectoryPath}" exists but contains no files.`;
          } else {
            errorMessage = `Error: ${response.data.error}`;
          }
          errorMessage += ` If you believe this is incorrect, please contact george.deeks@tsl.ac.uk`;
          this.error = errorMessage;
          this.isFinding = false;
          return;
        }

        const fileNames = response.data.filesResults || [];
        const allFiles = fileNames.map((name) => ({ name }));
        this.allFilesFromServer = allFiles;

        if (allFiles.length === 0) {
          this.error = "No files found in that directory.";
          this.isFinding = false;
          return;
        }

        if (this.allowedFileTypes && this.allowedFileTypes.length > 0) {
          this.invalidFiles = allFiles.filter(
            (file) => !this.validateFileExtension(file.name)
          );

          if (this.invalidFiles.length > 0) {
            this.error = `Invalid file types found. Only the following extensions are allowed: ${this.allowedFileTypes.join(
              ", "
            )}`;
            this.foundFiles = [];
            this.isFinding = false;
            return;
          }

          const countValidation = this.validateFileCount(allFiles);
          if (!countValidation.valid) {
            this.error = countValidation.message;
            this.foundFiles = [];
            this.isFinding = false;
            return;
          }

          this.foundFiles = allFiles;
        } else {
          this.foundFiles = allFiles;
        }
      } catch (e) {
        console.error("Error finding HPC files:", e);
        this.error =
          e.response?.data?.error ||
          e.message ||
          "An unexpected error occurred.";
      } finally {
        this.isFinding = false;
      }
    },
    async validateChecksums() {
      if (!this.canStartValidation) return;

      this.isValidating = true;
      this.validationProgress = 0;
      this.error = null;

      const filesToValidate = this.selectedNonChecksumFiles;

      for (let i = 0; i < filesToValidate.length; i++) {
        const file = filesToValidate[i];
        const expectedMd5 = this.fileMd5Inputs[file.name]?.trim();

        // Set status to validating
        this.$set(this.fileValidationStatus, file.name, {
          status: "validating",
          message: "Calculating checksum...",
        });

        try {
          const response = await this.$axios.post(
            "/directory-files/verify-md5",
            {
              directoryName: this.directoryName,
              fileName: file.name,
              expectedMd5,
            }
          );

          if (response.data.matches) {
            this.$set(this.fileValidationStatus, file.name, {
              status: "valid",
              message: `Checksum verified: ${response.data.calculatedMd5}`,
              calculatedMd5: response.data.calculatedMd5,
            });
          } else {
            this.$set(this.fileValidationStatus, file.name, {
              status: "invalid",
              message: `Mismatch! Expected: ${expectedMd5}, Calculated: ${response.data.calculatedMd5}`,
              calculatedMd5: response.data.calculatedMd5,
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

      // Show toast with result and auto-confirm if all passed
      if (this.allChecksumsValidated) {
        // Automatically confirm selection and lock everything
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
    confirmSelection() {
      // Filter out checksum files - only include actual read files
      const nonChecksumFiles = this.selectedFiles.filter(
        (file) => !this.isChecksumFile(file.name)
      );

      // Build a map of file -> sibling for paired files
      const siblingMap = {};
      if (this.paired) {
        this.filePairings.forEach((pairing) => {
          if (pairing.file1 && pairing.file2) {
            siblingMap[pairing.file1] = pairing.file2;
            siblingMap[pairing.file2] = pairing.file1;
          }
        });
      }

      const formattedFiles = nonChecksumFiles.map((file) => {
        const fileData = {
          ...file,
          MD5: this.fileMd5Inputs[file.name]?.trim() || null,
          relativePath: this.directoryName,
        };

        // Add pairing info if this file is paired
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
  watch: {
    sampleId: {
      immediate: true,
      handler() {
        this.directoryName = "";
        this.resetState();
      },
    },
    // Watch for library type changes (paired or indexed props)
    paired() {
      // Keep directory name but reset everything else
      this.resetStateKeepDirectory();
    },
    indexed() {
      // Keep directory name but reset everything else
      this.resetStateKeepDirectory();
    },
    allowedExtensions() {
      // If allowed extensions change, reset state
      this.resetStateKeepDirectory();
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
