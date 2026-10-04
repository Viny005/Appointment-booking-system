import { CatalogError, type Result } from "../domain/errors";
import {
  publicProfile,
  type ProfileDetails,
  type ServiceDetails,
  type RelationDetails,
  type PublicProfile,
  type ProfileAggregate,
  type PublicAdvisorPresence,
  type ServiceTemplate,
} from "../domain/model";
import {
  assertPublishable,
  assertServiceChange,
  createProfile,
  isValidActiveService,
  normalizeProfile,
  normalizePublicAdvisorPresence,
  normalizeService,
  relationFlags,
  transitionProfile,
  validateRelation,
  validateService,
} from "../domain/policies";
import type { CatalogRepository, CatalogRuntime, CatalogWriter } from "./ports";

async function result<T>(work: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, value: await work() };
  } catch (error) {
    if (error instanceof CatalogError) return { ok: false, error: { code: error.code, message: error.message, field: error.field } };
    return { ok: false, error: { code: "PERSISTENCE_UNAVAILABLE", message: "Daten konnten nicht verarbeitet werden. Bitte erneut versuchen." } };
  }
}

function exists<T>(value: T | null | undefined): T {
  if (!value) throw new CatalogError("NOT_FOUND", "Eintrag nicht gefunden.");
  return value;
}

function version(actual: number, expected: number) {
  if (actual !== expected) throw new CatalogError("CONFLICT", "Eintrag wurde inzwischen geändert. Bitte neu laden.");
}

function bookable(aggregate: ProfileAggregate) {
  if (aggregate.profile.status !== "ACTIVE") return false;
  try { assertPublishable(aggregate); return true; } catch { return false; }
}

function normalizedTemplate(details: ServiceDetails) {
  const normalized = normalizeService(details);
  // A reusable catalog item must already be complete enough to be activated on any profile.
  validateService({ ...normalized, active: true });
  return normalized;
}

function templateDetails(template: ServiceTemplate): ServiceDetails {
  return {
    name: template.name,
    description: template.description,
    durationMinutes: template.durationMinutes,
    meetingModePolicy: template.meetingModePolicy,
    allowedMeetingModes: [...template.allowedMeetingModes],
    placeName: template.placeName,
    visitAddress: template.visitAddress,
    phoneDirection: template.phoneDirection,
    advisorPhone: template.advisorPhone,
    onlineUrl: template.onlineUrl,
    onlineProvider: template.onlineProvider,
  };
}

export class PublicCatalog {
  constructor(private readonly repository: CatalogRepository) {}

  listBookableProfiles() {
    return result(() => this.repository.read(async reader =>
      (await reader.listProfiles()).filter(bookable).map(item => publicProfile(item.profile)),
    ));
  }

  listProfileServices(profileId: string) {
    return result(() => this.repository.read(async reader => {
      const aggregate = await reader.getProfile(profileId);
      if (!aggregate || !bookable(aggregate)) return [];
      return aggregate.services.filter(isValidActiveService).map(service => ({
        id: service.id,
        advisorProfileId: service.advisorProfileId,
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        meetingModePolicy: service.meetingModePolicy,
        allowedMeetingModes: [...service.allowedMeetingModes],
      }));
    }));
  }

  getPublicAdvisorBySlug(slug: string) {
    return result(() => this.repository.read(async reader => {
      const normalized = slug.trim().toLowerCase();
      const aggregate = (await reader.listProfiles()).find(item => item.profile.publicSlug === normalized);
      if (!aggregate || !bookable(aggregate)) return null;
      const p = aggregate.profile;
      return {
        profile: publicProfile(p),
        publicSlug: p.publicSlug ?? null,
        aboutText: p.aboutText ?? null,
        publicEmail: p.publicEmail ?? null,
        publicPhone: p.publicPhone ?? null,
        publicWebsite: p.publicWebsite ?? null,
        publicAddress: p.publicAddress ?? null,
        accentColor: p.accentColor ?? null,
        showDvagPartners: p.showDvagPartners ?? true,
        digitalCardEnabled: p.digitalCardEnabled ?? true,
        services: aggregate.services.filter(isValidActiveService).map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          allowedMeetingModes: [...service.allowedMeetingModes],
        })),
      };
    }));
  }

  resolveParticipantOptions(profileId: string) {
    return result(() => this.repository.read(async reader => {
      const source = exists(await reader.getProfile(profileId));
      if (!bookable(source)) throw new CatalogError("NOT_FOUND", "Profil ist nicht öffentlich buchbar.");
      const options: { profile: PublicProfile; defaultSelected: boolean; clientCanRemove: boolean }[] = [];
      const requiredParticipants: PublicProfile[] = [];
      for (const relation of await reader.getRelations(profileId)) {
        if (!relation.active) continue;
        const target = await reader.getProfile(relation.targetProfileId);
        if (!target || !bookable(target)) {
          if (!relation.clientCanRemove) throw new CatalogError("REQUIRED_PARTICIPANT_UNAVAILABLE", "Ein Pflichtteilnehmer ist nicht öffentlich verfügbar.");
          continue;
        }
        const profile = publicProfile(target.profile);
        if (!relation.clientCanRemove) requiredParticipants.push(profile);
        if (relation.proposedToClient) options.push({ profile, defaultSelected: relation.defaultSelected, clientCanRemove: relation.clientCanRemove });
      }
      return { primary: publicProfile(source.profile), requiredParticipants, options };
    }));
  }
}

