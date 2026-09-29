import { randomBytes } from "node:crypto";
import { expect, it, vi } from "vitest";
import { authSettings } from "@/modules/identity/infrastructure/auth";

const env = { NODE_ENV: "test", BETTER_AUTH_SECRET: randomBytes(32).toString("hex"), BETTER_AUTH_URL: "http://localhost:3000" } as const;
it("disables signup, rolling refresh and cookie cache", () => {
  const options = authSettings(env);
  expect(options.emailAndPassword.disableSignUp).toBe(true);
  expect(options.session).toEqual({ expiresIn: 28800, disableSessionRefresh: true, cookieCache: { enabled: false } });
  expect(options.user.additionalFields.role.input).toBe(false);
  expect(options.user.additionalFields.active.input).toBe(false);
});
it("rejects example secrets", () => expect(() => authSettings({ ...env, BETTER_AUTH_SECRET: "REPLACE_WITH_RANDOM_SECRET_AT_LEAST_32_CHARACTERS" })).toThrow());
it("requires HTTPS in production", () => expect(() => authSettings({ ...env, NODE_ENV: "production" })).toThrow());
vi.mock("@/shared/web/internal-session", () => ({ getInternalSession: async () => null }));
it("does not expose signup or password mutation routes", async () => {
  const { POST } = await import("@/app/api/auth/[...all]/route");
  for (const path of ["sign-up/email", "change-password", "reset-password", "update-user"]) {
    expect((await POST(new Request(`http://localhost:3000/api/auth/${path}`, { method: "POST" }))).status).toBe(404);
  }
});
it("returns no session for an anonymous request", async () => {
  const { GET } = await import("@/app/api/auth/[...all]/route");
  const response = await GET(new Request("http://localhost:3000/api/auth/get-session"));
  expect(response.status).toBe(401);
  expect(await response.json()).toBeNull();
  expect(response.headers.get("cache-control")).toBe("no-store");
});
