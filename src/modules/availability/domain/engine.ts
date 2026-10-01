import { Temporal } from "@js-temporal/polyfill";
import { TIME_ZONE, ensure, range, utcRange, localDate, weekday, type LocalDate, type LocalTimeRange, type InstantInterval, type Slot } from "./values";

export type ExceptionType = "BLOCK_DAY" | "REPLACE_DAY" | "ADD_INTERVAL";
export type WeeklyRule = LocalTimeRange & { weekday: number };
export type ExceptionRule = { id: string; type: ExceptionType; startDate: LocalDate; endDate: LocalDate; active: boolean; ranges: LocalTimeRange[]; version: number };
export type Schedule = { version: number; weekly: WeeklyRule[]; exceptions: ExceptionRule[] };
export function normalize<T extends InstantInterval>(ranges: T[]): InstantInterval[] {
  const result: InstantInterval[] = [];
  for (const r of [...ranges].sort((a, b) => a.start - b.start)) {
    utcRange(r.start, r.end);
    const last = result.at(-1);
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
    else result.push({ start: r.start, end: r.end });
  }
  return result;
}
export function mergeProposal(ranges: LocalTimeRange[]) {
  ranges.forEach(r => range(r.start, r.end));
  const normalized = normalize(ranges);
  return { required: normalized.length !== ranges.length, ranges: normalized };
}
export function overlaps(a: InstantInterval, b: InstantInterval) { return a.start < b.end && b.start < a.end; }
export function intersect(a: InstantInterval[], b: InstantInterval[]): InstantInterval[] {
  const left = normalize(a), right = normalize(b), result: InstantInterval[] = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    const start = Math.max(left[i].start, right[j].start), end = Math.min(left[i].end, right[j].end);
    if (start < end) result.push({ start, end });
    if (left[i].end < right[j].end) i++; else j++;
  }
  return result;
}
export function subtract(free: InstantInterval[], occupied: InstantInterval[]): InstantInterval[] {
  let result = normalize(free);
  for (const busy of normalize(occupied)) result = result.flatMap(r => !overlaps(r, busy) ? [r] : [
    ...(r.start < busy.start ? [{ start: r.start, end: busy.start }] : []),
    ...(busy.end < r.end ? [{ start: busy.end, end: r.end }] : []),
  ]);
  return result;
}
export function validateException(rule: Omit<ExceptionRule, "id" | "version">) {
  localDate(rule.startDate); localDate(rule.endDate);
  ensure(["BLOCK_DAY", "REPLACE_DAY", "ADD_INTERVAL"].includes(rule.type), "Ungültige Ausnahmeart.");
  ensure(typeof rule.active === "boolean" && rule.startDate <= rule.endDate, "Ungültige Ausnahme.");
  ensure(rule.type === "BLOCK_DAY" || rule.startDate === rule.endDate, "Nur Blockierungen dürfen mehrere Tage umfassen.");
  ensure(Array.isArray(rule.ranges), "Intervallliste erwartet.");
  rule.ranges.forEach(r => range(r.start, r.end));
  ensure(rule.type !== "BLOCK_DAY" || rule.ranges.length === 0, "Tagesblock enthält keine Zeitintervalle.");
  ensure(rule.type !== "ADD_INTERVAL" || rule.ranges.length > 0, "Ergänzung benötigt Intervalle.");
}
export function effectiveDay(schedule: Schedule, date: LocalDate): LocalTimeRange[] {
  const rules = schedule.exceptions.filter(r => r.active && r.startDate <= date && r.endDate >= date);
  if (rules.some(r => r.type === "BLOCK_DAY")) return [];
  const replacements = rules.filter(r => r.type === "REPLACE_DAY");
  ensure(replacements.length <= 1, "Mehrere Ersatzsätze für denselben Tag.");
  const base = replacements[0]?.ranges ?? schedule.weekly.filter(r => r.weekday === weekday(date));
  return normalize([...base, ...rules.filter(r => r.type === "ADD_INTERVAL").flatMap(r => r.ranges)]);
}
function wall(date: LocalDate, minutes: number) {
  return Temporal.PlainDate.from(date).toPlainDateTime("00:00").add({ minutes });
}
export function possibleInstants(date: LocalDate, minutes: number): number[] {
  const local = wall(date, minutes);
  // Round-trip rejects spring gaps; earlier/later enumerate both autumn occurrences.
  return [...new Set((["earlier", "later"] as const).map(disambiguation => local.toZonedDateTime(TIME_ZONE, { disambiguation }))
    .filter(z => z.toPlainDateTime().equals(local)).map(z => z.epochMilliseconds))];
}
export function dayBounds(date: LocalDate): InstantInterval {
  const d = Temporal.PlainDate.from(date);
  return { start: d.toZonedDateTime(TIME_ZONE).epochMilliseconds, end: d.add({ days: 1 }).toZonedDateTime(TIME_ZONE).epochMilliseconds };
}
export function toUtc(date: LocalDate, ranges: LocalTimeRange[]): InstantInterval[] {
  const bounds = dayBounds(date), result: InstantInterval[] = [];
  let cursor = bounds.start;
  // Temporal supplies transition instants and offsets; no hand-maintained DST calendar.
  while (cursor < bounds.end) {
    const zoned = Temporal.Instant.fromEpochMilliseconds(cursor).toZonedDateTimeISO(TIME_ZONE);
    const transition = zoned.getTimeZoneTransition("next");
    const end = Math.min(transition?.epochMilliseconds ?? bounds.end, bounds.end);
    for (const r of ranges) {
      range(r.start, r.end);
      const startUtc = wall(date, r.start).toZonedDateTime(zoned.offset).epochMilliseconds;
      const endUtc = wall(date, r.end).toZonedDateTime(zoned.offset).epochMilliseconds;
      const start = Math.max(cursor, startUtc), finish = Math.min(end, endUtc);
      if (start < finish) result.push({ start, end: finish });
    }
    cursor = end;
  }
  return normalize(result);
}
export function commonDay(schedules: Schedule[], date: LocalDate): InstantInterval[] {
  ensure(schedules.length > 0, "Mindestens ein tatsächlicher Teilnehmer erforderlich.");
  return schedules.map(s => toUtc(date, effectiveDay(s, date))).reduce(intersect);
}
export function bookingWindow(now: number) {
  const z = Temporal.Instant.fromEpochMilliseconds(now).toZonedDateTimeISO(TIME_ZONE);
  return { start: now + 24 * 60 * 60 * 1000, end: z.add({ months: 3 }, { overflow: "constrain" }).epochMilliseconds };
}
export function slots(date: LocalDate, free: InstantInterval[], duration: number, now: number, step = 30, minimumLeadMilliseconds = 86400000): Slot[] {
  ensure(Number.isInteger(duration) && duration >= 1 && duration <= 480, "Dauer muss 1–480 Minuten sein.");
  ensure([15, 30, 60].includes(step), "Raster muss 15, 30 oder 60 Minuten sein.");
  ensure([0, 86400000].includes(minimumLeadMilliseconds), "Ungültige Vorlaufpolitik.");
  const window = { ...bookingWindow(now), start: now + minimumLeadMilliseconds }, intervals = normalize(free), result: Slot[] = [];
  for (let minute = 0; minute < 1440; minute += step) for (const start of possibleInstants(date, minute)) {
    const end = start + duration * 60000;
    if (start < window.start || start > window.end || !intervals.some(r => r.start <= start && end <= r.end)) continue;
    const z = Temporal.Instant.fromEpochMilliseconds(start).toZonedDateTimeISO(TIME_ZONE);
    result.push({ startUtc: z.toInstant().toString(), endUtc: Temporal.Instant.fromEpochMilliseconds(end).toString(),
      localDate: date, localTime: z.toPlainTime().toString({ smallestUnit: "minute" }), offset: z.offset, timeZone: TIME_ZONE });
  }
  return result.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}
