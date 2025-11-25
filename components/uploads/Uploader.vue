<template>
  <div>
    <div
      v-if="allowedFileTypes && allowedFileTypes.length > 0"
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
      <p class="is-size-6 mt-3" style="color: white">
        <strong>Note:</strong> .md5 files are not counted in these rules. You
        may have 0 or many .md5 files.
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
    <div :class="[uppyId]"></div>
    <div v-if="fileCountError" class="notification is-danger is-light mt-4">
      <b-icon icon="alert-circle-outline" size="is-small"></b-icon>
      {{ fileCountError }}
    </div>
  </div>
</template>

<script>
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import Tus from "@uppy/tus";
import ThumbnailGenerator from "@uppy/thumbnail-generator";
import { v4 as uuidv4 } from "uuid";

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
  },
  data() {
    return {
      API_URL: process.env.API_URL,
      uppyInstance: null,
      uppyId: `uppy-${uuidv4()}`,
      fileCountError: null,
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
      console.log("Read extensions", flatExtensions);

      return flatExtensions;
    },
    allowedFileTypes() {
      // If allowedExtensions prop is provided, use it; otherwise allow all read extensions
      if (this.allowedExtensions && this.allowedExtensions.length > 0) {
        // Always allow .md5 files in addition to the allowed extensions
        return [...this.allowedExtensions, ".md5"];
      }
      return null; // No restrictions if not provided
    },
    fileCountRules() {
      if (!this.allowedExtensions) return "";

      if (this.indexed && this.paired) {
        return "Indexed paired library: Must have at least 3 files (excluding .md5), and an odd number of files in total.";
      } else if (this.paired) {
        return "Paired library: Must have at least 2 files (excluding .md5), and an even number of files in total.";
      } else {
        return "Single-end library: Must have exactly 1 file (excluding .md5).";
      }
    },
  },
  mounted() {
    this.uppyInstance = new Uppy({
      debug: true,
      autoProceed: true,
      allowMultipleUploads: true,
      id: `uppy-${this.uppyId}`,
      onBeforeFileAdded: (currentFile) => {
        var errorMsg = "";

        // If this is the raw files uploader (has allowedExtensions), enforce file type restrictions
        if (this.allowedFileTypes && this.allowedFileTypes.length > 0) {
          const currentFileName = currentFile.name;
          const extensionStartIndex = currentFileName.indexOf(".");

          if (extensionStartIndex === -1) {
            errorMsg = `Upload cancelled - "${currentFileName}" has no file extension. Allowed extensions are: ${this.allowedFileTypes.join(
              ", "
            )}`;
          } else {
            const extension = currentFileName.substring(
              extensionStartIndex,
              currentFileName.length
            );

            const isAllowed = this.allowedFileTypes.some((allowedExt) => {
              return extension === allowedExt || extension.endsWith(allowedExt);
            });

            if (!isAllowed) {
              errorMsg = `Upload cancelled - "${currentFileName}" has extension "${extension}" which is not allowed. Allowed extensions are: ${this.allowedFileTypes.join(
                ", "
              )}`;
            }
          }
        }
        // If this is the additional files uploader (no allowedExtensions), prevent read files
        else if (!this.allowedExtensions && this.readExtensions.length) {
          const currentFileName = currentFile.name;
          const extensionStartIndex = currentFileName.indexOf(".");

          if (extensionStartIndex !== -1) {
            const extension = currentFileName.substring(
              extensionStartIndex,
              currentFileName.length
            );

            const extensionProbablyAReadFile = this.readExtensions.some(
              (readExt) => {
                return extension.includes(readExt);
              }
            );

            if (extensionProbablyAReadFile) {
              errorMsg =
                "Upload cancelled - we detect you are trying to add a read file to additional files uploader";
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
        allowedFileTypes: this.allowedFileTypes || undefined,
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
      })
      .use(Tus, {
        endpoint: this.API_URL + "/uploads",
        resume: true,
        limit: 10,
        retryDelays: [0, 1000, 3000, 5000], // default [0, 1000, 3000, 5000]
        headers: {
          "Access-Control-Allow-Origin": "*",
          // 'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS, PUT, PATCH, DELETE',
          // 'Access-Control-Allow-Headers': 'Authorization,Accept,Origin,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modif',
          //'Access-Control-Allow-Credentials': false, // false cos of line 65
          // 'X-HTTP-Method-Override': 'PATCH',
        },
        //overridePatchMethod: true,
        // removeFingerprintOnSuccess: true; means a new upload if same file is uploaded again
      });

    this.uppyInstance.on("file-added", (file) => {
      console.log("file-added event for:", file.name);
      // Validate file count after a file is added
      this.$nextTick(() => {
        if (this.allowedExtensions && this.allowedExtensions.length > 0) {
          this.validateFileCount();
        }
      });
    });
    this.uppyInstance.on("file-removed", (file, reason) => {
      console.log("file-removed event for:", file.name, "reason:", reason);
      // Validate file count after a file is removed
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
    });
    this.uppyInstance.on("complete", (result) => {
      console.log("completed event, success and fails:");
      console.log(
        "successful files:",
        result.successful.map((f) => `${f.name}`)
      );

      console.log("failed files:", result.failed);
    });
    this.uppyInstance.on("error", (error) => {
      console.log(error.stack);

      console.error(error.stack);
    });
    this.uppyInstance.on("upload-error", (file, error, response) => {
      console.log("upload error event! with file:", file);
      console.log("error message for this:", error);
      response && console.log("response obj", response);
      if (error.isNetworkError) {
        console.log("we know its a network error, George");
      }
    });
    this.uppyInstance.on("upload-retry", (fileID) => {
      console.log("upload retried event:", fileID);
    });

    // if (this.onUploadStatusChange) {
    //   const self = this;
    //   this.uppyInstance.on("*", () => {
    //     // console.log(self.uppyInstance.getFiles());
    //     const allUploadsComplete =
    //       self.uppyInstance.getFiles().filter(file => {
    //         return !file.progress.uploadComplete;
    //       }).length < 1;

    //     this.onUploadStatusChange(allUploadsComplete);
    //     // self.$emit("canSubmit", allUploadsComplete);
    //   });
    // }
  },
  methods: {
    isMd5File(fileName) {
      return fileName.toLowerCase().endsWith(".md5");
    },
    validateFileCount() {
      const files = this.uppyInstance.getFiles();
      // Filter out .md5 files for counting
      const nonMd5Files = files.filter((file) => !this.isMd5File(file.name));
      const count = nonMd5Files.length;

      if (this.indexed && this.paired) {
        // At least 3 files, odd number
        if (count < 3) {
          this.fileCountError = `Indexed paired library requires at least 3 files (excluding .md5). Currently have ${count}.`;
          return false;
        }
        if (count % 2 === 0) {
          this.fileCountError = `Indexed paired library requires an odd number of files (excluding .md5). Currently have ${count}.`;
          return false;
        }
      } else if (this.paired) {
        // At least 2 files, even number
        if (count < 2) {
          this.fileCountError = `Paired library requires at least 2 files (excluding .md5). Currently have ${count}.`;
          return false;
        }
        if (count % 2 !== 0) {
          this.fileCountError = `Paired library requires an even number of files (excluding .md5). Currently have ${count}.`;
          return false;
        }
      } else {
        // Single file only
        if (count !== 1) {
          this.fileCountError = `Single-end library requires exactly 1 file (excluding .md5). Currently have ${count}.`;
          return false;
        }
      }

      this.fileCountError = null;
      return true;
    },
    getFiles() {
      return this.uppyInstance.getFiles().map((f) => {
        if (f.uploadURL) {
          f.uploadName = f.uploadURL.split("/").pop();
        }
        return f;
      });
    },
    clear() {
      if (this.uppyInstance) {
        this.uppyInstance.cancelAll();
        this.uppyInstance.getFiles().forEach((file) => {
          this.uppyInstance.removeFile(file.id);
        });
      }
    },
  },
};
</script>
<style scoped></style>
