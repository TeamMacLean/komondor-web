import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import ReadList from "~/components/ReadList.vue";
import AdditionalFileList from "~/components/AdditionalFileList.vue";

const stubs = {
  "b-icon": true,
  "b-tag": { template: "<span><slot /></span>" },
  "b-tooltip": { template: "<span><slot /></span>" },
  "b-button": {
    template: "<button @click=\"$emit('click')\"><slot /></button>",
  },
};

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
        },
        stubs,
        mocks: { $copyText: copy, $buefy: { toast: { open: vi.fn() } } },
      });
      expect(wrapper.text()).toContain(
        `Not checked before ${archived ? "archive" : "move"}`
      );
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
