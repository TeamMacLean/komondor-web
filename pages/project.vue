<template>
  <div class="section">
    <div class="container">
      <div v-if="project">
        <div class="title-wrapper">
          <div class="is-flex is-align-items-center is-flex-wrap-wrap">
            <div class="title mb-0">{{ project.name }}</div>
            <StorageBadge
              :storage="project.storage"
              size="is-medium"
              class="ml-3"
            />
          </div>
          <AddAccessionModal
            v-if="!!showAddAccession"
            type="project"
            :type-id="project._id"
            :initial-accessions="project.accessions"
            :initial-release-date="project.releaseDate"
          />
        </div>

        <StorageReadOnlyNotice
          v-if="storageDescription.readOnly"
          :storage="project.storage"
          class="mt-4"
        />

        <p class="subtitle">
          <nuxt-link
            :to="{ name: 'user', query: { username: project.owner } }"
            class="has-text-text"
          >
            <b-icon
              icon="account-outline"
              size="is-small"
              class="has-text-grey"
            ></b-icon>
            {{ project.owner }}
          </nuxt-link>
          <br />
          <b-icon
            icon="account-multiple-outline"
            size="is-small"
            class="has-text-grey"
          />
          {{ project.group.name }}
          <br />
          <b-icon icon="home-lock" size="is-small" class="has-text-grey" />
          Study accession numbers{{
            project.accessions.length
              ? `: ${project.accessions.join(", ")}`
              : ` unknown`
          }}
          <br />
          <b-icon
            icon="calendar-account"
            size="is-small"
            class="has-text-grey"
          />
          {{ enaInfo }}
        </p>

        <div
          v-if="showAdminEmailNudgeUpdateCheckbox"
          class="nudge-email-wrapper"
        >
          <div class="is-size-5">
            <b-icon
              icon="email-send-outline"
              size="is-small"
              class="has-text-grey"
            />
            Nudge emails (Admin-only)
          </div>

          <a @click="openModal"> I don't get this? </a>

          <b-modal :active.sync="isModalActive">
            <section class="modal-card-body custom-modal-text">
              <p>
                Admins for this site can set email 'nudge' reminders for
                projects that have not released their data to ENA.
              </p>
              <p>
                When enabled, the system will check daily to whether it needs to
                send reminder emails to TSL's ENA admins and persons responsible
                for the project.
              </p>
              <p>
                Emails are sent 2 years after project creation, and then every 6
                months thereafter. You can review when reminders have been sent
                in the 'Nudges Sent' section.
              </p>
              <p>
                All projects can have this feature toggled on/off, but it was
                initialised for all projects from 01-09-2021 onwards, and
                excluded for all 2Blades projects. When data is released to ENA,
                please toggle this off.
              </p>
            </section>
          </b-modal>

          <b-checkbox
            :value="projectNudgeable"
            class="nudge-email-label"
            :loading="loading"
            :disabled="loading"
            @input="updateDatabase"
          >
            Send emails to remind stakeholders to about ENA / release date for
            data.
          </b-checkbox>

          <div v-if="project.nudges.length">
            Nudges sent:
            <span v-for="(nudge, index) in project.nudges" :key="index">
              {{ new Date(nudge).toLocaleDateString()
              }}<span v-if="index < project.nudges.length - 1">,</span>
            </span>
          </div>
          <div v-else>No nudges sent for this project.</div>
        </div>

        <b-field label="Short Description">{{ project.shortDesc }}</b-field>
        <b-field label="Long Description">{{ project.longDesc }}</b-field>

        <b-field label="Additional files">
          <AdditionalFileList
            :files="additionalFiles"
            :location="fileLocation"
            :archived="isArchived"
            :read-only="storageDescription.readOnly"
          />
        </b-field>

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

        <hr />

        <p class="title is-4">Samples</p>
        <SampleList
          v-if="project.samples"
          :project="project"
          :samples="project.samples"
          :project-storage="project.storage"
          :show-new-button="!storageDescription.readOnly"
        />
      </div>
    </div>
  </div>
</template>

<script>
import SampleList from "../components/samples/SampleList.vue";
import AdditionalFileList from "../components/AdditionalFileList.vue";
import AddAccessionModal from "../components/AddAccessionModal.vue";
import StorageBadge from "~/components/storage/StorageBadge.vue";
import StorageReadOnlyNotice from "~/components/storage/StorageReadOnlyNotice.vue";
import { isEnaAdmin } from "~/utils/adminUsers";
import { getApiErrorMessage, getApiErrorStatus } from "~/utils/apiError";
import { describeStorage } from "~/utils/storageState";

