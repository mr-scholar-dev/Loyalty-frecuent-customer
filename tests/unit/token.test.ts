import { describe, expect, it } from "vitest";
import {
  generatePublicToken,
  hashToken,
  issuePublicToken,
  tokenPrefix,
  verifyToken,
  TOKEN_PREFIX_LENGTH,
} from "@/lib/security/token";

const SECRET = "test-secret-please-change";

describe("public token (§9)", () => {
  it("generates unique, high-entropy, url-safe tokens", () => {
    const a = generatePublicToken();
    const b = generatePublicToken();
    expect(a).not.toBe(b);
    // base64url: no +, /, or = padding.
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThanOrEqual(40);
  });

  it("hashing is deterministic for the same secret and differs across secrets", () => {
    const token = generatePublicToken();
    expect(hashToken(token, SECRET)).toBe(hashToken(token, SECRET));
    expect(hashToken(token, SECRET)).not.toBe(hashToken(token, "other-secret"));
  });

  it("verifies a matching token and rejects a wrong one", () => {
    const { token, hash } = issuePublicToken(SECRET);
    expect(verifyToken(token, hash, SECRET)).toBe(true);
    expect(verifyToken("not-the-token", hash, SECRET)).toBe(false);
    expect(verifyToken(token, hash, "wrong-secret")).toBe(false);
  });

  it("exposes a stable prefix for support lookups", () => {
    const token = generatePublicToken();
    expect(tokenPrefix(token)).toBe(token.slice(0, TOKEN_PREFIX_LENGTH));
  });

  it("issuePublicToken returns matching hash + prefix", () => {
    const issued = issuePublicToken(SECRET);
    expect(issued.hash).toBe(hashToken(issued.token, SECRET));
    expect(issued.prefix).toBe(tokenPrefix(issued.token));
  });

  it("throws when no secret is configured", () => {
    const prev = process.env.TOKEN_HASH_SECRET;
    delete process.env.TOKEN_HASH_SECRET;
    try {
      expect(() => hashToken("x")).toThrow();
    } finally {
      if (prev !== undefined) process.env.TOKEN_HASH_SECRET = prev;
    }
  });
});
