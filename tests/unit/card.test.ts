import { describe, expect, it } from "vitest";
import {
  buildCardUrl,
  formatLastActivity,
  maskCustomerName,
} from "@/lib/loyalty/card";

describe("maskCustomerName", () => {
  it("keeps first name and masks the surname", () => {
    expect(maskCustomerName("María Rodríguez Solano")).toBe("María R••••••");
  });

  it("returns a single name unchanged", () => {
    expect(maskCustomerName("Carlos")).toBe("Carlos");
  });

  it("handles extra whitespace", () => {
    expect(maskCustomerName("  Ana   Mora ")).toBe("Ana M•••");
  });

  it("returns empty string for empty input", () => {
    expect(maskCustomerName("   ")).toBe("");
  });
});

describe("buildCardUrl", () => {
  it("builds an absolute card URL", () => {
    expect(buildCardUrl("abc123", "https://example.com")).toBe(
      "https://example.com/c/abc123",
    );
  });

  it("strips a trailing slash from the base", () => {
    expect(buildCardUrl("abc", "https://example.com/")).toBe(
      "https://example.com/c/abc",
    );
  });
});

describe("formatLastActivity", () => {
  it("returns a dash for null", () => {
    expect(formatLastActivity(null)).toBe("—");
  });

  it("returns a dash for an invalid date", () => {
    expect(formatLastActivity("not-a-date")).toBe("—");
  });

  it("formats a valid ISO timestamp", () => {
    const result = formatLastActivity("2026-07-20T14:30:00-06:00");
    expect(result).not.toBe("—");
    expect(result.length).toBeGreaterThan(0);
  });
});
