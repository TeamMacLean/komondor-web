import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import HpcDirectoryFinder from "../../components/uploads/HpcDirectoryFinder.vue";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const stubs = {
  "b-field": {
    template:
      "<div class='field'><label class='label'>{{ label }}</label><slot /></div>",
    props: ["label", "message"],
  },
  "b-input": {
    template:
      "<input :value='value' @input=\"$emit('input', $event.target.value)\" />",
    props: ["value", "placeholder", "disabled"],
  },
  "b-button": {
    template:
      "<button :disabled='disabled' @click=\"$emit('click')\"><slot /></button>",
    props: ["loading", "disabled", "type", "iconLeft"],
  },
  "b-icon": { template: "<span />", props: ["icon", "size"] },
};

/** A resolved response, as axios gives for a 200. */
const ok = (data) => ({ status: 200, data });

/** An axios rejection, as a non-2xx gives. */
const rejects = (status, data) => {
  const err = new Error(`Request failed with status code ${status}`);
  err.isAxiosError = true;
  err.config = { url: "/directory-files", method: "get" };
  err.response = { status, data };
  return Promise.reject(err);
};

const createWrapper = (getImpl, props = {}) => {
  const get = vi.fn(getImpl);
  const wrapper = mount(HpcDirectoryFinder, {
    propsData: { sampleId: "sample-1", ...props },
    stubs,
    mocks: {
      $axios: { get },
      $buefy: { toast: { open: vi.fn() } },
    },
  });
  return { wrapper, get };
};

/** Runs findFiles against a directory name and settles the component. */
const find = async (wrapper, directoryName = "my-reads") => {
  await wrapper.setData({ directoryName });
  await wrapper.vm.findFiles();
  await flushPromises();
  await wrapper.vm.$nextTick();
};

