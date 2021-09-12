<template>
  <div>
    <!-- <div v-if="paired">PAIRED, normal uploader</div> -->
    <!-- <div class="outlined"> -->
    <!-- <label class="label">First read file (R1)</label>
    <p
      class="help"
    >Choose the file that contains the forward reads (usually having "R1" in the filename).</p>
    <br />-->
    <div v-show="showInput" :id="uniqueID" class="UppyInput"></div>
    <div v-show="fileName" class="uploaded-file">
      <ol>
        {{
          fileName
        }}
      </ol>
    </div>
    <div :id="uniqueID + '-progress'" class="UppyInput-Progress"></div>
    <br />
    <b-field label="MD5 (required)" :message="MD5Message">
      <b-input v-model="MD5" required></b-input>
    </b-field>
    <div v-show="fileName">
      <a v-show="!generatingMD5" @click="generateMD5">Generate MD5</a>
      <span v-show="generatingMD5">Generating MD5 Sum</span>
      <b-progress
        v-show="generatingMD5"
        :value="MD5Progress"
        type="is-success"
        size="is-small"
      ></b-progress>
    </div>
    <!-- </div> -->
  </div>
</template>

<script>
import Uppy from "@uppy/core";
import DragDrop from "@uppy/drag-drop";
import StatusBar from "@uppy/status-bar";
import Tus from "@uppy/tus";
import SparkMD5 from "spark-md5";
import { v4 as uuidv4 } from "uuid";

import "@uppy/core/dist/style.css";
import "@uppy/drag-drop/dist/style.css";

function GenerateMD5ForUppy(uppyInstance, progressFunction) {
  const setProgress = function (current, total) {
    progressFunction((current * 100) / total);
  };

  return new Promise((resolve, reject) => {
    if (!uppyInstance) {
      reject(new Error("no uppy instance"));
    } else {
      const file = uppyInstance.getFiles()[0].data;

      var blobSlice =
          File.prototype.slice ||
          File.prototype.mozSlice ||
          File.prototype.webkitSlice,
        chunkSize = 2097152, // Read in chunks of 2MB
        chunks = Math.ceil(file.size / chunkSize),
        currentChunk = 0,
        spark = new SparkMD5.ArrayBuffer(),
        fileReader = new FileReader();

      setProgress(currentChunk, chunks);

      fileReader.onload = function (e) {
        spark.append(e.target.result); // Append array buffer
        currentChunk++;

        setProgress(currentChunk, chunks);

        if (currentChunk < chunks) {
          loadNext();
        } else {
          resolve(spark.end());
        }
      };

      fileReader.onerror = function (err) {
        console.warn("oops, something went wrong.");
        reject(err);
      };

      function loadNext() {
        var start = currentChunk * chunkSize,
          end = start + chunkSize >= file.size ? file.size : start + chunkSize;
        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
      }

      loadNext();
    }
  });
}

