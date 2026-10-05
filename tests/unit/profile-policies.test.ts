import { describe, expect, it } from "vitest";
import { assertPublishable, assertServiceChange, createProfile, normalizeProfile, normalizePublicAdvisorPresence, normalizeService, resolveMeetingMode, transitionProfile, validateRelation, validateService } from "@/modules/profiles/domain/policies";
import type { MeetingMode, ProfileDetails } from "@/modules/profiles/domain/model";
import { date, profile, profileDetails, relation, service, serviceDetails } from "../fixtures/catalog";

describe("profile lifecycle", () => {
  it("creates a draft without account or service", () => {
    const draft = createProfile("p", { name: "", title: "", shortDescription: "", notificationEmail: "", imageKey: null }, date);
    expect(draft.status).toBe("DRAFT"); expect(draft.userId).toBeNull();
  });
  it.each(["name", "title", "shortDescription", "notificationEmail", "imageKey"] as const)("requires %s for activation", field => {
    expect(() => assertPublishable({ profile: profile({ [field]: "" }), services: [service()] })).toThrow();
  });
  it("requires an active valid service", () => {
    for (const services of [[], [service({ active: false })], [service({ durationMinutes: 0 })]]) expect(() => assertPublishable({ profile: profile(), services })).toThrow();
  });
  it("activates a complete draft without a user", () => expect(transitionProfile({ profile: profile({ status: "DRAFT" }), services: [service()] }, "ACTIVE").status).toBe("ACTIVE"));
  it("deactivates ACTIVE without losing data", () => {
    const before = profile(); expect(transitionProfile({ profile: before, services: [service()] }, "INACTIVE")).toEqual({ ...before, status: "INACTIVE" });
  });
  it("revalidates reactivation", () => {
    const aggregate = { profile: profile({ status: "INACTIVE" }), services: [service()] };
    expect(transitionProfile(aggregate, "ACTIVE").status).toBe("ACTIVE");
    expect(() => transitionProfile({ ...aggregate, services: [] }, "ACTIVE")).toThrow();
  });
  it("cannot return to DRAFT or deactivate an unpublished draft", () => {
    expect(() => transitionProfile({ profile: profile(), services: [service()] }, "DRAFT" as "ACTIVE")).toThrow();
    expect(() => transitionProfile({ profile: profile({ status: "DRAFT" }), services: [] }, "INACTIVE")).toThrow();
  });
  it("protects the last active service", () => expect(() => assertServiceChange({ profile: profile(), services: [service()] }, service({ active: false }))).toThrow(/mindestens/));
  it("allows last-service deactivation after explicit profile deactivation", () => expect(() => assertServiceChange({ profile: profile({ status: "INACTIVE" }), services: [service()] }, service({ active: false }))).not.toThrow());
  it("permits deactivation when another active service remains", () => expect(() => assertServiceChange({ profile: profile(), services: [service(), service({ id: "s2" })] }, service({ active: false }))).not.toThrow());
  it.each(["bad", "a@b", "x @example.test", "a".repeat(250) + "@example.test"])("rejects invalid email %s", notificationEmail => expect(() => normalizeProfile({ ...profileDetails, notificationEmail })).toThrow());
  it("normalizes only email domain", () => expect(normalizeProfile({ ...profileDetails, notificationEmail: " Name@EXAMPLE.TEST " }).notificationEmail).toBe("Name@example.test"));
  it.each(["https://example.test/a.png", "../a.png", "a/b.png", "C:\\a.png", "a.svg"])("rejects unsafe image key %s", imageKey => expect(() => normalizeProfile({ ...profileDetails, imageKey })).toThrow());
  it("ignores overposted profile identity/status", () => expect(normalizeProfile({ ...profileDetails, status: "ACTIVE", userId: "other" } as ProfileDetails)).toEqual(profileDetails));
  it("normalizes a public advisor presence without exposing internal contact data", () => {
    const value = normalizePublicAdvisorPresence({ publicSlug: " test-advisor ", aboutText: " Über mich ", publicEmail: " public@EXAMPLE.TEST ", publicPhone: " +49 6000 123 ", publicWebsite: "https://example.test/advisor", publicAddress: " Musterweg 1 ", accentColor: "#1F5F8B", showDvagPartners: true, digitalCardEnabled: true });
    expect(value).toMatchObject({ publicSlug: "test-advisor", aboutText: "Über mich", publicEmail: "public@EXAMPLE.TEST", publicPhone: "+49 6000 123", publicAddress: "Musterweg 1" });
  });
  it.each(["Test Advisor","test_advisor","äöü","-test","test-"])("rejects unsafe public slug %s", publicSlug => expect(() => normalizePublicAdvisorPresence({ publicSlug, aboutText:null, publicEmail:null, publicPhone:null, publicWebsite:null, publicAddress:null, accentColor:null, showDvagPartners:true, digitalCardEnabled:true })).toThrow());
  it.each(["http://example.test","https://user:pass@example.test"])("rejects unsafe public website %s", publicWebsite => expect(() => normalizePublicAdvisorPresence({ publicSlug:"test", aboutText:null, publicEmail:null, publicPhone:null, publicWebsite, publicAddress:null, accentColor:null, showDvagPartners:true, digitalCardEnabled:true })).toThrow());
});

