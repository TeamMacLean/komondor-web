import { describeStorage } from "~/utils/storageState";

export const validIsoDate = (value) => {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value
    ? value
    : null;
};

export const retentionDateInput = (value) =>
  validIsoDate(value) ? value.slice(0, 10) : "";

// A calendar date means keep the copy throughout that UTC day, including DST
// changes and clients whose browser timezone differs from the archive host.
export const retentionDeadline = (day) => {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return validIsoDate(`${day}T23:59:59.999Z`);
};

export const formatStorageDate = (value) => {
  if (!validIsoDate(value)) return null;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
};

const hpcUri = (value) =>
  typeof value === "string" && value.startsWith("/") ? value : null;
const s3Uri = (value) =>
  typeof value === "string" && value.startsWith("s3://") ? value : null;

/** Missing observations never turn an unconfirmed deletion into HPC presence. */
export const projectStorageLocations = (project, observed, location) => {
  const summary = project?.storage;
  const { state } = describeStorage(summary);
  const verifiedAt = validIsoDate(summary?.s3VerifiedAt);
  const absentAt = validIsoDate(summary?.hpcVerifiedAbsentAt);
  const awsVerified =
    ["aws_pending_hpc_deletion", "aws"].includes(state) && verifiedAt;

  const hpc = {
    status: state === "aws" && absentAt ? "absent" : "unknown",
    uri: location?.authoritative === "hpc" ? hpcUri(location.baseUri) : null,
    checkedAt: state === "aws" ? absentAt : null,
    reason: null,
  };
  const aws = {
    status: awsVerified
      ? "verified"
      : state === "hpc"
      ? "not_archived"
      : state === "invalid"
      ? "unknown"
      : "unverified",
    uri:
      state === "invalid"
        ? null
        : s3Uri(summary?.s3Uri || location?.plannedS3Uri),
    verifiedAt: awsVerified ? verifiedAt : null,
  };

  if (["present", "absent", "unknown"].includes(observed?.hpc?.status)) {
    hpc.status = observed.hpc.status;
    hpc.uri = hpcUri(observed.hpc.uri);
    hpc.checkedAt = validIsoDate(observed.hpc.checkedAt);
    hpc.reason =
      typeof observed.hpc.reason === "string" ? observed.hpc.reason : null;
    if (hpc.status !== "unknown" && !hpc.checkedAt) hpc.status = "unknown";
  }
  if (
    ["verified", "unverified", "not_archived", "unknown"].includes(
      observed?.aws?.status
    )
  ) {
    aws.status = observed.aws.status;
    aws.uri = s3Uri(observed.aws.uri);
    aws.verifiedAt = validIsoDate(observed.aws.verifiedAt);
    if (aws.status === "verified" && (!aws.uri || !aws.verifiedAt)) {
      aws.status = "unknown";
    }
  }
  return { hpc, aws };
};
