<template>
  <div>
    <div v-if="!uploadID">ERROR! no uploadUD</div>
    <div v-if="uploadID" :class="[uppyId]"></div>
  </div>
</template>

<script>
    import Uppy from '@uppy/core';
    import Dashboard from '@uppy/dashboard';
    import Tus from '@uppy/tus';
    import ThumbnailGenerator from '@uppy/thumbnail-generator';

    export default {
        props: ['uploadID'],

        data() {
            console.log(process);
            return {
                API_URL:process.env.API_URL,
                uppyInstance: null,
                uppyId: `uppy-${this.uploadID}`
            }
        },
        mounted() {
            if (this.uploadID) {

                console.log('end point will be', this.API_URL + '/uploads');
                this.uppyInstance = Uppy({
                    debug: true,
                    autoProceed: false,
                    id: `uppy-${this.uppyId}`,
                    meta: {
                        uploadID: this.uploadID
                    },
                    restrictions: {
                        maxFileSize: 30000 * 1000000, //30g
                        maxNumberOfFiles: 999,
                        minNumberOfFiles: 0,
                        // allowedFileTypes: ['image/*', 'video/*', '.lif']
                    }
                })
                    .use(ThumbnailGenerator, {
                        thumbnailWidth: 200
                    })
                    .use(Dashboard, {
                        proudlyDisplayPoweredByUppy: false,
                        // inline: true,
                        id: `dash-${this.uppyId}`,
                        // target: `${this.uppyId}`,
                        // trigger: false,
                        // showProgressDetails: true,
                        // metaFields: [
                        //     {id: 'name', name: 'Name', placeholder: 'file name'},
                        //     {id: 'description', name: 'Description', placeholder: 'describe what the file'},
                        // ],
                        // browserBackButtonClose: true
                        // trigger: '.UppyModalOpenerBtn',
                        inline: true,
                        target: `.${this.uppyId}`,
                        replaceTargetContent: true,
                        showProgressDetails: true,
                        note: 'Images and video only, 2–3 files, up to 1 MB',
                        height: 470,
                        metaFields: [
                            {id: 'name', name: 'Name', placeholder: 'file name'},
                            // { id: 'caption', name: 'Caption', placeholder: 'describe what the image is about' }
                        ],
                        browserBackButtonClose: true
                    })
                    .use(Tus, {endpoint: this.API_URL + '/uploads'});

                this.uppyInstance.on('complete', result => {
                    console.log('successful files:', result.successful);
                    console.log('failed files:', result.failed);

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
        }
    }
</script>
