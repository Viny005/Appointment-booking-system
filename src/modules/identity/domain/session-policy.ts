export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000;
export type InternalRole = "ADMIN" | "ADVISOR";
export type InternalIdentity = { id: string; role: InternalRole; profileId: string | null; canManageOwnServices: boolean };
export type SessionState = {
  createdAt: Date; lastActivityAt: Date; expiresAt: Date; active: boolean;
};
export function isSessionUsable(session: SessionState, now: Date): boolean {
  const time = now.getTime();
  return session.active && time < session.expiresAt.getTime()
    && time < session.createdAt.getTime() + ABSOLUTE_TIMEOUT_MS
    && time < session.lastActivityAt.getTime() + IDLE_TIMEOUT_MS;
}
