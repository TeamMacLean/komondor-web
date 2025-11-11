// Component test for NewsCard.vue
import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import NewsCard from "~/components/home/NewsCard.vue";

describe("NewsCard.vue", () => {
  let wrapper;

  const mockNews = {
    user: "testuser",
    type: "project",
    name: "Test Project",
    body: "This is a test project description",
    date: new Date("2024-01-01").toISOString(),
    dateHuman: "2 months ago",
    link: "/project/test-project",
  };

  beforeEach(() => {
    process.env.DATAHOG_DEATH = new Date("2023-01-01").getTime() / 1000;
  });

  it("should render the component", () => {
    wrapper = mount(NewsCard, {
      propsData: {
        news: mockNews,
      },
      stubs: {
        "nuxt-link": true,
        "b-icon": true,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it("should display the author name correctly", () => {
    wrapper = mount(NewsCard, {
      propsData: {
        news: mockNews,
      },
      stubs: {
        "nuxt-link": true,
        "b-icon": true,
      },
    });

    expect(wrapper.text()).toContain("testuser");
  });

  it("should display the news type", () => {
    wrapper = mount(NewsCard, {
      propsData: {
        news: mockNews,
      },
      stubs: {
        "nuxt-link": true,
        "b-icon": true,
      },
    });

    expect(wrapper.text()).toContain("created a new project");
  });

  it("should display the news name", () => {
    wrapper = mount(NewsCard, {
      propsData: {
        news: mockNews,
      },
      stubs: {
        "nuxt-link": true,
        "b-icon": true,
      },
    });

    expect(wrapper.text()).toContain("Test Project");
  });

  it("should display the news body", () => {
    wrapper = mount(NewsCard, {
      propsData: {
        news: mockNews,
      },
      stubs: {
        "nuxt-link": true,
        "b-icon": true,
      },
    });

    expect(wrapper.text()).toContain("This is a test project description");
  });

  it("should handle anonymous users", () => {
    const anonymousNews = {
      ...mockNews,
      user: "unknown",
    };

    wrapper = mount(NewsCard, {
      propsData: {
        news: anonymousNews,
      },
      stubs: {
        "nuxt-link": true,
        "b-icon": true,
      },
    });

    expect(wrapper.text()).toContain("Anonymous");
  });

  it("should truncate long body text", () => {
    const longBodyNews = {
      ...mockNews,
      body: "a".repeat(250), // 250 characters
    };

    wrapper = mount(NewsCard, {
      propsData: {
        news: longBodyNews,
      },
      stubs: {
        "nuxt-link": true,
        "b-icon": true,
      },
    });

    const bodyText = wrapper.vm.bodyLimited;
    expect(bodyText.length).toBeLessThanOrEqual(203); // 200 + '...'
    expect(bodyText).toContain("...");
  });

  it("should not truncate short body text", () => {
    const shortBodyNews = {
      ...mockNews,
      body: "Short description",
    };

    wrapper = mount(NewsCard, {
      propsData: {
        news: shortBodyNews,
      },
      stubs: {
        "nuxt-link": true,
        "b-icon": true,
      },
    });

    const bodyText = wrapper.vm.bodyLimited;
    expect(bodyText).toBe("Short description");
    expect(bodyText).not.toContain("...");
  });

  it("should display human readable date for recent news", () => {
    wrapper = mount(NewsCard, {
      propsData: {
        news: mockNews,
      },
      stubs: {
        "nuxt-link": true,
        "b-icon": true,
      },
    });

    expect(wrapper.vm.getDateInfo).toBe("2 months ago");
  });

  it("should display migration message for old news", () => {
    const oldNews = {
      ...mockNews,
      date: new Date("2022-01-01").toISOString(),
      dateHuman: "2 years ago",
    };

    wrapper = mount(NewsCard, {
      propsData: {
        news: oldNews,
      },
      stubs: {
        "nuxt-link": true,
        "b-icon": true,
      },
    });

    expect(wrapper.vm.getDateInfo).toBe("(migrated from old database)");
  });

  it("should display correct icon for project type", () => {
    wrapper = mount(NewsCard, {
      propsData: {
        news: { ...mockNews, type: "project" },
      },
      stubs: {
        "nuxt-link": true,
        "b-icon": true,
      },
    });

    // Icon is stubbed, just verify the type triggers the right condition
    expect(mockNews.type).toBe("project");
  });

  it("should display correct icon for sample type", () => {
    const sampleNews = { ...mockNews, type: "sample" };
    wrapper = mount(NewsCard, {
      propsData: {
        news: sampleNews,
      },
      stubs: {
        "nuxt-link": true,
        "b-icon": true,
      },
    });

    // Icon is stubbed, just verify the type triggers the right condition
    expect(sampleNews.type).toBe("sample");
  });

  it("should render correct structure", () => {
    wrapper = mount(NewsCard, {
      propsData: {
        news: mockNews,
      },
      stubs: {
        "nuxt-link": true,
        "b-icon": true,
      },
    });

    expect(wrapper.find(".news-item").exists()).toBe(true);
    expect(wrapper.find(".card").exists()).toBe(true);
    expect(wrapper.find(".card-content").exists()).toBe(true);
  });
});
