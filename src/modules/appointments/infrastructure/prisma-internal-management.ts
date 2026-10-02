import { randomUUID } from "node:crypto";
import { Temporal } from "@js-temporal/polyfill";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { commonDay, dayBounds, slots, subtract } from "@/modules/availability/domain/engine";
import { localDate, TIME_ZONE, AvailabilityError } from "@/modules/availability/domain/values";
import { prismaAvailabilityReader } from "@/modules/availability/infrastructure/prisma-availability";
import { CatalogError } from "@/modules/profiles/domain/errors";
import { appointmentRecipients, mailInclude, queueEvent, queueReminders } from "@/modules/notifications/infrastructure/planner";
import type { SecretBox } from "@/modules/notifications/application/ports";
import { AppointmentError, normalizeEmail, requireAppointment } from "../domain/appointment";
import { requireInternalAccess, requireInternalActor, type InternalAppointment } from "../domain/internal-management";
import type { InternalRepository, InternalWriter, InternalReceipt } from "../application/internal-management";
import { appointmentOccupancy } from "./prisma-appointments";
import { generateManagementToken } from "./management-token";
const include = { ...mailInclude, service: true } satisfies Prisma.AppointmentInclude;
type Row = Prisma.AppointmentGetPayload<{ include: typeof include }>;
function aggregate(a: Row): InternalAppointment { return { ...a, participants: a.participants.map(p => ({ advisorProfileId: p.advisorProfileId, profileName: p.profileName, profileTitle: p.profileTitle, notificationEmail: p.advisorProfile.notificationEmail })) }; }
const clear = { status: "SUPERSEDED" as const, leaseToken: null, leaseUntil: null, secretCipher: null, secretExpiresAt: null, secretTokenHash: null };
function writer(tx: Prisma.TransactionClient, box: SecretBox): InternalWriter {
  const actor = prismaAvailabilityReader(tx).actor;
  return {
    actor,
    async lock(actorId, appointmentId) {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${actorId} FOR UPDATE`;
      const user = await actor(actorId); requireInternalActor(user);
      const a = await tx.appointment.findUnique({ where: { id: appointmentId }, include }); requireInternalAccess(user, a ? aggregate(a) : null);
      for (const id of a!.participants.map(p => p.advisorProfileId).sort()) await tx.$queryRaw`SELECT id FROM "AdvisorProfile" WHERE id = ${id} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM "Appointment" WHERE id = ${appointmentId} FOR UPDATE`;
    },
    async get(id) { const a = await tx.appointment.findUnique({ where: { id }, include }); return a ? aggregate(a) : null; },
    async slots(a, day, now) {
      const date = localDate(day), ids = a.participants.map(p => p.advisorProfileId);
      const schedules = await prismaAvailabilityReader(tx).schedules(ids, date, date);
      requireAppointment(schedules.size === ids.length, "Teilnehmer fehlen.");
      const free = subtract(commonDay(ids.map(id => schedules.get(id)!), date), await appointmentOccupancy(tx, a.id).read(ids, dayBounds(date)));
      return slots(date, free, a.durationMinutes, now, 30, 0);
    },
    async list(user, range, limit, cursor) {
      const rows = await tx.appointment.findMany({ where: { startAt: { lt: range.to }, endAt: { gt: range.from },
        ...(user.role === "ADMIN" ? {} : { participants: { some: { advisorProfileId: user.profileId ?? "" } } }),
        ...(cursor ? { OR: [{ startAt: { gt: new Date(cursor.startUtc), lt: range.to } }, { startAt: new Date(cursor.startUtc), id: { gt: cursor.id } }] } : {}) },
        orderBy: [{ startAt: "asc" }, { id: "asc" }], take: limit + 1, include });
      const items = rows.slice(0, limit).map(a => ({ id: a.id, startUtc: a.startAt.toISOString(), endUtc: a.endAt.toISOString(), status: a.status, version: a.version, serviceName: a.serviceName, firstName: a.firstName, lastName: a.lastName })), last = items.at(-1);
      return { items, next: rows.length > limit && last ? { startUtc: last.startUtc, id: last.id } : null };
    },
    async receipt(actorId, commandKey) { const r = await tx.internalAppointmentReceipt.findUnique({ where: { actorId_commandKey: { actorId, commandKey } } }); return r ? { payloadHash: r.payloadHash, result: r.result as InternalReceipt["result"], expiresAt: r.expiresAt } : null; },
    async record(actorId, appointmentId, commandKey, command, receipt, now) {
      const data = { appointmentId, action: command.type, ...receipt, createdAt: new Date(now) };
      await tx.internalAppointmentReceipt.upsert({ where: { actorId_commandKey: { actorId, commandKey } }, create: { id: randomUUID(), actorId, commandKey, ...data }, update: data });
    },
    async apply(a, command, plan, now) {
      const original = await tx.appointment.findUniqueOrThrow({ where: { id: a.id }, include });
      const timeChanged = !!plan.data.startAt;
      if (plan.resourceCheck) {
        const start = plan.data.startAt?.getTime() ?? a.startAt.getTime(), end = plan.data.endAt?.getTime() ?? a.endAt.getTime();
        const date = localDate(Temporal.Instant.fromEpochMilliseconds(start).toZonedDateTimeISO(TIME_ZONE).toPlainDate().toString());
        const ids = a.participants.map(p => p.advisorProfileId), schedules = await prismaAvailabilityReader(tx).schedules(ids, date, date);
        requireAppointment(schedules.size === ids.length, "Teilnehmer fehlen.");
        const free = subtract(commonDay(ids.map(id => schedules.get(id)!), date), await appointmentOccupancy(tx, a.id).read(ids, dayBounds(date)));
        const valid = timeChanged ? slots(date, free, a.durationMinutes, now, 30, 0).some(s => Date.parse(s.startUtc) === start) : free.some(r => r.start <= start && r.end >= end);
        if (!valid) throw new AppointmentError("CONFLICT", "Verfügbarkeit oder Belegung wurde geändert.");
      }
      let selected = appointmentRecipients(original), token: ReturnType<typeof generateManagementToken> | null = null;
      if (command.type === "resend") {
        const wanted = command.recipients ?? [a.email!];
        requireAppointment(Array.isArray(wanted) && wanted.length > 0 && wanted.length <= selected.length, "Aktuelle Empfänger auswählen.");
        const emails = wanted.map(normalizeEmail); requireAppointment(new Set(emails).size === emails.length && emails.every(email => selected.some(r => r.email === email)), "Fremder oder doppelter Empfänger.");
        selected = selected.filter(r => emails.includes(r.email));
        if (await tx.internalAppointmentReceipt.count({ where: { appointmentId: a.id, action: "resend", createdAt: { gt: new Date(now - 600000) } } }) >= 3) throw new AppointmentError("FORBIDDEN", "Höchstens drei Bestätigungsbefehle in zehn Minuten.");
        if (selected.some(r => r.category === "CUSTOMER")) token = generateManagementToken();
      }
      const terminal = command.type === "cancel" || command.type === "outcome";
      const pending = { appointmentId: a.id, status: { in: ["PENDING", "FAILED"] as ("PENDING" | "FAILED")[] } };
      if (terminal) await tx.notification.updateMany({ where: { ...pending, removedGuest: false }, data: clear });
      else {
        if (timeChanged) await tx.notification.updateMany({ where: { ...pending, type: "REMINDER" }, data: clear });
        if (plan.calendarChanged) await tx.notification.updateMany({ where: { ...pending, removedGuest: false, type: { notIn: ["REMINDER", "BOOKING_CONFIRMATION"] } }, data: clear });
        if (token) await tx.notification.updateMany({ where: { ...pending, requiresSecret: true }, data: clear });
      }
      const added = plan.guests?.filter(email => !a.guests.some(g => g.email === email)) ?? [], removed = a.guests.filter(g => plan.guests && !plan.guests.includes(g.email));
      if (plan.guests) {
        await tx.notification.updateMany({ where: { ...pending, recipientCategory: "GUEST", recipientEmail: { in: [...removed.map(g => g.email), ...added] } }, data: clear });
        await tx.appointmentGuest.deleteMany({ where: { appointmentId: a.id, email: { notIn: plan.guests } } });
        await tx.appointmentGuest.createMany({ data: added.map(email => ({ id: randomUUID(), appointmentId: a.id, email, source: "INTERNAL" as const })) });
      }
      if (terminal || timeChanged) await tx.appointmentReservation.deleteMany({ where: { appointmentId: a.id } });
      const updated = await tx.appointment.update({ where: { id: a.id, version: a.version }, data: { ...plan.data, version: { increment: 1 },
        calendarSequence: { increment: plan.calendarChanged ? 1 : 0 }, notificationEventNumber: { increment: command.type === "outcome" ? 0 : 1 },
        reminderGeneration: { increment: terminal || timeChanged ? 1 : 0 },
        ...(timeChanged ? { managementTokenExpiresAt: plan.data.endAt } : {}),
        ...(terminal ? { managementTokenRevokedAt: new Date(now) } : {}), ...(command.type === "cancel" ? { cancelledAt: new Date(now) } : {}),
        ...(token ? { managementTokenHash: token.hash, managementTokenExpiresAt: a.endAt, managementTokenRevokedAt: null } : {}),
      }, include: mailInclude });
      if (timeChanged && !terminal) await tx.appointmentReservation.createMany({ data: updated.participants.map(p => ({ id: randomUUID(), appointmentId: a.id, advisorProfileId: p.advisorProfileId, startAt: updated.startAt, endAt: updated.endAt })) });
      const eventId = `${a.id}:internal:${updated.version}`, current = appointmentRecipients(updated);
      if (command.type === "outcome") return { status: updated.status, version: updated.version, noOp: false };
      if (command.type === "resend") await queueEvent(tx, updated, { eventId, type: "BOOKING_CONFIRMATION", recipients: selected, now, ...(token ? { secret: { raw: token.raw, box } } : {}) });
      else if (command.type === "cancel") await queueEvent(tx, updated, { eventId, type: "BOOKING_CANCELLED", recipients: current, method: "CANCEL", now });
      else if (command.type === "guests") {
        await queueEvent(tx, updated, { eventId, type: "BOOKING_CHANGED", recipients: current.filter(r => !added.includes(r.email)), now });
        await queueEvent(tx, updated, { eventId, type: "BOOKING_CONFIRMATION", recipients: current.filter(r => added.includes(r.email)), guestSource: "INTERNAL", now });
        for (const guest of removed) await queueEvent(tx, { ...original, version: updated.version, calendarSequence: updated.calendarSequence, notificationEventNumber: updated.notificationEventNumber }, { eventId, type: "BOOKING_CANCELLED", recipients: [{ email: guest.email, category: "GUEST", advisorProfileId: null }], removedGuest: true, method: "CANCEL", guestSource: guest.source, now });
        await queueReminders(tx, updated, now, current.filter(r => added.includes(r.email)));
      } else await queueEvent(tx, updated, { eventId, type: "BOOKING_CHANGED", recipients: plan.calendarChanged ? current : current.filter(r => r.category !== "GUEST"), method: plan.calendarChanged ? "REQUEST" : null, now });
      if (timeChanged) await queueReminders(tx, updated, now);
      return { status: updated.status, version: updated.version, noOp: false };
    },
  };
}
export function prismaInternalAppointments(db: PrismaClient, box: SecretBox): InternalRepository {
  async function run<T>(work: (tx: Prisma.TransactionClient) => Promise<T>, isolationLevel: "ReadCommitted" | "RepeatableRead") {
    for (let attempt = 0; ; attempt++) try { return await db.$transaction(work, { isolationLevel, timeout: 20000, maxWait: 10000 }); }
    catch (e) {
      if (e instanceof AppointmentError || e instanceof CatalogError || e instanceof AvailabilityError) throw e;
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (attempt < 2 && (e.code === "P2034" || e.code === "P2010" && ["40001", "40P01"].includes(String(e.meta?.code)))) continue;
        if (["P2002", "P2004", "P2010", "P2025", "P2034"].includes(e.code)) throw new AppointmentError("CONFLICT", "Termin wurde parallel geändert.");
      }
      throw new AppointmentError("UNAVAILABLE", "Interne Terminverwaltung derzeit nicht verfügbar.");
    }
  }
  return { read: work => run(tx => work(writer(tx, box)), "RepeatableRead"), write: work => run(tx => work(writer(tx, box)), "ReadCommitted") };
}
export async function purgeInternalReceipts(db: PrismaClient, now: number, limit = 1000) {
  requireAppointment(Number.isSafeInteger(now) && Number.isInteger(limit) && limit > 0 && limit <= 1000, "Ungültige Bereinigungsgrenze.");
  const rows = await db.internalAppointmentReceipt.findMany({ where: { expiresAt: { lte: new Date(now) } }, orderBy: { expiresAt: "asc" }, take: limit, select: { id: true } });
  return db.internalAppointmentReceipt.deleteMany({ where: { id: { in: rows.map(r => r.id) }, expiresAt: { lte: new Date(now) } } });
}
