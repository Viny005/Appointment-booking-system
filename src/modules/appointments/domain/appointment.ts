import type { AdvisorProfile, MeetingMode, PhoneDirection, Service } from "@/modules/profiles/domain/model";
import { resolveMeetingMode } from "@/modules/profiles/domain/policies";

export class AppointmentError extends Error {
  constructor(public readonly code: "INVALID_INPUT" | "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "UNAVAILABLE", message: string) { super(message); }
}
export function requireAppointment(condition: unknown, message: string): asserts condition { if (!condition) throw new AppointmentError("INVALID_INPUT", message); }
export type Customer = { firstName: string; lastName: string; email: string; phone: string; address: string | null; remarks: string | null };
function text(value: unknown, max: number, required = true): string | null {
  if (!required && (value === undefined || value === null || value === "")) return null;
  requireAppointment(typeof value === "string", "Text erwartet.");
  const normalized = value.trim(); requireAppointment(normalized.length <= max && (!required || normalized.length > 0), "Ungültige Textlänge.");
  return normalized || null;
}
export function normalizeEmail(value: unknown): string {
  const email = text(value, 254)!;
  requireAppointment(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Ungültige E-Mail-Adresse.");
  const at = email.lastIndexOf("@"); return email.slice(0, at) + "@" + email.slice(at + 1).toLowerCase();
}
export function validateCustomer(input: Customer): Customer {
  requireAppointment(!!input && typeof input === "object", "Kundendaten fehlen.");
  const phone = text(input.phone, 32)!;
  requireAppointment(/^[+\d(). -]+$/.test(phone) && /\d/.test(phone), "Ungültige Telefonnummer.");
  return { firstName: text(input.firstName, 100)!, lastName: text(input.lastName, 100)!, email: normalizeEmail(input.email), phone,
    address: text(input.address, 500, false), remarks: text(input.remarks, 2000, false) };
}
export function validateGuests(input: string[], customerEmail: string, advisorEmails: string[]): string[] {
  requireAppointment(Array.isArray(input) && input.length <= 10, "Höchstens zehn Gäste erlaubt.");
  const emails = input.map(normalizeEmail), excluded = [normalizeEmail(customerEmail), ...advisorEmails.map(normalizeEmail)];
  requireAppointment(new Set(emails).size === emails.length && !emails.some(e => excluded.includes(e)), "Gastadresse ist doppelt oder gehört bereits einem Beteiligten.");
  return emails;
}
export type MeetingSnapshot = { meetingMode: MeetingMode; placeName: string | null; visitAddress: string | null; phoneDirection: PhoneDirection | null; advisorPhone: string | null; onlineUrl: string | null; onlineProvider: string | null };
export function meetingSnapshot(service: Service, mode: MeetingMode): MeetingSnapshot {
  const resolved = resolveMeetingMode(service, mode);
  const base: MeetingSnapshot = { meetingMode: mode, placeName: null, visitAddress: null, phoneDirection: null, advisorPhone: null, onlineUrl: null, onlineProvider: null };
  switch (resolved.mode) {
    case "IN_PERSON": return { ...base, placeName: resolved.placeName, visitAddress: resolved.visitAddress };
    case "PHONE": return { ...base, phoneDirection: resolved.phoneDirection, advisorPhone: resolved.advisorPhone };
    case "ONLINE": return { ...base, onlineUrl: resolved.url, onlineProvider: resolved.provider };
  }
}
export type AppointmentStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
export type Participant = { advisorProfileId: string; role: "PRIMARY" | "ADDITIONAL"; profileName: string; profileTitle: string };
export type Appointment = Customer & MeetingSnapshot & {
  id: string; serviceId: string; startAt: Date; endAt: Date; timeZone: "Europe/Berlin"; status: AppointmentStatus;
  serviceName: string; serviceDescription: string; durationMinutes: number;
  calendarUid: string; calendarSequence: number; version: number;
  managementTokenHash: string; managementTokenExpiresAt: Date;
  participants: Participant[]; guests: string[];
};
export function createAppointment(data: { id: string; calendarUid: string; tokenHash: string; start: number; primaryId: string; service: Service; participants: AdvisorProfile[]; mode: MeetingMode; customer: Customer; guests: string[] }): Appointment {
  const customer = validateCustomer(data.customer), service = data.service;
  requireAppointment(Number.isSafeInteger(data.start), "Ungültiger Terminbeginn.");
  requireAppointment(data.participants.length > 0 && new Set(data.participants.map(p => p.id)).size === data.participants.length && data.participants.filter(p => p.id === data.primaryId).length === 1 && service.advisorProfileId === data.primaryId, "Ungültige Teilnehmer.");
  requireAppointment(/^[a-f0-9]{64}$/.test(data.tokenHash) && !!data.calendarUid && !!data.id, "Ungültige Terminidentität.");
  const end = data.start + service.durationMinutes * 60000;
  requireAppointment(Number.isSafeInteger(end) && end > data.start, "Ungültiges Terminende.");
  return { ...customer, ...meetingSnapshot(service, data.mode), id: data.id, serviceId: service.id,
    serviceName: service.name, serviceDescription: service.description, durationMinutes: service.durationMinutes,
    startAt: new Date(data.start), endAt: new Date(end), timeZone: "Europe/Berlin", status: "CONFIRMED", calendarUid: data.calendarUid, calendarSequence: 0, version: 0,
    managementTokenHash: data.tokenHash, managementTokenExpiresAt: new Date(end),
    participants: data.participants.map(p => ({ advisorProfileId: p.id, role: p.id === data.primaryId ? "PRIMARY" : "ADDITIONAL", profileName: p.name, profileTitle: p.title })),
    guests: validateGuests(data.guests, customer.email, data.participants.map(p => p.notificationEmail)) };
}
export function appointmentSummary(a: Pick<Appointment, "id" | "startAt" | "endAt" | "status">) {
  return { appointmentId: a.id, startUtc: a.startAt.toISOString(), endUtc: a.endAt.toISOString(), status: a.status };
}
