import { describe, expect, it, vi } from "vitest";
import type { RatePolicy } from "@/modules/security/infrastructure/rate-limit";
import { secureHttp } from "@/modules/security/infrastructure/http";
import { securityConfiguration } from "@/modules/security/infrastructure/config";
import { retentionConfiguration } from "@/modules/privacy/infrastructure/config";
const env = { BETTER_AUTH_URL: "https://app.example.test", BETTER_AUTH_SECRET: "s".repeat(32) };
function setup() {
  const consume = vi.fn(async (policy: RatePolicy, identity: string) => { void policy; void identity; return { allowed: true, retryAfterSeconds: 17 }; }), denied = vi.fn(async () => {});
  const next = vi.fn(async (request: Request) => Response.json({ forwarded: await request.json() }));
  return { consume, denied, next };
}
function request(body = "{}", headers: Record<string, string> = {}) { return new Request(`${env.BETTER_AUTH_URL}/api`, { method: "POST", headers: { origin: env.BETTER_AUTH_URL, "content-type": "application/json", ...headers }, body }); }
describe("HTTP security boundary", () => {
  it("forwards allowed JSON and enforces private response headers", async () => {
    const d = setup(), response = await secureHttp(request('{"action":"read"}'), "customer", d.next, d, env);
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ forwarded: { action: "read" } });
    expect(response.headers.get("cache-control")).toContain("no-store"); expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });
  it.each(["", "https://evil.example", "null", "not a URL"])("rejects origin %s", async origin => {
    const d = setup(); expect((await secureHttp(request("{}", { origin }), "customer", d.next, d, env)).status).toBe(403); expect(d.next).not.toHaveBeenCalled(); expect(d.denied).toHaveBeenCalledWith("ORIGIN");
  });
  it("rejects missing origin and cross-site fetch metadata", async () => {
    const d = setup(), missing = request(); missing.headers.delete("origin");
    expect((await secureHttp(missing, "auth", d.next, d, env)).status).toBe(403);
    expect((await secureHttp(request("{}", { "sec-fetch-site": "cross-site" }), "auth", d.next, d, env)).status).toBe(403);
  });
  it.each(["customer", "draft", "auth"] as const)("bounds %s body by actual bytes without trusting content-length", async scope => {
    const d = setup(), size = scope === "draft" ? 32769 : 8193;
    expect((await secureHttp(request("x".repeat(size), { "content-length": "1" }), scope, d.next, d, env)).status).toBe(413); expect(d.next).not.toHaveBeenCalled();
  });
  it.each(["{", "null", "[]", "1"])("rejects malformed/non-object JSON %s", async body => {
    const d = setup(); expect((await secureHttp(request(body), "customer", d.next, d, env)).status).toBe(400);
  });
  it("rejects non-JSON media", async () => { const d = setup(); expect((await secureHttp(request("{}", { "content-type": "text/plain" }), "customer", d.next, d, env)).status).toBe(415); });
  it("enforces global limit with Retry-After and no echoed input", async () => {
    const d = setup(); d.consume.mockResolvedValue({ allowed: false, retryAfterSeconds: 17 });
    const r = await secureHttp(request('{"token":"private"}'), "customer", d.next, d, env);
    expect(r.status).toBe(429); expect(r.headers.get("retry-after")).toBe("17"); expect(await r.text()).not.toContain("private"); expect(d.next).not.toHaveBeenCalled();
  });
  it("uses configured identity limits and HMAC for email identity", async () => {
    const d = setup(); d.consume.mockResolvedValueOnce({ allowed: true, retryAfterSeconds: 17 }).mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 17 });
    const r = await secureHttp(request('{"email":"Private@Example.test"}'), "auth", d.next, d, { ...env, RATE_AUTH_ACCOUNT_PER_MINUTE: "7" });
    expect(r.status).toBe(429); expect(d.consume.mock.calls[1][0]).toMatchObject({ limit: 7, windowMilliseconds: 60000 }); expect(JSON.stringify(d.consume.mock.calls)).not.toContain("Private");
  });
  it("ignores spoofed forwarded IP without explicit trusted deployment", async () => {
    const d = setup(); await secureHttp(request("{}", { "x-forwarded-for": "1.2.3.4", "x-real-ip": "1.2.3.4" }), "auth", d.next, d, env); expect(d.consume).toHaveBeenCalledTimes(1);
  });
  it("requires a single trusted IP and applies its configured limit", async () => {
    const d = setup(), configured = { ...env, TRUSTED_CLIENT_IP_HEADER: "x-client-ip", TRUSTED_PROXY_ONLY: "true" };
    expect((await secureHttp(request(), "auth", d.next, d, configured)).status).toBe(503);
    expect((await secureHttp(request("{}", { "x-client-ip": "1.2.3.4, 5.6.7.8" }), "auth", d.next, d, configured)).status).toBe(503);
    expect((await secureHttp(request("{}", { "x-client-ip": "2001:db8::1" }), "auth", d.next, d, configured)).status).toBe(200);
    expect(d.consume.mock.calls.at(-1)?.[0]).toMatchObject({ scope: "auth-ip", limit: 30 });
    expect(JSON.stringify(d.consume.mock.calls)).not.toContain("2001:db8");
  });
  it("fails closed on DB failure without exposing details", async () => {
    const d = setup(); d.consume.mockRejectedValue(new Error("private-password")); const r = await secureHttp(request(), "auth", d.next, d, env);
    expect(r.status).toBe(503); expect(await r.text()).toBe('{"error":"UNAVAILABLE"}'); expect(d.next).not.toHaveBeenCalled();
  });
  it("returns generic handler failures and records invalid capabilities", async () => {
    const d = setup(); d.next.mockRejectedValueOnce(new Error("private-password"));
    expect(await (await secureHttp(request(), "customer", d.next, d, env)).text()).toBe('{"error":"UNAVAILABLE"}');
    d.next.mockResolvedValueOnce(new Response(null, { status: 404 })); await secureHttp(request(), "customer", d.next, d, env); expect(d.denied).toHaveBeenCalledWith("INVALID_CAPABILITY");
  });
});
describe("validated operator configuration", () => {
  it("matches architecture defaults", () => { expect(securityConfiguration({})).toMatchObject({ authIdentity: 5, authIp: 30 }); expect(retentionConfiguration({})).toEqual({ endedMonths: 12, cancelledMonths: 6, auditMonths: 12, denialDays: 30 }); });
  it.each(["0", "-1", "1.5", "NaN", "99999999", ""])("rejects invalid settings %s", value => {
    expect(() => securityConfiguration({ RATE_AUTH_ACCOUNT_PER_MINUTE: value })).toThrow(); expect(() => retentionConfiguration({ RETENTION_ENDED_MONTHS: value })).toThrow();
  });
  it("requires explicit proxy isolation attestation", () => expect(() => securityConfiguration({ TRUSTED_CLIENT_IP_HEADER: "x-client-ip" })).toThrow());
});
