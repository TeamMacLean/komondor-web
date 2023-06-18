<template>
  <div class="section">
    <div class="container">
      <div v-if="project">
        <div class="title-wrapper">
          <div class="title">
            <!-- <b-icon icon="folder-text-outline" size="is-small" class="has-text-grey" /> -->
            {{ project.name }}
          </div>
          <AddAccessionModal
            v-if="!!showAddAccession"
            type="project"
            :type-id="project._id"
            :initial-accessions="project.accessions"
            :initial-release-date="project.releaseDate"
          />
        </div>

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
          ENA project release date:{{
            project.releaseDate ? ` ${project.releaseDate}` : ` unknown`
          }}
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
            :parent-path="project.path"
          />
        </b-field>

        <hr />

        <p class="title is-4">Samples</p>
        <SampleList
          v-if="project.samples"
          :project="project"
          :samples="project.samples"
          show-new-button="true"
        />
      </div>
    </div>
  </div>
</template>

<script>
import SampleList from "../components/samples/SampleList";
import AdditionalFileList from "../components/AdditionalFileList";
import AddAccessionModal from "../components/AddAccessionModal";
export default {
  components: { SampleList, AdditionalFileList, AddAccessionModal },
  middleware: ["auth"],

  asyncData({ route, $axios, error }) {
    if (!route.query.id) {
      error({ statusCode: 404, message: "Project not found" });
    }

    return $axios
      .get("/project", { params: { id: route.query.id } })
      .then((res) => {
        if (res.status === 200 && res.data.project) {
          const verifiedAdditionalFileNames =
            res.data.project.additionalFiles.map((rf) => rf.file.originalName);
          const actualAdditionalFileNames = res.data.actualAdditionalFiles
            ? JSON.parse(JSON.stringify(res.data.actualAdditionalFiles))
            : [];
          const additionalFilesWithVerifiedField =
            actualAdditionalFileNames.map((additionalFileName) => ({
              fileName: additionalFileName,
              verified:
                !!verifiedAdditionalFileNames.includes(additionalFileName),
            }));

          console.log("nudgeable at frontend", res.data.project.nudgeable);

          return {
            project: res.data.project,
            additionalFiles: additionalFilesWithVerifiedField,
            isModalActive: false,
            pendingChange: null,
            loading: false,
            projectNudgeable: res.data.project.nudgeable,
          };
        } else {
          error({ statusCode: 501, message: "Project not found" });
        }
      })
      .catch((err) => {
        console.error(err);
        error({ statusCode: 501, message: "Project not found" });
      });
  },
  computed: {
    canSubmitToENA() {
      return true;
    },
    showAddAccession() {
      return process.env.ENA_ADMINS.includes(this.$auth.$state.user.username);
    },
    showAdminEmailNudgeUpdateCheckbox() {
      const res = process.env.ENA_ADMINS.includes(
        this.$auth.$state.user.username
      );
      return false; // TODO change back to res
    },
  },
  methods: {
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
</style>
