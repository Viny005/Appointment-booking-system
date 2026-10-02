import { Temporal } from "@js-temporal/polyfill";
import type { Service, MeetingMode } from "@/modules/profiles/domain/model";
import { TIME_ZONE, localDate } from "@/modules/availability/domain/values";
import { AppointmentError, meetingSnapshot, requireAppointment, validateCustomer, validateGuests, type AppointmentStatus, type MeetingSnapshot } from "./appointment";

export type InternalActor = { active: boolean; role: string; profileId: string | null };
export type InternalAppointment = MeetingSnapshot & {
  id: string; serviceId: string; service: Service; serviceName: string; durationMinutes: number;
  startAt: Date; endAt: Date; status: AppointmentStatus; version: number; calendarSequence: number;
  firstName: string | null; lastName: string | null; email: string | null; phone: string | null; address: string | null; remarks: string | null;
  participants: { advisorProfileId: string; profileName: string; profileTitle: string; notificationEmail: string }[];
  guests: { email: string; source: "CUSTOMER" | "INTERNAL" }[];
};
export type DetailPatch = Partial<Pick<InternalAppointment, "firstName" | "lastName" | "phone" | "address" | "remarks"> & MeetingSnapshot>;
export type InternalCommand = { type: "cancel"; version: number } | { type: "reschedule"; version: number; startUtc: string; meetingMode: MeetingMode }
  | { type: "details"; version: number; patch: DetailPatch } | { type: "guests"; version: number; emails: string[] }
  | { type: "resend"; version: number; recipients?: string[] } | { type: "outcome"; version: number; status: "COMPLETED" | "NO_SHOW" };
