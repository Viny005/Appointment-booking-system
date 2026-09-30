import type { Schedule, ExceptionRule } from "../domain/engine";
import type { InstantInterval, LocalDate, LocalTimeRange } from "../domain/values";

export interface OccupancyReader {
  read(profileIds: string[], interval: InstantInterval): Promise<InstantInterval[]>;
}
export interface AvailabilityReader {
  actor(id: string): Promise<{ active: boolean; role: string; profileId: string | null } | null>;
  schedules(profileIds: string[], from?: LocalDate, to?: LocalDate): Promise<Map<string, Schedule>>;
  publicSelection(profileIds: string[], primaryProfileId: string, serviceId: string): Promise<number | null>;
}
export interface AvailabilityWriter extends AvailabilityReader {
  replaceWeekly(profileId: string, weekday: number, ranges: LocalTimeRange[], version: number): Promise<void>;
  saveException(profileId: string, rule: ExceptionRule): Promise<void>;
  advanceVersion(profileId: string, expected: number): Promise<void>;
}
export interface AvailabilityRepository {
  read<T>(work: (reader: AvailabilityReader) => Promise<T>): Promise<T>;
  write<T>(actorId: string, profileId: string, work: (writer: AvailabilityWriter) => Promise<T>): Promise<T>;
}
