<template>
  <div class="is-outlined is-padded mb">
    <div class="delete-button-holder">
      <button
        type="button"
        aria-label="Close message"
        class="delete delete-row"
        @click="onDeleteRow"
      ></button>
    </div>

    <div v-if="paired">
      <div class="columns">
        <div class="column is-6">
          <label class="label">First read file (R1)aa</label>
          <p
            class="help"
          >Choose the file that contains the forward reads (usually having "R1" in the filename).</p>
          <br />
          <RawItem
            :onUploadStatusChange="onLeftChange"
            :onMD5Change="onMD5Change"
            :uploadID="uploadID"
          />
        </div>
        <div class="column is-6">
          <label class="label">Second read file (R2)</label>
          <p
            class="help"
          >Choose the file that contains the reverse reads (usually having "R2" in the filename).</p>
          <br />
          <RawItem
            :onUploadStatusChange="onRightChange"
            :onMD5Change="onMD5Change"
            :uploadID="uploadID"
          />
        </div>
      </div>
    </div>
    <div v-else>
      <!-- <div class="outlined"> -->
      <RawItem
        :onUploadStatusChange="onSingleChange"
        :onMD5Change="onMD5Change"
        :uploadID="uploadID"
      />
      <!-- </div> -->
    </div>

    <!-- <div v-if="paired">PAIRED, normal uploader</div> -->
    <!-- <div class="columns outlined">
      <div class="column is-6">
        <label class="label">First read file (R1)</label>
        <p
          class="help"
        >Choose the file that contains the forward reads (usually having "R1" in the filename).</p>
        <br />
        <div :id="leftID" class="UppyInput" v-show="showInputLeft"></div>
        <div class="uploaded-file-left" v-show="fileNameLeft">
          <ol>{{fileNameLeft}}</ol>
        </div>
        <div :id="leftID+'-progress'" class="UppyInput-Progress"></div>
        <br />
        <b-field label="MD5">
          <b-input v-model="MD5Left" required></b-input>
        </b-field>
        <div v-show="fileNameLeft">
          <a v-show="!generatingMD5Left" @click="generateMD5Left">Generate MD5</a>
          <span v-show="generatingMD5Left">Generating MD5 Sum</span>
          <b-progress
            :value="MD5LeftProgress"
            type="is-success"
            size="is-small"
            v-show="generatingMD5Left"
          ></b-progress>
        </div>
      </div>
      <div class="column is-6">
        <label class="label">Second read file (R2)</label>
        <p
          class="help"
        >Choose the file that contains the reverse reads (usually having "R2" in the filename).</p>
        <br />
        <div :id="rightID" class="UppyInput" v-show="showInputRight"></div>
        <div class="uploaded-file-right" v-show="fileNameRight">
          <ol>{{fileNameRight}}</ol>
        </div>
        <div :id="rightID+'-progress'" class="UppyInput-Progress"></div>
        <br />
        <b-field label="MD5">
          <b-input v-model="MD5Right" required></b-input>
        </b-field>
        <div v-show="fileNameRight">
          <a v-show="!generatingMD5Right" @click="generateMD5Right">Generate MD5</a>
          <span v-show="generatingMD5Right">Generating MD5 Sum</span>
          <b-progress
            :value="MD5RightProgress"
            type="is-success"
            size="is-small"
            v-show="generatingMD5Right"
          ></b-progress>
        </div>
      </div>
    </div>-->
  </div>
</template>

<script>
// import Uppy from "@uppy/core";
// import FileInput from "@uppy/file-input";
// import DragDrop from "@uppy/drag-drop";
// import StatusBar from "@uppy/status-bar";
// import Tus from "@uppy/tus";
// import SparkMD5 from "spark-md5";

// import "@uppy/core/dist/style.css";
// import "@uppy/drag-drop/dist/style.css";

// function GenerateMD5ForUppy(uppyInstance, progressFunction) {
//   const setProgress = function(current, total) {
//     progressFunction((current * 100) / total);
//   };

