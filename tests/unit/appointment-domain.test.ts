import { describe, expect, it } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { appointmentSummary, createAppointment, meetingSnapshot, normalizeEmail, validateCustomer, validateGuests, type Customer } from "@/modules/appointments/domain/appointment";
import { generateManagementToken } from "@/modules/appointments/infrastructure/management-token";
import { validateBookingSelection } from "@/modules/profiles/domain/selection";
import type { MeetingMode } from "@/modules/profiles/domain/model";
import { profile, relation, service } from "../fixtures/catalog";

const customer: Customer = { firstName: "Test", lastName: "Customer", email: "customer@example.test", phone: "+1 202 555 0123", address: null, remarks: null };
const profiles = () => [{ profile: profile(), services: [service()] }, { profile: profile({ id: "p2" }), services: [service({ id: "s2", advisorProfileId: "p2" })] }];
describe("AF-11 customer and guest validation", () => {
  it.each([
    { firstName: " " }, { firstName: "x".repeat(101) }, { lastName: "" }, { lastName: "x".repeat(101) },
    { email: "invalid" }, { email: "x".repeat(250) + "@example.test" }, { phone: "" }, { phone: "x" }, { phone: "1".repeat(33) },
    { address: "x".repeat(501) }, { remarks: "x".repeat(2001) },
  ])("rejects invalid customer field %j", patch => expect(() => validateCustomer({ ...customer, ...patch })).toThrow());
  it("accepts exact boundaries and treats text as data", () => {
    expect(validateCustomer({ ...customer, firstName: "x".repeat(100), lastName: "x".repeat(100), email: "x".repeat(241) + "@example.test", phone: "1".repeat(32), address: "a".repeat(500), remarks: "r".repeat(2000) }).firstName.length).toBe(100);
    expect(validateCustomer({ ...customer, remarks: "<b>text</b>" }).remarks).toBe("<b>text</b>");
  });
  it("trims values, lowercases only the email domain, preserves aliases", () => {
    expect(validateCustomer({ ...customer, firstName: " Test ", email: " Case+tag@EXAMPLE.TEST ", address: "  ", remarks: " text " })).toMatchObject({ firstName: "Test", email: "Case+tag@example.test", address: null, remarks: "text" });
    expect(normalizeEmail("A.B+tag@example.test")).toBe("A.B+tag@example.test");
  });
  it("accepts zero or ten guests", () => {
    expect(validateGuests([], customer.email, [])).toEqual([]);
    expect(validateGuests(Array.from({ length: 10 }, (_, i) => `guest${i}@example.test`), customer.email, [])).toHaveLength(10);
  });
  it.each([
    Array.from({ length: 11 }, (_, i) => `g${i}@example.test`), ["a@example.test", "a@EXAMPLE.TEST"], [customer.email], ["advisor@example.test"], ["bad"],
  ])("rejects invalid guest list %#", (...input) => {
    // Vitest spreads array cases: reconstruct the email list.
    expect(() => validateGuests(input as string[], customer.email, ["advisor@example.test"])).toThrow();
  });
});
describe("AF-03 final participant validation", () => {
  it("accepts primary once and direct optional participant, sorting resources", () => expect(validateBookingSelection("p1", "s1", ["p2", "p1"], profiles(), [relation()]).participants.map(p => p.id)).toEqual(["p1", "p2"]));
  it.each([["p1", "p1"], ["p2"], ["p1", "foreign"]])("rejects malformed selection %#", (...ids) => expect(() => validateBookingSelection("p1", "s1", ids as string[], profiles(), [relation()])).toThrow());
  it("requires hidden mandatory participants", () => {
    const required = relation({ proposedToClient: false, defaultSelected: true, clientCanRemove: false });
    expect(() => validateBookingSelection("p1", "s1", ["p1"], profiles(), [required])).toThrow();
    expect(validateBookingSelection("p1", "s1", ["p1", "p2"], profiles(), [required]).participants).toHaveLength(2);
  });
  it.each([relation({ active: false }), relation({ proposedToClient: false }), relation({ sourceProfileId: "p3" })])("rejects inactive, unoffered or recursive relation %#", rel => expect(() => validateBookingSelection("p1", "s1", ["p1", "p2"], profiles(), [rel])).toThrow());
  it("rejects inactive participant, primary, service and wrong service owner", () => {
    const data = profiles(); data[1].profile.status = "INACTIVE";
    expect(() => validateBookingSelection("p1", "s1", ["p1", "p2"], data, [relation()])).toThrow();
    data[0].profile.status = "DRAFT"; expect(() => validateBookingSelection("p1", "s1", ["p1"], data, [])).toThrow();
    expect(() => validateBookingSelection("p1", "s2", ["p1", "p2"], profiles(), [relation()])).toThrow();
    const inactive = profiles(); inactive[0].services[0].active = false; expect(() => validateBookingSelection("p1", "s1", ["p1"], inactive, [])).toThrow();
  });
});
describe("AF-24/30 meeting snapshots", () => {
  it("FIXED phone snapshot clears unrelated fields", () => expect(meetingSnapshot(service(), "PHONE")).toEqual({ meetingMode: "PHONE", phoneDirection: "ADVISOR_CALLS_CLIENT", advisorPhone: null, placeName: null, visitAddress: null, onlineUrl: null, onlineProvider: null }));
  it("accepts a configured concrete choice", () => {
    const s = service({ meetingModePolicy: "CLIENT_CHOICE", allowedMeetingModes: ["PHONE", "ONLINE"], onlineUrl: "https://example.test/meeting", onlineProvider: "Manual" });
    expect(meetingSnapshot(s, "ONLINE")).toMatchObject({ onlineUrl: s.onlineUrl, phoneDirection: null });
  });
  it.each(["CLIENT_CHOICE", "OTHER", "ONLINE"])("rejects unoffered concrete mode %s", mode => expect(() => meetingSnapshot(service(), mode as MeetingMode)).toThrow());
  it("requires in-person location and snapshots only it", () => {
    const s = service({ allowedMeetingModes: ["IN_PERSON"], placeName: "Office", visitAddress: "Example street 1" });
    expect(meetingSnapshot(s, "IN_PERSON")).toMatchObject({ placeName: "Office", phoneDirection: null });
    expect(() => meetingSnapshot({ ...s, visitAddress: null }, "IN_PERSON")).toThrow();
  });
  it("requires advisor number only when client calls", () => {
    expect(() => meetingSnapshot(service({ phoneDirection: "CLIENT_CALLS_ADVISOR" }), "PHONE")).toThrow();
    expect(meetingSnapshot(service({ phoneDirection: "CLIENT_CALLS_ADVISOR", advisorPhone: "+44 20 1234 5678" }), "PHONE").advisorPhone).toBe("+44 20 1234 5678");
  });
  it.each(["http://example.test/", "https://user:pass@example.test/"])("rejects unsafe online URL %s", onlineUrl => expect(() => meetingSnapshot(service({ allowedMeetingModes: ["ONLINE"], onlineProvider: "Manual", onlineUrl }), "ONLINE")).toThrow());
});
describe("AF-13 identity and creation invariants", () => {
  it("generates 256-bit tokens and SHA-256 hashes without logging raw values", () => {
    const a = generateManagementToken(), b = generateManagementToken();
    expect(Buffer.from(a.raw, "base64url").length).toBe(32);
    expect(a.raw !== b.raw && a.hash !== a.raw).toBe(true);
    expect(createHash("sha256").update(a.raw).digest("hex") === a.hash).toBe(true);
  });
  it("creates CONFIRMED with server snapshots and zero versions, never includes raw token in reads", () => {
    const token = generateManagementToken();
    const appointment = createAppointment({ id: randomUUID(), calendarUid: randomUUID(), tokenHash: token.hash, start: Date.parse("2026-10-05T07:00:00Z"), primaryId: "p1", service: service(), participants: [profile()], mode: "PHONE", customer, guests: [] });
    expect(appointment).toMatchObject({ status: "CONFIRMED", calendarSequence: 0, version: 0, durationMinutes: 30, serviceName: "Beratung" });
    expect(appointment.endAt.getTime() - appointment.startAt.getTime()).toBe(1800000);
    expect(appointment.managementTokenExpiresAt.getTime()).toBe(appointment.endAt.getTime());
    expect(JSON.stringify(appointment).includes(token.raw)).toBe(false);
    expect(Object.keys(appointmentSummary(appointment)).sort()).toEqual(["appointmentId", "startUtc", "endUtc", "status"].sort());
  });
});
