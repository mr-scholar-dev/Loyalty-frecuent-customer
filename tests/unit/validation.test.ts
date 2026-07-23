import { describe, expect, it } from "vitest";
import {
  enrollmentSchema,
  recoverySchema,
} from "@/lib/validation/registration";

const validEnrollment = {
  fullName: "María Rodríguez",
  phone: "8888-7777",
  licensePlate: "ABC-123",
  email: "",
  marketingConsent: false,
  privacyConsent: true,
};

describe("enrollmentSchema", () => {
  it("accepts a valid enrollment", () => {
    const parsed = enrollmentSchema.parse(validEnrollment);
    expect(parsed.fullName).toBe("María Rodríguez");
    expect(parsed.privacyConsent).toBe(true);
  });

  it("requires privacy consent to be true", () => {
    const result = enrollmentSchema.safeParse({
      ...validEnrollment,
      privacyConsent: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid phone", () => {
    const result = enrollmentSchema.safeParse({
      ...validEnrollment,
      phone: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid plate", () => {
    const result = enrollmentSchema.safeParse({
      ...validEnrollment,
      licensePlate: "!",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an optional valid email", () => {
    const result = enrollmentSchema.safeParse({
      ...validEnrollment,
      email: "maria@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed email", () => {
    const result = enrollmentSchema.safeParse({
      ...validEnrollment,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("recoverySchema", () => {
  it("accepts phone + plate", () => {
    const result = recoverySchema.safeParse({
      phone: "8888-7777",
      licensePlate: "ABC123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing plate", () => {
    const result = recoverySchema.safeParse({ phone: "8888-7777" });
    expect(result.success).toBe(false);
  });
});
