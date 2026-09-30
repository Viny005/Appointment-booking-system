import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { AvailabilityManagement, PublicAvailability, type AvailabilityResult } from "@/modules/availability/application/availability";
import { prismaAvailability } from "@/modules/availability/infrastructure/prisma-availability";
import { instant, timeRange } from "@/modules/availability/domain/values";
import { profileDetails, serviceDetails } from "../fixtures/catalog";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString || !new URL(connectionString).pathname.endsWith("_test")) throw new Error("Use migrated TEST_DATABASE_URL ending in _test");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 8 }) });
const repository = prismaAvailability(db), api = new AvailabilityManagement(repository, randomUUID);
const admin = randomUUID(), secondAdmin = randomUUID(), advisor = randomUUID(), ids: string[] = [];
const r = timeRange;
function value<T>(result: AvailabilityResult<T>): T { if (!result.ok) throw new Error(JSON.stringify(result.error)); return result.value; }
async function profile(userId?: string) {
  const id = randomUUID(); ids.push(id);
  await db.advisorProfile.create({ data: { id, ...profileDetails, userId, status: "ACTIVE", services: { create: { id: randomUUID(), ...serviceDetails, active: true } } } });
  return id;
}
beforeAll(async () => { await db.user.createMany({ data: [admin, secondAdmin, advisor].map(id => ({ id, name: "Synthetic availability tester", email: `${id}@example.test`, role: id === advisor ? "ADVISOR" : "ADMIN" })) }); });
afterAll(async () => {
  await db.$transaction(async tx => {
    await tx.availabilityExceptionInterval.deleteMany({ where: { exception: { advisorProfileId: { in: ids } } } });
    await tx.availabilityException.deleteMany({ where: { advisorProfileId: { in: ids } } });
    await tx.weeklyAvailability.deleteMany({ where: { advisorProfileId: { in: ids } } });
    await tx.profileRelation.deleteMany({ where: { sourceProfileId: { in: ids } } });
    await tx.service.deleteMany({ where: { advisorProfileId: { in: ids } } });
    await tx.advisorProfile.deleteMany({ where: { id: { in: ids } } });
    await tx.user.deleteMany({ where: { id: { in: [admin, secondAdmin, advisor] } } });
  }); await db.$disconnect();
});
describe("UC-12 transactional availability administration", () => {
  it("stores separated weekly ranges and allows clearing a day", async () => {
    const p = await profile();
    expect(value(await api.setWeeklyDay(admin, p, 0, 1, [r("08:00", "12:00"), r("14:00", "18:00")]))).toMatchObject({ status: "SAVED", version: 1 });
    expect(value(await api.getWeeklyAvailability(admin, p)).weekly).toHaveLength(2);
    value(await api.setWeeklyDay(admin, p, 1, 1, [])); expect(value(await api.getWeeklyAvailability(admin, p))).toEqual({ version: 2, weekly: [] });
  });
  it("never persists a merge proposal without exact explicit confirmation", async () => {
    const p = await profile(), ranges = [r("08:00", "10:00"), r("09:00", "12:00")];
    const proposed = value(await api.setWeeklyDay(admin, p, 0, 1, ranges));
    expect(proposed.status).toBe("MERGE_REQUIRED"); expect(value(await api.getWeeklyAvailability(admin, p))).toEqual({ version: 0, weekly: [] });
    if (proposed.status !== "MERGE_REQUIRED") throw new Error("Proposal expected");
    expect(value(await api.setWeeklyDay(admin, p, 0, 1, ranges, "true")).status).toBe("MERGE_REQUIRED");
    value(await api.setWeeklyDay(admin, p, 0, 1, ranges, proposed.proposal.token));
    expect(value(await api.getWeeklyAvailability(admin, p)).weekly).toEqual([{ weekday: 1, ...r("08:00", "12:00") }]);
  });
  it("protects concurrent writes and leaves loser data unchanged", async () => {
    const p = await profile();
    const results = await Promise.all([api.setWeeklyDay(admin, p, 0, 1, [r("08:00", "10:00")]), api.setWeeklyDay(secondAdmin, p, 0, 1, [r("14:00", "16:00")])]);
    expect(results.filter(x => x.ok)).toHaveLength(1); expect(results.find(x => !x.ok)).toMatchObject({ error: { code: "CONFLICT" } });
    const before = value(await api.getWeeklyAvailability(admin, p));
    expect(await api.setWeeklyDay(admin, p, 0, 1, [])).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    expect(value(await api.getWeeklyAvailability(admin, p))).toEqual(before);
  });
  it("rejects confirmation after another mutation", async () => {
    const p = await profile(), ranges = [r("08:00", "10:00"), r("10:00", "12:00")];
    const proposed = value(await api.setWeeklyDay(admin, p, 0, 1, ranges)); if (proposed.status !== "MERGE_REQUIRED") throw new Error("Proposal expected");
    value(await api.blockDateRange(secondAdmin, p, 0, "2026-12-20", "2026-12-31"));
    expect(await api.setWeeklyDay(admin, p, 0, 1, ranges, proposed.proposal.token)).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
  });
  it("authorizes ADMIN/all and ADVISOR/own, never relation-based rights", async () => {
    const own = await profile(advisor), other = await profile();
    await db.profileRelation.create({ data: { id: randomUUID(), sourceProfileId: own, targetProfileId: other } });
    value(await api.setWeeklyDay(advisor, own, 0, 1, [r("08:00", "10:00")]));
    expect(await api.setWeeklyDay(advisor, other, 0, 1, [])).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(await api.getExceptions(advisor, other)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    await db.user.update({ where: { id: advisor }, data: { active: false } });
    expect(await api.getWeeklyAvailability(advisor, own)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    await db.user.update({ where: { id: advisor }, data: { active: true } });
  });
  it("creates, updates and deactivates inclusive date blocks", async () => {
    const p = await profile(); value(await api.setWeeklyDay(admin, p, 0, 7, [r("08:00", "12:00")]));
    const saved = value(await api.blockDateRange(admin, p, 1, "2026-12-20", "2026-12-31")); if (saved.status !== "SAVED" || !saved.id) throw new Error("Saved expected");
    expect(value(await api.getEffectiveDay(admin, p, "2026-12-20"))).toEqual([]);
    value(await api.saveException(admin, p, 2, { type: "BLOCK_DAY", startDate: "2026-12-21", endDate: "2026-12-31", active: true, ranges: [] }, saved.id));
    expect(value(await api.getEffectiveDay(admin, p, "2026-12-20"))).toEqual([r("08:00", "12:00")]);
    value(await api.deactivateException(admin, p, 3, saved.id)); expect(value(await api.getExceptions(admin, p)).exceptions[0].active).toBe(false);
  });
  it("explicitly converts overlapping additions into a single replacement", async () => {
    const p = await profile(); value(await api.setWeeklyDay(admin, p, 0, 1, [r("08:00", "10:00")]));
    const input = { type: "ADD_INTERVAL" as const, startDate: "2026-10-05", endDate: "2026-10-05", active: true, ranges: [r("09:00", "12:00")] };
    const proposed = value(await api.saveException(admin, p, 1, input)); if (proposed.status !== "MERGE_REQUIRED") throw new Error("Proposal expected");
    expect(proposed.proposal.kind).toBe("REPLACE_DAY"); expect(value(await api.getExceptions(admin, p)).exceptions).toEqual([]);
    value(await api.saveException(admin, p, 1, input, undefined, proposed.proposal.token));
    expect(value(await api.getEffectiveDay(admin, p, "2026-10-05"))).toEqual([r("08:00", "12:00")]);
    expect(value(await api.getExceptions(admin, p)).exceptions[0].type).toBe("REPLACE_DAY");
  });
  it("rejects second replacement and preserves previous data", async () => {
    const p = await profile(), input = { type: "REPLACE_DAY" as const, startDate: "2026-10-05", endDate: "2026-10-05", active: true, ranges: [r("14:00", "16:00")] };
    value(await api.saveException(admin, p, 0, input)); const before = value(await api.getExceptions(admin, p));
    expect(await api.saveException(admin, p, 1, input)).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    expect(value(await api.getExceptions(admin, p))).toEqual(before);
  });
  it("merges an addition into the existing replacement and retires prior additions", async () => {
    const p = await profile();
    const input = { type: "REPLACE_DAY" as const, startDate: "2026-10-05", endDate: "2026-10-05", active: true, ranges: [r("08:00", "10:00")] };
    const replacement = value(await api.saveException(admin, p, 0, input));
    value(await api.saveException(admin, p, 1, { ...input, type: "ADD_INTERVAL", ranges: [r("11:00", "13:00")] }));
    const addition = { ...input, type: "ADD_INTERVAL" as const, ranges: [r("09:30", "11:30")] };
    const proposed = value(await api.saveException(admin, p, 2, addition)); if (proposed.status !== "MERGE_REQUIRED") throw new Error("Proposal expected");
    expect(proposed.proposal.deactivateIds).toHaveLength(1);
    const saved = value(await api.saveException(admin, p, 2, addition, undefined, proposed.proposal.token));
    expect(saved.status === "SAVED" && replacement.status === "SAVED" && saved.id === replacement.id).toBe(true);
    expect(value(await api.getEffectiveDay(admin, p, "2026-10-05"))).toEqual([r("08:00", "13:00")]);
    expect(value(await api.getExceptions(admin, p)).exceptions.filter(e => e.active)).toHaveLength(1);
  });
  it("serializes concurrent exception writes against the same aggregate version", async () => {
    const p = await profile();
    const results = await Promise.all([api.blockDateRange(admin, p, 0, "2026-10-05", "2026-10-06"), api.blockDateRange(secondAdmin, p, 0, "2026-10-07", "2026-10-08")]);
    expect(results.filter(x => x.ok)).toHaveLength(1); expect(results.find(x => !x.ok)).toMatchObject({ error: { code: "CONFLICT" } });
    expect(value(await api.getExceptions(admin, p)).exceptions).toHaveLength(1);
  });
  it("requires explicit day replacements when a weekly edit overlaps existing additions", async () => {
    const p = await profile();
    value(await api.saveException(admin, p, 0, { type: "ADD_INTERVAL", startDate: "2026-10-05", endDate: "2026-10-05", active: true, ranges: [r("09:00", "12:00")] }));
    const proposed = value(await api.setWeeklyDay(admin, p, 1, 1, [r("08:00", "10:00")]));
    if (proposed.status !== "MERGE_REQUIRED") throw new Error("Proposal expected");
    expect(proposed.proposal.dayReplacements).toMatchObject([{ date: "2026-10-05", ranges: [r("08:00", "12:00")] }]);
    expect(value(await api.getWeeklyAvailability(admin, p)).weekly).toEqual([]);
    value(await api.setWeeklyDay(admin, p, 1, 1, [r("08:00", "10:00")], proposed.proposal.token));
    expect(value(await api.getEffectiveDay(admin, p, "2026-10-05"))).toEqual([r("08:00", "12:00")]);
    expect(value(await api.getEffectiveDay(admin, p, "2026-10-12"))).toEqual([r("08:00", "10:00")]);
  });
  it("public reads use persisted schedules, actual participants and occupancy only", async () => {
    const a = await profile(), b = await profile();
    value(await api.setWeeklyDay(admin, a, 0, 1, [r("08:00", "12:00")])); value(await api.setWeeklyDay(admin, b, 0, 1, [r("10:00", "14:00")]));
    const service = await db.service.findFirstOrThrow({ where: { advisorProfileId: a } });
    const publicApi = new PublicAvailability(repository, { read: async () => [{ start: instant("2026-10-05T08:00:00Z"), end: instant("2026-10-05T09:00:00Z") }] }, () => instant("2026-10-01T00:00:00Z"));
    const selection = { primaryProfileId: a, serviceId: service.id, participantIds: [a, b] };
    expect(value(await publicApi.getBookableSlots(selection, "2026-10-05")).map(s => s.localTime)).toEqual(["11:00", "11:30"]);
    expect(value(await publicApi.getBookableDays(selection, "2026-10-05", "2026-10-06"))).toEqual(["2026-10-05"]);
    await db.advisorProfile.update({ where: { id: b }, data: { status: "INACTIVE" } });
    expect(await publicApi.getBookableSlots(selection, "2026-10-05")).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });
});
describe("availability SQL constraints", () => {
  it.each([{ weekday: 0 }, { weekday: 8 }, { startMinute: -1 }, { startMinute: 600, endMinute: 600 }, { endMinute: 1441 }, { version: -1 }])("rejects invalid weekly row %j", async override => {
    const p = await profile(); await expect(db.weeklyAvailability.create({ data: { id: randomUUID(), advisorProfileId: p, weekday: 1, startMinute: 480, endMinute: 600, ...override } })).rejects.toThrow();
  });
  it("rejects direct overlapping weekly writes but permits adjacency", async () => {
    const p = await profile(); const data = { advisorProfileId: p, weekday: 1, startMinute: 480, endMinute: 600 };
    await db.weeklyAvailability.create({ data: { ...data, id: randomUUID() } });
    await expect(db.weeklyAvailability.create({ data: { ...data, id: randomUUID(), startMinute: 540 } })).rejects.toThrow();
    await expect(db.weeklyAvailability.create({ data: { ...data, id: randomUUID(), startMinute: 600, endMinute: 660 } })).resolves.toBeDefined();
  });
  it("enforces date ranges, unique replacements and exception shapes", async () => {
    const p = await profile(), data = { advisorProfileId: p, startDate: new Date("2026-10-05T00:00:00Z"), endDate: new Date("2026-10-05T00:00:00Z") };
    await expect(db.availabilityException.create({ data: { ...data, id: randomUUID(), type: "BLOCK_DAY", endDate: new Date("2026-10-04T00:00:00Z") } })).rejects.toThrow();
    await expect(db.availabilityException.create({ data: { ...data, id: randomUUID(), type: "REPLACE_DAY", endDate: new Date("2026-10-06T00:00:00Z") } })).rejects.toThrow();
    await expect(db.availabilityException.create({ data: { ...data, id: randomUUID(), type: "ADD_INTERVAL" } })).rejects.toThrow();
    await expect(db.availabilityException.create({ data: { ...data, id: randomUUID(), type: "BLOCK_DAY", intervals: { create: { id: randomUUID(), startMinute: 480, endMinute: 600 } } } })).rejects.toThrow();
    await db.availabilityException.create({ data: { ...data, id: randomUUID(), type: "REPLACE_DAY" } });
    await expect(db.availabilityException.create({ data: { ...data, id: randomUUID(), type: "REPLACE_DAY", active: false } })).rejects.toThrow();
  });
  it("enforces child interval bounds, overlaps and RESTRICT foreign keys", async () => {
    const p = await profile(); const e = await db.availabilityException.create({ data: { id: randomUUID(), advisorProfileId: p, type: "REPLACE_DAY", startDate: new Date("2026-10-05T00:00:00Z"), endDate: new Date("2026-10-05T00:00:00Z") } });
    await expect(db.availabilityExceptionInterval.create({ data: { id: randomUUID(), exceptionId: e.id, startMinute: 1000, endMinute: 100 } })).rejects.toThrow();
    await db.availabilityExceptionInterval.create({ data: { id: randomUUID(), exceptionId: e.id, startMinute: 480, endMinute: 600 } });
    await expect(db.availabilityExceptionInterval.create({ data: { id: randomUUID(), exceptionId: e.id, startMinute: 540, endMinute: 660 } })).rejects.toThrow();
    await expect(db.availabilityException.delete({ where: { id: e.id } })).rejects.toThrow();
  });
  it("does not allow moving the last interval out of an ADD_INTERVAL aggregate", async () => {
    const p = await profile(), childId = randomUUID(), base = { advisorProfileId: p, startDate: new Date("2026-10-05T00:00:00Z"), endDate: new Date("2026-10-05T00:00:00Z") };
    const source = await db.availabilityException.create({ data: { ...base, id: randomUUID(), type: "ADD_INTERVAL", intervals: { create: { id: childId, startMinute: 480, endMinute: 600 } } } });
    const target = await db.availabilityException.create({ data: { ...base, id: randomUUID(), type: "REPLACE_DAY" } });
    await expect(db.availabilityExceptionInterval.update({ where: { id: childId }, data: { exceptionId: target.id } })).rejects.toThrow();
    expect((await db.availabilityExceptionInterval.findUniqueOrThrow({ where: { id: childId } })).exceptionId).toBe(source.id);
  });
  it("validates enum, header updates and deletion of the last addition interval", async () => {
    const p = await profile(), childId = randomUUID();
    const e = await db.availabilityException.create({ data: { id: randomUUID(), advisorProfileId: p, type: "ADD_INTERVAL", startDate: new Date("2026-10-05T00:00:00Z"), endDate: new Date("2026-10-05T00:00:00Z"), intervals: { create: { id: childId, startMinute: 480, endMinute: 600 } } } });
    await expect(db.availabilityExceptionInterval.delete({ where: { id: childId } })).rejects.toThrow();
    await expect(db.availabilityException.update({ where: { id: e.id }, data: { type: "BLOCK_DAY" } })).rejects.toThrow();
    await expect(db.availabilityException.update({ where: { id: e.id }, data: { version: -1 } })).rejects.toThrow();
    await expect(db.$executeRaw`UPDATE "AvailabilityException" SET type = 'UNKNOWN' WHERE id = ${e.id}`).rejects.toThrow();
    expect(await db.availabilityExceptionInterval.count({ where: { exceptionId: e.id } })).toBe(1);
    // Deferred validation permits replacing an ADD aggregate by an empty REPLACE_DAY atomically.
    await db.$transaction(async tx => {
      await tx.availabilityExceptionInterval.delete({ where: { id: childId } });
      await tx.availabilityException.update({ where: { id: e.id }, data: { type: "REPLACE_DAY" } });
    });
    expect(await db.availabilityExceptionInterval.count({ where: { exceptionId: e.id } })).toBe(0);
  });
});
