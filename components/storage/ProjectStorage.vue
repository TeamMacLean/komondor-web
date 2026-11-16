<template>
  <section class="project-storage" aria-label="Project details and storage">
    <div class="columns">
      <div v-if="$slots.default" class="column" data-testid="project-details">
        <slot />
      </div>
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
      <div v-if="showAws" class="column" data-testid="aws-location">
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

    <div class="mb-4" data-testid="retention-schedule">
      <p v-if="archiveDueAt && !isArchived">
        <template v-if="new Date(archiveDueAt).getTime() <= now">
          Due to move to AWS (awaiting the next archive run).
        </template>
        <template v-else
          >Due to move to AWS around {{ formatMonth(archiveDueAt) }}.</template
        >
      </p>
      <p v-else-if="archiveDueAt">
        Age-based AWS move date: {{ formatDate(archiveDueAt) }} UTC.
      </p>
      <p v-else>AWS move date unavailable.</p>
      <p v-if="deletionEligibleAt">
        HPC deletion review eligible from
        {{ formatDate(deletionEligibleAt) }} UTC.
        <template v-if="!isArchived"
          >The project must be copied to AWS first.</template
        >
      </p>
      <p v-else-if="storageState === 'aws'">
        The HPC copy is recorded as removed.
      </p>
      <p v-else-if="!preservationInvalid">
        HPC deletion review date unavailable.
      </p>
      <StorageRetentionExplanation />
    </div>

    <div
      v-if="savedUntil || preservationInvalid"
      class="notification is-info is-light"
      role="status"
    >
      <template v-if="validUntil && !preservationInvalid">
        <p v-if="preservationActive">
          <strong>Keep on HPC until {{ formatDate(savedUntil) }} UTC.</strong>
        </p>
        <p v-else>
          The HPC preservation date was {{ formatDate(savedUntil) }} UTC. This
          date has passed; it does not mean the HPC copy has been deleted.
        </p>
        <p
          v-if="
            project.hpcPreservationRequestedBy || project.hpcPreservationReason
          "
        >
          Requested by
          {{ project.hpcPreservationRequestedBy || "not yet recorded" }}:
          {{ project.hpcPreservationReason || "reason not yet recorded" }}.
        </p>
        <p v-if="locations.hpc.status === 'absent'">
          The HPC copy is recorded as absent. Setting a date does not restore
          it.
        </p>
      </template>
      <p v-else>
        The HPC preservation date needs administrator attention. Ask an
        administrator to repair it before removing the HPC copy.
      </p>
    </div>

    <p class="mb-4">
      Contact <a v-if="contactHref" :href="contactHref">George Deeks</a
      ><span v-else>George Deeks</span>
      if you need this project kept on HPC for longer.
    </p>

    <form v-if="isAdmin" data-testid="preservation-form" @submit.prevent="save">
      <label :for="inputId" class="label">Preserve on HPC until</label>
      <p :id="`${inputId}-help`" class="help mb-2">
        Keep the HPC copy through the end of this date (UTC). A passed date
        allows manual review; it never deletes files automatically.
      </p>
      <p :id="`${inputId}-visibility`" class="help mb-2">
        The date, requester and reason are visible to everyone who can see this
        project.
      </p>
      <div class="field">
        <label :for="`${inputId}-requester`" class="label">Requested by</label>
        <input
          :id="`${inputId}-requester`"
          v-model="requestedBy"
          type="text"
          class="input"
          maxlength="200"
          :disabled="saving || conflict"
          :aria-describedby="`${inputId}-visibility`"
        />
      </div>
      <div class="field">
        <label :for="`${inputId}-reason`" class="label">Reason</label>
        <textarea
          :id="`${inputId}-reason`"
          v-model="reason"
          class="textarea"
          maxlength="1000"
          :disabled="saving || conflict"
          :aria-describedby="`${inputId}-visibility ${inputId}-reason-help`"
        ></textarea>
        <p :id="`${inputId}-reason-help`" class="help">
          Required when saving or clearing. When clearing, explain the release;
          that explanation is kept in the audit history only.
        </p>
      </div>
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
            :disabled="saving || conflict || !canSave"
          >
            Save preservation
          </button>
        </div>
        <div v-if="savedUntil || preservationInvalid" class="control">
          <button
            type="button"
            class="button"
            :disabled="saving || conflict || !reason.trim()"
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
import StorageRetentionExplanation from "~/components/storage/StorageRetentionExplanation.vue";
import { describeStorage } from "~/utils/storageState";
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
  components: { StorageRetentionExplanation },
  props: {
    project: { type: Object, required: true },
    storageLocations: { type: Object, default: null },
    location: { type: Object, default: null },
  },
  data() {
    return {
      selectedDate: retentionDateInput(this.project.preserveOnHpcUntil),
      requestedBy: this.project.hpcPreservationRequestedBy || "",
      reason: this.project.hpcPreservationReason || "",
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
    preservationInvalid() {
      return (
        this.project.hpcPreservationInvalid === true ||
        this.project.storage?.hpcPreservationInvalid === true ||
        this.storageLocations?.hpcPreservationInvalid === true ||
        Boolean(this.savedUntil && !validIsoDate(this.savedUntil))
      );
    },
    storageState() {
      return describeStorage(this.project.storage).state;
    },
    isArchived() {
      return ["aws_pending_hpc_deletion", "aws"].includes(this.storageState);
    },
    archiveDueAt() {
      return validIsoDate(this.storageLocations?.archiveDueAt);
    },
    deletionEligibleAt() {
      return this.preservationInvalid
        ? null
        : validIsoDate(this.storageLocations?.hpcDeletionEligibleAt);
    },
    contactHref() {
      const email = this.$config?.HPC_RETENTION_CONTACT_EMAIL?.trim();
      if (!email || !/^[^\s@?&#]+@[^\s@?&#]+$/.test(email)) return null;
      const origin =
        typeof window === "undefined" ? "" : window.location.origin;
      const url = `${origin}/project?id=${encodeURIComponent(
        this.project._id
      )}`;
      return `mailto:${email}?subject=${encodeURIComponent(
        `HPC retention request: ${this.project.name || "Project"}`
      )}&body=${encodeURIComponent(
        `Project: ${url}\n\nPlease explain how long the HPC copy is needed and why.`
      )}`;
    },
    canSave() {
      return (
        this.selectedDeadline &&
        this.requestedBy.trim() &&
        this.reason.trim() &&
        (this.selectedDeadline === this.savedUntil ||
          new Date(this.selectedDeadline).getTime() > this.now)
      );
    },
    validUntil() {
      return validIsoDate(this.savedUntil);
    },
    preservationActive() {
      return this.validUntil && new Date(this.validUntil).getTime() > this.now;
    },
    selectedDeadline() {
      // A metadata-only edit must preserve an older API's exact timestamp.
      if (
        this.validUntil &&
        this.selectedDate === retentionDateInput(this.savedUntil)
      )
        return this.savedUntil;
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
    // Only a project known to have no AWS copy drops the column; an unknown
    // or unverified copy still needs its status shown.
    showAws() {
      return this.locations.aws.status !== "not_archived";
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
    "project.hpcPreservationRequestedBy"(value) {
      this.requestedBy = value || "";
    },
    "project.hpcPreservationReason"(value) {
      this.reason = value || "";
    },
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
    formatMonth(value) {
      return new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value));
    },
    save() {
      if (!this.selectedDeadline) {
        this.errorMessage = "Choose a valid date. Use Clear to remove a date.";
        return;
      }
      return this.updateDate(this.selectedDeadline);
    },
    async updateDate(until) {
      if (!this.isAdmin || this.saving || this.conflict) return;
      if (
        !this.reason.trim() ||
        this.reason.length > 1000 ||
        (until && (!this.requestedBy.trim() || this.requestedBy.length > 200))
      ) {
        this.errorMessage =
          "Enter a requester (up to 200 characters) and reason (up to 1000). Clearing requires a reason.";
        return;
      }
      if (
        until &&
        until !== this.savedUntil &&
        new Date(until).getTime() <= Date.now()
      ) {
        this.errorMessage = "Choose a future date.";
        return;
      }
      this.saving = true;
      this.errorMessage = "";
      this.successMessage = "";
      try {
        const response = await this.$axios.put("/project/hpc-preservation", {
          _id: this.project._id,
          preserveOnHpcUntil: until,
          expectedPreserveOnHpcUntil: this.preservationInvalid
            ? "invalid"
            : this.savedUntil,
          hpcPreservationRequestedBy: until ? this.requestedBy.trim() : "",
          hpcPreservationReason: this.reason.trim(),
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
        this.$emit("preservation-updated", response.data);
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
