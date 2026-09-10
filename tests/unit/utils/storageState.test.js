import { describe, expect, it } from "vitest";
import {
  describeStorage,
  storageForEntity,
  storageReadOnlyMessage,
} from "~/utils/storageState";

const validSummary = (state, overrides = {}) => ({
  state,
  acceptsHpcWrites: state === "hpc",
  authoritativeLocation:
    state === "hpc" || state === "migrating" ? "hpc" : "s3",
  s3Uri: state === "hpc" ? null : "s3://archive/data/group/project",
  ...overrides,
});

describe("describeStorage", () => {
  it("keeps legacy responses without storage writable on HPC", () => {
    expect(describeStorage(undefined)).toMatchObject({
      state: "hpc",
      readOnly: false,
      authoritative: "hpc",
      badge: { show: false },
    });
  });

  it.each([
    ["migrating", "Moving to AWS", "hpc"],
    ["aws_pending_hpc_deletion", "Copied to AWS · HPC cleanup pending", "s3"],
    ["aws", "Archived in AWS", "s3"],
  ])("describes %s as read-only", (state, text, authoritative) => {
    expect(describeStorage(validSummary(state))).toMatchObject({
      state,
      readOnly: true,
      authoritative,
      badge: { show: true, text },
    });
  });

  it("fails closed for unknown and contradictory summaries", () => {
    expect(
      describeStorage({
        state: "glacier",
        acceptsHpcWrites: false,
        authoritativeLocation: "s3",
        s3Uri: "s3://archive/data/group/project",
      })
    ).toMatchObject({
      state: "invalid",
      readOnly: true,
      needsAttention: true,
    });
    expect(
      describeStorage(validSummary("hpc", { acceptsHpcWrites: false }))
    ).toMatchObject({ state: "invalid", readOnly: true });
  });

  it("fails closed when a present summary is incomplete", () => {
    expect(describeStorage({ state: "hpc" })).toMatchObject({
      state: "invalid",
      readOnly: true,
    });
  });

  it("fails closed when authoritative location contradicts state", () => {
    expect(
      describeStorage(validSummary("hpc", { authoritativeLocation: "s3" }))
    ).toMatchObject({ state: "invalid", readOnly: true });
    expect(
      describeStorage(validSummary("aws", { authoritativeLocation: "hpc" }))
    ).toMatchObject({ state: "invalid", readOnly: true });
  });

  it("fails closed when an AWS-backed state has no S3 URI", () => {
    for (const state of ["migrating", "aws_pending_hpc_deletion", "aws"]) {
      expect(
        describeStorage(validSummary(state, { s3Uri: null }))
      ).toMatchObject({ state: "invalid", readOnly: true });
    }
  });

  it("rejects S3 evidence on an HPC state", () => {
    expect(
      describeStorage(
        validSummary("hpc", { s3Uri: "s3://archive/data/group/project" })
      )
    ).toMatchObject({ state: "invalid", readOnly: true });
  });

  it("surfaces migration attention without changing the main state", () => {
    expect(
      describeStorage(
        validSummary("migrating", {
          migrationHealth: "needs_attention",
        })
      )
    ).toMatchObject({ state: "migrating", needsAttention: true });
  });
});

describe("storage helpers", () => {
  it("prefers the entity's own project summary over a parent fallback", () => {
    const own = validSummary("aws");
    expect(storageForEntity({ projectStorage: own }, { state: "hpc" })).toBe(
      own
    );
  });

  it("provides a useful read-only message", () => {
    expect(storageReadOnlyMessage(validSummary("aws"))).toContain(
      "archived in AWS"
    );
  });
});
