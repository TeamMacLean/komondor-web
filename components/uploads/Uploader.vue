<template>
  <div>
    <div
      v-if="allowedFileTypes && allowedFileTypes.length > 0 && !confirmed"
      class="notification is-info mb-4"
      style="background-color: #3e8ed0; color: white"
    >
      <p class="has-text-weight-semibold mb-2" style="color: white">
        Allowed file extensions for upload:
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
      <p class="is-size-6 mt-2" style="color: white">
        <strong>Issues with the logic?</strong> Email
        <a
          href="mailto:george.deeks@tsl.ac.uk"
          style="color: white; text-decoration: underline"
          >george.deeks@tsl.ac.uk</a
        >
      </p>
    </div>

    <!-- Disabled message -->
    <div
      v-if="disabled && !confirmed"
      class="notification is-warning is-light mb-4"
    >
      <b-icon icon="alert" size="is-small"></b-icon>
      Please select a library type above before uploading files.
    </div>

    <!-- Uppy Dashboard (hidden when confirmed or disabled) -->
    <div v-show="!confirmed && !disabled" :class="uppyId"></div>

    <div
      v-if="fileCountError && !confirmed"
      class="notification is-danger is-light mt-4"
    >
      <b-icon icon="alert-circle-outline" size="is-small"></b-icon>
      {{ fileCountError }}
    </div>

    <!-- Confirm/Restart buttons -->
    <div class="mt-4">
      <b-button
        v-if="!confirmed && canConfirm"
        type="is-success"
        icon-left="check"
        @click="confirmFiles"
      >
        Confirm Uploaded Files
      </b-button>
      <b-button
        v-if="confirmed"
        type="is-warning"
        icon-left="refresh"
        @click="restartUpload"
      >
        Start Over
      </b-button>
    </div>

    <!-- Confirmed message -->
    <div v-if="confirmed" class="notification is-success is-light mt-4">
      <div class="is-flex is-align-items-center">
        <b-icon icon="check-circle" size="is-medium" class="mr-3"></b-icon>
        <div>
          <p class="has-text-weight-semibold">
            {{ confirmedFileCount }} file(s) confirmed for processing
          </p>
          <p class="mt-1 has-text-grey">
            Proceed to the "Process Files" section below to enter MD5 checksums.
            Click "Restart File Upload" to start over with different files.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import Tus from "@uppy/tus";
import ThumbnailGenerator from "@uppy/thumbnail-generator";
import { v4 as uuidv4 } from "uuid";
import { CHECKSUM_EXTENSIONS } from "~/utils/constants";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";

