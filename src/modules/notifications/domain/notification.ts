import type { MeetingSnapshot } from "@/modules/appointments/domain/appointment";
import { normalizeEmail, requireAppointment } from "@/modules/appointments/domain/appointment";
export type NotificationType = "BOOKING_CONFIRMATION" | "BOOKING_CHANGED" | "BOOKING_CANCELLED" | "REMINDER" | "PASSWORD_RESET";
export type Recipient = { email: string; category: "CUSTOMER" | "ADVISOR" | "GUEST" | "USER"; advisorProfileId: string | null };
export type CalendarProjection = { uid: string; sequence: number; startUtc: string; endUtc: string; summary: string; description: string; location: string };
export type NotificationPayload = { calendar: CalendarProjection | null; method: "REQUEST" | "CANCEL" | null; guestSource: "CUSTOMER" | "INTERNAL" | null; text: string };
export type AppointmentMailSource = MeetingSnapshot & { id: string; calendarUid: string; calendarSequence: number; startAt: Date; endAt: Date; serviceName: string; email: string | null };
export const RETRY_MINUTES = [1, 5, 30, 120, 360] as const;
export function retryAt(attempts: number, now: number): Date | null {
  requireAppointment(Number.isInteger(attempts) && attempts > 0, "Ungueltiger Versuch.");
  return attempts <= RETRY_MINUTES.length ? new Date(now + RETRY_MINUTES[attempts - 1] * 60000) : null;
}
export function reminderAt(start: Date, now: number): Date | null { const due = start.getTime() - 86400000; return due > now ? new Date(due) : null; }
export function recipients(customer: string, advisors: { id: string; email: string }[], guests: string[]): Recipient[] {
  const all: Recipient[] = [{ email: normalizeEmail(customer), category: "CUSTOMER", advisorProfileId: null },
    ...advisors.map(a => ({ email: normalizeEmail(a.email), category: "ADVISOR" as const, advisorProfileId: a.id })),
    ...guests.map(email => ({ email: normalizeEmail(email), category: "GUEST" as const, advisorProfileId: null }))];
  return [...new Map(all.reverse().map(r => [r.email, r])).values()].reverse();
}
export function calendarProjection(a: AppointmentMailSource): CalendarProjection {
  let description: string, location = "";
  switch (a.meetingMode) {
    case "IN_PERSON": location = [a.placeName, a.visitAddress].filter(Boolean).join(", "); description = "Termin vor Ort"; break;
    case "ONLINE": location = a.onlineUrl ?? ""; description = `Online-Termin: ${a.onlineProvider ?? ""}`; break;
    case "PHONE": description = a.phoneDirection === "CLIENT_CALLS_ADVISOR" ? `Bitte Berater anrufen: ${a.advisorPhone ?? ""}` : "Der Berater ruft die buchende Person an."; break;
  }
  return { uid: a.calendarUid, sequence: a.calendarSequence, startUtc: a.startAt.toISOString(), endUtc: a.endAt.toISOString(), summary: a.serviceName, description, location };
}
export function payloadFor(a: AppointmentMailSource, type: NotificationType, recipient: Recipient, method: "REQUEST" | "CANCEL" | null = "REQUEST", guestSource: "CUSTOMER" | "INTERNAL" = "CUSTOMER"): NotificationPayload {
  const labels: Record<NotificationType, string> = { BOOKING_CONFIRMATION: "Terminbestaetigung", BOOKING_CHANGED: "Termin aktualisiert", BOOKING_CANCELLED: "Termineinladung abgesagt", REMINDER: "Terminerinnerung", PASSWORD_RESET: "Passwort zuruecksetzen" };
  return { calendar: calendarProjection(a), method, text: labels[type], guestSource: recipient.category === "GUEST" && type === "BOOKING_CONFIRMATION" ? guestSource : null };
}
