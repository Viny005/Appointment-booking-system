import { normalizeEmail, requireAppointment } from "@/modules/appointments/domain/appointment";
import type { CalendarProjection } from "./notification";
const CRLF = String.fromCharCode(13, 10), slash = String.fromCharCode(92);
function text(value: string) {
  const normalized = value.split(CRLF).join(String.fromCharCode(10)); let result = "";
  for (const c of normalized) {
    const n = c.charCodeAt(0);
    if (n === 10 || n === 13) result += slash + "n";
    else if (c === slash || c === ";" || c === ",") result += slash + c;
    else if (n >= 32 && n !== 127) result += c;
  }
  return result;
}
function fold(line: string) {
  const encoder = new TextEncoder(); let current = "", bytes = 0; const lines: string[] = [];
  for (const char of line) { const length = encoder.encode(char).length; if (bytes + length > 75) { lines.push(current); current = " "; bytes = 1; } current += char; bytes += length; }
  lines.push(current); return lines.join(CRLF);
}
function utc(value: string) { const date = new Date(value); requireAppointment(Number.isFinite(date.getTime()), "Ungueltiges Kalenderdatum."); return date.toISOString().slice(0, 19).split("-").join("").split(":").join("") + "Z"; }
function mailto(email: string) { return "mailto:" + encodeURIComponent(normalizeEmail(email)).replace(/%40/g, "@"); }
export function renderIcs(p: CalendarProjection, method: "REQUEST" | "CANCEL", organizer: string, recipient: string, timestamp: Date) {
  requireAppointment(p.uid.length > 0 && Number.isInteger(p.sequence) && p.sequence >= 0 && Date.parse(p.endUtc) > Date.parse(p.startUtc), "Ungueltige Kalenderprojektion.");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Appointment Booking System//DE", "CALSCALE:GREGORIAN", `METHOD:${method}`, "BEGIN:VEVENT", `UID:${text(p.uid)}`, `DTSTAMP:${utc(timestamp.toISOString())}`, `SEQUENCE:${p.sequence}`, `DTSTART:${utc(p.startUtc)}`, `DTEND:${utc(p.endUtc)}`, `SUMMARY:${text(p.summary)}`, `DESCRIPTION:${text(p.description)}`, `LOCATION:${text(p.location)}`, `ORGANIZER:${mailto(organizer)}`, `ATTENDEE;RSVP=FALSE:${mailto(recipient)}`, `STATUS:${method === "CANCEL" ? "CANCELLED" : "CONFIRMED"}`, "TRANSP:OPAQUE", "END:VEVENT", "END:VCALENDAR"].map(fold).join(CRLF) + CRLF;
}
