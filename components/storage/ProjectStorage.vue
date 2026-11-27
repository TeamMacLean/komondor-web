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
        <code v-if="showHpcPath" class="storage-path">{{
          locations.hpc.uri
        }}</code>
      </div>
      <div class="column" data-testid="aws-location">
        <h3 class="is-size-6 has-text-weight-semibold">
          AWS
          <a
            href="#"
            role="button"
            class="is-size-7 has-text-weight-normal ml-1"
            data-testid="aws-info-link"
            @click.prevent="awsInfoOpen = true"
            >What is AWS?</a
          >
        </h3>
        <p v-if="showAwsStatus">{{ awsStatus }}</p>
        <p v-if="locations.aws.verifiedAt" class="is-size-7 has-text-grey">
          Transfer verified {{ formatDate(locations.aws.verifiedAt) }} UTC
        </p>
        <p v-if="locations.aws.status === 'verified'" class="is-size-7">
          This is the recorded transfer verification; this page does not perform
          a fresh S3 check.
        </p>
        <code v-if="locations.aws.uri" class="storage-path">{{
          locations.aws.uri
        }}</code>

        <div data-testid="retention-schedule">
          <p v-if="deletionEligibleAt && !isArchived">
            <template v-if="deletionDue">
              This project has been due for deletion from the HPC since
              {{ formatDay(deletionEligibleAt) }}. It will be copied to
              <a href="#" role="button" @click.prevent="awsInfoOpen = true"
                >AWS</a
              >
              first and preserved there instead.
            </template>
            <template v-else>
              This project is scheduled to be deleted from the HPC from
              {{ formatDay(deletionEligibleAt) }}. It will be preserved on
              <a href="#" role="button" @click.prevent="awsInfoOpen = true"
                >AWS</a
              >
              instead from that point.
            </template>
            Project records will remain on this site.
          </p>
          <p v-else-if="deletionEligibleAt">
            The HPC copy is scheduled to be deleted from
            {{ formatDay(deletionEligibleAt) }}. The project is preserved on
            <a href="#" role="button" @click.prevent="awsInfoOpen = true">AWS</a
            >. Project records will remain on this site.
          </p>
          <p v-else-if="storageState === 'aws'">
            The HPC copy is recorded as removed. The project is preserved on
            <a href="#" role="button" @click.prevent="awsInfoOpen = true">AWS</a
            >. Project records remain on this site.
          </p>
          <p v-else-if="!preservationInvalid" class="is-size-7">
            HPC deletion date unavailable.
          </p>
        </div>

        <details
          v-if="showPreservationNotice && validUntil && !preservationInvalid"
          class="keep-request mt-2"
          data-testid="keep-request"
        >
          <summary>
            <template v-if="preservationActive">
              Approved to stay on the HPC until {{ formatDay(savedUntil) }}
            </template>
            <template v-else>
              HPC keep date passed on {{ formatDay(savedUntil) }}
            </template>
          </summary>
          <div class="is-size-7 mt-1">
            <p v-if="preservationRequest">{{ preservationRequest }}</p>
            <p v-if="!preservationActive">
              A passed date does not mean the HPC copy has been deleted.
            </p>
            <p v-if="locations.hpc.status === 'absent'">
              The HPC copy is recorded as absent. Setting a date does not
              restore it.
            </p>
          </div>
        </details>
        <div
          v-else-if="showPreservationNotice"
          class="notification is-info is-light mt-3 mb-3"
          role="status"
        >
          <p>
            The HPC preservation date needs administrator attention. Ask an
            administrator to repair it before removing the HPC copy.
          </p>
        </div>

        <p class="is-size-7 mt-2">
          Contact <a v-if="contactHref" :href="contactHref">George Deeks</a
          ><span v-else>George Deeks</span>
          <template v-if="hpcCopyDeleted">
            if you need this project restored to the HPC for a set amount of
            time - this will take days and incur a cost for your group.
          </template>
          <template v-else>
            if you need this project kept on the HPC for longer.
          </template>
        </p>
      </div>
    </div>

    <b-modal :active.sync="awsInfoOpen">
      <section class="modal-card-body aws-info" data-testid="aws-info">
        <h4 class="title is-4">What is AWS?</h4>
        <p>
          AWS (Amazon Web Services) is the cloud storage solution that TSL uses
          to keep sequencing data for the long term, once it no longer needs to
          sit on the HPC. We only have a limit to how much data we can store on
          the HPC, hence the need to archive older projects.
        </p>
        <p>
          Once its keep-on-HPC date has expired, the webmaster schedules copying
          files to AWS and then removing from the HPC.
        </p>
        <p>
          Users can request to keep certain project data on the HPC longer than
          the default, by requesting to the webmaster.
        </p>
        <p>
          Once on AWS, archived data is held in cold storage, so it cannot be
          read in place the way files on the HPC can. It can be restored on
          request, which can take days, and incur a financial cost to retrieve.
        </p>
        <p>
          The project records stay on this site even after archive. Archived
          projects are read-only, so new files cannot be added to them.
        </p>
        <p>
          Contact George Deeks if you need archived data back, or need a project
          kept on the HPC for longer.
        </p>
      </section>
    </b-modal>

    <section
      v-if="showPreservationForm || $scopedSlots['admin-tools']"
      class="admin-tools"
      data-testid="admin-tools"
      aria-label="Admin-only tools"
    >
      <p class="admin-tools-label">
        Admin only
        <span class="has-text-weight-normal"
          >&middot; other users do not see this section</span
        >
      </p>
      <details
        v-if="showPreservationForm"
        class="admin-tool"
        data-testid="preservation-panel"
      >
        <summary>
          <span class="has-text-weight-semibold">Preserve on HPC</span>
          <span class="is-size-7 has-text-grey ml-2">{{
            preservationSummary
          }}</span>
        </summary>
        <form
          class="mt-3"
          data-testid="preservation-form"
          @submit.prevent="save"
        >
          <div class="field">
            <label :for="inputId" class="label">Preserve on HPC until</label>
            <div class="control">
              <input
                :id="inputId"
                v-model="selectedDate"
                class="input preservation-date"
                type="date"
                :aria-describedby="`${inputId}-help`"
                :disabled="saving || conflict"
              />
            </div>
            <p :id="`${inputId}-help`" class="help">
              Keep the HPC copy through the end of this date (UTC). A passed
              date allows manual review; it never deletes files automatically.
            </p>
          </div>
          <div class="field">
            <label :for="`${inputId}-requester`" class="label"
              >Requested by</label
            >
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
              rows="2"
              maxlength="1000"
              :disabled="saving || conflict"
              :aria-describedby="`${inputId}-visibility ${inputId}-reason-help`"
            ></textarea>
            <p :id="`${inputId}-reason-help`" class="help">
              Required when saving the keep date or its details.
            </p>
            <p :id="`${inputId}-visibility`" class="help">
              The date, requester and reason are visible to everyone who can see
              this project.
            </p>
          </div>
          <div class="field">
            <button
              type="submit"
              class="button is-primary"
              :class="{ 'is-loading': saving }"
              :disabled="saving || conflict || !canSave"
            >
              Save preservation
            </button>
          </div>
          <div v-if="savedUntil || preservationInvalid" class="field">
            <label :for="`${inputId}-release-reason`" class="label">
              Reason for releasing the hold
            </label>
            <textarea
              :id="`${inputId}-release-reason`"
              v-model="releaseReason"
              class="textarea"
              rows="2"
              maxlength="1000"
              :disabled="saving || conflict"
              :aria-describedby="`${inputId}-release-help`"
            ></textarea>
            <p :id="`${inputId}-release-help`" class="help mb-2">
              Enter a new explanation before clearing. This release reason is
              kept in the audit history only.
            </p>
            <button
              type="button"
              class="button"
              :disabled="saving || conflict || !canClear"
              data-testid="clear-preservation"
              @click="updateDate(null)"
            >
              Clear preservation date
            </button>
          </div>
          <p v-if="locations.hpc.status === 'absent'" class="help">
            The HPC copy is recorded as absent. Setting a date does not restore
            it.
          </p>
          <p v-if="errorMessage" class="help is-danger" role="alert">
            {{ errorMessage }}
          </p>
          <p v-if="successMessage" class="help is-success" role="status">
            {{ successMessage }}
          </p>
        </form>
      </details>
      <slot name="admin-tools" />
    </section>
  </section>
