import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

/**
 * Phase 0 smoke test: confirms the unit test toolchain (Vitest + path alias)
 * is wired up. Business-logic tests arrive with their respective phases.
 */
describe("phase 0 toolchain", () => {
  it("resolves the @/ alias and merges class names", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold",
    );
  });
});
