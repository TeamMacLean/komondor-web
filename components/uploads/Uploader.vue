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
import { v4 as uuidv4 } from "uuid";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";

export default {
  props: [ "onUploadStatusChange"],
  data() {
    return {
      API_URL: process.env.API_URL,
      uppyInstance: null,
      uppyId: `uppy-${uuidv4()}`,
      // UUID: uuidv4()
    };
  },
  mounted() {
    this.uppyInstance = Uppy({
      debug: true,
      autoProceed: true,
      allowMultipleUploads: false,
      id: `uppy-${this.uppyId}`,
      meta: {
        // uploadID: this.uploadID,
        // UUID: this.UUID
      },
      restrictions: {
        maxFileSize: 30000 * 1000000, //30g
        maxNumberOfFiles: 20,
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
      .use(Tus, { 
        endpoint: this.API_URL + "/uploads",
        resume: true,
        limit: 10,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
          'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization, Origin, Accept',
          'Access-Control-Allow-Credentials': false, // false cos of line 61
        },
        // I THINK THIS IS THE KING
        overridePatchMethod: true,
        // removeFingerprintOnSuccess: true; means a new upload if same file is uploaded again
      });

    this.uppyInstance.on('file-added', (file) => {
      console.log('new file added by uppy', file.name)
      this.onUploadStatusChange();
    })

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
    getFiles() {
      return this.uppyInstance.getFiles().map(f => {
        if (f.uploadURL) {
          f.uploadName = f.uploadURL.split("/").pop();
        }
        return f;
      });

      // return this.uppyInstance.getFiles();
    }
  }
};
</script>
