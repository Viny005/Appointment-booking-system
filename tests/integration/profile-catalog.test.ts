import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { CatalogCommands, PublicCatalog } from "@/modules/profiles/application/catalog";
import { prismaCatalog } from "@/modules/profiles/infrastructure/prisma-catalog";
import type { Result } from "@/modules/profiles/domain/errors";
import { profileDetails, serviceDetails } from "../fixtures/catalog";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString || !new URL(connectionString).pathname.endsWith("_test")) throw new Error("Use a separate migrated TEST_DATABASE_URL ending in _test");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 8 }) });
const repo = prismaCatalog(db);
const commands = new CatalogCommands(repo, { id: randomUUID, now: () => new Date() });
const catalog = new PublicCatalog(repo);
const admin = randomUUID(); const otherAdmin = randomUUID(); const advisor = randomUUID();
const ownedProfiles: string[] = [];
const ownedTemplates: string[] = [];
function value<T>(result: Result<T>): T { if (!result.ok) throw new Error(result.error.code + ": " + result.error.message); return result.value; }
async function draft() { const p = value(await commands.createProfile(admin, profileDetails)); ownedProfiles.push(p.id); return p; }
async function template(details = serviceDetails) { const t = value(await commands.createServiceTemplate(admin, details)); ownedTemplates.push(t.id); return t; }
async function published() {
  const p = await draft(); const s = value(await commands.createService(admin, p.id, serviceDetails, true));
  return { profile: value(await commands.setProfileStatus(admin, p.id, p.version, "ACTIVE")), service: s };
}
beforeAll(async () => {
  await db.user.createMany({ data: [admin, otherAdmin, advisor].map(id => ({ id, email: `${id}@example.test`, name: "Synthetic account", role: id === advisor ? "ADVISOR" as const : "ADMIN" as const })) });
});
afterAll(async () => {
  await db.profileRelation.deleteMany({ where: { OR: [{ sourceProfileId: { in: ownedProfiles } }, { targetProfileId: { in: ownedProfiles } }] } });
  await db.service.deleteMany({ where: { advisorProfileId: { in: ownedProfiles } } });
  await db.serviceTemplate.deleteMany({ where: { id: { in: ownedTemplates } } });
  await db.advisorProfile.deleteMany({ where: { id: { in: ownedProfiles } } });
  await db.user.deleteMany({ where: { id: { in: [admin, otherAdmin, advisor] } } });
  await db.$disconnect();
});

