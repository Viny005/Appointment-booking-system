import { describe, expect, it } from "vitest";
import { bookingWindow, commonDay, dayBounds, effectiveDay, intersect, mergeProposal, normalize, overlaps, possibleInstants, slots, subtract, toUtc, validateException, type ExceptionRule, type Schedule } from "@/modules/availability/domain/engine";
import { instant, localDate, localTime, range, timeRange, weekday } from "@/modules/availability/domain/values";

const d = localDate("2026-10-05");
const now = instant("2026-10-01T00:00:00Z");
const r = timeRange;
const schedule = (ranges = [r("08:00", "12:00")]): Schedule => ({ version: 0, weekly: ranges.map(x => ({ ...x, weekday: 1 })), exceptions: [] });
const exception = (type: ExceptionRule["type"], ranges = [] as ExceptionRule["ranges"], startDate = d, endDate = d): ExceptionRule => ({ id: "e", type, ranges, startDate, endDate, active: true, version: 0 });

describe("AF-09/10 local values and explicit merge proposals", () => {
  it.each(["2026-02-29", "2026-13-01", "2026-04-31", "26-01-01", "0000-01-01"])("rejects date %s", value => expect(() => localDate(value)).toThrow());
  it.each(["24:00", "12:60", "-1:00", "2:30", "02:30:01"])("rejects local time %s", value => expect(() => localTime(value)).toThrow());
  it.each([[600, 600], [601, 600], [1380, 60], [-1, 100], [0, 1441], [0.5, 1]])("rejects invalid interval %i/%i", (a, b) => expect(() => range(a, b)).toThrow());
  it("allows an exclusive midnight end", () => expect(r("23:00", "24:00")).toEqual({ start: 1380, end: 1440 }));
  it("keeps disjoint ranges", () => expect(mergeProposal([r("08:00", "10:00"), r("11:00", "13:00")])).toEqual({ required: false, ranges: [r("08:00", "10:00"), r("11:00", "13:00")] }));
  it("detects overlap and proposes connected union", () => {
    expect(overlaps(r("08:00", "10:00"), r("09:00", "12:00"))).toBe(true);
    expect(mergeProposal([r("08:00", "10:00"), r("09:00", "12:00")])).toEqual({ required: true, ranges: [r("08:00", "12:00")] });
  });
  it("adjacency is conflict-free for occupancy but mergeable when editing", () => {
    expect(overlaps(r("08:00", "10:00"), r("10:00", "12:00"))).toBe(false);
    expect(mergeProposal([r("08:00", "10:00"), r("10:00", "12:00")])).toEqual({ required: true, ranges: [r("08:00", "12:00")] });
  });
  it("merges chains without filling separate gaps or mutating input", () => {
    const input = [r("08:00", "10:00"), r("11:00", "13:00"), r("09:30", "11:30"), r("15:00", "16:00")];
    expect(mergeProposal(input).ranges).toEqual([r("08:00", "13:00"), r("15:00", "16:00")]); expect(input).toHaveLength(4);
  });
});
describe("AF-04/05/06 effective availability", () => {
  it("replacement overrides the complete weekly day", () => expect(effectiveDay({ ...schedule(), exceptions: [exception("REPLACE_DAY", [r("14:00", "16:00")])] }, d)).toEqual([r("14:00", "16:00")]));
  it("empty replacement closes the day", () => expect(effectiveDay({ ...schedule(), exceptions: [exception("REPLACE_DAY")] }, d)).toEqual([]));
  it("adds after replacement and normalizes", () => expect(effectiveDay({ ...schedule(), exceptions: [exception("REPLACE_DAY", [r("14:00", "16:00")]), exception("ADD_INTERVAL", [r("15:00", "18:00")])] }, d)).toEqual([r("14:00", "18:00")]));
  it("adds to weekly and ignores inactive exceptions", () => expect(effectiveDay({ ...schedule(), exceptions: [exception("ADD_INTERVAL", [r("14:00", "16:00")]), { ...exception("BLOCK_DAY"), active: false }] }, d)).toEqual([r("08:00", "12:00"), r("14:00", "16:00")]));
  it("block wins over replacement and addition", () => expect(effectiveDay({ ...schedule(), exceptions: [exception("REPLACE_DAY", [r("14:00", "16:00")]), exception("ADD_INTERVAL", [r("18:00", "19:00")]), exception("BLOCK_DAY")] }, d)).toEqual([]));
  it.each(["2026-12-20", "2026-12-25", "2026-12-31"])("inclusive block includes %s", day => {
    const date = localDate(day); const s = schedule(); s.weekly[0].weekday = weekday(date);
    s.exceptions = [exception("BLOCK_DAY", [], localDate("2026-12-20"), localDate("2026-12-31"))]; expect(effectiveDay(s, date)).toEqual([]);
  });
  it("day after block remains available", () => {
    const date = localDate("2027-01-01"), s = schedule(); s.weekly[0].weekday = 5;
    s.exceptions = [exception("BLOCK_DAY", [], localDate("2026-12-20"), localDate("2026-12-31"))]; expect(effectiveDay(s, date)).toEqual([r("08:00", "12:00")]);
  });
  it("rejects duplicate replacements", () => expect(() => effectiveDay({ ...schedule(), exceptions: [exception("REPLACE_DAY"), exception("REPLACE_DAY")] }, d)).toThrow());
  it("validates exception shapes", () => {
    expect(() => validateException(exception("ADD_INTERVAL"))).toThrow();
    expect(() => validateException(exception("BLOCK_DAY", [r("08:00", "09:00")]))).toThrow();
    expect(() => validateException(exception("REPLACE_DAY", [], d, localDate("2026-10-06")))).toThrow();
    expect(() => validateException(exception("BLOCK_DAY", [], localDate("2026-10-06"), d))).toThrow();
  });
  it("intersects only the supplied advisors", () => expect(commonDay([schedule(), schedule([r("10:00", "14:00")])], d)).toEqual(toUtc(d, [r("10:00", "12:00")])));
  it("empty intersection has no slots", () => expect(slots(d, commonDay([schedule(), schedule([r("14:00", "16:00")])], d), 30, now)).toEqual([]));
  it("subtracts full and partial occupancy with half-open adjacency", () => {
    expect(subtract([{ start: 0, end: 100 }], [{ start: 0, end: 100 }])).toEqual([]);
    expect(subtract([{ start: 0, end: 100 }], [{ start: 20, end: 50 }])).toEqual([{ start: 0, end: 20 }, { start: 50, end: 100 }]);
    expect(subtract([{ start: 100, end: 200 }], [{ start: 0, end: 100 }])).toEqual([{ start: 100, end: 200 }]);
    expect(subtract([{ start: 0, end: 100 }], [{ start: 20, end: 50 }, { start: 40, end: 80 }])).toEqual([{ start: 0, end: 20 }, { start: 80, end: 100 }]);
  });
  it("intersection and normalization do not mutate callers", () => { const a = [{ start: 0, end: 10 }]; expect(intersect(a, [{ start: 5, end: 20 }])).toEqual([{ start: 5, end: 10 }]); normalize(a); expect(a[0].end).toBe(10); });
});
describe("AF-07/08 slots and booking window", () => {
  it("fits entire duration and defaults to 30-minute grid", () => expect(slots(d, toUtc(d, [r("09:00", "12:00")]), 60, now).map(s => s.localTime)).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]));
  it.each([[15, 4], [30, 2], [60, 1]])("grid %i anchored at midnight", (step, count) => expect(slots(d, toUtc(d, [r("09:07", "10:15")]), 15, now, step)).toHaveLength(count));
  it.each([0, 10, 45, 90])("rejects grid %i", step => expect(() => slots(d, [], 30, now, step)).toThrow());
  it.each([0, 481, 1.5])("rejects duration %i", duration => expect(() => slots(d, [], duration, now)).toThrow());
  it("does not bridge an occupied minute or a gap", () => {
    expect(slots(d, toUtc(d, [r("09:00", "09:29"), r("09:30", "09:59")]), 30, now)).toEqual([]);
  });
  it("accepts exactly 24 elapsed hours and rejects one millisecond less", () => {
    const free = toUtc(d, [r("09:00", "10:00")]), boundaryNow = free[0].start - 86400000;
    expect(slots(d, free, 60, boundaryNow)).toHaveLength(1); expect(slots(d, free, 60, boundaryNow + 1)).toHaveLength(0);
  });
  it("uses calendar months with month-end clamp, inclusive maximum start", () => {
    const reference = instant("2026-01-31T09:00:00Z"), date = localDate("2026-04-30");
    expect(bookingWindow(reference).end).toBe(instant("2026-04-30T08:00:00Z"));
    expect(slots(date, toUtc(date, [r("10:00", "11:00")]), 30, reference).map(s => s.localTime)).toEqual(["10:00"]);
  });
});
describe("QS-06/QS-12 Berlin DST", () => {
  it("spring 02:30 does not exist and creates no slot", () => {
    const date = localDate("2026-03-29"); expect(possibleInstants(date, 150)).toEqual([]);
    expect(slots(date, toUtc(date, [r("01:00", "04:00")]), 30, instant("2026-03-01T00:00:00Z")).map(s => s.localTime)).toEqual(["01:00", "01:30", "03:00", "03:30"]);
    expect(toUtc(date, [r("02:00", "03:00")])).toEqual([]);
  });
  it("autumn 02:30 has two distinct UTC instants and offsets", () => {
    const date = localDate("2026-10-25");
    const repeated = slots(date, toUtc(date, [r("02:00", "03:00")]), 30, now).filter(s => s.localTime === "02:30");
    expect(repeated.map(s => [s.startUtc, s.offset])).toEqual([["2026-10-25T00:30:00Z", "+02:00"], ["2026-10-25T01:30:00Z", "+01:00"]]);
  });
  it("partial repeated interval does not bridge unavailable wall times", () => {
    const date = localDate("2026-10-25"), free = toUtc(date, [r("02:15", "02:45")]);
    expect(free).toHaveLength(2); expect(free.map(i => i.end - i.start)).toEqual([1800000, 1800000]);
    expect(slots(date, free, 45, now, 15)).toEqual([]);
  });
  it.each([
    ["2026-03-28T11:00:00Z", "2026-03-29", "13:00"],
    ["2026-10-24T10:00:00Z", "2026-10-25", "11:00"],
  ])("24h remains elapsed across DST from %s", (reference, day, first) => {
    const date = localDate(day), items = slots(date, toUtc(date, [r("08:00", "18:00")]), 30, instant(reference));
    expect(items[0].localTime).toBe(first); expect(instant(items[0].startUtc) - instant(reference)).toBe(86400000);
  });
  it("day lengths follow timezone data, durations are elapsed", () => {
    expect(dayBounds(localDate("2026-03-29")).end - dayBounds(localDate("2026-03-29")).start).toBe(23 * 3600000);
    expect(dayBounds(localDate("2026-10-25")).end - dayBounds(localDate("2026-10-25")).start).toBe(25 * 3600000);
    const date = localDate("2026-10-25"); const item = slots(date, toUtc(date, [r("01:00", "04:00")]), 120, now)[0];
    expect(instant(item.endUtc) - instant(item.startUtc)).toBe(120 * 60000);
  });
});
