import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { consumeRateLimit } from "@/modules/security/infrastructure/rate-limit";
import { writeAudit, recordDenied } from "@/modules/audit/infrastructure/audit";
import { addCalendarMonths } from "@/modules/privacy/domain/retention";
const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString || !new URL(connectionString).pathname.endsWith("_test")) throw new Error("Separate TEST_DATABASE_URL required");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 10 }) });
afterAll(() => db.$disconnect());
describe("database security primitives", () => {
  it.each([
    { actorKind: "INTERNAL", actorId: null }, { resource: "ARBITRARY" }, { recipientCount: -1 },
    { changedFields: ["customer@example.test"] }, { result: "DENIED", reason: null }, { version: -1 },
  ])("enforces audit constraints for direct writes %j", async patch => {
    await expect(db.auditLog.create({ data: { id: randomUUID(), timestamp: new Date(), actorKind: "SYSTEM", action: "RETENTION_APPLIED", resource: "APPOINTMENT", result: "SUCCESS", changedFields: [], ...patch } })).rejects.toThrow();
  });
  it("rejects invalid rate keys, counts and expiry through direct writes", async () => {
    for (const patch of [{ key: "raw-secret" }, { count: 0 }, { expiresAt: new Date(0) }]) {
      await expect(db.rateLimitBucket.create({ data: { key: "e".repeat(64), windowStart: new Date(0), expiresAt: new Date(1000), count: 1, ...patch } })).rejects.toThrow();
    }
  });
  it("admits exactly the limit under concurrent requests and resets next window", async () => {
    const identity = randomUUID(), policy = { scope: "test-security", limit: 5, windowMilliseconds: 60000 };
    const results = await Promise.all(Array.from({ length: 20 }, () => consumeRateLimit(db, policy, identity, 60000)));
    expect(results.filter(r => r.allowed)).toHaveLength(5);
    expect((await consumeRateLimit(db, policy, identity, 119999)).allowed).toBe(false);
    expect((await consumeRateLimit(db, policy, identity, 120000)).allowed).toBe(true);
  });
  it("rolls audit entries back with business transaction failure", async () => {
    const resourceId = randomUUID();
    await expect(db.$transaction(async tx => { await writeAudit(tx, { actorKind: "SYSTEM", action: "RETENTION_APPLIED", resource: "APPOINTMENT", resourceId, now: 0 }); throw new Error("rollback"); })).rejects.toThrow("rollback");
    expect(await db.auditLog.count({ where: { resourceId } })).toBe(0);
  });
  it("aggregates denials without accepting an arbitrary actor or raw resource", async () => {
    const now = Date.parse("2020-02-02"), marker = "secret@example.test";
    await recordDenied(db, marker, marker, "ORIGIN", now);
    await recordDenied(db, marker, marker, "ORIGIN", now);
    const row = await db.auditLog.findFirstOrThrow({ where: { timestamp: new Date(now), reason: "ORIGIN" } });
    expect(row.actorId).toBeNull(); expect(row.resourceId).toBeNull(); expect(JSON.stringify(row)).not.toContain(marker); expect(row.occurrences).toBeGreaterThanOrEqual(2);
  });
  it("rejects personal values in the audit field allowlist", async () => {
    await expect(db.$transaction(tx => writeAudit(tx, { actorKind: "SYSTEM", action: "RETENTION_APPLIED", resource: "APPOINTMENT", now: 0, changedFields: ["private@example.test"] }))).rejects.toThrow();
  });
  it.each(["2024-02-29T11:00:00Z", "2026-04-25T00:30:00Z", "2025-09-29T00:30:00Z"])("agrees with PostgreSQL calendar arithmetic for %s", async value => {
    const input = new Date(value);
    const [row] = await db.$queryRaw<{ deadline: Date }[]>`SELECT ((${input}::timestamptz AT TIME ZONE 'Europe/Berlin') + interval '6 months') AT TIME ZONE 'Europe/Berlin' AS deadline`;
    expect(row.deadline).toEqual(addCalendarMonths(input, 6));
  });
});
