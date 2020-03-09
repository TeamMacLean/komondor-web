<template>
  <div>
    <div :class="[uppyId]"></div>
  </div>
</template>

<script>
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import Tus from "@uppy/tus";
import ThumbnailGenerator from "@uppy/thumbnail-generator";
import uuidv4 from "uuid/v4";


import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

export default {
  props: ["uploadID"],
  data() {
    return {
      API_URL: process.env.API_URL,
      uppyInstance: null,
      uppyId: `uppy-${this.uploadID}`
    };
  },
  mounted() {
    console.log("end point will be", this.API_URL + "/uploads");
    this.uppyInstance = Uppy({
      debug: true,
      autoProceed: true,
      id: `uppy-${this.uppyId}`,
      meta: {
        uploadID: this.uploadID
      },
      restrictions: {
        maxFileSize: 30000 * 1000000, //30g
        maxNumberOfFiles: 999,
        minNumberOfFiles: 0
        // allowedFileTypes: ['image/*', 'video/*', '.lif']
      }
    })
      .use(ThumbnailGenerator, {
        thumbnailWidth: 200
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
        width: 400
      })
      .use(Tus, { endpoint: this.API_URL + "/uploads" });

    const self = this;
    this.uppyInstance.on("*", () => {
      const allUploadsComplete =
        self.uppyInstance.getFiles().filter(file => {
          return !file.progress.uploadComplete;
        }).length > 0;

      self.$emit("canSubmit", allUploadsComplete);
    });

    this.uppyInstance.on("complete", result => {
      console.log("successful files:", result.successful);
      console.log("failed files:", result.failed);

      // const successfulFileNames = result.successful.map(s => {
      //   return s.name;
      // }).join(', ');
      // const failedFileNames = result.failed.map(s => {
      //   return s.name;
      // }).join(', ');
      //
      // function displaySuccess() {
      //   // self.$buefy.dialog.alert('Good (TODO)');
      //   // Swal.fire({
      //   //     title: 'Good job!',
      //   //     text: successfulFileNames + ' successfully uploaded',
      //   //     type: 'success',
      //   //     onAfterClose: function () {
      //   //       location.reload();
      //   //     }
      //   //   })
      // }
      //
      // function displayFailed() {
      //   // self.$buefy.dialog.alert('Bad (TODO)');
      //   // Swal.fire({
      //   //   type: 'error',
      //   //   title: 'Oops...',
      //   //   text: failedFileNames + ' failed to upload',
      //   //   onAfterClose: function () {
      //   //     if (result.successful.length) {
      //   //       displaySuccess();
      //   //     } else {
      //   //       location.reload();
      //   //     }
      //   //   }
      //   // })
      //
      //   // this.$buefy.dialog.alert({
      //   //   title: 'Error',
      //   //   message: failedFileNames + ' failed to upload',
      //   //   type: 'is-danger',
      //   //   hasIcon: true,
      //   //   icon: 'times-circle',
      //   //   iconPack: 'fa'
      //   // })
      // }
      //
      // if (result.failed.length) {
      //   displayFailed(); //calls success after if available
      // } else {
      //   displaySuccess();
      // }
    });
  }
};
</script>
