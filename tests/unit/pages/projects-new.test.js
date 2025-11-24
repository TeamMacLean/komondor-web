// Unit tests for pages/projects/new.vue
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, createLocalVue, shallowMount } from "@vue/test-utils";
import Vuex from "vuex";
import NewProject from "~/pages/projects/new.vue";

const localVue = createLocalVue();
localVue.use(Vuex);

// Mock child components
const MockUploader = {
  name: "Uploader",
  template: "<div class='mock-uploader'></div>",
  methods: {
    getFiles: vi.fn(() => []),
  },
};

const MockFormConsentCheckbox = {
  name: "FormConsentCheckbox",
  template: "<div class='mock-consent'></div>",
  props: ["initial", "onToggle"],
};

const MockCollapsibleUploaderHelp = {
  name: "CollapsibleUploaderHelp",
  template: "<div class='mock-help'></div>",
};

describe("NewProject.vue", () => {
  let wrapper;
  let store;
  let mockAxios;
  let mockAuth;
  let mockRouter;
  let mockBuefy;

  const createWrapper = (options = {}) => {
    const defaultOptions = {
      localVue,
      store,
      mocks: {
        $axios: mockAxios,
        $auth: mockAuth,
        $router: mockRouter,
        $buefy: mockBuefy,
      },
      stubs: {
        "b-field": {
          template: "<div class='b-field'><slot /></div>",
        },
        "b-input": {
          template: "<input />",
          props: [
            "value",
            "name",
            "id",
            "minlength",
            "maxlength",
            "required",
            "type",
          ],
        },
        "b-select": {
          template: "<select><slot /></select>",
          props: ["value", "placeholder", "required"],
        },
        "b-checkbox": {
          template: "<input type='checkbox' />",
          props: ["value"],
        },
        "b-icon": {
          template: "<span class='icon'></span>",
          props: ["icon", "type"],
        },
        Uploader: MockUploader,
        FormConsentCheckbox: MockFormConsentCheckbox,
        CollapsibleUploaderHelp: MockCollapsibleUploaderHelp,
      },
      ...options,
    };

    return shallowMount(NewProject, defaultOptions);
  };

  beforeEach(() => {
    // Mock axios
    mockAxios = {
      get: vi.fn(),
      post: vi.fn(),
      $get: vi.fn(),
      $post: vi.fn(),
    };

    // Mock auth
    mockAuth = {
      user: {
        username: "testuser",
        isAdmin: false,
      },
      loggedIn: true,
    };

    // Mock router
    mockRouter = {
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
    };

    // Mock Buefy
    mockBuefy = {
      toast: {
        open: vi.fn(),
      },
      dialog: {
        alert: vi.fn(),
      },
    };

    // Create store
    store = new Vuex.Store({
      state: {
        groups: [
          {
            _id: "group1",
            name: "Test Group 1",
            deleted: false,
            sendToEna: true,
          },
          {
            _id: "group2",
            name: "Test Group 2",
            deleted: false,
            sendToEna: false,
          },
        ],
      },
      actions: {
        refreshGroups: vi.fn(),
      },
    });
  });

  describe("Component Rendering", () => {
    it("should render the component", async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: {
          projectsNames: ["existing-project"],
        },
      });

      wrapper = createWrapper({
        data() {
          return {
            isSubmitting: false,
            additionalUploadsComplete: true,
            bad: {
              nameList: ["existing-project"],
            },
            consent: false,
            project: {
              name: "",
              group: "",
              shortDesc: "",
              longDesc: "",
              doNotSendToEna: false,
              doNotSendToEnaReason: null,
              additionalFiles: [],
            },
          };
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find(".title").text()).toBe("New Project");
    });

    it("should display required fields indicator", () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: {
          projectsNames: [],
        },
      });

      wrapper = createWrapper({
        data() {
          return {
            isSubmitting: false,
            additionalUploadsComplete: true,
            bad: { nameList: [] },
            consent: false,
            project: {
              name: "",
              group: "",
              shortDesc: "",
              longDesc: "",
              doNotSendToEna: false,
              doNotSendToEnaReason: null,
              additionalFiles: [],
            },
          };
        },
      });

      expect(wrapper.find(".subtitle").text()).toContain(
        "Ensure required fields (*) are filled in"
      );
    });

    it("should render form with all required fields", () => {
      wrapper = createWrapper({
        data() {
          return {
            isSubmitting: false,
            additionalUploadsComplete: true,
            bad: { nameList: [] },
            consent: false,
            project: {
              name: "",
              group: "",
              shortDesc: "",
              longDesc: "",
              doNotSendToEna: false,
              doNotSendToEnaReason: null,
              additionalFiles: [],
            },
          };
        },
      });

      expect(wrapper.find("form").exists()).toBe(true);
    });
  });

  describe("Computed Properties", () => {
    describe("availableGroups", () => {
      it("should return non-deleted groups", () => {
        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "",
                group: "",
                shortDesc: "",
                longDesc: "",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        const groups = wrapper.vm.availableGroups;
        expect(groups).toHaveLength(2);
        expect(groups[0].name).toBe("Test Group 1");
        expect(groups[1].name).toBe("Test Group 2");
      });

      it("should filter out deleted groups", () => {
        store.state.groups = [
          { _id: "group1", name: "Active Group", deleted: false },
          { _id: "group2", name: "Deleted Group", deleted: true },
        ];

        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "",
                group: "",
                shortDesc: "",
                longDesc: "",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        const groups = wrapper.vm.availableGroups;
        expect(groups).toHaveLength(1);
        expect(groups[0].name).toBe("Active Group");
      });

      it("should handle undefined groups array gracefully", () => {
        store.state.groups = undefined;

        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "",
                group: "",
                shortDesc: "",
                longDesc: "",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        const groups = wrapper.vm.availableGroups;
        expect(groups).toEqual([]);
      });

      it("should handle null groups array gracefully", () => {
        store.state.groups = null;

        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "",
                group: "",
                shortDesc: "",
                longDesc: "",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        const groups = wrapper.vm.availableGroups;
        expect(groups).toEqual([]);
      });
    });

    describe("areMultipleAvailableGroups", () => {
      it("should return true when multiple groups exist", () => {
        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "",
                group: "",
                shortDesc: "",
                longDesc: "",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        expect(wrapper.vm.areMultipleAvailableGroups).toBe(true);
      });

      it("should return false when only one group exists", () => {
        store.state.groups = [
          { _id: "group1", name: "Only Group", deleted: false },
        ];

        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "",
                group: "",
                shortDesc: "",
                longDesc: "",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        expect(wrapper.vm.areMultipleAvailableGroups).toBe(false);
      });
    });

    describe("onlyOneGroup", () => {
      it("should return true when only one group exists", () => {
        store.state.groups = [
          { _id: "group1", name: "Only Group", deleted: false },
        ];

        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "",
                group: "",
                shortDesc: "",
                longDesc: "",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        expect(wrapper.vm.onlyOneGroup).toBe(true);
      });

      it("should return false when multiple groups exist", () => {
        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "",
                group: "",
                shortDesc: "",
                longDesc: "",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        expect(wrapper.vm.onlyOneGroup).toBe(false);
      });
    });

    describe("areStandardFieldsValid", () => {
      it("should return false when name is too short", () => {
        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "Short",
                group: "group1",
                shortDesc: "Valid short description here",
                longDesc:
                  "Valid long description that meets the minimum character requirement for this field to be considered valid",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        expect(wrapper.vm.areStandardFieldsValid).toBe(false);
      });

      it("should return false when name already exists", () => {
        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: ["duplicate-project-name"] },
              consent: false,
              project: {
                name: "duplicate-project-name",
                group: "group1",
                shortDesc: "Valid short description here",
                longDesc:
                  "Valid long description that meets the minimum character requirement for this field to be considered valid",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        expect(wrapper.vm.areStandardFieldsValid).toBe(false);
      });

      it("should return false when short description is too short", () => {
        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "Valid project name here",
                group: "group1",
                shortDesc: "Too short",
                longDesc:
                  "Valid long description that meets the minimum character requirement for this field to be considered valid",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        expect(wrapper.vm.areStandardFieldsValid).toBe(false);
      });

      it("should return false when long description is too short", () => {
        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "Valid project name here",
                group: "group1",
                shortDesc: "Valid short description here",
                longDesc: "Too short for long description",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        expect(wrapper.vm.areStandardFieldsValid).toBe(false);
      });

      it("should return true when all fields are valid", () => {
        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "Valid project name here",
                group: "group1",
                shortDesc: "Valid short description that meets requirements",
                longDesc:
                  "Valid long description that meets the minimum character requirement for this field to be considered valid and ready for submission",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        expect(wrapper.vm.areStandardFieldsValid).toBe(true);
      });

      it("should validate ENA reason when doNotSendToEna is checked", () => {
        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "Valid project name here",
                group: "group1",
                shortDesc: "Valid short description that meets requirements",
                longDesc:
                  "Valid long description that meets the minimum character requirement for this field to be considered valid and ready for submission",
                doNotSendToEna: true,
                doNotSendToEnaReason: "Too short",
                additionalFiles: [],
              },
            };
          },
        });

        expect(wrapper.vm.areStandardFieldsValid).toBe(false);
      });
    });

    describe("canSubmit", () => {
      it("should return false when consent is not given", () => {
        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "Valid project name here",
                group: "group1",
                shortDesc: "Valid short description that meets requirements",
                longDesc:
                  "Valid long description that meets the minimum character requirement for this field to be considered valid and ready for submission",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        expect(wrapper.vm.canSubmit).toBe(false);
      });

      it("should return false when already submitting", () => {
        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: true,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: true,
              project: {
                name: "Valid project name here",
                group: "group1",
                shortDesc: "Valid short description that meets requirements",
                longDesc:
                  "Valid long description that meets the minimum character requirement for this field to be considered valid and ready for submission",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        expect(wrapper.vm.canSubmit).toBe(false);
      });

      it("should return true when all conditions are met", () => {
        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: true,
              project: {
                name: "Valid project name here",
                group: "group1",
                shortDesc: "Valid short description that meets requirements",
                longDesc:
                  "Valid long description that meets the minimum character requirement for this field to be considered valid and ready for submission",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        expect(wrapper.vm.canSubmit).toBe(true);
      });
    });
  });

  describe("Methods", () => {
    describe("onToggleConsent", () => {
      it("should update consent state", () => {
        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: false,
              project: {
                name: "",
                group: "",
                shortDesc: "",
                longDesc: "",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        expect(wrapper.vm.consent).toBe(false);
        wrapper.vm.onToggleConsent(true);
        expect(wrapper.vm.consent).toBe(true);
      });
    });

    describe("postForm", () => {
      it("should show error when user is not authenticated", () => {
        mockAuth.user = null;

        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: true,
              project: {
                name: "Valid project name here",
                group: "group1",
                shortDesc: "Valid short description that meets requirements",
                longDesc:
                  "Valid long description that meets the minimum character requirement for this field to be considered valid and ready for submission",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        wrapper.vm.postForm();

        expect(mockBuefy.dialog.alert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Authentication Error",
            type: "is-danger",
          })
        );
      });

      it("should set isSubmitting to true during submission", () => {
        mockAxios.post.mockResolvedValue({
          data: {
            project: { _id: "new-project-id" },
          },
        });

        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: true,
              project: {
                name: "Valid project name here",
                group: "group1",
                shortDesc: "Valid short description that meets requirements",
                longDesc:
                  "Valid long description that meets the minimum character requirement for this field to be considered valid and ready for submission",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        wrapper.vm.postForm();

        expect(wrapper.vm.isSubmitting).toBe(true);
      });

      it("should auto-select group when only one is available", () => {
        store.state.groups = [
          { _id: "single-group", name: "Only Group", deleted: false },
        ];

        mockAxios.post.mockResolvedValue({
          data: {
            project: { _id: "new-project-id" },
          },
        });

        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: true,
              project: {
                name: "Valid project name here",
                group: "",
                shortDesc: "Valid short description that meets requirements",
                longDesc:
                  "Valid long description that meets the minimum character requirement for this field to be considered valid and ready for submission",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        wrapper.vm.postForm();

        expect(wrapper.vm.project.group).toBe("single-group");
      });

      it("should assign owner to project", () => {
        mockAxios.post.mockResolvedValue({
          data: {
            project: { _id: "new-project-id" },
          },
        });

        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: true,
              project: {
                name: "Valid project name here",
                group: "group1",
                shortDesc: "Valid short description that meets requirements",
                longDesc:
                  "Valid long description that meets the minimum character requirement for this field to be considered valid and ready for submission",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        wrapper.vm.postForm();

        expect(wrapper.vm.project.owner).toBe("testuser");
      });

      it("should call axios post with correct data", () => {
        mockAxios.post.mockResolvedValue({
          data: {
            project: { _id: "new-project-id" },
          },
        });

        wrapper = createWrapper({
          data() {
            return {
              isSubmitting: false,
              additionalUploadsComplete: true,
              bad: { nameList: [] },
              consent: true,
              project: {
                name: "Valid project name here",
                group: "group1",
                shortDesc: "Valid short description that meets requirements",
                longDesc:
                  "Valid long description that meets the minimum character requirement for this field to be considered valid and ready for submission",
                doNotSendToEna: false,
                doNotSendToEnaReason: null,
                additionalFiles: [],
              },
            };
          },
        });

        wrapper.vm.postForm();

        expect(mockAxios.post).toHaveBeenCalledWith(
          "/projects/new",
          expect.objectContaining({
            name: "Valid project name here",
            group: "group1",
            owner: "testuser",
          })
        );
      });
    });
  });

  describe("Watchers", () => {
    it("should auto-select group when only one is available", async () => {
      store.state.groups = [
        { _id: "auto-select-group", name: "Only Group", deleted: false },
      ];

      wrapper = createWrapper({
        data() {
          return {
            isSubmitting: false,
            additionalUploadsComplete: true,
            bad: { nameList: [] },
            consent: false,
            project: {
              name: "",
              group: "",
              shortDesc: "",
              longDesc: "",
              doNotSendToEna: false,
              doNotSendToEnaReason: null,
              additionalFiles: [],
            },
          };
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.project.group).toBe("auto-select-group");
    });
  });
});
