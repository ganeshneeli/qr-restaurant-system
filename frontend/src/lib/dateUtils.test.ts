import { describe, it, expect } from "vitest";
import { formatSafeTime } from "./dateUtils";

describe("formatSafeTime", () => {
  it("should format a valid ISO date string", () => {
    const date = "2023-10-27T10:00:00.000Z";
    // Depends on environment locale, but we check if it doesn't throw and returns a string
    const result = formatSafeTime(date);
    expect(typeof result).toBe("string");
    expect(result).not.toBe("—");
  });

  it("should return '—' for null or undefined", () => {
    expect(formatSafeTime(null)).toBe("—");
    expect(formatSafeTime(undefined)).toBe("—");
  });

  it("should return '—' for invalid date strings", () => {
    expect(formatSafeTime("not-a-date")).toBe("—");
    expect(formatSafeTime("")).toBe("—");
  });

  it("should handle Date objects", () => {
    const date = new Date();
    const result = formatSafeTime(date);
    expect(typeof result).toBe("string");
    expect(result).not.toBe("—");
  });
});
