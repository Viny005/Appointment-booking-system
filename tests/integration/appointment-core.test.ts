import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { AppointmentCore, type BookAppointmentInput, type BookingResult } from "@/modules/appointments/application/booking";
import { prismaAppointments, appointmentOccupancy } from "@/modules/appointments/infrastructure/prisma-appointments";
import { generateManagementToken } from "@/modules/appointments/infrastructure/management-token";
import { PublicAvailability } from "@/modules/availability/application/availability";
import { prismaAvailability } from "@/modules/availability/infrastructure/prisma-availability";
import type { AppointmentRepository } from "@/modules/appointments/application/ports";
import { profileDetails, serviceDetails } from "../fixtures/catalog";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString || !new URL(connectionString).pathname.endsWith("_test")) throw new Error("Separate migrated TEST_DATABASE_URL ending in _test required");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 12 }) });
const repo = prismaAppointments(db), occupancy = appointmentOccupancy(db);
const runtime = { id: randomUUID, token: generateManagementToken, now: () => Date.parse("2026-10-01T00:00:00Z") };
const core = new AppointmentCore(repo, runtime);
const publicApi = new PublicAvailability(prismaAvailability(db), occupancy, runtime.now);
const profileIds: string[] = [], admin = randomUUID(), advisor = randomUUID();
const customer = { firstName: "Synthetic", lastName: "Customer", email: "customer@example.test", phone: "+1 202 555 0123", address: null, remarks: null };
function value<T>(r: BookingResult<T>): T { if (!r.ok) throw new Error(r.error.code + ": " + r.error.message); return r.value; }
async function setup() {
  const id = randomUUID(), serviceId = randomUUID(); profileIds.push(id);
  await db.advisorProfile.create({ data: { id, ...profileDetails, notificationEmail: `${id}@example.test`, status: "ACTIVE",
    services: { create: { ...serviceDetails, id: serviceId, active: true, durationMinutes: 60 } },
    weeklyAvailability: { create: Array.from({ length: 7 }, (_, i) => ({ id: randomUUID(), weekday: i + 1, startMinute: 0, endMinute: 1440 })) },
  } }); return { id, serviceId };
}
function input(p: { id: string; serviceId: string }, patch: Partial<BookAppointmentInput> = {}): BookAppointmentInput {
  return { primaryProfileId: p.id, serviceId: p.serviceId, participantIds: [p.id], startUtc: "2026-10-05T07:00:00Z", meetingMode: "PHONE", customer, guests: [], ...patch };
}
async function link(source: string, target: string, mandatory = false, offered = true) {
  return db.profileRelation.create({ data: { id: randomUUID(), sourceProfileId: source, targetProfileId: target, proposedToClient: offered, defaultSelected: mandatory, clientCanRemove: !mandatory } });
}
async function count(p: { id: string }) { return db.appointment.count({ where: { service: { advisorProfileId: p.id } } }); }
async function terminal(id: string, status: "CANCELLED" | "COMPLETED" | "NO_SHOW") {
  // Fixture only, no lifecycle use case is exposed by this sprint.
  await db.$transaction(async tx => {
    await tx.appointmentReservation.deleteMany({ where: { appointmentId: id } });
    await tx.appointment.update({ where: { id }, data: { status, managementTokenRevokedAt: new Date(), cancelledAt: status === "CANCELLED" ? new Date() : null } });
  });
}
beforeAll(async () => { await db.user.createMany({ data: [admin, advisor].map(id => ({ id, name: "Synthetic test account", email: `${id}@example.test`, role: id === admin ? "ADMIN" : "ADVISOR" })) }); });
afterAll(async () => {
  await db.$transaction(async tx => {
    const where = { appointment: { service: { advisorProfileId: { in: profileIds } } } };
    await tx.appointmentReservation.deleteMany({ where }); await tx.appointmentGuest.deleteMany({ where }); await tx.appointmentParticipant.deleteMany({ where });
    await tx.appointment.deleteMany({ where: { service: { advisorProfileId: { in: profileIds } } } });
    await tx.profileRelation.deleteMany({ where: { sourceProfileId: { in: profileIds } } });
    await tx.availabilityExceptionInterval.deleteMany({ where: { exception: { advisorProfileId: { in: profileIds } } } });
    await tx.availabilityException.deleteMany({ where: { advisorProfileId: { in: profileIds } } });
    await tx.weeklyAvailability.deleteMany({ where: { advisorProfileId: { in: profileIds } } });
    await tx.service.deleteMany({ where: { advisorProfileId: { in: profileIds } } }); await tx.advisorProfile.deleteMany({ where: { id: { in: profileIds } } });
    await tx.user.deleteMany({ where: { id: { in: [admin, advisor] } } });
  }); await db.$disconnect();
});
describe("AF-12 persistent atomic reservation", () => {
  it("persists snapshots, participants, guests, UID and only token hash", async () => {
    const a = await setup(), b = await setup(); await link(a.id, b.id);
    const result = value(await core.bookAppointment(input(a, { participantIds: [a.id, b.id], guests: ["guest@EXAMPLE.TEST"] })));
    const saved = await db.appointment.findUniqueOrThrow({ where: { id: result.appointmentId }, include: { participants: true, guests: true, reservations: true } });
    expect(saved).toMatchObject({ status: "CONFIRMED", calendarSequence: 0, version: 0, durationMinutes: 60, serviceName: serviceDetails.name, phoneDirection: "ADVISOR_CALLS_CLIENT", onlineUrl: null });
    expect(saved.participants).toHaveLength(2); expect(saved.reservations).toHaveLength(2); expect(saved.guests[0].email).toBe("guest@example.test");
    expect(saved.participants.filter(p => p.role === "PRIMARY").map(p => p.advisorProfileId)).toEqual([a.id]);
    expect(saved.managementTokenHash?.length).toBe(64); expect(saved.managementTokenExpiresAt?.getTime()).toBe(saved.endAt.getTime());
    expect(JSON.stringify(saved).includes(result.rawManagementToken)).toBe(false);
    expect(saved.calendarUid).toMatch(/^[0-9a-f-]{36}$/);
    expect(Object.keys(result).sort()).toEqual(["appointmentId", "startUtc", "endUtc", "status", "rawManagementToken"].sort());
  });
  it("uses server duration and meeting data, preserving historical snapshots", async () => {
    const p = await setup();
    await db.service.update({ where: { id: p.serviceId }, data: { allowedMeetingModes: ["ONLINE"], onlineUrl: "HTTPS://example.test/old", onlineProvider: "Manual" } });
    const command = { ...input(p, { meetingMode: "ONLINE" }), durationMinutes: 1, onlineUrl: "https://attacker.example.test" };
    const result = value(await core.bookAppointment(command));
    const before = await db.appointment.findUniqueOrThrow({ where: { id: result.appointmentId } });
    await db.service.update({ where: { id: p.serviceId }, data: { name: "Changed", description: "Changed description", durationMinutes: 15, onlineUrl: "https://example.test/new", active: false } });
    const after = await db.appointment.findUniqueOrThrow({ where: { id: result.appointmentId } });
    expect(after).toEqual(before); expect(after.onlineUrl).toBe("HTTPS://example.test/old"); expect(after.endAt.getTime() - after.startAt.getTime()).toBe(3600000);
  });
  it("normal internal read authorizes actual participation and never exposes token data", async () => {
    const a = await setup(), other = await setup(); await link(a.id, other.id);
    await db.advisorProfile.update({ where: { id: other.id }, data: { userId: advisor } });
    const booked = value(await core.bookAppointment(input(a)));
    expect(await core.getInternalSummary(advisor, booked.appointmentId)).toMatchObject({ ok: false });
    const summary = value(await core.getInternalSummary(admin, booked.appointmentId));
    expect(Object.keys(summary).sort()).toEqual(["appointmentId", "startUtc", "endUtc", "status"].sort());
    await db.advisorProfile.update({ where: { id: other.id }, data: { userId: null } });
    await db.advisorProfile.update({ where: { id: a.id }, data: { userId: advisor } });
    expect((await core.getInternalSummary(advisor, booked.appointmentId)).ok).toBe(true);
    await db.user.update({ where: { id: advisor }, data: { active: false } }); expect((await core.getInternalSummary(advisor, booked.appointmentId)).ok).toBe(false);
    await db.user.update({ where: { id: advisor }, data: { active: true } });
    await db.advisorProfile.update({ where: { id: a.id }, data: { userId: null } });
  });
  it("public slots and final booking both reject manipulated and missing mandatory participants", async () => {
    const a = await setup(), b = await setup(), c = await setup(); await link(a.id, b.id, true, false); await link(b.id, c.id);
    for (const ids of [[a.id], [a.id, b.id, c.id], [a.id, b.id, b.id]]) {
      const command = input(a, { participantIds: ids });
      expect((await core.bookAppointment(command)).ok).toBe(false); expect((await publicApi.getBookableSlots(command, "2026-10-05")).ok).toBe(false);
    }
    expect((await core.bookAppointment(input(a, { participantIds: [b.id, a.id] }))).ok).toBe(true);
    expect(await count(a)).toBe(1);
  });
  it.each(["service", "primary", "mandatory"])("revalidates deactivated %s after slot display", async target => {
    const a = await setup(), b = await setup(); await link(a.id, b.id, true);
    const command = input(a, { participantIds: [a.id, b.id] });
    expect(value(await publicApi.getBookableSlots(command, "2026-10-05")).length).toBeGreaterThan(0);
    if (target === "service") await db.service.update({ where: { id: a.serviceId }, data: { active: false } });
    else await db.advisorProfile.update({ where: { id: target === "primary" ? a.id : b.id }, data: { status: "INACTIVE" } });
    expect((await core.bookAppointment(command)).ok).toBe(false); expect(await count(a)).toBe(0);
  });
  it("rejects a stale displayed slot without partial records", async () => {
    const p = await setup(), command = input(p);
    expect(value(await publicApi.getBookableSlots(command, "2026-10-05")).some(s => s.startUtc === command.startUtc)).toBe(true);
    value(await core.bookAppointment(command));
    expect(await core.bookAppointment(command)).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    expect(await count(p)).toBe(1); expect(await db.appointmentParticipant.count({ where: { advisorProfileId: p.id } })).toBe(1);
  });
  it("revalidates a newly blocked day and invalid mode/customer/guests", async () => {
    const p = await setup();
    expect((await core.bookAppointment(input(p, { meetingMode: "ONLINE" }))).ok).toBe(false);
    expect((await core.bookAppointment(input(p, { customer: { ...customer, phone: "" } }))).ok).toBe(false);
    expect((await core.bookAppointment(input(p, { guests: [customer.email] }))).ok).toBe(false);
    await db.availabilityException.create({ data: { id: randomUUID(), advisorProfileId: p.id, type: "BLOCK_DAY", startDate: new Date("2026-10-05"), endDate: new Date("2026-10-05") } });
    expect(await core.bookAppointment(input(p))).toMatchObject({ ok: false, error: { code: "CONFLICT" } }); expect(await count(p)).toBe(0);
  });
});
describe("PostgreSQL concurrent booking", () => {
  it("exactly one simultaneous same-advisor request succeeds", async () => {
    const p = await setup(), results = await Promise.all([core.bookAppointment(input(p)), core.bookAppointment(input(p))]);
    expect(results.filter(r => r.ok)).toHaveLength(1); expect(results.find(r => !r.ok)).toMatchObject({ error: { code: "CONFLICT" } }); expect(await count(p)).toBe(1);
  });
  it("additional advisor collision rejects the entire multi-advisor booking", async () => {
    const a = await setup(), b = await setup(); await link(a.id, b.id);
    const results = await Promise.all([core.bookAppointment(input(a, { participantIds: [a.id, b.id] })), core.bookAppointment(input(b))]);
    expect(results.filter(r => r.ok)).toHaveLength(1); expect((await count(a)) + (await count(b))).toBe(1);
  });
  it("opposite participant order takes the same locks without deadlock", async () => {
    const a = await setup(), b = await setup(); await link(a.id, b.id); await link(b.id, a.id);
    const results = await Promise.all([core.bookAppointment(input(a, { participantIds: [a.id, b.id] })), core.bookAppointment(input(b, { participantIds: [b.id, a.id] }))]);
    expect(results.filter(r => r.ok)).toHaveLength(1); expect(results.find(r => !r.ok)).toMatchObject({ error: { code: "CONFLICT" } });
  });
  it("allows two adjacent appointments concurrently", async () => {
    const p = await setup(), results = await Promise.all([core.bookAppointment(input(p)), core.bookAppointment(input(p, { startUtc: "2026-10-05T08:00:00Z" }))]);
    expect(results.every(r => r.ok)).toBe(true); expect(await count(p)).toBe(2);
    if (results[0].ok && results[1].ok) expect(results[0].value.appointmentId !== results[1].value.appointmentId).toBe(true);
  });
  it("rollback after insertion releases locks and leaves the next request free to commit", async () => {
    const p = await setup(); let entered!: () => void; let release!: () => void;
    const created = new Promise<void>(resolve => { entered = resolve; }), resume = new Promise<void>(resolve => { release = resolve; });
    const failingRepo: AppointmentRepository = { ...repo, transaction: work => repo.transaction(tx => work({ ...tx, create: async appointment => { await tx.create(appointment); entered(); await resume; throw new Error("Synthetic rollback"); } })) };
    const first = new AppointmentCore(failingRepo, runtime).bookAppointment(input(p)); await created;
    const second = core.bookAppointment(input(p)); release();
    expect((await first).ok).toBe(false); expect((await second).ok).toBe(true); expect(await count(p)).toBe(1);
  });
  it("captures the authoritative now only after resource locking", async () => {
    const p = await setup(), start = Date.parse("2026-10-05T07:00:00Z"); let now = start - 86400000;
    const delayed: AppointmentRepository = { ...repo, transaction: work => repo.transaction(tx => work({ ...tx, lockProfiles: async ids => { await tx.lockProfiles(ids); now += 1; } })) };
    expect(await new AppointmentCore(delayed, { ...runtime, now: () => now }).bookAppointment(input(p))).toMatchObject({ ok: false, error: { code: "CONFLICT" } }); expect(await count(p)).toBe(0);
  });
});
describe("Appointment occupancy and temporal revalidation", () => {
  it("counts actual participants, not relations/guests, including overlaps starting before query", async () => {
    const a = await setup(), b = await setup(), c = await setup(); await link(a.id, b.id); await link(a.id, c.id);
    value(await core.bookAppointment(input(a, { participantIds: [a.id, b.id], guests: ["guest@example.test"] })));
    const window = { start: Date.parse("2026-10-05T07:30:00Z"), end: Date.parse("2026-10-05T08:30:00Z") };
    expect(await occupancy.read([a.id], window)).toHaveLength(1); expect(await occupancy.read([b.id], window)).toHaveLength(1); expect(await occupancy.read([c.id], window)).toEqual([]);
    expect(await occupancy.read([a.id], { start: Date.parse("2026-10-05T08:00:00Z"), end: Date.parse("2026-10-05T09:00:00Z") })).toEqual([]);
  });
  it.each(["CANCELLED", "COMPLETED", "NO_SHOW"] as const)("%s has no occupancy", async status => {
    const p = await setup(), booked = value(await core.bookAppointment(input(p))); await terminal(booked.appointmentId, status);
    expect(await occupancy.read([p.id], { start: Date.parse(booked.startUtc), end: Date.parse(booked.endUtc) })).toEqual([]);
    expect((await core.bookAppointment(input(p))).ok).toBe(true);
  });
  it("exact 24h is allowed, less and non-grid precision rejected", async () => {
    const p = await setup(), command = input(p), start = Date.parse(command.startUtc);
    expect((await new AppointmentCore(repo, { ...runtime, now: () => start - 86400000 + 1 }).bookAppointment(command)).ok).toBe(false);
    expect((await core.bookAppointment(input(p, { startUtc: "2026-10-05T07:00:00.0001Z" }))).ok).toBe(false);
    expect((await core.bookAppointment(input(p, { startUtc: "2026-10-05T07:01:00Z" }))).ok).toBe(false);
    expect((await new AppointmentCore(repo, { ...runtime, now: () => start - 86400000 }).bookAppointment(command)).ok).toBe(true);
  });
  it("three calendar months clamp January 31 to April 30 inclusively", async () => {
    const p = await setup(), at = new AppointmentCore(repo, { ...runtime, now: () => Date.parse("2026-01-31T09:00:00Z") });
    expect((await at.bookAppointment(input(p, { startUtc: "2026-04-30T08:30:00Z" }))).ok).toBe(false);
    expect((await at.bookAppointment(input(p, { startUtc: "2026-04-30T08:00:00Z" }))).ok).toBe(true);
  });
  it("preserves both autumn instants and spring gap semantics with real occupancy", async () => {
    const p = await setup(); await db.service.update({ where: { id: p.serviceId }, data: { durationMinutes: 30 } });
    const a = value(await core.bookAppointment(input(p, { startUtc: "2026-10-25T00:30:00Z" })));
    const b = value(await core.bookAppointment(input(p, { startUtc: "2026-10-25T01:30:00Z" })));
    expect(Date.parse(b.startUtc) - Date.parse(a.startUtc)).toBe(3600000);
    const springApi = new PublicAvailability(prismaAvailability(db), occupancy, () => Date.parse("2026-03-01T00:00:00Z"));
    expect(value(await springApi.getBookableSlots(input(p), "2026-03-29")).some(s => s.localTime === "02:30")).toBe(false);
    expect((await new AppointmentCore(repo, { ...runtime, now: () => Date.parse("2026-03-01T00:00:00Z") }).bookAppointment(input(p, { startUtc: "2026-03-29T02:30:00" }))).ok).toBe(false);
  });
});
describe("Appointment constraints independent of Application", () => {
  it.each([{ version: -1 }, { calendarSequence: -1 }, { onlineUrl: "https://example.test" }, { phoneDirection: null }, { managementTokenHash: "raw-not-a-hash" }, { timeZone: "UTC" }])("rejects invalid appointment shape %j", async data => {
    const p = await setup(), booked = value(await core.bookAppointment(input(p)));
    await expect(db.appointment.update({ where: { id: booked.appointmentId }, data })).rejects.toThrow();
  });
  it("rejects invalid time, duplicate participants, two/no PRIMARY, and FK deletion", async () => {
    const p = await setup(), other = await setup(), booked = value(await core.bookAppointment(input(p)));
    const data = { appointmentId: booked.appointmentId, advisorProfileId: p.id, role: "ADDITIONAL" as const, profileName: "Test", profileTitle: "Test" };
    await expect(db.appointment.update({ where: { id: booked.appointmentId }, data: { endAt: new Date(booked.startUtc) } })).rejects.toThrow();
    await expect(db.appointmentParticipant.create({ data: { ...data, id: randomUUID() } })).rejects.toThrow();
    await expect(db.appointmentParticipant.create({ data: { ...data, id: randomUUID(), advisorProfileId: other.id, role: "PRIMARY" } })).rejects.toThrow();
    await expect(db.appointmentParticipant.updateMany({ where: { appointmentId: booked.appointmentId }, data: { role: "ADDITIONAL" } })).rejects.toThrow();
    await expect(db.service.delete({ where: { id: p.serviceId } })).rejects.toThrow();
    await expect(db.appointment.delete({ where: { id: booked.appointmentId } })).rejects.toThrow();
  });
  it("enforces guest limits, uniqueness and canonical domain spelling", async () => {
    const p = await setup(), booked = value(await core.bookAppointment(input(p, { guests: ["guest@example.test"] })));
    const data = { appointmentId: booked.appointmentId, email: "guest@example.test" };
    await expect(db.appointmentGuest.create({ data: { ...data, id: randomUUID() } })).rejects.toThrow();
    await expect(db.appointmentGuest.create({ data: { ...data, id: randomUUID(), email: customer.email } })).rejects.toThrow();
    await expect(db.appointmentGuest.create({ data: { ...data, id: randomUUID(), email: "g@EXAMPLE.TEST" } })).rejects.toThrow();
    await expect(db.appointmentGuest.createMany({ data: Array.from({ length: 10 }, (_, i) => ({ appointmentId: booked.appointmentId, id: randomUUID(), email: `g${i}@example.test` })) })).rejects.toThrow();
    expect(await db.appointmentGuest.count({ where: { appointmentId: booked.appointmentId } })).toBe(1);
  });
  it("prevents direct SQL-backed double reservations and mismatched occupancy", async () => {
    const p = await setup(), booked = value(await core.bookAppointment(input(p)));
    const existing = await db.appointment.findUniqueOrThrow({ where: { id: booked.appointmentId } });
    await expect(db.$transaction(async tx => {
      const id = randomUUID();
      await tx.appointment.create({ data: { ...existing, id, calendarUid: randomUUID(), managementTokenHash: generateManagementToken().hash } });
      await tx.appointmentParticipant.create({ data: { id: randomUUID(), appointmentId: id, advisorProfileId: p.id, role: "PRIMARY", profileName: "Test", profileTitle: "Test" } });
      await tx.appointmentReservation.create({ data: { id: randomUUID(), appointmentId: id, advisorProfileId: p.id, startAt: existing.startAt, endAt: existing.endAt } });
    })).rejects.toThrow();
    await expect(db.appointmentReservation.deleteMany({ where: { appointmentId: booked.appointmentId } })).rejects.toThrow();
    await expect(db.appointmentReservation.updateMany({ where: { appointmentId: booked.appointmentId }, data: { endAt: new Date(existing.endAt.getTime() - 60000) } })).rejects.toThrow();
    await expect(db.appointment.update({ where: { id: booked.appointmentId }, data: { status: "CANCELLED" } })).rejects.toThrow();
    expect(await count(p)).toBe(1);
  });
  it("enforces unique calendar identity and token hashes", async () => {
    const p = await setup(), first = value(await core.bookAppointment(input(p))), second = value(await core.bookAppointment(input(p, { startUtc: "2026-10-05T08:00:00Z" })));
    const row = await db.appointment.findUniqueOrThrow({ where: { id: first.appointmentId } });
    await expect(db.appointment.update({ where: { id: second.appointmentId }, data: { calendarUid: row.calendarUid } })).rejects.toThrow();
    await expect(db.appointment.update({ where: { id: second.appointmentId }, data: { managementTokenHash: row.managementTokenHash } })).rejects.toThrow();
  });
});
