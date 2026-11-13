<template>
  <section class="box project-storage" aria-label="Project storage">
    <h2 class="title is-5">Storage locations</h2>
    <div class="columns">
      <div class="column" data-testid="hpc-location">
        <h3 class="is-size-6 has-text-weight-semibold">HPC</h3>
        <p>{{ hpcStatus }}</p>
        <p v-if="locations.hpc.checkedAt" class="is-size-7 has-text-grey">
          {{
            locations.hpc.status === "absent" ? "Absence recorded" : "Checked"
          }}
          {{ formatDate(locations.hpc.checkedAt) }} UTC
        </p>
        <p v-if="locations.hpc.status === 'present'" class="is-size-7">
          The directory is present; this page does not check its file contents.
        </p>
        <p v-if="hpcReason" class="is-size-7">
          {{ hpcReason }}
        </p>
        <code v-if="locations.hpc.uri" class="storage-path">{{
          locations.hpc.uri
        }}</code>
      </div>
      <div class="column" data-testid="aws-location">
        <h3 class="is-size-6 has-text-weight-semibold">AWS</h3>
        <p>{{ awsStatus }}</p>
        <p v-if="locations.aws.verifiedAt" class="is-size-7 has-text-grey">
          Verified {{ formatDate(locations.aws.verifiedAt) }} UTC
        </p>
        <code v-if="locations.aws.uri" class="storage-path">{{
          locations.aws.uri
        }}</code>
      </div>
    </div>

    <div v-if="savedUntil" class="notification is-info is-light" role="status">
      <template v-if="validUntil">
        <p v-if="preservationActive">
          <strong>Keep on HPC until {{ formatDate(savedUntil) }} UTC.</strong>
        </p>
        <p v-else>
          The HPC preservation date was {{ formatDate(savedUntil) }} UTC. This
          date has passed; it does not mean the HPC copy has been deleted.
        </p>
        <p>
          Contact George Deeks if you need this project kept on HPC for longer.
        </p>
        <p v-if="locations.hpc.status === 'absent'">
          The HPC copy is recorded as absent. Setting a date does not restore
          it.
        </p>
      </template>
      <p v-else>
        The HPC preservation date needs administrator attention. Contact George
        Deeks before removing the HPC copy.
      </p>
    </div>

    <form v-if="isAdmin" data-testid="preservation-form" @submit.prevent="save">
      <label :for="inputId" class="label">Preserve on HPC until</label>
      <p :id="`${inputId}-help`" class="help mb-2">
        Keep the HPC copy through the end of this date (UTC). A passed date
        allows manual review; it never deletes files automatically.
      </p>
      <div class="field is-grouped is-grouped-multiline">
        <div class="control">
          <input
            :id="inputId"
            v-model="selectedDate"
            class="input"
            type="date"
            :aria-describedby="`${inputId}-help`"
            :disabled="saving || conflict"
          />
        </div>
        <div class="control">
          <button
            type="submit"
            class="button is-primary"
            :class="{ 'is-loading': saving }"
            :disabled="saving || conflict || !selectedDeadline"
          >
            Save date
          </button>
        </div>
        <div v-if="savedUntil" class="control">
          <button
            type="button"
            class="button"
            :disabled="saving || conflict"
            data-testid="clear-preservation"
            @click="updateDate(null)"
          >
            Clear preservation date
          </button>
        </div>
      </div>
      <p v-if="locations.hpc.status === 'absent'" class="help">
        The HPC copy is recorded as absent. Setting a date does not restore it.
      </p>
      <p v-if="errorMessage" class="help is-danger" role="alert">
        {{ errorMessage }}
      </p>
      <p v-if="successMessage" class="help is-success" role="status">
        {{ successMessage }}
      </p>
    </form>
  </section>
</template>

<script>
import { getApiErrorMessage, getApiErrorStatus } from "~/utils/apiError";
import {
  formatStorageDate,
  projectStorageLocations,
  retentionDateInput,
  retentionDeadline,
  validIsoDate,
} from "~/utils/projectStorage";

