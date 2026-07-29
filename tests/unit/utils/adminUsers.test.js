import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getEnaAdmins, isEnaAdmin } from "~/utils/adminUsers";

describe("adminUsers", () => {
  const original = process.env.ENA_ADMINS;

  beforeEach(() => {
    delete process.env.ENA_ADMINS;
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ENA_ADMINS;
    } else {
      process.env.ENA_ADMINS = original;
    }
  });

  describe("getEnaAdmins", () => {
    it("parses the single-quoted form this project's .env actually uses", () => {
      process.env.ENA_ADMINS = "['deeks', 'macleand', 'taz23vul', 'admin']";
      expect(getEnaAdmins()).toEqual([
        "deeks",
        "macleand",
        "taz23vul",
        "admin",
      ]);
    });

    it("parses a JSON array", () => {
      process.env.ENA_ADMINS = '["deeks", "macleand"]';
      expect(getEnaAdmins()).toEqual(["deeks", "macleand"]);
    });

    it("parses a plain comma-separated list", () => {
      process.env.ENA_ADMINS = "deeks,macleand";
      expect(getEnaAdmins()).toEqual(["deeks", "macleand"]);
    });

    it("parses a single bare username", () => {
      process.env.ENA_ADMINS = "deeks";
      expect(getEnaAdmins()).toEqual(["deeks"]);
    });

    it("tolerates ragged whitespace and trailing commas", () => {
      process.env.ENA_ADMINS = "[ 'deeks' ,  'macleand' , ]";
      expect(getEnaAdmins()).toEqual(["deeks", "macleand"]);
    });

    it("returns an empty list when unset or blank", () => {
      expect(getEnaAdmins()).toEqual([]);
      process.env.ENA_ADMINS = "";
      expect(getEnaAdmins()).toEqual([]);
      process.env.ENA_ADMINS = "   ";
      expect(getEnaAdmins()).toEqual([]);
    });
  });

  describe("isEnaAdmin", () => {
    beforeEach(() => {
      process.env.ENA_ADMINS = "['deeks', 'macleand', 'taz23vul', 'admin']";
    });

    it("admits the configured usernames", () => {
      expect(isEnaAdmin("deeks")).toBe(true);
      expect(isEnaAdmin("macleand")).toBe(true);
      expect(isEnaAdmin("taz23vul")).toBe(true);
      expect(isEnaAdmin("admin")).toBe(true);
    });

    // The regression this module exists to prevent. The old check was
    // `process.env.ENA_ADMINS.includes(username)` — a substring test against
    // the raw string, so every fragment below passed it.
    it.each(["s", "ee", "clean", "min", "admi", "deek", "23vul", "'"])(
      "refuses %j, which the old substring check admitted",
      (fragment) => {
        expect(process.env.ENA_ADMINS.includes(fragment)).toBe(true);
        expect(isEnaAdmin(fragment)).toBe(false);
      }
    );

    it("refuses a username that merely contains a configured one", () => {
      expect(isEnaAdmin("testadmin")).toBe(false);
      expect(isEnaAdmin("deeksy")).toBe(false);
    });

    it("is case sensitive, matching how the API compares usernames", () => {
      expect(isEnaAdmin("Deeks")).toBe(false);
      expect(isEnaAdmin("ADMIN")).toBe(false);
    });

    it("refuses a missing or non-string username", () => {
      expect(isEnaAdmin(undefined)).toBe(false);
      expect(isEnaAdmin(null)).toBe(false);
      expect(isEnaAdmin("")).toBe(false);
      expect(isEnaAdmin(123)).toBe(false);
      expect(isEnaAdmin({})).toBe(false);
    });

    it("refuses everyone when the variable is unset, rather than throwing", () => {
      delete process.env.ENA_ADMINS;
      // pages/project.vue used an unguarded `.includes` here and threw a
      // TypeError inside a computed, taking the page render down.
      expect(() => isEnaAdmin("deeks")).not.toThrow();
      expect(isEnaAdmin("deeks")).toBe(false);
    });
  });
});
