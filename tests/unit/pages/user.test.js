import { shallowMount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import UserPage from "../../../pages/user/index.vue";

// The page renders an identicon from a canvas-backed library, which jsdom
// cannot produce. Only the data-shape logic is under test here.
vi.mock("identicon.js", () => ({
  default: class {
    toString() {
      return "fake-identicon";
    }
  },
}));

describe("user page — /user response shape", () => {
  const createWrapper = (user, routeQuery = {}) =>
    shallowMount(UserPage, {
      data() {
        return { user };
      },
      mocks: {
        $route: { query: routeQuery },
        $auth: { user: { username: "someone-else" } },
      },
      stubs: {
        NuxtLink: true,
        ProjectList: true,
        "b-icon": true,
      },
    });

  describe("flat shape, as returned by the current komondor-api", () => {
    const flatUser = {
      _id: "abc123",
      username: "alice",
      name: "Alice Smith",
      email: "alice@example.org",
      company: "TSL",
      projects: [],
    };

    it("reads the full name", () => {
      expect(createWrapper(flatUser).vm.fullName).toBe("Alice Smith");
    });

    it("reads the email", () => {
      expect(createWrapper(flatUser).vm.email).toBe("alice@example.org");
    });

    it("reads the company", () => {
      expect(createWrapper(flatUser).vm.company).toBe("TSL");
    });

    it("builds an identicon from the id", () => {
      expect(createWrapper(flatUser).vm.icon).toContain("base64");
    });
  });

  describe("legacy _doc shape, as returned before the hardening release", () => {
    // The API used to spread the mongoose document, leaving the real fields
    // under _doc. Both shapes must work so the two repos can deploy in
    // either order.
    const legacyUser = {
      username: "alice",
      _doc: {
        _id: "abc123",
        name: "Alice Smith",
        email: "alice@example.org",
        company: "TSL",
      },
      projects: [],
    };

    it("reads the full name", () => {
      expect(createWrapper(legacyUser).vm.fullName).toBe("Alice Smith");
    });

    it("reads the email", () => {
      expect(createWrapper(legacyUser).vm.email).toBe("alice@example.org");
    });

    it("reads the company", () => {
      expect(createWrapper(legacyUser).vm.company).toBe("TSL");
    });

    it("builds an identicon from the nested id", () => {
      expect(createWrapper(legacyUser).vm.icon).toContain("base64");
    });
  });

  describe("missing data", () => {
    it("falls back to the username in the query for a missing name", () => {
      const wrapper = createWrapper({ username: "alice" }, { username: "bob" });
      expect(wrapper.vm.fullName).toBe("bob");
    });

    it("reports an unknown name when nothing is available", () => {
      expect(createWrapper({ username: "alice" }).vm.fullName).toBe(
        "Unknown full name"
      );
    });

    it("reports an unknown email", () => {
      expect(createWrapper({ username: "alice" }).vm.email).toBe(
        "Unknown email"
      );
    });

    it("reports an unknown company", () => {
      expect(createWrapper({ username: "alice" }).vm.company).toBe(
        "Unknown company"
      );
    });

    it("uses the placeholder avatar when there is no id", () => {
      expect(createWrapper({ username: "alice" }).vm.icon).toContain(
        "placeholders"
      );
    });

    it("does not throw when user is an empty object", () => {
      expect(() => createWrapper({}).vm.fullName).not.toThrow();
    });
  });
});
