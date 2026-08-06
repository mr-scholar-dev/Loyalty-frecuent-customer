import { describe, expect, it } from "vitest";
import { parseIsoDate, toIsoDate } from "@/lib/loyalty/dates";

/**
 * Due dates reach this helper from two places that can both be wrong: a date
 * input, and an AI agent turning "el viernes" into an argument. Rejecting
 * non-dates here is what keeps a bad value from being written and reported as
 * saved.
 */
describe("parseIsoDate", () => {
  it("parses a real date at local midnight", () => {
    const d = parseIsoDate("2026-08-06");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(7); // zero-based August
    expect(d!.getDate()).toBe(6);
    expect(d!.getHours()).toBe(0);
  });

  it("keeps the calendar day regardless of timezone offset", () => {
    // The bug this guards: `new Date("2026-08-06")` is midnight UTC, which is
    // the 5th anywhere west of Greenwich.
    expect(parseIsoDate("2026-08-06")!.getDate()).toBe(6);
  });

  it("rejects days that do not exist in that month", () => {
    expect(parseIsoDate("2026-02-31")).toBeNull();
    expect(parseIsoDate("2026-04-31")).toBeNull();
    expect(parseIsoDate("2026-13-01")).toBeNull();
    expect(parseIsoDate("2026-00-10")).toBeNull();
  });

  it("accepts a leap day only in a leap year", () => {
    expect(parseIsoDate("2028-02-29")).not.toBeNull();
    expect(parseIsoDate("2026-02-29")).toBeNull();
  });

  it("rejects anything that is not yyyy-mm-dd", () => {
    for (const value of [
      "el viernes",
      "06/08/2026",
      "2026-8-6",
      "2026-08-06T10:00:00Z",
      "",
    ]) {
      expect(parseIsoDate(value)).toBeNull();
    }
  });
});

describe("toIsoDate", () => {
  it("echoes a valid date and nulls everything else", () => {
    expect(toIsoDate("2026-08-06")).toBe("2026-08-06");
    expect(toIsoDate("el viernes")).toBeNull();
    expect(toIsoDate("2026-02-31")).toBeNull();
  });
});
