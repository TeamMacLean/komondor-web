import { mount, createLocalVue } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NewRun from "../../../pages/runs/new.vue";
import Vuex from "vuex";

const localVue = createLocalVue();
localVue.use(Vuex);

describe("NewRun.vue", () => {
  let wrapper;
  let store;
  let mockAxios;
  let mockAuth;
  let mockRouter;
  let mockBuefy;
  let mockRoute;

  // Helper to create a Vuex store with options
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
            value: "Single-end",
            paired: false,
            indexed: false,
            extensions: [".fq.gz", ".fastq.gz"],
          },
          {
            _id: "3",
            value: "Indexed",
            paired: false,
            indexed: true,
            extensions: [".bam"],
          },
        ],
        sequencingTechnologies: [
          { _id: "1", value: "Illumina" },
          { _id: "2", value: "PacBio" },
          { _id: "3", value: "Oxford Nanopore" },
        ],
        librarySources: [
          { _id: "1", value: "GENOMIC" },
          { _id: "2", value: "TRANSCRIPTOMIC" },
          { _id: "3", value: "METAGENOMIC" },
        ],
        librarySelections: [
          { _id: "1", value: "RANDOM" },
          { _id: "2", value: "PCR" },
          { _id: "3", value: "size fractionation" },
        ],
        libraryStrategies: [
          { _id: "1", value: "WGS" },
          { _id: "2", value: "RNA-Seq" },
          { _id: "3", value: "ChIP-Seq" },
        ],
      },
      actions: {
        refreshOptions: vi.fn(),
      },
    });
  };

  // Helper to create wrapper
  const createWrapper = (dataOverrides = {}) => {
    store = createStore();

    mockAxios = {
      get: vi.fn().mockResolvedValue({
        data: {
          sample: {
            _id: "sample123",
            name: "Test Sample",
            project: { _id: "project123", group: "group123" },
          },
          runNames: [],
        },
      }),
      post: vi.fn().mockResolvedValue({
        data: {
          run: { _id: "run123", name: "Test Run" },
        },
      }),
    };

    mockAuth = {
      user: { username: "testuser" },
    };

    mockRouter = {
      push: vi.fn(),
    };

    mockBuefy = {
      toast: {
        open: vi.fn(),
      },
      dialog: {
        alert: vi.fn(),
        confirm: vi.fn(({ onConfirm }) => onConfirm && onConfirm()),
      },
    };

    mockRoute = {
      query: { sampleId: "sample123" },
    };

    const defaultData = {
      sample: {
        _id: "sample123",
        name: "Test Sample",
        project: { _id: "project123", group: "group123" },
      },
      existingRunNames: ["existing-run-1"],
      run: {
        name: "",
        sequencingProvider: "",
        libraryType: null,
        sequencingTechnology: null,
        librarySource: null,
        librarySelection: null,
        libraryStrategy: null,
        insertSize: null,
      },
      uploadMethod: "hpc-mv",
      hpcDiscoveredFiles: [],
      hpcDirectoryName: "",
      localUploadedFiles: [],
      localFilesConfirmed: false,
      processedFiles: [],
      consent: false,
      isSubmitting: false,
      ...dataOverrides,
    };

    return mount(NewRun, {
      localVue,
      store,
      mocks: {
        $axios: mockAxios,
        $auth: mockAuth,
        $router: mockRouter,
        $buefy: mockBuefy,
        $route: mockRoute,
      },
      stubs: {
        "b-field": {
          template:
            '<div><label v-if="label">{{ label }}</label><slot /></div>',
          props: ["label", "type", "message"],
        },
        "b-input": {
          template:
            '<input @input="$emit(\'input\', $event.target.value)" :value="value" :type="type" />',
          props: ["value", "type", "required", "placeholder"],
        },
        "b-select": {
          template:
            '<select @change="$emit(\'input\', $event.target.value)" :value="value"><slot /></select>',
          props: ["value", "expanded", "required"],
        },
        "b-button": {
          template:
            '<button @click="$emit(\'click\')" :disabled="disabled" :type="nativeType"><slot /></button>',
          props: ["loading", "disabled", "type", "nativeType"],
        },
        "b-icon": {
          template: "<span></span>",
          props: ["icon", "size", "type"],
        },
        "b-radio": {
          template:
            '<label><input type="radio" @change="$emit(\'input\', nativeValue)" :checked="value === nativeValue" :disabled="disabled" /><slot /></label>',
          props: ["value", "nativeValue", "disabled"],
        },
        Uploader: {
          name: "Uploader",
          template: "<div class='mock-uploader'></div>",
          methods: {
            getFiles: vi.fn().mockReturnValue([]),
            isUploadComplete: vi.fn().mockReturnValue(true),
            clear: vi.fn(),
            isConfirmed: vi.fn().mockReturnValue(false),
          },
        },
        HpcDirectoryFinder: {
          name: "HpcDirectoryFinder",
          template: "<div class='mock-hpc-finder'></div>",
          props: [
            "sampleId",
            "allowedExtensions",
            "paired",
            "indexed",
            "disabled",
          ],
          methods: {
            clear: vi.fn(),
          },
        },
        FileProcessor: {
          name: "FileProcessor",
          template: "<div class='mock-file-processor'></div>",
          props: [
            "value",
            "files",
            "source",
            "paired",
            "indexed",
            "directoryName",
          ],
        },
        FormConsentCheckbox: {
          template:
            '<input type="checkbox" @change="$emit(\'input\', $event.target.checked)" :checked="value" />',
          props: ["value"],
        },
        CollapsibleUploaderHelp: {
          template: "<div></div>",
        },
      },
      data() {
        return defaultData;
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render the component with sample name", () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.html()).toContain("New Run for Test Sample");
    });

    it("should display subtitle about sequencing parameters", () => {
      wrapper = createWrapper();
      expect(wrapper.html()).toContain(
        "Define the sequencing parameters and provide the raw read files"
      );
    });

    it("should render all required form fields", () => {
      wrapper = createWrapper();
      const html = wrapper.html();
      expect(html).toContain("Run Name");
      expect(html).toContain("Sequencing Provider");
      expect(html).toContain("Library Type");
      expect(html).toContain("Sequencing Technology");
      expect(html).toContain("Library Source");
      expect(html).toContain("Library Selection");
      expect(html).toContain("Library Strategy");
    });

    it("should render insert size field", () => {
      wrapper = createWrapper();
      expect(wrapper.html()).toContain("Insert Size");
    });

    it("should render Step 1: Select Files section", () => {
      wrapper = createWrapper();
      expect(wrapper.html()).toContain("Step 1");
      expect(wrapper.html()).toContain("Select Files");
    });

    it("should render upload method radio buttons", () => {
      wrapper = createWrapper();
      // The radio buttons are rendered, check for the radio input elements
      const radioInputs = wrapper.findAll('input[type="radio"]');
      expect(radioInputs.length).toBeGreaterThanOrEqual(2);
    });

    it("should render submit button", () => {
      wrapper = createWrapper();
      const submitButton = wrapper.find("button.is-success");
      expect(submitButton.exists()).toBe(true);
      expect(submitButton.text()).toContain("Create Run");
    });

    it("should render consent checkbox", () => {
      wrapper = createWrapper();
      expect(wrapper.html()).toContain('type="checkbox"');
    });
  });

  describe("Computed Properties", () => {
    describe("libraryTypeObject", () => {
      it("should return null when no library type selected", () => {
        wrapper = createWrapper();
        expect(wrapper.vm.libraryTypeObject).toBeNull();
      });

      it("should return library type object when selected", () => {
        wrapper = createWrapper({
          run: {
            name: "",
            sequencingProvider: "",
            libraryType: "Paired-end",
            sequencingTechnology: null,
            librarySource: null,
            librarySelection: null,
            libraryStrategy: null,
            insertSize: null,
          },
        });
        expect(wrapper.vm.libraryTypeObject).toEqual({
          _id: "1",
          value: "Paired-end",
          paired: true,
          indexed: false,
          extensions: [".fq.gz", ".fastq.gz"],
        });
      });
    });

    describe("isLocalFilesystemDisabled", () => {
      it("should return false for all library types", () => {
        wrapper = createWrapper({
          run: {
            name: "",
            sequencingProvider: "",
            libraryType: "Paired-end",
            sequencingTechnology: null,
            librarySource: null,
            librarySelection: null,
            libraryStrategy: null,
            insertSize: null,
          },
        });
        expect(wrapper.vm.isLocalFilesystemDisabled).toBe(false);
      });

      it("should return false even for indexed library types", () => {
        wrapper = createWrapper({
          run: {
            name: "",
            sequencingProvider: "",
            libraryType: "Indexed",
            sequencingTechnology: null,
            librarySource: null,
            librarySelection: null,
            libraryStrategy: null,
            insertSize: null,
          },
        });
        expect(wrapper.vm.isLocalFilesystemDisabled).toBe(false);
      });

      it("should return false when no library type selected", () => {
        wrapper = createWrapper();
        expect(wrapper.vm.isLocalFilesystemDisabled).toBe(false);
      });
    });

    describe("hasFilesSelected", () => {
      it("should return false when no files selected", () => {
        wrapper = createWrapper();
        expect(wrapper.vm.hasFilesSelected).toBe(false);
      });

      it("should return true when HPC files discovered", () => {
        wrapper = createWrapper({
          hpcDiscoveredFiles: [{ name: "file1.fq.gz" }],
        });
        expect(wrapper.vm.hasFilesSelected).toBe(true);
      });

      it("should return true when local files confirmed", () => {
        wrapper = createWrapper({
          localFilesConfirmed: true,
        });
        expect(wrapper.vm.hasFilesSelected).toBe(true);
      });

      it("should return true when processed files exist", () => {
        wrapper = createWrapper({
          processedFiles: [{ name: "file1.fq.gz", md5: "abc123" }],
        });
        expect(wrapper.vm.hasFilesSelected).toBe(true);
      });
    });

    describe("filesToProcess", () => {
      it("should return HPC files when in HPC mode", () => {
        wrapper = createWrapper({
          uploadMethod: "hpc-mv",
          hpcDiscoveredFiles: [{ name: "file1.fq.gz" }],
        });
        expect(wrapper.vm.filesToProcess).toEqual([{ name: "file1.fq.gz" }]);
      });

      it("should return local files when confirmed", () => {
        wrapper = createWrapper({
          uploadMethod: "local-filesystem",
          localFilesConfirmed: true,
          localUploadedFiles: [{ name: "file1.fq.gz" }],
        });
        expect(wrapper.vm.filesToProcess).toEqual([{ name: "file1.fq.gz" }]);
      });

      it("should return empty array when local files not confirmed", () => {
        wrapper = createWrapper({
          uploadMethod: "local-filesystem",
          localFilesConfirmed: false,
          localUploadedFiles: [{ name: "file1.fq.gz" }],
        });
        expect(wrapper.vm.filesToProcess).toEqual([]);
      });
    });

    describe("hasFilesToProcess", () => {
      it("should return false when no files to process", () => {
        wrapper = createWrapper();
        expect(wrapper.vm.hasFilesToProcess).toBe(false);
      });

      it("should return true when files exist", () => {
        wrapper = createWrapper({
          uploadMethod: "hpc-mv",
          hpcDiscoveredFiles: [{ name: "file1.fq.gz" }],
        });
        expect(wrapper.vm.hasFilesToProcess).toBe(true);
      });
    });

    describe("validationErrors", () => {
      it("should return error when run name is missing", () => {
        wrapper = createWrapper();
        expect(wrapper.vm.validationErrors.name).toBe("Run name is required.");
      });

      it("should return error when run name is too short", () => {
        wrapper = createWrapper({
          run: {
            name: "ab",
            sequencingProvider: "Novogene",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: null,
          },
        });
        expect(wrapper.vm.validationErrors.name).toBe(
          "Name must be between 3 and 80 characters."
        );
      });

      it("should return error when run name is too long", () => {
        wrapper = createWrapper({
          run: {
            name: "a".repeat(81),
            sequencingProvider: "Novogene",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: null,
          },
        });
        expect(wrapper.vm.validationErrors.name).toBe(
          "Name must be between 3 and 80 characters."
        );
      });

      it("should return error when run name already exists", () => {
        wrapper = createWrapper({
          run: {
            name: "existing-run-1",
            sequencingProvider: "Novogene",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: null,
          },
          existingRunNames: ["existing-run-1"],
        });
        expect(wrapper.vm.validationErrors.name).toBe(
          "This run name is already in use for this sample."
        );
      });

      it("should return error when sequencing provider is missing", () => {
        wrapper = createWrapper({
          run: {
            name: "Valid Run Name",
            sequencingProvider: "",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: null,
          },
        });
        expect(wrapper.vm.validationErrors.sequencingProvider).toBe(
          "Sequencing provider is required."
        );
      });

      it("should return error when processed files are empty", () => {
        wrapper = createWrapper({
          processedFiles: [],
          run: {
            name: "Valid Run Name",
            sequencingProvider: "Novogene",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: null,
          },
        });
        expect(wrapper.vm.validationErrors.rawFiles).toBe(
          "Raw files must be selected, have MD5 checksums validated, and be processed."
        );
      });

      it("should return no errors when all fields are valid with processed files", () => {
        wrapper = createWrapper({
          // Paired-end requires at least 2 files
          processedFiles: [
            { name: "file1.fq.gz", md5: "abc123" },
            { name: "file2.fq.gz", md5: "def456" },
          ],
          run: {
            name: "Valid Run Name",
            sequencingProvider: "Novogene",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: 500,
          },
        });
        expect(Object.keys(wrapper.vm.validationErrors)).toHaveLength(0);
      });
    });

    describe("canSubmit", () => {
      it("should return false when already submitting", () => {
        wrapper = createWrapper({ isSubmitting: true });
        expect(wrapper.vm.canSubmit).toBe(false);
      });

      it("should return false when validation errors exist", () => {
        wrapper = createWrapper({
          consent: true,
          run: {
            name: "",
            sequencingProvider: "",
            libraryType: null,
            sequencingTechnology: null,
            librarySource: null,
            librarySelection: null,
            libraryStrategy: null,
            insertSize: null,
          },
        });
        expect(wrapper.vm.canSubmit).toBe(false);
      });

      it("should return false when consent not given", () => {
        wrapper = createWrapper({
          consent: false,
          processedFiles: [{ name: "file1.fq.gz", md5: "abc123" }],
          run: {
            name: "Valid Run Name",
            sequencingProvider: "Novogene",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: null,
          },
        });
        expect(wrapper.vm.canSubmit).toBe(false);
      });

      it("should return true when all conditions met", () => {
        wrapper = createWrapper({
          consent: true,
          // Paired-end requires at least 2 files
          processedFiles: [
            { name: "file1.fq.gz", md5: "abc123" },
            { name: "file2.fq.gz", md5: "def456" },
          ],
          run: {
            name: "Valid Run Name",
            sequencingProvider: "Novogene",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: null,
          },
        });
        expect(wrapper.vm.canSubmit).toBe(true);
      });
    });
  });

  describe("Methods", () => {
    describe("clearAllFiles", () => {
      it("should clear all file state", () => {
        wrapper = createWrapper({
          hpcDiscoveredFiles: [{ name: "file1.fq.gz" }],
          hpcDirectoryName: "test-dir",
          localUploadedFiles: [{ name: "file2.fq.gz" }],
          localFilesConfirmed: true,
          processedFiles: [{ name: "file1.fq.gz", md5: "abc123" }],
        });

        wrapper.vm.clearAllFiles();

        expect(wrapper.vm.hpcDiscoveredFiles).toEqual([]);
        expect(wrapper.vm.hpcDirectoryName).toBe("");
        expect(wrapper.vm.localUploadedFiles).toEqual([]);
        expect(wrapper.vm.localFilesConfirmed).toBe(false);
        expect(wrapper.vm.processedFiles).toEqual([]);
      });
    });

    describe("handleHpcFilesFound", () => {
      it("should set HPC discovered files", () => {
        wrapper = createWrapper();
        const files = [{ name: "file1.fq.gz" }];
        const directoryName = "test-dir";

        wrapper.vm.handleHpcFilesFound(files, directoryName);

        expect(wrapper.vm.hpcDiscoveredFiles).toEqual(files);
        expect(wrapper.vm.hpcDirectoryName).toBe(directoryName);
        expect(wrapper.vm.processedFiles).toEqual([]);
      });
    });

    describe("handleLocalFilesConfirmed", () => {
      it("should set local uploaded files and confirm", () => {
        wrapper = createWrapper();
        const files = [{ name: "file1.fq.gz" }];

        wrapper.vm.handleLocalFilesConfirmed(files);

        expect(wrapper.vm.localUploadedFiles).toEqual(files);
        expect(wrapper.vm.localFilesConfirmed).toBe(true);
        expect(wrapper.vm.processedFiles).toEqual([]);
      });
    });

    describe("handleLocalUploadRestart", () => {
      it("should clear local file state", () => {
        wrapper = createWrapper({
          localUploadedFiles: [{ name: "file1.fq.gz" }],
          localFilesConfirmed: true,
          processedFiles: [{ name: "file1.fq.gz", md5: "abc123" }],
        });

        wrapper.vm.handleLocalUploadRestart();

        expect(wrapper.vm.localUploadedFiles).toEqual([]);
        expect(wrapper.vm.localFilesConfirmed).toBe(false);
        expect(wrapper.vm.processedFiles).toEqual([]);
      });
    });

    describe("submitForm", () => {
      it("should show warning when form invalid", async () => {
        wrapper = createWrapper({
          consent: false,
        });

        await wrapper.vm.submitForm();

        expect(mockBuefy.toast.open).toHaveBeenCalledWith({
          message: "Please correct the errors before submitting.",
          type: "is-warning",
        });
        expect(mockAxios.post).not.toHaveBeenCalled();
      });

      it("should set isSubmitting to true during submission", async () => {
        wrapper = createWrapper({
          consent: true,
          uploadMethod: "hpc-mv",
          hpcDirectoryName: "test-dir",
          processedFiles: [
            { name: "file1.fq.gz", md5: "abc123" },
            { name: "file2.fq.gz", md5: "def456" },
          ],
          run: {
            name: "Valid Run",
            sequencingProvider: "Novogene",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: null,
          },
        });

        const submitPromise = wrapper.vm.submitForm();
        expect(wrapper.vm.isSubmitting).toBe(true);
        await submitPromise;
      });

      it("should submit with correct payload for HPC mode", async () => {
        wrapper = createWrapper({
          consent: true,
          uploadMethod: "hpc-mv",
          hpcDirectoryName: "test-dir",
          processedFiles: [
            { name: "file1.fq.gz", md5: "abc123", relativePath: "test-dir" },
            { name: "file2.fq.gz", md5: "def456", relativePath: "test-dir" },
          ],
          run: {
            name: "Valid Run",
            sequencingProvider: "Novogene",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: 500,
          },
        });
        wrapper.vm.$refs.additionalUploader = {
          getFiles: vi.fn().mockReturnValue([]),
        };

        await wrapper.vm.submitForm();

        expect(mockAxios.post).toHaveBeenCalledWith("/runs/new", {
          name: "Valid Run",
          sequencingProvider: "Novogene",
          libraryType: "Paired-end",
          sequencingTechnology: "Illumina",
          librarySource: "GENOMIC",
          librarySelection: "RANDOM",
          libraryStrategy: "WGS",
          insertSize: 500,
          sample: "sample123",
          group: "group123",
          owner: "testuser",
          additionalFiles: [],
          rawFiles: [
            { name: "file1.fq.gz", md5: "abc123", relativePath: "test-dir" },
            { name: "file2.fq.gz", md5: "def456", relativePath: "test-dir" },
          ],
          rawFilesUploadInfo: {
            method: "hpc-mv",
            relativePath: "test-dir",
          },
        });
      });

      it("should submit with correct payload for local mode", async () => {
        wrapper = createWrapper({
          consent: true,
          uploadMethod: "local-filesystem",
          processedFiles: [
            { name: "file1.fq.gz", md5: "abc123", calculatedMd5: "abc123" },
            { name: "file2.fq.gz", md5: "def456", calculatedMd5: "def456" },
          ],
          run: {
            name: "Valid Run",
            sequencingProvider: "Novogene",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: 500,
          },
        });
        wrapper.vm.$refs.additionalUploader = {
          getFiles: vi.fn().mockReturnValue([]),
        };

        await wrapper.vm.submitForm();

        expect(mockAxios.post).toHaveBeenCalledWith("/runs/new", {
          name: "Valid Run",
          sequencingProvider: "Novogene",
          libraryType: "Paired-end",
          sequencingTechnology: "Illumina",
          librarySource: "GENOMIC",
          librarySelection: "RANDOM",
          libraryStrategy: "WGS",
          insertSize: 500,
          sample: "sample123",
          group: "group123",
          owner: "testuser",
          additionalFiles: [],
          rawFiles: [
            { name: "file1.fq.gz", md5: "abc123", calculatedMd5: "abc123" },
            { name: "file2.fq.gz", md5: "def456", calculatedMd5: "def456" },
          ],
          rawFilesUploadInfo: {
            method: "local-filesystem",
          },
        });
      });

      it("should show success toast after submission", async () => {
        wrapper = createWrapper({
          consent: true,
          uploadMethod: "hpc-mv",
          hpcDirectoryName: "test-dir",
          processedFiles: [
            { name: "file1.fq.gz", md5: "abc123" },
            { name: "file2.fq.gz", md5: "def456" },
          ],
          run: {
            name: "Valid Run",
            sequencingProvider: "Novogene",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: null,
          },
        });
        wrapper.vm.$refs.additionalUploader = {
          getFiles: vi.fn().mockReturnValue([]),
        };

        await wrapper.vm.submitForm();

        expect(mockBuefy.toast.open).toHaveBeenCalledWith({
          message: "Run creation started! MD5 validation is in progress.",
          type: "is-success",
          duration: 5000,
        });
      });

      it("should redirect to run page after submission", async () => {
        wrapper = createWrapper({
          consent: true,
          uploadMethod: "hpc-mv",
          hpcDirectoryName: "test-dir",
          processedFiles: [
            { name: "file1.fq.gz", md5: "abc123" },
            { name: "file2.fq.gz", md5: "def456" },
          ],
          run: {
            name: "Valid Run",
            sequencingProvider: "Novogene",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: null,
          },
        });
        wrapper.vm.$refs.additionalUploader = {
          getFiles: vi.fn().mockReturnValue([]),
        };

        await wrapper.vm.submitForm();

        expect(mockRouter.push).toHaveBeenCalledWith({
          name: "run",
          query: { id: "run123" },
        });
      });

      it("should handle submission errors", async () => {
        const errorResponse = {
          response: {
            data: {
              error: "Server error occurred",
            },
          },
        };

        wrapper = createWrapper({
          consent: true,
          uploadMethod: "hpc-mv",
          hpcDirectoryName: "test-dir",
          processedFiles: [
            { name: "file1.fq.gz", md5: "abc123" },
            { name: "file2.fq.gz", md5: "def456" },
          ],
          run: {
            name: "Valid Run",
            sequencingProvider: "Novogene",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: null,
          },
        });
        wrapper.vm.$refs.additionalUploader = {
          getFiles: vi.fn().mockReturnValue([]),
        };
        wrapper.vm.$axios.post = vi.fn().mockRejectedValueOnce(errorResponse);

        await wrapper.vm.submitForm();

        expect(wrapper.vm.$buefy.dialog.alert).toHaveBeenCalledWith({
          title: "Submission Failed",
          message: "Server error occurred",
          type: "is-danger",
        });
      });

      it("should reset isSubmitting flag after error", async () => {
        wrapper = createWrapper({
          consent: true,
          uploadMethod: "hpc-mv",
          hpcDirectoryName: "test-dir",
          processedFiles: [
            { name: "file1.fq.gz", md5: "abc123" },
            { name: "file2.fq.gz", md5: "def456" },
          ],
          run: {
            name: "Valid Run",
            sequencingProvider: "Novogene",
            libraryType: "Paired-end",
            sequencingTechnology: "Illumina",
            librarySource: "GENOMIC",
            librarySelection: "RANDOM",
            libraryStrategy: "WGS",
            insertSize: null,
          },
        });
        wrapper.vm.$refs.additionalUploader = {
          getFiles: vi.fn().mockReturnValue([]),
        };
        wrapper.vm.$axios.post = vi
          .fn()
          .mockRejectedValueOnce(new Error("Network error"));

        await wrapper.vm.submitForm();

        expect(wrapper.vm.isSubmitting).toBe(false);
      });
    });
  });

  describe("Watchers", () => {
    it("should not change upload method when library type changes", async () => {
      wrapper = createWrapper({
        uploadMethod: "local-filesystem",
        run: {
          name: "",
          sequencingProvider: "",
          libraryType: "Paired-end",
          sequencingTechnology: null,
          librarySource: null,
          librarySelection: null,
          libraryStrategy: null,
          insertSize: null,
        },
      });

      await wrapper.setData({
        run: {
          ...wrapper.vm.run,
          libraryType: "Indexed",
        },
      });
      await wrapper.vm.$nextTick();

      // Upload method should remain unchanged - no restrictions
      expect(wrapper.vm.uploadMethod).toBe("local-filesystem");
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete HPC run creation flow", async () => {
      wrapper = createWrapper({
        consent: true,
        uploadMethod: "hpc-mv",
        hpcDirectoryName: "test-dir",
        processedFiles: [
          { name: "file1.fq.gz", md5: "abc123", relativePath: "test-dir" },
          { name: "file2.fq.gz", md5: "def456", relativePath: "test-dir" },
        ],
        run: {
          name: "Integration Test Run",
          sequencingProvider: "Novogene",
          libraryType: "Paired-end",
          sequencingTechnology: "Illumina",
          librarySource: "GENOMIC",
          librarySelection: "RANDOM",
          libraryStrategy: "WGS",
          insertSize: 500,
        },
      });
      wrapper.vm.$refs.additionalUploader = {
        getFiles: vi.fn().mockReturnValue([]),
      };

      await wrapper.vm.submitForm();

      expect(mockAxios.post).toHaveBeenCalled();
      expect(mockBuefy.toast.open).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: "run",
        query: { id: "run123" },
      });
    });

    it("should handle complete local upload run flow", async () => {
      wrapper = createWrapper({
        consent: true,
        uploadMethod: "local-filesystem",
        localFilesConfirmed: true,
        processedFiles: [
          { name: "file1.fq.gz", md5: "abc123", calculatedMd5: "abc123" },
          { name: "file2.fq.gz", md5: "def456", calculatedMd5: "def456" },
        ],
        run: {
          name: "Local Upload Run",
          sequencingProvider: "Earlham Institute",
          libraryType: "Paired-end",
          sequencingTechnology: "Illumina",
          librarySource: "GENOMIC",
          librarySelection: "PCR",
          libraryStrategy: "WGS",
          insertSize: 300,
        },
      });
      wrapper.vm.$refs.additionalUploader = {
        getFiles: vi.fn().mockReturnValue([]),
      };

      await wrapper.vm.submitForm();

      expect(mockAxios.post).toHaveBeenCalled();
      expect(mockBuefy.toast.open).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: "run",
        query: { id: "run123" },
      });
    });
  });
});
