import { Temporal } from "@js-temporal/polyfill";

export const TIME_ZONE = "Europe/Berlin";
export class AvailabilityError extends Error {
  constructor(public readonly code: "INVALID_INPUT" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "UNAVAILABLE", message: string) { super(message); }
}
export function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new AvailabilityError("INVALID_INPUT", message);
}
export type LocalDate = string & { readonly __date: unique symbol };
export type LocalTime = string & { readonly __time: unique symbol };
export type LocalTimeRange = { start: number; end: number }; // minutes since local midnight; end may be 1440
export type InstantInterval = { start: number; end: number }; // epoch milliseconds, [start,end)
export type Slot = { startUtc: string; endUtc: string; localDate: string; localTime: string; offset: string; timeZone: typeof TIME_ZONE };
export function localDate(value: string): LocalDate {
  ensure(typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value), "Datum als YYYY-MM-DD erwartet.");
  try { const d = Temporal.PlainDate.from(value, { overflow: "reject" }); ensure(d.year >= 1 && d.year <= 9999, "Datum außerhalb des Bereichs."); }
  catch { throw new AvailabilityError("INVALID_INPUT", "Ungültiges Kalenderdatum."); }
  return value as LocalDate;
}
export function localTime(value: string): LocalTime {
  ensure(typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value), "Uhrzeit als HH:mm erwartet.");
  return value as LocalTime;
}
export function minute(value: string): number { const t = localTime(value); return Number(t.slice(0, 2)) * 60 + Number(t.slice(3)); }
export function range(start: number, end: number): LocalTimeRange {
  ensure(Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end <= 1440 && start < end, "Zeitbereich muss innerhalb eines Tages liegen, Start vor Ende.");
  return { start, end };
}
export function timeRange(start: string, end: string): LocalTimeRange { return range(minute(start), end === "24:00" ? 1440 : minute(end)); }
export function instant(value: string): number {
  try { return Temporal.Instant.from(value).epochMilliseconds; }
  catch { throw new AvailabilityError("INVALID_INPUT", "UTC-Instant mit Offset erwartet."); }
}
export function utcRange(start: number, end: number): InstantInterval {
  ensure(Number.isSafeInteger(start) && Number.isSafeInteger(end) && start < end, "Ungültiges UTC-Intervall.");
  return { start, end };
}
export function weekday(date: LocalDate) { return Temporal.PlainDate.from(date).dayOfWeek; }
export function nextDate(date: LocalDate) { return localDate(Temporal.PlainDate.from(date).add({ days: 1 }).toString()); }
export function datesBetween(from: LocalDate, to: LocalDate): LocalDate[] {
  ensure(from <= to, "Datumsbereich ist umgekehrt.");
  ensure(Temporal.PlainDate.from(from).until(to).days <= 100, "Abfrage darf höchstens 101 Tage umfassen.");
  const days: LocalDate[] = [];
  for (let d = from; d <= to; d = nextDate(d)) days.push(d);
  return days;
}
