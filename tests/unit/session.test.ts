import { describe, expect, it, vi } from "vitest";
import { ABSOLUTE_TIMEOUT_MS, IDLE_TIMEOUT_MS, isSessionUsable } from "@/modules/identity/domain/session-policy";
import { checkSession, type SessionStore } from "@/modules/identity/application/check-session";

const now = new Date("2026-09-29T12:00:00Z");
const state = { createdAt: now, lastActivityAt: now, expiresAt: new Date(now.getTime() + ABSOLUTE_TIMEOUT_MS), active: true };
describe("session boundaries", () => {
  it("accepts the last millisecond before idle expiry", () => expect(isSessionUsable(state, new Date(now.getTime() + IDLE_TIMEOUT_MS - 1))).toBe(true));
  it("rejects exactly 30 idle minutes", () => expect(isSessionUsable(state, new Date(now.getTime() + IDLE_TIMEOUT_MS))).toBe(false));
  it("rejects exactly eight hours despite recent activity", () => {
    const time = new Date(now.getTime() + ABSOLUTE_TIMEOUT_MS);
    expect(isSessionUsable({ ...state, lastActivityAt: time, expiresAt: new Date(time.getTime() + 1000) }, time)).toBe(false);
  });
  it("rejects inactive users", () => expect(isSessionUsable({ ...state, active: false }, now)).toBe(false));
  it("rejects expired library sessions", () => expect(isSessionUsable({ ...state, expiresAt: now }, now)).toBe(false));
  it("polling never touches activity; explicit actions do", async () => {
    const store: SessionStore = { read: async () => ({ ...state, identity: { id: "internal-user", role: "ADMIN" } }), touchIfValid: vi.fn(async () => true) };
    expect(await checkSession(store, "session", now)).toEqual({ id: "internal-user", role: "ADMIN" });
    expect(store.touchIfValid).not.toHaveBeenCalled();
    await checkSession(store, "session", now, true);
    expect(store.touchIfValid).toHaveBeenCalledOnce();
  });
  it("fails closed when a session expires or is revoked during a touch", async () => {
    const store: SessionStore = { read: async () => ({ ...state, identity: { id: "internal-user", role: "ADVISOR" } }), touchIfValid: async () => false };
    expect(await checkSession(store, "session", now, true)).toBeNull();
  });
  it("rejects missing sessions", async () => expect(await checkSession({ read: async () => null, touchIfValid: vi.fn() }, "missing", now)).toBeNull());
});
