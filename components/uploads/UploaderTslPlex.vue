<template>
  <div>
    <div :class="[uppyId]"></div>
  </div>
</template>

<script>
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import Tus from "@uppy/tus";

import { v4 as uuidv4 } from "uuid";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";

export default {
  props: {
    onUploadStatusChange: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      API_URL: process.env.API_URL,
      uppyInstance: null,
      uppyId: `uppy-${uuidv4()}`,
    };
  },
  mounted() {
    this.uppyInstance = Uppy({
      debug: true,
      autoProceed: true,
      allowMultipleUploads: false,
      id: `uppy-${this.uppyId}`,
      restrictions: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxNumberOfFiles: 1,
        minNumberOfFiles: 0,
        allowedFileTypes: [".csv"],
      },
      onBeforeFileAdded: () => {
        return true;
      },
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
        height: 150,
        width: "100%",
        // Hide the status bar after upload completes to prevent the "Done" button
        // from appearing. The Done button calls uppy.reset() which clears all files.
        hideAfterFinish: true,
        strings: {
          closeModal: "TESTING yoda for closeModal",
          addMoreFiles: "TESTING yoda for addMoreFiles",
          addingMoreFiles: "TESTING yoda for addingMoreFiles",
          importFrom: "TESTING yoda for importFrom %{name}",
          dashboardWindowTitle:
            "TESTING yoda for dashboardWindowTitle (Press escape to close)",
          dashboardTitle: "TESTING yoda for dashboardTitle",
          copyLinkToClipboardSuccess:
            "TESTING yoda for copyLinkToClipboardSuccess.",
          copyLinkToClipboardFallback:
            "TESTING yoda for copyLinkToClipboardFallback",
          copyLink: "TESTING yoda for copyLink",
          back: "TESTING yoda for back",
          removeFile: "TESTING yoda for removeFile",
          editFile: "TESTING yoda for editFile",
          editing: "TESTING yoda for editing %{file}",
          finishEditingFile: "TESTING yoda for finishEditingFile",
          saveChanges: "TESTING yoda for saveChanges",
          myDevice: "TESTING yoda for myDevice",
          dropHint: "TESTING yoda for dropHint",
          uploadComplete: "TESTING yoda for uploadComplete",
          uploadPaused: "TESTING yoda for uploadPaused",
          resumeUpload: "TESTING yoda for resumeUpload",
          pauseUpload: "TESTING yoda for pauseUpload",
          retryUpload: "TESTING yoda for retryUpload",
          cancelUpload: "TESTING yoda for cancelUpload",
          xFilesSelected: {
            0: "TESTING yoda for xFilesSelected %{smart_count} file selected",
            1: "TESTING yoda for xFilesSelected %{smart_count} files selected",
          },
          uploadingXFiles: {
            0: "TESTING yoda for uploadingXFiles %{smart_count} file",
            1: "TESTING yoda for uploadingXFiles %{smart_count} files",
          },
          processingXFiles: {
            0: "TESTING yoda for processingXFiles %{smart_count} file",
            1: "TESTING yoda for processingXFiles %{smart_count} files",
          },
          poweredBy: "TESTING yoda for poweredBy %{uppy}",
          addMore: "TESTING yoda for addMore",
          editFileWithFilename: "TESTING yoda for editFileWithFilename %{file}",
          save: "TESTING yoda for save",
          cancel: "TESTING yoda for cancel",
          // The crucial "Done" button text (added from previous iteration)
          done: "TESTING yoda for done",
          dropPasteFiles: "TESTING yoda for dropPasteFiles %{browseFiles}",
          dropPasteFolders:
            "TESTING yoda for dropPasteFolders %{browseFolders}",
          dropPasteBoth:
            "TESTING yoda for dropPasteBoth %{browseFiles} or %{browseFolders}",
          dropPasteImportFiles:
            "TESTING yoda for dropPasteImportFiles %{browseFiles} or import from:",
          dropPasteImportFolders:
            "TESTING yoda for dropPasteImportFolders %{browseFolders} or import from:",
          dropPasteImportBoth:
            "TESTING yoda for dropPasteImportBoth %{browseFiles}, %{browseFolders} or import from:",
          importFiles: "TESTING yoda for importFiles from:",
          browseFiles: "TESTING yoda for browseFiles",
          browseFolders: "TESTING yoda for browseFolders",
          recoveredXFiles: {
            0: "TESTING yoda for recoveredXFiles 1 file.",
            1: "TESTING yoda for recoveredXFiles %{smart_count} files.",
          },
          recoveredAllFiles: "TESTING yoda for recoveredAllFiles",
          sessionRestored: "TESTING yoda for sessionRestored",
          reSelect: "TESTING yoda for reSelect",
          missingRequiredMetaFields: {
            0: "TESTING yoda for missingRequiredMetaFields: %{fields}.",
            1: "TESTING yoda for missingRequiredMetaFields: %{fields}.",
          },
        },
      })
      .use(Tus, {
        endpoint: this.API_URL + "/uploads",
        resume: true,
        limit: 1,
        retryDelays: [0, 1000, 3000, 5000],
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });

    // --- Uppy Event Handlers ---
    this.uppyInstance.on("file-added", (file) => {
      console.log("Tplex CSV file added:", file.name);
      this.onUploadStatusChange(true, file.data);
    });

    this.uppyInstance.on("file-removed", (file, reason) => {
      console.log("Tplex CSV file removed:", file.name, "reason:", reason);
      this.onUploadStatusChange(true, null);
    });

    this.uppyInstance.on("complete", (result) => {
      console.log("Tplex CSV complete event:");
      console.log(
        "Successful files:",
        result.successful.map((f) => f.name)
      );
      console.log("Failed files:", result.failed);

      if (result.successful.length > 0) {
        this.onUploadStatusChange(true, result.successful[0].data);
      } else if (result.failed.length > 0) {
        this.onUploadStatusChange(false, null);
      }
    });

    this.uppyInstance.on("error", (error) => {
      console.error("Uppy error:", error);
      this.$buefy.toast.open({
        message: `Uppy error: ${error.message}`,
        type: "is-danger",
      });
      this.onUploadStatusChange(false, null);
    });

    this.uppyInstance.on("upload-error", (file, error, response) => {
      console.error("Upload error for file:", file.name, error, response);
      this.$buefy.toast.open({
        message: `Upload error for ${file.name}: ${error.message}`,
        type: "is-danger",
      });
      this.onUploadStatusChange(false, null);
    });
  },
  beforeDestroy() {
    if (this.uppyInstance) {
      this.uppyInstance.close();
    }
  },
  methods: {
    getFiles() {
      const files = this.uppyInstance.getFiles();
      return files.length > 0 ? [files[0].data] : [];
    },
  },
};
</script>

<style scoped>
/* Any specific styles for your component */
</style>
