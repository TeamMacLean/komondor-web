import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumber,
  validateInteger,
  validatePositive,
  validateRange,
  validateUrl,
  validateDate,
  validateAlphanumeric,
  validateUsername,
  validatePassword,
  validateFileExtension,
  validateFileSize,
  validateJson,
  validatePhone,
  validateHexColor,
} from "~/utils/validators";

describe("Validators", () => {
  describe("validateEmail", () => {
    it("should validate correct email addresses", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name+tag@example.co.uk")).toBe(true);
      expect(validateEmail("test123@test-domain.com")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("test@")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("test @example.com")).toBe(false);
      expect(validateEmail("")).toBe(false);
      expect(validateEmail(null)).toBe(false);
    });
  });

  describe("validateRequired", () => {
    it("should validate non-empty values", () => {
      expect(validateRequired("text")).toBe(true);
      expect(validateRequired(123)).toBe(true);
      expect(validateRequired([1, 2, 3])).toBe(true);
      expect(validateRequired(" text ")).toBe(true);
    });

    it("should reject empty values", () => {
      expect(validateRequired("")).toBe(false);
      expect(validateRequired("   ")).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
      expect(validateRequired([])).toBe(false);
    });
  });

  describe("validateMinLength", () => {
    it("should validate strings meeting minimum length", () => {
      expect(validateMinLength("hello", 3)).toBe(true);
      expect(validateMinLength("test", 4)).toBe(true);
      expect(validateMinLength("longer", 5)).toBe(true);
    });

    it("should reject strings below minimum length", () => {
      expect(validateMinLength("hi", 3)).toBe(false);
      expect(validateMinLength("", 1)).toBe(false);
      expect(validateMinLength(null, 1)).toBe(false);
    });
  });

  describe("validateMaxLength", () => {
    it("should validate strings within maximum length", () => {
      expect(validateMaxLength("hello", 10)).toBe(true);
      expect(validateMaxLength("test", 4)).toBe(true);
      expect(validateMaxLength("", 5)).toBe(true);
    });

    it("should reject strings exceeding maximum length", () => {
      expect(validateMaxLength("toolong", 5)).toBe(false);
      expect(validateMaxLength("test", 3)).toBe(false);
    });
  });

  describe("validateNumber", () => {
    it("should validate numeric values", () => {
      expect(validateNumber(123)).toBe(true);
      expect(validateNumber(0)).toBe(true);
      expect(validateNumber(-456)).toBe(true);
      expect(validateNumber(3.14)).toBe(true);
      expect(validateNumber("789")).toBe(true);
    });

    it("should reject non-numeric values", () => {
      expect(validateNumber("abc")).toBe(false);
      expect(validateNumber("")).toBe(false);
      expect(validateNumber(null)).toBe(false);
      expect(validateNumber(undefined)).toBe(false);
      expect(validateNumber(NaN)).toBe(false);
      expect(validateNumber(Infinity)).toBe(false);
    });
  });

  describe("validateInteger", () => {
    it("should validate integer values", () => {
      expect(validateInteger(123)).toBe(true);
      expect(validateInteger(0)).toBe(true);
      expect(validateInteger(-456)).toBe(true);
      expect(validateInteger("789")).toBe(true);
    });

    it("should reject non-integer values", () => {
      expect(validateInteger(3.14)).toBe(false);
      expect(validateInteger("3.14")).toBe(false);
      expect(validateInteger("abc")).toBe(false);
    });
  });

  describe("validatePositive", () => {
    it("should validate positive numbers", () => {
      expect(validatePositive(1)).toBe(true);
      expect(validatePositive(100)).toBe(true);
      expect(validatePositive(0.1)).toBe(true);
    });

    it("should reject zero and negative numbers", () => {
      expect(validatePositive(0)).toBe(false);
      expect(validatePositive(-1)).toBe(false);
      expect(validatePositive(-100)).toBe(false);
    });
  });

  describe("validateRange", () => {
    it("should validate numbers within range", () => {
      expect(validateRange(5, 1, 10)).toBe(true);
      expect(validateRange(1, 1, 10)).toBe(true);
      expect(validateRange(10, 1, 10)).toBe(true);
    });

    it("should reject numbers outside range", () => {
      expect(validateRange(0, 1, 10)).toBe(false);
      expect(validateRange(11, 1, 10)).toBe(false);
      expect(validateRange(-5, 1, 10)).toBe(false);
    });
  });

  describe("validateUrl", () => {
    it("should validate correct URLs", () => {
      expect(validateUrl("https://example.com")).toBe(true);
      expect(validateUrl("http://test.com")).toBe(true);
      expect(validateUrl("https://sub.domain.com/path")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(validateUrl("not a url")).toBe(false);
      expect(validateUrl("example.com")).toBe(false);
      expect(validateUrl("")).toBe(false);
      expect(validateUrl(null)).toBe(false);
    });
  });

  describe("validateDate", () => {
    it("should validate valid date strings", () => {
      expect(validateDate("2024-01-01")).toBe(true);
      expect(validateDate("2024-01-01T10:30:00")).toBe(true);
      expect(validateDate(new Date().toISOString())).toBe(true);
    });

    it("should reject invalid date strings", () => {
      expect(validateDate("invalid")).toBe(false);
      expect(validateDate("")).toBe(false);
      expect(validateDate(null)).toBe(false);
    });
  });

  describe("validateAlphanumeric", () => {
    it("should validate alphanumeric strings", () => {
      expect(validateAlphanumeric("abc123")).toBe(true);
      expect(validateAlphanumeric("ABC")).toBe(true);
      expect(validateAlphanumeric("123")).toBe(true);
    });

    it("should reject non-alphanumeric strings", () => {
      expect(validateAlphanumeric("abc-123")).toBe(false);
      expect(validateAlphanumeric("hello world")).toBe(false);
      expect(validateAlphanumeric("test@123")).toBe(false);
      expect(validateAlphanumeric("")).toBe(false);
    });
  });

  describe("validateUsername", () => {
    it("should validate valid usernames", () => {
      expect(validateUsername("user123")).toBe(true);
      expect(validateUsername("test_user")).toBe(true);
      expect(validateUsername("user-name")).toBe(true);
    });

    it("should reject invalid usernames", () => {
      expect(validateUsername("ab")).toBe(false); // too short
      expect(validateUsername("a".repeat(21))).toBe(false); // too long
      expect(validateUsername("user@123")).toBe(false); // invalid chars
      expect(validateUsername("user name")).toBe(false); // space
      expect(validateUsername("")).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should validate passwords meeting requirements", () => {
      expect(validatePassword("password123")).toBe(true);
      expect(validatePassword("12345678")).toBe(true);
    });

    it("should validate with custom requirements", () => {
      const strongReqs = {
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true,
      };
      expect(validatePassword("StrongP@ss1", strongReqs)).toBe(true); // 11 chars, meets all requirements
      expect(validatePassword("StrongP@ssw0rd", strongReqs)).toBe(true);
      expect(validatePassword("weakpass", strongReqs)).toBe(false);
    });

    it("should reject weak passwords", () => {
      expect(validatePassword("weak")).toBe(false); // too short
      expect(validatePassword("")).toBe(false);
      expect(validatePassword(null)).toBe(false);
    });
  });

  describe("validateFileExtension", () => {
    it("should validate allowed extensions", () => {
      expect(validateFileExtension("image.jpg", ["jpg", "png"])).toBe(true);
      expect(validateFileExtension("document.PDF", ["pdf", "doc"])).toBe(true);
      expect(validateFileExtension("file.txt", ["txt"])).toBe(true);
    });

    it("should reject disallowed extensions", () => {
      expect(validateFileExtension("image.gif", ["jpg", "png"])).toBe(false);
      expect(validateFileExtension("file.exe", ["txt", "pdf"])).toBe(false);
      expect(validateFileExtension("noext", ["txt"])).toBe(false);
    });
  });

  describe("validateFileSize", () => {
    it("should validate files within size limit", () => {
      expect(validateFileSize(1000, 1)).toBe(true); // 1KB < 1MB
      expect(validateFileSize(1024 * 1024, 1)).toBe(true); // 1MB = 1MB
      expect(validateFileSize(500000, 1)).toBe(true); // 500KB < 1MB
    });

    it("should reject files exceeding size limit", () => {
      expect(validateFileSize(2 * 1024 * 1024, 1)).toBe(false); // 2MB > 1MB
      expect(validateFileSize(1024 * 1024 + 1, 1)).toBe(false); // Just over 1MB
    });
  });

  describe("validateJson", () => {
    it("should validate valid JSON strings", () => {
      expect(validateJson('{"key": "value"}')).toBe(true);
      expect(validateJson("[]")).toBe(true);
      expect(validateJson("null")).toBe(true);
      expect(validateJson('"string"')).toBe(true);
    });

    it("should reject invalid JSON strings", () => {
      expect(validateJson("{key: value}")).toBe(false);
      expect(validateJson("invalid")).toBe(false);
      expect(validateJson("")).toBe(false);
      expect(validateJson(null)).toBe(false);
    });
  });

  describe("validatePhone", () => {
    it("should validate valid phone numbers", () => {
      expect(validatePhone("1234567890")).toBe(true);
      expect(validatePhone("+1 (555) 123-4567")).toBe(true);
      expect(validatePhone("555-123-4567")).toBe(true);
    });

    it("should reject invalid phone numbers", () => {
      expect(validatePhone("123")).toBe(false); // too short
      expect(validatePhone("abcdefghij")).toBe(false);
      expect(validatePhone("")).toBe(false);
      expect(validatePhone(null)).toBe(false);
    });
  });

  describe("validateHexColor", () => {
    it("should validate valid hex colors", () => {
      expect(validateHexColor("#FF0000")).toBe(true);
      expect(validateHexColor("#fff")).toBe(true);
      expect(validateHexColor("#123ABC")).toBe(true);
    });

    it("should reject invalid hex colors", () => {
      expect(validateHexColor("FF0000")).toBe(false); // missing #
      expect(validateHexColor("#GG0000")).toBe(false); // invalid hex
      expect(validateHexColor("#FF")).toBe(false); // too short
      expect(validateHexColor("")).toBe(false);
    });
  });
});
