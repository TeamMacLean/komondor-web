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

const mountBadge = (storage, isAdmin = false) =>
  mount(StorageBadge, {
    propsData: { storage },
    mocks: { $store: { getters: { isAdmin } } },
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
});
