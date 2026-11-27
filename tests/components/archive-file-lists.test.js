import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import ReadList from "~/components/ReadList.vue";
import AdditionalFileList from "~/components/AdditionalFileList.vue";

const stubs = {
  "b-icon": true,
  "b-tag": { template: "<span><slot /></span>" },
  "b-tooltip": {
    props: ["label"],
    template: '<span :data-tooltip="label"><slot /></span>',
  },
  "b-button": {
    template: "<button @click=\"$emit('click')\"><slot /></button>",
  },
};

const storage = (state) => ({
  state,
  acceptsHpcWrites: false,
  authoritativeLocation: state === "migrating" ? "hpc" : "s3",
  s3Uri: "s3://archive/group/project",
  s3VerifiedAt: state === "migrating" ? null : "2026-11-02T20:55:00.000Z",
  hpcVerifiedAbsentAt: state === "aws" ? "2026-11-03T09:00:00.000Z" : null,
});

describe("file lists after storage is locked", () => {
  it.each(["migrating", "aws_pending_hpc_deletion", "aws"])(
    "%s shows recorded checksum history and copies the authoritative location",
    async (state) => {
      const archived = state !== "migrating";
      const rawUri = archived
        ? "s3://archive/group/project/sample/run/raw"
        : "/mnt/reads/group/project/sample/run/raw";
      const copy = vi.fn().mockResolvedValue();
      const wrapper = mount(ReadList, {
        propsData: {
          reads: [
            {
              _id: "read",
              file: {
                originalName: "reads.fq.gz",
                locationUri: `${rawUri}/reads.fq.gz`,
              },
              MD5: "a".repeat(32),
            },
          ],
          runStatus: "pending",
          readOnly: true,
          archived,
          location: { authoritative: archived ? "s3" : "hpc", rawUri },
          storage: storage(state),
        },
        stubs,
        mocks: { $copyText: copy, $buefy: { toast: { open: vi.fn() } } },
      });
      if (archived) {
        // The AWS copy is what matters now; the arrival check is history and
        // moves into the tooltip, along with its own column.
        expect(wrapper.text()).toContain("In AWS · verified 2 November 2026");
        expect(wrapper.text()).toContain("Storage");
        expect(wrapper.text()).not.toMatch(
          /MD5 Status|Destination MD5|Not checked before|Status Legend/
        );
        const tooltip = wrapper
          .find("[data-tooltip]")
          .attributes("data-tooltip");
        expect(tooltip).toContain("this page does not run a fresh check");
        expect(tooltip).toContain(
          "Checksum on arrival: Not checked before archive."
        );
        expect(tooltip).toContain(
          state === "aws"
            ? "confirmed removed on 3 November 2026"
            : "has not yet been removed"
        );
      } else {
        expect(wrapper.text()).toContain("Not checked before move");
        expect(wrapper.text()).toContain("Destination MD5");
        expect(wrapper.text()).not.toContain("In AWS");
      }
      expect(wrapper.text()).not.toMatch(/Calculating|Awaiting|Checking/);
      expect(wrapper.find("a[href]").exists()).toBe(false);
      await wrapper.find("button").trigger("click");
      expect(copy).toHaveBeenCalledWith(`${rawUri}/reads.fq.gz`);
      wrapper.destroy();
    }
  );

  it("does not report an empty archived file list as missing HPC data", () => {
    for (const component of [ReadList, AdditionalFileList]) {
      const wrapper = mount(component, {
        propsData: { readOnly: true, archived: true },
        stubs,
      });
      expect(wrapper.text()).toContain("recorded");
      expect(wrapper.text()).not.toMatch(/HPC|processing|contact admin/i);
      wrapper.destroy();
    }
  });

  it("keeps a recorded checksum mismatch visible on an archived file", () => {
    const wrapper = mount(ReadList, {
      propsData: {
        reads: [
          {
            _id: "read",
            file: { originalName: "reads.fq.gz" },
            MD5: "a".repeat(32),
            destinationMd5: "b".repeat(32),
            md5Mismatch: true,
          },
        ],
        readOnly: true,
        archived: true,
        storage: storage("aws"),
      },
      stubs,
    });
    expect(wrapper.text()).toContain("In AWS · verified 2 November 2026");
    expect(wrapper.text()).toContain("Mismatch recorded before archive");
    wrapper.destroy();
  });

  it("does not claim verification when no date is recorded", () => {
    const wrapper = mount(ReadList, {
      propsData: {
        reads: [{ _id: "read", file: { originalName: "reads.fq.gz" } }],
        readOnly: true,
        archived: true,
        storage: { ...storage("aws"), s3VerifiedAt: null },
      },
      stubs,
    });
    expect(wrapper.text()).toContain("In AWS · verification date not recorded");
    expect(wrapper.text()).not.toContain("In AWS · verified");
    wrapper.destroy();
  });

  it("falls back to the checksum columns when no storage summary is passed", () => {
    const wrapper = mount(ReadList, {
      propsData: {
        reads: [
          {
            _id: "read",
            file: { originalName: "reads.fq.gz" },
            MD5: "a".repeat(32),
          },
        ],
        readOnly: true,
        archived: true,
      },
      stubs,
    });
    expect(wrapper.text()).toContain("Not checked before archive");
    expect(wrapper.text()).toContain("Destination MD5");
    wrapper.destroy();
  });

  it("states the AWS status once above archived additional files", () => {
    const wrapper = mount(AdditionalFileList, {
      propsData: {
        files: [{ _id: "f", fileName: "notes.txt", verified: true }],
        readOnly: true,
        archived: true,
        storage: storage("aws_pending_hpc_deletion"),
      },
      stubs,
    });
    expect(wrapper.text()).toContain("In AWS · verified 2 November 2026");
    wrapper.destroy();
  });
});

describe("additional files once the HPC copy is deleted", () => {
  const files = [{ fileName: "notes.txt", verified: true }];
  const location = {
    authoritative: "s3",
    additionalUri: "s3://archive/group/project/additional",
  };

  it("offers no per-file copy button", () => {
    const wrapper = mount(AdditionalFileList, {
      propsData: {
        files,
        location,
        archived: true,
        readOnly: true,
        hideCopy: true,
      },
      stubs,
    });
    expect(wrapper.text()).toContain("notes.txt");
    expect(wrapper.find("button").exists()).toBe(false);
    wrapper.destroy();
  });

  it("still offers it while the HPC copy exists", () => {
    const wrapper = mount(AdditionalFileList, {
      propsData: { files, location, archived: true, readOnly: true },
      stubs,
    });
    expect(wrapper.find("button").text()).toBe("Copy S3 location");
    wrapper.destroy();
  });
});