export default {
  components: {
    SampleList,
    AdditionalFileList,
    AddAccessionModal,
    StorageBadge,
    StorageReadOnlyNotice,
  },
  middleware: ["auth"],

  asyncData({ route, $axios, error }) {
    if (!route.query.id) {
      error({ statusCode: 404, message: "Project not found" });
    }

    return $axios
      .get("/project", { params: { id: route.query.id } })
      .then((res) => {
        if (res.status === 200 && res.data.project) {
          const recordedAdditionalFiles =
            res.data.project.additionalFiles || [];
          const verifiedAdditionalFileNames = recordedAdditionalFiles.map(
            (rf) => rf.file.originalName
          );
          const actualAdditionalFileNames = res.data.actualAdditionalFiles;
          const additionalFilesWithVerifiedField = Array.isArray(
            actualAdditionalFileNames
          )
            ? actualAdditionalFileNames.map((additionalFileName) => ({
                fileName: additionalFileName,
                verified:
                  !!verifiedAdditionalFileNames.includes(additionalFileName),
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
            project: res.data.project,
            additionalFiles: additionalFilesWithVerifiedField,
            fileLocation: res.data.location || null,
            isModalActive: false,
            pendingChange: null,
            loading: false,
            projectNudgeable: res.data.project.nudgeable,
          };
        } else {
          error({ statusCode: 404, message: "Project not found" });
        }
      })
      .catch((err) => {
        console.error("Failed to load project:", err);
        // Was a flat 501 "Project not found" for every cause, including an
        // expired session and an unreachable API.
        error({
          statusCode: getApiErrorStatus(err) || 500,
          message: getApiErrorMessage(err, {
            fallback: "Could not load this project.",
          }),
        });
      });
  },
  computed: {
    storageDescription() {
      return describeStorage(this.project?.storage);
    },
    isArchived() {
      return this.storageDescription.authoritative === "s3";
    },
    locationLabel() {
      return this.fileLocation?.authoritative === "s3"
        ? "S3 location"
        : "HPC file path";
    },
    enaInfo() {
      if (!this.isSendingToEna) {
        return "Project not being sent to ENA";
      }

      const releaseDateText = this.project.releaseDate || "Unknown";

      return "ENA project release date: " + releaseDateText;
    },
    showAddAccession() {
      return isEnaAdmin(this?.$auth?.$state?.user?.username);
    },
    isSendingToEna() {
      const noBlockingOfSendingToEna = !this.project.doNotSendToEna;
      const isGroupThatNeverSubmitsToEna =
        this.project.group.name === "two_blades";
      const isSending =
        noBlockingOfSendingToEna && !isGroupThatNeverSubmitsToEna;
      return isSending;
    },
    showAdminEmailNudgeUpdateCheckbox() {
      if (!this.isSendingToEna) {
        return false;
      }
      // Unguarded before: an unset ENA_ADMINS threw a TypeError inside a
      // computed, which takes the whole page render down.
      return isEnaAdmin(this?.$auth?.$state?.user?.username);
    },
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
    openModal() {
      this.isModalActive = true;
    },
    updateDatabase() {
      this.loading = true;
      this.pendingChange = !this.projectNudgeable; // toggle the pendingChange instead

      return this.$axios
        .put(`/project/toggle-nudgeable`, {
          _id: this.project._id,
          nudgeable: this.pendingChange,
        })
        .then((res) => {
          if (res.status === 200) {
            this.projectNudgeable = this.pendingChange;
            this.$buefy.notification.open({
              message: "Changes successfully saved",
              type: "is-success",
              duration: 1700,
            });
            setTimeout(() => {
              // your code here will run after 1000 milliseconds
              this.loading = false;
            }, 1600);
          } else {
            throw new Error("Unexpected error");
          }
        })
        .catch((err) => {
          this.$buefy.notification.open({
            message: `Unexpected error: ${err}. Please try again or contact system admin.`,
            type: "is-danger",
            duration: 5000,
          });
        })
        .finally(() => {
          this.pendingChange = null;
        });
    },
  },
};
</script>
<style>
.title-wrapper {
  display: flex;
  justify-content: space-between;
}

.disable-emphasis-text {
  color: red;
  font-weight: bold;
  font-style: italic;
}

.nudge-email-wrapper {
  border: 1px solid #dbdbdb;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nudge-email-label {
  padding-bottom: 0.5rem;
  font-style: italic;
}

.custom-modal-text {
  font-size: 1.2rem;
  line-height: 1.5rem;
}

.custom-modal-text > * {
  padding-bottom: 1rem;
}

.location-text {
  overflow-wrap: anywhere;
}
</style>
