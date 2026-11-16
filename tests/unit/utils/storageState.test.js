import { describe, expect, it } from "vitest";
import {
  describeStorage,
  storageForEntity,
  storageIndicator,
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

describe("storageIndicator", () => {
  it("shows nothing for a plain HPC project", () => {
    expect(storageIndicator(undefined)).toBeNull();
    expect(storageIndicator(validSummary("hpc"))).toBeNull();
  });

  it("uses the state's own badge icon and label", () => {
    expect(storageIndicator(validSummary("aws"))).toEqual({
      icon: "archive",
      type: "is-info",
      text: "Archived in AWS",
    });
  });

  it("keeps the preservation wording for retained HPC copies", () => {
    const until = new Date(Date.now() + 86400000).toISOString();
    expect(
      storageIndicator(
        validSummary("aws_pending_hpc_deletion", { preserveOnHpcUntil: until })
      ).text
    ).toBe("Copied to AWS · HPC preservation set");
  });

  it("swaps in the attention warning for admins only", () => {
    const storage = validSummary("migrating", {
      migrationHealth: "needs_attention",
    });
    expect(storageIndicator(storage)).toMatchObject({
      type: "is-warning",
      text: "Moving to AWS",
    });
    expect(storageIndicator(storage, { isAdmin: true })).toEqual({
      icon: "alert-circle-outline",
      type: "is-danger",
      text: "Moving to AWS · AWS move needs attention",
    });
  });

  it("flags an invalid summary", () => {
    expect(storageIndicator({ state: "unexpected" })).toMatchObject({
      type: "is-danger",
      text: "Storage state needs attention",
    });
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
