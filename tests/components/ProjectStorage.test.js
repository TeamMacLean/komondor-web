import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProjectStorage from "~/components/storage/ProjectStorage.vue";

const id = "5fc012bda3efcb29338b7d58";
const future = "2027-11-13T23:59:59.999Z";
const wrappers = [];
// Buefy is not registered in these tests; render the modal body only when open.
const ModalStub = {
  props: ["active"],
  render(h) {
    return this.active ? h("div", this.$slots.default) : null;
  },
};
const mountPanel = ({
  isAdmin = false,
  project = {},
  locations = null,
  put = vi.fn(),
  slots = {},
  scopedSlots = {},
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
    scopedSlots,
    stubs: { "b-modal": ModalStub },
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
    expect(wrapper.text()).toContain("Transfer verified in AWS");
    expect(wrapper.text()).toContain("recorded transfer verification");
    expect(wrapper.text()).toContain("a fresh S3 check");
    expect(wrapper.text()).toContain(
      "Approved to stay on the HPC until 13 November 2027"
    );
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

  it("keeps the AWS column for an unarchived project, led by its schedule", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T12:00:00.000Z"));
    const dated = mountPanel({
      locations: {
        aws: { status: "not_archived" },
        archiveDueAt: "2027-10-07T14:55:00.000Z",
        hpcDeletionEligibleAt: "2027-10-07T14:55:00.000Z",
      },
    });
    const aws = dated.find('[data-testid="aws-location"]');
    expect(aws.exists()).toBe(true);
    expect(aws.text()).toContain(
      "scheduled to be deleted from the HPC from 7 October 2027."
    );
    expect(aws.text()).not.toContain("Due to move to AWS");
    expect(aws.text()).not.toContain("Not archived in AWS");

    const undated = mountPanel({
      locations: { aws: { status: "not_archived" } },
    });
    expect(undated.find('[data-testid="aws-location"]').text()).toContain(
      "Not archived in AWS"
    );
  });

  it("puts the schedule, keep date and contact in the AWS column", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T12:00:00.000Z"));
    const wrapper = mountPanel({
      isAdmin: true,
      slots: { default: "<p>Project owner and group</p>" },
      project: { preserveOnHpcUntil: future },
      locations: {
        aws: { status: "not_archived" },
        archiveDueAt: "2027-10-07T14:55:00.000Z",
        hpcDeletionEligibleAt: future,
      },
    });
    const aws = wrapper.find('[data-testid="aws-location"]');
    expect(aws.find('[data-testid="retention-schedule"]').exists()).toBe(true);
    expect(aws.text()).toContain("scheduled to be deleted from the HPC from");
    expect(aws.text()).toContain(
      "Approved to stay on the HPC until 13 November 2027"
    );
    expect(aws.text()).toContain("Contact George Deeks");
    // Only the admin-only section sits outside the three columns.
    const outside = wrapper.findAll(".project-storage > :not(.columns)");
    expect(outside.length).toBe(1);
    expect(outside.at(0).attributes("data-testid")).toBe("admin-tools");
  });

  it("collapses the keep-date form inside a labelled admin-only section", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T12:00:00.000Z"));
    const wrapper = mountPanel({
      isAdmin: true,
      project: { preserveOnHpcUntil: future },
    });
    const section = wrapper.find('[data-testid="admin-tools"]');
    expect(section.text()).toContain("Admin only");
    const panel = section.find("details");
    expect(panel.attributes("open")).toBeUndefined();
    expect(panel.find("summary").text()).toContain("Preserve on HPC");
    expect(panel.find("summary").text()).toContain(
      "Kept until 13 November 2027"
    );
    expect(panel.find("summary").text()).not.toContain("UTC");
    expect(panel.find('[data-testid="preservation-form"]').exists()).toBe(true);

    expect(
      mountPanel({ isAdmin: true }).find("details summary").text()
    ).toContain("No keep date set");
  });

  it("shows the keep date as one collapsed line with the request inside", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T12:00:00.000Z"));
    const wrapper = mountPanel({
      project: {
        preserveOnHpcUntil: future,
        hpcPreservationRequestedBy: "Joe Win",
        hpcPreservationReason: "as per the Kamoun review.",
      },
    });
    const keep = wrapper.find('[data-testid="keep-request"]');
    expect(keep.element.tagName).toBe("DETAILS");
    expect(keep.attributes("open")).toBeUndefined();
    expect(keep.find("summary").text()).toBe(
      "Approved to stay on the HPC until 13 November 2027"
    );
    expect(keep.text()).toContain(
      "Requested by Joe Win: as per the Kamoun review."
    );
    expect(keep.text()).not.toContain("review..");
    expect(keep.text()).not.toContain("UTC");
    expect(wrapper.find(".notification").exists()).toBe(false);
  });

  it("labels a passed keep date without implying deletion", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2028-01-01T00:00:00.000Z"));
    const keep = mountPanel({ project: { preserveOnHpcUntil: future } }).find(
      '[data-testid="keep-request"]'
    );
    expect(keep.find("summary").text()).toBe(
      "HPC keep date passed on 13 November 2027"
    );
    expect(keep.text()).toContain(
      "does not mean the HPC copy has been deleted"
    );
  });

  it("hides the admin-only section from non-admins with nothing slotted", () => {
    const wrapper = mountPanel();
    expect(wrapper.find('[data-testid="admin-tools"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain("Admin only");
  });

  it("wraps slotted admin tools without showing the keep-date form", () => {
    const wrapper = mountPanel({
      scopedSlots: { "admin-tools": "<p>Nudge emails</p>" },
    });
    const section = wrapper.find('[data-testid="admin-tools"]');
    expect(section.text()).toContain("Admin only");
    expect(section.text()).toContain("Nudge emails");
    expect(section.find("details").exists()).toBe(false);
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it("explains AWS in a modal opened from the AWS links", async () => {
    const wrapper = mountPanel({
      locations: { hpcDeletionEligibleAt: "2031-10-30T14:41:00.000Z" },
    });
    expect(wrapper.find('[data-testid="aws-info"]').exists()).toBe(false);
    const links = wrapper.findAll(
      '[data-testid="aws-location"] a[role=button]'
    );
    expect(links.length).toBe(2);
    await links.at(1).trigger("click");
    expect(wrapper.find('[data-testid="aws-info"]').text()).toContain(
      "Amazon Web Services"
    );
  });

  it("never names the internal Komondor system to readers", () => {
    const wrapper = mountPanel({
      isAdmin: true,
      project: { preserveOnHpcUntil: future },
      locations: { archiveDueAt: "2031-11-16T00:00:00.000Z" },
    });
    expect(wrapper.text()).not.toMatch(/komondor/i);
  });

  it("gives an archived project no age-based move date", () => {
    const wrapper = mountPanel({
      project: {
        storage: {
          state: "aws_pending_hpc_deletion",
          acceptsHpcWrites: false,
          authoritativeLocation: "s3",
          s3Uri: "s3://archive/project",
        },
      },
      locations: {
        aws: {
          status: "verified",
          uri: "s3://archive/project",
          verifiedAt: "2026-10-30T20:18:30.550Z",
        },
        archiveDueAt: "2031-11-16T00:00:00.000Z",
      },
    });
    expect(wrapper.text()).toContain("Transfer verified in AWS");
    expect(wrapper.text()).not.toContain("move date");
    expect(wrapper.text()).not.toContain("Due to move to AWS");
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
    expect(wrapper.find('textarea[id$="-release-reason"]').element.value).toBe(
      ""
    );
    await wrapper
      .find('textarea[id$="-release-reason"]')
      .setValue("Independent copy verified; release approved");
    await wrapper.find('[data-testid="clear-preservation"]').trigger("click");
    await global.flushPromises();
    expect(put).toHaveBeenCalledExactlyOnceWith("/project/hpc-preservation", {
      _id: id,
      preserveOnHpcUntil: null,
      expectedPreserveOnHpcUntil: future,
      hpcPreservationRequestedBy: "",
      hpcPreservationReason: "Independent copy verified; release approved",
    });
    expect(wrapper.emitted("preservation-updated")).toEqual([
      [{ projectId: id, preserveOnHpcUntil: null }],
    ]);
    expect(wrapper.vm.reason).toBe("Analysis ongoing");
    expect(wrapper.find('textarea[id$="-release-reason"]').element.value).toBe(
      ""
    );
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
    expect(wrapper.text()).toContain("Approved to stay on the HPC until");
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
  it("does not reuse the saved preservation reason when clearing a hold", async () => {
    const put = vi.fn();
    const wrapper = mountPanel({
      isAdmin: true,
      project: { preserveOnHpcUntil: future },
      put,
    });
    await wrapper.find('[data-testid="clear-preservation"]').trigger("click");
    await global.flushPromises();
    expect(put).not.toHaveBeenCalled();
    expect(
      wrapper.find('[data-testid="clear-preservation"]').element.disabled
    ).toBe(true);
    // A direct invocation must not bypass the form's release-reason guard.
    await wrapper.vm.updateDate(null);
    expect(put).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Enter a release reason");
  });

  it.each(["   ", "x".repeat(1001)])(
    "rejects a blank or oversized release reason",
    async (releaseReason) => {
      const put = vi.fn();
      const wrapper = mountPanel({
        isAdmin: true,
        project: { preserveOnHpcUntil: future },
        put,
      });
      await wrapper.setData({ releaseReason });
      await wrapper.vm.updateDate(null);
      expect(put).not.toHaveBeenCalled();
      expect(
        wrapper.find('[data-testid="clear-preservation"]').element.disabled
      ).toBe(true);
    }
  );

  it("keeps the hold and requires reload when a clear returns a stale-date conflict", async () => {
    const put = vi.fn().mockRejectedValue({ response: { status: 409 } });
    const wrapper = mountPanel({
      isAdmin: true,
      project: { preserveOnHpcUntil: future },
      put,
    });
    await wrapper
      .find('textarea[id$="-release-reason"]')
      .setValue("Release approved");
    await wrapper.find('[data-testid="clear-preservation"]').trigger("click");
    await global.flushPromises();
    expect(put).toHaveBeenCalledWith(
      "/project/hpc-preservation",
      expect.objectContaining({
        preserveOnHpcUntil: null,
        expectedPreserveOnHpcUntil: future,
        hpcPreservationReason: "Release approved",
      })
    );
    expect(wrapper.vm.project.preserveOnHpcUntil).toBe(future);
    expect(wrapper.emitted("preservation-updated")).toBeUndefined();
    expect(
      wrapper.find('textarea[id$="-release-reason"]').element.disabled
    ).toBe(true);
    expect(wrapper.text()).toContain("Reload the project");
    await wrapper.vm.updateDate(null);
    expect(put).toHaveBeenCalledTimes(1);
  });

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
    await wrapper
      .find('textarea[id$="-release-reason"]')
      .setValue("Released by requester");
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
    const link = new URL(wrapper.find('a[href^="mailto:"]').attributes("href"));
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

  it("shows the deletion date as a day and says where the project goes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T12:00:00.000Z"));
    const wrapper = mountPanel({
      locations: {
        archiveDueAt: "2031-10-30T14:41:00.000Z",
        hpcDeletionEligibleAt: "2031-10-30T14:41:00.000Z",
      },
    });
    const text = wrapper.text().replace(/\s+/g, " ");
    expect(text).toContain(
      "This project is scheduled to be deleted from the HPC from 30 October 2031. It will be preserved on AWS instead from that point. Project records will remain on this site."
    );
    expect(text).not.toContain("14:41");
    expect(text).not.toContain("Due to move to AWS");
    expect(text).not.toContain("deletion review eligible");
  });

  it("says a passed deletion date is due, with the AWS copy coming first", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T12:00:00.000Z"));
    const text = mountPanel({
      locations: { hpcDeletionEligibleAt: "2020-01-01T00:00:00.000Z" },
    })
      .text()
      .replace(/\s+/g, " ");
    expect(text).toContain(
      "due for deletion from the HPC since 1 January 2020. It will be copied to AWS first"
    );
  });

  it("never shows a deletion eligibility date for an invalid hold", () => {
    const wrapper = mountPanel({
      project: { hpcPreservationInvalid: true },
      locations: { hpcDeletionEligibleAt: future },
    });
    expect(wrapper.text()).not.toContain("deleted from the HPC from");
    expect(wrapper.text()).toContain("needs administrator attention");
  });
});

