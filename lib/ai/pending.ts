import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed hand-off for AI actions that need a human "yes" before they run
 * (deletes, archiving, reversals).
 *
 * The agent decides WHAT to do; the ticket carries that decision out to the
 * browser and back. It is signed with the server secret and bound to the
 * issuing user and organization, so a client cannot edit the target id, swap
 * the tool, or replay another org's ticket. Tickets also expire — an approval
 * the user left sitting overnight should not still fire.
 */

const TTL_MS = 10 * 60 * 1000;

export interface PendingAction {
  tool: string;
  args: Record<string, unknown>;
  /** Human-readable description of exactly what will happen. */
  summary: string;
}

interface TicketBody extends PendingAction {
  userId: string;
  orgId: string;
  exp: number;
}

function secret(): string {
  const value = process.env.TOKEN_HASH_SECRET;
  if (!value) throw new Error("TOKEN_HASH_SECRET is not set.");
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueTicket(
  action: PendingAction,
  userId: string,
  orgId: string,
): string {
  const body: TicketBody = {
    ...action,
    userId,
    orgId,
    exp: Date.now() + TTL_MS,
  };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/**
 * Verify a ticket against the caller. Returns null on any mismatch — bad
 * signature, wrong user/org, expired, or malformed.
 */
export function verifyTicket(
  ticket: string,
  userId: string,
  orgId: string,
): PendingAction | null {
  const dot = ticket.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = ticket.slice(0, dot);
  const provided = Buffer.from(ticket.slice(dot + 1));
  const expected = Buffer.from(sign(payload));
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return null;
  }

  let body: TicketBody;
  try {
    body = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as TicketBody;
  } catch {
    return null;
  }
  if (body.userId !== userId || body.orgId !== orgId) return null;
  if (typeof body.exp !== "number" || Date.now() > body.exp) return null;

  return { tool: body.tool, args: body.args, summary: body.summary };
}