export class CatalogCommands {
  constructor(private readonly repository: CatalogRepository, private readonly runtime: CatalogRuntime) {}

  private mutate<T>(
    actorId: string,
    profileIds: string[],
    userIds: string[],
    work: (writer: CatalogWriter) => Promise<T>,
    ownServiceProfileId?: string,
    serviceTemplateIds: string[] = [],
  ) {
    return result(() => this.repository.write({ profileIds, userIds: [...userIds, actorId], serviceTemplateIds }, async writer => {
      const actor = await writer.getActor(actorId);
      if (!actor?.active || !(actor.role === "ADMIN" || (ownServiceProfileId && actor.role === "ADVISOR" && actor.canManageOwnServices && actor.profileId === ownServiceProfileId))) {
        throw new CatalogError("FORBIDDEN", "Keine Berechtigung für diese Änderung.");
      }
      return work(writer);
    }));
  }

  createProfile(actorId: string, details: ProfileDetails) {
    return this.mutate(actorId, [], [], async writer => {
      const profile = createProfile(this.runtime.id(), details, this.runtime.now());
      await writer.saveProfile(profile, true);
      return profile;
    });
  }

  updateProfile(actorId: string, id: string, expectedVersion: number, details: ProfileDetails) {
    return this.mutate(actorId, [id], [], async writer => {
      const aggregate = exists(await writer.getProfile(id));
      version(aggregate.profile.version, expectedVersion);
      const profile = { ...aggregate.profile, ...normalizeProfile(details), version: expectedVersion + 1, updatedAt: this.runtime.now() };
      if (profile.status === "ACTIVE") assertPublishable({ ...aggregate, profile });
      await writer.saveProfile(profile);
      return profile;
    });
  }

  updatePublicPresence(actorId: string, id: string, expectedVersion: number, details: PublicAdvisorPresence) {
    return this.mutate(actorId, [id], [], async writer => {
      const aggregate = exists(await writer.getProfile(id));
      version(aggregate.profile.version, expectedVersion);
      const profile = { ...aggregate.profile, ...normalizePublicAdvisorPresence(details), version: expectedVersion + 1, updatedAt: this.runtime.now() };
      await writer.saveProfile(profile);
      return profile;
    }, id);
  }

  setProfileStatus(actorId: string, id: string, expectedVersion: number, status: "ACTIVE" | "INACTIVE") {
    return this.mutate(actorId, [id], [], async writer => {
      const aggregate = exists(await writer.getProfile(id));
      version(aggregate.profile.version, expectedVersion);
      const profile = { ...transitionProfile(aggregate, status), version: expectedVersion + 1, updatedAt: this.runtime.now() };
      await writer.saveProfile(profile);
      return profile;
    });
  }

  // Profile-local service. It is independent from the reusable global catalog.
  createService(actorId: string, profileId: string, details: ServiceDetails, active = false) {
    return this.mutate(actorId, [profileId], [], async writer => {
      const aggregate = exists(await writer.getProfile(profileId));
      const now = this.runtime.now();
      const service = {
        ...normalizeService(details),
        id: this.runtime.id(),
        advisorProfileId: profileId,
        serviceTemplateId: null,
        active,
        version: 0,
        createdAt: now,
        updatedAt: now,
      };
      assertServiceChange(aggregate, service);
      await writer.saveService(service, true);
      return service;
    }, profileId);
  }

