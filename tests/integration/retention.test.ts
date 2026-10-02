import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { runMaintenance } from "@/modules/privacy/infrastructure/maintenance";
import { InternalAppointments } from "@/modules/appointments/application/internal-management";
import { prismaInternalAppointments } from "@/modules/appointments/infrastructure/prisma-internal-management";
import { eraseExpiredAppointments } from "@/modules/privacy/infrastructure/retention";
import { retentionDeadline } from "@/modules/privacy/domain/retention";
import { bookingNotificationPlanner } from "@/modules/notifications/infrastructure/planner";
import { prismaNotifications } from "@/modules/notifications/infrastructure/prisma-notifications";
import { aesSecretBox } from "@/modules/notifications/infrastructure/secret-box";
import { generateManagementToken } from "@/modules/appointments/infrastructure/management-token";
import { profileDetails, serviceDetails } from "../fixtures/catalog";
const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString || !new URL(connectionString).pathname.endsWith("_test")) throw new Error("Separate TEST_DATABASE_URL required");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 10 }) });
const ids: string[] = [], profiles: string[] = [], hashes: string[] = [], users: string[] = [];
const box = aesSecretBox(randomBytes(32).toString("base64"));
// Historical fixtures keep the maintenance clock before every other suite's appointments.
async function fixture(status: "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED" = "CONFIRMED") {
  const profileId = randomUUID(), serviceId = randomUUID(), id = randomUUID(), token = generateManagementToken();
  ids.push(id); profiles.push(profileId); hashes.push(token.hash);
  await db.advisorProfile.create({ data: { id: profileId, ...profileDetails, services: { create: { id: serviceId, ...serviceDetails } } } });
  const startAt = new Date("1900-01-06T08:00:00Z"), endAt = new Date("1900-01-06T08:30:00Z");
  await db.$transaction(async tx => {
    await tx.appointment.create({ data: { id, serviceId, startAt, endAt, status, calendarUid: `${id}@example.test`,
      serviceName: "Historical service snapshot", serviceDescription: "Private description", durationMinutes: 30,
      firstName: "Private", lastName: "Customer", email: "customer@example.test", phone: "123", address: "Private address", remarks: "Private remarks",
      meetingMode: "PHONE", phoneDirection: "ADVISOR_CALLS_CLIENT", managementTokenHash: token.hash, managementTokenExpiresAt: endAt,
      cancelledAt: status === "CANCELLED" ? new Date("1900-01-01T12:00:00Z") : null,
      participants: { create: { id: randomUUID(), advisorProfileId: profileId, role: "PRIMARY", profileName: "Historical advisor", profileTitle: "Advisor" } },
      guests: { create: { id: randomUUID(), email: "guest@example.test" } },
      ...(status === "CONFIRMED" ? { reservations: { create: { id: randomUUID(), advisorProfileId: profileId, startAt, endAt } } } : {}),
    } });
    await bookingNotificationPlanner(box)(tx, id, token.raw, Date.parse("1900-01-01T00:00:00Z"));
    await tx.bookingIdempotency.create({ data: { id: randomUUID(), capabilityHash: token.hash, payloadHash: token.hash, commandKey: randomUUID(), appointmentId: id, result: { appointmentId: id }, expiresAt: endAt } });
    await tx.appointmentMutationReceipt.create({ data: { id: randomUUID(), capabilityHash: token.hash, payloadHash: token.hash, commandKey: randomUUID(), result: { status: status === "CANCELLED" ? "CANCELLED" : "CONFIRMED", version: 0 }, createdAt: startAt, expiresAt: endAt } });
  });
  const a = await db.appointment.findUniqueOrThrow({ where: { id } });
  return { a, deadline: retentionDeadline(a)!.getTime() };
}
afterEach(async () => {
  await db.$transaction(async tx => {
    await tx.auditLog.deleteMany({ where: { resourceId: { in: ids } } });
    await tx.notification.deleteMany({ where: { appointmentId: { in: ids } } });
    await tx.bookingIdempotency.deleteMany({ where: { appointmentId: { in: ids } } });
    await tx.appointmentMutationReceipt.deleteMany({ where: { capabilityHash: { in: hashes } } });
    await tx.internalAppointmentReceipt.deleteMany({ where: { appointmentId: { in: ids } } });
    await tx.appointmentReservation.deleteMany({ where: { appointmentId: { in: ids } } });
    await tx.appointmentGuest.deleteMany({ where: { appointmentId: { in: ids } } });
    await tx.appointmentParticipant.deleteMany({ where: { appointmentId: { in: ids } } });
    await tx.appointment.deleteMany({ where: { id: { in: ids } } });
    await tx.service.deleteMany({ where: { advisorProfileId: { in: profiles } } });
    await tx.advisorProfile.deleteMany({ where: { id: { in: profiles } } });
    await tx.user.deleteMany({ where: { id: { in: users } } });
  });
  ids.length = 0; profiles.length = 0; hashes.length = 0; users.length = 0;
});
afterAll(() => db.$disconnect());
describe("transactional appointment retention", () => {
  it("masks expired internal detail/list before delayed cleanup and deletes internal receipts", async () => {
    const { a, deadline } = await fixture(), actor = randomUUID(); users.push(actor);
    await db.user.create({ data: { id: actor, name: "Synthetic admin", email: `${actor}@example.test`, role: "ADMIN" } });
    await db.internalAppointmentReceipt.create({ data: { id: randomUUID(), actorId: actor, appointmentId: a.id, action: "resend", commandKey: randomUUID(), payloadHash: "a".repeat(64), result: { status: "CONFIRMED", version: 0, noOp: false }, createdAt: a.startAt, expiresAt: a.endAt } });
    const api = new InternalAppointments(prismaInternalAppointments(db, box), () => deadline, value => value);
    const detail = await api.detail(actor, a.id);
    expect(detail.email).toBeNull(); expect(detail.phoneDirection).toBeNull(); expect(detail.guests).toEqual([]); expect(detail.retainedPersonalData).toBe(false);
    const list = await api.list(actor, "1900-01-06", "day"); expect(list.items[0].firstName).toBeNull(); expect(list.items[0].serviceName).toBe(a.serviceName);
    expect((await db.appointment.findUniqueOrThrow({ where: { id: a.id } })).email).not.toBeNull();
    await eraseExpiredAppointments(db, deadline); expect(await db.internalAppointmentReceipt.count({ where: { appointmentId: a.id } })).toBe(0);
  });
  it("bounds ancillary maintenance, preserves unexpired data and is repeatable", async () => {
    const now = Date.parse("1890-01-01"), marker = randomUUID(), draftIds = [randomUUID(), randomUUID(), randomUUID()];
    try {
      for (let i = 0; i < draftIds.length; i++) await db.bookingDraft.create({ data: { id: draftIds[i], capabilityHash: randomBytes(32).toString("hex"), payload: { remarks: marker }, expiresAt: new Date(now + (i === 2 ? 1000 : -1000)) } });
      await db.rateLimitBucket.create({ data: { key: "f".repeat(64), count: 1, windowStart: new Date(now - 2000), expiresAt: new Date(now - 1000) } });
      const result = await runMaintenance(db, now, 1); expect(result.expired).toBe(2);
      expect(await db.bookingDraft.count({ where: { id: { in: draftIds } } })).toBe(2);
      await runMaintenance(db, now, 1); expect(await db.bookingDraft.count({ where: { id: { in: draftIds } } })).toBe(1);
      expect((await runMaintenance(db, now, 1)).expired).toBe(0);
    } finally { await db.bookingDraft.deleteMany({ where: { id: { in: draftIds } } }); await db.rateLimitBucket.deleteMany({ where: { key: "f".repeat(64) } }); }
  });
  it("uses a configured appointment retention duration consistently", async () => {
    const { a } = await fixture(), policy = { endedMonths: 2, cancelledMonths: 1, auditMonths: 12, denialDays: 30 };
    const deadline = retentionDeadline(a, policy)!.getTime();
    expect(await eraseExpiredAppointments(db, deadline - 1, 100, policy)).toBe(0);
    expect(await eraseExpiredAppointments(db, deadline, 100, policy)).toBe(1);
  });
  it("bounds audit cleanup by category and removes expired encrypted notification secrets", async () => {
    const { a } = await fixture(), now = Date.parse("1900-01-03T00:00:00Z"), auditIds = [randomUUID(), randomUUID(), randomUUID()];
    try {
      await db.auditLog.createMany({ data: auditIds.map((id, i) => ({ id, timestamp: new Date(i === 0 ? "1898-01-01" : i === 1 ? "1899-11-01" : "1900-01-02"), actorKind: "ANONYMOUS", resource: "SECURITY", action: "ACCESS_DENIED", result: "DENIED", reason: "ORIGIN", changedFields: [] })) });
      const outcome = await runMaintenance(db, now, 100);
      expect(outcome.secrets).toBeGreaterThan(0); expect(outcome.audit).toBeGreaterThanOrEqual(2);
      expect(await db.auditLog.count({ where: { id: { in: auditIds } } })).toBe(1);
      expect(await db.notification.count({ where: { appointmentId: a.id, secretCipher: { not: null } } })).toBe(0);
      expect((await db.appointment.findUniqueOrThrow({ where: { id: a.id } })).piiErasedAt).toBeNull();
    } finally { await db.auditLog.deleteMany({ where: { id: { in: auditIds } } }); }
  });
  it.each(["CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"] as const)("erases %s exactly at its deadline and preserves history", async status => {
    const { a, deadline } = await fixture(status);
    expect(await eraseExpiredAppointments(db, deadline - 1)).toBe(0);
    expect(await eraseExpiredAppointments(db, deadline)).toBe(1);
    const erased = await db.appointment.findUniqueOrThrow({ where: { id: a.id }, include: { participants: true, guests: true, notifications: true, reservations: true } });
    for (const key of ["firstName", "lastName", "email", "phone", "address", "remarks", "placeName", "visitAddress", "phoneDirection", "advisorPhone", "onlineUrl", "onlineProvider", "managementTokenHash", "managementTokenExpiresAt"] as const) expect(erased[key]).toBeNull();
    expect(erased.serviceName).toBe(a.serviceName); expect(erased.serviceDescription).toBe("");
    expect(erased.status).toBe(status); expect(erased.startAt).toEqual(a.startAt); expect(erased.endAt).toEqual(a.endAt);
    expect(erased.calendarUid).toBe(a.calendarUid); expect(erased.calendarSequence).toBe(a.calendarSequence);
    expect(erased.version).toBe(a.version + 1); expect(erased.participants).toHaveLength(1);
    expect(erased.reservations).toHaveLength(status === "CONFIRMED" ? 1 : 0);
    expect(erased.guests).toHaveLength(0); expect(erased.notifications).toHaveLength(0);
    expect(await db.bookingIdempotency.count({ where: { appointmentId: a.id } })).toBe(0);
    expect(await db.appointmentMutationReceipt.count({ where: { capabilityHash: a.managementTokenHash! } })).toBe(0);
    expect(await eraseExpiredAppointments(db, deadline)).toBe(0);
    expect(await db.auditLog.count({ where: { resourceId: a.id, action: "RETENTION_APPLIED" } })).toBe(1);
  });
  it("rolls erasure, ancillary deletes and audit back together, then retries", async () => {
    const { a, deadline } = await fixture();
    const failing = new Proxy(db, { get(target, property) { return property === "$transaction" ? (work: (tx: Prisma.TransactionClient) => Promise<unknown>) => db.$transaction(async tx => { await work(tx); throw new Error("Synthetic commit failure"); }) : Reflect.get(target, property); } });
    await expect(eraseExpiredAppointments(failing, deadline)).rejects.toThrow("Synthetic commit failure");
    expect(await db.appointment.findUnique({ where: { id: a.id } })).toEqual(a);
    expect(await db.notification.count({ where: { appointmentId: a.id } })).toBeGreaterThan(0);
    expect(await db.auditLog.count({ where: { resourceId: a.id } })).toBe(0);
    expect(await eraseExpiredAppointments(db, deadline)).toBe(1);
  });
  it("shares bounded work across concurrent workers without duplicate erasure", async () => {
    const first = await fixture(); await fixture(); await fixture();
    const result = await Promise.all(Array.from({ length: 4 }, () => eraseExpiredAppointments(db, first.deadline, 1)));
    expect(result.reduce((a, b) => a + b, 0)).toBe(3);
    expect(await db.auditLog.count({ where: { resourceId: { in: ids }, action: "RETENTION_APPLIED" } })).toBe(3);
  });
  it("skips a locked appointment and processes it after lock release", async () => {
    const { a, deadline } = await fixture(); let locked!: () => void, release!: () => void;
    const ready = new Promise<void>(resolve => { locked = resolve; }), released = new Promise<void>(resolve => { release = resolve; });
    const lock = db.$transaction(async tx => { await tx.$queryRaw`SELECT id FROM "Appointment" WHERE id = ${a.id} FOR UPDATE`; locked(); await released; });
    await ready;
    try { expect(await eraseExpiredAppointments(db, deadline)).toBe(0); } finally { release(); await lock; }
    expect(await eraseExpiredAppointments(db, deadline)).toBe(1);
  });
  it("suppresses expired notifications before cleanup and fences a stale leased completion", async () => {
    const { a, deadline } = await fixture("CANCELLED"), repository = prismaNotifications(db, box);
    await db.notification.updateMany({ where: { appointmentId: a.id, type: "BOOKING_CONFIRMATION" }, data: { type: "BOOKING_CANCELLED", requiresSecret: false, secretCipher: null, secretTokenHash: null, secretExpiresAt: null } });
    const jobs = await repository.claim(new Date(deadline), 50, 60000);
    const notificationIds = new Set((await db.notification.findMany({ where: { appointmentId: a.id }, select: { id: true } })).map(n => n.id));
    const own = jobs.filter(job => notificationIds.has(job.id));
    expect(own.length).toBeGreaterThan(0);
    for (const job of own) expect(await repository.prepare(job, new Date(deadline))).toBeNull();
    await eraseExpiredAppointments(db, deadline);
    for (const job of own) expect(await repository.finish(job, new Date(deadline), true)).toBe(false);
  });
  it("rejects a direct erasure marker with residual PII and cancellation without timestamp", async () => {
    const { a, deadline } = await fixture();
    await expect(db.appointment.update({ where: { id: a.id }, data: { piiErasedAt: new Date(deadline) } })).rejects.toThrow();
    await expect(db.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED" } })).rejects.toThrow();
    expect((await db.appointment.findUniqueOrThrow({ where: { id: a.id } })).piiErasedAt).toBeNull();
  });
  it("racing notification preparation and erasure cannot prepare expired recipient data", async () => {
    const { a, deadline } = await fixture(), repository = prismaNotifications(db, box);
    const jobs = await repository.claim(new Date(deadline), 50, 60000);
    const ownIds = new Set((await db.notification.findMany({ where: { appointmentId: a.id }, select: { id: true } })).map(n => n.id));
    const ownJobs = jobs.filter(job => ownIds.has(job.id)); expect(ownJobs.length).toBeGreaterThan(0);
    const [, ...prepared] = await Promise.all([eraseExpiredAppointments(db, deadline), ...ownJobs.map(job => repository.prepare(job, new Date(deadline)))]);
    expect(prepared.every(result => result === null)).toBe(true);
    expect(await db.notification.count({ where: { appointmentId: a.id } })).toBe(0);
  });
});
