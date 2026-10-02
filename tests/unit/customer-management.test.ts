import { describe, expect, it, vi } from "vitest";
import { customerCanChange, customerView, requireCapability, validateCustomerCommand, type ManagedAppointment } from "@/modules/appointments/domain/customer-management";
import { customerHttp } from "@/modules/appointments/infrastructure/customer-http";
import type { CustomerManagement } from "@/modules/appointments/application/customer-management";
const a: ManagedAppointment = { id: "secret-id", startAt: new Date(86400001), endAt: new Date(90000000), status: "CONFIRMED", version: 0, serviceName: "Beratung", durationMinutes: 30, participantNames: ["Berater"], allowedModes: ["PHONE"], tokenExpiresAt: new Date(90000000), tokenRevokedAt: null, meetingMode: "PHONE", placeName: null, visitAddress: null, phoneDirection: "ADVISOR_CALLS_CLIENT", advisorPhone: null, onlineUrl: null, onlineProvider: null };
describe("customer capability policies", () => {
 it.each([[-1, true], [0, true], [1, false], [2, false]])("applies strict elapsed-time boundary at %i", (now, allowed) => expect(customerCanChange(a, now)).toBe(allowed));
 it.each(["CANCELLED", "COMPLETED", "NO_SHOW"] as const)("blocks terminal state %s", status => expect(customerCanChange({ ...a, status }, 0)).toBe(false));
 it("does not serialize identity or capability data", () => { const view = customerView(a, 0); expect(view).not.toHaveProperty("id"); expect(view).not.toHaveProperty("tokenExpiresAt"); });
 it("fails closed at expiry and on revocation", () => { expect(() => requireCapability(a, 90000000)).toThrow(); expect(() => requireCapability({ ...a, tokenRevokedAt: new Date(0) }, 0)).toThrow(); });
 it("canonicalizes command allowlist", () => expect(validateCustomerCommand({ type: "cancel", version: 0, email: "ignored" } as never)).toEqual({ type: "cancel", version: 0 }));
 it("rejects policy values where a concrete meeting mode is required", () => expect(() => validateCustomerCommand({ type: "reschedule", version: 0, startUtc: "2027-01-01T00:00:00Z", meetingMode: "CLIENT_CHOICE" } as never)).toThrow());
});
describe("capability HTTP boundary", () => {
 const read = vi.fn(async () => customerView(a, 0));
 const handler = customerHttp({ read } as unknown as CustomerManagement, "https://appointments.example.test");
 const request = (body: unknown, headers = {}) => new Request("https://appointments.example.test/api/customer-appointment", { method: "POST", headers: { origin: "https://appointments.example.test", "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
 it("enforces same configured origin before capability use", async () => expect((await handler(request({ action: "read" }, { origin: "https://evil.example.test" }))).status).toBe(403));
 it("rejects cross-site fetch despite matching origin", async () => expect((await handler(request({ action: "read" }, { "sec-fetch-site": "cross-site" }))).status).toBe(403));
 it("does not accept capability query strings via GET", async () => expect((await handler(new Request("https://appointments.example.test/api/customer-appointment?token=secret"))).status).toBe(405));
 it("limits streamed input before JSON parsing", async () => expect((await handler(request({ token: "x".repeat(9000) }))).status).toBe(413));
 it("sets no-store and no-referrer on successful responses", async () => { const response = await handler(request({ action: "read", token: "x".repeat(43) })); expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store"); expect(response.headers.get("referrer-policy")).toBe("no-referrer"); });
});