describe("HpcDirectoryFinder", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.HPC_DIRECTORY_PREFIX = "/tsl/data/tempWebUploadToSequences/";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("the request", () => {
    it("sends the directory name as a query parameter", async () => {
      const { wrapper, get } = createWrapper(() =>
        Promise.resolve(ok({ filesResults: ["a.fastq"] }))
      );

      await find(wrapper, "my reads/with spaces");

      expect(get).toHaveBeenCalledWith("/directory-files", {
        params: { targetDirectoryName: "my reads/with spaces" },
      });
    });

    it("does nothing without a directory name", async () => {
      const { wrapper, get } = createWrapper(() => Promise.resolve(ok({})));
      await wrapper.vm.findFiles();
      expect(get).not.toHaveBeenCalled();
    });
  });

  // GET /directory-files answers 200 with {error} for ordinary failures and
  // throws only for a rejected path. Both must be handled.
  describe("failures reported at 200 in the body", () => {
    it.each([
      ["Issue reading target directory", "could not be read"],
      ["Directory does not exist", "does not exist"],
      ["No files found in target directory", "contains no files"],
    ])("describes %j in terms of the path", async (apiMessage, expected) => {
      const { wrapper } = createWrapper(() =>
        Promise.resolve(ok({ error: apiMessage }))
      );

      await find(wrapper);

      expect(wrapper.vm.error).toContain(expected);
      expect(wrapper.vm.error).toContain(
        "/tsl/data/tempWebUploadToSequences/my-reads"
      );
      expect(wrapper.vm.filesFound).toBe(false);
    });

    it("stops loading and emits no files", async () => {
      const { wrapper } = createWrapper(() =>
        Promise.resolve(ok({ error: "Directory does not exist" }))
      );

      await find(wrapper);

      expect(wrapper.vm.isFinding).toBe(false);
      const emitted = wrapper.emitted("files-found");
      expect(emitted[emitted.length - 1]).toEqual([[], ""]);
    });

    it("shows the server's own wording for an unrecognised failure", async () => {
      const { wrapper } = createWrapper(() =>
        Promise.resolve(ok({ error: "Some brand new failure" }))
      );

      await find(wrapper);

      expect(wrapper.vm.error).toContain("Some brand new failure");
    });
  });

  describe("failures reported by throwing", () => {
    it("describes a refused path (403)", async () => {
      const { wrapper } = createWrapper(() =>
        rejects(403, { error: "Access denied: Invalid directory path" })
      );

      await find(wrapper);

      expect(wrapper.vm.error).toContain("outside the HPC transfer area");
      // The old code put axios's own text on screen here.
      expect(wrapper.vm.error).not.toContain("status code");
    });

    it("describes an unreachable API without leaking axios internals", async () => {
      const { wrapper } = createWrapper(() => {
        const err = new Error("Network Error");
        err.isAxiosError = true;
        err.config = { url: "/directory-files" };
        return Promise.reject(err);
      });

      await find(wrapper);

      expect(wrapper.vm.error).toContain("Unable to reach the server");
    });
  });

  describe("a successful listing", () => {
    it("emits the files and reports success", async () => {
      const { wrapper } = createWrapper(() =>
        Promise.resolve(ok({ filesResults: ["r1.fastq", "r1.fastq.md5"] }))
      );

      await find(wrapper);

      expect(wrapper.vm.error).toBeNull();
      expect(wrapper.vm.filesFound).toBe(true);

      const emitted = wrapper.emitted("files-found");
      const [files, directoryName] = emitted[emitted.length - 1];
      expect(files.map((f) => f.name)).toEqual(["r1.fastq", "r1.fastq.md5"]);
      expect(files.every((f) => f.source === "hpc")).toBe(true);
      expect(directoryName).toBe("my-reads");
    });

    it("does not count checksum files towards the paired minimum", async () => {
      const { wrapper } = createWrapper(
        () =>
          Promise.resolve(
            ok({ filesResults: ["r1.fastq", "r1.fastq.md5", "r2.fastq.md5"] })
          ),
        { paired: true, allowedExtensions: [".fastq"] }
      );

      await find(wrapper);

      // One real read file, two checksums — not enough for a pair.
      expect(wrapper.vm.error).toContain("Paired libraries require at least 2");
      expect(wrapper.vm.filesFound).toBe(false);
    });

    it("rejects a file whose extension is not allowed", async () => {
      const { wrapper } = createWrapper(
        () => Promise.resolve(ok({ filesResults: ["notes.docx"] })),
        { allowedExtensions: [".fastq"] }
      );

      await find(wrapper);

      expect(wrapper.vm.error).toContain("Invalid file types found");
      expect(wrapper.vm.invalidFiles.map((f) => f.name)).toEqual([
        "notes.docx",
      ]);
    });
  });

  describe("how the error is presented", () => {
    // Buefy and this template previously rendered the API's string as HTML.
    it("renders the message as text, not markup", async () => {
      const { wrapper } = createWrapper(() =>
        Promise.resolve(ok({ error: "<img src=x onerror=alert(1)>" }))
      );

      await find(wrapper);

      expect(wrapper.html()).not.toContain("<img src=x");
      expect(wrapper.text()).toContain("<img src=x onerror=alert(1)>");
    });

    it("offers the contact line only for server-side failures", async () => {
      const { wrapper } = createWrapper(() =>
        Promise.resolve(ok({ error: "Directory does not exist" }))
      );
      await find(wrapper);
      expect(wrapper.vm.errorIsFromServer).toBe(true);
      expect(wrapper.text()).toContain("george.deeks@tsl.ac.uk");
    });

    it("omits it when the user simply picked the wrong file type", async () => {
      const { wrapper } = createWrapper(
        () => Promise.resolve(ok({ filesResults: ["notes.docx"] })),
        { allowedExtensions: [".fastq"] }
      );
      await find(wrapper);
      expect(wrapper.vm.errorIsFromServer).toBe(false);
    });
  });

  describe("resetting", () => {
    it("clears the error state when the sample changes", async () => {
      const { wrapper } = createWrapper(() =>
        Promise.resolve(ok({ error: "Directory does not exist" }))
      );
      await find(wrapper);
      expect(wrapper.vm.error).not.toBeNull();

      await wrapper.setProps({ sampleId: "sample-2" });

      expect(wrapper.vm.error).toBeNull();
      expect(wrapper.vm.errorIsFromServer).toBe(false);
      expect(wrapper.vm.directoryName).toBe("");
    });
  });
});
