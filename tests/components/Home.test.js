import { createLocalVue, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Home from "~/components/home/Home.vue";

// Registered on the Vue instance rather than per mount so the StorageBadge
// children, which also use v-tooltip, resolve it too.
const localVue = createLocalVue();
localVue.directive("tooltip", {});

const archived = (name) => ({
  state: "aws",
  acceptsHpcWrites: false,
  authoritativeLocation: "s3",
  s3Uri: `s3://archive/data/group/${name}`,
});

const project = (i, storage = null) => ({
  _id: `p${i}`,
  name: `Project ${i}`,
  storage,
});

const mountHome = (projects) =>
  mount(Home, {
    localVue,
    mocks: {
      $store: {
        state: { projects, news: [], auth: { loggedIn: false } },
        getters: { isAdmin: false },
        dispatch: () => Promise.resolve(),
      },
      $auth: { $state: { user: { username: "someone" } } },
    },
    stubs: {
      "nuxt-link": { template: "<a><slot /></a>" },
      "b-field": { template: "<div><slot /></div>" },
      "b-input": true,
      "b-loading": true,
      "b-message": true,
      "b-icon": true,
      NewsCard: true,
    },
  });

describe("Home sidebar", () => {
  it("lists projects with their names and a count", () => {
    const wrapper = mountHome([project(1), project(2)]);
    const names = wrapper
      .findAll(".project-name")
      .wrappers.map((w) => w.text());
    expect(names).toEqual(["Project 1", "Project 2"]);
    expect(wrapper.find(".project-count").text()).toBe("2");
  });

  it("offers to show the rest of a long list, with its size", async () => {
    const projects = Array.from({ length: 20 }, (_, i) => project(i));
    const wrapper = mountHome(projects);
    expect(wrapper.findAll(".project-link")).toHaveLength(15);

    const showMore = wrapper.find(".show-more");
    expect(showMore.text()).toBe("Show all 20 projects");
    await showMore.trigger("click");
    expect(wrapper.findAll(".project-link")).toHaveLength(20);
    expect(wrapper.find(".show-more").exists()).toBe(false);
  });

  it("says when the filter matches nothing", async () => {
    const wrapper = mountHome([project(1)]);
    await wrapper.setData({ projectFilterText: "zzz" });
    expect(wrapper.text()).toContain("No projects match “zzz”.");
  });

  it("says when there are no projects at all", () => {
    expect(mountHome([]).text()).toContain("No projects found.");
  });

  it("explains each storage icon in the list once, and only those", () => {
    const wrapper = mountHome([
      project(1),
      project(2, archived("p2")),
      project(3, archived("p3")),
    ]);
    const keyItems = wrapper
      .findAll(".storage-key li")
      .wrappers.map((w) => w.text());
    expect(keyItems).toEqual(["Archived in AWS"]);
    expect(wrapper.findAll(".project-link .storage-indicator")).toHaveLength(2);
  });

  it("hides the storage key when every project is on HPC", () => {
    expect(
      mountHome([project(1)])
        .find(".storage-key")
        .exists()
    ).toBe(false);
  });
});
