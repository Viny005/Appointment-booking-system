import { effectiveDay, commonDay, mergeProposal, slots, subtract, validateException, dayBounds, type ExceptionRule, type Schedule } from "../domain/engine";
import { AvailabilityError, ensure, localDate, datesBetween, weekday as dayOfWeek, type LocalTimeRange, type LocalDate } from "../domain/values";
import type { AvailabilityReader, AvailabilityRepository, OccupancyReader } from "./ports";

export type AvailabilityResult<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string } };
async function result<T>(work: () => Promise<T>): Promise<AvailabilityResult<T>> {
  try { return { ok: true, value: await work() }; }
  catch (e) { return { ok: false, error: e instanceof AvailabilityError ? { code: e.code, message: e.message } : { code: "UNAVAILABLE", message: "Verfügbarkeit konnte nicht verarbeitet werden." } }; }
}
async function authorized(reader: AvailabilityReader, actorId: string, profileId: string) {
  const actor = await reader.actor(actorId);
  if (!actor?.active || !(actor.role === "ADMIN" || actor.role === "ADVISOR" && actor.profileId === profileId)) throw new AvailabilityError("FORBIDDEN", "Keine Berechtigung für dieses Profil.");
}
async function schedule(reader: AvailabilityReader, profileId: string) {
  const data = (await reader.schedules([profileId])).get(profileId);
  if (!data) throw new AvailabilityError("NOT_FOUND", "Profil nicht gefunden.");
  return data;
}
function expected(schedule: Schedule, version: number) {
  if (schedule.version !== version) throw new AvailabilityError("CONFLICT", "Verfügbarkeit wurde inzwischen geändert. Bitte neu laden.");
}
type DayReplacement = { date: LocalDate; ranges: LocalTimeRange[]; deactivateIds: string[]; replacementId: string | null };
export type MergeSuggestion = { kind: "WEEKLY" | "REPLACE_DAY" | "EXCEPTION"; ranges: LocalTimeRange[]; deactivateIds: string[]; version: number; token: string; dayReplacements?: DayReplacement[] };
function proposal(data: Omit<MergeSuggestion, "token">, context: unknown): MergeSuggestion {
  return { ...data, token: JSON.stringify({ ...data, context }) }; // not a secret: binds explicit confirmation to this exact plan/version
}
type Mutation = { status: "SAVED"; version: number; id?: string } | { status: "MERGE_REQUIRED"; proposal: MergeSuggestion };
export type ExceptionInput = Omit<ExceptionRule, "id" | "version" | "startDate" | "endDate"> & { startDate: string; endDate: string };
export class AvailabilityManagement {
  constructor(private readonly repository: AvailabilityRepository, private readonly id: () => string) {}
  getWeeklyAvailability(actorId: string, profileId: string) {
    return result(() => this.repository.read(async r => { await authorized(r, actorId, profileId); const s = await schedule(r, profileId); return { version: s.version, weekly: s.weekly }; }));
  }
  getExceptions(actorId: string, profileId: string) {
    return result(() => this.repository.read(async r => { await authorized(r, actorId, profileId); const s = await schedule(r, profileId); return { version: s.version, exceptions: s.exceptions }; }));
  }
  setWeeklyDay(actorId: string, profileId: string, version: number, weekday: number, ranges: LocalTimeRange[], confirmation?: string) {
    return result(() => this.repository.write(actorId, profileId, async w => {
      await authorized(w, actorId, profileId); const current = await schedule(w, profileId); expected(current, version);
      ensure(Number.isInteger(weekday) && weekday >= 1 && weekday <= 7, "Wochentag muss 1–7 sein.");
      ensure(Array.isArray(ranges) && ranges.length <= 96, "Höchstens 96 Intervalle pro Tag.");
      const merge = mergeProposal(ranges);
      const dayReplacements: DayReplacement[] = [];
      const additionDates = [...new Set(current.exceptions.filter(e => e.active && e.type === "ADD_INTERVAL" && dayOfWeek(e.startDate) === weekday).map(e => e.startDate))].sort();
      for (const date of additionDates) {
        const replacement = current.exceptions.find(e => e.type === "REPLACE_DAY" && e.startDate === date);
        if (replacement?.active) continue; // This day is independent of the weekly plan.
        const additions = current.exceptions.filter(e => e.active && e.type === "ADD_INTERVAL" && e.startDate === date);
        const combined = mergeProposal([...merge.ranges, ...additions.flatMap(e => e.ranges)]);
        if (combined.required) dayReplacements.push({ date, ranges: combined.ranges, deactivateIds: additions.map(e => e.id).sort(), replacementId: replacement?.id ?? null });
      }
      if (merge.required || dayReplacements.length) {
        const suggested = proposal({ kind: "WEEKLY", ranges: merge.ranges, deactivateIds: dayReplacements.flatMap(d => d.deactivateIds).sort(), dayReplacements, version }, { profileId, weekday });
        if (confirmation !== suggested.token) return { status: "MERGE_REQUIRED", proposal: suggested } as Mutation;
      }
      for (const day of dayReplacements) {
        for (const id of day.deactivateIds) {
          const old = current.exceptions.find(e => e.id === id)!;
          await w.saveException(profileId, { ...old, active: false, version: old.version + 1 });
        }
        const old = current.exceptions.find(e => e.id === day.replacementId);
        await w.saveException(profileId, { id: day.replacementId ?? this.id(), type: "REPLACE_DAY", startDate: day.date, endDate: day.date, active: true, ranges: day.ranges, version: (old?.version ?? -1) + 1 });
      }
      await w.replaceWeekly(profileId, weekday, merge.ranges, version + 1);
      await w.advanceVersion(profileId, version);
      return { status: "SAVED", version: version + 1 } as Mutation;
    }));
  }
  saveException(actorId: string, profileId: string, version: number, input: ExceptionInput, id?: string, confirmation?: string) {
    return result(() => this.repository.write(actorId, profileId, async w => {
      await authorized(w, actorId, profileId); const current = await schedule(w, profileId); expected(current, version);
      const previous = id ? current.exceptions.find(e => e.id === id) : undefined;
      if (id && !previous) throw new AvailabilityError("NOT_FOUND", "Ausnahme nicht gefunden.");
      const rule: ExceptionRule = { id: id ?? this.id(), version: (previous?.version ?? -1) + 1, type: input.type, active: input.active,
        startDate: localDate(input.startDate), endDate: localDate(input.endDate), ranges: input.ranges.map(r => ({ start: r.start, end: r.end })) };
      validateException(rule); ensure(rule.ranges.length <= 96, "Höchstens 96 Intervalle pro Ausnahme.");
      const others = current.exceptions.filter(e => e.id !== id);
      const replacement = others.find(e => e.type === "REPLACE_DAY" && e.startDate === rule.startDate);
      if (rule.type === "REPLACE_DAY" && replacement) throw new AvailabilityError("CONFLICT", "Ersatzsatz existiert bereits; vorhandenen Satz bearbeiten.");
      let merged = mergeProposal(rule.ranges);
      let deactivate: ExceptionRule[] = [];
      let replacementTarget: ExceptionRule | undefined;
      let kind: MergeSuggestion["kind"] = "EXCEPTION";
      if (rule.active && rule.type !== "BLOCK_DAY") {
        // Ignore blocks during editing: a blocked day must not hide an overlapping addition.
        const dayOthers = others.filter(e => e.active && e.type !== "BLOCK_DAY" && e.startDate === rule.startDate);
        const base = rule.type === "ADD_INTERVAL"
          ? effectiveDay({ ...current, exceptions: dayOthers }, rule.startDate)
          : dayOthers.filter(e => e.type === "ADD_INTERVAL").flatMap(e => e.ranges);
        const combined = mergeProposal([...base, ...rule.ranges]);
        if (combined.required) {
          merged = combined; kind = "REPLACE_DAY";
          deactivate = dayOthers.filter(e => e.type === "ADD_INTERVAL");
          replacementTarget = rule.type === "ADD_INTERVAL" ? replacement : undefined;
          if (previous && previous.type === "ADD_INTERVAL") deactivate.push(previous);
        }
      }
      if (merged.required) {
        const suggested = proposal({ kind, ranges: merged.ranges, deactivateIds: deactivate.map(e => e.id).sort(), version },
          { profileId, id: id ?? null, input, replacementId: replacementTarget?.id ?? null });
        if (confirmation !== suggested.token) return { status: "MERGE_REQUIRED", proposal: suggested } as Mutation;
        for (const e of deactivate) await w.saveException(profileId, { ...e, active: false, version: e.version + 1 });
        if (kind === "REPLACE_DAY") {
          rule.type = "REPLACE_DAY";
          // Reuse the unique replacement row, including an inactive historical one.
          if (replacementTarget) { rule.id = replacementTarget.id; rule.version = replacementTarget.version + 1; }
          else if (previous?.type === "ADD_INTERVAL") { rule.id = this.id(); rule.version = 0; }
        }
      }
      rule.ranges = merged.ranges;
      await w.saveException(profileId, rule); await w.advanceVersion(profileId, version);
      return { status: "SAVED", version: version + 1, id: rule.id } as Mutation;
    }));
  }
  deactivateException(actorId: string, profileId: string, version: number, id: string) {
    return result(() => this.repository.write(actorId, profileId, async w => {
      await authorized(w, actorId, profileId); const current = await schedule(w, profileId); expected(current, version);
      const rule = current.exceptions.find(e => e.id === id);
      if (!rule) throw new AvailabilityError("NOT_FOUND", "Ausnahme nicht gefunden.");
      await w.saveException(profileId, { ...rule, active: false, version: rule.version + 1 }); await w.advanceVersion(profileId, version);
      return { status: "SAVED", version: version + 1 } as Mutation;
    }));
  }
  blockDateRange(actorId: string, profileId: string, version: number, from: string, to: string) {
    return this.saveException(actorId, profileId, version, { type: "BLOCK_DAY", startDate: from, endDate: to, active: true, ranges: [] });
  }
  getEffectiveDay(actorId: string, profileId: string, date: string) {
    return result(() => this.repository.read(async r => { await authorized(r, actorId, profileId); return effectiveDay(await schedule(r, profileId), localDate(date)); }));
  }
  getCommonDay(actorId: string, profileIds: string[], date: string) {
    return result(() => this.repository.read(async r => {
      for (const id of profileIds) await authorized(r, actorId, id);
      return commonDay(await Promise.all(profileIds.map(id => schedule(r, id))), localDate(date));
    }));
  }
}
export type Selection = { primaryProfileId: string; serviceId: string; participantIds: string[] };
export class PublicAvailability {
  constructor(private readonly repository: AvailabilityRepository, private readonly occupancy: OccupancyReader, private readonly now: () => number, private readonly step = 30) {}
  private async calculate(selection: Selection, from: string, to: string) {
    const days = datesBetween(localDate(from), localDate(to));
    const ids = [...new Set(selection.participantIds)];
    ensure(ids.length > 0 && ids.length <= 50 && ids.includes(selection.primaryProfileId), "Tatsächliche Teilnehmer einschließlich Primärprofil erforderlich.");
    const now = this.now();
    return this.repository.read(async r => {
      const duration = await r.publicSelection(ids, selection.primaryProfileId, selection.serviceId);
      if (duration === null) throw new AvailabilityError("NOT_FOUND", "Profil oder Service nicht öffentlich buchbar.");
      const data = await r.schedules(ids, days[0], days.at(-1)!);
      if (data.size !== ids.length) throw new AvailabilityError("NOT_FOUND", "Teilnehmer nicht verfügbar.");
      const busy = await this.occupancy.read(ids, { start: dayBounds(days[0]).start, end: dayBounds(days.at(-1)!).end });
      return days.map(date => ({ date, slots: slots(date, subtract(commonDay(ids.map(id => data.get(id)!), date), busy), duration, now, this.step) }));
    });
  }
  getBookableSlots(selection: Selection, date: string) { return result(async () => (await this.calculate(selection, date, date))[0].slots); }
  getBookableDays(selection: Selection, from: string, to: string) { return result(async () => (await this.calculate(selection, from, to)).filter(day => day.slots.length > 0).map(day => day.date)); }
}
