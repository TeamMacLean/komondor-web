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
    };
  },
  computed: {
    readExtensions() {
      // console.log('computed store', this.$nuxt.context.store.state.libraryTypes, 'arrayed', JSON.parse(JSON.stringify(this.$nuxt.context.store.state.libraryTypes)))

      const libraryTypes = JSON.parse(JSON.stringify(this.$nuxt.context.store.state.libraryTypes))
      const mappedExtensions = libraryTypes.map(t => t.extensions)
      function flatten(arr) {
        return arr.reduce(function (flat, toFlatten) {
          return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
        }, []);
      }
      const flatExtensions = flatten(mappedExtensions)
      console.log('Read extensions', flatExtensions);
      
      return flatExtensions;
    },
  },
  mounted() {    
    this.uppyInstance = Uppy({
      debug: true,
      //store: new DefaultStore(),
      autoProceed: true,
      allowMultipleUploads: true,
      id: `uppy-${this.uppyId}`,
      // onBeforeUpload: (currentFile, files) => {
      //   console.log('onBeforeUpload, currentFileInfo:', currentFile, 'currentFiles', files);        
      // },
      onBeforeFileAdded: (currentFile, files) => {
        var errorMsg = '';
        
        if (!this.readExtensions.length){
          return true;
        }
                
        const currentFileName = currentFile.name
        const extensionStartIndex = currentFileName.indexOf('.');

        if (extensionStartIndex === -1){
          return true
        }
        const extension = currentFileName.substring(extensionStartIndex, currentFileName.length)
        
        const extensionProbablyAReadFile = this.readExtensions.some(readExt => {
          return extension.includes(readExt);
        });        

        if (extensionProbablyAReadFile){
          errorMsg = 'Upload cancelled - we detect you are trying to add a read file to additional files uploader'
        }
        
        if (errorMsg){
          this.$buefy.dialog.alert({
            title: "Error",
            message: errorMsg,
            type: "is-danger",
            hasIcon: false
          });
          return false;
        }

        return true;       
      },
      // meta: {
        // uploadID: this.uploadID,
        // UUID: this.UUID
      // },
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
        retryDelays: [0, 1000, 3000, 5000], // default [0, 1000, 3000, 5000]
        headers: {
          'Access-Control-Allow-Origin': '*',
          // 'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS, PUT, PATCH, DELETE',
          // 'Access-Control-Allow-Headers': 'Authorization,Accept,Origin,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modif',
          //'Access-Control-Allow-Credentials': false, // false cos of line 65
          // 'X-HTTP-Method-Override': 'PATCH',
        },
        //overridePatchMethod: true,
        // removeFingerprintOnSuccess: true; means a new upload if same file is uploaded again
      });

    this.uppyInstance.on('file-added', (file) => {
      console.log('file-added event for:', file.name)
      // this.onUploadStatusChange();
    })
    this.uppyInstance.on('file-removed', (file, reason) => {
      console.log('file-removed event for:', file.name, 'reason:', reason)
    })
    this.uppyInstance.on('upload', (data) => {
      const { id, fileIDs } = data;
      console.log(`Starting upload ${id} for files ${fileIDs}`)
    })
    this.uppyInstance.on('progress', (progress) => {
      console.log('progress update:', progress)
    })
    this.uppyInstance.on('upload-progress', (file, progress) => {
      const { name } = file;
      const { uploader, bytesUploaded, bytesTotal } = progress;
      console.log(
        'upload-progress event:' + `${Math.round((bytesUploaded / bytesTotal) * 100)}% uploaded (${bytesUploaded}/${bytesTotal} bytes)`
      );
    })
    this.uppyInstance.on('upload-success', (file, response) => {
      console.log('upload-success for:', file && file.name, 'response URL:', response && response.uploadURL)
    })
    this.uppyInstance.on('complete', (result) => {
      console.log('completed event, success and fails:')
      console.log('successful files:', result.successful.map(f => `${f.name}`))
      
      console.log('failed files:', result.failed)
    })
    this.uppyInstance.on('error', (error) => {
      console.log(error.stack)

      console.error(error.stack)
    })
    this.uppyInstance.on('upload-error', (file, error, response) => {
      console.log('upload error event! with file:', file)
      console.log('error message for this:', error)
      response && console.log('response obj', response);
      if (error.isNetworkError){
        console.log('we know its a network error, George');
      }      
    })
    this.uppyInstance.on('upload-retry', (fileID) => {
      console.log('upload retried event:', fileID)
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
<style scoped>
</style>

