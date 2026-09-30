import type { AdvisorProfile, ProfileAggregate, ProfileRelation, Service } from "../domain/model";
export type CatalogActor = { id: string; active: boolean; role: "ADMIN" | "ADVISOR"; profileId: string | null; canManageOwnServices: boolean };
export interface CatalogReader {
  listProfiles(): Promise<ProfileAggregate[]>;
  getProfile(id: string): Promise<ProfileAggregate | null>;
  getRelations(sourceProfileId: string): Promise<ProfileRelation[]>;
}
export interface CatalogWriter extends CatalogReader {
  getActor(id: string): Promise<CatalogActor | null>;
  getUserAssignment(id: string): Promise<{ profileId: string | null } | null>;
  saveProfile(profile: AdvisorProfile, create?: boolean): Promise<void>;
  saveService(service: Service, create?: boolean): Promise<void>;
  saveRelation(relation: ProfileRelation, create?: boolean): Promise<void>;
}
export interface CatalogRepository {
  read<T>(work: (reader: CatalogReader) => Promise<T>): Promise<T>;
  write<T>(locks: { profileIds: string[]; userIds: string[] }, work: (writer: CatalogWriter) => Promise<T>): Promise<T>;
}
export interface CatalogRuntime { id(): string; now(): Date }
