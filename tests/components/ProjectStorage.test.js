import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProjectStorage from "~/components/storage/ProjectStorage.vue";

const id = "5fc012bda3efcb29338b7d58";
const future = "2027-11-13T23:59:59.999Z";
const wrappers = [];
const mountPanel = ({
  isAdmin = false,
  project = {},
  locations = null,
  put = vi.fn(),
} = {}) => {
  const wrapper = mount(ProjectStorage, {
    propsData: {
      project: { _id: id, ...project },
      storageLocations: locations,
    },
    mocks: {
      $auth: { $state: { user: { username: "deeks", isAdmin } } },
      $axios: { put },
    },
  });
  wrappers.push(wrapper);
  return wrapper;
};
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.destroy());
  vi.useRealTimers();
});

describe("ProjectStorage", () => {
  it("shows both locations and the retention notice to non-admin readers", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T00:00:00.000Z"));
    const wrapper = mountPanel({
      project: { preserveOnHpcUntil: future },
      locations: {
        hpc: {
          status: "present",
          uri: "/reads/two_blades/gargy_2019_rnaseq",
          checkedAt: "2026-11-13T12:00:00.000Z",
        },
        aws: {
          status: "verified",
          uri: "s3://archive/two_blades/gargy_2019_rnaseq",
          verifiedAt: "2026-10-30T20:18:30.550Z",
        },
      },
    });
    expect(wrapper.text()).toContain("On HPC");
    expect(wrapper.text()).toContain("Verified in AWS");
    expect(wrapper.text()).toContain("Keep on HPC until 13 November 2027");
    expect(wrapper.text()).toContain("Contact George Deeks");
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it.each([false, "true", undefined])(
    "only a true admin flag exposes editing (%s)",
    (isAdmin) => {
      expect(mountPanel({ isAdmin }).find("form").exists()).toBe(false);
    }
  );

  it("allows an admin to set an archived project's date without changing storage authority", async () => {
    const put = vi.fn().mockResolvedValue({
      status: 200,
      data: { projectId: id, preserveOnHpcUntil: future },
    });
    const storage = {
      state: "aws_pending_hpc_deletion",
      acceptsHpcWrites: false,
      authoritativeLocation: "s3",
      s3Uri: "s3://archive/project",
    };
    const wrapper = mountPanel({
      isAdmin: true,
      project: { storage, preserveOnHpcUntil: null },
      put,
    });
    await wrapper.find("input").setValue("2027-11-13");
    await wrapper.find("form").trigger("submit");
    await global.flushPromises();
    expect(put).toHaveBeenCalledExactlyOnceWith("/project/hpc-preservation", {
      _id: id,
      preserveOnHpcUntil: future,
      expectedPreserveOnHpcUntil: null,
    });
    expect(wrapper.emitted("preservation-updated")).toEqual([[future]]);
    expect(wrapper.vm.project.storage).toEqual(storage);
    expect(wrapper.vm.saving).toBe(false);
  });

  it("never uses an empty date as an implicit clear", async () => {
    const put = vi.fn();
    const wrapper = mountPanel({
      isAdmin: true,
      project: { preserveOnHpcUntil: future },
      put,
    });
    await wrapper.find("input").setValue("");
    await wrapper.find("form").trigger("submit");
    expect(put).not.toHaveBeenCalled();
    expect(
      wrapper.find("button[type=submit]").attributes("disabled")
    ).toBeDefined();
  });

  it("clears only by the explicit action, with the last-seen date fence", async () => {
    const put = vi.fn().mockResolvedValue({
      status: 200,
      data: { projectId: id, preserveOnHpcUntil: null },
    });
    const wrapper = mountPanel({
      isAdmin: true,
      project: { preserveOnHpcUntil: future },
      put,
    });
    await wrapper.find('[data-testid="clear-preservation"]').trigger("click");
    await global.flushPromises();
    expect(put).toHaveBeenCalledExactlyOnceWith("/project/hpc-preservation", {
      _id: id,
      preserveOnHpcUntil: null,
      expectedPreserveOnHpcUntil: future,
    });
    expect(wrapper.emitted("preservation-updated")).toEqual([[null]]);
  });

  it("requires reload after a conflict and does not retry or overwrite", async () => {
    const put = vi.fn().mockRejectedValue({ response: { status: 409 } });
    const wrapper = mountPanel({
      isAdmin: true,
      project: { preserveOnHpcUntil: future },
      put,
    });
    await wrapper.find("form").trigger("submit");
    await global.flushPromises();
    expect(wrapper.text()).toContain("Reload the project");
    expect(wrapper.vm.saving).toBe(false);
    expect(wrapper.emitted("preservation-updated")).toBeUndefined();
    await wrapper.vm.updateDate(null);
    expect(put).toHaveBeenCalledTimes(1);
    expect(wrapper.find("input").attributes("disabled")).toBeDefined();
  });

  it("shows server errors and releases the saving state", async () => {
    const put = vi.fn().mockRejectedValue({
      response: { status: 403, data: { error: "Admin access required" } },
    });
    const wrapper = mountPanel({
      isAdmin: true,
      project: { preserveOnHpcUntil: future },
      put,
    });
    await wrapper.find("form").trigger("submit");
    await global.flushPromises();
    expect(wrapper.text()).toContain("Admin access required");
    expect(wrapper.vm.saving).toBe(false);
    expect(wrapper.emitted("preservation-updated")).toBeUndefined();
  });

  it("an expired date does not imply deletion and updates while the page remains open", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-11-13T23:59:50.000Z"));
    const wrapper = mountPanel({ project: { preserveOnHpcUntil: future } });
    expect(wrapper.text()).toContain("Keep on HPC until");
    vi.advanceTimersByTime(60000);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain(
      "does not mean the HPC copy has been deleted"
    );
    expect(wrapper.text()).toContain("Contact George Deeks");
  });

  it("warns that setting a retention date does not restore an absent copy", () => {
    const wrapper = mountPanel({
      isAdmin: true,
      locations: {
        hpc: { status: "absent", checkedAt: "2026-11-13T12:00:00.000Z" },
      },
    });
    expect(wrapper.text()).toContain("HPC removal confirmed");
    expect(wrapper.text()).toContain("Setting a date does not restore it");
  });

  it("shows the absent-copy warning and historical observation to every reader", () => {
    const wrapper = mountPanel({
      project: { preserveOnHpcUntil: future },
      locations: {
        hpc: {
          status: "absent",
          checkedAt: "2026-11-13T12:00:00.000Z",
          reason: "absence_recorded",
        },
      },
    });
    expect(wrapper.text()).toContain("Setting a date does not restore it");
    expect(wrapper.text()).toContain("Absence recorded");
    expect(wrapper.text()).not.toContain("absence_recorded");
  });

  it.each([
    "path_not_found",
    "storage_unavailable",
    "invalid_project_path",
    "path_outside_storage",
    "not_a_directory",
    "unknown_future_reason",
  ])("explains %s without exposing internal codes", (reason) => {
    const wrapper = mountPanel({
      locations: { hpc: { status: "unknown", reason } },
    });
    expect(wrapper.text()).toContain("HPC presence unknown");
    expect(wrapper.text()).not.toContain(reason);
  });
});
