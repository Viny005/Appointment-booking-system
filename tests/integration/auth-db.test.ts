import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "@/generated/prisma/client";
import { createAuth } from "@/modules/identity/infrastructure/auth";
import { prismaSessionStore } from "@/modules/identity/infrastructure/session-store";
import { checkSession } from "@/modules/identity/application/check-session";
import { aesSecretBox, secretContext } from "@/modules/notifications/infrastructure/secret-box";
import { prismaNotifications } from "@/modules/notifications/infrastructure/prisma-notifications";
import { preparePasswordResetMutation } from "@/modules/identity/infrastructure/password-reset";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString || !new URL(connectionString).pathname.endsWith("_test")) throw new Error("Provide a separately migrated TEST_DATABASE_URL ending in _test");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const outboxKey = randomBytes(32).toString("base64");
const auth = createAuth(db, { NODE_ENV: "test", BETTER_AUTH_URL: "http://localhost:3000", BETTER_AUTH_SECRET: randomBytes(32).toString("hex"), OUTBOX_ENCRYPTION_KEY: outboxKey });
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
afterAll(async () => { await db.notification.deleteMany({ where: { recipientEmail: email } }); await db.user.deleteMany({ where: { id } }); await db.$disconnect(); });
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

it("queues a private single-use reset and revokes prior sessions after password change", async () => {
  await db.user.update({ where: { id }, data: { active: true } });
  const login = await post("sign-in/email", { email, password });
  expect(login.ok).toBe(true);
  expect(await db.session.count({ where: { userId: id } })).toBeGreaterThan(0);
  const request = await post("request-password-reset", { email, redirectTo: "http://localhost:3000/reset-password" });
  expect(request.ok).toBe(true);
  const notification = await db.notification.findFirstOrThrow({ where: { recipientEmail: email, type: "PASSWORD_RESET", status: "PENDING" }, orderBy: { createdAt: "desc" } });
  expect(notification.secretCipher).toBeTruthy();
  const box = aesSecretBox(outboxKey), leaseToken = randomUUID(), prepareAt = new Date();
  await db.notification.update({ where: { id: notification.id }, data: { leaseToken, leaseUntil: new Date(prepareAt.getTime() + 60000), attempts: 1 } });
  const prepared = await prismaNotifications(db, box).prepare({ id: notification.id, leaseToken, attempts: 1 }, prepareAt);
  expect(prepared?.recipient).toEqual({ email, category: "USER", advisorProfileId: null });
  expect(prepared?.secret).toContain("/reset-password/");
  await db.notification.update({ where: { id: notification.id }, data: { leaseToken: null, leaseUntil: null, attempts: 0 } });
  const url = box.open(notification.secretCipher!, secretContext(notification.id, `user:${id}`, email));
  const token = new URL(url).pathname.split("/").at(-1)!;
  const newPassword = randomBytes(24).toString("base64url");
  const resetRequest = new Request("http://localhost:3000/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" }, body: JSON.stringify({ token, newPassword }) });
  await preparePasswordResetMutation(db, resetRequest.clone());
  const reset = await auth.handler(resetRequest);
  expect(reset.ok).toBe(true);
  const state = await db.user.findUniqueOrThrow({ where: { id }, select: { securityGeneration: true, passwordMutationPending: true } });
  expect(state.securityGeneration).toBeGreaterThan(0);
  expect(state.passwordMutationPending).toBe(false);
  expect(await db.session.count({ where: { userId: id } })).toBe(0);
  expect((await post("reset-password", { token, newPassword: randomBytes(24).toString("base64url") })).ok).toBe(false);
  expect((await post("sign-in/email", { email, password })).ok).toBe(false);
  expect((await post("sign-in/email", { email, password: newPassword })).ok).toBe(true);
  expect((await db.notification.findUniqueOrThrow({ where: { id: notification.id } })).status).toBe("SUPERSEDED");
});
