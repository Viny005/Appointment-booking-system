import { Temporal } from "@js-temporal/polyfill";
export type RetentionSource = { status: string; endAt: Date; cancelledAt: Date | null };
export type RetentionPolicy = { endedMonths: number; cancelledMonths: number };
export const defaultRetentionPolicy: RetentionPolicy = { endedMonths: 12, cancelledMonths: 6 };
export function addCalendarMonths(value: Date, months: number): Date {
  const local = Temporal.Instant.fromEpochMilliseconds(value.getTime()).toZonedDateTimeISO("Europe/Berlin").toPlainDateTime();
  // At an ambiguous deadline choose the later instant, consistently with PostgreSQL AT TIME ZONE.
  return new Date(local.add({ months }, { overflow: "constrain" }).toZonedDateTime("Europe/Berlin", { disambiguation: "later" }).epochMilliseconds);
}
export function retentionDeadline(a: RetentionSource, policy = defaultRetentionPolicy): Date | null {
  if (a.status === "CANCELLED") return a.cancelledAt ? addCalendarMonths(a.cancelledAt, policy.cancelledMonths) : null;
  return ["CONFIRMED", "COMPLETED", "NO_SHOW"].includes(a.status) ? addCalendarMonths(a.endAt, policy.endedMonths) : null;
}
export function retentionDue(a: RetentionSource, now: number, policy = defaultRetentionPolicy) { const deadline = retentionDeadline(a, policy); return deadline !== null && deadline.getTime() <= now; }
