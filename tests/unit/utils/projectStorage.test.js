import { describe, expect, it } from "vitest";
import {
  formatStorageDate,
  projectStorageLocations,
  retentionDeadline,
} from "~/utils/projectStorage";

const at = "2026-11-13T17:00:00.000Z";
const summary = (state) => ({
  state,
  acceptsHpcWrites: state === "hpc",
  authoritativeLocation: ["hpc", "migrating"].includes(state) ? "hpc" : "s3",
  s3Uri: state === "hpc" ? null : "s3://archive/group/project",
  s3VerifiedAt: ["aws", "aws_pending_hpc_deletion"].includes(state) ? at : null,
  hpcVerifiedAbsentAt: state === "aws" ? at : null,
});

describe("preservation calendar dates", () => {
  it.each(["2027-03-28", "2027-10-31", "2028-02-29"])(
    "retains through the complete UTC day %s",
    (day) => expect(retentionDeadline(day)).toBe(`${day}T23:59:59.999Z`)
  );
  it.each(["", null, "2027-02-29", "2026-04-31", "2026-13-01", "2026-1-01"])(
    "rejects missing or invalid calendar day %s",
    (day) => expect(retentionDeadline(day)).toBeNull()
  );
  it("formats UTC, without silently switching the displayed day", () => {
    expect(formatStorageDate("2027-03-28T23:59:59.999Z")).toBe(
      "28 March 2027 at 23:59"
    );
  });
});

describe("independent storage locations", () => {
  it("shows a measured HPC copy alongside verified AWS", () => {
    const locations = {
      hpc: { status: "present", uri: "/reads/group/project", checkedAt: at },
      aws: {
        status: "verified",
        uri: "s3://archive/group/project",
        verifiedAt: at,
      },
    };
    expect(
      projectStorageLocations(
        { storage: summary("aws_pending_hpc_deletion") },
        locations
      )
    ).toMatchObject(locations);
  });
  it("does not infer HPC presence from a pending deletion", () => {
    const result = projectStorageLocations({
      storage: summary("aws_pending_hpc_deletion"),
    });
    expect(result.hpc.status).toBe("unknown");
    expect(result.aws.status).toBe("verified");
  });
  it("does not infer HPC presence for a legacy record without an observation", () => {
    expect(projectStorageLocations({}).hpc.status).toBe("unknown");
    expect(projectStorageLocations({}).aws.status).toBe("not_archived");
  });
  it("retains an explicit HPC absence observation", () => {
    expect(
      projectStorageLocations({ storage: summary("aws") }).hpc
    ).toMatchObject({ status: "absent", checkedAt: at });
  });
  it("shows migration as an unverified AWS copy", () => {
    expect(
      projectStorageLocations({ storage: summary("migrating") }).aws.status
    ).toBe("unverified");
  });
  it("does not present incomplete or contradictory AWS evidence as verified", () => {
    expect(
      projectStorageLocations({ storage: { state: "aws" } }).aws.status
    ).toBe("unknown");
    expect(
      projectStorageLocations(
        {},
        {
          aws: {
            status: "verified",
            uri: "s3://archive/group/project",
            verifiedAt: null,
          },
        }
      ).aws.status
    ).toBe("unknown");
  });
});