  updateService(actorId: string, profileId: string, id: string, expectedVersion: number, details: ServiceDetails) {
    return this.mutate(actorId, [profileId], [], async writer => {
      const aggregate = exists(await writer.getProfile(profileId));
      const previous = exists(aggregate.services.find(item => item.id === id));
      version(previous.version, expectedVersion);
      if (previous.serviceTemplateId) throw new CatalogError("CATALOG_MANAGED", "Diese Leistung wird zentral im Leistungskatalog verwaltet.");
      const service = { ...previous, ...normalizeService(details), version: expectedVersion + 1, updatedAt: this.runtime.now() };
      assertServiceChange(aggregate, service);
      await writer.saveService(service);
      return service;
    }, profileId);
  }

  setServiceActive(actorId: string, profileId: string, id: string, expectedVersion: number, active: boolean) {
    return this.mutate(actorId, [profileId], [], async writer => {
      const aggregate = exists(await writer.getProfile(profileId));
      const previous = exists(aggregate.services.find(item => item.id === id));
      version(previous.version, expectedVersion);
      if (previous.serviceTemplateId) throw new CatalogError("CATALOG_MANAGED", "Zentrale Leistungen werden über den Leistungskatalog freigeschaltet oder gesperrt.");
      const service = { ...previous, active, version: expectedVersion + 1, updatedAt: this.runtime.now() };
      validateService(service);
      assertServiceChange(aggregate, service);
      await writer.saveService(service);
      return service;
    }, profileId);
  }

  deleteService(actorId: string, profileId: string, id: string, expectedVersion: number) {
    return this.mutate(actorId, [profileId], [], async writer => {
      const aggregate = exists(await writer.getProfile(profileId));
      const previous = exists(aggregate.services.find(item => item.id === id));
      version(previous.version, expectedVersion);
      if (previous.serviceTemplateId) throw new CatalogError("CATALOG_MANAGED", "Zentrale Leistungen werden im Leistungskatalog verwaltet.");
      const remaining = aggregate.services.filter(item => item.id !== id);
      if (aggregate.profile.status === "ACTIVE" && !remaining.some(isValidActiveService)) {
        throw new CatalogError("LAST_ACTIVE_SERVICE", "Aktives Profil muss mindestens eine aktive gültige Leistung behalten.");
      }
      await writer.deleteService(id);
      return { id };
    }, profileId);
  }

  createServiceTemplate(actorId: string, details: ServiceDetails) {
    return this.mutate(actorId, [], [], async writer => {
      const now = this.runtime.now();
      const template: ServiceTemplate = {
        ...normalizedTemplate(details),
        id: this.runtime.id(),
        version: 0,
        createdAt: now,
        updatedAt: now,
      };
      await writer.saveServiceTemplate(template, true);
      return template;
    });
  }

  updateServiceTemplate(actorId: string, id: string, expectedVersion: number, details: ServiceDetails) {
    return this.mutate(actorId, [], [], async writer => {
      const aggregate = exists(await writer.getServiceTemplate(id));
      version(aggregate.template.version, expectedVersion);
      const template: ServiceTemplate = {
        ...aggregate.template,
        ...normalizedTemplate(details),
        version: expectedVersion + 1,
        updatedAt: this.runtime.now(),
      };
      await writer.saveServiceTemplate(template);
      await writer.syncTemplateServices(template);
      return template;
    }, undefined, [id]);
  }

  setServiceTemplateForProfile(
    actorId: string,
    templateId: string,
    expectedTemplateVersion: number,
    profileId: string,
    expectedServiceVersion: number | null,
    active: boolean,
  ) {
    return this.mutate(actorId, [profileId], [], async writer => {
      const templateAggregate = exists(await writer.getServiceTemplate(templateId));
      version(templateAggregate.template.version, expectedTemplateVersion);
      const profile = exists(await writer.getProfile(profileId));
      const previous = templateAggregate.profileServices.find(item => item.advisorProfileId === profileId);

      if (previous && expectedServiceVersion === null) throw new CatalogError("CONFLICT", "Leistung wurde dem Profil inzwischen bereits zugeordnet.");
      if (!previous && expectedServiceVersion !== null) throw new CatalogError("CONFLICT", "Profilzuordnung wurde inzwischen geändert. Bitte neu laden.");
      if (previous && expectedServiceVersion !== null) version(previous.version, expectedServiceVersion);

      const now = this.runtime.now();
      const service = previous ? {
        ...previous,
        ...templateDetails(templateAggregate.template),
        active,
        version: previous.version + 1,
        updatedAt: now,
      } : {
        ...templateDetails(templateAggregate.template),
        id: this.runtime.id(),
        advisorProfileId: profileId,
        serviceTemplateId: templateId,
        active,
        version: 0,
        createdAt: now,
        updatedAt: now,
      };
      assertServiceChange(profile, service);
      await writer.saveService(service, !previous);
      return service;
    }, undefined, [templateId]);
  }