//   return new Promise((resolve, reject) => {
//     if (!uppyInstance) {
//       reject(new Error("no uppy instance"));
//     } else {
//       const file = uppyInstance.getFiles()[0].data;

//       var blobSlice =
//           File.prototype.slice ||
//           File.prototype.mozSlice ||
//           File.prototype.webkitSlice,
//         chunkSize = 2097152, // Read in chunks of 2MB
//         chunks = Math.ceil(file.size / chunkSize),
//         currentChunk = 0,
//         spark = new SparkMD5.ArrayBuffer(),
//         fileReader = new FileReader();

//       setProgress(currentChunk, chunks);

//       fileReader.onload = function(e) {
//
//         spark.append(e.target.result); // Append array buffer
//         currentChunk++;

//         setProgress(currentChunk, chunks);

//         if (currentChunk < chunks) {
//           loadNext();
//         } else {
//
//           resolve(spark.end());
//         }
//       };

//       fileReader.onerror = function(err) {
//         console.warn("oops, something went wrong.");
//         reject(err);
//       };

//       function loadNext() {
//         var start = currentChunk * chunkSize,
//           end = start + chunkSize >= file.size ? file.size : start + chunkSize;

//         fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
//       }

//       loadNext();
//     }
//   });
// }
import RawItem from "./_RawItem";
export default {
  props: [
    "paired",
    "deleteRow",
    "uploadID",
    "rowID",
    "onUploadStatusChange",
    "onMD5Change"
  ],
  components: { RawItem },
  data() {
    return {
      leftDone: false, //left all uploads complete
      rightDone: false, //right all uploads complete
      singleDone: false, //single all uploads complete
      API_URL: process.env.API_URL
    };
  },
  // computed: {
  //   leftID() {
  //     return `UppyInputLeft-${this.rowID}`;
  //   },
  //   rightID() {
  //     return `UppyInputRight-${this.rowID}`;
  //   },
  //   MD5WarningShown() {
  //     return this.$store.state.hasReceivedMD5Warning;
  //   }
  // },
  // mounted() {
  //   // if (this.uploadID) {
  //   //left
  //   this.uppyLeft = new Uppy({
  //     debug: true,
  //     autoProceed: true,
  //     restrictions: {
  //       maxNumberOfFiles: 1,
  //       minNumberOfFiles: 1
  //     },
  //     meta: {
  //       uploadID: this.uploadID,
  //       rowID: this.rowID
  //     }
  //   });
  //   this.uppyLeft
  //     .use(DragDrop, { target: `#${this.leftID}` })
  //     // .use(FileInput, { target: `#${this.leftID}`, pretty: true })
  //     .use(Tus, { endpoint: this.API_URL + "/uploads" })
  //     .use(StatusBar, {
  //       target: `#${this.leftID}-progress`,
  //       hideUploadButton: true,
  //       hideAfterFinish: false
  //     });
  //   this.uppyLeft.on("upload-success", (file, response) => {
  //     const url = response.uploadURL;
  //     const fileName = file.name;
  //     this.fileNameLeft = fileName;
  //     this.showInputLeft = false;
  //   });

  //   //right
  //   this.uppyRight = new Uppy({
  //     debug: true,
  //     autoProceed: true,
  //     restrictions: {
  //       maxNumberOfFiles: 1,
  //       minNumberOfFiles: 1
  //     },
  //     meta: {
  //       uploadID: this.uploadID,
  //       rowID: this.rowID
  //     }
  //   });
  //   this.uppyRight
  //     .use(DragDrop, { target: `#${this.rightID}` })
  //     // .use(FileInput, { target: `#${this.rightID}`, pretty: true })
  //     .use(Tus, { endpoint: this.API_URL + "/uploads" })
  //     .use(StatusBar, {
  //       target: `#${this.rightID}-progress`,
  //       hideUploadButton: true,
  //       hideAfterFinish: false
  //     });
  //   this.uppyRight.on("upload-success", (file, response) => {
  //     const url = response.uploadURL;
  //     const fileName = file.name;
  //     this.fileNameRight = fileName;

  //     this.showInputRight = false;
  //   });
  // },
  methods: {
    onDeleteRow() {
      //TODO confirm
      // if (this.deleteRow) {
      this.$buefy.dialog.confirm({
        message: "Are you sure?",
        type: "is-danger",
        onConfirm: () => {
          //TODO: delete file from server
          this.deleteRow(this.rowID);
        }
      });
      // }
    },
    onLeftChange(val) {
      if (typeof val === "boolean") {
        this.leftDone = val;
      }
    },
    onRightChange(val) {
      if (typeof val === "boolean") {
        this.rightDone = val;
      }
    },
    onSingleChange(val) {
      if (typeof val === "boolean") {
        this.singleDone = val;
      }
    },
    notifyOnChange() {
      if (this.onUploadStatusChange) {
        if (this.paired) {
          this.onUploadStatusChange(
            this.leftDone && this.rightDone,
            this.rowID
          );
        } else {
          this.onUploadStatusChange(this.singleDone, this.rowID);
        }
      }
    }
    //     showMD5Warning() {
    //       return new Promise((resolve, reject) => {
    //         this.$buefy.dialog.confirm({
    //           title: "Important Data Integrity Notice",
    //           message: `MD5 sums represent the file as a single number. A single change results in a different MD5 sum. By comparing MD5 before and after upload we can verify that the file stored on the server is the same as the file you uploaded in this form. However, if you do not have an MD5 from the provider (collaborator or sequence service) then we cannot fully verify that the file you are providing to us is the complete and original version. If you need to be sure please cancel the upload and check your records or with collaborators for the original MD5 of your files.`,
    //           cancelText: "Cancel",
    //           confirmText: "Generate without known MD5",
    //           type: "is-danger",
    //           hasIcon: true,
    //           onConfirm: resolve
    //         });
    //       });
    //     },
    //     setHasReceivedMD5Warning() {
    //       return this.$store.dispatch("setHasReceivedMD5Warning");
    //     },
    //     generateMD5Left() {
    //       const self = this;
    //       if (!self.MD5WarningShown) {
    //         //show warning first
    //         self.showMD5Warning().then(() => {
    //           self.setHasReceivedMD5Warning();
    //           doGeneration();
    //         });
    //       } else {
    //         //do generation
    //         doGeneration();
    //       }

    //       function doGeneration() {
    //         self.generatingMD5Left = true;

    //         const progress = function(value) {
    //           self.MD5LeftProgress = value;
    //         };

    //         GenerateMD5ForUppy(self.uppyLeft, progress)
    //           .then(md5 => {
    //             self.MD5Left = md5;
    //             self.generatingMD5Left = false;
    //           })
    //           .catch(err => {
    //             self.generatingMD5Left = false;
    //           });
    //       }
    //     },
    //     generateMD5Right() {
    //       const self = this;
    //       if (!self.MD5WarningShown) {
    //         //show warning first
    //         self.showMD5Warning().then(() => {
    //           self.setHasReceivedMD5Warning();
    //           doGeneration();
    //         });
    //       } else {
    //         //do generation
    //         doGeneration();
    //       }

    //       function doGeneration() {
    //         self.generatingMD5Right = true;

    //         const progress = function(value) {
    //           self.MD5RightProgress = value;
    //         };

    //         GenerateMD5ForUppy(self.uppyRight, progress)
    //           .then(md5 => {
    //             self.MD5Right = md5;
    //             self.generatingMD5Right = false;
    //           })
    //           .catch(err => {
    //             self.generatingMD5Right = false;
    //           });
    //       }
    //     }
  }
};
</script>

<style scoped>
.is-outlined {
  border: 1px solid lightgray;
  border-radius: 4px;
}
.is-padded {
  padding: 16px;
}
.mb {
  margin-bottom: 8px;
}
.delete-button-holder {
  position: relative;
  height: 30px;
}
.delete-row {
  position: absolute;
  right: 0;
  top: 0;
}
</style>