export default {
  props: {
    onUploadStatusChange: {
      type: Function,
      default: null,
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
      API_URL: process.env.API_URL,
      uppyInstance: null,
      uppyId: `uppy-${uuidv4()}`,
      fileCountError: null,
      confirmed: false,
      confirmedFiles: [],
    };
  },
  computed: {
    readExtensions() {
      const libraryTypes = JSON.parse(
        JSON.stringify(this.$nuxt.context.store.state.libraryTypes)
      );
      const mappedExtensions = libraryTypes.map((t) => t.extensions);
      function flatten(arr) {
        return arr.reduce(function (flat, toFlatten) {
          return flat.concat(
            Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten
          );
        }, []);
      }
      const flatExtensions = flatten(mappedExtensions);
      return flatExtensions;
    },
    allowedFileTypes() {
      // Only allow the specified extensions (no .md5 files)
      if (this.allowedExtensions && this.allowedExtensions.length > 0) {
        return [...this.allowedExtensions];
      }
      return null;
    },
    fileCountRules() {
      if (!this.allowedExtensions) return "";

      if (this.indexed && this.paired) {
        return "Indexed paired library: Minimum 3 files required.";
      } else if (this.indexed) {
        return "Indexed library: Minimum 2 files required.";
      } else if (this.paired) {
        return "Paired library: Minimum 2 files required.";
      } else {
        return "Minimum 1 file required.";
      }
    },
    canConfirm() {
      if (!this.uppyInstance) return false;
      const files = this.uppyInstance.getFiles();
      if (files.length === 0) return false;
      // All files must be uploaded
      const allUploaded = files.every(
        (f) => f.progress && f.progress.uploadComplete
      );
      if (!allUploaded) return false;
      // File count validation must pass
      return !this.fileCountError;
    },
    confirmedFileCount() {
      return this.confirmedFiles.length;
    },
  },
  mounted() {
    this.initUppy();
  },
  methods: {
    initUppy() {
      this.uppyInstance = new Uppy({
        debug: true,
        autoProceed: true,
        allowMultipleUploads: true,
        id: `uppy-${this.uppyId}`,
        onBeforeFileAdded: (currentFile) => {
          // Get the current allowed extensions from the prop (reactive)
          const currentAllowedExtensions = this.allowedExtensions;
          const currentFileName = currentFile.name;
          var errorMsg = "";

          // If this is the raw files uploader (has allowedExtensions), enforce file type restrictions
          if (
            currentAllowedExtensions &&
            Array.isArray(currentAllowedExtensions) &&
            currentAllowedExtensions.length > 0
          ) {
            const extensionStartIndex = currentFileName.indexOf(".");

            if (extensionStartIndex === -1) {
              errorMsg = `Upload cancelled - "${currentFileName}" has no file extension. Allowed extensions are: ${currentAllowedExtensions.join(
                ", "
              )}`;
            } else {
              const extension = currentFileName.substring(extensionStartIndex);

              const isAllowed = currentAllowedExtensions.some((allowedExt) => {
                return (
                  extension === allowedExt || extension.endsWith(allowedExt)
                );
              });

              if (!isAllowed) {
                errorMsg = `Upload cancelled - "${currentFileName}" has extension "${extension}" which is not allowed. Allowed extensions are: ${currentAllowedExtensions.join(
                  ", "
                )}`;
              }
            }
          }
          // If this is the additional files uploader (no allowedExtensions), prevent read files
          // but allow checksum files (.md5, .sha256, .sha1) and other non-read files (.txt, .pdf, etc.)
          else if (
            !currentAllowedExtensions &&
            this.readExtensions &&
            this.readExtensions.length
          ) {
            const extensionStartIndex = currentFileName.indexOf(".");

            if (extensionStartIndex !== -1) {
              const extension = currentFileName.substring(extensionStartIndex);

              // First check if it's a checksum file - always allow these
              const isChecksumFile = CHECKSUM_EXTENSIONS.some((checksumExt) => {
                return (
                  extension === checksumExt || extension.endsWith(checksumExt)
                );
              });

              if (!isChecksumFile) {
                // Check if file matches any read file extension from any library type
                const isReadFile = this.readExtensions.some((readExt) => {
                  return extension === readExt || extension.endsWith(readExt);
                });

                if (isReadFile) {
                  errorMsg =
                    "Upload cancelled - we detect you are trying to add a read file to the additional files uploader. Read files should be uploaded in Step 1 above.";
                }
              }
            }
          }

          if (errorMsg) {
            this.$buefy.dialog.alert({
              title: "Error",
              message: errorMsg,
              type: "is-danger",
              hasIcon: false,
            });
            return false;
          }

          return true;
        },
        restrictions: {
          maxFileSize: 30000 * 1000000, //30g
          maxNumberOfFiles: 20,
          minNumberOfFiles: 0,
          // Note: allowedFileTypes is set dynamically via watcher to ensure
          // it stays in sync with the allowedExtensions prop
        },
      })
        .use(ThumbnailGenerator, {
          thumbnailWidth: 200,
        })
        .use(Dashboard, {
          proudlyDisplayPoweredByUppy: false,
          id: `dash-${this.uppyId}`,
          inline: true,
          target: `.${this.uppyId}`,
          replaceTargetContent: true,
          showProgressDetails: true,
          browserBackButtonClose: true,
          showLinkToFileUploadResult: false,
          height: 400,
          width: 400,
          hideAfterFinish: true,
        })
        .use(Tus, {
          endpoint: this.API_URL + "/uploads",
          resume: true,
          limit: 10,
          retryDelays: [0, 1000, 3000, 5000],
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        });

      // Handle restriction-failed events - we handle restrictions in onBeforeFileAdded
      this.uppyInstance.on("restriction-failed", (file, error) => {
        // Restrictions are handled in onBeforeFileAdded with custom error messages
      });

      this.uppyInstance.on("file-added", (file) => {
        console.log("file-added event for:", file.name);
        this.$nextTick(() => {
          if (this.allowedExtensions && this.allowedExtensions.length > 0) {
            this.validateFileCount();
          }
        });
      });

      this.uppyInstance.on("file-removed", (file, reason) => {
        console.log("file-removed event for:", file.name, "reason:", reason);
        this.$nextTick(() => {
          if (this.allowedExtensions && this.allowedExtensions.length > 0) {
            this.validateFileCount();
          }
        });
      });

      this.uppyInstance.on("upload", (data) => {
        const { id, fileIDs } = data;
        console.log(`Starting upload ${id} for files ${fileIDs}`);
      });

      this.uppyInstance.on("progress", (progress) => {
        console.log("progress update:", progress);
      });

      this.uppyInstance.on("upload-progress", (file, progress) => {
        const { bytesUploaded, bytesTotal } = progress;
        console.log(
          "upload-progress event:" +
            `${Math.round(
              (bytesUploaded / bytesTotal) * 100
            )}% uploaded (${bytesUploaded}/${bytesTotal} bytes)`
        );
      });

      this.uppyInstance.on("upload-success", (file, response) => {
        console.log(
          "upload-success for:",
          file && file.name,
          "response URL:",
          response && response.uploadURL
        );
        // Force re-check of canConfirm
        this.$forceUpdate();
      });

      this.uppyInstance.on("complete", (result) => {
        console.log("completed event, success and fails:");
        console.log(
          "successful files:",
          result.successful.map((f) => `${f.name}`)
        );
        console.log("failed files:", result.failed);
        // Force re-check of canConfirm
        this.$forceUpdate();
      });

      this.uppyInstance.on("error", (error) => {
        console.error(error.stack);
      });

      this.uppyInstance.on("upload-error", (file, error, response) => {
        console.log("upload error event! with file:", file);
        console.log("error message for this:", error);
        response && console.log("response obj", response);
      });

      this.uppyInstance.on("upload-retry", (fileID) => {
        console.log("upload retried event:", fileID);
      });
    },
    validateFileCount() {
      const files = this.uppyInstance.getFiles();
      const count = files.length;

      // Determine minimum file count based on library type
      let minFiles = 1;
      let libraryTypeDesc = "";

      if (this.indexed && this.paired) {
        minFiles = 3;
        libraryTypeDesc = "Indexed paired library";
      } else if (this.indexed) {
        minFiles = 2;
        libraryTypeDesc = "Indexed library";
      } else if (this.paired) {
        minFiles = 2;
        libraryTypeDesc = "Paired library";
      }

      if (count < minFiles) {
        this.fileCountError = libraryTypeDesc
          ? `${libraryTypeDesc} requires at least ${minFiles} files. Currently have ${count}.`
          : `At least ${minFiles} file required. Currently have ${count}.`;
        return false;
      }

      this.fileCountError = null;
      return true;
    },
    confirmFiles() {
      if (!this.canConfirm) return;

      const files = this.uppyInstance.getFiles().map((f) => ({
        name: f.name,
        data: f.data,
        source: "local",
        uploadName: f.uploadURL ? f.uploadURL.split("/").pop() : null,
        uploadURL: f.uploadURL,
      }));

      this.confirmedFiles = files;
      this.confirmed = true;
      this.$emit("confirm", files);
    },
    restartUpload() {
      this.confirmed = false;
      this.confirmedFiles = [];
      this.clear();
      this.$emit("restart");
    },
    getFiles() {
      if (this.confirmed) {
        return this.confirmedFiles;
      }
      return this.uppyInstance.getFiles().map((f) => {
        if (f.uploadURL) {
          f.uploadName = f.uploadURL.split("/").pop();
        }
        return f;
      });
    },
    clear() {
      this.fileCountError = null;
      if (this.uppyInstance) {
        this.uppyInstance.cancelAll();
        this.uppyInstance.getFiles().forEach((file) => {
          this.uppyInstance.removeFile(file.id);
        });
      }
    },
    // Public method to check if files are confirmed
    isConfirmed() {
      return this.confirmed;
    },
  },
};
</script>
