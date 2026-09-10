const STORAGE_STATES = new Set([
  "hpc",
  "migrating",
  "aws_pending_hpc_deletion",
  "aws",
]);

const BADGES = {
  migrating: {
    show: true,
    text: "Moving to AWS",
    type: "is-warning",
    icon: "cloud-upload",
  },
  aws_pending_hpc_deletion: {
    show: true,
    text: "Copied to AWS · HPC cleanup pending",
    type: "is-info",
    icon: "cloud-check",
  },
  aws: {
    show: true,
    text: "Archived in AWS",
    type: "is-info",
    icon: "archive",
  },
  invalid: {
    show: true,
    text: "Storage state needs attention",
    type: "is-danger",
    icon: "alert-circle-outline",
  },
};

const HPC_BADGE = {
  show: false,
  text: "",
  type: "is-light",
  icon: "harddisk",
};

/**
 * Turn the API's project-owned storage summary into one safe UI decision.
 *
 * Old API responses have no summary and remain writable. Once a summary is
 * present, anything unknown or internally contradictory is read-only so a
 * newer server state cannot accidentally expose upload controls in an older
 * web deployment.
 */
export const describeStorage = (summary) => {
  if (summary == null) {
    return {
      state: "hpc",
      badge: HPC_BADGE,
      readOnly: false,
      authoritative: "hpc",
      needsAttention: false,
    };
  }

  const state = summary.state;
  const expectedWritable = state === "hpc";
  const hasValidState = STORAGE_STATES.has(state);
  const expectedAuthoritative =
    state === "hpc" || state === "migrating" ? "hpc" : "s3";
  const hasValidWritableFlag =
    typeof summary.acceptsHpcWrites === "boolean" &&
    summary.acceptsHpcWrites === expectedWritable;
  const hasValidAuthoritativeLocation =
    summary.authoritativeLocation === expectedAuthoritative;
  const hasValidS3Uri =
    state === "hpc"
      ? summary.s3Uri == null
      : typeof summary.s3Uri === "string" &&
        summary.s3Uri.trim().startsWith("s3://");

  if (
    !hasValidState ||
    !hasValidWritableFlag ||
    !hasValidAuthoritativeLocation ||
    !hasValidS3Uri
  ) {
    return {
      state: "invalid",
      badge: BADGES.invalid,
      readOnly: true,
      authoritative: null,
      needsAttention: true,
    };
  }

  return {
    state,
    badge: state === "hpc" ? HPC_BADGE : BADGES[state],
    readOnly: !expectedWritable,
    authoritative: expectedAuthoritative,
    needsAttention:
      state === "invalid" || summary.migrationHealth === "needs_attention",
  };
};

export const storageReadOnlyMessage = (summary) => {
  const { state } = describeStorage(summary);

  switch (state) {
    case "migrating":
      return "This project is being moved to AWS. New samples, runs and files cannot be added.";
    case "aws_pending_hpc_deletion":
      return "This project has been copied to AWS and is awaiting HPC cleanup. New samples, runs and files cannot be added.";
    case "aws":
      return "This project is archived in AWS. New samples, runs and files cannot be added.";
    default:
      return "This project's storage state needs administrator attention. Storage changes are disabled.";
  }
};

export const storageForEntity = (entity, fallback = null) =>
  (entity && (entity.storage || entity.projectStorage)) || fallback;
