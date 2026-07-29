import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NewSample from "../../../pages/samples/new.vue";

// Mock Papa Parse
vi.mock("papaparse", () => ({
  default: {
    parse: vi.fn((file, options) => {
      // Mock implementation will be overridden in tests
      options.complete({ data: [], meta: { fields: [] } });
    }),
  },
}));

describe("NewSample.vue", () => {
  let wrapper;
  let mockAxios;
  let mockAuth;
  let mockRouter;
  let mockBuefy;
  let mockRoute;

  // Helper to create a wrapper with default mocks
  const createWrapper = (dataOverrides = {}, propsData = {}) => {
    mockAxios = {
      get: vi.fn().mockResolvedValue({
        data: {
          project: {
            _id: "project123",
            name: "Test Project",
            group: { _id: "group123", name: "Test Group" },
          },
          sample: null,
        },
      }),
      post: vi.fn().mockResolvedValue({
        data: {
          sample: { _id: "sample123", name: "Test Sample" },
        },
      }),
    };

    mockAuth = {
      user: { username: "testuser" },
    };

    mockRouter = {
      push: vi.fn(),
      replace: vi.fn(),
    };

    mockBuefy = {
      toast: {
        open: vi.fn(),
      },
      dialog: {
        alert: vi.fn(),
      },
    };

    mockRoute = {
      query: { projectId: "project123" },
    };

    const defaultData = {
      project: {
        _id: "project123",
        name: "Test Project",
        group: { _id: "group123", name: "Test Group" },
      },
      existingSampleNames: ["existing-sample-1", "existing-sample-2"],
      sample: {
        name: "",
        scientificName: "",
        commonName: "",
        ncbi: null,
        conditions: "",
        project: "project123",
      },
      isTplexChecked: false,
      tplexCsvFile: null,
      validatedCsvData: [],
      consent: false,
      isSubmitting: false,
      ...dataOverrides,
    };

    return mount(NewSample, {
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
            '<input @input="$emit(\'input\', $event.target.value)" :value="value" />',
          props: ["value", "type", "required", "minlength"],
        },
        "b-checkbox": {
          template:
            '<input type="checkbox" @change="$emit(\'input\', $event.target.checked)" :checked="value" />',
          props: ["value", "disabled"],
        },
        "b-button": {
          template:
            '<button @click="$emit(\'click\')" :disabled="disabled" :type="nativeType"><slot /></button>',
          props: ["loading", "disabled", "type", "nativeType"],
        },
        "b-icon": {
          template: "<span></span>",
          props: ["icon", "size"],
        },
        "b-upload": {
          template: '<div @click="handleClick"><slot /></div>',
          props: ["value", "dragDrop"],
          methods: {
            handleClick() {
              this.$emit("input", new File(["content"], "test.csv"));
            },
          },
        },
        Uploader: {
          template: "<div class='mock-uploader'></div>",
          methods: {
            getFiles: vi.fn().mockReturnValue([]),
            isUploadComplete: vi.fn().mockReturnValue(true),
          },
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
      ...propsData,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render the component with project name", () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.html()).toContain("New Sample for Test Project");
    });

    it("should display subtitle about creating single or multiple samples", () => {
      wrapper = createWrapper();
      expect(wrapper.html()).toContain(
        "Create a single sample or upload a CSV for multiple TPlex samples"
      );
    });

    it("should render TPlex checkbox", () => {
      wrapper = createWrapper();
      const checkbox = wrapper.find('input[type="checkbox"]');
      expect(checkbox.exists()).toBe(true);
    });

    it("should render standard form fields by default", () => {
      wrapper = createWrapper();
      const html = wrapper.html();
      expect(html).toContain("Sample Name");
      expect(html).toContain("Scientific Name");
      expect(html).toContain("Common Name");
      expect(html).toContain("NCBI Taxonomy ID");
      expect(html).toContain("Conditions");
    });

    it("should render submit button", () => {
      wrapper = createWrapper();
      const submitButton = wrapper.find("button.is-success");
      expect(submitButton.exists()).toBe(true);
      expect(submitButton.text()).toContain("Create Sample(s)");
    });

    it("should render FormConsentCheckbox component", () => {
      wrapper = createWrapper();
      expect(wrapper.html()).toContain('type="checkbox"');
    });
  });

  describe("TPlex Mode Toggle", () => {
    it("should show CSV upload when TPlex is checked", async () => {
      wrapper = createWrapper({ isTplexChecked: true });
      await wrapper.vm.$nextTick();
      const html = wrapper.html();
      expect(html).toContain("TPlex CSV File");
    });

    it("should hide standard form fields when TPlex is checked", async () => {
      wrapper = createWrapper({ isTplexChecked: true });
      await wrapper.vm.$nextTick();
      expect(wrapper.html()).not.toContain("Sample Name*");
      expect(wrapper.html()).not.toContain("Scientific Name*");
    });

    it("should show standard form when TPlex is unchecked", () => {
      wrapper = createWrapper({ isTplexChecked: false });
      const html = wrapper.html();
      expect(html).toContain("Sample Name");
      expect(html).toContain("Scientific Name");
    });

    it("should reset CSV data when switching TPlex mode", async () => {
      wrapper = createWrapper({
        isTplexChecked: false,
        validatedCsvData: [{ name: "test" }],
        tplexCsvFile: new File(["content"], "test.csv"),
      });

      await wrapper.setData({ isTplexChecked: true });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.validatedCsvData).toEqual([]);
      expect(wrapper.vm.tplexCsvFile).toBeNull();
    });
  });

  describe("Computed Properties", () => {
    describe("uploadsAreComplete", () => {
      it("should return true when TPlex mode is active", () => {
        wrapper = createWrapper({ isTplexChecked: true });
        expect(wrapper.vm.uploadsAreComplete).toBe(true);
      });

      it("should return true when uploader is not mounted", () => {
        wrapper = createWrapper({ isTplexChecked: false });
        wrapper.vm.$refs.additionalUploader = null;
        expect(wrapper.vm.uploadsAreComplete).toBe(true);
      });

      it("should call uploader's isUploadComplete method in standard mode", () => {
        wrapper = createWrapper({ isTplexChecked: false });
        const mockUploader = {
          isUploadComplete: vi.fn().mockReturnValue(true),
        };
        wrapper.vm.$refs.additionalUploader = mockUploader;
        const result = wrapper.vm.uploadsAreComplete;
        expect(mockUploader.isUploadComplete).toHaveBeenCalled();
        expect(result).toBe(true);
      });
    });

    describe("validationErrors - Standard Mode", () => {
      it("should return error when sample name is missing", () => {
        wrapper = createWrapper({
          sample: {
            name: "",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        expect(wrapper.vm.validationErrors.name).toBe(
          "Sample name is required."
        );
      });

      it("should return error when sample name is too short", () => {
        wrapper = createWrapper({
          sample: {
            name: "ab",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        expect(wrapper.vm.validationErrors.name).toBe(
          "Name must be between 3 and 80 characters."
        );
      });

      it("should return error when sample name is too long", () => {
        wrapper = createWrapper({
          sample: {
            name: "a".repeat(81),
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        expect(wrapper.vm.validationErrors.name).toBe(
          "Name must be between 3 and 80 characters."
        );
      });

      it("should return error when sample name already exists", () => {
        wrapper = createWrapper({
          sample: {
            name: "existing-sample-1",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
          existingSampleNames: ["existing-sample-1", "existing-sample-2"],
        });
        expect(wrapper.vm.validationErrors.name).toBe(
          "This sample name is already in use for this project."
        );
      });

      it("should return error when scientific name is missing", () => {
        wrapper = createWrapper({
          sample: {
            name: "Test Sample",
            scientificName: "",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        expect(wrapper.vm.validationErrors.scientificName).toBe(
          "Scientific name is required (min 5 characters)."
        );
      });

      it("should return error when scientific name is too short", () => {
        wrapper = createWrapper({
          sample: {
            name: "Test Sample",
            scientificName: "Homo",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        expect(wrapper.vm.validationErrors.scientificName).toBe(
          "Scientific name is required (min 5 characters)."
        );
      });

      it("should return error when common name is missing", () => {
        wrapper = createWrapper({
          sample: {
            name: "Test Sample",
            scientificName: "Homo sapiens",
            commonName: "",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        expect(wrapper.vm.validationErrors.commonName).toBe(
          "Common name is required (min 3 characters)."
        );
      });

      it("should return error when common name is too short", () => {
        wrapper = createWrapper({
          sample: {
            name: "Test Sample",
            scientificName: "Homo sapiens",
            commonName: "ab",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        expect(wrapper.vm.validationErrors.commonName).toBe(
          "Common name is required (min 3 characters)."
        );
      });

      it("should return error when NCBI ID is missing", () => {
        wrapper = createWrapper({
          sample: {
            name: "Test Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: null,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        expect(wrapper.vm.validationErrors.ncbi).toBe(
          "A valid, positive NCBI Taxonomy ID is required."
        );
      });

      it("should return error when NCBI ID is not a number", () => {
        wrapper = createWrapper({
          sample: {
            name: "Test Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: "not-a-number",
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        expect(wrapper.vm.validationErrors.ncbi).toBe(
          "A valid, positive NCBI Taxonomy ID is required."
        );
      });

      it("should return error when NCBI ID is zero or negative", () => {
        wrapper = createWrapper({
          sample: {
            name: "Test Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 0,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        expect(wrapper.vm.validationErrors.ncbi).toBe(
          "A valid, positive NCBI Taxonomy ID is required."
        );
      });

      it("should return error when conditions are missing", () => {
        wrapper = createWrapper({
          sample: {
            name: "Test Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions: "",
          },
        });
        expect(wrapper.vm.validationErrors.conditions).toBe(
          "Conditions are required (min 50 characters)."
        );
      });

      it("should return error when conditions are too short", () => {
        wrapper = createWrapper({
          sample: {
            name: "Test Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions: "Too short",
          },
        });
        expect(wrapper.vm.validationErrors.conditions).toBe(
          "Conditions are required (min 50 characters)."
        );
      });

      it("should return no errors when all standard fields are valid", () => {
        wrapper = createWrapper({
          sample: {
            name: "Valid Sample Name",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature and humidity levels",
          },
        });
        expect(Object.keys(wrapper.vm.validationErrors)).toHaveLength(0);
      });
    });

    describe("validationErrors - TPlex Mode", () => {
      it("should return error when TPlex mode is active but no CSV is validated", () => {
        wrapper = createWrapper({
          isTplexChecked: true,
          validatedCsvData: [],
        });
        expect(wrapper.vm.validationErrors.tplexCsv).toBe(
          "A valid and validated TPlex CSV file is required."
        );
      });

      it("should return no errors when TPlex mode has validated CSV data", () => {
        wrapper = createWrapper({
          isTplexChecked: true,
          validatedCsvData: [
            {
              name: "Sample 1",
              scientificName: "Homo sapiens",
              commonName: "Human",
              ncbi: 9606,
              conditions: "Lab conditions",
            },
          ],
        });
        expect(Object.keys(wrapper.vm.validationErrors)).toHaveLength(0);
      });
    });

    describe("canSubmit", () => {
      it("should return false when already submitting", () => {
        wrapper = createWrapper({
          isSubmitting: true,
          consent: true,
          sample: {
            name: "Valid Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        expect(wrapper.vm.canSubmit).toBe(false);
      });

      it("should return false when validation errors exist", () => {
        wrapper = createWrapper({
          isSubmitting: false,
          consent: true,
          sample: {
            name: "",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        expect(wrapper.vm.canSubmit).toBe(false);
      });

      it("should return false when consent is not given", () => {
        wrapper = createWrapper({
          isSubmitting: false,
          consent: false,
          sample: {
            name: "Valid Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        expect(wrapper.vm.canSubmit).toBe(false);
      });

      it("should check uploads are complete in TPlex mode", async () => {
        wrapper = createWrapper({
          isSubmitting: false,
          consent: true,
          isTplexChecked: true, // In TPlex mode, uploads are always complete
          validatedCsvData: [{ name: "test" }], // Valid CSV data
        });

        await wrapper.vm.$nextTick();

        // When isTplexChecked is true, uploadsAreComplete should return true
        expect(wrapper.vm.uploadsAreComplete).toBe(true);
        expect(wrapper.vm.canSubmit).toBe(true); // Should be able to submit
      });

      it("should check uploads are complete when no ref exists", async () => {
        wrapper = createWrapper({
          isSubmitting: false,
          consent: true,
          isTplexChecked: false,
          sample: {
            name: "Valid Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });

        await wrapper.vm.$nextTick();

        // When isTplexChecked is false and no ref exists, should return true
        wrapper.vm.$refs.additionalUploader = null;
        expect(wrapper.vm.uploadsAreComplete).toBe(true);
      });

      it("should return true when all conditions are met", async () => {
        wrapper = createWrapper({
          isSubmitting: false,
          consent: true,
          isTplexChecked: false,
          sample: {
            name: "Valid Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        await wrapper.vm.$nextTick();

        // Create a mock ref before checking canSubmit
        const mockUploader = {
          isUploadComplete: vi.fn().mockReturnValue(true),
        };
        wrapper.vm.$refs.additionalUploader = mockUploader;

        // Force Vue to re-evaluate computed property
        await wrapper.vm.$forceUpdate();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.canSubmit).toBe(true);
      });
    });
  });

  describe("Methods", () => {
    describe("initializeFromClonedSample", () => {
      it("should fetch cloned sample data and populate form", async () => {
        const clonedSampleData = {
          sample: {
            _id: "cloned123",
            name: "Original Sample",
            scientificName: "Canis lupus",
            commonName: "Wolf",
            ncbi: 9612,
            conditions:
              "Wild habitat conditions with natural prey availability",
          },
        };

        // Create wrapper first
        wrapper = createWrapper();

        // Override the axios mock for this specific call
        wrapper.vm.$axios.get = vi
          .fn()
          .mockResolvedValueOnce({ data: clonedSampleData });

        await wrapper.vm.initializeFromClonedSample("cloned123");
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.$axios.get).toHaveBeenCalledWith("/sample", {
          params: { id: "cloned123" },
        });
        expect(wrapper.vm.sample.name).toBe("Original Sample_clone");
        expect(wrapper.vm.sample.scientificName).toBe("Canis lupus");
        expect(wrapper.vm.sample.commonName).toBe("Wolf");
        expect(wrapper.vm.sample.ncbi).toBe(9612);
        expect(wrapper.vm.sample.conditions).toBe(
          "Wild habitat conditions with natural prey availability"
        );
        expect(wrapper.vm.$buefy.toast.open).toHaveBeenCalledWith({
          message: "Form pre-filled from cloned sample.",
          type: "is-info",
        });
      });

      it("should handle errors when fetching cloned sample", async () => {
        wrapper = createWrapper();

        // Override the axios mock to reject
        wrapper.vm.$axios.get = vi
          .fn()
          .mockRejectedValueOnce(new Error("Network error"));

        await wrapper.vm.initializeFromClonedSample("cloned123");
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.$buefy.toast.open).toHaveBeenCalledWith({
          message: "Could not fetch data for cloning.",
          type: "is-warning",
        });
      });
    });

    describe("validateTplexCsv", () => {
      it("should return early if no file is uploaded", () => {
        wrapper = createWrapper({ tplexCsvFile: null });
        wrapper.vm.validateTplexCsv();
        // No Papa.parse should be called
        expect(wrapper.vm.validatedCsvData).toEqual([]);
      });

      it("should validate CSV with correct headers", async () => {
        const Papa = await import("papaparse");
        const mockCsvData = [
          {
            name: "Sample 1",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: "9606",
            conditions: "Lab conditions for sample 1",
          },
          {
            name: "Sample 2",
            scientificName: "Mus musculus",
            commonName: "Mouse",
            ncbi: "10090",
            conditions: "Lab conditions for sample 2",
          },
        ];

        Papa.default.parse.mockImplementationOnce((file, options) => {
          options.complete({
            data: mockCsvData,
            meta: {
              fields: [
                "name",
                "scientificName",
                "commonName",
                "ncbi",
                "conditions",
              ],
            },
          });
        });

        wrapper = createWrapper({
          tplexCsvFile: new File(["content"], "test.csv"),
        });
        wrapper.vm.validateTplexCsv();

        expect(wrapper.vm.validatedCsvData).toEqual(mockCsvData);
        expect(mockBuefy.toast.open).toHaveBeenCalledWith({
          message: expect.stringContaining("CSV validated successfully!"),
          type: "is-success",
        });
      });

      it("should show error dialog when CSV headers are incorrect", async () => {
        const Papa = await import("papaparse");

        // Provide some data rows so it doesn't trigger empty check first
        Papa.default.parse.mockImplementationOnce((file, options) => {
          options.complete({
            data: [{ wrong: "value1", headers: "value2" }],
            meta: {
              fields: ["wrong", "headers"],
            },
          });
        });

        wrapper = createWrapper({
          tplexCsvFile: new File(["content"], "test.csv"),
        });
        wrapper.vm.validateTplexCsv();

        expect(wrapper.vm.validatedCsvData).toEqual([]);
        expect(mockBuefy.dialog.alert).toHaveBeenCalledWith({
          title: "Invalid CSV Headers",
          message: expect.stringContaining(
            "CSV headers are missing or incorrect"
          ),
          type: "is-danger",
        });
      });

      it("should handle CSV parsing errors", async () => {
        const Papa = await import("papaparse");

        Papa.default.parse.mockImplementationOnce((file, options) => {
          options.error(new Error("Parse error"));
        });

        wrapper = createWrapper({
          tplexCsvFile: new File(["content"], "test.csv"),
        });
        wrapper.vm.validateTplexCsv();

        expect(wrapper.vm.validatedCsvData).toEqual([]);
        expect(mockBuefy.dialog.alert).toHaveBeenCalledWith({
          title: "CSV Error",
          message: expect.stringContaining("Failed to parse CSV file"),
          type: "is-danger",
        });
      });
    });

    describe("submitForm", () => {
      it("should show warning toast when form cannot be submitted", async () => {
        wrapper = createWrapper({
          consent: false,
          sample: { name: "" },
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
          sample: {
            name: "Valid Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        wrapper.vm.$refs.additionalUploader = {
          getFiles: vi.fn().mockReturnValue([]),
          isUploadComplete: vi.fn().mockReturnValue(true),
        };

        const submitPromise = wrapper.vm.submitForm();
        expect(wrapper.vm.isSubmitting).toBe(true);
        await submitPromise;
      });

      it("should submit standard sample with correct payload", async () => {
        wrapper = createWrapper({
          consent: true,
          isTplexChecked: false,
          sample: {
            name: "Test Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
            project: "project123",
          },
        });
        wrapper.vm.$refs.additionalUploader = {
          getFiles: vi.fn().mockReturnValue([{ name: "file1.pdf" }]),
          isUploadComplete: vi.fn().mockReturnValue(true),
        };

        await wrapper.vm.submitForm();

        expect(mockAxios.post).toHaveBeenCalledWith("/samples/new", {
          name: "Test Sample",
          scientificName: "Homo sapiens",
          commonName: "Human",
          ncbi: 9606,
          conditions:
            "Standard laboratory conditions with controlled temperature",
          project: "project123",
          group: "group123",
          owner: "testuser",
          tplexCsv: null,
          additionalFiles: [{ name: "file1.pdf" }],
        });
      });

      it("should submit TPlex CSV with correct payload", async () => {
        const csvData = [
          {
            name: "Sample 1",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: "9606",
            conditions: "Lab conditions",
          },
        ];

        wrapper = createWrapper({
          consent: true,
          isTplexChecked: true,
          validatedCsvData: csvData,
        });

        await wrapper.vm.submitForm();

        expect(mockAxios.post).toHaveBeenCalledWith("/samples/new", {
          name: "",
          scientificName: "",
          commonName: "",
          ncbi: null,
          conditions: "",
          project: "project123",
          group: "group123",
          owner: "testuser",
          tplexCsv: csvData,
          additionalFiles: [],
        });
      });

      it("should show success toast after successful submission", async () => {
        wrapper = createWrapper({
          consent: true,
          sample: {
            name: "Test Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        wrapper.vm.$refs.additionalUploader = {
          getFiles: vi.fn().mockReturnValue([]),
          isUploadComplete: vi.fn().mockReturnValue(true),
        };

        await wrapper.vm.submitForm();

        expect(mockBuefy.toast.open).toHaveBeenCalledWith({
          message: "Successfully created 1 sample(s)!",
          type: "is-success",
        });
      });

      it("should redirect to sample page after standard sample creation", async () => {
        wrapper = createWrapper({
          consent: true,
          isTplexChecked: false,
          sample: {
            name: "Test Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        wrapper.vm.$refs.additionalUploader = {
          getFiles: vi.fn().mockReturnValue([]),
          isUploadComplete: vi.fn().mockReturnValue(true),
        };

        await wrapper.vm.submitForm();

        expect(mockRouter.push).toHaveBeenCalledWith({
          name: "sample",
          query: { id: "sample123" },
        });
      });

      it("should redirect to sample page after TPlex submission", async () => {
        const csvData = [
          {
            name: "Sample 1",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: "9606",
            conditions: "Lab conditions for testing purposes only",
          },
          {
            name: "Sample 2",
            scientificName: "Mus musculus",
            commonName: "Mouse",
            ncbi: "10090",
            conditions: "Laboratory mouse housing conditions maintained",
          },
        ];

        wrapper = createWrapper({
          consent: true,
          isTplexChecked: true,
          validatedCsvData: csvData,
        });

        await wrapper.vm.submitForm();

        expect(mockBuefy.toast.open).toHaveBeenCalledWith({
          message: "Successfully created 2 sample(s)!",
          type: "is-success",
        });
        // Both standard and TPlex submissions redirect to the created sample page
        expect(mockRouter.push).toHaveBeenCalledWith({
          name: "sample",
          query: { id: "sample123" },
        });
      });

      it("should handle submission errors", async () => {
        const errorResponse = {
          response: {
            data: {
              error: "Database connection failed",
            },
          },
        };

        wrapper = createWrapper({
          consent: true,
          sample: {
            name: "Test Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        wrapper.vm.$refs.additionalUploader = {
          getFiles: vi.fn().mockReturnValue([]),
          isUploadComplete: vi.fn().mockReturnValue(true),
        };

        // Override axios to reject
        wrapper.vm.$axios.post = vi.fn().mockRejectedValueOnce(errorResponse);

        await wrapper.vm.submitForm();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.$buefy.dialog.alert).toHaveBeenCalledWith({
          title: "Submission Failed",
          message: "Database connection failed",
          type: "is-danger",
        });
      });

      it("should reset isSubmitting flag after error", async () => {
        mockAxios.post.mockRejectedValueOnce(new Error("Network error"));

        wrapper = createWrapper({
          consent: true,
          sample: {
            name: "Test Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        wrapper.vm.$refs.additionalUploader = {
          getFiles: vi.fn().mockReturnValue([]),
          isUploadComplete: vi.fn().mockReturnValue(true),
        };

        await wrapper.vm.submitForm();

        expect(wrapper.vm.isSubmitting).toBe(false);
      });

      // A bare Error is not an axios rejection — it has no `config` and no
      // `response`. getApiErrorMessage treats that as "thrown by our own code",
      // so its message is ours to show. A real network failure takes the axios
      // path instead and gets NETWORK_ERROR_MESSAGE.
      it("shows the message of a non-axios error thrown during submission", async () => {
        wrapper = createWrapper({
          consent: true,
          sample: {
            name: "Test Sample",
            scientificName: "Homo sapiens",
            commonName: "Human",
            ncbi: 9606,
            conditions:
              "Standard laboratory conditions with controlled temperature",
          },
        });
        wrapper.vm.$refs.additionalUploader = {
          getFiles: vi.fn().mockReturnValue([]),
          isUploadComplete: vi.fn().mockReturnValue(true),
        };

        // Override axios to reject without response data
        wrapper.vm.$axios.post = vi
          .fn()
          .mockRejectedValueOnce(new Error("Network error"));

        await wrapper.vm.submitForm();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.$buefy.dialog.alert).toHaveBeenCalledWith({
          title: "Submission Failed",
          message: "Network error",
          type: "is-danger",
        });
      });
    });
  });

  describe("Watchers", () => {
    it("should reset CSV data when isTplexChecked changes", async () => {
      wrapper = createWrapper({
        isTplexChecked: false,
        validatedCsvData: [{ name: "test" }],
        tplexCsvFile: new File(["content"], "test.csv"),
      });

      await wrapper.setData({ isTplexChecked: true });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.validatedCsvData).toEqual([]);
      expect(wrapper.vm.tplexCsvFile).toBeNull();
    });

    it("should invalidate CSV data when file changes", async () => {
      wrapper = createWrapper({
        isTplexChecked: true,
        validatedCsvData: [{ name: "test" }],
        tplexCsvFile: new File(["content"], "test.csv"),
      });

      await wrapper.setData({ tplexCsvFile: new File(["new"], "new.csv") });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.validatedCsvData).toEqual([]);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete standard sample creation flow", async () => {
      wrapper = createWrapper();
      wrapper.vm.$refs.additionalUploader = {
        getFiles: vi.fn().mockReturnValue([]),
        isUploadComplete: vi.fn().mockReturnValue(true),
      };

      // Fill in the form
      await wrapper.setData({
        sample: {
          name: "Integration Test Sample",
          scientificName: "Homo sapiens",
          commonName: "Human",
          ncbi: 9606,
          conditions:
            "Standard laboratory conditions with controlled temperature and humidity",
          project: "project123",
        },
        consent: true,
      });

      // Submit the form
      await wrapper.vm.submitForm();

      // Verify the complete flow
      expect(mockAxios.post).toHaveBeenCalled();
      expect(mockBuefy.toast.open).toHaveBeenCalledWith({
        message: "Successfully created 1 sample(s)!",
        type: "is-success",
      });
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: "sample",
        query: { id: "sample123" },
      });
    });

    it("should handle complete TPlex creation flow", async () => {
      const Papa = await import("papaparse");
      const csvData = [
        {
          name: "Sample 1",
          scientificName: "Homo sapiens",
          commonName: "Human",
          ncbi: "9606",
          conditions: "Lab conditions for sample 1 with proper setup",
        },
        {
          name: "Sample 2",
          scientificName: "Mus musculus",
          commonName: "Mouse",
          ncbi: "10090",
          conditions: "Lab conditions for sample 2 with proper setup",
        },
      ];

      Papa.default.parse.mockImplementationOnce((file, options) => {
        options.complete({
          data: csvData,
          meta: {
            fields: [
              "name",
              "scientificName",
              "commonName",
              "ncbi",
              "conditions",
            ],
          },
        });
      });

      wrapper = createWrapper({
        isTplexChecked: true,
        tplexCsvFile: new File(["content"], "test.csv"),
      });

      // Validate CSV
      wrapper.vm.validateTplexCsv();
      expect(wrapper.vm.validatedCsvData).toEqual(csvData);

      // Give consent and submit
      await wrapper.setData({ consent: true });
      await wrapper.vm.submitForm();

      // Verify the complete flow
      expect(mockAxios.post).toHaveBeenCalled();
      expect(mockBuefy.toast.open).toHaveBeenCalledWith({
        message: "Successfully created 2 sample(s)!",
        type: "is-success",
      });
      // Both standard and TPlex submissions redirect to the created sample page
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: "sample",
        query: { id: "sample123" },
      });
    });
  });
});
