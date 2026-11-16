import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import StorageBadge from "~/components/storage/StorageBadge.vue";

const validSummary = (state, overrides = {}) => ({
  state,
  acceptsHpcWrites: state === "hpc",
  authoritativeLocation:
    state === "hpc" || state === "migrating" ? "hpc" : "s3",
  s3Uri: state === "hpc" ? null : "s3://archive/data/group/project",
  ...overrides,
});

const mountBadge = (storage, isAdmin = false, props = {}) =>
  mount(StorageBadge, {
    propsData: { storage, ...props },
    mocks: { $store: { getters: { isAdmin } } },
    directives: { tooltip: {} },
    stubs: {
      "b-tag": {
        props: ["type", "size"],
        template: "<span class='tag'><slot /></span>",
      },
      "b-icon": true,
    },
  });

describe("StorageBadge", () => {
  it("renders nothing for legacy HPC projects", () => {
    expect(mountBadge(undefined).text()).toBe("");
  });

  it("labels an archived project", () => {
    expect(mountBadge(validSummary("aws")).text()).toContain("Archived in AWS");
  });

  it("shows a preservation date as deliberate HPC retention", () => {
    const until = new Date(Date.now() + 86400000).toISOString();
    expect(
      mountBadge(
        validSummary("aws_pending_hpc_deletion", {
          preserveOnHpcUntil: until,
        })
      ).text()
    ).toContain("HPC preservation set");
  });

  it("shows migration attention only to admins", () => {
    const storage = validSummary("migrating", {
      migrationHealth: "needs_attention",
    });
    expect(mountBadge(storage, false).text()).not.toContain("needs attention");
    expect(mountBadge(storage, true).text()).toContain("needs attention");
  });

  it("warns for an unknown state", () => {
    expect(mountBadge({ state: "unexpected" }).text()).toContain(
      "Storage state needs attention"
    );
  });

  it("warns rather than showing a misleading AWS badge for incomplete data", () => {
    expect(
      mountBadge(
        validSummary("aws", {
          s3Uri: null,
        })
      ).text()
    ).toContain("Storage state needs attention");
  });

  describe("compact", () => {
    const mountCompact = (storage, isAdmin = false) =>
      mountBadge(storage, isAdmin, { compact: true });

    it("renders nothing for legacy HPC projects", () => {
      expect(mountCompact(undefined).html()).toBe("");
    });

    it("shows one labelled icon instead of the text tag", () => {
      const wrapper = mountCompact(validSummary("aws"));
      const indicator = wrapper.find(".storage-indicator");
      expect(indicator.exists()).toBe(true);
      expect(indicator.classes()).toContain("is-info");
      expect(indicator.attributes("role")).toBe("img");
      expect(indicator.attributes("aria-label")).toBe("Archived in AWS");
      expect(wrapper.find(".tag").exists()).toBe(false);
      expect(wrapper.text()).toBe("");
    });

    it("warns admins about a stuck AWS move in the same single icon", () => {
      const storage = validSummary("migrating", {
        migrationHealth: "needs_attention",
      });
      const indicator = mountCompact(storage, true).find(".storage-indicator");
      expect(indicator.classes()).toContain("is-danger");
      expect(indicator.attributes("aria-label")).toContain("needs attention");
      expect(
        mountCompact(storage, false)
          .find(".storage-indicator")
          .attributes("aria-label")
      ).toBe("Moving to AWS");
    });
  });
});
