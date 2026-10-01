import { AppointmentError, requireAppointment, type MeetingSnapshot, type AppointmentStatus } from "./appointment";
import type { MeetingMode } from "@/modules/profiles/domain/model";

export type ManagedAppointment = MeetingSnapshot & {
  id: string; startAt: Date; endAt: Date; status: AppointmentStatus; version: number;
  serviceName: string; durationMinutes: number; participantNames: string[];
  allowedModes: MeetingMode[]; tokenExpiresAt: Date | null; tokenRevokedAt: Date | null;
};
export function requireCapability(a: ManagedAppointment | null, now: number): asserts a is ManagedAppointment {
  if (!a || a.tokenRevokedAt || !a.tokenExpiresAt || a.tokenExpiresAt.getTime() <= now)
    throw new AppointmentError("NOT_FOUND", "Verwaltungslink nicht verfügbar. Bitte kontaktieren Sie Ihre Beratungsstelle.");
}
export function customerCanChange(a: ManagedAppointment, now: number) { return a.status === "CONFIRMED" && a.startAt.getTime() - now > 86400000; }
export function requireCustomerChange(a: ManagedAppointment, version: number, now: number) {
  requireAppointment(Number.isSafeInteger(version) && version >= 0, "Ungültige Version.");
  if (a.version !== version) throw new AppointmentError("CONFLICT", "Termin wurde inzwischen geändert. Bitte neu laden.");
  if (!customerCanChange(a, now)) throw new AppointmentError("FORBIDDEN", "Änderungen sind nur mehr als 24 Stunden vor Beginn möglich. Bitte kontaktieren Sie Ihre Beratungsstelle.");
}
export function customerView(a: ManagedAppointment, now: number) {
  return { startUtc: a.startAt.toISOString(), endUtc: a.endAt.toISOString(), status: a.status, version: a.version,
    serviceName: a.serviceName, durationMinutes: a.durationMinutes, participantNames: a.participantNames,
    meetingMode: a.meetingMode, placeName: a.placeName, visitAddress: a.visitAddress, phoneDirection: a.phoneDirection,
    advisorPhone: a.advisorPhone, onlineUrl: a.onlineUrl, onlineProvider: a.onlineProvider,
    allowedModes: a.allowedModes, canChange: customerCanChange(a, now) };
}
export type CustomerCommand = { type: "cancel"; version: number } | { type: "reschedule"; version: number; startUtc: string; meetingMode: MeetingMode };
export function validateCustomerCommand(value: CustomerCommand): CustomerCommand {
  requireAppointment(!!value && typeof value === "object" && Number.isSafeInteger(value.version) && value.version >= 0, "Ungültiger Änderungsbefehl.");
  if (value.type === "cancel") return { type: value.type, version: value.version };
  requireAppointment(value.type === "reschedule" && typeof value.startUtc === "string" && value.startUtc.length <= 40 && ["IN_PERSON", "PHONE", "ONLINE"].includes(value.meetingMode), "Ungültige Umbuchung.");
  return { type: value.type, version: value.version, startUtc: value.startUtc, meetingMode: value.meetingMode };
}