describe("meeting configuration", () => {
  it.each([0, 481, 1.5, NaN])("rejects duration %s", durationMinutes => expect(() => validateService(service({ durationMinutes }))).toThrow());
  it.each([1, 480])("accepts duration %s", durationMinutes => expect(() => validateService(service({ durationMinutes }))).not.toThrow());
  it.each(([[], ["PHONE", "ONLINE"], ["PHONE", "PHONE"]] as MeetingMode[][]).map(allowedMeetingModes => ({ allowedMeetingModes })))("rejects invalid FIXED options $allowedMeetingModes", ({ allowedMeetingModes }) => expect(() => validateService(service({ allowedMeetingModes }))).toThrow());
  it("rejects empty CLIENT_CHOICE", () => expect(() => validateService(service({ meetingModePolicy: "CLIENT_CHOICE", allowedMeetingModes: [] }))).toThrow());
  it("accepts CLIENT_CHOICE with one or several valid modes", () => {
    for (const allowedMeetingModes of [["PHONE"], ["PHONE", "ONLINE"]] as MeetingMode[][]) expect(() => validateService(service({ meetingModePolicy: "CLIENT_CHOICE", allowedMeetingModes, onlineUrl: "https://meet.example.test/a", onlineProvider: "Manual" }))).not.toThrow();
  });
  it("never accepts CLIENT_CHOICE as a concrete mode", () => expect(() => validateService(service({ allowedMeetingModes: ["CLIENT_CHOICE" as MeetingMode] }))).toThrow());
  it("requires both in-person fields", () => expect(() => validateService(service({ allowedMeetingModes: ["IN_PERSON"], placeName: "Office" }))).toThrow());
  it("enforces combined in-person length", () => {
    expect(() => validateService(service({ allowedMeetingModes: ["IN_PERSON"], placeName: "X", visitAddress: "A".repeat(999) }))).not.toThrow();
    expect(() => validateService(service({ allowedMeetingModes: ["IN_PERSON"], placeName: "XX", visitAddress: "A".repeat(999) }))).toThrow();
  });
  it("requires a number for CLIENT_CALLS_ADVISOR", () => expect(() => validateService(service({ phoneDirection: "CLIENT_CALLS_ADVISOR" }))).toThrow());
  it("permits default advisor calls without public number", () => expect(() => validateService(service())).not.toThrow());
  it("defaults missing phone direction", () => expect(normalizeService({ ...serviceDetails, phoneDirection: undefined! }).phoneDirection).toBe("ADVISOR_CALLS_CLIENT"));
  it.each(["http://example.test", "/relative", "https://user:pass@example.test", "https://example.test/" + "x".repeat(2048)])("rejects unsafe online URL %s", onlineUrl => expect(() => validateService(service({ allowedMeetingModes: ["ONLINE"], onlineUrl, onlineProvider: "Manual" }))).toThrow());
  it("requires a provider of at most 100 characters", () => {
    for (const onlineProvider of [null, "P".repeat(101)]) expect(() => validateService(service({ allowedMeetingModes: ["ONLINE"], onlineUrl: "https://example.test", onlineProvider }))).toThrow();
  });
  it("accepts absolute HTTPS and resolves without an external call", () => {
    const target = service({ allowedMeetingModes: ["ONLINE"], onlineUrl: "https://meet.example.test/a", onlineProvider: "Manual" });
    expect(resolveMeetingMode(target, "ONLINE")).toEqual({ mode: "ONLINE", url: target.onlineUrl, provider: "Manual" });
  });
  it("refuses unoffered concrete mode", () => expect(() => resolveMeetingMode(service(), "ONLINE")).toThrow());
  it("allows incomplete inactive configuration but requires completion at activation", () => {
    const target = service({ active: false, allowedMeetingModes: ["ONLINE"] });
    expect(() => validateService(target)).not.toThrow(); expect(() => validateService({ ...target, active: true })).toThrow();
  });
  it("does not copy overposted service owner or activation", () => expect(normalizeService({ ...serviceDetails, advisorProfileId: "other", active: true } as typeof serviceDetails)).toEqual(serviceDetails));
});

describe("directed relationships", () => {
  it("rejects self-relation", () => expect(() => validateRelation(relation({ targetProfileId: "p1" }))).toThrow());
  it("requires default selection for mandatory participants", () => expect(() => validateRelation(relation({ clientCanRemove: false }))).toThrow());
  it("permits mandatory or optional selections", () => {
    expect(() => validateRelation(relation({ clientCanRemove: false, defaultSelected: true }))).not.toThrow();
    expect(() => validateRelation(relation())).not.toThrow();
  });
});
