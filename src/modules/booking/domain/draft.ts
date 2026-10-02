import { Temporal } from "@js-temporal/polyfill";
import { AppointmentError, requireAppointment, validateCustomer, validateGuests, type Customer } from "@/modules/appointments/domain/appointment";
import { localDate, TIME_ZONE } from "@/modules/availability/domain/values";
import type { MeetingMode } from "@/modules/profiles/domain/model";

export const DRAFT_TTL = 30 * 60 * 1000;
export const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000;
export type DraftPayload = { primaryProfileId: string | null; serviceId: string | null; participantIds: string[]; meetingMode: MeetingMode | null; date: string | null; startUtc: string | null; customer: Customer | null; guests: string[] };
export type Draft = { id: string; capabilityHash: string; payload: DraftPayload; version: number; expiresAt: Date };
export type DraftCommand =
  | { type: "primary"; profileId: string }
  | { type: "service"; serviceId: string }
  | { type: "participants"; participantIds: string[] }
  | { type: "mode"; meetingMode: MeetingMode }
  | { type: "date"; date: string }
  | { type: "slot"; startUtc: string }
  | { type: "customer"; customer: Customer }
  | { type: "guests"; guests: string[] };
export const emptyDraft = (): DraftPayload => ({ primaryProfileId: null, serviceId: null, participantIds: [], meetingMode: null, date: null, startUtc: null, customer: null, guests: [] });
export function identifier(value: unknown): asserts value is string { requireAppointment(typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value), "Ungueltige Auswahl."); }
export function assertLive(draft: Draft | null, now: number): asserts draft is Draft {
  if (!draft || draft.expiresAt.getTime() <= now) throw new AppointmentError("NOT_FOUND", "Entwurf abgelaufen oder nicht vorhanden.");
}
export function assertVersion(draft: Draft, version: number) { if (!Number.isInteger(version) || draft.version !== version) throw new AppointmentError("CONFLICT", "Entwurf wurde inzwischen geaendert."); }
// Service/default participant decisions are supplied by the server, never by the browser.
export function changeDraft(payload: DraftPayload, command: DraftCommand): DraftPayload {
  requireAppointment(!!command && typeof command === "object", "Befehl fehlt.");
  switch (command.type) {
    case "primary": identifier(command.profileId); return { ...emptyDraft(), primaryProfileId: command.profileId, participantIds: [command.profileId] };
    case "service": identifier(command.serviceId); requireAppointment(payload.primaryProfileId, "Profil fehlt."); return { ...payload, serviceId: command.serviceId, participantIds: [payload.primaryProfileId], meetingMode: null, date: null, startUtc: null };
    case "participants":
      requireAppointment(payload.serviceId && Array.isArray(command.participantIds) && command.participantIds.length > 0 && command.participantIds.length <= 50, "Teilnehmer fehlen.");
      command.participantIds.forEach(identifier);
      requireAppointment(new Set(command.participantIds).size === command.participantIds.length && command.participantIds.includes(payload.primaryProfileId!), "Ungueltige Teilnehmer.");
      return { ...payload, participantIds: [...command.participantIds].sort(), date: null, startUtc: null };
    case "mode": requireAppointment(payload.serviceId && ["IN_PERSON", "PHONE", "ONLINE"].includes(command.meetingMode), "Ungueltiger Modus."); return { ...payload, meetingMode: command.meetingMode };
    case "date": requireAppointment(payload.serviceId, "Service fehlt."); return { ...payload, date: localDate(command.date), startUtc: null };
    case "slot": {
      requireAppointment(payload.date && typeof command.startUtc === "string", "Datum fehlt.");
      let start: Temporal.Instant;
      try { start = Temporal.Instant.from(command.startUtc); } catch { throw new AppointmentError("INVALID_INPUT", "Ungueltiger Start."); }
      requireAppointment(start.epochNanoseconds === BigInt(start.epochMilliseconds) * 1000000n && start.toZonedDateTimeISO(TIME_ZONE).toPlainDate().toString() === payload.date, "Slot passt nicht zum Datum.");
      return { ...payload, startUtc: start.toString() };
    }
    case "customer": { const customer = validateCustomer(command.customer); return { ...payload, customer, guests: validateGuests(payload.guests, customer.email, []) }; }
    case "guests": requireAppointment(payload.customer, "Kundendaten fehlen."); return { ...payload, guests: validateGuests(command.guests, payload.customer.email, []) };
    default: throw new AppointmentError("INVALID_INPUT", "Unbekannter Entwurfsbefehl.");
  }
}
export function bookingInput(payload: DraftPayload) {
  requireAppointment(payload.primaryProfileId && payload.serviceId && payload.meetingMode && payload.date && payload.startUtc && payload.customer, "Entwurf ist unvollstaendig.");
  return { primaryProfileId: payload.primaryProfileId, serviceId: payload.serviceId, participantIds: [...payload.participantIds].sort(), meetingMode: payload.meetingMode, startUtc: payload.startUtc, customer: validateCustomer(payload.customer), guests: [...payload.guests].sort() };
}
export function draftView(draft: Draft) { return { payload: draft.payload, version: draft.version, expiresAt: draft.expiresAt.toISOString() }; }
