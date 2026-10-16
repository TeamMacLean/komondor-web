import { describe, expect, it, vi } from "vitest";
import ProjectPage from "~/pages/project.vue";
import SamplePage from "~/pages/sample.vue";
import RunPage from "~/pages/run.vue";
import { describeStorage } from "~/utils/storageState";

const archivedStorage = (state) => ({
  state,
  acceptsHpcWrites: false,
  authoritativeLocation: state === "migrating" ? "hpc" : "s3",
  s3Uri: "s3://archive/group/project",
});

const pages = [
  ["project", ProjectPage],
  ["sample", SamplePage],
  ["run", RunPage],
];

describe("archived detail pages", () => {
  it.each(
    pages.flatMap(([kind, page]) =>
      ["aws_pending_hpc_deletion", "aws"].map((state) => [kind, state, page])
    )
  )(
    "uses %s DB records in %s when filesystem reconciliation is not applicable",
    async (kind, state, page) => {
      const result = await page.asyncData({
        route: { query: { id: "project-1" } },
        error: vi.fn(),
        $axios: {
          get: vi.fn().mockResolvedValue({
            status: 200,
            data: {
              [kind]: {
                _id: "project-1",
                [kind === "project" ? "storage" : "projectStorage"]:
                  archivedStorage(state),
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
    }
  );

  it.each(["migrating", "aws_pending_hpc_deletion", "aws"])(
    "does not start run polling in %s",
    (state) => {
      const startPolling = vi.fn();
      RunPage.mounted.call({
        storageDescription: describeStorage(archivedStorage(state)),
        run: { status: "pending", md5VerificationStatus: "pending" },
        startPolling,
      });

      expect(startPolling).not.toHaveBeenCalled();
    }
  );
});
