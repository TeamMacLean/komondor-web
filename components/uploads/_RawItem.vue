<template>
  <div>
    <!-- <div v-if="paired">PAIRED, normal uploader</div> -->
    <!-- <div class="outlined"> -->
    <!-- <label class="label">First read file (R1)</label>
    <p
      class="help"
    >Choose the file that contains the forward reads (usually having "R1" in the filename).</p>
    <br />-->
    <div :id="uniqueID" class="UppyInput" v-show="showInput"></div>
    <div class="uploaded-file" v-show="fileName">
      <ol>{{fileName}}</ol>
    </div>
    <div :id="uniqueID+'-progress'" class="UppyInput-Progress"></div>
    <br />
    <b-field label="MD5">
      <b-input v-model="MD5" @change="onMD5ChangeEvent" required></b-input>
    </b-field>
    <div v-show="fileName">
      <a v-show="!generatingMD5" @click="generateMD5">Generate MD5</a>
      <span v-show="generatingMD5">Generating MD5 Sum</span>
      <b-progress :value="MD5Progress" type="is-success" size="is-small" v-show="generatingMD5"></b-progress>
    </div>
    <!-- </div> -->
  </div>
</template>

<script>
import Uppy from "@uppy/core";
import FileInput from "@uppy/file-input";
import DragDrop from "@uppy/drag-drop";
import StatusBar from "@uppy/status-bar";
import Tus from "@uppy/tus";
import SparkMD5 from "spark-md5";
import { v4 as uuidv4 } from "uuid";

import "@uppy/core/dist/style.css";
import "@uppy/drag-drop/dist/style.css";

function GenerateMD5ForUppy(uppyInstance, progressFunction) {
  const setProgress = function(current, total) {
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

      fileReader.onload = function(e) {
         
        spark.append(e.target.result); // Append array buffer
        currentChunk++;

        setProgress(currentChunk, chunks);

        if (currentChunk < chunks) {
          loadNext();
        } else {
           
          resolve(spark.end());
        }
      };

      fileReader.onerror = function(err) {
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
  props: ["uploadID", "rowID", "onUploadStatusChange", "onMD5Change"],
  data() {
    return {
      API_URL: process.env.API_URL,
      uppyInstance: null,
      fileName: "",
      MD5: "",
      MD5Progress: 0,
      showInput: true,
      uppyInstance: null,
      generatingMD5: false,
      UUID: uuidv4()
    };
  },
  computed: {
    uniqueID() {
      return `UppyInput-${this.UUID}`;
    },
    MD5WarningShown() {
      return this.$store.state.hasReceivedMD5Warning;
    }
  },
  mounted() {
    // if (this.uploadID) {
    this.uppyInstance = new Uppy({
      debug: true,
      autoProceed: true,
      restrictions: {
        maxNumberOfFiles: 1,
        minNumberOfFiles: 1
      },
      meta: {
        // uploadID: this.uploadID,
        // rowID: this.rowID,
        // UUID: this.UUID
      }
    });
    this.uppyInstance
      .use(DragDrop, { target: `#${this.uniqueID}` })
      // .use(FileInput, { target: `#${this.uniqueID}`, pretty: true })
      .use(Tus, { endpoint: this.API_URL + "/uploads" })
      .use(StatusBar, {
        target: `#${this.uniqueID}-progress`,
        hideUploadButton: true,
        hideAfterFinish: false
      });
    this.uppyInstance.on("upload-success", (file, response) => {
      const url = response.uploadURL;
      const fileName = file.name;
      this.fileName = fileName;
      this.showInput = false;

      console.log(file, response)
    });

    if (this.onUploadStatusChange) {
      const self = this;
      this.uppyInstance.on("*", () => {
        console.log(self.uppyInstance.getFiles());
        const allUploadsComplete =
          self.uppyInstance.getFiles().filter(file => {
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
    onMD5ChangeEvent() {
      if (onMD5Change) {
        this.onMD5Change(this.MD5, this.UUID);
      }
    },
    showMD5Warning() {
      return new Promise((resolve, reject) => {
        this.$buefy.dialog.confirm({
          title: "Important Data Integrity Notice",
          message: `MD5 sums represent the file as a single number. A single change results in a different MD5 sum. By comparing MD5 before and after upload we can verify that the file stored on the server is the same as the file you uploaded in this form. However, if you do not have an MD5 from the provider (collaborator or sequence service) then we cannot fully verify that the file you are providing to us is the complete and original version. If you need to be sure please cancel the upload and check your records or with collaborators for the original MD5 of your files.`,
          cancelText: "Cancel",
          confirmText: "Generate without known MD5",
          type: "is-danger",
          hasIcon: true,
          onConfirm: resolve
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

        const progress = function(value) {
          self.MD5LeftProgress = value;
        };

        GenerateMD5ForUppy(self.uppy, progress)
          .then(md5 => {
            self.MD5 = md5;
            self.generatingMD5 = false;
          })
          .catch(err => {
            self.generatingMD5 = false;
          });
      }
    }
  }
};
</script>

<style scoped>
/* .is-outlined {
  border: 1px solid lightgray;
  border-radius: 4px;
}
.is-padded {
  padding: 16px;
}
.mb {
  margin-bottom: 8px;
} */
/* .delete-button-holder {
  position: relative;
}
.delete-row {
  position: absolute;
  right: 0;
  top: 0;
} */
</style>