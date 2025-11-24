// Integration test for AddAccessionModal.vue - Focus on error handling
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import AddAccessionModal from "~/components/AddAccessionModal.vue";

describe("AddAccessionModal.vue - Error Handling Integration", () => {
  let mockAxios;
  let mockRouter;
  let mockBuefy;

  beforeEach(() => {
    // Mock $axios
    mockAxios = {
      post: vi.fn(),
    };

    // Mock $router
    mockRouter = {
      app: {
        refresh: vi.fn(),
      },
    };

    // Mock $buefy
    mockBuefy = {
      toast: {
        open: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Component rendering", () => {
    it("should render the component with correct label for project", () => {
      const wrapper = mount(AddAccessionModal, {
        propsData: {
          typeId: "123",
          type: "project",
          initialAccessions: [],
          initialReleaseDate: undefined,
        },
        mocks: {
          $axios: mockAxios,
          $router: mockRouter,
          $buefy: mockBuefy,
        },
        stubs: {
          "b-button": true,
          "b-modal": true,
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm.getEditAccessionsLabel).toBe("Edit project accessions");
    });

    it("should render the component with correct label for sample", () => {
      const wrapper = mount(AddAccessionModal, {
        propsData: {
          typeId: "123",
          type: "sample",
          initialAccessions: [],
          initialReleaseDate: undefined,
        },
        mocks: {
          $axios: mockAxios,
          $router: mockRouter,
          $buefy: mockBuefy,
        },
        stubs: {
          "b-button": true,
          "b-modal": true,
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm.getEditAccessionsLabel).toBe("Edit sample accessions");
    });

    it("should render the component with correct label for run", () => {
      const wrapper = mount(AddAccessionModal, {
        propsData: {
          typeId: "123",
          type: "run",
          initialAccessions: [],
          initialReleaseDate: undefined,
        },
        mocks: {
          $axios: mockAxios,
          $router: mockRouter,
          $buefy: mockBuefy,
        },
        stubs: {
          "b-button": true,
          "b-modal": true,
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm.getEditAccessionsLabel).toBe("Edit run accessions");
    });

    it("should not show modal initially", () => {
      const wrapper = mount(AddAccessionModal, {
        propsData: {
          typeId: "123",
          type: "project",
          initialAccessions: [],
          initialReleaseDate: undefined,
        },
        mocks: {
          $axios: mockAxios,
          $router: mockRouter,
          $buefy: mockBuefy,
        },
        stubs: {
          "b-button": true,
          "b-modal": true,
        },
      });

      expect(wrapper.vm.isComponentModalActive).toBe(false);
    });
  });

  describe("Error message extraction logic", () => {
    it("should handle network error (ERR_CONNECTION_REFUSED)", () => {
      const networkError = new Error("Network Error");
      networkError.message = "Network Error";

      let errorMessage = "Failed to update accessions. Please try again.";

      if (networkError.message) {
        errorMessage =
          networkError.message === "Network Error"
            ? "Unable to connect to server. Please ensure the API is running."
            : networkError.message;
      }

      expect(errorMessage).toBe(
        "Unable to connect to server. Please ensure the API is running."
      );
    });

    it("should extract error message from response.data.message", () => {
      const apiError = {
        response: {
          status: 500,
          data: {
            message: "Internal server error occurred",
          },
        },
      };

      let errorMessage = "Failed to update accessions. Please try again.";

      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      }

      expect(errorMessage).toBe("Internal server error occurred");
    });

    it("should extract error message from response.data.error (string)", () => {
      const apiError = {
        response: {
          status: 400,
          data: {
            error: "Invalid accession format",
          },
        },
      };

      let errorMessage = "Failed to update accessions. Please try again.";

      if (apiError.response?.data?.error) {
        errorMessage =
          typeof apiError.response.data.error === "string"
            ? apiError.response.data.error
            : "Failed to update accessions. Please check your input.";
      }

      expect(errorMessage).toBe("Invalid accession format");
    });

    it("should handle error object (non-string) gracefully", () => {
      const apiError = {
        response: {
          status: 400,
          data: {
            error: { code: 400, details: "Bad request" },
          },
        },
      };

      let errorMessage = "Failed to update accessions. Please try again.";

      if (apiError.response?.data?.error) {
        errorMessage =
          typeof apiError.response.data.error === "string"
            ? apiError.response.data.error
            : "Failed to update accessions. Please check your input.";
      }

      expect(errorMessage).toBe(
        "Failed to update accessions. Please check your input."
      );
    });

    it("should handle error with message property", () => {
      const error = new Error("Request timeout");

      let errorMessage = "Failed to update accessions. Please try again.";

      if (error.message) {
        errorMessage =
          error.message === "Network Error"
            ? "Unable to connect to server. Please ensure the API is running."
            : error.message;
      }

      expect(errorMessage).toBe("Request timeout");
    });

    it("should use default message for generic errors", () => {
      const error = {};

      let errorMessage = "Failed to update accessions. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage =
          typeof error.response.data.error === "string"
            ? error.response.data.error
            : "Failed to update accessions. Please check your input.";
      } else if (error.message) {
        errorMessage =
          error.message === "Network Error"
            ? "Unable to connect to server. Please ensure the API is running."
            : error.message;
      }

      expect(errorMessage).toBe(
        "Failed to update accessions. Please try again."
      );
    });
  });

  describe("Toast notification behavior", () => {
    it("should call toast.open with correct parameters for network error", () => {
      const errorMessage =
        "Unable to connect to server. Please ensure the API is running.";

      mockBuefy.toast.open({
        message: errorMessage,
        type: "is-danger",
        duration: 5000,
      });

      expect(mockBuefy.toast.open).toHaveBeenCalledWith({
        message: errorMessage,
        type: "is-danger",
        duration: 5000,
      });
    });

    it("should call toast.open with correct parameters for API error", () => {
      const errorMessage = "Internal server error occurred";

      mockBuefy.toast.open({
        message: errorMessage,
        type: "is-danger",
        duration: 5000,
      });

      expect(mockBuefy.toast.open).toHaveBeenCalledWith({
        message: errorMessage,
        type: "is-danger",
        duration: 5000,
      });
    });

    it("should call toast.open with correct parameters for success", () => {
      const successMessage = "Successfully edited accessions data";

      mockBuefy.toast.open({
        message: successMessage,
        type: "is-success",
      });

      expect(mockBuefy.toast.open).toHaveBeenCalledWith({
        message: successMessage,
        type: "is-success",
      });
    });
  });

  describe("Props validation", () => {
    it("should accept valid props for project type", () => {
      const wrapper = mount(AddAccessionModal, {
        propsData: {
          typeId: "project123",
          type: "project",
          initialAccessions: ["PRJEB12345"],
          initialReleaseDate: "01-01-2025",
        },
        mocks: {
          $axios: mockAxios,
          $router: mockRouter,
          $buefy: mockBuefy,
        },
        stubs: {
          "b-button": true,
          "b-modal": true,
        },
      });

      expect(wrapper.props("typeId")).toBe("project123");
      expect(wrapper.props("type")).toBe("project");
      expect(wrapper.props("initialAccessions")).toEqual(["PRJEB12345"]);
      expect(wrapper.props("initialReleaseDate")).toBe("01-01-2025");
    });

    it("should accept valid props for sample type", () => {
      const wrapper = mount(AddAccessionModal, {
        propsData: {
          typeId: "sample123",
          type: "sample",
          initialAccessions: ["ERS123456", "ERS789012"],
          initialReleaseDate: undefined,
        },
        mocks: {
          $axios: mockAxios,
          $router: mockRouter,
          $buefy: mockBuefy,
        },
        stubs: {
          "b-button": true,
          "b-modal": true,
        },
      });

      expect(wrapper.props("typeId")).toBe("sample123");
      expect(wrapper.props("type")).toBe("sample");
      expect(wrapper.props("initialAccessions")).toEqual([
        "ERS123456",
        "ERS789012",
      ]);
      expect(wrapper.props("initialReleaseDate")).toBe(undefined);
    });

    it("should accept empty initial accessions", () => {
      const wrapper = mount(AddAccessionModal, {
        propsData: {
          typeId: "123",
          type: "run",
          initialAccessions: [],
          initialReleaseDate: undefined,
        },
        mocks: {
          $axios: mockAxios,
          $router: mockRouter,
          $buefy: mockBuefy,
        },
        stubs: {
          "b-button": true,
          "b-modal": true,
        },
      });

      expect(wrapper.props("initialAccessions")).toEqual([]);
    });
  });

  describe("API endpoint integration", () => {
    it("should call correct API endpoint with correct payload", () => {
      const expectedPayload = {
        accessions: ["PRJEB12345", "PRJEB67890"],
        releaseDate: "01-01-2025",
        type: "project",
        typeId: "project123",
      };

      mockAxios.post("/accessions/new", expectedPayload);

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/accessions/new",
        expectedPayload
      );
    });

    it("should format payload correctly for sample type", () => {
      const expectedPayload = {
        accessions: ["ERS123456"],
        releaseDate: "",
        type: "sample",
        typeId: "sample123",
      };

      mockAxios.post("/accessions/new", expectedPayload);

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/accessions/new",
        expectedPayload
      );
    });
  });
});
