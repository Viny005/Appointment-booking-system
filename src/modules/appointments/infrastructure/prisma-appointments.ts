import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { loadBookingSelection } from "@/modules/profiles/infrastructure/booking-selection";
import { CatalogError } from "@/modules/profiles/domain/errors";
import { AvailabilityError } from "@/modules/availability/domain/values";
import { prismaAvailabilityReader } from "@/modules/availability/infrastructure/prisma-availability";
import type { OccupancyReader } from "@/modules/availability/application/ports";
import { AppointmentError, appointmentSummary } from "../domain/appointment";
import type { AppointmentReader, AppointmentRepository, AppointmentWriter } from "../application/ports";

export function appointmentOccupancy(database: Pick<Prisma.TransactionClient, "appointment">, excludeAppointmentId?: string): OccupancyReader {
  return { async read(profileIds, interval) {
    const rows = await database.appointment.findMany({ where: { id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined, status: "CONFIRMED", startAt: { lt: new Date(interval.end) }, endAt: { gt: new Date(interval.start) },
      participants: { some: { advisorProfileId: { in: profileIds } } } }, select: { startAt: true, endAt: true }, orderBy: { startAt: "asc" } });
    return rows.map(r => ({ start: r.startAt.getTime(), end: r.endAt.getTime() }));
  } };
}
function reader(tx: Prisma.TransactionClient): AppointmentReader {
  return { actor: prismaAvailabilityReader(tx).actor,
    async summary(id) {
      const row = await tx.appointment.findUnique({ where: { id }, select: { id: true, startAt: true, endAt: true, status: true, participants: { select: { advisorProfileId: true } } } });
      return row ? { summary: appointmentSummary(row), participantIds: row.participants.map(p => p.advisorProfileId) } : null;
    } };
}
export function appointmentWriter(tx: Prisma.TransactionClient): AppointmentWriter {
  return { ...reader(tx), selection: (ids, primary, service) => loadBookingSelection(tx, ids, primary, service),
    schedules: prismaAvailabilityReader(tx).schedules, occupancy: appointmentOccupancy(tx),
    async lockProfiles(ids) {
      for (const id of [...new Set(ids)].sort()) await tx.$queryRaw`SELECT id FROM "AdvisorProfile" WHERE id = ${id} FOR UPDATE`;
    },
    async create(appointment) {
      const { participants, guests, ...data } = appointment;
      await tx.appointment.create({ data: { ...data,
        participants: { create: participants.map(p => ({ ...p, id: randomUUID() })) },
        guests: { create: guests.map(email => ({ email, id: randomUUID() })) },
        reservations: { create: participants.map(p => ({ id: randomUUID(), advisorProfileId: p.advisorProfileId, startAt: data.startAt, endAt: data.endAt })) },
      } });
    } };
}
async function translate<T>(work: () => Promise<T>): Promise<T> {
  try { return await work(); } catch (e) {
    if (e instanceof AppointmentError || e instanceof CatalogError || e instanceof AvailabilityError) throw e;
    if (e instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2004", "P2034", "P2010"].includes(e.code)) throw new AppointmentError("CONFLICT", "Termin kollidiert mit einer parallelen Änderung.");
    throw new AppointmentError("UNAVAILABLE", "Termin konnte nicht gespeichert oder gelesen werden.");
  }
}
async function retryTransaction<T>(work: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await work(); } catch (e) {
      const retryable = e instanceof Prisma.PrismaClientKnownRequestError &&
        (e.code === "P2034" || e.code === "P2010" && ["40001", "40P01"].includes(String(e.meta?.code)));
      if (!retryable || attempt >= 2) throw e;
    }
  }
}
export function prismaAppointments(db: PrismaClient): AppointmentRepository {
  return {
    transaction: work => translate(() => retryTransaction(() => db.$transaction(tx => work(appointmentWriter(tx)), { isolationLevel: "ReadCommitted", timeout: 15000, maxWait: 10000 }))),
    read: work => translate(() => db.$transaction(tx => work(reader(tx)), { isolationLevel: "RepeatableRead" })),
  };
}