describe("after the HPC copy is deleted", () => {
  const deleted = {
    state: "aws",
    acceptsHpcWrites: false,
    authoritativeLocation: "s3",
    s3Uri: "s3://archive/group/project",
    s3VerifiedAt: "2026-10-23T08:30:00.000Z",
    hpcVerifiedAbsentAt: "2026-11-25T02:14:00.000Z",
  };
  const absent = {
    hpc: {
      status: "absent",
      uri: "/tsl/data/reads/group/project",
      checkedAt: "2026-11-25T02:14:00.000Z",
      reason: "absence_recorded",
    },
    aws: {
      status: "verified",
      uri: "s3://archive/group/project",
      verifiedAt: "2026-10-23T08:30:00.000Z",
    },
    hpcDeletionEligibleAt: null,
  };

  it("drops the dead HPC path and offers restoration instead of a keep date", () => {
    const wrapper = mountPanel({
      isAdmin: true,
      project: { storage: deleted },
      locations: absent,
    });
    expect(wrapper.text()).toContain("HPC removal confirmed");
    expect(wrapper.text()).not.toContain("/tsl/data/reads/group/project");
    expect(wrapper.text()).toContain(
      "restored to the HPC for a set amount of time"
    );
    expect(wrapper.text()).toContain("incur a cost for your group");
    expect(wrapper.text()).not.toContain("kept on the HPC for longer");
  });

  it("hides the preservation form and any recorded keep date", () => {
    const wrapper = mountPanel({
      isAdmin: true,
      project: { storage: deleted, preserveOnHpcUntil: future },
      locations: absent,
    });
    expect(wrapper.find('[data-testid="preservation-form"]').exists()).toBe(
      false
    );
    expect(wrapper.find('[data-testid="keep-request"]').exists()).toBe(false);
    // With no keep-date form and nothing slotted, the admin section goes too.
    expect(wrapper.find('[data-testid="admin-tools"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain("Approved to stay on the HPC");
  });

  it("still shows slotted admin tools once the keep-date form is gone", () => {
    const wrapper = mountPanel({
      isAdmin: true,
      project: { storage: deleted },
      locations: absent,
      scopedSlots: { "admin-tools": "<p>Other tool</p>" },
    });
    const section = wrapper.find('[data-testid="admin-tools"]');
    expect(section.text()).toContain("Other tool");
    expect(section.find('[data-testid="preservation-form"]').exists()).toBe(
      false
    );
  });

  it("keeps both for a project whose HPC copy still exists", () => {
    const wrapper = mountPanel({
      isAdmin: true,
      project: {
        storage: {
          ...deleted,
          state: "aws_pending_hpc_deletion",
          hpcVerifiedAbsentAt: null,
        },
        preserveOnHpcUntil: future,
      },
      locations: {
        ...absent,
        hpc: {
          status: "unknown",
          uri: "/tsl/data/reads/group/project",
          checkedAt: "2026-11-27T11:04:00.000Z",
          reason: "path_not_found",
        },
      },
    });
    expect(wrapper.find('[data-testid="preservation-form"]').exists()).toBe(
      true
    );
    expect(wrapper.find('[data-testid="keep-request"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("/tsl/data/reads/group/project");
    expect(wrapper.text()).toContain("kept on the HPC for longer");
  });
});
