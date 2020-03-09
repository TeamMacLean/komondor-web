<template>
  <div>
    <!-- if addiditional ul/li -->
    <div v-if="additional">
      <ul>
        <li v-for="file in files" :key="file._id">
          <b-icon icon="file-outline" size="is-small"></b-icon>
          <a href="#">{{file.originalName}}</a>
        </li>
      </ul>
    </div>
    <div v-else>
      <!-- TODO sort paired -->
      <div v-for="file in files" :key="file._id" class="card">
        <div class="card-content">{{file.originalName}}</div>
      </div>
    </div>
    <!-- if sequences cards -->
  </div>
</template>

<script>
export default {
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