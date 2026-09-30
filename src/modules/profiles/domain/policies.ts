import { CatalogError, requireRule } from "./errors";
import type { AdvisorProfile, MeetingMode, ProfileAggregate, ProfileDetails, ProfileRelation, ProfileStatus, Service, ServiceDetails } from "./model";

const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const modes: MeetingMode[] = ["IN_PERSON", "PHONE", "ONLINE"];
export function normalizeProfile(input: ProfileDetails): ProfileDetails {
  for (const field of ["name", "title", "shortDescription", "notificationEmail"] as const) requireRule(typeof input[field] === "string", "Text erwartet.", field);
  const email = input.notificationEmail.trim();
  requireRule(!email || (email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)), "Ungültige Benachrichtigungs-E-Mail.", "notificationEmail");
  requireRule(input.imageKey === null || typeof input.imageKey === "string", "Storage-Key oder null erwartet.", "imageKey");
  const imageKey = input.imageKey?.trim() || null;
  requireRule(!imageKey || /^[A-Za-z0-9_-]{1,128}(?:\.(?:jpg|jpeg|png|webp))?$/.test(imageKey), "Nur ein sicherer Storage-Key ist erlaubt.", "imageKey");
  const at = email.lastIndexOf("@");
  return { name: input.name.trim(), title: input.title.trim(), shortDescription: input.shortDescription.trim(),
    notificationEmail: email ? email.slice(0, at) + "@" + email.slice(at + 1).toLowerCase() : "", imageKey };
}
export function createProfile(id: string, details: ProfileDetails, now: Date): AdvisorProfile {
  return { ...normalizeProfile(details), id, status: "DRAFT", userId: null, version: 0, createdAt: now, updatedAt: now };
}
export function normalizeService(input: ServiceDetails): ServiceDetails {
  requireRule(typeof input.name === "string" && typeof input.description === "string", "Name und Beschreibung müssen Text sein.");
  requireRule(Array.isArray(input.allowedMeetingModes), "Liste konkreter Meetingmodi erwartet.", "allowedMeetingModes");
  const result: ServiceDetails = { name: input.name.trim(), description: input.description.trim(),
    durationMinutes: input.durationMinutes, meetingModePolicy: input.meetingModePolicy, allowedMeetingModes: [...input.allowedMeetingModes],
    phoneDirection: input.phoneDirection ?? "ADVISOR_CALLS_CLIENT", placeName: null, visitAddress: null, advisorPhone: null, onlineUrl: null, onlineProvider: null };
  for (const field of ["placeName", "visitAddress", "advisorPhone", "onlineUrl", "onlineProvider"] as const) {
    requireRule(input[field] === null || typeof input[field] === "string", "Text oder null erwartet.", field);
    result[field] = input[field]?.trim() || null;
  }
  return result;
}
export function validateService(service: ServiceDetails & { active: boolean }): void {
  requireRule(typeof service.active === "boolean", "Aktivstatus muss Boolean sein.", "active");
  requireRule(text(service.name), "Service benötigt einen Namen.", "name");
  requireRule(Number.isInteger(service.durationMinutes) && service.durationMinutes >= 1 && service.durationMinutes <= 480, "Dauer muss eine ganze Zahl zwischen 1 und 480 sein.", "durationMinutes");
  requireRule(["FIXED", "CLIENT_CHOICE"].includes(service.meetingModePolicy), "Ungültige Meeting-Policy.", "meetingModePolicy");
  const allowed = service.allowedMeetingModes;
  requireRule(Array.isArray(allowed) && allowed.length > 0 && allowed.every(mode => modes.includes(mode)) && new Set(allowed).size === allowed.length, "Mindestens ein eindeutiger konkreter Meetingmodus ist erforderlich.", "allowedMeetingModes");
  requireRule(service.meetingModePolicy !== "FIXED" || allowed.length === 1, "FIXED erfordert genau einen Modus.", "allowedMeetingModes");
  requireRule(["ADVISOR_CALLS_CLIENT", "CLIENT_CALLS_ADVISOR"].includes(service.phoneDirection), "Ungültige Anrufrichtung.", "phoneDirection");
  if (!service.active) return;
  if (allowed.includes("IN_PERSON")) {
    requireRule(text(service.placeName) && text(service.visitAddress), "Präsenz benötigt Ort und Besuchsadresse.", "visitAddress");
    requireRule(service.placeName.length + service.visitAddress.length <= 1000, "Ort und Adresse dürfen zusammen höchstens 1000 Zeichen haben.", "visitAddress");
  }
  if (allowed.includes("PHONE") && service.phoneDirection === "CLIENT_CALLS_ADVISOR") {
    requireRule(text(service.advisorPhone) && service.advisorPhone.length <= 32 && /^[+\d(). -]+$/.test(service.advisorPhone) && /\d/.test(service.advisorPhone), "Eine gültige Beraternummer mit höchstens 32 Zeichen ist erforderlich.", "advisorPhone");
  }
  if (allowed.includes("ONLINE")) {
    requireRule(text(service.onlineProvider) && service.onlineProvider.length <= 100, "Providerbezeichnung mit höchstens 100 Zeichen erforderlich.", "onlineProvider");
    requireRule(text(service.onlineUrl) && service.onlineUrl.length <= 2048 && /^https:\/\//i.test(service.onlineUrl), "Absolute HTTPS-URL mit höchstens 2048 Zeichen erforderlich.", "onlineUrl");
    let url: URL;
    try { url = new URL(service.onlineUrl); } catch { throw new CatalogError("INVALID_INPUT", "Ungültige Online-URL.", "onlineUrl"); }
    requireRule(url.protocol === "https:" && !!url.hostname && !url.username && !url.password, "Online-URL darf keine Zugangsdaten enthalten.", "onlineUrl");
  }
}
export function isValidActiveService(service: Service): boolean {
  if (!service.active) return false;
  try { validateService(service); return true; } catch { return false; }
}
export function assertPublishable({ profile, services }: ProfileAggregate): void {
  normalizeProfile(profile);
  if (![profile.name, profile.title, profile.shortDescription, profile.notificationEmail, profile.imageKey].every(text) || !services.some(isValidActiveService)) {
    throw new CatalogError("PROFILE_INCOMPLETE", "Name, Bild, Titel, Beschreibung, E-Mail und mindestens ein aktiver gültiger Service fehlen.");
  }
}
export function transitionProfile(aggregate: ProfileAggregate, status: Exclude<ProfileStatus, "DRAFT">): AdvisorProfile {
  requireRule(status === "ACTIVE" || status === "INACTIVE", "Ungültiger Zielstatus.");
  if (status === "ACTIVE") assertPublishable(aggregate);
  if (aggregate.profile.status === "DRAFT" && status === "INACTIVE") throw new CatalogError("INVALID_TRANSITION", "Ein Entwurf bleibt bis zur ersten Aktivierung DRAFT.");
  return { ...aggregate.profile, status };
}
export function assertServiceChange(aggregate: ProfileAggregate, replacement: Service): void {
  validateService(replacement);
  const remaining = [...aggregate.services.filter(item => item.id !== replacement.id), replacement];
  if (aggregate.profile.status === "ACTIVE" && !remaining.some(isValidActiveService)) throw new CatalogError("LAST_ACTIVE_SERVICE", "Aktives Profil muss mindestens einen aktiven gültigen Service behalten. Zuerst Profil deaktivieren.");
}
export function validateRelation(relation: Pick<ProfileRelation, "sourceProfileId" | "targetProfileId" | "active" | "proposedToClient" | "defaultSelected" | "clientCanRemove">): void {
  requireRule(relation.sourceProfileId !== relation.targetProfileId, "Profil darf nicht mit sich selbst verbunden werden.");
  for (const field of ["active", "proposedToClient", "defaultSelected", "clientCanRemove"] as const) requireRule(typeof relation[field] === "boolean", "Boolean erwartet.", field);
  requireRule(relation.clientCanRemove || relation.defaultSelected, "Nicht entfernbare Teilnehmer müssen vorausgewählt sein.", "defaultSelected");
}
export function relationFlags(input: Pick<ProfileRelation, "active" | "proposedToClient" | "defaultSelected" | "clientCanRemove">) {
  return { active: input.active, proposedToClient: input.proposedToClient, defaultSelected: input.defaultSelected, clientCanRemove: input.clientCanRemove };
}
export function resolveMeetingMode(service: Service, mode: MeetingMode) {
  validateService(service);
  requireRule(service.active && service.allowedMeetingModes.includes(mode), "Meetingmodus wird nicht angeboten.", "meetingMode");
  switch (mode) {
    case "IN_PERSON": return { mode, placeName: service.placeName!, visitAddress: service.visitAddress! };
    case "PHONE": return { mode, phoneDirection: service.phoneDirection, advisorPhone: service.phoneDirection === "CLIENT_CALLS_ADVISOR" ? service.advisorPhone : null };
    case "ONLINE": return { mode, url: service.onlineUrl!, provider: service.onlineProvider! };
  }
}
