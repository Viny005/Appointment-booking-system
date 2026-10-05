import type { PrismaClient } from "@/generated/prisma/client";
import type { SessionStore } from "../application/check-session";
import { ABSOLUTE_TIMEOUT_MS, IDLE_TIMEOUT_MS } from "../domain/session-policy";

export function prismaSessionStore(database: PrismaClient): SessionStore {
  return {
    async read(id) {
      const session = await database.session.findUnique({ where: { id }, include: { user: { include: { advisorProfile: { select: { id: true } } } } } });
      return session ? { ...session, active: session.user.active && !session.user.passwordMutationPending && session.securityGeneration === session.user.securityGeneration, identity: { id: session.user.id, role: session.user.role, profileId: session.user.advisorProfile?.id ?? null, canManageOwnServices: session.user.canManageOwnServices } } : null;
    },
    async touchIfValid(id, now) {
      const result = await database.session.updateMany({ where: {
        id, expiresAt: { gt: now }, createdAt: { gt: new Date(now.getTime() - ABSOLUTE_TIMEOUT_MS) },
        lastActivityAt: { gt: new Date(now.getTime() - IDLE_TIMEOUT_MS), lte: now },
        user: { active: true, passwordMutationPending: false },
      }, data: { lastActivityAt: now } });
      if (result.count !== 1) return false;
      const session = await database.session.findUnique({ where: { id }, select: { securityGeneration: true, user: { select: { securityGeneration: true } } } });
      return !!session && session.securityGeneration === session.user.securityGeneration;
    },
  };
}
