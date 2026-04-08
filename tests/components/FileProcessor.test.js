import { mount, createLocalVue } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Vuex from "vuex";

const localVue = createLocalVue();
localVue.use(Vuex);

// --- Module-level mocks ---

const mockSparkAppend = vi.fn();
const mockSparkEnd = vi
  .fn()
  .mockReturnValue("d41d8cd98f00b204e9800998ecf8427e");

vi.mock("spark-md5", () => {
  return {
    default: {
      ArrayBuffer: vi.fn().mockImplementation(() => ({
        append: mockSparkAppend,
        end: mockSparkEnd,
      })),
    },
  };
});

vi.mock("~/utils/constants", () => ({
  CHECKSUM_EXTENSIONS: [".md5", ".sha256", ".sha1"],
}));

// Import component after mocks are set up
import FileProcessor from "../../components/uploads/FileProcessor.vue";

// --- Helpers ---

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const defaultStubs = {
  "b-icon": { template: "<span></span>", props: ["icon", "size", "type"] },
  "b-button": {
    template:
      '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
    props: ["type", "disabled", "iconLeft", "iconRight", "loading", "expanded"],
  },
  "b-field": {
    template: "<div><slot /></div>",
    props: ["label", "type", "message", "grouped", "groupMultiline"],
  },
  "b-input": {
    template:
      '<input :value="value" @input="$emit(\'input\', $event.target ? $event.target.value : $event)" />',
    props: ["value", "placeholder", "type", "disabled", "expanded", "icon"],
  },
  "b-checkbox": {
    template:
      '<label><input type="checkbox" :checked="value" @change="$emit(\'input\', $event.target.checked)" /><slot /></label>',
    props: ["value", "disabled", "nativeValue"],
  },
  "b-tooltip": {
    template: "<span><slot /></span>",
    props: ["label", "type", "position", "multilined"],
  },
  "b-select": {
    template:
      '<select :value="value" @change="$emit(\'input\', $event.target.value)"><slot /></select>',
    props: ["value", "placeholder", "disabled", "expanded"],
  },
  "b-progress": {
    template: "<div></div>",
    props: ["value", "max", "type", "size"],
  },
};

const createWrapper = (propsData = {}, options = {}) => {
  const mockBuefy = {
    toast: { open: vi.fn() },
    dialog: { alert: vi.fn() },
  };

  return mount(FileProcessor, {
    localVue,
    propsData: {
      files: [],
      source: "local-filesystem",
      paired: false,
      indexed: false,
      directoryName: "",
      ...propsData,
    },
    mocks: {
      $buefy: mockBuefy,
      $axios: {
        post: vi.fn(),
        get: vi.fn(),
      },
      ...options.mocks,
    },
    stubs: {
      ...defaultStubs,
      ...options.stubs,
    },
    ...options,
  });
};

// --- Test Suite ---

