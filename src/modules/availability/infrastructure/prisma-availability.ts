import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { assertPublishable, isValidActiveService } from "@/modules/profiles/domain/policies";
import { AvailabilityError, localDate } from "../domain/values";
import type { AvailabilityReader, AvailabilityRepository, AvailabilityWriter } from "../application/ports";

const date = (value: string) => new Date(value + "T00:00:00.000Z"); // SQL DATE transport, not a Berlin instant
function reader(tx: Prisma.TransactionClient): AvailabilityReader {
  return {
    async actor(id) {
      const user = await tx.user.findUnique({ where: { id }, select: { active: true, role: true, advisorProfile: { select: { id: true } } } });
      return user ? { active: user.active, role: user.role, profileId: user.advisorProfile?.id ?? null } : null;
    },
    async schedules(profileIds, from, to) {
      const rows = await tx.advisorProfile.findMany({ where: { id: { in: profileIds } }, select: {
        id: true, availabilityVersion: true, weeklyAvailability: { orderBy: [{ weekday: "asc" }, { startMinute: "asc" }] },
        availabilityExceptions: { where: from && to ? { startDate: { lte: date(to) }, endDate: { gte: date(from) } } : {}, include: { intervals: { orderBy: { startMinute: "asc" } } }, orderBy: { id: "asc" } },
      } });
      return new Map(rows.map(row => [row.id, { version: row.availabilityVersion,
        weekly: row.weeklyAvailability.map(r => ({ weekday: r.weekday, start: r.startMinute, end: r.endMinute })),
        exceptions: row.availabilityExceptions.map(e => ({ id: e.id, type: e.type, active: e.active, version: e.version,
          startDate: localDate(e.startDate.toISOString().slice(0, 10)), endDate: localDate(e.endDate.toISOString().slice(0, 10)), ranges: e.intervals.map(r => ({ start: r.startMinute, end: r.endMinute })) })),
      }]));
    },
    async publicSelection(profileIds, primaryProfileId, serviceId) {
      const profiles = await tx.advisorProfile.findMany({ where: { id: { in: profileIds } }, include: { services: true } });
      if (profiles.length !== profileIds.length) return null;
      for (const profile of profiles) {
        if (profile.status !== "ACTIVE") return null;
        try { assertPublishable({ profile, services: profile.services }); } catch { return null; }
      }
      const service = profiles.find(p => p.id === primaryProfileId)?.services.find(s => s.id === serviceId);
      return service && isValidActiveService(service) ? service.durationMinutes : null;
    },
  };
}
function writer(tx: Prisma.TransactionClient): AvailabilityWriter {
  return { ...reader(tx),
    async replaceWeekly(profileId, weekday, ranges, version) {
      // Weekly intervals are a versioned day-set, not historical business entities.
      await tx.weeklyAvailability.deleteMany({ where: { advisorProfileId: profileId, weekday } });
      await tx.weeklyAvailability.createMany({ data: ranges.map(r => ({ id: randomUUID(), advisorProfileId: profileId, weekday, startMinute: r.start, endMinute: r.end, version })) });
    },
    async saveException(profileId, rule) {
      const data = { advisorProfileId: profileId, type: rule.type, active: rule.active, startDate: date(rule.startDate), endDate: date(rule.endDate), version: rule.version };
      await tx.availabilityException.upsert({ where: { id: rule.id }, create: { id: rule.id, ...data }, update: data });
      await tx.availabilityExceptionInterval.deleteMany({ where: { exceptionId: rule.id } });
      await tx.availabilityExceptionInterval.createMany({ data: rule.ranges.map(r => ({ id: randomUUID(), exceptionId: rule.id, startMinute: r.start, endMinute: r.end })) });
    },
    async advanceVersion(profileId, version) {
      const changed = await tx.advisorProfile.updateMany({ where: { id: profileId, availabilityVersion: version }, data: { availabilityVersion: { increment: 1 } } });
      if (changed.count !== 1) throw new AvailabilityError("CONFLICT", "Verfügbarkeit wurde parallel geändert.");
    },
  };
}
async function translate<T>(work: () => Promise<T>): Promise<T> {
  try { return await work(); } catch (e) {
    if (e instanceof AvailabilityError) throw e;
    if (e instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034", "P2004"].includes(e.code)) throw new AvailabilityError("CONFLICT", "Verfügbarkeitsregel kollidiert mit vorhandenen Daten.");
    throw new AvailabilityError("UNAVAILABLE", "Verfügbarkeit konnte nicht gespeichert oder geladen werden.");
  }
}
export function prismaAvailability(db: PrismaClient): AvailabilityRepository {
  return {
    read: work => translate(() => db.$transaction(tx => work(reader(tx)), { isolationLevel: "RepeatableRead", timeout: 20000 })),
    write: (actorId, profileId, work) => translate(() => db.$transaction(async tx => {
      // Same order as the profile catalog: User, AdvisorProfile, then child rows.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${actorId} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM "AdvisorProfile" WHERE id = ${profileId} FOR UPDATE`;
      return work(writer(tx));
    }, { isolationLevel: "ReadCommitted", timeout: 10000, maxWait: 10000 })),
  };
}
