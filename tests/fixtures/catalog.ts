import type { AdvisorProfile, ProfileRelation, Service, ServiceDetails } from "@/modules/profiles/domain/model";
export const date = new Date("2026-09-30T09:00:00Z");
export const profileDetails = { name: "Test Advisor", title: "Beratung", shortDescription: "Synthetisches Profil", notificationEmail: "advisor@example.test", imageKey: "test-image.png" };
export const serviceDetails: ServiceDetails = {
  name: "Beratung", description: "Termin zur Beratung", durationMinutes: 30, meetingModePolicy: "FIXED", allowedMeetingModes: ["PHONE"],
  phoneDirection: "ADVISOR_CALLS_CLIENT", advisorPhone: null, placeName: null, visitAddress: null, onlineUrl: null, onlineProvider: null,
};
export function profile(patch: Partial<AdvisorProfile> = {}): AdvisorProfile { return { ...profileDetails, id: "p1", status: "ACTIVE", userId: null, version: 0, createdAt: date, updatedAt: date, ...patch }; }
export function service(patch: Partial<Service> = {}): Service { return { ...serviceDetails, id: "s1", advisorProfileId: "p1", active: true, version: 0, createdAt: date, updatedAt: date, ...patch }; }
export function relation(patch: Partial<ProfileRelation> = {}): ProfileRelation { return { id: "r1", sourceProfileId: "p1", targetProfileId: "p2", active: true, proposedToClient: true, defaultSelected: false, clientCanRemove: true, version: 0, createdAt: date, updatedAt: date, ...patch }; }
