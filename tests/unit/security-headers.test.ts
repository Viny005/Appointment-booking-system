import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
afterEach(() => vi.unstubAllEnvs());
describe("production transport configuration", () => {
  it("sets HSTS only for explicitly approved production HTTPS without subdomain/preload expansion", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("HSTS_ENABLED", "true"); vi.stubEnv("BETTER_AUTH_URL", "https://app.example.test");
    const response = proxy(new NextRequest("https://app.example.test/manage", { headers: { "x-nonce": "attacker" } }));
    expect(response.headers.get("strict-transport-security")).toBe("max-age=31536000");
    expect(response.headers.get("content-security-policy")).not.toContain("attacker");
    expect(response.headers.get("content-security-policy")).not.toContain("unsafe-eval");
  });
  it("fails closed for HSTS on an HTTP configuration", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("HSTS_ENABLED", "true"); vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    expect(() => proxy(new NextRequest("http://localhost:3000"))).toThrow();
  });
  it("does not publish HSTS before domain approval", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("HSTS_ENABLED", "false");
    expect(proxy(new NextRequest("http://localhost:3000")).headers.has("strict-transport-security")).toBe(false);
  });
});