describe("profile application persistence", () => {
  it("creates DRAFT without user, activates with service, deactivates and revalidates", async () => {
    const p = await draft(); expect(p.status).toBe("DRAFT"); expect(p.userId).toBeNull();
    expect(await commands.setProfileStatus(admin, p.id, 0, "ACTIVE")).toMatchObject({ ok: false, error: { code: "PROFILE_INCOMPLETE" } });
    const s = value(await commands.createService(admin, p.id, serviceDetails, true));
    const active = value(await commands.setProfileStatus(admin, p.id, 0, "ACTIVE"));
    const inactive = value(await commands.setProfileStatus(admin, p.id, active.version, "INACTIVE"));
    value(await commands.setServiceActive(admin, p.id, s.id, s.version, false));
    expect(await commands.setProfileStatus(admin, p.id, inactive.version, "ACTIVE")).toMatchObject({ ok: false, error: { code: "PROFILE_INCOMPLETE" } });
    expect((await db.advisorProfile.findUniqueOrThrow({ where: { id: p.id } })).status).toBe("INACTIVE");
  });
  it("rolls back invalid active profile updates and detects stale versions", async () => {
    const { profile: p } = await published();
    expect(await commands.updateProfile(admin, p.id, p.version, { ...profileDetails, imageKey: null })).toMatchObject({ ok: false });
    expect((await db.advisorProfile.findUniqueOrThrow({ where: { id: p.id } })).imageKey).toBe(profileDetails.imageKey);
    value(await commands.updateProfile(admin, p.id, p.version, { ...profileDetails, name: "Changed" }));
    expect(await commands.updateProfile(admin, p.id, p.version, profileDetails)).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
  });
  it("protects last service under two concurrent administrators", async () => {
    const { profile: p, service: first } = await published(); const second = value(await commands.createService(admin, p.id, serviceDetails, true));
    const results = await Promise.all([commands.setServiceActive(admin, p.id, first.id, 0, false), commands.setServiceActive(otherAdmin, p.id, second.id, 0, false)]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.find(result => !result.ok)).toMatchObject({ error: { code: "LAST_ACTIVE_SERVICE" } });
    expect(await db.service.count({ where: { advisorProfileId: p.id, active: true } })).toBe(1);
  });
  it("serializes profile activation against last-service deactivation", async () => {
    const p = await draft(); const s = value(await commands.createService(admin, p.id, serviceDetails, true));
    const results = await Promise.all([commands.setProfileStatus(admin, p.id, 0, "ACTIVE"), commands.setServiceActive(otherAdmin, p.id, s.id, 0, false)]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    const stored = await db.advisorProfile.findUniqueOrThrow({ where: { id: p.id }, include: { services: true } });
    expect(stored.status !== "ACTIVE" || stored.services.some(item => item.active)).toBe(true);
  });
  it("separates user inactivity from profile publication", async () => {
    const { profile: p } = await published(); value(await commands.assignUser(admin, p.id, p.version, advisor));
    await db.user.update({ where: { id: advisor }, data: { active: false } });
    expect(value(await catalog.listBookableProfiles()).some(item => item.id === p.id)).toBe(true);
    expect(await commands.createService(advisor, p.id, serviceDetails)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    await db.user.update({ where: { id: advisor }, data: { active: true } });
    value(await commands.assignUser(admin, p.id, p.version + 1, null));
  });
  it("allows only ADMIN or explicitly delegated own-service management", async () => {
    const p = await draft(); const other = await draft(); value(await commands.assignUser(admin, p.id, 0, advisor));
    expect(await commands.createService(advisor, p.id, serviceDetails)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    await db.user.update({ where: { id: advisor }, data: { canManageOwnServices: true } });
    expect((await commands.createService(advisor, p.id, serviceDetails)).ok).toBe(true);
    value(await commands.createRelation(admin, p.id, other.id, { active: true, proposedToClient: true, defaultSelected: false, clientCanRemove: true }));
    expect(await commands.createService(advisor, other.id, serviceDetails)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(await commands.setProfileStatus(advisor, p.id, 1, "ACTIVE")).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(await commands.createProfile("unknown", profileDetails)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    value(await commands.assignUser(admin, p.id, 1, null));
  });
  it("keeps profile-local services independent and lets authorized owners delete unused ones", async () => {
    const p = await draft();
    value(await commands.assignUser(admin, p.id, p.version, advisor));
    await db.user.update({ where: { id: advisor }, data: { canManageOwnServices: true } });
    const local = value(await commands.createService(advisor, p.id, serviceDetails, false));
    expect(local.serviceTemplateId).toBeNull();
    expect(value(await commands.deleteService(advisor, p.id, local.id, local.version))).toEqual({ id: local.id });
    expect(await db.service.count({ where: { id: local.id } })).toBe(0);
    value(await commands.assignUser(admin, p.id, 1, null));
  });

  it("creates a central service, releases it to a profile and synchronizes later edits", async () => {
    const p = await draft();
    const central = await template();
    const released = value(await commands.setServiceTemplateForProfile(admin, central.id, central.version, p.id, null, true));
    expect(released).toMatchObject({ advisorProfileId: p.id, serviceTemplateId: central.id, active: true });

    const updated = value(await commands.updateServiceTemplate(admin, central.id, central.version, { ...serviceDetails, name: "Zentrale Beratung aktualisiert" }));
    const stored = await db.service.findUniqueOrThrow({ where: { id: released.id } });
    expect(stored).toMatchObject({ name: "Zentrale Beratung aktualisiert", serviceTemplateId: central.id, active: true, version: 1 });
    expect(await commands.updateService(admin, p.id, released.id, stored.version, serviceDetails)).toMatchObject({ ok: false, error: { code: "CATALOG_MANAGED" } });
    expect(await commands.setServiceActive(admin, p.id, released.id, stored.version, false)).toMatchObject({ ok: false, error: { code: "CATALOG_MANAGED" } });

    expect(await commands.deleteServiceTemplate(admin, central.id, updated.version)).toMatchObject({ ok: false, error: { code: "TEMPLATE_IN_USE" } });
    const blocked = value(await commands.setServiceTemplateForProfile(admin, central.id, updated.version, p.id, stored.version, false));
    value(await commands.deleteServiceTemplate(admin, central.id, updated.version));
    expect(await db.serviceTemplate.findUnique({ where: { id: central.id } })).toBeNull();
    expect(await db.service.findUniqueOrThrow({ where: { id: blocked.id } })).toMatchObject({ serviceTemplateId: null, active: false });
  });

  it("serializes two administrators releasing the same catalog service to one profile", async () => {
    const p = await draft();
    const central = await template({ ...serviceDetails, name: "Concurrent central" });
    const results = await Promise.all([
      commands.setServiceTemplateForProfile(admin, central.id, central.version, p.id, null, true),
      commands.setServiceTemplateForProfile(otherAdmin, central.id, central.version, p.id, null, true),
    ]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.find(result => !result.ok)).toMatchObject({ error: { code: "CONFLICT" } });
    expect(await db.service.count({ where: { advisorProfileId: p.id, serviceTemplateId: central.id } })).toBe(1);
  });

  it("keeps the global catalog admin-only even when an advisor may manage local services", async () => {
    const p = await draft();
    value(await commands.assignUser(admin, p.id, p.version, advisor));
    await db.user.update({ where: { id: advisor }, data: { canManageOwnServices: true } });
    const central = await template({ ...serviceDetails, name: "Admin-only central" });
    expect(await commands.createServiceTemplate(advisor, serviceDetails)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(await commands.setServiceTemplateForProfile(advisor, central.id, central.version, p.id, null, true)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    value(await commands.assignUser(admin, p.id, 1, null));
  });

  it("filters public services and profiles without leaking private configuration", async () => {
    const { profile: p, service: s } = await published();
    value(await commands.createService(admin, p.id, { ...serviceDetails, name: "Inactive" }, false));
    expect(value(await catalog.listProfileServices(p.id)).map(row => row.id)).toEqual([s.id]);
    expect(value(await catalog.listBookableProfiles()).find(row => row.id === p.id)).not.toHaveProperty("notificationEmail");
    value(await commands.setProfileStatus(admin, p.id, p.version, "INACTIVE"));
    expect(value(await catalog.listProfileServices(p.id))).toEqual([]);
  });
  it("rejects invalid service changes without altering saved configuration", async () => {
    const { profile: p, service: s } = await published();
    expect(await commands.updateService(admin, p.id, s.id, s.version, { ...serviceDetails, durationMinutes: 481 })).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect((await db.service.findUniqueOrThrow({ where: { id: s.id } })).durationMinutes).toBe(30);
  });
  it("persists relation updates/deactivation without changing endpoints", async () => {
    const a = await published(); const b = await published();
    const relation = value(await commands.createRelation(admin, a.profile.id, b.profile.id, { active: true, proposedToClient: true, defaultSelected: false, clientCanRemove: true }));
    expect(value(await catalog.resolveParticipantOptions(a.profile.id)).options).toHaveLength(1);
    value(await commands.updateRelation(admin, a.profile.id, b.profile.id, relation.version, { active: false, proposedToClient: true, defaultSelected: false, clientCanRemove: true }));
    expect(value(await catalog.resolveParticipantOptions(a.profile.id)).options).toEqual([]);
    expect(await db.profileRelation.count({ where: { sourceProfileId: b.profile.id } })).toBe(0);
  });
  it("returns a friendly duplicate-relation error under concurrency", async () => {
    const a = await draft(); const b = await draft(); const flags = { active: true, proposedToClient: true, defaultSelected: true, clientCanRemove: false };
    const results = await Promise.all([commands.createRelation(admin, a.id, b.id, flags), commands.createRelation(otherAdmin, a.id, b.id, flags)]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.find(result => !result.ok)).toMatchObject({ error: { code: "CONFLICT" } });
  });
  it("serializes concurrent account assignment without losing uniqueness", async () => {
    const a = await draft(); const b = await draft();
    const results = await Promise.all([commands.assignUser(admin, a.id, 0, advisor), commands.assignUser(otherAdmin, b.id, 0, advisor)]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.find(result => !result.ok)).toMatchObject({ error: { code: "CONFLICT" } });
    const assigned = await db.advisorProfile.findUniqueOrThrow({ where: { userId: advisor } });
    value(await commands.assignUser(admin, assigned.id, assigned.version, null));
  });
});

describe("PostgreSQL constraints independent of the domain", () => {
  it.each([0, 481])("rejects duration %i via direct SQL-backed writes", async durationMinutes => {
    const p = await draft(); await expect(db.service.create({ data: { ...serviceDetails, id: randomUUID(), advisorProfileId: p.id, durationMinutes } })).rejects.toThrow();
  });
  it("rejects empty, duplicate and multiple FIXED modes", async () => {
    const p = await draft();
    for (const allowedMeetingModes of [[], ["PHONE", "PHONE"], ["PHONE", "ONLINE"]] as ("PHONE" | "ONLINE")[][]) {
      await expect(db.service.create({ data: { ...serviceDetails, id: randomUUID(), advisorProfileId: p.id, allowedMeetingModes } })).rejects.toThrow();
    }
    await expect(db.service.create({ data: { ...serviceDetails, id: randomUUID(), advisorProfileId: p.id, meetingModePolicy: "CLIENT_CHOICE", allowedMeetingModes: [] } })).rejects.toThrow();
  });
  it("rejects null mode arrays and CLIENT_CHOICE as a concrete DB enum", async () => {
    const p = await draft(); const s = value(await commands.createService(admin, p.id, serviceDetails));
    await expect(db.$executeRaw`UPDATE "Service" SET "allowedMeetingModes" = NULL WHERE id = ${s.id}`).rejects.toThrow();
    await expect(db.$executeRaw`UPDATE "Service" SET "allowedMeetingModes" = ARRAY['CLIENT_CHOICE']::"MeetingMode"[] WHERE id = ${s.id}`).rejects.toThrow();
  });
  it("rejects self-relations, duplicate pairs and invalid required flags", async () => {
    const a = await draft(); const b = await draft();
    await expect(db.profileRelation.create({ data: { id: randomUUID(), sourceProfileId: a.id, targetProfileId: a.id } })).rejects.toThrow();
    await expect(db.profileRelation.create({ data: { id: randomUUID(), sourceProfileId: a.id, targetProfileId: b.id, clientCanRemove: false } })).rejects.toThrow();
    await db.profileRelation.create({ data: { id: randomUUID(), sourceProfileId: a.id, targetProfileId: b.id } });
    await expect(db.profileRelation.create({ data: { id: randomUUID(), sourceProfileId: a.id, targetProfileId: b.id } })).rejects.toThrow();
    await expect(db.profileRelation.create({ data: { id: randomUUID(), sourceProfileId: b.id, targetProfileId: a.id } })).resolves.toBeDefined();
  });
  it("enforces user/profile 1:1 while allowing multiple unassigned profiles", async () => {
    const a = await draft(); const b = await draft();
    await db.advisorProfile.update({ where: { id: a.id }, data: { userId: advisor } });
    await expect(db.advisorProfile.update({ where: { id: b.id }, data: { userId: advisor } })).rejects.toThrow();
    await db.advisorProfile.update({ where: { id: a.id }, data: { userId: null } });
    expect(await db.advisorProfile.count({ where: { id: { in: [a.id, b.id] }, userId: null } })).toBe(2);
  });
  it("rejects external URLs as image references and restricts deletion of referenced parents", async () => {
    const p = await draft();
    await expect(db.advisorProfile.update({ where: { id: p.id }, data: { imageKey: "https://example.test/photo.png" } })).rejects.toThrow();
    value(await commands.createService(admin, p.id, serviceDetails));
    await expect(db.advisorProfile.delete({ where: { id: p.id } })).rejects.toThrow();
  });
});