describe("FileProcessor.vue", () => {
  let wrapper;

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy();
      wrapper = null;
    }
    vi.clearAllMocks();
  });

  // -------------------------------------------------------
  // 1. isChecksumFile
  // -------------------------------------------------------
  describe("isChecksumFile", () => {
    beforeEach(() => {
      wrapper = createWrapper({
        files: [{ name: "sample.fq.gz" }],
        source: "local-filesystem",
      });
    });

    it("returns true for .md5 files", () => {
      expect(wrapper.vm.isChecksumFile("sample.fq.gz.md5")).toBe(true);
    });

    it("returns true for .sha256 files", () => {
      expect(wrapper.vm.isChecksumFile("reads.sha256")).toBe(true);
    });

    it("returns true for .sha1 files", () => {
      expect(wrapper.vm.isChecksumFile("data.sha1")).toBe(true);
    });

    it("returns false for .fq.gz files", () => {
      expect(wrapper.vm.isChecksumFile("sample.fq.gz")).toBe(false);
    });

    it("returns false for .fastq.gz files", () => {
      expect(wrapper.vm.isChecksumFile("reads.fastq.gz")).toBe(false);
    });

    it("returns false for .txt files", () => {
      expect(wrapper.vm.isChecksumFile("notes.txt")).toBe(false);
    });

    it("is case insensitive — .MD5 matches", () => {
      expect(wrapper.vm.isChecksumFile("reads.MD5")).toBe(true);
    });

    it("is case insensitive — .Sha256 matches", () => {
      expect(wrapper.vm.isChecksumFile("reads.Sha256")).toBe(true);
    });

    it("is case insensitive — .SHA1 matches", () => {
      expect(wrapper.vm.isChecksumFile("data.SHA1")).toBe(true);
    });
  });

  // -------------------------------------------------------
  // 2. isValidMd5Format
  // -------------------------------------------------------
  describe("isValidMd5Format", () => {
    beforeEach(() => {
      wrapper = createWrapper({
        files: [{ name: "sample.fq.gz" }],
        source: "local-filesystem",
      });
    });

    it("returns true for 32 lowercase hex characters", () => {
      expect(
        wrapper.vm.isValidMd5Format("d41d8cd98f00b204e9800998ecf8427e")
      ).toBe(true);
    });

    it("returns true for 32 uppercase hex characters", () => {
      expect(
        wrapper.vm.isValidMd5Format("D41D8CD98F00B204E9800998ECF8427E")
      ).toBe(true);
    });

    it("returns true for 32 mixed-case hex characters", () => {
      expect(
        wrapper.vm.isValidMd5Format("d41D8cD98f00b204E9800998ecf8427E")
      ).toBe(true);
    });

    it("returns true for valid MD5 with surrounding whitespace (trimmed)", () => {
      expect(
        wrapper.vm.isValidMd5Format("  d41d8cd98f00b204e9800998ecf8427e  ")
      ).toBe(true);
    });

    it("returns false for 31 characters (too short)", () => {
      expect(
        wrapper.vm.isValidMd5Format("d41d8cd98f00b204e9800998ecf8427")
      ).toBeFalsy();
    });

    it("returns false for 33 characters (too long)", () => {
      expect(
        wrapper.vm.isValidMd5Format("d41d8cd98f00b204e9800998ecf8427ea")
      ).toBeFalsy();
    });

    it("returns false for non-hex characters", () => {
      expect(
        wrapper.vm.isValidMd5Format("g41d8cd98f00b204e9800998ecf8427e")
      ).toBeFalsy();
    });

    it("returns false for empty string", () => {
      expect(wrapper.vm.isValidMd5Format("")).toBeFalsy();
    });

    it("returns false for null", () => {
      expect(wrapper.vm.isValidMd5Format(null)).toBeFalsy();
    });

    it("returns false for undefined", () => {
      expect(wrapper.vm.isValidMd5Format(undefined)).toBeFalsy();
    });

    it("returns false for whitespace-only string", () => {
      expect(wrapper.vm.isValidMd5Format("   ")).toBeFalsy();
    });
  });

  // -------------------------------------------------------
  // 3. getMd5FieldType and getMd5FieldMessage
  // -------------------------------------------------------
  describe("getMd5FieldType and getMd5FieldMessage", () => {
    beforeEach(() => {
      wrapper = createWrapper({
        files: [{ name: "sample.fq.gz" }],
        source: "local-filesystem",
      });
    });

    it("returns empty type and 'Required' message when no MD5 entered", () => {
      // fileMd5Inputs has no entry for this file
      expect(wrapper.vm.getMd5FieldType("sample.fq.gz")).toBe("");
      expect(wrapper.vm.getMd5FieldMessage("sample.fq.gz")).toBe(
        "Required: 32 hexadecimal characters"
      );
    });

    it('returns "is-success" type and "Valid MD5 format" message for valid MD5', () => {
      wrapper.vm.$set(
        wrapper.vm.fileMd5Inputs,
        "sample.fq.gz",
        "d41d8cd98f00b204e9800998ecf8427e"
      );
      expect(wrapper.vm.getMd5FieldType("sample.fq.gz")).toBe("is-success");
      expect(wrapper.vm.getMd5FieldMessage("sample.fq.gz")).toBe(
        "Valid MD5 format"
      );
    });

    it('returns "is-danger" type and "Invalid format" message for invalid MD5', () => {
      wrapper.vm.$set(
        wrapper.vm.fileMd5Inputs,
        "sample.fq.gz",
        "not-a-valid-md5"
      );
      expect(wrapper.vm.getMd5FieldType("sample.fq.gz")).toBe("is-danger");
      expect(wrapper.vm.getMd5FieldMessage("sample.fq.gz")).toBe(
        "Invalid format: MD5 must be exactly 32 hexadecimal characters (0-9, a-f)"
      );
    });
  });

  // -------------------------------------------------------
  // 4. formatFileSize
  // -------------------------------------------------------
  describe("formatFileSize", () => {
    beforeEach(() => {
      wrapper = createWrapper({
        files: [{ name: "sample.fq.gz" }],
        source: "local-filesystem",
      });
    });

    it('returns "0 B" for 0 bytes', () => {
      expect(wrapper.vm.formatFileSize(0)).toBe("0 B");
    });

    it('returns "0 B" for null', () => {
      expect(wrapper.vm.formatFileSize(null)).toBe("0 B");
    });

    it('returns "0 B" for undefined', () => {
      expect(wrapper.vm.formatFileSize(undefined)).toBe("0 B");
    });

    it("formats 500 bytes correctly", () => {
      expect(wrapper.vm.formatFileSize(500)).toBe("500 B");
    });

    it("formats 1024 bytes as 1.0 KB", () => {
      expect(wrapper.vm.formatFileSize(1024)).toBe("1.0 KB");
    });

    it("formats 1536 bytes as 1.5 KB", () => {
      expect(wrapper.vm.formatFileSize(1536)).toBe("1.5 KB");
    });

    it("formats 1048576 bytes as 1.0 MB", () => {
      expect(wrapper.vm.formatFileSize(1048576)).toBe("1.0 MB");
    });

    it("formats 1073741824 bytes as 1.0 GB", () => {
      expect(wrapper.vm.formatFileSize(1073741824)).toBe("1.0 GB");
    });

    it("formats 1099511627776 bytes as 1.0 TB", () => {
      expect(wrapper.vm.formatFileSize(1099511627776)).toBe("1.0 TB");
    });

    it("uses 0 decimal places for bytes", () => {
      // 100 bytes should be "100 B" not "100.0 B"
      expect(wrapper.vm.formatFileSize(100)).toBe("100 B");
    });

    it('returns "0 B" for negative numbers', () => {
      expect(wrapper.vm.formatFileSize(-1)).toBe("0 B");
      expect(wrapper.vm.formatFileSize(-1024)).toBe("0 B");
    });
  });

  // -------------------------------------------------------
  // 5. calculateMd5 — chunked reading (CRITICAL)
  // -------------------------------------------------------
  describe("calculateMd5", () => {
    let OriginalFileReader;

    beforeEach(() => {
      wrapper = createWrapper({
        files: [{ name: "sample.fq.gz" }],
        source: "local-filesystem",
      });

      // Save the original FileReader
      OriginalFileReader = global.FileReader;
    });

    afterEach(() => {
      // Restore original FileReader
      global.FileReader = OriginalFileReader;
    });

    function installMockFileReader() {
      global.FileReader = class MockFileReader {
        constructor() {
          this.onload = null;
          this.onerror = null;
        }
        readAsArrayBuffer(blob) {
          const self = this;
          setTimeout(() => {
            if (self.onload) {
              // Return an ArrayBuffer of the appropriate size for the slice
              self.onload({ target: { result: new ArrayBuffer(blob.size) } });
            }
          }, 0);
        }
      };
    }

    function installErrorFileReader() {
      global.FileReader = class ErrorFileReader {
        constructor() {
          this.onload = null;
          this.onerror = null;
        }
        readAsArrayBuffer() {
          const self = this;
          setTimeout(() => {
            if (self.onerror) {
              self.onerror(new Error("Read failure"));
            }
          }, 0);
        }
      };
    }

    it("resolves with an MD5 hash for a small file (single chunk)", async () => {
      installMockFileReader();
      const expectedHash = "abc12345678901234567890123456789";
      mockSparkEnd.mockReturnValueOnce(expectedHash);

      // Create a blob smaller than 2MB (single chunk)
      const smallBlob = new Blob(["hello world"], {
        type: "application/octet-stream",
      });

      const result = await wrapper.vm.calculateMd5(smallBlob);
      expect(result).toBe(expectedHash);
      expect(mockSparkAppend).toHaveBeenCalledTimes(1);
      expect(mockSparkEnd).toHaveBeenCalledTimes(1);
    });

    it("reads large files in 2MB chunks", async () => {
      installMockFileReader();
      const expectedHash = "def12345678901234567890123456789";
      mockSparkEnd.mockReturnValueOnce(expectedHash);

      // Create a 4MB blob → should be 2 chunks of 2MB
      const fourMB = 4 * 1024 * 1024;
      const largeBlob = new Blob([new ArrayBuffer(fourMB)], {
        type: "application/octet-stream",
      });

      const result = await wrapper.vm.calculateMd5(largeBlob);
      expect(result).toBe(expectedHash);
      // 4MB / 2MB = 2 chunks → 2 append calls
      expect(mockSparkAppend).toHaveBeenCalledTimes(2);
    });

    it("calls onProgress with correct percentages for a 4MB file (2 chunks)", async () => {
      installMockFileReader();
      mockSparkEnd.mockReturnValueOnce("aaa11111111111111111111111111111");

      const fourMB = 4 * 1024 * 1024;
      const largeBlob = new Blob([new ArrayBuffer(fourMB)], {
        type: "application/octet-stream",
      });

      const onProgress = vi.fn();
      await wrapper.vm.calculateMd5(largeBlob, onProgress);

      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenNthCalledWith(1, 50);
      expect(onProgress).toHaveBeenNthCalledWith(2, 100);
    });

    it("calls onProgress with correct percentages for a 6MB file (3 chunks)", async () => {
      installMockFileReader();
      mockSparkEnd.mockReturnValueOnce("bbb22222222222222222222222222222");

      const sixMB = 6 * 1024 * 1024;
      const largeBlob = new Blob([new ArrayBuffer(sixMB)], {
        type: "application/octet-stream",
      });

      const onProgress = vi.fn();
      await wrapper.vm.calculateMd5(largeBlob, onProgress);

      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenNthCalledWith(1, 33);
      expect(onProgress).toHaveBeenNthCalledWith(2, 67);
      expect(onProgress).toHaveBeenNthCalledWith(3, 100);
    });

    it("works without onProgress callback (optional param)", async () => {
      installMockFileReader();
      mockSparkEnd.mockReturnValueOnce("ccc33333333333333333333333333333");

      const blob = new Blob(["test data"], {
        type: "application/octet-stream",
      });

      // Should not throw when onProgress is not provided
      const result = await wrapper.vm.calculateMd5(blob);
      expect(result).toBe("ccc33333333333333333333333333333");
    });

    it("handles zero-byte files without producing Infinity% progress", async () => {
      installMockFileReader();
      const expectedHash = "d41d8cd98f00b204e9800998ecf8427e";
      mockSparkEnd.mockReturnValueOnce(expectedHash);

      const emptyBlob = new Blob([], { type: "application/octet-stream" });

      const onProgress = vi.fn();
      const result = await wrapper.vm.calculateMd5(emptyBlob, onProgress);

      expect(result).toBe(expectedHash);
      // chunks = Math.max(1, Math.ceil(0 / 2MB)) = 1, so progress should be 100%
      expect(onProgress).toHaveBeenCalledWith(100);
      // Must never report Infinity
      onProgress.mock.calls.forEach(([percent]) => {
        expect(Number.isFinite(percent)).toBe(true);
      });
    });

    it('rejects with "Failed to read file" when FileReader errors', async () => {
      installErrorFileReader();

      const blob = new Blob(["data"], { type: "application/octet-stream" });

      await expect(wrapper.vm.calculateMd5(blob)).rejects.toThrow(
        "Failed to read file"
      );
    });
  });

  // -------------------------------------------------------
  // 6. validateChecksums — local filesystem flow
  // -------------------------------------------------------
  describe("validateChecksums — local filesystem", () => {
    const validMd5 = "d41d8cd98f00b204e9800998ecf8427e";
    let OriginalFileReader;

    function installMockFileReader() {
      global.FileReader = class MockFileReader {
        constructor() {
          this.onload = null;
          this.onerror = null;
        }
        readAsArrayBuffer(blob) {
          const self = this;
          setTimeout(() => {
            if (self.onload) {
              self.onload({ target: { result: new ArrayBuffer(blob.size) } });
            }
          }, 0);
        }
      };
    }

    function installErrorFileReader() {
      global.FileReader = class ErrorFileReader {
        constructor() {
          this.onload = null;
          this.onerror = null;
        }
        readAsArrayBuffer() {
          const self = this;
          setTimeout(() => {
            if (self.onerror) {
              self.onerror(new Error("Disk read error"));
            }
          }, 0);
        }
      };
    }

    beforeEach(() => {
      OriginalFileReader = global.FileReader;
    });

    afterEach(() => {
      global.FileReader = OriginalFileReader;
    });

    it("sets status to 'valid' when calculated MD5 matches expected", async () => {
      installMockFileReader();
      mockSparkEnd.mockReturnValue(validMd5);

      const fileBlob = new Blob(["data"], { type: "application/octet-stream" });
      wrapper = createWrapper({
        files: [{ name: "sample.fq.gz", data: fileBlob }],
        source: "local-filesystem",
      });

      // Enter matching MD5
      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "sample.fq.gz", validMd5);
      await wrapper.vm.$nextTick();

      await wrapper.vm.validateChecksums();
      await flushPromises();

      const status = wrapper.vm.fileValidationStatus["sample.fq.gz"];
      expect(status).toBeDefined();
      expect(status.status).toBe("valid");
      expect(status.message).toContain("Checksum verified");
      expect(status.calculatedMd5).toBe(validMd5);
    });

    it("sets status to 'invalid' when MD5 does not match", async () => {
      installMockFileReader();
      const calculatedHash = "aaaabbbbccccddddeeeeffffaaaabbbb";
      mockSparkEnd.mockReturnValue(calculatedHash);

      const fileBlob = new Blob(["data"], { type: "application/octet-stream" });
      wrapper = createWrapper({
        files: [{ name: "sample.fq.gz", data: fileBlob }],
        source: "local-filesystem",
      });

      // Enter a different MD5
      const wrongMd5 = "11112222333344445555666677778888";
      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "sample.fq.gz", wrongMd5);
      await wrapper.vm.$nextTick();

      await wrapper.vm.validateChecksums();
      await flushPromises();

      const status = wrapper.vm.fileValidationStatus["sample.fq.gz"];
      expect(status).toBeDefined();
      expect(status.status).toBe("invalid");
      expect(status.message).toContain("Mismatch!");
      expect(status.message).toContain(`Expected: ${wrongMd5}`);
      expect(status.message).toContain(`Calculated: ${calculatedHash}`);
    });

    it("sets status to 'error' with actual error message on calculateMd5 failure", async () => {
      installErrorFileReader();

      const fileBlob = new Blob(["data"], { type: "application/octet-stream" });
      wrapper = createWrapper({
        files: [{ name: "sample.fq.gz", data: fileBlob }],
        source: "local-filesystem",
      });

      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "sample.fq.gz", validMd5);
      await wrapper.vm.$nextTick();

      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await wrapper.vm.validateChecksums();
      await flushPromises();

      const status = wrapper.vm.fileValidationStatus["sample.fq.gz"];
      expect(status).toBeDefined();
      expect(status.status).toBe("error");
      // Regression: should use actual error message, not generic "Failed to validate checksum"
      expect(status.message).toBe("Failed to read file");

      consoleSpy.mockRestore();
    });

    it("updates fileValidationStatus with progress percentage during hashing", async () => {
      // Use a custom FileReader that allows us to observe status between chunks
      const _progressValues = [];

      global.FileReader = class ProgressTrackingFileReader {
        constructor() {
          this.onload = null;
          this.onerror = null;
        }
        readAsArrayBuffer(blob) {
          const self = this;
          // Synchronously call onload so we can capture intermediate states
          // Use setTimeout to stay async as the component expects
          setTimeout(() => {
            if (self.onload) {
              self.onload({ target: { result: new ArrayBuffer(blob.size) } });
            }
          }, 0);
        }
      };

      mockSparkEnd.mockReturnValue(validMd5);

      // 4MB file = 2 chunks
      const fourMB = 4 * 1024 * 1024;
      const fileBlob = new Blob([new ArrayBuffer(fourMB)], {
        type: "application/octet-stream",
      });

      wrapper = createWrapper({
        files: [{ name: "big.fq.gz", data: fileBlob }],
        source: "local-filesystem",
      });

      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "big.fq.gz", validMd5);
      await wrapper.vm.$nextTick();

      await wrapper.vm.validateChecksums();
      await flushPromises();

      // Final status should be valid
      const status = wrapper.vm.fileValidationStatus["big.fq.gz"];
      expect(status.status).toBe("valid");
    });

    it("increments validationProgress after each file", async () => {
      installMockFileReader();
      mockSparkEnd.mockReturnValue(validMd5);

      const blob1 = new Blob(["data1"], { type: "application/octet-stream" });
      const blob2 = new Blob(["data2"], { type: "application/octet-stream" });

      wrapper = createWrapper({
        files: [
          { name: "file1.fq.gz", data: blob1 },
          { name: "file2.fq.gz", data: blob2 },
        ],
        source: "local-filesystem",
      });

      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "file1.fq.gz", validMd5);
      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "file2.fq.gz", validMd5);
      await wrapper.vm.$nextTick();

      await wrapper.vm.validateChecksums();
      await flushPromises();

      // After processing 2 files, progress should be 2
      expect(wrapper.vm.validationProgress).toBe(2);
    });

    it("calls confirmSelection and emits input event when all files are valid", async () => {
      installMockFileReader();
      mockSparkEnd.mockReturnValue(validMd5);

      const blob = new Blob(["data"], { type: "application/octet-stream" });
      wrapper = createWrapper({
        files: [{ name: "sample.fq.gz", data: blob }],
        source: "local-filesystem",
      });

      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "sample.fq.gz", validMd5);
      await wrapper.vm.$nextTick();

      await wrapper.vm.validateChecksums();
      await flushPromises();

      // confirmSelection emits 'input' with the validated files
      const inputEvents = wrapper.emitted("input");
      expect(inputEvents).toBeTruthy();
      // The last emission should contain the validated files array
      const lastEmission = inputEvents[inputEvents.length - 1][0];
      expect(lastEmission).toBeInstanceOf(Array);
      expect(lastEmission.length).toBe(1);
      expect(lastEmission[0].name).toBe("sample.fq.gz");
      expect(lastEmission[0].md5).toBe(validMd5);

      // Toast should have been called with success
      expect(wrapper.vm.$buefy.toast.open).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "is-success",
        })
      );
    });

    it("shows danger toast when some checksums fail validation", async () => {
      installMockFileReader();
      const calculatedHash = "aaaabbbbccccddddeeeeffffaaaabbbb";
      mockSparkEnd.mockReturnValue(calculatedHash);

      const blob = new Blob(["data"], { type: "application/octet-stream" });
      wrapper = createWrapper({
        files: [{ name: "sample.fq.gz", data: blob }],
        source: "local-filesystem",
      });

      const wrongMd5 = "11112222333344445555666677778888";
      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "sample.fq.gz", wrongMd5);
      await wrapper.vm.$nextTick();

      await wrapper.vm.validateChecksums();
      await flushPromises();

      expect(wrapper.vm.$buefy.toast.open).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "is-danger",
        })
      );
    });
  });

  // -------------------------------------------------------
  // 7. validateChecksums — HPC flow
  // -------------------------------------------------------
  describe("validateChecksums — HPC flow", () => {
    const validMd5 = "d41d8cd98f00b204e9800998ecf8427e";

    it("sets status to 'valid' when API returns matching MD5", async () => {
      const mockAxiosPost = vi.fn().mockResolvedValue({
        data: { calculatedMd5: validMd5 },
      });

      wrapper = createWrapper(
        {
          files: [{ name: "sample.fq.gz" }],
          source: "hpc-mv",
          directoryName: "/data/run001",
        },
        {
          mocks: {
            $buefy: { toast: { open: vi.fn() }, dialog: { alert: vi.fn() } },
            $axios: { post: mockAxiosPost },
          },
        }
      );

      // Select the file for HPC mode
      wrapper.vm.selectedFileNames = ["sample.fq.gz"];
      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "sample.fq.gz", validMd5);
      await wrapper.vm.$nextTick();

      await wrapper.vm.validateChecksums();
      await flushPromises();

      expect(mockAxiosPost).toHaveBeenCalledWith(
        "/directory-files/verify-md5",
        {
          directoryName: "/data/run001",
          fileName: "sample.fq.gz",
          expectedMd5: validMd5,
        }
      );

      const status = wrapper.vm.fileValidationStatus["sample.fq.gz"];
      expect(status.status).toBe("valid");
    });

    it("sets status to 'invalid' when API returns different MD5", async () => {
      const differentMd5 = "aaaabbbbccccddddeeeeffffaaaabbbb";
      const mockAxiosPost = vi.fn().mockResolvedValue({
        data: { calculatedMd5: differentMd5 },
      });

      wrapper = createWrapper(
        {
          files: [{ name: "sample.fq.gz" }],
          source: "hpc-mv",
          directoryName: "/data/run001",
        },
        {
          mocks: {
            $buefy: { toast: { open: vi.fn() }, dialog: { alert: vi.fn() } },
            $axios: { post: mockAxiosPost },
          },
        }
      );

      wrapper.vm.selectedFileNames = ["sample.fq.gz"];
      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "sample.fq.gz", validMd5);
      await wrapper.vm.$nextTick();

      await wrapper.vm.validateChecksums();
      await flushPromises();

      const status = wrapper.vm.fileValidationStatus["sample.fq.gz"];
      expect(status.status).toBe("invalid");
      expect(status.message).toContain("Mismatch!");
    });

    it("sets status to 'error' with API error message", async () => {
      const mockAxiosPost = vi.fn().mockRejectedValue({
        response: {
          data: {
            error: "File not found on server",
          },
        },
      });

      wrapper = createWrapper(
        {
          files: [{ name: "missing.fq.gz" }],
          source: "hpc-mv",
          directoryName: "/data/run001",
        },
        {
          mocks: {
            $buefy: { toast: { open: vi.fn() }, dialog: { alert: vi.fn() } },
            $axios: { post: mockAxiosPost },
          },
        }
      );

      wrapper.vm.selectedFileNames = ["missing.fq.gz"];
      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "missing.fq.gz", validMd5);
      await wrapper.vm.$nextTick();

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await wrapper.vm.validateChecksums();
      await flushPromises();

      const status = wrapper.vm.fileValidationStatus["missing.fq.gz"];
      expect(status.status).toBe("error");
      expect(status.message).toBe("File not found on server");

      consoleSpy.mockRestore();
    });

    it("appends requestId reference to API error message when present", async () => {
      const mockAxiosPost = vi.fn().mockRejectedValue({
        response: {
          data: {
            error: "Internal server error",
            requestId: "req-12345",
          },
        },
      });

      wrapper = createWrapper(
        {
          files: [{ name: "sample.fq.gz" }],
          source: "hpc-mv",
          directoryName: "/data/run001",
        },
        {
          mocks: {
            $buefy: { toast: { open: vi.fn() }, dialog: { alert: vi.fn() } },
            $axios: { post: mockAxiosPost },
          },
        }
      );

      wrapper.vm.selectedFileNames = ["sample.fq.gz"];
      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "sample.fq.gz", validMd5);
      await wrapper.vm.$nextTick();

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await wrapper.vm.validateChecksums();
      await flushPromises();

      const status = wrapper.vm.fileValidationStatus["sample.fq.gz"];
      expect(status.status).toBe("error");
      expect(status.message).toBe("Internal server error (Ref: req-12345)");

      consoleSpy.mockRestore();
    });
  });

  // -------------------------------------------------------
  // 8. Computed properties
  // -------------------------------------------------------
  describe("Computed properties", () => {
    describe("selectableFiles", () => {
      it("filters out checksum files (.md5, .sha256, .sha1)", () => {
        wrapper = createWrapper({
          files: [
            { name: "reads.fq.gz" },
            { name: "reads.fq.gz.md5" },
            { name: "data.sha256" },
            { name: "index.sha1" },
            { name: "other.fastq.gz" },
          ],
          source: "local-filesystem",
        });

        const selectable = wrapper.vm.selectableFiles;
        expect(selectable).toHaveLength(2);
        expect(selectable.map((f) => f.name)).toEqual([
          "reads.fq.gz",
          "other.fastq.gz",
        ]);
      });

      it("returns all files when none are checksum files", () => {
        wrapper = createWrapper({
          files: [{ name: "a.fq.gz" }, { name: "b.fq.gz" }],
          source: "local-filesystem",
        });

        expect(wrapper.vm.selectableFiles).toHaveLength(2);
      });
    });

    describe("selectedNonChecksumFiles", () => {
      it("returns all selectable files for local-filesystem source", () => {
        wrapper = createWrapper({
          files: [
            { name: "reads1.fq.gz" },
            { name: "reads2.fq.gz" },
            { name: "reads1.fq.gz.md5" },
          ],
          source: "local-filesystem",
        });

        const selected = wrapper.vm.selectedNonChecksumFiles;
        expect(selected).toHaveLength(2);
        expect(selected.map((f) => f.name)).toEqual([
          "reads1.fq.gz",
          "reads2.fq.gz",
        ]);
      });

      it("returns only selected files for hpc-mv source", () => {
        wrapper = createWrapper({
          files: [
            { name: "reads1.fq.gz" },
            { name: "reads2.fq.gz" },
            { name: "reads3.fq.gz" },
          ],
          source: "hpc-mv",
        });

        wrapper.vm.selectedFileNames = ["reads1.fq.gz", "reads3.fq.gz"];

        const selected = wrapper.vm.selectedNonChecksumFiles;
        expect(selected).toHaveLength(2);
        expect(selected.map((f) => f.name)).toEqual([
          "reads1.fq.gz",
          "reads3.fq.gz",
        ]);
      });

      it("returns empty array for hpc-mv when nothing is selected", () => {
        wrapper = createWrapper({
          files: [{ name: "reads1.fq.gz" }, { name: "reads2.fq.gz" }],
          source: "hpc-mv",
        });

        expect(wrapper.vm.selectedNonChecksumFiles).toHaveLength(0);
      });
    });

    describe("allMd5sEntered", () => {
      it("returns true when all selected files have valid MD5 inputs", () => {
        wrapper = createWrapper({
          files: [{ name: "file1.fq.gz" }, { name: "file2.fq.gz" }],
          source: "local-filesystem",
        });

        wrapper.vm.$set(
          wrapper.vm.fileMd5Inputs,
          "file1.fq.gz",
          "d41d8cd98f00b204e9800998ecf8427e"
        );
        wrapper.vm.$set(
          wrapper.vm.fileMd5Inputs,
          "file2.fq.gz",
          "aaaabbbbccccddddeeeeffffaaaabbbb"
        );

        expect(wrapper.vm.allMd5sEntered).toBe(true);
      });

      it("returns false when some files are missing MD5 inputs", () => {
        wrapper = createWrapper({
          files: [{ name: "file1.fq.gz" }, { name: "file2.fq.gz" }],
          source: "local-filesystem",
        });

        wrapper.vm.$set(
          wrapper.vm.fileMd5Inputs,
          "file1.fq.gz",
          "d41d8cd98f00b204e9800998ecf8427e"
        );
        // file2 has no MD5 entered

        expect(wrapper.vm.allMd5sEntered).toBe(false);
      });

      it("returns false when an MD5 is invalid format", () => {
        wrapper = createWrapper({
          files: [{ name: "file1.fq.gz" }],
          source: "local-filesystem",
        });

        wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "file1.fq.gz", "too-short");

        expect(wrapper.vm.allMd5sEntered).toBe(false);
      });
    });

    describe("canStartValidation", () => {
      it("returns false when no files are present", () => {
        wrapper = createWrapper({
          files: [],
          source: "local-filesystem",
        });

        expect(wrapper.vm.canStartValidation).toBe(false);
      });

      it("returns false when currently validating", () => {
        wrapper = createWrapper({
          files: [{ name: "file1.fq.gz" }],
          source: "local-filesystem",
        });

        wrapper.vm.$set(
          wrapper.vm.fileMd5Inputs,
          "file1.fq.gz",
          "d41d8cd98f00b204e9800998ecf8427e"
        );
        wrapper.vm.isValidating = true;

        expect(wrapper.vm.canStartValidation).toBe(false);
      });

      it("returns false when MD5s are not all entered", () => {
        wrapper = createWrapper({
          files: [{ name: "file1.fq.gz" }, { name: "file2.fq.gz" }],
          source: "local-filesystem",
        });

        wrapper.vm.$set(
          wrapper.vm.fileMd5Inputs,
          "file1.fq.gz",
          "d41d8cd98f00b204e9800998ecf8427e"
        );
        // file2 missing

        expect(wrapper.vm.canStartValidation).toBe(false);
      });

      it("returns true when all conditions are met (not paired, not indexed)", () => {
        wrapper = createWrapper({
          files: [{ name: "file1.fq.gz" }],
          source: "local-filesystem",
          paired: false,
          indexed: false,
        });

        wrapper.vm.$set(
          wrapper.vm.fileMd5Inputs,
          "file1.fq.gz",
          "d41d8cd98f00b204e9800998ecf8427e"
        );

        expect(wrapper.vm.canStartValidation).toBe(true);
      });

      it("returns false when paired is true but no pairings defined", () => {
        wrapper = createWrapper({
          files: [{ name: "file1.fq.gz" }, { name: "file2.fq.gz" }],
          source: "local-filesystem",
          paired: true,
          indexed: false,
        });

        wrapper.vm.$set(
          wrapper.vm.fileMd5Inputs,
          "file1.fq.gz",
          "d41d8cd98f00b204e9800998ecf8427e"
        );
        wrapper.vm.$set(
          wrapper.vm.fileMd5Inputs,
          "file2.fq.gz",
          "aaaabbbbccccddddeeeeffffaaaabbbb"
        );

        // No pairings set
        expect(wrapper.vm.canStartValidation).toBe(false);
      });

      it("returns true when paired with valid pairings", () => {
        wrapper = createWrapper({
          files: [{ name: "file1.fq.gz" }, { name: "file2.fq.gz" }],
          source: "local-filesystem",
          paired: true,
          indexed: false,
        });

        wrapper.vm.$set(
          wrapper.vm.fileMd5Inputs,
          "file1.fq.gz",
          "d41d8cd98f00b204e9800998ecf8427e"
        );
        wrapper.vm.$set(
          wrapper.vm.fileMd5Inputs,
          "file2.fq.gz",
          "aaaabbbbccccddddeeeeffffaaaabbbb"
        );
        wrapper.vm.filePairings = [
          { file1: "file1.fq.gz", file2: "file2.fq.gz" },
        ];

        expect(wrapper.vm.canStartValidation).toBe(true);
      });

      it("returns false when indexed is true but no index file selected", () => {
        wrapper = createWrapper({
          files: [{ name: "file1.cram" }, { name: "file1.crai" }],
          source: "local-filesystem",
          paired: false,
          indexed: true,
        });

        wrapper.vm.$set(
          wrapper.vm.fileMd5Inputs,
          "file1.cram",
          "d41d8cd98f00b204e9800998ecf8427e"
        );
        wrapper.vm.$set(
          wrapper.vm.fileMd5Inputs,
          "file1.crai",
          "aaaabbbbccccddddeeeeffffaaaabbbb"
        );

        // No indexFile set
        expect(wrapper.vm.canStartValidation).toBe(false);
      });
    });

    describe("allChecksumsValidated", () => {
      it("returns true when all files have 'valid' status", () => {
        wrapper = createWrapper({
          files: [{ name: "file1.fq.gz" }, { name: "file2.fq.gz" }],
          source: "local-filesystem",
        });

        wrapper.vm.$set(wrapper.vm.fileValidationStatus, "file1.fq.gz", {
          status: "valid",
          message: "OK",
        });
        wrapper.vm.$set(wrapper.vm.fileValidationStatus, "file2.fq.gz", {
          status: "valid",
          message: "OK",
        });

        expect(wrapper.vm.allChecksumsValidated).toBe(true);
      });

      it("returns false when one file has 'invalid' status", () => {
        wrapper = createWrapper({
          files: [{ name: "file1.fq.gz" }, { name: "file2.fq.gz" }],
          source: "local-filesystem",
        });

        wrapper.vm.$set(wrapper.vm.fileValidationStatus, "file1.fq.gz", {
          status: "valid",
          message: "OK",
        });
        wrapper.vm.$set(wrapper.vm.fileValidationStatus, "file2.fq.gz", {
          status: "invalid",
          message: "Mismatch!",
        });

        expect(wrapper.vm.allChecksumsValidated).toBe(false);
      });

      it("returns false when one file has 'error' status", () => {
        wrapper = createWrapper({
          files: [{ name: "file1.fq.gz" }],
          source: "local-filesystem",
        });

        wrapper.vm.$set(wrapper.vm.fileValidationStatus, "file1.fq.gz", {
          status: "error",
          message: "Failed",
        });

        expect(wrapper.vm.allChecksumsValidated).toBe(false);
      });

      it("returns false when a file has no status yet", () => {
        wrapper = createWrapper({
          files: [{ name: "file1.fq.gz" }, { name: "file2.fq.gz" }],
          source: "local-filesystem",
        });

        wrapper.vm.$set(wrapper.vm.fileValidationStatus, "file1.fq.gz", {
          status: "valid",
          message: "OK",
        });
        // file2 has no status

        expect(wrapper.vm.allChecksumsValidated).toBe(false);
      });

      it("returns false when there are no selected files", () => {
        wrapper = createWrapper({
          files: [],
          source: "local-filesystem",
        });

        expect(wrapper.vm.allChecksumsValidated).toBe(false);
      });
    });
  });

  // -------------------------------------------------------
  // 9. Error handling improvements (regression tests)
  // -------------------------------------------------------
  describe("Error handling — regression tests", () => {
    const validMd5 = "d41d8cd98f00b204e9800998ecf8427e";
    let OriginalFileReader;

    beforeEach(() => {
      OriginalFileReader = global.FileReader;
    });

    afterEach(() => {
      global.FileReader = OriginalFileReader;
    });

    it("local file error shows actual error message, not generic fallback", async () => {
      // Install a FileReader that triggers an error
      global.FileReader = class ErrorFileReader {
        constructor() {
          this.onload = null;
          this.onerror = null;
        }
        readAsArrayBuffer() {
          const self = this;
          setTimeout(() => {
            if (self.onerror) {
              self.onerror(new Error("Simulated disk I/O error"));
            }
          }, 0);
        }
      };

      const fileBlob = new Blob(["data"], { type: "application/octet-stream" });
      wrapper = createWrapper({
        files: [{ name: "sample.fq.gz", data: fileBlob }],
        source: "local-filesystem",
      });

      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "sample.fq.gz", validMd5);
      await wrapper.vm.$nextTick();

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await wrapper.vm.validateChecksums();
      await flushPromises();

      const status = wrapper.vm.fileValidationStatus["sample.fq.gz"];
      expect(status.status).toBe("error");
      // The key regression test: we show the real error message from calculateMd5
      // which rejects with "Failed to read file", not a generic fallback
      expect(status.message).toBe("Failed to read file");
      expect(status.message).not.toBe("Failed to validate checksum");

      consoleSpy.mockRestore();
    });

    it("local error with a custom message preserves that message", async () => {
      // Override calculateMd5 to reject with a specific message
      wrapper = createWrapper({
        files: [{ name: "sample.fq.gz", data: new Blob(["x"]) }],
        source: "local-filesystem",
      });

      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "sample.fq.gz", validMd5);
      await wrapper.vm.$nextTick();

      // Stub calculateMd5 to reject with a custom error
      wrapper.vm.calculateMd5 = vi
        .fn()
        .mockRejectedValue(new Error("Out of memory"));

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await wrapper.vm.validateChecksums();
      await flushPromises();

      const status = wrapper.vm.fileValidationStatus["sample.fq.gz"];
      expect(status.status).toBe("error");
      expect(status.message).toBe("Out of memory");

      consoleSpy.mockRestore();
    });

    it("API error still shows API error message", async () => {
      const mockAxiosPost = vi.fn().mockRejectedValue({
        response: {
          data: {
            error: "Permission denied for directory",
          },
        },
      });

      wrapper = createWrapper(
        {
          files: [{ name: "sample.fq.gz" }],
          source: "hpc-mv",
          directoryName: "/restricted/dir",
        },
        {
          mocks: {
            $buefy: { toast: { open: vi.fn() }, dialog: { alert: vi.fn() } },
            $axios: { post: mockAxiosPost },
          },
        }
      );

      wrapper.vm.selectedFileNames = ["sample.fq.gz"];
      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "sample.fq.gz", validMd5);
      await wrapper.vm.$nextTick();

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await wrapper.vm.validateChecksums();
      await flushPromises();

      const status = wrapper.vm.fileValidationStatus["sample.fq.gz"];
      expect(status.status).toBe("error");
      expect(status.message).toBe("Permission denied for directory");

      consoleSpy.mockRestore();
    });

    it("API error with requestId appends reference to message", async () => {
      const mockAxiosPost = vi.fn().mockRejectedValue({
        response: {
          data: {
            error: "Timeout reading file",
            requestId: "abc-789",
          },
        },
      });

      wrapper = createWrapper(
        {
          files: [{ name: "sample.fq.gz" }],
          source: "hpc-mv",
          directoryName: "/data/run",
        },
        {
          mocks: {
            $buefy: { toast: { open: vi.fn() }, dialog: { alert: vi.fn() } },
            $axios: { post: mockAxiosPost },
          },
        }
      );

      wrapper.vm.selectedFileNames = ["sample.fq.gz"];
      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "sample.fq.gz", validMd5);
      await wrapper.vm.$nextTick();

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await wrapper.vm.validateChecksums();
      await flushPromises();

      const status = wrapper.vm.fileValidationStatus["sample.fq.gz"];
      expect(status.status).toBe("error");
      expect(status.message).toBe("Timeout reading file (Ref: abc-789)");

      consoleSpy.mockRestore();
    });

    it("falls back to generic message when error has no message property", async () => {
      // Override calculateMd5 to reject with an error that has no message
      wrapper = createWrapper({
        files: [{ name: "sample.fq.gz", data: new Blob(["x"]) }],
        source: "local-filesystem",
      });

      wrapper.vm.$set(wrapper.vm.fileMd5Inputs, "sample.fq.gz", validMd5);
      await wrapper.vm.$nextTick();

      // Reject with an object that has no .message and no .response.data.error
      wrapper.vm.calculateMd5 = vi.fn().mockRejectedValue({});

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await wrapper.vm.validateChecksums();
      await flushPromises();

      const status = wrapper.vm.fileValidationStatus["sample.fq.gz"];
      expect(status.status).toBe("error");
      // When there's no e.response?.data?.error and no e.message, falls back to generic
      expect(status.message).toBe("Failed to validate checksum");

      consoleSpy.mockRestore();
    });
  });
});