export default {
  name: "ProjectStorage",
  props: {
    project: { type: Object, required: true },
    storageLocations: { type: Object, default: null },
    location: { type: Object, default: null },
  },
  data() {
    return {
      selectedDate: retentionDateInput(this.project.preserveOnHpcUntil),
      saving: false,
      conflict: false,
      errorMessage: "",
      successMessage: "",
      now: Date.now(),
    };
  },
  computed: {
    isAdmin() {
      return this.$auth?.$state?.user?.isAdmin === true;
    },
    inputId() {
      return `preserve-hpc-${this.project._id}`;
    },
    savedUntil() {
      return this.project.preserveOnHpcUntil || null;
    },
    validUntil() {
      return validIsoDate(this.savedUntil);
    },
    preservationActive() {
      return this.validUntil && new Date(this.validUntil).getTime() > this.now;
    },
    selectedDeadline() {
      return retentionDeadline(this.selectedDate);
    },
    locations() {
      return projectStorageLocations(
        this.project,
        this.storageLocations,
        this.location
      );
    },
    hpcStatus() {
      return {
        present: "On HPC (directory present)",
        absent: "HPC removal confirmed",
        unknown: "HPC presence unknown",
      }[this.locations.hpc.status];
    },
    hpcReason() {
      const reason = this.locations.hpc.reason;
      if (!reason || reason === "absence_recorded") return null;
      return (
        {
          path_not_found:
            "The directory was not found. Its absence has not been confirmed; contact George Deeks to check HPC access.",
          storage_unavailable:
            "HPC storage could not be checked. Its presence is currently unknown.",
          invalid_project_path:
            "The recorded HPC path needs administrator review.",
          path_outside_storage:
            "The recorded HPC path could not be safely checked. Contact George Deeks.",
          not_a_directory:
            "The recorded HPC path is not a directory. Contact George Deeks.",
        }[reason] ||
        "The HPC location could not be confirmed. Contact George Deeks."
      );
    },
    awsStatus() {
      return {
        verified: "Verified in AWS",
        unverified: "AWS copy not yet verified",
        not_archived: "Not archived in AWS",
        unknown: "AWS status unknown",
      }[this.locations.aws.status];
    },
  },
  watch: {
    savedUntil(value) {
      this.selectedDate = retentionDateInput(value);
      this.now = Date.now();
    },
  },
  mounted() {
    this.clock = setInterval(() => {
      this.now = Date.now();
    }, 60000);
  },
  beforeDestroy() {
    clearInterval(this.clock);
  },
  methods: {
    formatDate: formatStorageDate,
    save() {
      if (!this.selectedDeadline) {
        this.errorMessage = "Choose a valid date. Use Clear to remove a date.";
        return;
      }
      return this.updateDate(this.selectedDeadline);
    },
    async updateDate(until) {
      if (!this.isAdmin || this.saving || this.conflict) return;
      this.saving = true;
      this.errorMessage = "";
      this.successMessage = "";
      try {
        const response = await this.$axios.put("/project/hpc-preservation", {
          _id: this.project._id,
          preserveOnHpcUntil: until,
          expectedPreserveOnHpcUntil: this.savedUntil,
        });
        if (
          response.status !== 200 ||
          response.data?.projectId !== this.project._id ||
          response.data?.preserveOnHpcUntil !== until
        ) {
          throw new Error(
            "Unexpected response. Reload this project to check the saved date."
          );
        }
        this.$emit("preservation-updated", response.data.preserveOnHpcUntil);
        this.successMessage = until
          ? "HPC preservation date saved."
          : "HPC preservation date cleared. Manual deletion checks still apply.";
      } catch (error) {
        if (getApiErrorStatus(error) === 409) {
          this.conflict = true;
          this.errorMessage =
            "The preservation date changed while this page was open. Reload the project before editing it again.";
        } else {
          this.errorMessage = getApiErrorMessage(error, {
            fallback: "Could not save the preservation date.",
          });
        }
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.storage-path {
  display: block;
  margin-top: 0.5rem;
  overflow-wrap: anywhere;
}
</style>
