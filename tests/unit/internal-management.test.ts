import { describe, expect, it } from "vitest";
import { internalRange, planInternalChange, requireInternalAccess, requireInternalActor, type InternalAppointment } from "@/modules/appointments/domain/internal-management";
import { service } from "../fixtures/catalog";
const now = Date.parse("2027-01-01T00:00:00Z");
const a: InternalAppointment = { id: "a", serviceId: "s1", service: service(), serviceName: "Advice", durationMinutes: 30, startAt: new Date("2027-01-06T08:00:00Z"), endAt: new Date("2027-01-06T08:30:00Z"), status: "CONFIRMED", version: 0, calendarSequence: 0,
  firstName: "Test", lastName: "Customer", email: "customer@example.test", phone: "123", address: null, remarks: null, meetingMode: "PHONE", phoneDirection: "ADVISOR_CALLS_CLIENT", placeName: null, visitAddress: null, advisorPhone: null, onlineUrl: null, onlineProvider: null,
  participants: [{ advisorProfileId: "p1", profileName: "Test Advisor", profileTitle: "Advisor", notificationEmail: "advisor@example.test" }], guests: [{ email: "guest@example.test", source: "CUSTOMER" }] };
describe("internal authorization and calendar windows", () => {
 it.each([null, { active: false, role: "ADMIN", profileId: null }, { active: true, role: "UNKNOWN", profileId: null }])("rejects inactive or unknown actors", actor => expect(() => requireInternalActor(actor)).toThrow());
 it("requires actual participation for advisors", () => { expect(() => requireInternalAccess({ active: true, role: "ADVISOR", profileId: "p2" }, a)).toThrow(); expect(() => requireInternalAccess({ active: true, role: "ADVISOR", profileId: "p1" }, a)).not.toThrow(); });
 it.each([["2027-03-28", 23], ["2027-10-31", 25]])("uses actual DST day length on %s", (date, hours) => { const range = internalRange(String(date), "day"); expect(range.to.getTime() - range.from.getTime()).toBe(Number(hours) * 3600000); });
 it("starts a Berlin week on Monday and month on its first day", () => { expect(internalRange("2027-01-06", "week").from.toISOString()).toBe("2027-01-03T23:00:00.000Z"); expect(internalRange("2027-01-06", "month").to.toISOString()).toBe("2027-01-31T23:00:00.000Z"); });
});
describe("internal event matrix", () => {
 it("metadata changes version but not calendar", () => { const p = planInternalChange(a, { type: "details", version: 0, patch: { phone: "456" } }, now); expect(p.calendarChanged).toBe(false); expect(p.changedFields).toEqual(["phone"]); expect(p.resourceCheck).toBe(true); });
 it("multiple calendar changes produce one boolean sequence increment", () => { const p = planInternalChange(a, { type: "details", version: 0, patch: { phoneDirection: "CLIENT_CALLS_ADVISOR", advisorPhone: "456" } }, now); expect(p.calendarChanged).toBe(true); expect(p.changedFields).toHaveLength(2); });
 it("preserves snapshot for time-only changes after service deactivation", () => { const p = planInternalChange({ ...a, service: { ...a.service, active: false } }, { type: "reschedule", version: 0, startUtc: "2027-01-07T08:00:00Z", meetingMode: "PHONE" }, now); expect(p.changedFields).toEqual(["startAt", "endAt"]); });
 it("cannot choose a mode no longer offered", () => expect(() => planInternalChange(a, { type: "details", version: 0, patch: { meetingMode: "ONLINE", onlineProvider: "Video", onlineUrl: "https://video.example.test" } }, now)).toThrow());
 it.each(["email", "serviceId", "durationMinutes", "participants", "managementTokenHash"])("rejects immutable field %s", field => expect(() => planInternalChange(a, { type: "details", version: 0, patch: { [field]: "forbidden" } }, now)).toThrow());
 it("guest set reordering is not a business change", () => expect(planInternalChange(a, { type: "guests", version: 0, emails: ["guest@example.test"] }, now).noOp).toBe(true));
 it("resend never changes calendar or revalidates slot", () => { const p = planInternalChange(a, { type: "resend", version: 0 }, now); expect(p.calendarChanged).toBe(false); expect(p.resourceCheck).toBe(false); expect(p.noOp).toBe(false); });
 it("outcome requires end and repeated outcome is a no-op", () => { expect(() => planInternalChange(a, { type: "outcome", version: 0, status: "COMPLETED" }, a.endAt.getTime() - 1)).toThrow(); expect(planInternalChange(a, { type: "outcome", version: 0, status: "COMPLETED" }, a.endAt.getTime()).calendarChanged).toBe(false); expect(planInternalChange({ ...a, status: "COMPLETED", version: 1 }, { type: "outcome", version: 0, status: "COMPLETED" }, a.endAt.getTime()).noOp).toBe(true); });
 it("rejects fake outcome and stale mutation versions", () => { expect(() => planInternalChange(a, { type: "outcome", version: 0, status: "CONFIRMED" } as never, now)).toThrow(); expect(() => planInternalChange(a, { type: "cancel", version: 1 }, now)).toThrow(); });
 it("does not normalize a submillisecond start into a valid slot", () => expect(() => planInternalChange(a, { type: "reschedule", version: 0, startUtc: "2027-01-07T08:00:00.000001Z", meetingMode: "PHONE" }, now)).toThrow());
});