</template>

<script>
import { describeStorage, isHpcCopyDeleted } from "~/utils/storageState";
import { getApiErrorMessage, getApiErrorStatus } from "~/utils/apiError";
import {
  formatStorageDate,
  formatStorageDay,
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
      requestedBy: this.project.hpcPreservationRequestedBy || "",
      reason: this.project.hpcPreservationReason || "",
      releaseReason: "",
      awsInfoOpen: false,
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
    hpcCopyDeleted() {
      return isHpcCopyDeleted(this.project.storage);
    },
    // A path nobody can read is noise, and inviting someone to try it is worse.
    showHpcPath() {
      return (
        Boolean(this.locations.hpc.uri) &&
        !this.hpcCopyDeleted &&
        this.locations.hpc.status !== "absent"
      );
    },
    // Keeping or releasing an HPC copy is only a decision while one exists.
    showPreservationForm() {
      return this.isAdmin && !this.hpcCopyDeleted;
    },
    showPreservationNotice() {
      return (
        (Boolean(this.savedUntil) || this.preservationInvalid) &&
        !this.hpcCopyDeleted
      );
    },
    deletionEligibleAt() {
      return this.preservationInvalid
        ? null
        : validIsoDate(this.storageLocations?.hpcDeletionEligibleAt);
    },
    deletionDue() {
      return (
        this.deletionEligibleAt &&
        new Date(this.deletionEligibleAt).getTime() <= this.now
      );
    },
    preservationRequest() {
      const by = (this.project.hpcPreservationRequestedBy || "").trim();
      const why = (this.project.hpcPreservationReason || "")
        .trim()
        .replace(/\.+$/, "");
      if (!by && !why) return null;
      return `Requested by ${by || "not yet recorded"}: ${
        why || "reason not yet recorded"
      }.`;
    },
    preservationSummary() {
      if (this.preservationInvalid) return "Keep date needs attention";
      if (!this.savedUntil) return "No keep date set";
      const day = formatStorageDay(this.savedUntil);
      return this.preservationActive
        ? `Kept until ${day}`
        : `Keep date passed (${day})`;
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
    canClear() {
      return this.releaseReason.trim() && this.releaseReason.length <= 1000;
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
    // "Not archived" is left out when the schedule sentence already says the
    // project has yet to move to AWS.
    showAwsStatus() {
      return (
        this.locations.aws.status !== "not_archived" ||
        !this.deletionEligibleAt ||
        this.isArchived
      );
    },
    awsStatus() {
      return {
        verified: "Transfer verified in AWS",
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
      this.releaseReason = "";
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
    formatDay: formatStorageDay,
    save() {
      if (!this.selectedDeadline) {
        this.errorMessage = "Choose a valid date. Use Clear to remove a date.";
        return;
      }
      return this.updateDate(this.selectedDeadline);
    },
    async updateDate(until) {
      if (!this.isAdmin || this.saving || this.conflict) return;
      const submittedReason = until === null ? this.releaseReason : this.reason;
      if (until === null && !this.canClear) {
        this.errorMessage = "Enter a release reason (up to 1000 characters).";
        return;
      }
      if (
        !submittedReason.trim() ||
        submittedReason.length > 1000 ||
        (until && (!this.requestedBy.trim() || this.requestedBy.length > 200))
      ) {
        this.errorMessage =
          "Enter a requester (up to 200 characters) and reason (up to 1000).";
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
          hpcPreservationReason: submittedReason.trim(),
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
        this.releaseReason = "";
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

.admin-tools {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px dashed #b5b5b5;
  border-radius: 4px;
  background: #fafafa;
}

.admin-tools-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #7a7a7a;
}

.admin-tools-label span {
  letter-spacing: 0;
  text-transform: none;
}

.admin-tool {
  padding: 0.75rem 1rem;
  border: 1px solid #dbdbdb;
  background: #fff;
}

.keep-request > summary,
.admin-tool > summary {
  cursor: pointer;
}

.preservation-date {
  width: auto;
}

.aws-info > p {
  padding-bottom: 1rem;
}
</style>
