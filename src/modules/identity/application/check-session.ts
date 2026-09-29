import { isSessionUsable, type InternalIdentity, type SessionState } from "../domain/session-policy";

export interface SessionStore {
  read(id: string): Promise<(SessionState & { identity: InternalIdentity }) | null>;
  touchIfValid(id: string, now: Date): Promise<boolean>;
}
export async function checkSession(store: SessionStore, id: string, now: Date, explicitUserAction = false): Promise<InternalIdentity | null> {
  const session = await store.read(id);
  if (!session || !isSessionUsable(session, now)) return null;
  if (explicitUserAction && !await store.touchIfValid(id, now)) return null;
  return session.identity;
}
