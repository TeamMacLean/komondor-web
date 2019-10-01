<template>
  <div>
    <div id="uppy-dashboard"></div>
  </div>
</template>

<script>
  import Uppy from '@uppy/core';
  import Dashboard from '@uppy/dashboard';
  import Tus from '@uppy/tus';
  import ThumbnailGenerator from '@uppy/thumbnail-generator';

  if (process.browser) {
    init();
  }

  function init() {
    // window.uploader = uploader;
  }

  export default {
    props: ['uploadID'],
    mounted() {


      const uppy = Uppy({
        debug: true,
        autoProceed: false,
        meta: {
          uploadID: this.uploadID
        },
        restrictions: {
          maxFileSize: 20000 * 1000000,
          maxNumberOfFiles: 999,
          minNumberOfFiles: 1,
          allowedFileTypes: ['image/*', 'video/*', '.lif']
        }
      })
        .use(ThumbnailGenerator, {
          thumbnailWidth: 200
        })
        .use(Dashboard, {
          proudlyDisplayPoweredByUppy: false,
          inline: true,
          // trigger: '#uppy-trigger',
          target: '#uppy-dashboard',
          // // replaceTargetContent: true,
          showProgressDetails: true,
          // height: 470,
          metaFields: [
            {id: 'name', name: 'Name', placeholder: 'file name'},
            {id: 'description', name: 'Description', placeholder: 'describe what the image/video'},
          ],
          // browserBackButtonClose: true
        })
        // .use(Tus, {endpoint: '/api/files/'});
    .use(Tus, {endpoint: '/api/uploads/'});

      uppy.on('complete', result => {
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
</script>
