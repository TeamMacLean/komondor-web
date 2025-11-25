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
            <th>MD5 Status</th>
            <th class="monospace-column">Original MD5</th>
            <th class="monospace-column">Destination MD5</th>
            <th>Paired</th>
            <th>Index</th>
            <th class="has-text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="read in sortedReads" :key="read._id">
            <td>
              <b-icon icon="file-outline" size="is-small"></b-icon>
              <span class="ml-2">{{ read.file.originalName }}</span>
              <b-tag
                v-if="!isAllowedExtension(read.file.originalName)"
                type="is-light"
                size="is-small"
                class="ml-2"
              >
                auxiliary
              </b-tag>
            </td>
            <td class="status-cell">
              <b-tooltip
                :label="md5Status(read).tooltip"
                position="is-top"
                multilined
              >
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
              <span v-if="read.MD5" class="md5-text">{{ read.MD5 }}</span>
              <span v-else class="has-text-grey-light is-italic"
                >Not provided</span
              >
            </td>
            <td class="monospace-column">
              <span
                v-if="!isAllowedExtension(read.file.originalName)"
                class="has-text-grey-light"
                >—</span
              >
              <span v-else-if="!read.MD5" class="has-text-grey-light">—</span>
              <span v-else-if="read.destinationMd5" class="md5-text">{{
                read.destinationMd5
              }}</span>
              <span
                v-else-if="runStatus === 'pending'"
                class="has-text-info is-italic"
              >
                <b-icon
                  icon="sync"
                  size="is-small"
                  custom-class="fa-spin"
                ></b-icon>
                Calculating...
              </span>
              <span v-else class="has-text-warning is-italic"
                >Awaiting check</span
              >
            </td>
            <td>
              <b-tooltip
                v-if="read.paired && getSiblingName(read)"
                :label="`Paired with: ${getSiblingName(read)}`"
                position="is-top"
              >
                <b-icon
                  icon="link-variant"
                  size="is-small"
                  type="is-info"
                ></b-icon>
              </b-tooltip>
              <b-icon
                v-else-if="read.paired"
                icon="link-variant"
                size="is-small"
                type="is-info"
              ></b-icon>
              <span v-else class="has-text-grey-light">—</span>
            </td>
            <td>
              <b-tooltip
                v-if="read.indexed"
                label="This is the index file"
                position="is-top"
              >
                <b-icon
                  icon="file-star"
                  size="is-small"
                  type="is-warning"
                ></b-icon>
              </b-tooltip>
              <span v-else class="has-text-grey-light">—</span>
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

      <!-- Legend -->
      <div class="mt-4 is-size-7 legend-box">
        <p class="has-text-weight-semibold mb-2">Status Legend:</p>
        <div class="columns is-multiline is-mobile">
          <div class="column is-narrow">
            <b-icon
              icon="check-circle"
              type="is-success"
              size="is-small"
            ></b-icon>
            <span class="ml-1">Verified</span>
          </div>
          <div class="column is-narrow">
            <b-icon icon="sync" type="is-info" size="is-small"></b-icon>
            <span class="ml-1">Checking</span>
          </div>
          <div class="column is-narrow">
            <b-icon
              icon="clock-outline"
              type="is-warning"
              size="is-small"
            ></b-icon>
            <span class="ml-1">Awaiting</span>
          </div>
          <div class="column is-narrow">
            <b-icon
              icon="alert-circle"
              type="is-danger"
              size="is-small"
            ></b-icon>
            <span class="ml-1">Mismatch</span>
          </div>
          <div class="column is-narrow">
            <b-icon
              icon="minus-circle-outline"
              type="is-light"
              size="is-small"
            ></b-icon>
            <span class="ml-1">No MD5</span>
          </div>
          <div class="column is-narrow">
            <b-icon
              icon="file-cancel-outline"
              type="is-light"
              size="is-small"
            ></b-icon>
            <span class="ml-1">N/A</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { CHECKSUM_EXTENSIONS } from "~/utils/constants";

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
    allowedExtensions: {
      type: Array,
      default: () => [],
    },
    runStatus: {
      type: String,
      default: null,
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
      if (!this.reads) return [];
      return [...this.reads].sort((a, b) => {
        const nameA = a.file?.originalName || "";
        const nameB = b.file?.originalName || "";
        return nameA.localeCompare(nameB);
      });
    },
    // Create a map of read IDs to file names for sibling lookup
    readIdToFileName() {
      const map = {};
      if (this.reads) {
        this.reads.forEach((read) => {
          if (read._id && read.file?.originalName) {
            map[read._id] = read.file.originalName;
          }
        });
      }
      return map;
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
    isChecksumFile(fileName) {
      if (!fileName) return false;
      const lowerFileName = fileName.toLowerCase();
      return CHECKSUM_EXTENSIONS.some((ext) => lowerFileName.endsWith(ext));
    },
    isAllowedExtension(fileName) {
      if (!fileName) return false;
      if (this.isChecksumFile(fileName)) return false;
      if (!this.allowedExtensions || this.allowedExtensions.length === 0)
        return true;

      const lowerFileName = fileName.toLowerCase();
      return this.allowedExtensions.some((ext) =>
        lowerFileName.endsWith(ext.toLowerCase())
      );
    },
    getSiblingName(read) {
      // sibling is stored as an ObjectId reference
      if (!read.sibling) return null;

      // If sibling is populated (object with file), get the name directly
      if (typeof read.sibling === "object" && read.sibling.file?.originalName) {
        return read.sibling.file.originalName;
      }

      // If sibling is just an ID string, look it up in our map
      const siblingId =
        typeof read.sibling === "object" ? read.sibling._id : read.sibling;
      return this.readIdToFileName[siblingId] || null;
    },
    md5Status(read) {
      const fileName = read.file?.originalName || "";

      // 1. Auxiliary file - not in allowed extensions
      if (!this.isAllowedExtension(fileName)) {
        return {
          icon: "file-cancel-outline",
          type: "is-light",
          text: "N/A",
          tooltip:
            "Auxiliary file type - MD5 validation not required for this file extension.",
        };
      }

      // 2. No original MD5 was provided
      if (!read.MD5) {
        return {
          icon: "minus-circle-outline",
          type: "is-light",
          text: "No MD5",
          tooltip:
            "No MD5 checksum was provided when this file was uploaded. Cannot verify integrity.",
        };
      }

      // 3. Run is processing and destination MD5 not yet calculated
      if (!read.destinationMd5 && this.runStatus === "pending") {
        return {
          icon: "sync",
          type: "is-info",
          text: "Checking...",
          tooltip:
            "The system is currently calculating the MD5 checksum of this file after transfer.",
        };
      }

      // 4. Has original MD5 but destination not yet checked
      if (!read.destinationMd5) {
        return {
          icon: "clock-outline",
          type: "is-warning",
          text: "Awaiting",
          tooltip:
            "MD5 checksum was provided but the system has not yet verified it. This may indicate a processing issue.",
        };
      }

      // 5. Checksums don't match - ERROR
      if (read.md5Mismatch === true) {
        return {
          icon: "alert-circle",
          type: "is-danger",
          text: "Mismatch",
          tooltip: `CHECKSUM MISMATCH! The file may be corrupted.\n\nOriginal: ${read.MD5}\nDestination: ${read.destinationMd5}\n\nPlease contact an administrator.`,
        };
      }

      // 6. Checksums match - SUCCESS
      const lastChecked = read.MD5LastChecked
        ? new Date(read.MD5LastChecked).toLocaleString()
        : "Unknown";
      return {
        icon: "check-circle",
        type: "is-success",
        text: "Verified",
        tooltip: `File integrity verified - checksums match.\n\nMD5: ${read.MD5}\nChecked: ${lastChecked}`,
      };
    },
    getFullFilePath(fileName) {
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
  font-size: 0.75rem;
  word-break: break-all;
}
.md5-text {
  font-family: monospace;
  font-size: 0.7rem;
}
.status-cell span {
  vertical-align: middle;
  margin-left: 0.5em;
  font-weight: bold;
}
.legend-box {
  background-color: #f5f5f5;
  padding: 0.75rem 1rem;
  border-radius: 4px;
}
</style>