export function requireInternalActor(actor: InternalActor | null): asserts actor is InternalActor {
  if (!actor?.active || !["ADMIN", "ADVISOR"].includes(actor.role)) throw new AppointmentError("FORBIDDEN", "Kein interner Zugriff.");
}
export function requireInternalAccess(actor: InternalActor, a: InternalAppointment | null): asserts a is InternalAppointment {
  if (!a || actor.role !== "ADMIN" && !a.participants.some(p => p.advisorProfileId === actor.profileId)) throw new AppointmentError("NOT_FOUND", "Termin nicht verfügbar.");
}
export function internalRange(day: string, view: "day" | "week" | "month") {
  const date = Temporal.PlainDate.from(localDate(day));
  requireAppointment(["day", "week", "month"].includes(view), "Ungültige Kalenderansicht.");
  const from = view === "month" ? date.with({ day: 1 }) : view === "week" ? date.subtract({ days: date.dayOfWeek - 1 }) : date;
  const to = view === "month" ? from.add({ months: 1 }) : from.add({ days: view === "week" ? 7 : 1 });
  return { from: new Date(from.toZonedDateTime(TIME_ZONE).epochMilliseconds), to: new Date(to.toZonedDateTime(TIME_ZONE).epochMilliseconds) };
}
const meetingFields = ["meetingMode", "placeName", "visitAddress", "phoneDirection", "advisorPhone", "onlineUrl", "onlineProvider"] as const;
const contactFields = ["firstName", "lastName", "phone", "address", "remarks"] as const;
export function internalDetail(a: InternalAppointment) {
  return { id: a.id, startUtc: a.startAt.toISOString(), endUtc: a.endAt.toISOString(), status: a.status, version: a.version,
    serviceName: a.serviceName, durationMinutes: a.durationMinutes, firstName: a.firstName, lastName: a.lastName, email: a.email, phone: a.phone, address: a.address, remarks: a.remarks,
    meetingMode: a.meetingMode, placeName: a.placeName, visitAddress: a.visitAddress, phoneDirection: a.phoneDirection, advisorPhone: a.advisorPhone, onlineUrl: a.onlineUrl, onlineProvider: a.onlineProvider,
    participants: a.participants, guests: a.guests, retainedPersonalData: a.email !== null };
}
export type InternalPlan = { action: string; data: DetailPatch & { startAt?: Date; endAt?: Date; status?: AppointmentStatus }; calendarChanged: boolean; resourceCheck: boolean; noOp: boolean; guests?: string[]; changedFields: string[] };
export function planInternalChange(a: InternalAppointment, command: InternalCommand, now: number): InternalPlan {
  requireAppointment(!!command && typeof command === "object" && Number.isSafeInteger(command.version) && command.version >= 0, "Ungültiger Befehl.");
  const keys: Record<InternalCommand["type"], string[]> = { cancel: [], reschedule: ["startUtc", "meetingMode"], details: ["patch"], guests: ["emails"], resend: ["recipients"], outcome: ["status"] };
  requireAppointment(Object.hasOwn(keys, command.type) && Object.keys(command).every(k => ["type", "version", ...keys[command.type]].includes(k)), "Nicht erlaubtes Befehlsfeld.");
  const base: InternalPlan = { action: command.type, data: {}, calendarChanged: false, resourceCheck: false, noOp: false, changedFields: [] };
  if (command.type === "outcome") requireAppointment(["COMPLETED", "NO_SHOW"].includes(command.status), "Ungültiger Ergebnisstatus.");
  if (command.type === "outcome" && a.status === command.status) return { ...base, noOp: true };
  if (a.version !== command.version) throw new AppointmentError("CONFLICT", "Termin wurde inzwischen geändert.");
  if (a.status !== "CONFIRMED") throw new AppointmentError("CONFLICT", "Terminaler Termin kann nicht geändert werden.");
  if (command.type === "outcome") {
    requireAppointment(["COMPLETED", "NO_SHOW"].includes(command.status) && now >= a.endAt.getTime(), "Ergebnis ist erst ab Terminende zulässig.");
    return { ...base, data: { status: command.status }, changedFields: ["status"] };
  }
  if (now >= a.endAt.getTime()) throw new AppointmentError("FORBIDDEN", "Termin ist bereits beendet.");
  if (command.type === "cancel") return { ...base, data: { status: "CANCELLED" }, calendarChanged: true, changedFields: ["status"] };
  if (command.type === "resend") return base;
  if (command.type === "guests") {
    requireAppointment(!!a.email, "Kundendaten nicht verfügbar.");
    const emails = validateGuests(command.emails, a.email, a.participants.map(p => p.notificationEmail)).sort();
    return { ...base, guests: emails, noOp: JSON.stringify(emails) === JSON.stringify(a.guests.map(g => g.email).sort()), calendarChanged: true, resourceCheck: true, changedFields: ["guests"] };
  }
  let patch: DetailPatch;
  if (command.type === "reschedule") {
    let start: number;
    try { const parsed = Temporal.Instant.from(command.startUtc); start = parsed.epochMilliseconds; requireAppointment(parsed.epochNanoseconds === BigInt(start) * 1000000n, "Ungültiges Zeitraster."); }
    catch { throw new AppointmentError("INVALID_INPUT", "Ungültiger Terminbeginn."); }
    requireAppointment(start === a.startAt.getTime() || start >= now, "Neuer Terminbeginn darf nicht in der Vergangenheit liegen.");
    if (start !== a.startAt.getTime()) { base.data.startAt = new Date(start); base.data.endAt = new Date(start + a.durationMinutes * 60000); base.changedFields.push("startAt", "endAt"); }
    patch = { meetingMode: command.meetingMode };
  } else patch = command.patch;
  requireAppointment(!!patch && typeof patch === "object" && !Array.isArray(patch) && Object.keys(patch).every(k => [...contactFields, ...meetingFields].includes(k as never)), "Nicht erlaubtes Detailfeld.");
  const contact = { firstName: a.firstName!, lastName: a.lastName!, email: a.email!, phone: a.phone!, address: a.address, remarks: a.remarks };
  for (const key of contactFields) if (Object.hasOwn(patch, key)) Object.assign(contact, { [key]: patch[key] });
  const validContact = validateCustomer(contact);
  for (const key of contactFields) if (validContact[key] !== a[key]) { Object.assign(base.data, { [key]: validContact[key] }); base.changedFields.push(key); }
  const mode = patch.meetingMode ?? a.meetingMode;
  requireAppointment(["IN_PERSON", "PHONE", "ONLINE"].includes(mode), "Konkreter Modus erforderlich.");
  const snapshot = mode !== a.meetingMode ? meetingSnapshot(a.service, mode) : Object.fromEntries(meetingFields.map(k => [k, a[k]])) as MeetingSnapshot;
  for (const key of meetingFields) if (Object.hasOwn(patch, key)) Object.assign(snapshot, { [key]: patch[key] });
  const validated = meetingSnapshot({ ...a.service, ...snapshot, phoneDirection: snapshot.phoneDirection ?? "ADVISOR_CALLS_CLIENT", active: true, allowedMeetingModes: [mode], meetingModePolicy: "FIXED" }, mode);
  for (const key of meetingFields) {
    if (Object.hasOwn(patch, key)) requireAppointment(patch[key] === validated[key], "Meetingfeld passt nicht zum gewählten Modus.");
    if (validated[key] !== a[key]) { Object.assign(base.data, { [key]: validated[key] }); base.changedFields.push(key); }
  }
  return { ...base, noOp: base.changedFields.length === 0, calendarChanged: base.changedFields.some(k => ["startAt", "endAt", ...meetingFields].includes(k)), resourceCheck: true };
}
