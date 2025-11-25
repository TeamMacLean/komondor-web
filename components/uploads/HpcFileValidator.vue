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

    <div v-if="foundFiles.length > 0" class="mt-4">
      <h3 class="subtitle is-6">Files Found in '{{ directoryName }}'</h3>
      <div
        v-for="file in foundFiles"
        :key="file.name"
        class="mb-2 control"
        style="display: block"
      >
        <b-checkbox v-model="selectedFiles" :native-value="file">
          {{ file.name }}
        </b-checkbox>
      </div>
      <b-button
        @click="validateSelectedFiles"
        :loading="isValidating"
        :disabled="selectedFiles.length === 0"
        class="mt-4 is-success"
      >
        Use {{ selectedFiles.length }} Selected File(s)
      </b-button>
    </div>

    <div
      v-if="validatedFiles.length > 0"
      class="mt-4 notification is-success is-light"
    >
      <p>
        Successfully validated and selected
        <strong>{{ validatedFiles.length }}</strong> file(s). You can now
        proceed with the form submission.
      </p>
    </div>
  </div>
</template>

<script>
import { CHECKSUM_EXTENSIONS } from "~/utils/constants";
import { getMatchingExtension } from "~/utils/validators";

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
      foundFiles: [],
      selectedFiles: [],
      validatedFiles: [],
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
      // Ensure trailing slash
      if (!prefix.endsWith("/")) {
        prefix += "/";
      }
      return prefix;
    },
    fullDirectoryPath() {
      return this.directoryName ? `${this.hpcPrefix}${this.directoryName}` : "";
    },
    allowedFileTypes() {
      // Always allow checksum files in addition to the allowed extensions
      if (this.allowedExtensions && this.allowedExtensions.length > 0) {
        return [...this.allowedExtensions, ...CHECKSUM_EXTENSIONS];
      }
      return null; // No restrictions if not provided
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
      // Don't replace if already has HTML link
      if (this.error.includes('<a href="mailto:')) {
        return this.error;
      }
      // Convert plain email to clickable link
      return this.error.replace(
        /george\.deeks@tsl\.ac\.uk/g,
        '<a href="mailto:george.deeks@tsl.ac.uk">george.deeks@tsl.ac.uk</a>'
      );
    },
  },
  methods: {
    resetState() {
      this.foundFiles = [];
      this.selectedFiles = [];
      this.validatedFiles = [];
      this.error = null;
      this.invalidFiles = [];
      this.allFilesFromServer = [];
      this.$emit("input", []);
    },
    validateFileExtension(fileName) {
      if (!this.allowedFileTypes || this.allowedFileTypes.length === 0) {
        return true; // No restrictions
      }

      return getMatchingExtension(fileName, this.allowedFileTypes) !== null;
    },
    isChecksumFile(fileName) {
      const lowerFileName = fileName.toLowerCase();
      return CHECKSUM_EXTENSIONS.some((ext) => lowerFileName.endsWith(ext));
    },
    validateFileCount(files) {
      // Filter out checksum files for counting
      const nonChecksumFiles = files.filter(
        (file) => !this.isChecksumFile(file.name)
      );
      const count = nonChecksumFiles.length;

      if (this.paired) {
        // At least 2 files
        if (count < 2) {
          return {
            valid: false,
            message: `File count mismatch: Your directory contains ${count} file${
              count !== 1 ? "s" : ""
            } (excluding checksum files). Paired libraries require at least 2 files.`,
          };
        }
      } else {
        // At least 1 file
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
        console.log("Searching for directory:", this.directoryName);
        console.log("Full path will be:", this.fullDirectoryPath);
        const response = await this.$axios.get(
          `/directory-files?targetDirectoryName=${encodeURIComponent(
            this.directoryName
          )}`
        );
        console.log("API response:", response.data);

        // Check if API returned an error in the response body
        if (response.data.error) {
          console.log("API returned error:", response.data.error);
          let errorMessage = "";

          if (response.data.error === "Issue reading target directory") {
            errorMessage = `Cannot access directory: The path "${this.fullDirectoryPath}" could not be read. This may be due to:<br>
            • The directory does not exist<br>
            • Insufficient permissions to access this path<br>
            • The parent directory structure is incorrect<br><br>
            <strong>Path attempted:</strong> ${this.fullDirectoryPath}`;
          } else if (response.data.error === "Directory does not exist") {
            errorMessage = `Directory not found: The path "${this.fullDirectoryPath}" does not exist.<br><br>
            <strong>Path attempted:</strong> ${this.fullDirectoryPath}<br><br>
            Please verify:<br>
            • The directory name is spelled correctly<br>
            • The directory exists in ${this.hpcPrefix}`;
          } else if (
            response.data.error === "No files found in target directory"
          ) {
            errorMessage = `Empty directory: The directory "${this.fullDirectoryPath}" exists but contains no files.<br><br>
            Please ensure you have uploaded files to this directory before attempting to use them.`;
          } else {
            errorMessage = `Error: ${response.data.error}<br><br>
            <strong>Path attempted:</strong> ${this.fullDirectoryPath}`;
          }

          errorMessage += `<br><br>If you believe this is incorrect, please contact <a href="mailto:george.deeks@tsl.ac.uk" style="text-decoration: underline">george.deeks@tsl.ac.uk</a> with the path information above.`;

          this.error = errorMessage;
          this.isFinding = false;
          return;
        }

        // API returns filesResults as array of filenames
        const fileNames = response.data.filesResults || [];

        // Convert filenames to file objects with name property for consistency
        const allFiles = fileNames.map((name) => ({ name }));
        this.allFilesFromServer = allFiles; // Store for error display

        if (allFiles.length === 0) {
          console.log(
            "allFiles.length is 0, filesResults was:",
            response.data.filesResults
          );
          this.error = "No files found in that directory.";
          this.isFinding = false;
          return;
        }

        // Validate file types if restrictions are in place
        if (this.allowedFileTypes && this.allowedFileTypes.length > 0) {
          this.invalidFiles = allFiles.filter(
            (file) => !this.validateFileExtension(file.name)
          );

          if (this.invalidFiles.length > 0) {
            const invalidFileNames = this.invalidFiles
              .map((f) => f.name)
              .join(", ");
            this.error = `Invalid file types found in directory: ${invalidFileNames}. Only the following extensions are allowed: ${this.allowedFileTypes.join(
              ", "
            )}. If you believe this is incorrect, please contact <a href="mailto:george.deeks@tsl.ac.uk" style="text-decoration: underline">george.deeks@tsl.ac.uk</a>`;
            this.foundFiles = [];
            this.isFinding = false;
            return;
          }

          // Validate file count
          const countValidation = this.validateFileCount(allFiles);
          if (!countValidation.valid) {
            this.error = `${countValidation.message} If you believe this is incorrect, please contact <a href="mailto:george.deeks@tsl.ac.uk" style="text-decoration: underline">george.deeks@tsl.ac.uk</a>`;
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
        console.error("Error response:", e.response);

        // Build detailed error message
        let errorMessage = "";

        if (e.response) {
          // Server responded with an error
          const status = e.response.status;
          const serverMessage =
            e.response.data?.message || e.response.statusText;

          if (status === 404) {
            errorMessage = `Directory not found: The path "${this.fullDirectoryPath}" does not exist on the server. Please check the directory name.`;
          } else if (status === 403) {
            errorMessage = `Permission denied: You do not have access to "${this.fullDirectoryPath}". Please check the directory permissions or contact your administrator.`;
          } else if (status === 500) {
            errorMessage = `Server error: ${
              serverMessage ||
              "An internal server error occurred while accessing the directory."
            }`;
          } else {
            errorMessage = `Error (${status}): ${serverMessage}`;
          }

          // Add the full path attempted
          errorMessage += `<br><br><strong>Path attempted:</strong> ${this.fullDirectoryPath}`;
        } else if (e.request) {
          // Request was made but no response received
          errorMessage = `Network error: Unable to reach the server. Please check your internet connection.`;
        } else {
          // Something else happened
          errorMessage = `Error: ${
            e.message || "An unexpected error occurred."
          }`;
        }

        // Add contact info
        errorMessage += `<br><br>If you believe this is incorrect, please contact <a href="mailto:george.deeks@tsl.ac.uk" style="text-decoration: underline">george.deeks@tsl.ac.uk</a> with the path information above.`;

        this.error = errorMessage;
      } finally {
        this.isFinding = false;
      }
    },
    async validateSelectedFiles() {
      if (this.selectedFiles.length === 0) return;
      this.isValidating = true;
      this.error = null;

      // This component will currently assume the files are valid.
      // A future implementation could add MD5 checks or other validation steps here.
      try {
        // Simulate validation delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const formattedFiles = this.selectedFiles.map((file) => ({
          ...file,
          MD5: file.md5 || null, // API might provide md5
          relativePath: this.fullDirectoryPath,
        }));

        this.validatedFiles = formattedFiles;
        this.$emit("input", this.validatedFiles);
      } catch (e) {
        console.error("Error during validation:", e);
        this.error = "An unexpected error occurred during file validation.";
        this.$emit("input", []);
      } finally {
        this.isValidating = false;
      }
    },
    formatBytes(bytes, decimals = 2) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
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
  },
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
