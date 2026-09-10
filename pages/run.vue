<template>
  <div class="section">
    <div class="container">
      <div v-if="run">
        <div class="title-wrapper">
          <div class="is-flex is-align-items-center">
            <h1 class="title mb-0">{{ run.name }}</h1>
            <b-tag
              v-if="md5Status.show"
              :type="md5Status.type"
              size="is-medium"
              class="ml-3"
            >
              <b-icon
                :icon="md5Status.icon"
                size="is-small"
                class="mr-1"
              ></b-icon>
              {{ md5Status.text }}
            </b-tag>
            <StorageBadge
              :storage="projectStorage"
              size="is-medium"
              class="ml-3"
            />
          </div>
          <AddAccessionModal
            v-if="showAddAcession"
            type="run"
            :type-id="run._id"
            :initial-accessions="run.accessions"
          />
        </div>

        <StorageReadOnlyNotice
          v-if="storageDescription.readOnly"
          :storage="projectStorage"
          class="mt-4"
        />

        <p class="subtitle mt-2">
          <b-icon
            icon="account-outline"
            size="is-small"
            class="has-text-grey"
          ></b-icon>
          {{ run.owner }}
          <br />
          <b-icon
            icon="account-multiple-outline"
            size="is-small"
            class="has-text-grey"
          ></b-icon>
          {{ run.group.name }}
          <br />
          <nuxt-link
            :to="{ name: 'sample', query: { id: run.sample._id } }"
            class="has-text-text"
          >
            <b-icon
              icon="flask-outline"
              size="is-small"
              class="has-text-grey"
            ></b-icon>
            {{ run.sample.name }}
          </nuxt-link>
          <br />
          <b-icon icon="home-lock" size="is-small" class="has-text-grey" />
          Run accession numbers:{{
            run.accessions.length ? ` ${run.accessions.join(", ")}` : ` unknown`
          }}
        </p>

        <div
          v-if="run.status === 'error'"
          class="notification is-danger is-light"
        >
          <b-icon icon="alert-circle-outline"></b-icon>
          An error occurred during file processing or MD5 checksum validation.
          Please review the raw file statuses below and contact a system
          administrator for assistance.
        </div>

        <div v-if="!storageDescription.readOnly" class="buttons-wrapper">
          <b-button
            type="is-secondary"
            icon-left="content-copy"
            @click="cloneRun"
          >
            Clone data for new Run
          </b-button>
        </div>

        <div class="columns">
          <div class="column">
            <b-field label="Sequencing Provider">
              <p>{{ run.sequencingProvider }}</p>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Sequencing Technology">
              <p>{{ run.sequencingTechnology }}</p>
            </b-field>
          </div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field label="Library Source">
              <p>{{ run.librarySource }}</p>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Library Selection">
              <p>{{ run.librarySelection }}</p>
            </b-field>
          </div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field label="Library Type">
              <p>{{ run.libraryType }}</p>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Library Strategy">
              <p>{{ run.libraryStrategy }}</p>
            </b-field>
          </div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field label="Insert Size">
              <p class="bottomPadding">
                {{ insertSizeString }}
              </p>
            </b-field>
          </div>
        </div>

        <b-field :label="locationLabel">
          <div v-if="fileLocation && fileLocation.baseUri">
            <code class="location-text">{{ fileLocation.baseUri }}</code>
            <b-button
              size="is-small"
              icon-left="clipboard-text-outline"
              class="ml-2"
              @click="copyLocation(fileLocation.baseUri)"
            >
              Copy
            </b-button>
          </div>
          <p v-else class="has-text-danger">Storage location unavailable</p>
        </b-field>
        <b-field
          v-if="fileLocation && fileLocation.plannedS3Uri"
          label="Planned S3 location (not yet verified)"
        >
          <code class="location-text">{{ fileLocation.plannedS3Uri }}</code>
        </b-field>

        <div class="bottomPadding"></div>

        <b-field label="Additional Files">
          <AdditionalFileList
            :files="additionalFiles"
            :location="fileLocation"
            :archived="isArchived"
            :read-only="storageDescription.readOnly"
          />
        </b-field>

        <div class="bottomPadding"></div>

        <b-field label="Raw Files">
          <ReadList
            :reads="run.rawFiles"
            :location="fileLocation"
            :allowed-extensions="libraryTypeExtensions"
            :run-status="run.status"
            :archived="isArchived"
            :read-only="storageDescription.readOnly"
          />
        </b-field>
        <hr />
      </div>
    </div>
  </div>
