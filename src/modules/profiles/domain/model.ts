export type ProfileStatus = "DRAFT" | "ACTIVE" | "INACTIVE";
export type MeetingMode = "IN_PERSON" | "PHONE" | "ONLINE";
export type MeetingModePolicy = "FIXED" | "CLIENT_CHOICE";
export type PhoneDirection = "ADVISOR_CALLS_CLIENT" | "CLIENT_CALLS_ADVISOR";
export type ProfileDetails = {
  name: string; title: string; shortDescription: string; notificationEmail: string; imageKey: string | null;
};
export type AdvisorProfile = ProfileDetails & {
  id: string; status: ProfileStatus; userId: string | null; version: number; createdAt: Date; updatedAt: Date;
  publicSlug?: string | null; aboutText?: string | null; publicEmail?: string | null; publicPhone?: string | null;
  publicWebsite?: string | null; publicAddress?: string | null; accentColor?: string | null;
  showDvagPartners?: boolean; digitalCardEnabled?: boolean;
};
export type PublicAdvisorPresence = {
  publicSlug: string | null; aboutText: string | null; publicEmail: string | null; publicPhone: string | null;
  publicWebsite: string | null; publicAddress: string | null; accentColor: string | null;
  showDvagPartners: boolean; digitalCardEnabled: boolean;
};
export type ServiceDetails = {
  name: string; description: string; durationMinutes: number;
  meetingModePolicy: MeetingModePolicy; allowedMeetingModes: MeetingMode[];
  placeName: string | null; visitAddress: string | null;
  phoneDirection: PhoneDirection; advisorPhone: string | null;
  onlineUrl: string | null; onlineProvider: string | null;
};
export type ServiceTemplate = ServiceDetails & {
  id: string; version: number; createdAt: Date; updatedAt: Date;
};
export type Service = ServiceDetails & {
  id: string; advisorProfileId: string; serviceTemplateId?: string | null; active: boolean; version: number; createdAt: Date; updatedAt: Date;
};
export type ServiceTemplateAggregate = { template: ServiceTemplate; profileServices: Service[] };
export type RelationDetails = { active: boolean; proposedToClient: boolean; defaultSelected: boolean; clientCanRemove: boolean };
export type ProfileRelation = RelationDetails & {
  id: string; sourceProfileId: string; targetProfileId: string; version: number; createdAt: Date; updatedAt: Date;
};
export type ProfileAggregate = { profile: AdvisorProfile; services: Service[] };
export type PublicProfile = Pick<AdvisorProfile, "id" | "name" | "title" | "shortDescription" | "imageKey"> & { publicSlug: string | null };
export function publicProfile(profile: AdvisorProfile): PublicProfile {
  return { id: profile.id, name: profile.name, title: profile.title, shortDescription: profile.shortDescription, imageKey: profile.imageKey, publicSlug: profile.publicSlug ?? null };
}