  deleteServiceTemplate(actorId: string, id: string, expectedVersion: number) {
    return this.mutate(actorId, [], [], async writer => {
      const aggregate = exists(await writer.getServiceTemplate(id));
      version(aggregate.template.version, expectedVersion);
      if (aggregate.profileServices.some(service => service.active)) {
        throw new CatalogError("TEMPLATE_IN_USE", "Leistung zuerst in allen Profilen sperren. Aktive Freischaltungen werden nicht automatisch gelöscht.");
      }
      await writer.detachTemplateServices(id);
      await writer.deleteServiceTemplate(id);
      return { id };
    }, undefined, [id]);
  }

  createRelation(actorId: string, sourceProfileId: string, targetProfileId: string, details: RelationDetails) {
    return this.mutate(actorId, [sourceProfileId, targetProfileId], [], async writer => {
      exists(await writer.getProfile(sourceProfileId));
      exists(await writer.getProfile(targetProfileId));
      if ((await writer.getRelations(sourceProfileId)).some(item => item.targetProfileId === targetProfileId)) {
        throw new CatalogError("CONFLICT", "Diese gerichtete Beziehung existiert bereits.");
      }
      const now = this.runtime.now();
      const relation = {
        ...relationFlags(details),
        id: this.runtime.id(),
        sourceProfileId,
        targetProfileId,
        version: 0,
        createdAt: now,
        updatedAt: now,
      };
      validateRelation(relation);
      await writer.saveRelation(relation, true);
      return relation;
    });
  }

  updateRelation(actorId: string, sourceProfileId: string, targetProfileId: string, expectedVersion: number, details: RelationDetails) {
    return this.mutate(actorId, [sourceProfileId, targetProfileId], [], async writer => {
      const previous = exists((await writer.getRelations(sourceProfileId)).find(item => item.targetProfileId === targetProfileId));
      version(previous.version, expectedVersion);
      const relation = { ...previous, ...relationFlags(details), version: expectedVersion + 1, updatedAt: this.runtime.now() };
      validateRelation(relation);
      await writer.saveRelation(relation);
      return relation;
    });
  }

  assignUser(actorId: string, profileId: string, expectedVersion: number, userId: string | null) {
    return this.mutate(actorId, [profileId], userId ? [userId] : [], async writer => {
      const aggregate = exists(await writer.getProfile(profileId));
      version(aggregate.profile.version, expectedVersion);
      if (userId) {
        const user = exists(await writer.getUserAssignment(userId));
        if (user.profileId && user.profileId !== profileId) throw new CatalogError("CONFLICT", "Konto ist bereits einem anderen Profil zugeordnet.");
        if (aggregate.profile.userId && aggregate.profile.userId !== userId) throw new CatalogError("CONFLICT", "Bestehende Kontozuordnung zuerst ausdrücklich lösen.");
      }
      const profile = { ...aggregate.profile, userId, version: expectedVersion + 1, updatedAt: this.runtime.now() };
      await writer.saveProfile(profile);
      return profile;
    });
  }
}

export class InternalCatalogQueries {
  constructor(private readonly repository: CatalogRepository) {}
  listProfiles() { return result(() => this.repository.read(reader => reader.listProfiles())); }
  getProfile(id: string) { return result(() => this.repository.read(async reader => ({ aggregate: await reader.getProfile(id), relations: await reader.getRelations(id) }))); }
  listServiceTemplates() { return result(() => this.repository.read(reader => reader.listServiceTemplates())); }
  getServiceTemplate(id: string) { return result(() => this.repository.read(reader => reader.getServiceTemplate(id))); }
}
