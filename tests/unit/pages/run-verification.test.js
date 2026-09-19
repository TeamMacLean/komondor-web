import { describe, expect, it, vi } from "vitest";
import RunPage from "~/pages/run.vue";

describe("run checksum status", () => {
  const badge = (run) =>
    RunPage.computed.md5Status.call({
      run,
      storageDescription: { readOnly: false },
    });
  it("shows legacy mismatches even if the API marked verification complete", () => {
    expect(
      badge({
        md5VerificationStatus: "complete",
        rawFiles: [{ md5Mismatch: true }],
      })
    ).toMatchObject({ type: "is-danger", text: "Checksum Mismatch" });
  });
  it.each([{ disabled: true }, { skipped: 1 }, { total: 0 }])(
    "does not claim skipped checks are verified",
    (md5VerificationResult) => {
      expect(
        badge({ md5VerificationStatus: "complete", md5VerificationResult })
      ).toMatchObject({
        type: "is-warning",
        text: "Checksums Not Fully Verified",
      });
    }
  );
  it("shows a successful verification normally", () => {
    expect(
      badge({
        md5VerificationStatus: "complete",
        md5VerificationResult: {
          verified: 2,
          total: 2,
          mismatches: 0,
          skipped: 0,
        },
      })
    ).toMatchObject({ type: "is-success", text: "Checksums Verified" });
  });
  it("continues polling a run in processing state", () => {
    const startPolling = vi.fn();
    RunPage.mounted.call({
      storageDescription: { readOnly: false },
      run: { status: "processing", md5VerificationStatus: "complete" },
      startPolling,
    });
    expect(startPolling).toHaveBeenCalled();
  });
});
