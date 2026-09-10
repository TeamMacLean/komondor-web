<template>
  <div v-if="!files.length">
    <p v-if="readOnly">No additional files were recorded.</p>
    <p v-else>
      No additional files detected in HPC. (Try refreshing if recently
      uploaded.)
    </p>
    <p v-if="!readOnly">
      If you think this is in error, please
      <a :href="emailLink">contact admin</a>
      to resolve this issue.
    </p>
  </div>
  <div v-else>
    <div>
      <ul>
        <li v-for="file in files" :key="file._id || file.fileName">
          <div class="fileInfo">
            <b-tooltip
              v-if="file.verified"
              position="is-right"
              :label="
                archived
                  ? 'Archived file recorded in the database'
                  : 'Additional file verified in database'
              "
            >
              <b-icon type="is-success" icon="check" size="is-small"></b-icon>
            </b-tooltip>
            <!-- <b-tooltip v-else label='File unver'>
              <b-icon icon="close" type="is-danger" size="is-small"></b-icon>
            </b-tooltip> -->
            <b-icon
              v-else
              icon="close"
              type="is-white"
              size="is-small"
            ></b-icon>
            <b-icon icon="file-outline" size="is-small"></b-icon>

            <div class="fileNamePadding">{{ file.fileName }}</div>

            <b-button
              :disabled="!getFullFilePath(file.fileName)"
              type="button"
              @click="copyPath(file.fileName)"
            >
              {{ copyButtonLabel }}
            </b-button>
          </div>
        </li>
      </ul>
    </div>
    <!-- <div v-else>
      <-- TODO sort paired 
      <div v-for="file in files" :key="file._id">
        <div class="fileInfo">
          <b-icon icon="file-outline" size="is-small"></b-icon>

          <div class="fileNamePadding">{{file.file.originalName}}</div>

          <b-button type="button"
            v-clipboard:copy="getFullFilePath(file.file.path)"
            v-clipboard:success="onCopy"
            v-clipboard:error="onError"
          >
            Copy HPC filepath
          </b-button>
        </div> 
      </div>
    <-- if sequences cards 
    </div> -->
  </div>
</template>

<script>
export default {
  props: {
    files: {
      type: Array,
      default: () => [],
    },
    location: {
      type: Object,
      default: null,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    copyButtonLabel() {
      return this.location?.authoritative === "s3"
        ? "Copy S3 location"
        : "Copy HPC filepath";
    },
    emailLink() {
      const { path, query } = this.$route;
      const { id } = query;
      const trimmedPath = path.replace("/", "");

      const bodyTextUnformatted =
        "I am looking at a " +
        trimmedPath +
        " with an ID of " +
        id +
        ". " +
        "I am concerned with the " +
        `${this.files.length ? "" : "lack of"} additional files listed. ` +
        "I believe the website might be out of sync with the HPC/ISOLON." +
        " Could you investigate this please?";
      const bodyText = bodyTextUnformatted.replace(" ", "%20");
      const result =
        "mailto:george.deeks@tsl.ac.uk?subject=Issue%20with%20missing%20Komondor%20files&body=" +
        bodyText;
      return result;
    },
  },
  methods: {
    getFullFilePath: function (fileName) {
      const baseUri = this.location?.additionalUri;
      if (!baseUri || !fileName) return "";
      return `${baseUri.replace(/\/$/, "")}/${fileName}`;
    },
    copyPath(fileName) {
      const fullPath = this.getFullFilePath(fileName);
      if (!fullPath) return;

      this.$copyText(fullPath).then(
        () => {
          this.$buefy.toast.open({
            message: "File location copied to clipboard!",
            type: "is-success",
            position: "is-bottom",
          });
        },
        () => {
          this.$buefy.toast.open({
            message: "Failed to copy file location.",
            type: "is-danger",
            position: "is-bottom",
          });
        }
      );
    },
  },
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

.fileNamePadding {
  margin-right: 15px;
  margin-left: 5px;
}
</style>
