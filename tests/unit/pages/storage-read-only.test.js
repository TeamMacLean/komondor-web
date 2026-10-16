import { describe, expect, it, vi } from "vitest";
import NewSample from "~/pages/samples/new.vue";
import NewRun from "~/pages/runs/new.vue";

const states = ["migrating", "aws_pending_hpc_deletion", "aws"];
const storage = (state) => ({
  state,
  acceptsHpcWrites: false,
  authoritativeLocation: state === "migrating" ? "hpc" : "s3",
  s3Uri: "s3://archive/group/project",
});

describe("storage read-only form entry", () => {
  it.each(states)(
    "stops the new-sample page for %s before loading form data",
    async (state) => {
      const error = vi.fn();
      const get = vi.fn().mockResolvedValueOnce({
        data: {
          project: {
            _id: "project-1",
            storage: storage(state),
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
    }
  );

  it.each(states)(
    "stops the new-run page for a %s sample's project",
    async (state) => {
      const error = vi.fn();
      const get = vi.fn().mockResolvedValueOnce({
        data: {
          sample: {
            _id: "sample-1",
            projectStorage: storage(state),
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
    }
  );
});
