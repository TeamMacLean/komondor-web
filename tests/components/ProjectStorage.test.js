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
  slots = {},
  contactEmail = "",
} = {}) => {
  const wrapper = mount(ProjectStorage, {
    propsData: {
      project: {
        _id: id,
        name: "Test project",
        hpcPreservationRequestedBy: "researcher",
        hpcPreservationReason: "Analysis ongoing",
        ...project,
      },
      storageLocations: locations,
    },
    slots,
    mocks: {
      $auth: { $state: { user: { username: "deeks", isAdmin } } },
      $axios: { put },
      $config: { HPC_RETENTION_CONTACT_EMAIL: contactEmail },
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

  it("puts slotted project details in a first column beside the locations", () => {
    const wrapper = mountPanel({
      slots: { default: "<p>strachan</p>" },
      locations: { aws: { status: "unknown" } },
    });
    const columns = wrapper.findAll(".column");
    expect(columns.length).toBe(3);
    expect(columns.at(0).attributes("data-testid")).toBe("project-details");
    expect(columns.at(0).text()).toBe("strachan");
    expect(columns.at(1).attributes("data-testid")).toBe("hpc-location");
    expect(columns.at(2).attributes("data-testid")).toBe("aws-location");
  });

  it("keeps the borderless columns alongside retention details and editing", () => {
    const wrapper = mountPanel({
      isAdmin: true,
      slots: { default: "<p>Project owner and group</p>" },
      project: { preserveOnHpcUntil: future },
      locations: { aws: { status: "verified" } },
    });
    expect(wrapper.classes()).not.toContain("box");
    expect(wrapper.find("h2").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("Storage locations");
    expect(wrapper.findAll(".columns > .column").length).toBe(3);
    expect(wrapper.find(".column").text()).toBe("Project owner and group");
    expect(wrapper.text()).toContain("Archiving copies the data to AWS");
    expect(wrapper.text()).toContain(
      "Requested by researcher: Analysis ongoing"
    );
    expect(wrapper.find("input[type=date]").exists()).toBe(true);
    expect(wrapper.find(`input[id$="-requester"]`).exists()).toBe(true);
    expect(wrapper.find(`textarea[id$="-reason"]`).exists()).toBe(true);
  });

  it("omits the details column when nothing is slotted", () => {
    expect(mountPanel().find('[data-testid="project-details"]').exists()).toBe(
      false
    );
  });

  it("drops the AWS column only for a project known not to be archived", () => {
    const hidden = mountPanel({
      locations: { aws: { status: "not_archived" } },
    });
    expect(hidden.find('[data-testid="aws-location"]').exists()).toBe(false);
    expect(hidden.text()).not.toContain("Not archived in AWS");
  });

  it.each(["verified", "unverified", "unknown"])(
    "keeps the AWS column when its status is %s",
    (status) => {
      const wrapper = mountPanel({
        locations: {
          aws: {
            status,
            uri: "s3://archive/project",
            verifiedAt: "2026-10-30T20:18:30.550Z",
          },
        },
      });
      expect(wrapper.find('[data-testid="aws-location"]').exists()).toBe(true);
    }
  );

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
    await wrapper.find("input[type=date]").setValue("2027-11-13");
    await wrapper.find("form").trigger("submit");
    await global.flushPromises();
    expect(put).toHaveBeenCalledExactlyOnceWith("/project/hpc-preservation", {
      _id: id,
      preserveOnHpcUntil: future,
      expectedPreserveOnHpcUntil: null,
      hpcPreservationRequestedBy: "researcher",
      hpcPreservationReason: "Analysis ongoing",
    });
    expect(wrapper.emitted("preservation-updated")).toEqual([
      [{ projectId: id, preserveOnHpcUntil: future }],
    ]);
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
    await wrapper.find("input[type=date]").setValue("");
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
      hpcPreservationRequestedBy: "",
      hpcPreservationReason: "Analysis ongoing",
    });
    expect(wrapper.emitted("preservation-updated")).toEqual([
      [{ projectId: id, preserveOnHpcUntil: null }],
    ]);
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
    expect(
      wrapper.find("input[type=date]").attributes("disabled")
    ).toBeDefined();
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

describe("HPC retention follow-up", () => {
  it("requires a requester and reason for a new hold and a reason to clear", async () => {
    const put = vi.fn();
    const wrapper = mountPanel({
      isAdmin: true,
      put,
      project: {
        preserveOnHpcUntil: future,
        hpcPreservationRequestedBy: "",
        hpcPreservationReason: "",
      },
    });
    expect(wrapper.text()).toContain(
      "visible to everyone who can see this project"
    );
    await wrapper.find("form").trigger("submit");
    await wrapper.vm.updateDate(null);
    expect(put).not.toHaveBeenCalled();
    expect(
      wrapper.find("button[type=submit]").attributes("disabled")
    ).toBeDefined();
    await wrapper.find("textarea").setValue("Released by requester");
    expect(
      wrapper.find('[data-testid="clear-preservation"]').attributes("disabled")
    ).toBeUndefined();
  });

  it.each(["2020-01-01T23:59:59.999Z", "2020-01-01T00:00:00.000Z"])(
    "allows metadata backfill for an unchanged expired date %s",
    async (expired) => {
      const put = vi.fn().mockResolvedValue({
        status: 200,
        data: { projectId: id, preserveOnHpcUntil: expired },
      });
      const wrapper = mountPanel({
        isAdmin: true,
        put,
        project: { preserveOnHpcUntil: expired },
      });
      await wrapper.find("input[type=text]").setValue("Original requester");
      await wrapper.find("form").trigger("submit");
      expect(put).toHaveBeenCalledWith(
        "/project/hpc-preservation",
        expect.objectContaining({
          preserveOnHpcUntil: expired,
          expectedPreserveOnHpcUntil: expired,
          hpcPreservationRequestedBy: "Original requester",
        })
      );
    }
  );

  it("rejects a new past date before requesting a save", async () => {
    const put = vi.fn();
    const wrapper = mountPanel({ isAdmin: true, put });
    await wrapper.find("input[type=date]").setValue("2020-01-01");
    await wrapper.find("form").trigger("submit");
    expect(put).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Choose a future date");
  });

  it("surfaces a malformed BSON date flag and repairs with the invalid fence", async () => {
    const put = vi.fn().mockResolvedValue({
      status: 200,
      data: { projectId: id, preserveOnHpcUntil: future },
    });
    const wrapper = mountPanel({
      isAdmin: true,
      put,
      project: {
        preserveOnHpcUntil: null,
        storage: { hpcPreservationInvalid: true },
      },
    });
    expect(wrapper.text()).toContain("needs administrator attention");
    await wrapper.find("input[type=date]").setValue("2027-11-13");
    await wrapper.find("form").trigger("submit");
    expect(put).toHaveBeenCalledWith(
      "/project/hpc-preservation",
      expect.objectContaining({ expectedPreserveOnHpcUntil: "invalid" })
    );
  });

  it("shows the requester and reason to every reader, and an encoded mailto from runtime config", () => {
    const wrapper = mountPanel({
      contactEmail: "retention@example.test",
      project: { name: "A & B?", preserveOnHpcUntil: future },
    });
    expect(wrapper.text()).toContain(
      "Requested by researcher: Analysis ongoing"
    );
    const link = new URL(wrapper.find("a").attributes("href"));
    expect(link.protocol).toBe("mailto:");
    expect(link.pathname).toBe("retention@example.test");
    expect(link.searchParams.get("subject")).toBe(
      "HPC retention request: A & B?"
    );
    expect(link.searchParams.get("body")).toContain(`/project?id=${id}`);
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it("shows the contact name without a link when runtime config is unset", () => {
    const wrapper = mountPanel();
    expect(wrapper.text()).toContain("Contact George Deeks");
    expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(false);
  });

  it("shows computed dates from project creation and explains the independent copies", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T12:00:00.000Z"));
    const wrapper = mountPanel({
      locations: {
        archiveDueAt: "2031-11-16T00:00:00.000Z",
        hpcDeletionEligibleAt: "2031-11-16T00:00:00.000Z",
      },
    });
    expect(wrapper.text()).toContain("Due to move to AWS around November 2031");
    expect(wrapper.text()).toContain(
      "HPC deletion review eligible from 16 November 2031"
    );
    expect(wrapper.text()).toContain("must be copied to AWS first");
    expect(wrapper.text()).toContain("This Komondor record stays");
  });

  it("labels an overdue archive date without implying automatic deletion", () => {
    const wrapper = mountPanel({
      locations: { archiveDueAt: "2020-01-01T00:00:00.000Z" },
    });
    expect(wrapper.text()).toContain("awaiting the next archive run");
    expect(wrapper.text()).toContain("nothing is deleted automatically");
  });

  it("never shows a deletion eligibility date for an invalid hold", () => {
    const wrapper = mountPanel({
      project: { hpcPreservationInvalid: true },
      locations: { hpcDeletionEligibleAt: future },
    });
    expect(wrapper.text()).not.toContain("HPC deletion review eligible from");
    expect(wrapper.text()).toContain("needs administrator attention");
  });
});
