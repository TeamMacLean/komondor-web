import { describe, expect, it, vi } from "vitest";
import NewSample from "~/pages/samples/new.vue";
import NewRun from "~/pages/runs/new.vue";

describe("storage read-only form entry", () => {
  it("stops the new-sample page before loading form data", async () => {
    const error = vi.fn();
    const get = vi.fn().mockResolvedValueOnce({
      data: {
        project: {
          _id: "project-1",
          storage: { state: "aws", acceptsHpcWrites: false },
        },
      },
    });

    await NewSample.asyncData({
      $axios: { get },
      error,
      route: { query: { projectId: "project-1" } },
    });

    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409 })
    );
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("stops the new-run page for a read-only sample's project", async () => {
    const error = vi.fn();
    const get = vi.fn().mockResolvedValueOnce({
      data: {
        sample: {
          _id: "sample-1",
          projectStorage: {
            state: "aws_pending_hpc_deletion",
            acceptsHpcWrites: false,
          },
        },
      },
    });

    await NewRun.asyncData({
      $axios: { get },
      error,
      route: { query: { sample: "sample-1" } },
    });

    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409 })
    );
    expect(get).toHaveBeenCalledTimes(1);
  });
});
