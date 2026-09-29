import type { PrismaClient } from "@/generated/prisma/client";
import type { SessionStore } from "../application/check-session";
import { ABSOLUTE_TIMEOUT_MS, IDLE_TIMEOUT_MS } from "../domain/session-policy";

export function prismaSessionStore(database: PrismaClient): SessionStore {
  return {
    async read(id) {
      const session = await database.session.findUnique({ where: { id }, include: { user: true } });
      return session ? { ...session, active: session.user.active, identity: { id: session.user.id, role: session.user.role } } : null;
    },
    async touchIfValid(id, now) {
      const result = await database.session.updateMany({ where: {
        id, expiresAt: { gt: now }, createdAt: { gt: new Date(now.getTime() - ABSOLUTE_TIMEOUT_MS) },
        lastActivityAt: { gt: new Date(now.getTime() - IDLE_TIMEOUT_MS), lte: now }, user: { active: true },
      }, data: { lastActivityAt: now } });
      return result.count === 1;
    },
  };
}