export default {
  props: ["rowID", "onUploadStatusChange", "allowedExtensions"],
  data() {
    return {
      API_URL: process.env.API_URL,
      uppyInstance: null,
      fileName: "",
      MD5: "",
      MD5Progress: 0,
      showInput: true,
      generatingMD5: false,
      UUID: uuidv4(),
      MD5Message: "",
      errorMsg: "",
    };
  },
  computed: {
    uniqueID() {
      return `UppyInput-${this.UUID}`;
    },
    MD5WarningShown() {
      return this.$store.state.hasReceivedMD5Warning;
    },
  },
  mounted() {
    // TODO get all possible uploadable file types here
    // const uppyAllowedFileTypes = ['*.fastq.gz'];

    this.uppyInstance = new Uppy({
      debug: true,
      autoProceed: true,
      restrictions: {
        maxFileSize: 100000 * 1000000, // 100GB - was originally 30GB, but some files are larger
        maxNumberOfFiles: 1,
        minNumberOfFiles: 1,
        //allowedFileTypes: uppyAllowedFileTypes, //this.allowedExtensions
      },
      id: this.uniqueID,
      onBeforeFileAdded: (currentFile) => {
        const currentFileName = currentFile.name;
        const extensionStartIndex = currentFileName.indexOf(".");

        // check for errors #1
        if (!this.allowedExtensions || !this.allowedExtensions.length) {
          this.errorMsg =
            "Upload cancelled - you have not specified a library type.";
        }

        // check for errors #2
        if (!this.errorMsg) {
          if (extensionStartIndex === 0 || extensionStartIndex === -1) {
            this.errorMsg =
              "Upload cancelled - no extension found for uploaded file. File must explicitly have allowed extension type.";
          }
        }

        // check for errors #3
        if (!this.errorMsg) {
          const extension = currentFileName.substring(
            extensionStartIndex,
            currentFileName.length
          );

          const extensionRegexMatchesAllowedExtensions =
            this.allowedExtensions.some((allowedExt) => {
              return extension.includes(allowedExt);
            });

          if (!extensionRegexMatchesAllowedExtensions) {
            this.errorMsg =
              "Upload cancelled - file extension does not match permitted types: " +
              this.allowedExtensions.toString().replace(/,+/g, ", ");
          }
        }

        // if errors, cancel with alert
        if (this.errorMsg) {
          this.$buefy.dialog.alert({
            title: "Error",
            message: this.errorMsg,
            type: "is-danger",
            hasIcon: false,
          });
          this.errorMsg = "";
          return false;
        }

        return true;
      },
    });
    this.uppyInstance
      .use(DragDrop, { target: `#${this.uniqueID}` })
      // .use(FileInput, { target: `#${this.uniqueID}`, pretty: true })
      .use(Tus, {
        endpoint: this.API_URL + "/uploads",
        resume: true,
        limit: 10,
        headers: {
          "Access-Control-Allow-Origin": "*",
          // see Uploader.vue
        },
        // see Uploader.vue
      })
      .use(StatusBar, {
        target: `#${this.uniqueID}-progress`,
        hideUploadButton: true,
        hideAfterFinish: false,
      });

    this.uppyInstance.on("upload-success", (file, response) => {
      const fileName = file.name;
      this.fileName = fileName;
      this.MD5Message =
        "Please enter an MD5 from the provider, or click 'Generate MD5' for this field).";
      this.showInput = false;
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

    if (this.onUploadStatusChange) {
      const self = this;
      this.uppyInstance.on("*", () => {
        // console.log("rawitem files", self.uppyInstance.getFiles());
        const allUploadsComplete =
          self.uppyInstance.getFiles().filter((file) => {
            return !file.progress.uploadComplete;
          }).length < 1;

        this.onUploadStatusChange(allUploadsComplete);
        // self.$emit("canSubmit", allUploadsComplete);
      });
    }
  },
  methods: {
    // onDeleteRow() {
    //   //TODO confirm
    //   // if (this.deleteRow) {
    //   this.$buefy.dialog.confirm({
    //     message: "Are you sure?",
    //     type: "is-danger",
    //     onConfirm: () => {
    //
    //       this.deleteRow(this.rowID);
    //     }
    //   });
    //   // }
    // },
    showMD5Warning() {
      return new Promise((resolve) => {
        this.$buefy.dialog.confirm({
          title: "Important Data Integrity Notice",
          message: `MD5 sums represent the file as a single number. A single change results in a different MD5 sum. By comparing MD5 before and after upload we can verify that the file stored on the server is the same as the file you uploaded in this form. However, if you do not have an MD5 from the provider (collaborator or sequence service) then we cannot fully verify that the file you are providing to us is the complete and original version. If you need to be sure please cancel the upload and check your records or with collaborators for the original MD5 of your files.`,
          cancelText: "Cancel",
          confirmText: "Generate without known MD5",
          type: "is-danger",
          hasIcon: true,
          onConfirm: resolve,
        });
      });
    },
    setHasReceivedMD5Warning() {
      return this.$store.dispatch("setHasReceivedMD5Warning");
    },
    generateMD5() {
      const self = this;
      if (!self.MD5WarningShown) {
        //show warning first
        self.showMD5Warning().then(() => {
          self.setHasReceivedMD5Warning();
          doGeneration();
        });
      } else {
        //do generation
        doGeneration();
      }

      function doGeneration() {
        self.generatingMD5 = true;
        const progress = function (value) {
          self.MD5LeftProgress = value;
        };

        GenerateMD5ForUppy(self.uppyInstance, progress)
          .then((md5) => {
            self.MD5 = md5;
            self.generatingMD5 = false;
          })
          .catch((err) => {
            console.error("error", err);
            self.generatingMD5 = false;
          });
      }
    },
    getFiles() {
      const f = this.uppyInstance.getFiles()[0];
      if (f) {
        f.md5 = this.MD5;
        if (f.uploadURL) {
          f.uploadName = f.uploadURL.split("/").pop();
        }
      }
      return f;
    },
  },
};
</script>

<style scoped></style>
