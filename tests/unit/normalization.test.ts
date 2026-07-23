import { describe, expect, it } from "vitest";
import { normalizePhone, isValidPhone } from "@/lib/normalization/phone";
import { normalizePlate, isValidPlate } from "@/lib/normalization/plate";

describe("normalizePhone (CR)", () => {
  it("normalizes a local 8-digit number with dashes", () => {
    const r = normalizePhone("8888-7777");
    expect(r.normalized).toBe("+50688887777");
    expect(r.valid).toBe(true);
    expect(r.raw).toBe("8888-7777");
  });

  it("handles a number with spaces and explicit +506", () => {
    expect(normalizePhone("+506 8888 7777").normalized).toBe("+50688887777");
  });

  it("handles a number prefixed with country code, no plus", () => {
    expect(normalizePhone("50688887777").normalized).toBe("+50688887777");
  });

  it("rejects too-short numbers", () => {
    const r = normalizePhone("1234");
    expect(r.valid).toBe(false);
    expect(r.normalized).toBeNull();
  });

  it("rejects a wrong explicit country code", () => {
    expect(normalizePhone("+1 202 555 0100").valid).toBe(false);
  });

  it("isValidPhone reflects validity", () => {
    expect(isValidPhone("8888-7777")).toBe(true);
    expect(isValidPhone("abc")).toBe(false);
  });
});

describe("normalizePlate", () => {
  it("uppercases and strips separators", () => {
    expect(normalizePlate("ABC-123").normalized).toBe("ABC123");
    expect(normalizePlate("abc 123").normalized).toBe("ABC123");
  });

  it("keeps only alphanumerics", () => {
    expect(normalizePlate("c.l-123!").normalized).toBe("CL123");
  });

  it("flags empty input as invalid", () => {
    const r = normalizePlate("   ");
    expect(r.normalized).toBeNull();
    expect(r.valid).toBe(false);
  });

  it("isValidPlate reflects validity", () => {
    expect(isValidPlate("ABC123")).toBe(true);
    expect(isValidPlate("")).toBe(false);
  });
});
