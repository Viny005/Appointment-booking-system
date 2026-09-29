import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "@/generated/prisma/client";
import { createAuth } from "@/modules/identity/infrastructure/auth";
import { prismaSessionStore } from "@/modules/identity/infrastructure/session-store";
import { checkSession } from "@/modules/identity/application/check-session";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString || !new URL(connectionString).pathname.endsWith("_test")) throw new Error("Provide a separately migrated TEST_DATABASE_URL ending in _test");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const auth = createAuth(db, { NODE_ENV: "test", BETTER_AUTH_URL: "http://localhost:3000", BETTER_AUTH_SECRET: randomBytes(32).toString("hex") });
const id = randomUUID();
const email = `${id}@example.test`;
const password = randomBytes(24).toString("base64url");
const store = prismaSessionStore(db);
const post = (path: string, body: object, cookie?: string) => auth.handler(new Request(`http://localhost:3000/api/auth/${path}`, {
  method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost:3000", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body),
}));
beforeAll(async () => {
  await db.user.create({ data: { id, email, name: "Integration fixture", role: "ADMIN", emailVerified: true,
    accounts: { create: { id: randomUUID(), accountId: id, providerId: "credential", password: await hashPassword(password) } },
  } });
});
afterAll(async () => { await db.user.deleteMany({ where: { id } }); await db.$disconnect(); });
it("runs on PostgreSQL 17 and rejects public account creation", async () => {
  const version = await db.$queryRaw<{ server_version: string }[]>`SHOW server_version`;
  expect(version[0].server_version).toMatch(/^17\./);
  const response = await post("sign-up/email", { name: "Forbidden", email: `forbidden-${email}`, password });
  expect(response.ok).toBe(false);
  expect(await db.user.findUnique({ where: { email: `forbidden-${email}` } })).toBeNull();
});
it("reports a healthy database without internal details", async () => {
  const { GET } = await import("@/app/api/health/route");
  const response = await GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});
it("logs in with a DB session, enforces idle/active status and revokes on logout", async () => {
  const response = await post("sign-in/email", { email, password });
  expect(response.status).toBe(200);
  const cookie = response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  expect(cookie).toContain("session_token");
  const session = await db.session.findFirstOrThrow({ where: { userId: id } });
  expect(await checkSession(store, session.id, new Date())).toEqual({ id, role: "ADMIN" });
  await db.session.update({ where: { id: session.id }, data: { lastActivityAt: new Date(Date.now() - 1800000) } });
  expect(await checkSession(store, session.id, new Date(), true)).toBeNull();
  await db.user.update({ where: { id }, data: { active: false } });
  expect(await checkSession(store, session.id, new Date())).toBeNull();
  expect((await post("sign-in/email", { email, password })).ok).toBe(false);
  await db.user.update({ where: { id }, data: { active: true } });
  expect((await post("sign-out", {}, cookie)).status).toBe(200);
  expect(await db.session.findUnique({ where: { id: session.id } })).toBeNull();
});
