<template>
  <div>
    <div v-if="!reads || !reads.length">
      <p>
        No read files found for this run. This may be because processing is
        still in progress.
      </p>
      <p>
        If you believe this is an error, please
        <a :href="emailLink">contact an administrator</a>.
      </p>
    </div>
    <div v-else>
      <table class="table is-fullwidth is-striped is-hoverable is-size-7">
        <thead>
          <tr>
            <th>File Name</th>
            <th>MD5 Checksum Status</th>
            <th class="monospace-column">Original MD5</th>
            <th class="monospace-column">Destination MD5</th>
            <th class="has-text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="read in sortedReads" :key="read._id">
            <td>
              <b-icon icon="file-outline" size="is-small"></b-icon>
              <span class="ml-2">{{ read.file.originalName }}</span>
            </td>
            <td class="status-cell">
              <b-tooltip :label="md5Status(read).tooltip" position="is-top">
                <b-icon
                  :icon="md5Status(read).icon"
                  :type="md5Status(read).type"
                  size="is-small"
                ></b-icon>
                <span :class="`has-text-${md5Status(read).type.split('-')[1]}`">
                  {{ md5Status(read).text }}
                </span>
              </b-tooltip>
            </td>
            <td class="monospace-column">
              {{ read.md5 || "N/A" }}
            </td>
            <td class="monospace-column">
              {{ read.destinationMd5 || "Pending..." }}
            </td>
            <td class="has-text-right">
              <b-button
                size="is-small"
                icon-left="clipboard-text-outline"
                @click="copyPath(read.file.originalName)"
              >
                Copy Path
              </b-button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    reads: {
      type: Array,
      default: () => [],
    },
    runPath: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      datastoreRoot:
        process.env.HPC_DATASTORE_ROOT?.replace(/['"]+/g, "") || "",
    };
  },
  computed: {
    sortedReads() {
      // Create a shallow copy before sorting to avoid mutating props
      if (!this.reads) return [];
      return [...this.reads].sort((a, b) => {
        const nameA = a.file?.originalName || "";
        const nameB = b.file?.originalName || "";
        return nameA.localeCompare(nameB);
      });
    },
    emailLink() {
      const { path, query } = this.$route;
      const { id } = query;
      const trimmedPath = path.replace("/", "");

      const bodyTextUnformatted =
        `I am looking at a ${trimmedPath} with an ID of ${id}. ` +
        `I am concerned with the ${
          this.reads.length ? "" : "lack of "
        }read files listed. ` +
        `Could you investigate this please?`;

      const subject = "Issue with Komondor Files";
      const body = encodeURIComponent(bodyTextUnformatted);
      return `mailto:george.deeks@tsl.ac.uk?subject=${subject}&body=${body}`;
    },
  },
  methods: {
    md5Status(read) {
      if (!read.destinationMd5) {
        return {
          icon: "sync",
          type: "is-info",
          text: "Pending",
          tooltip: "Backend validation is in progress.",
        };
      }
      if (read.md5Mismatch) {
        return {
          icon: "alert-circle",
          type: "is-danger",
          text: "Mismatch",
          tooltip: "Checksums do not match. Contact an administrator.",
        };
      }
      return {
        icon: "check-circle",
        type: "is-success",
        text: "Match",
        tooltip: "Checksums match.",
      };
    },
    getFullFilePath(fileName) {
      // Simple path joining for browser environment
      const safeFileName = fileName.replace(/\s/g, "\\ ");
      return `${this.datastoreRoot}${this.runPath}/raw/${safeFileName}`;
    },
    copyPath(fileName) {
      const fullPath = this.getFullFilePath(fileName);
      this.$copyText(fullPath).then(
        () => {
          this.$buefy.toast.open({
            message: "File path copied to clipboard!",
            type: "is-success",
            position: "is-bottom",
          });
        },
        () => {
          this.$buefy.toast.open({
            message: "Failed to copy file path.",
            type: "is-danger",
            position: "is-bottom",
          });
        }
      );
    },
  },
};
</script>

<style scoped>
.monospace-column {
  font-family: monospace;
  word-break: break-all;
}
.status-cell span {
  vertical-align: middle;
  margin-left: 0.5em;
  font-weight: bold;
}
</style>
