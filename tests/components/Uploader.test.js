import { mount, createLocalVue } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Vuex from "vuex";

const localVue = createLocalVue();
localVue.use(Vuex);

// Store the onBeforeFileAdded callback so we can test it
let capturedOnBeforeFileAdded = null;
let _capturedRestrictions = null;
let mockUppyInstance = null;

// Mock Uppy and its plugins
const mockSetOptions = vi.fn((options) => {
  if (options.restrictions) {
    _capturedRestrictions = options.restrictions;
    // Update the mock instance's opts to reflect the change
    if (mockUppyInstance) {
      mockUppyInstance.opts.restrictions = {
        ...mockUppyInstance.opts.restrictions,
        ...options.restrictions,
      };
    }
  }
});
const mockGetFiles = vi.fn().mockReturnValue([]);
const mockCancelAll = vi.fn();
const mockRemoveFile = vi.fn();
const mockOn = vi.fn();
const mockUse = vi.fn().mockReturnThis();

const createMockUppyInstance = () => {
  mockUppyInstance = {
    setOptions: mockSetOptions,
    getFiles: mockGetFiles,
    cancelAll: mockCancelAll,
    removeFile: mockRemoveFile,
    on: mockOn,
    use: mockUse,
    opts: {
      restrictions: {
        maxFileSize: 30000000000,
        maxNumberOfFiles: 20,
        minNumberOfFiles: 0,
        allowedFileTypes: undefined,
      },
    },
  };
  return mockUppyInstance;
};

vi.mock("@uppy/core", () => ({
  default: vi.fn().mockImplementation((options) => {
    // Capture the onBeforeFileAdded callback for testing
    capturedOnBeforeFileAdded = options.onBeforeFileAdded;
    _capturedRestrictions = options.restrictions;
    return createMockUppyInstance();
  }),
}));

vi.mock("@uppy/dashboard", () => ({
  default: vi.fn(),
}));

vi.mock("@uppy/tus", () => ({
  default: vi.fn(),
}));

vi.mock("@uppy/thumbnail-generator", () => ({
  default: vi.fn(),
}));

vi.mock("uuid", () => ({
  v4: vi.fn().mockReturnValue("test-uuid"),
}));

// Import component after mocks
import Uploader from "../../components/uploads/Uploader.vue";

