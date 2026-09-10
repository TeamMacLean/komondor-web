import { describe, expect, it, vi } from "vitest";
import ProjectPage from "~/pages/project.vue";
import RunPage from "~/pages/run.vue";

const archivedStorage = {
  state: "aws",
  acceptsHpcWrites: false,
  authoritativeLocation: "s3",
};

describe("archived detail pages", () => {
  it("uses project DB records when filesystem reconciliation is not applicable", async () => {
    const result = await ProjectPage.asyncData({
      route: { query: { id: "project-1" } },
      error: vi.fn(),
      $axios: {
        get: vi.fn().mockResolvedValue({
          status: 200,
          data: {
            project: {
              _id: "project-1",
              storage: archivedStorage,
              additionalFiles: [
                {
                  _id: "additional-1",
                  file: { originalName: "notes.pdf" },
                },
              ],
            },
            actualAdditionalFiles: null,
            location: {
              authoritative: "s3",
              baseUri: "s3://archive/data/project",
              additionalUri: "s3://archive/data/project/additional",
            },
          },
        }),
      },
    });

    expect(result.additionalFiles).toEqual([
      expect.objectContaining({
        fileName: "notes.pdf",
        verified: true,
        archived: true,
      }),
    ]);
    expect(result.fileLocation.baseUri).toBe("s3://archive/data/project");
  });

  it("does not start run polling when project storage is read-only", () => {
    const startPolling = vi.fn();
    RunPage.mounted.call({
      storageDescription: { readOnly: true },
      run: { status: "pending", md5VerificationStatus: "pending" },
      startPolling,
    });

    expect(startPolling).not.toHaveBeenCalled();
  });
});
