import { describe, expect, it } from "vitest";
import { hashSyncToken, isSyncTokenUsable } from "./auth";

const activeToken = {
  id: "token-id",
  officer_name: null,
  scopes: ["skada:write"],
  expires_at: null,
  revoked_at: null,
  last_used_at: null,
};

describe("sync token authentication", () => {
  it("hashes tokens with SHA-256", () => {
    expect(hashSyncToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("accepts an active token with the required scope", () => {
    expect(isSyncTokenUsable(activeToken, "skada:write", null)).toBe(true);
  });

  it("accepts the wildcard scope", () => {
    expect(isSyncTokenUsable({ ...activeToken, scopes: ["*"] }, "rules:read", null)).toBe(true);
  });

  it("rejects a token without the required scope", () => {
    expect(isSyncTokenUsable(activeToken, "epgp:write", null)).toBe(false);
  });

  it("rejects revoked and expired tokens", () => {
    const now = new Date("2026-09-29T12:00:00Z");
    expect(
      isSyncTokenUsable(
        { ...activeToken, revoked_at: "2026-09-29T11:00:00Z" },
        "skada:write",
        null,
        now,
      ),
    ).toBe(false);
    expect(
      isSyncTokenUsable(
        { ...activeToken, expires_at: "2026-09-29T11:59:59Z" },
        "skada:write",
        null,
        now,
      ),
    ).toBe(false);
  });

  it("requires the bound officer name without case sensitivity", () => {
    const boundToken = { ...activeToken, officer_name: "Christian" };
    expect(isSyncTokenUsable(boundToken, "skada:write", "christian")).toBe(true);
    expect(isSyncTokenUsable(boundToken, "skada:write", "OtroOficial")).toBe(false);
    expect(isSyncTokenUsable(boundToken, "skada:write", null)).toBe(false);
  });
});
