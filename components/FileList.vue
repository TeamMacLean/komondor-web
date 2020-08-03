<template>
  <div>
    <!-- if addiditional ul/li -->
    <div v-if="additional">
      <ul>
        <li v-for="file in files" :key="file._id">
          <div class="fileInfo">
            <b-icon icon="file-outline" size="is-small"></b-icon>

            <div class="rightPadding">{{file.file.originalName}}</div>

            <b-button type="button"
              v-clipboard:copy="file.file.path"
              v-clipboard:success="onCopy"
              v-clipboard:error="onError"
            >
                Copy filepath
            </b-button>
          </div>        
          
        </li>
      </ul>
    </div>
    <div v-else>
      <!-- TODO sort paired -->
      <div v-for="file in files" :key="file._id" class="card">
        <div class="card-content">{{file.file.originalName}}</div>
      </div>
    </div>
    <!-- if sequences cards -->
  </div>
</template>

<script>
export default {
  methods: {
    onCopy: function (e) {
      alert('You just copied onto your clipboard: ' + e.text)
    },
    onError: function (e) {
      alert('Failed to copy texts')
    }
  },
  props: ["additional", "files"]
  // computed: {
  //   sortedRaw() {
  //     const sortedRaw = [];
  //     if (!this.additional && this.files.length) {
  //       const firstFileHasRowID = this.files[0].rowID;

  //       if (firstFileHasRowID) {
  //         //TODO sort them!
  //         this.files.map(file => {
  //           if (sortedRaw[file.rowID]) {
  //             sortedRaw[file.rowID].push(file);
  //           } else {
  //             sortedRaw[file.rowID] = [file];
  //           }
  //         });
  //         return sortedRaw;
  //       } else {
  //         return null;
  //       }
  //     } else {
  //       return null;
  //     }
  //   }
  // }
};
</script>

<style>

.fileInfo {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.rightPadding {
  margin-right: 10px;
}

</style>