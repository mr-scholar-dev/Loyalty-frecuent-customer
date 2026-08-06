import { beforeAll, describe, expect, it } from "vitest";

/**
 * The approval ticket is the boundary between "the agent decided something"
 * and "it actually happened". These tests pin the properties that make it safe
 * to round-trip through the browser: it cannot be forged, retargeted to another
 * user or organization, edited to point at a different record, or replayed once
 * stale.
 */

process.env.TOKEN_HASH_SECRET ??= "test-secret-for-pending-tickets";

let issueTicket: typeof import("@/lib/ai/pending").issueTicket;
let verifyTicket: typeof import("@/lib/ai/pending").verifyTicket;

beforeAll(async () => {
  ({ issueTicket, verifyTicket } = await import("@/lib/ai/pending"));
});

const ACTION = {
  tool: "delete_kanban_task",
  args: { task: "Revisar bomba" },
  summary: 'Eliminar la tarea "Revisar bomba".',
};
const USER = "user-1";
const ORG = "org-1";

describe("assistant approval tickets", () => {
  it("round-trips an action for the issuing user and organization", () => {
    const ticket = issueTicket(ACTION, USER, ORG);
    expect(verifyTicket(ticket, USER, ORG)).toEqual(ACTION);
  });

  it("rejects a ticket presented by a different user", () => {
    const ticket = issueTicket(ACTION, USER, ORG);
    expect(verifyTicket(ticket, "user-2", ORG)).toBeNull();
  });

  it("rejects a ticket presented against a different organization", () => {
    const ticket = issueTicket(ACTION, USER, ORG);
    expect(verifyTicket(ticket, USER, "org-2")).toBeNull();
  });

  it("rejects a payload edited to target another record", () => {
    const ticket = issueTicket(ACTION, USER, ORG);
    const [payload, signature] = ticket.split(".");
    const body = JSON.parse(
      Buffer.from(payload!, "base64url").toString(),
    ) as Record<string, unknown>;
    body.args = { task: "Otra tarea" };
    const forged =
      Buffer.from(JSON.stringify(body)).toString("base64url") + "." + signature;

    expect(verifyTicket(forged, USER, ORG)).toBeNull();
  });

  it("rejects an expired ticket", () => {
    const ticket = issueTicket(ACTION, USER, ORG);
    const eleven = 11 * 60 * 1000;
    const realNow = Date.now;
    Date.now = () => realNow() + eleven;
    try {
      expect(verifyTicket(ticket, USER, ORG)).toBeNull();
    } finally {
      Date.now = realNow;
    }
  });

  it("rejects malformed input instead of throwing", () => {
    expect(verifyTicket("", USER, ORG)).toBeNull();
    expect(verifyTicket("no-signature", USER, ORG)).toBeNull();
    expect(verifyTicket("bm90LWpzb24.abc", USER, ORG)).toBeNull();
  });
});
