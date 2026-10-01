import { describe, expect, it } from "vitest";
import { addCalendarMonths, retentionDeadline, retentionDue } from "@/modules/privacy/domain/retention";
describe("Berlin calendar retention deadlines", () => {
  it("clamps leap day to the last day of February", () => {
    expect(addCalendarMonths(new Date("2024-02-29T11:00:00Z"), 12).toISOString()).toBe("2025-02-28T11:00:00.000Z");
  });
  it("uses the later autumn instant and advances a spring gap", () => {
    expect(addCalendarMonths(new Date("2026-04-25T00:30:00Z"), 6).toISOString()).toBe("2026-10-25T01:30:00.000Z");
    expect(addCalendarMonths(new Date("2025-09-29T00:30:00Z"), 6).toISOString()).toBe("2026-03-29T01:30:00.000Z");
  });
  it.each(["CONFIRMED", "COMPLETED", "NO_SHOW"])("keeps %s data until exactly twelve months after end", status => {
    const a = { status, endAt: new Date("2025-01-01T12:00:00Z"), cancelledAt: null };
    const deadline = Date.parse("2026-01-01T12:00:00Z");
    expect(retentionDue(a, deadline - 1)).toBe(false); expect(retentionDue(a, deadline)).toBe(true);
  });
  it("uses cancellation time, not scheduled end, for six months", () => {
    expect(retentionDeadline({ status: "CANCELLED", endAt: new Date("2026-07-01"), cancelledAt: new Date("2026-01-01T12:00:00Z") })?.toISOString()).toBe("2026-07-01T11:00:00.000Z");
  });
  it("does not invent a cancellation timestamp or unknown lifecycle policy", () => {
    expect(retentionDeadline({ status: "CANCELLED", endAt: new Date(), cancelledAt: null })).toBeNull();
    expect(retentionDeadline({ status: "UNKNOWN", endAt: new Date(), cancelledAt: null })).toBeNull();
  });
});
