import { randomUUID } from "node:crypto";
import { Temporal } from "@js-temporal/polyfill";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { commonDay, dayBounds, slots, subtract } from "@/modules/availability/domain/engine";
import { localDate, TIME_ZONE, AvailabilityError } from "@/modules/availability/domain/values";
import { prismaAvailabilityReader } from "@/modules/availability/infrastructure/prisma-availability";
import { isValidActiveService } from "@/modules/profiles/domain/policies";
import { CatalogError } from "@/modules/profiles/domain/errors";
import { appointmentRecipients, mailInclude, queueEvent, queueReminders } from "@/modules/notifications/infrastructure/planner";
import { AppointmentError, meetingSnapshot } from "../domain/appointment";
import type { ManagedAppointment } from "../domain/customer-management";
import type { CustomerManagementRepository, CustomerManagementWriter, MutationReceipt } from "../application/customer-management";
import { appointmentOccupancy } from "./prisma-appointments";

function writer(tx: Prisma.TransactionClient): CustomerManagementWriter {
  const loadById = (id: string) => tx.appointment.findUniqueOrThrow({ where: { id }, include: { ...mailInclude, service: true } });
  const available = async (a: ManagedAppointment, day: string, now: number) => {
    const date = localDate(day), record = await loadById(a.id), ids = record.participants.map(p => p.advisorProfileId);
    const schedules = await prismaAvailabilityReader(tx).schedules(ids, date, date);
    if (schedules.size !== ids.length) throw new AppointmentError("CONFLICT", "Teilnehmer nicht verfügbar.");
    const busy = await appointmentOccupancy(tx, a.id).read(ids, dayBounds(date));
    return slots(date, subtract(commonDay(ids.map(id => schedules.get(id)!), date), busy), a.durationMinutes, now);
  };
  return {
    async lock(hash) {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${hash}, 7))::text`;
      const a = await tx.appointment.findUnique({ where: { managementTokenHash: hash }, select: { id: true, participants: { select: { advisorProfileId: true } } } });
      if (a) {
        // Match booking/availability lock order; actual participants are immutable in V1.
        for (const id of a.participants.map(p => p.advisorProfileId).sort()) await tx.$queryRaw`SELECT id FROM "AdvisorProfile" WHERE id = ${id} FOR UPDATE`;
        await tx.$queryRaw`SELECT id FROM "Appointment" WHERE id = ${a.id} FOR UPDATE`;
      }
    },
    async load(hash) {
      const a = await tx.appointment.findUnique({ where: { managementTokenHash: hash }, include: { ...mailInclude, service: true } });
      if (!a) return null;
      return { ...a, participantNames: a.participants.map(p => p.profileName), tokenExpiresAt: a.managementTokenExpiresAt, tokenRevokedAt: a.managementTokenRevokedAt,
        allowedModes: [...new Set([a.meetingMode, ...(isValidActiveService(a.service) ? a.service.allowedMeetingModes : [])])] };
    },
    slots: available,
    async receipt(capabilityHash, commandKey) {
      const r = await tx.appointmentMutationReceipt.findUnique({ where: { capabilityHash_commandKey: { capabilityHash, commandKey } } });
      return r ? { payloadHash: r.payloadHash, expiresAt: r.expiresAt, result: r.result as MutationReceipt["result"] } : null;
    },
    async saveReceipt(capabilityHash, commandKey, receipt) {
      await tx.appointmentMutationReceipt.upsert({ where: { capabilityHash_commandKey: { capabilityHash, commandKey } },
        create: { id: randomUUID(), capabilityHash, commandKey, ...receipt }, update: receipt });
    },
    async mutate(a, command, now) {
      const original = await loadById(a.id);
      let data: Prisma.AppointmentUpdateInput;
      if (command.type === "cancel") data = { status: "CANCELLED", cancelledAt: new Date(now), managementTokenRevokedAt: new Date(now) };
      else {
        let start: number;
        try { const parsed = Temporal.Instant.from(command.startUtc); start = parsed.epochMilliseconds;
          if (parsed.epochNanoseconds !== BigInt(start) * 1000000n) throw new Error();
        } catch { throw new AppointmentError("INVALID_INPUT", "Ungültiger Terminbeginn."); }
        if (start === a.startAt.getTime() && command.meetingMode === a.meetingMode) return { status: a.status, version: a.version };
        const date = Temporal.Instant.fromEpochMilliseconds(start).toZonedDateTimeISO(TIME_ZONE).toPlainDate().toString();
        if (!(await available(a, date, now)).some(s => Temporal.Instant.from(s.startUtc).epochMilliseconds === start)) throw new AppointmentError("CONFLICT", "Der gewählte Slot ist nicht mehr verfügbar.");
        const snapshot = command.meetingMode === a.meetingMode ? {} : meetingSnapshot(original.service, command.meetingMode);
        const endAt = new Date(start + a.durationMinutes * 60000);
        data = { ...snapshot, startAt: new Date(start), endAt, managementTokenExpiresAt: endAt };
      }
      // Discard obsolete claims and encrypted capabilities together with the change.
      await tx.notification.updateMany({ where: { appointmentId: a.id, status: { in: ["PENDING", "FAILED"] } }, data: {
        status: "SUPERSEDED", leaseToken: null, leaseUntil: null, secretCipher: null, secretExpiresAt: null, secretTokenHash: null } });
      await tx.appointmentReservation.deleteMany({ where: { appointmentId: a.id } });
      const updated = await tx.appointment.update({ where: { id: a.id, version: a.version }, data: { ...data,
        version: { increment: 1 }, calendarSequence: { increment: 1 }, notificationEventNumber: { increment: 1 }, reminderGeneration: { increment: 1 } }, include: mailInclude });
      if (updated.status === "CONFIRMED") await tx.appointmentReservation.createMany({ data: updated.participants.map(p => ({ id: randomUUID(), appointmentId: a.id, advisorProfileId: p.advisorProfileId, startAt: updated.startAt, endAt: updated.endAt })) });
      await queueEvent(tx, updated, { eventId: `${a.id}:change:${updated.version}`, type: command.type === "cancel" ? "BOOKING_CANCELLED" : "BOOKING_CHANGED",
        method: command.type === "cancel" ? "CANCEL" : "REQUEST", now, recipients: appointmentRecipients(updated) });
      if (command.type !== "cancel") await queueReminders(tx, updated, now);
      return { status: updated.status, version: updated.version };
    },
  };
}
export function prismaCustomerManagement(db: PrismaClient): CustomerManagementRepository {
  async function run<T>(work: (tx: Prisma.TransactionClient) => Promise<T>, isolationLevel: "ReadCommitted" | "RepeatableRead") {
    for (let attempt = 0; ; attempt++) try { return await db.$transaction(work, { isolationLevel, timeout: 15000, maxWait: 10000 }); }
    catch (e) {
      if (e instanceof AppointmentError || e instanceof CatalogError || e instanceof AvailabilityError) throw e;
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (attempt < 2 && (e.code === "P2034" || e.code === "P2010" && ["40001", "40P01"].includes(String(e.meta?.code)))) continue;
        if (["P2002", "P2004", "P2010", "P2025", "P2034"].includes(e.code)) throw new AppointmentError("CONFLICT", "Termin wurde parallel geändert.");
      }
      throw new AppointmentError("UNAVAILABLE", "Terminverwaltung derzeit nicht verfügbar.");
    }
  }
  return { read: work => run(tx => work(writer(tx)), "RepeatableRead"), write: work => run(tx => work(writer(tx)), "ReadCommitted") };
}

export async function purgeCustomerReceipts(db: PrismaClient, now: number, limit = 1000) {
  if (!Number.isSafeInteger(now) || !Number.isInteger(limit) || limit < 1 || limit > 1000) throw new AppointmentError("INVALID_INPUT", "Ungültige Bereinigungsgrenze.");
  const expired = await db.appointmentMutationReceipt.findMany({ where: { expiresAt: { lte: new Date(now) } }, orderBy: { expiresAt: "asc" }, take: limit, select: { id: true } });
  // Recheck expiry: a concurrent reuse may have renewed the receipt since selection.
  return db.appointmentMutationReceipt.deleteMany({ where: { id: { in: expired.map(r => r.id) }, expiresAt: { lte: new Date(now) } } });
}
