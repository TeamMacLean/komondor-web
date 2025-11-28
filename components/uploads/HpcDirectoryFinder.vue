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
            :disabled="disabled || filesFound"
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

    <div class="buttons">
      <b-button
        v-if="!filesFound"
        @click="findFiles"
        :loading="isFinding"
        :disabled="!directoryName || disabled"
        type="is-primary"
      >
        Find Files
      </b-button>
      <b-button
        v-if="filesFound"
        @click="resetAndClear"
        type="is-warning"
        icon-left="refresh"
      >
        Start Over
      </b-button>
    </div>

    <div v-if="error" class="notification is-danger is-light mt-4">
      <div class="content">
        <p>
          <b-icon icon="alert-circle-outline" size="is-small"></b-icon>
          <strong>Error:</strong> <span v-html="errorMessage"></span>
        </p>
        <div
          v-if="invalidFiles.length > 0"
          class="mt-3 p-3"
          style="background-color: white; border-radius: 4px; color: #363636"
        >
          <p class="has-text-weight-semibold has-text-dark">
            Invalid files found:
          </p>
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
          style="background-color: white; border-radius: 4px; color: #363636"
        >
          <p class="has-text-weight-semibold has-text-dark">
            Files found in directory:
          </p>
          <ul>
            <li
              v-for="file in allFilesFromServer"
              :key="file.name"
              class="has-text-dark"
            >
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

    <!-- Success message when files found -->
    <div
      v-if="filesFound && !error"
      class="notification is-success is-light mt-4"
    >
      <div class="is-flex is-align-items-center">
        <b-icon icon="check-circle" size="is-medium" class="mr-3"></b-icon>
        <div>
          <p class="has-text-weight-semibold">
            Found {{ selectableFileCount }} file(s) in '{{ directoryName }}'
          </p>
          <p class="mt-1 has-text-grey">
            Proceed to the "Process Files" section below to select files and
            enter MD5 checksums.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { CHECKSUM_EXTENSIONS } from "~/utils/constants";
import { getMatchingExtension } from "~/utils/validators";

export default {
  name: "HpcDirectoryFinder",
  props: {
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
      filesFound: false,
      foundFiles: [],
      error: null,
      invalidFiles: [],
      allFilesFromServer: [],
    };
  },
  computed: {
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
    selectableFileCount() {
      return this.foundFiles.filter((f) => !this.isChecksumFile(f.name)).length;
    },
  },
  methods: {
    resetState() {
      this.foundFiles = [];
      this.filesFound = false;
      this.error = null;
      this.invalidFiles = [];
      this.allFilesFromServer = [];
      this.$emit("files-found", [], "");
    },
    resetAndClear() {
      this.directoryName = "";
      this.resetState();
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
    async findFiles() {
      if (!this.directoryName) return;
      this.resetState();
      this.isFinding = true;
      try {
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
        const allFiles = fileNames.map((name) => ({
          name,
          source: "hpc",
          relativePath: this.directoryName,
        }));
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

        this.filesFound = true;
        // Emit the found files to parent
        this.$emit("files-found", this.foundFiles, this.directoryName);
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
    // Public method to clear state (called by parent)
    clear() {
      this.resetAndClear();
    },
  },
  watch: {
    sampleId: {
      immediate: true,
      handler() {
        this.resetAndClear();
      },
    },
    paired() {
      // If files were found, re-validate count
      if (this.filesFound) {
        const countValidation = this.validateFileCount(this.foundFiles);
        if (!countValidation.valid) {
          this.error = countValidation.message;
          this.filesFound = false;
          this.$emit("files-found", [], "");
        }
      }
    },
    allowedExtensions() {
      // If allowed extensions change, reset
      if (this.filesFound) {
        this.$buefy.toast.open({
          message:
            "Library type changed. Please click 'Find Files' again to re-validate.",
          type: "is-info",
          duration: 4000,
        });
        this.resetState();
      }
    },
  },
};
</script>
