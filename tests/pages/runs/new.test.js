import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NewRunPage from "../../../pages/runs/new.vue"; // Adjust path as needed

// Mocking external dependencies and global objects
vi.mock("spark-md5", () => ({
  default: {
    ArrayBuffer: vi.fn().mockImplementation(() => ({
      append: vi.fn(),
      end: vi.fn().mockReturnValue("mocked-md5-hash-123"),
    })),
  },
}));

// Mock Nuxt features and components that are not under test
const mockAxios = {
  get: vi.fn().mockResolvedValue({ data: { runNames: [] } }),
  post: vi.fn().mockResolvedValue({ data: { run: { _id: "run123" } } }),
};

const mockAuth = {
  user: { username: "testuser" },
};

const mockBuefy = {
  toast: { open: vi.fn() },
  dialog: { alert: vi.fn() },
};

const mockUploader = {
  template: '<div class="mock-uploader"></div>',
  methods: {
    getFiles: vi.fn().mockReturnValue([]),
    isUploadComplete: vi.fn().mockReturnValue(true),
  },
};

// Helper function to create a properly configured wrapper for the component
const createWrapper = (dataOverrides = {}) => {
  const wrapper = mount(NewRunPage, {
    mocks: {
      $axios: mockAxios,
      $auth: mockAuth,
      $buefy: mockBuefy,
      $route: { query: { sampleId: "sample123" } },
      $router: { push: vi.fn() },
    },
    stubs: {
      Uploader: mockUploader,
      HpcFileValidator: true,
      FormConsentCheckbox: true,
      CollapsibleUploaderHelp: true,
      "b-tabs": { template: "<div><slot/></div>" }, // Render slot for tab items
      "b-tab-item": { template: "<div><slot/></div>" }, // Render slot for tab content
      "b-field": { template: "<div><slot/></div>" },
      "b-button": { template: '<button @click="$emit(\'click\')"><slot/></button>' },
      "b-icon": true,
      "b-tooltip": true,
      "b-select": true,
      "b-input": true,
      "b-tag": true,
    },
    // Manually setting data that would normally come from asyncData
    data() {
      return {
        sample: {
          _id: "sample123",
          name: "Test Sample",
          project: { group: "group123" },
        },
        existingRunNames: ["existing-run-1"],
        run: {
          name: "test-run",
          libraryType: "Paired-end",
          // ... other required run fields
        },
        activeTab: "local-filesystem",
        consent: true, // Assume consent is given for these tests
        md5ValidationComplete: false,
        fileStatuses: [],
        isHashing: false,
        ...dataOverrides, // Apply test-specific data overrides
      };
    },
  });

  // Mock the FileReader API
  const mockReader = {
    onload: () => {},
    onerror: () => {},
    readAsArrayBuffer: vi.fn(function () {
      // Immediately call onload to simulate a fast, successful file read
      this.onload({ target: { result: new ArrayBuffer(8) } });
    }),
  };
  global.FileReader = vi.fn(() => mockReader);

  return wrapper;
};

describe("pages/runs/new.vue - MD5 Checksum Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("triggers the MD5 hashing process and updates state correctly on success", async () => {
    const wrapper = createWrapper();
    const mockFiles = [
      { data: new File(["content1"], "file1.fq.gz") },
      { data: new File(["content2"], "file2.fq.gz") },
    ];
    // Set up the mock uploader to return our test files
    wrapper.findComponent({ ref: "rawUploader" }).vm.getFiles = vi
      .fn()
      .mockReturnValue(mockFiles);

    // Act: Call the validation method
    await wrapper.vm.validateMd5s();

    // Assert
    expect(wrapper.vm.isHashing).toBe(false); // Should be false after completion
    expect(wrapper.vm.md5ValidationComplete).toBe(true);
    expect(wrapper.vm.fileStatuses).toHaveLength(2);
    expect(wrapper.vm.fileStatuses[0].status).toBe("Complete");
    expect(wrapper.vm.fileStatuses[0].md5).toBe("mocked-md5-hash-123");
    expect(wrapper.vm.fileStatuses[1].status).toBe("Complete");
  });

  it("resets MD5 validation status when the list of raw files changes", async () => {
    const wrapper = createWrapper({
      md5ValidationComplete: true,
      fileStatuses: [{ name: "old_file.fq.gz", status: "Complete" }],
    });

    // Act: The real component would emit this event from the uploader
    await wrapper.vm.resetMd5Validation();

    // Assert
    expect(wrapper.vm.md5ValidationComplete).toBe(false);
    expect(wrapper.vm.fileStatuses).toEqual([]);
  });

  it("enables the submit button only when MD5 validation is complete for local uploads", async () => {
    const wrapper = createWrapper();
    // Mock uploader to have files, otherwise a different validation error will trigger
    wrapper.findComponent({ ref: "rawUploader" }).vm.getFiles = vi
      .fn()
      .mockReturnValue([{ data: new File(["c"], "f.gz") }]);

    // Set valid form data
    wrapper.vm.validationErrors = vi.fn().mockReturnValue({});

    // Initially, button should be disabled as md5ValidationComplete is false
    expect(wrapper.vm.canSubmit).toBe(false);

    // Act: Set MD5 validation to complete
    await wrapper.setData({ md5ValidationComplete: true });

    // Assert: Now the button should be enabled
    expect(wrapper.vm.canSubmit).toBe(true);
  });

  it("enriches the form submission payload with calculated MD5s", async () => {
    const wrapper = createWrapper();
    const mockFiles = [{ data: { name: "file1.fq.gz" } }];
    const mockFileStatuses = [{ name: "file1.fq.gz", md5: "md5-for-file1" }];

    // Set up component state for a valid submission
    await wrapper.setData({
      activeTab: "local-filesystem",
      md5ValidationComplete: true,
      fileStatuses: mockFileStatuses,
    });
    wrapper.findComponent({ ref: "rawUploader" }).vm.getFiles = vi
      .fn()
      .mockReturnValue(mockFiles);
    wrapper.vm.validationErrors = vi.fn().mockReturnValue({}); // Bypass other validations

    // Act
    await wrapper.vm.submitForm();

    // Assert
    expect(mockAxios.post).toHaveBeenCalled();
    const submittedPayload = mockAxios.post.mock.calls[0][1];
    expect(submittedPayload.rawFiles).toHaveLength(1);
    expect(submittedPayload.rawFiles[0].md5).toBe("md5-for-file1");
  });
});