</template>

<script>
import AdditionalFileList from "../components/AdditionalFileList.vue";
import ReadList from "../components/ReadList.vue";
import AddAccessionModal from "../components/AddAccessionModal.vue";
import StorageBadge from "~/components/storage/StorageBadge.vue";
import StorageReadOnlyNotice from "~/components/storage/StorageReadOnlyNotice.vue";
import { isEnaAdmin } from "~/utils/adminUsers";
import { getApiErrorMessage, getApiErrorStatus } from "~/utils/apiError";
import { describeStorage } from "~/utils/storageState";

export default {
  components: {
    AdditionalFileList,
    ReadList,
    AddAccessionModal,
    StorageBadge,
    StorageReadOnlyNotice,
  },
  middleware: ["auth"],
  async asyncData({ route, $axios, error }) {
    if (!route.query.id) {
      return error({ statusCode: 404, message: "Run ID not provided" });
    }
    try {
      const response = await $axios.get("/run", {
        params: { id: route.query.id },
      });
      const runData = response.data.run;

      // This logic compares DB records with actual files on disk.
      // It's useful for detecting orphaned files but can be simplified if the API is the single source of truth.
      const recordedAdditionalFiles = runData.additionalFiles || [];
      const verifiedAdditionalFileNames = recordedAdditionalFiles.map(
        (af) => af.file.originalName
      );
      const actualAdditionalFileNames = response.data.actualAdditionalFiles;
      const additionalFiles = Array.isArray(actualAdditionalFileNames)
        ? actualAdditionalFileNames.map((fileName) => ({
            fileName,
            verified: verifiedAdditionalFileNames.includes(fileName),
          }))
        : recordedAdditionalFiles
            .map((additionalFile) => ({
              _id: additionalFile._id,
              fileName: additionalFile.file?.originalName,
              verified: true,
              archived: true,
            }))
            .filter((additionalFile) => additionalFile.fileName);

      return {
        run: runData,
        additionalFiles: additionalFiles,
        fileLocation: response.data.location || null,
      };
    } catch (err) {
      console.error("Failed to fetch run data:", err);
      // Was a flat 500 for every cause, so a 404 or an expired session read as
      // a server fault.
      return error({
        statusCode: getApiErrorStatus(err) || 500,
        message: getApiErrorMessage(err, {
          fallback: "Could not retrieve this run.",
        }),
      });
    }
  },
  data() {
    return {
      polling: null,
    };
  },
  computed: {
    projectStorage() {
      return (
        this.run?.projectStorage ||
        this.run?.sample?.projectStorage ||
        this.run?.sample?.project?.storage ||
        null
      );
    },
    storageDescription() {
      return describeStorage(this.projectStorage);
    },
    isArchived() {
      return this.storageDescription.authoritative === "s3";
    },
    locationLabel() {
      return this.fileLocation?.authoritative === "s3"
        ? "S3 location"
        : "HPC file path";
    },
    libraryTypeExtensions() {
      // Get the allowed extensions for this run's library type
      if (!this.run?.libraryType) return [];
      const libraryTypes = this.$store.state.libraryTypes || [];
      const libraryType = libraryTypes.find(
        (lt) => lt.value === this.run.libraryType
      );
      return libraryType?.extensions || [];
    },
    runStatus() {
      if (!this.run || !this.run.status) {
        return { text: "Unknown", type: "is-light", icon: "help-circle" };
      }
      switch (this.run.status) {
        case "pending":
          return {
            text: "Processing",
            type: "is-info",
            icon: "sync",
          };
        case "complete":
          return {
            text: "Complete",
            type: "is-success",
            icon: "check-circle",
          };
        case "error":
          return {
            text: "Error",
            type: "is-danger",
            icon: "alert-circle",
          };
        default:
          return {
            text: this.run.status,
            type: "is-light",
            icon: "help-circle",
          };
      }
    },
    md5Status() {
      if (!this.run || !this.run.md5VerificationStatus) {
        return { show: false };
      }
      if (this.storageDescription.readOnly) {
        if (this.run.md5VerificationStatus === "complete") {
          return {
            show: true,
            text: "Checksums verified before archive",
            type: "is-success",
            icon: "check-circle",
          };
        }
        if (this.run.md5VerificationStatus === "failed") {
          return {
            show: true,
            text: "Checksum verification failed before archive",
            type: "is-danger",
            icon: "alert-circle",
          };
        }
        return { show: false };
      }
      switch (this.run.md5VerificationStatus) {
        case "pending":
        case "in_progress":
          return {
            show: true,
            text: "Verifying Checksums...",
            type: "is-warning",
            icon: "clock-outline",
          };
        case "failed":
          return {
            show: true,
            text: "Checksum Verification Failed",
            type: "is-danger",
            icon: "alert-circle",
          };
        case "complete":
          return {
            show: true,
            text: "Checksums Verified",
            type: "is-success",
            icon: "check-circle",
          };
        default:
          return { show: false };
      }
    },
    insertSizeString() {
      const insertSize = this.run.insertSize;
      return insertSize == null ? "(not set)" : insertSize.toString();
    },
    showAddAcession() {
      return isEnaAdmin(this?.$auth?.$state?.user?.username);
    },
  },
  async created() {
    // Ensure library types are loaded for extension checking
    await this.$store.dispatch("refreshOptions");
  },
  mounted() {
    if (
      !this.storageDescription.readOnly &&
      this.run &&
      (this.run.status === "pending" ||
        this.run.md5VerificationStatus === "pending" ||
        this.run.md5VerificationStatus === "in_progress")
    ) {
      this.startPolling();
    }
  },
  beforeDestroy() {
    this.stopPolling();
  },
  methods: {
    copyLocation(value) {
      return this.$copyText(value).then(
        () =>
          this.$buefy.toast.open({
            message: "Storage location copied to clipboard!",
            type: "is-success",
            position: "is-bottom",
          }),
        () =>
          this.$buefy.toast.open({
            message: "Failed to copy storage location.",
            type: "is-danger",
            position: "is-bottom",
          })
      );
    },
    cloneRun() {
      this.$router.push({
        path: "/runs/new",
        query: {
          clonedRunId: this.run._id,
          sample: this.run.sample._id,
        },
      });
    },
    startPolling() {
      // Poll every 5 seconds
      this.polling = setInterval(() => {
        this.fetchRunStatus();
      }, 5000);
    },
    stopPolling() {
      if (this.polling) {
        clearInterval(this.polling);
        this.polling = null;
      }
    },
    async fetchRunStatus() {
      try {
        const response = await this.$axios.get("/run", {
          params: { id: this.run._id },
        });
        const updatedRun = response.data.run;
        this.fileLocation = response.data.location || this.fileLocation;

        const wasPending = this.run.status === "pending";
        const wasMd5Pending =
          this.run.md5VerificationStatus === "pending" ||
          this.run.md5VerificationStatus === "in_progress";

        this.run = updatedRun;

        const updatedStorage =
          updatedRun.projectStorage ||
          updatedRun.sample?.projectStorage ||
          updatedRun.sample?.project?.storage ||
          null;
        if (describeStorage(updatedStorage).readOnly) {
          this.stopPolling();
          return;
        }

        const isNowComplete = updatedRun.status !== "pending";
        const isMd5NowComplete =
          updatedRun.md5VerificationStatus === "complete" ||
          updatedRun.md5VerificationStatus === "failed";

        if (wasPending && isNowComplete) {
          this.$buefy.toast.open({
            message: `Run file processing updated to: ${updatedRun.status}`,
            type: updatedRun.status === "complete" ? "is-success" : "is-danger",
          });
        }

        if (wasMd5Pending && isMd5NowComplete) {
          this.$buefy.toast.open({
            message: `Run checksum verification updated to: ${updatedRun.md5VerificationStatus}`,
            type:
              updatedRun.md5VerificationStatus === "complete"
                ? "is-success"
                : "is-danger",
          });
        }

        // Only stop polling when BOTH operations are finished (if they apply)
        if (isNowComplete && isMd5NowComplete) {
          this.stopPolling();
        }
      } catch (err) {
        console.error("Polling error:", err);
        this.stopPolling(); // Stop polling on error to avoid spamming requests
      }
    },
  },
};
</script>

<style scoped>
.bottomPadding {
  margin-bottom: 2rem;
}
.title-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.buttons-wrapper {
  margin-bottom: 2rem;
}
.location-text {
  overflow-wrap: anywhere;
}
</style>
