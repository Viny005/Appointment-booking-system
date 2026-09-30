import { Temporal } from "@js-temporal/polyfill";
import { commonDay, dayBounds, slots, subtract } from "@/modules/availability/domain/engine";
import { AvailabilityError, TIME_ZONE, instant, localDate } from "@/modules/availability/domain/values";
import { CatalogError } from "@/modules/profiles/domain/errors";
import type { MeetingMode } from "@/modules/profiles/domain/model";
import { AppointmentError, appointmentSummary, createAppointment, requireAppointment, type Customer } from "../domain/appointment";
import type { AppointmentRepository, AppointmentWriter, BookingRuntime } from "./ports";

export type BookAppointmentInput = { primaryProfileId: string; serviceId: string; participantIds: string[]; startUtc: string; meetingMode: MeetingMode; customer: Customer; guests: string[] };
export type BookingResult<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string } };
async function result<T>(work: () => Promise<T>): Promise<BookingResult<T>> {
  try { return { ok: true, value: await work() }; } catch (e) {
    if (e instanceof AppointmentError || e instanceof CatalogError || e instanceof AvailabilityError) return { ok: false, error: { code: e.code, message: e.message } };
    return { ok: false, error: { code: "UNAVAILABLE", message: "Termin konnte nicht verarbeitet werden." } };
  }
}
// Trusted server orchestration seam: future outbox writes MUST use this same transaction.
// The raw token is transient and must never enter a normal read model, URL or log.
export async function reserveAppointment(tx: AppointmentWriter, input: BookAppointmentInput, runtime: BookingRuntime, step = 30) {
  requireAppointment(!!input && Array.isArray(input.participantIds) && input.participantIds.length > 0 && input.participantIds.length <= 50, "Ungültige Teilnehmerliste.");
  await tx.selection(input.participantIds, input.primaryProfileId, input.serviceId);
  const ids = [...input.participantIds].sort();
  await tx.lockProfiles(ids);
  const now = runtime.now(); // Authoritative elapsed-time window, captured once after waiting for locks.
  const selection = await tx.selection(ids, input.primaryProfileId, input.serviceId);
  let start: number;
  try {
    const parsed = Temporal.Instant.from(input.startUtc); start = parsed.epochMilliseconds;
    requireAppointment(parsed.epochNanoseconds === BigInt(start) * 1000000n, "Start muss auf dem Slotraster liegen.");
  } catch { throw new AppointmentError("INVALID_INPUT", "Ungültiger UTC-Terminbeginn."); }
  const date = localDate(Temporal.Instant.fromEpochMilliseconds(start).toZonedDateTimeISO(TIME_ZONE).toPlainDate().toString());
  const schedules = await tx.schedules(ids, date, date);
  requireAppointment(schedules.size === ids.length, "Teilnehmer fehlen.");
  const occupied = await tx.occupancy.read(ids, dayBounds(date));
  const available = slots(date, subtract(commonDay(ids.map(id => schedules.get(id)!), date), occupied), selection.service.durationMinutes, now, step);
  if (!available.some(s => instant(s.startUtc) === start)) throw new AppointmentError("CONFLICT", "Der gewählte Slot ist nicht mehr buchbar.");
  const token = runtime.token();
  const appointment = createAppointment({ id: runtime.id(), calendarUid: runtime.id(), tokenHash: token.hash, start,
    primaryId: input.primaryProfileId, service: selection.service, participants: selection.participants, mode: input.meetingMode, customer: input.customer, guests: input.guests });
  await tx.create(appointment);
  return { ...appointmentSummary(appointment), rawManagementToken: token.raw };
}
export class AppointmentCore {
  constructor(private readonly repository: AppointmentRepository, private readonly runtime: BookingRuntime, private readonly step = 30) {}
  bookAppointment(input: BookAppointmentInput) { return result(() => this.repository.transaction(tx => reserveAppointment(tx, input, this.runtime, this.step))); }
  getInternalSummary(actorId: string, appointmentId: string) {
    return result(() => this.repository.read(async reader => {
      const actor = await reader.actor(actorId);
      if (!actor?.active) throw new AppointmentError("FORBIDDEN", "Kein interner Zugriff.");
      const record = await reader.summary(appointmentId);
      if (!record || !(actor.role === "ADMIN" || actor.role === "ADVISOR" && actor.profileId && record.participantIds.includes(actor.profileId))) throw new AppointmentError("NOT_FOUND", "Termin nicht verfügbar.");
      return record.summary;
    }));
  }
}