describe("Uploader.vue", () => {
  let wrapper;
  let store;
  let mockBuefy;

  const createStore = () => {
    return new Vuex.Store({
      state: {
        libraryTypes: [
          {
            _id: "1",
            value: "Paired-end",
            paired: true,
            indexed: false,
            extensions: [".fq.gz", ".fastq.gz"],
          },
          {
            _id: "2",
            value: "CRAM",
            paired: false,
            indexed: true,
            extensions: [".cram", ".crai", ".fa", ".fasta", ".fai"],
          },
          {
            _id: "3",
            value: "BAM",
            paired: false,
            indexed: true,
            extensions: [".bam", ".bai"],
          },
        ],
      },
    });
  };

  const createWrapper = (propsData = {}) => {
    store = createStore();

    mockBuefy = {
      dialog: {
        alert: vi.fn(),
      },
    };

    return mount(Uploader, {
      localVue,
      store,
      propsData: {
        allowedExtensions: null,
        paired: false,
        indexed: false,
        ...propsData,
      },
      mocks: {
        $buefy: mockBuefy,
        $nuxt: {
          context: {
            store: {
              state: {
                libraryTypes: [
                  { extensions: [".fq.gz", ".fastq.gz"] },
                  { extensions: [".cram", ".crai", ".fa", ".fasta", ".fai"] },
                  { extensions: [".bam", ".bai"] },
                ],
              },
            },
          },
        },
      },
      stubs: {
        "b-icon": { template: "<span></span>", props: ["icon", "size"] },
        "b-button": {
          template:
            '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
          props: ["type", "disabled", "iconLeft"],
        },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetOptions.mockClear();
    capturedOnBeforeFileAdded = null;
    _capturedRestrictions = null;
    mockUppyInstance = null;
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy();
    }
  });

  describe("File Extension Validation - onBeforeFileAdded", () => {
    describe("CRAM library type", () => {
      const cramExtensions = [".cram", ".crai", ".fa", ".fasta", ".fai"];

      it("should REJECT a .fastq.gz file when CRAM extensions are allowed", () => {
        wrapper = createWrapper({
          allowedExtensions: cramExtensions,
        });

        // Simulate adding a fastq.gz file
        const mockFile = { name: "sample.fastq.gz" };
        const result = capturedOnBeforeFileAdded(mockFile);

        expect(result).toBe(false);
        expect(mockBuefy.dialog.alert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Error",
            message: expect.stringContaining(".fastq.gz"),
            type: "is-danger",
          })
        );
        // Error message should mention the CRAM allowed extensions
        expect(mockBuefy.dialog.alert).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining(".cram"),
          })
        );
      });

      it("should REJECT a .fq.gz file when CRAM extensions are allowed", () => {
        wrapper = createWrapper({
          allowedExtensions: cramExtensions,
        });

        const mockFile = { name: "sample.fq.gz" };
        const result = capturedOnBeforeFileAdded(mockFile);

        expect(result).toBe(false);
        expect(mockBuefy.dialog.alert).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining(".fq.gz"),
          })
        );
      });

      it("should ACCEPT a .cram file when CRAM extensions are allowed", () => {
        wrapper = createWrapper({
          allowedExtensions: cramExtensions,
        });

        const mockFile = { name: "sample.cram" };
        const result = capturedOnBeforeFileAdded(mockFile);

        expect(result).toBe(true);
        expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
      });

      it("should ACCEPT a .crai file when CRAM extensions are allowed", () => {
        wrapper = createWrapper({
          allowedExtensions: cramExtensions,
        });

        const mockFile = { name: "sample.cram.crai" };
        const result = capturedOnBeforeFileAdded(mockFile);

        expect(result).toBe(true);
        expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
      });

      it("should ACCEPT a .fa file when CRAM extensions are allowed", () => {
        wrapper = createWrapper({
          allowedExtensions: cramExtensions,
        });

        const mockFile = { name: "reference.fa" };
        const result = capturedOnBeforeFileAdded(mockFile);

        expect(result).toBe(true);
        expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
      });

      it("should ACCEPT a .fasta file when CRAM extensions are allowed", () => {
        wrapper = createWrapper({
          allowedExtensions: cramExtensions,
        });

        const mockFile = { name: "reference.fasta" };
        const result = capturedOnBeforeFileAdded(mockFile);

        expect(result).toBe(true);
        expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
      });

      it("should ACCEPT a .fai file when CRAM extensions are allowed", () => {
        wrapper = createWrapper({
          allowedExtensions: cramExtensions,
        });

        const mockFile = { name: "reference.fa.fai" };
        const result = capturedOnBeforeFileAdded(mockFile);

        expect(result).toBe(true);
        expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
      });
    });

    describe("Paired-end FASTQ library type", () => {
      const fastqExtensions = [".fq.gz", ".fastq.gz"];

      it("should ACCEPT a .fastq.gz file when FASTQ extensions are allowed", () => {
        wrapper = createWrapper({
          allowedExtensions: fastqExtensions,
        });

        const mockFile = { name: "sample_R1.fastq.gz" };
        const result = capturedOnBeforeFileAdded(mockFile);

        expect(result).toBe(true);
        expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
      });

      it("should ACCEPT a .fq.gz file when FASTQ extensions are allowed", () => {
        wrapper = createWrapper({
          allowedExtensions: fastqExtensions,
        });

        const mockFile = { name: "sample_R1.fq.gz" };
        const result = capturedOnBeforeFileAdded(mockFile);

        expect(result).toBe(true);
        expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
      });

      it("should REJECT a .cram file when only FASTQ extensions are allowed", () => {
        wrapper = createWrapper({
          allowedExtensions: fastqExtensions,
        });

        const mockFile = { name: "sample.cram" };
        const result = capturedOnBeforeFileAdded(mockFile);

        expect(result).toBe(false);
        expect(mockBuefy.dialog.alert).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining(".cram"),
          })
        );
        // Error should mention the allowed FASTQ extensions
        expect(mockBuefy.dialog.alert).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining(".fq.gz"),
          })
        );
      });

      it("should REJECT a .bam file when only FASTQ extensions are allowed", () => {
        wrapper = createWrapper({
          allowedExtensions: fastqExtensions,
        });

        const mockFile = { name: "sample.bam" };
        const result = capturedOnBeforeFileAdded(mockFile);

        expect(result).toBe(false);
        expect(mockBuefy.dialog.alert).toHaveBeenCalled();
      });
    });

    describe("Files with no extension", () => {
      it("should REJECT a file with no extension when extensions are specified", () => {
        wrapper = createWrapper({
          allowedExtensions: [".cram", ".crai"],
        });

        const mockFile = { name: "noextension" };
        const result = capturedOnBeforeFileAdded(mockFile);

        expect(result).toBe(false);
        expect(mockBuefy.dialog.alert).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining("no file extension"),
          })
        );
      });
    });

    describe("Error message content", () => {
      it("should include the rejected filename in error message", () => {
        wrapper = createWrapper({
          allowedExtensions: [".cram"],
        });

        const mockFile = { name: "my_sample_file.fastq.gz" };
        capturedOnBeforeFileAdded(mockFile);

        expect(mockBuefy.dialog.alert).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining("my_sample_file.fastq.gz"),
          })
        );
      });

      it("should list all allowed extensions in error message", () => {
        const cramExtensions = [".cram", ".crai", ".fa", ".fasta", ".fai"];
        wrapper = createWrapper({
          allowedExtensions: cramExtensions,
        });

        const mockFile = { name: "sample.bam" };
        capturedOnBeforeFileAdded(mockFile);

        const alertCall = mockBuefy.dialog.alert.mock.calls[0][0];
        expect(alertCall.message).toContain(".cram");
        expect(alertCall.message).toContain(".crai");
        expect(alertCall.message).toContain(".fa");
        expect(alertCall.message).toContain(".fasta");
        expect(alertCall.message).toContain(".fai");
      });
    });
  });

  describe("Dynamic allowedExtensions prop handling", () => {
    it("should use current allowedExtensions value when validating files", async () => {
      // Start with no extensions
      wrapper = createWrapper({ allowedExtensions: null });

      // Change to CRAM extensions
      await wrapper.setProps({
        allowedExtensions: [".cram", ".crai", ".fa", ".fasta", ".fai"],
      });

      // Now try to add a fastq file - it should be rejected with CRAM extensions in error
      const mockFile = { name: "sample.fastq.gz" };
      const result = capturedOnBeforeFileAdded(mockFile);

      expect(result).toBe(false);
      expect(mockBuefy.dialog.alert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(".cram"),
        })
      );
    });

    it("should accept files when extensions change to match", async () => {
      // Start with FASTQ extensions
      wrapper = createWrapper({
        allowedExtensions: [".fq.gz", ".fastq.gz"],
      });

      // CRAM file should be rejected
      const cramFile = { name: "sample.cram" };
      let result = capturedOnBeforeFileAdded(cramFile);
      expect(result).toBe(false);

      mockBuefy.dialog.alert.mockClear();

      // Change to CRAM extensions
      await wrapper.setProps({
        allowedExtensions: [".cram", ".crai", ".fa", ".fasta", ".fai"],
      });

      // Now CRAM file should be accepted
      result = capturedOnBeforeFileAdded(cramFile);
      expect(result).toBe(true);
      expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
    });
  });

  describe("Computed Properties", () => {
    describe("allowedFileTypes", () => {
      it("should return null when no allowedExtensions prop", () => {
        wrapper = createWrapper({ allowedExtensions: null });
        expect(wrapper.vm.allowedFileTypes).toBeNull();
      });

      it("should return extensions array when allowedExtensions provided", () => {
        wrapper = createWrapper({
          allowedExtensions: [".cram", ".crai", ".fa", ".fasta", ".fai"],
        });
        expect(wrapper.vm.allowedFileTypes).toEqual([
          ".cram",
          ".crai",
          ".fa",
          ".fasta",
          ".fai",
        ]);
      });

      it("should return null for empty array", () => {
        wrapper = createWrapper({ allowedExtensions: [] });
        expect(wrapper.vm.allowedFileTypes).toBeNull();
      });
    });

    describe("fileCountRules", () => {
      it("should return indexed paired rules (minimum 3)", () => {
        wrapper = createWrapper({
          allowedExtensions: [".cram"],
          indexed: true,
          paired: true,
        });
        expect(wrapper.vm.fileCountRules).toContain("Indexed paired library");
        expect(wrapper.vm.fileCountRules).toContain("Minimum 3 files");
      });

      it("should return indexed rules (minimum 2)", () => {
        wrapper = createWrapper({
          allowedExtensions: [".bam"],
          indexed: true,
          paired: false,
        });
        expect(wrapper.vm.fileCountRules).toContain("Indexed library");
        expect(wrapper.vm.fileCountRules).toContain("Minimum 2 files");
      });

      it("should return paired rules (minimum 2)", () => {
        wrapper = createWrapper({
          allowedExtensions: [".fq.gz"],
          paired: true,
          indexed: false,
        });
        expect(wrapper.vm.fileCountRules).toContain("Paired library");
        expect(wrapper.vm.fileCountRules).toContain("Minimum 2 files");
      });

      it("should return default rules (minimum 1)", () => {
        wrapper = createWrapper({
          allowedExtensions: [".cram"],
          paired: false,
          indexed: false,
        });
        expect(wrapper.vm.fileCountRules).toContain("Minimum 1 file");
      });
    });
  });

  describe("Display of Allowed Extensions", () => {
    it("should display CRAM extensions when CRAM library is selected", () => {
      wrapper = createWrapper({
        allowedExtensions: [".cram", ".crai", ".fa", ".fasta", ".fai"],
      });

      const html = wrapper.html();
      expect(html).toContain(".cram");
      expect(html).toContain(".crai");
      expect(html).toContain(".fa");
      expect(html).toContain(".fasta");
      expect(html).toContain(".fai");
    });

    it("should display FASTQ extensions when FASTQ library is selected", () => {
      wrapper = createWrapper({
        allowedExtensions: [".fq.gz", ".fastq.gz"],
      });

      const html = wrapper.html();
      expect(html).toContain(".fq.gz");
      expect(html).toContain(".fastq.gz");
    });

    it("should not display extensions notice when none provided", () => {
      wrapper = createWrapper({ allowedExtensions: null });

      const notification = wrapper.find(".notification.is-info");
      expect(notification.exists()).toBe(false);
    });
  });

  describe("Additional Files Uploader (no allowedExtensions)", () => {
    // When allowedExtensions is null, this is the additional files uploader
    // It should block read files but allow checksums and other file types

    it("should REJECT .fastq.gz files (read files)", () => {
      wrapper = createWrapper({ allowedExtensions: null });

      const mockFile = { name: "sample.fastq.gz" };
      const result = capturedOnBeforeFileAdded(mockFile);

      expect(result).toBe(false);
      expect(mockBuefy.dialog.alert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("read file"),
        })
      );
    });

    it("should REJECT .fq.gz files (read files)", () => {
      wrapper = createWrapper({ allowedExtensions: null });

      const mockFile = { name: "sample.fq.gz" };
      const result = capturedOnBeforeFileAdded(mockFile);

      expect(result).toBe(false);
      expect(mockBuefy.dialog.alert).toHaveBeenCalled();
    });

    it("should REJECT .cram files (read files)", () => {
      wrapper = createWrapper({ allowedExtensions: null });

      const mockFile = { name: "sample.cram" };
      const result = capturedOnBeforeFileAdded(mockFile);

      expect(result).toBe(false);
      expect(mockBuefy.dialog.alert).toHaveBeenCalled();
    });

    it("should REJECT .bam files (read files)", () => {
      wrapper = createWrapper({ allowedExtensions: null });

      const mockFile = { name: "sample.bam" };
      const result = capturedOnBeforeFileAdded(mockFile);

      expect(result).toBe(false);
      expect(mockBuefy.dialog.alert).toHaveBeenCalled();
    });

    it("should ACCEPT .md5 files (checksum files)", () => {
      wrapper = createWrapper({ allowedExtensions: null });

      const mockFile = { name: "sample.fastq.gz.md5" };
      const result = capturedOnBeforeFileAdded(mockFile);

      expect(result).toBe(true);
      expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
    });

    it("should ACCEPT .sha256 files (checksum files)", () => {
      wrapper = createWrapper({ allowedExtensions: null });

      const mockFile = { name: "checksums.sha256" };
      const result = capturedOnBeforeFileAdded(mockFile);

      expect(result).toBe(true);
      expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
    });

    it("should ACCEPT .sha1 files (checksum files)", () => {
      wrapper = createWrapper({ allowedExtensions: null });

      const mockFile = { name: "checksums.sha1" };
      const result = capturedOnBeforeFileAdded(mockFile);

      expect(result).toBe(true);
      expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
    });

    it("should ACCEPT .txt files (other file types)", () => {
      wrapper = createWrapper({ allowedExtensions: null });

      const mockFile = { name: "readme.txt" };
      const result = capturedOnBeforeFileAdded(mockFile);

      expect(result).toBe(true);
      expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
    });

    it("should ACCEPT .pdf files (other file types)", () => {
      wrapper = createWrapper({ allowedExtensions: null });

      const mockFile = { name: "documentation.pdf" };
      const result = capturedOnBeforeFileAdded(mockFile);

      expect(result).toBe(true);
      expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
    });

    it("should ACCEPT .xlsx files (other file types)", () => {
      wrapper = createWrapper({ allowedExtensions: null });

      const mockFile = { name: "metadata.xlsx" };
      const result = capturedOnBeforeFileAdded(mockFile);

      expect(result).toBe(true);
      expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
    });

    it("should ACCEPT .docx files (other file types)", () => {
      wrapper = createWrapper({ allowedExtensions: null });

      const mockFile = { name: "report.docx" };
      const result = capturedOnBeforeFileAdded(mockFile);

      expect(result).toBe(true);
      expect(mockBuefy.dialog.alert).not.toHaveBeenCalled();
    });
  });

  describe("Methods", () => {
    describe("validateFileCount", () => {
      it("should accept 2+ files for paired library", () => {
        wrapper = createWrapper({
          allowedExtensions: [".fq.gz"],
          paired: true,
        });
        mockGetFiles.mockReturnValue([
          { name: "file1.fq.gz" },
          { name: "file2.fq.gz" },
        ]);

        const result = wrapper.vm.validateFileCount();

        expect(result).toBe(true);
        expect(wrapper.vm.fileCountError).toBeNull();
      });

      it("should accept 4 files for paired library", () => {
        wrapper = createWrapper({
          allowedExtensions: [".fq.gz"],
          paired: true,
        });
        mockGetFiles.mockReturnValue([
          { name: "file1_R1.fq.gz" },
          { name: "file1_R2.fq.gz" },
          { name: "file2_R1.fq.gz" },
          { name: "file2_R2.fq.gz" },
        ]);

        const result = wrapper.vm.validateFileCount();

        expect(result).toBe(true);
        expect(wrapper.vm.fileCountError).toBeNull();
      });

      it("should reject single file for paired library", () => {
        wrapper = createWrapper({
          allowedExtensions: [".fq.gz"],
          paired: true,
        });
        mockGetFiles.mockReturnValue([{ name: "file1.fq.gz" }]);

        const result = wrapper.vm.validateFileCount();

        expect(result).toBe(false);
        expect(wrapper.vm.fileCountError).toContain("at least 2 files");
      });

      it("should accept 2+ files for indexed library", () => {
        wrapper = createWrapper({
          allowedExtensions: [".bam", ".bai"],
          indexed: true,
          paired: false,
        });
        mockGetFiles.mockReturnValue([
          { name: "file.bam" },
          { name: "file.bam.bai" },
        ]);

        const result = wrapper.vm.validateFileCount();

        expect(result).toBe(true);
        expect(wrapper.vm.fileCountError).toBeNull();
      });

      it("should reject single file for indexed library", () => {
        wrapper = createWrapper({
          allowedExtensions: [".bam", ".bai"],
          indexed: true,
          paired: false,
        });
        mockGetFiles.mockReturnValue([{ name: "file.bam" }]);

        const result = wrapper.vm.validateFileCount();

        expect(result).toBe(false);
        expect(wrapper.vm.fileCountError).toContain("at least 2 files");
      });

      it("should accept 3+ files for indexed paired library", () => {
        wrapper = createWrapper({
          allowedExtensions: [".cram", ".crai", ".fa"],
          indexed: true,
          paired: true,
        });
        mockGetFiles.mockReturnValue([
          { name: "file.cram" },
          { name: "file.cram.crai" },
          { name: "reference.fa" },
        ]);

        const result = wrapper.vm.validateFileCount();

        expect(result).toBe(true);
        expect(wrapper.vm.fileCountError).toBeNull();
      });

      it("should reject 2 files for indexed paired library", () => {
        wrapper = createWrapper({
          allowedExtensions: [".cram", ".crai", ".fa"],
          indexed: true,
          paired: true,
        });
        mockGetFiles.mockReturnValue([
          { name: "file.cram" },
          { name: "file.cram.crai" },
        ]);

        const result = wrapper.vm.validateFileCount();

        expect(result).toBe(false);
        expect(wrapper.vm.fileCountError).toContain("at least 3 files");
      });

      it("should accept 1+ files for single-end library", () => {
        wrapper = createWrapper({
          allowedExtensions: [".fq.gz"],
          paired: false,
          indexed: false,
        });
        mockGetFiles.mockReturnValue([{ name: "file.fq.gz" }]);

        const result = wrapper.vm.validateFileCount();

        expect(result).toBe(true);
        expect(wrapper.vm.fileCountError).toBeNull();
      });

      it("should accept multiple files for single-end library", () => {
        wrapper = createWrapper({
          allowedExtensions: [".fq.gz"],
          paired: false,
          indexed: false,
        });
        mockGetFiles.mockReturnValue([
          { name: "file1.fq.gz" },
          { name: "file2.fq.gz" },
          { name: "file3.fq.gz" },
          { name: "file4.fq.gz" },
        ]);

        const result = wrapper.vm.validateFileCount();

        expect(result).toBe(true);
        expect(wrapper.vm.fileCountError).toBeNull();
      });

      it("should reject zero files", () => {
        wrapper = createWrapper({
          allowedExtensions: [".fq.gz"],
          paired: false,
          indexed: false,
        });
        mockGetFiles.mockReturnValue([]);

        const result = wrapper.vm.validateFileCount();

        expect(result).toBe(false);
        expect(wrapper.vm.fileCountError).toContain("Currently have 0");
      });
    });

    describe("clear", () => {
      it("should reset fileCountError and clear Uppy files", () => {
        wrapper = createWrapper();
        wrapper.vm.fileCountError = "Some error";

        wrapper.vm.clear();

        expect(wrapper.vm.fileCountError).toBeNull();
        expect(mockCancelAll).toHaveBeenCalled();
      });
    });
  });
});
