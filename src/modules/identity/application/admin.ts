export type ManagedRole = "ADMIN" | "ADVISOR";
export type ManagedUser = {
  id: string; name: string; email: string; role: ManagedRole; active: boolean;
  canManageOwnServices: boolean; profileId: string | null; securityGeneration: number;
};
export type AdminErrorCode = "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INVALID_INPUT" | "PERSISTENCE_UNAVAILABLE";
export class AdminError extends Error {
  constructor(readonly code: AdminErrorCode, message: string, readonly field?: string) { super(message); }
}
export type AdminResult<T> = { ok: true; value: T } | { ok: false; error: { code: AdminErrorCode; message: string; field?: string } };
export interface AdminWriter {
  getUser(id: string): Promise<ManagedUser | null>;
  listUsers(): Promise<ManagedUser[]>;
  createUser(input: { id: string; name: string; email: string; role: ManagedRole; passwordHash: string }): Promise<ManagedUser>;
  updateUser(id: string, data: Partial<Pick<ManagedUser, "name" | "role" | "active" | "canManageOwnServices" | "securityGeneration">>): Promise<ManagedUser>;
  revokeSessions(id: string): Promise<void>;
  countActiveAdmins(): Promise<number>;
  audit(actorId: string, userId: string, changedFields: string[]): Promise<void>;
}
export interface AdminRepository {
  read<T>(work: (writer: AdminWriter) => Promise<T>): Promise<T>;
  write<T>(actorId: string, targetIds: string[], work: (writer: AdminWriter) => Promise<T>): Promise<T>;
}
function cleanName(value: string) {
  const result = value.trim();
  if (result.length < 1 || result.length > 200) throw new AdminError("INVALID_INPUT", "Name ist erforderlich.", "name");
  return result;
}
function cleanEmail(value: string) {
  const result = value.trim().toLowerCase();
  if (result.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new AdminError("INVALID_INPUT", "Ungueltige E-Mail-Adresse.", "email");
  return result;
}
async function asResult<T>(work: () => Promise<T>): Promise<AdminResult<T>> {
  try { return { ok: true, value: await work() }; }
  catch (error) {
    if (error instanceof AdminError) return { ok: false, error: { code: error.code, message: error.message, field: error.field } };
    return { ok: false, error: { code: "PERSISTENCE_UNAVAILABLE", message: "Benutzerverwaltung ist momentan nicht verfuegbar." } };
  }
}
export class InternalAdmin {
  constructor(private readonly repository: AdminRepository, private readonly id: () => string, private readonly hashPassword: (password: string) => Promise<string>) {}
  list(actorId: string) {
    return asResult(() => this.repository.read(async writer => {
      const actor = await writer.getUser(actorId);
      if (!actor?.active || actor.role !== "ADMIN") throw new AdminError("FORBIDDEN", "Keine Berechtigung.");
      return writer.listUsers();
    }));
  }
  create(actorId: string, input: { name: string; email: string; role: ManagedRole; initialPassword: string }) {
    return asResult(() => this.repository.write(actorId, [], async writer => {
      const actor = await writer.getUser(actorId);
      if (!actor?.active || actor.role !== "ADMIN") throw new AdminError("FORBIDDEN", "Keine Berechtigung.");
      if (input.initialPassword.length < 16) throw new AdminError("INVALID_INPUT", "Initialpasswort muss mindestens 16 Zeichen haben.", "initialPassword");
      const user = await writer.createUser({ id: this.id(), name: cleanName(input.name), email: cleanEmail(input.email), role: input.role, passwordHash: await this.hashPassword(input.initialPassword) });
      await writer.audit(actorId, user.id, ["name", "email", "role", "active"]);
      return user;
    }));
  }
  update(actorId: string, userId: string, data: { name?: string; role?: ManagedRole; active?: boolean; canManageOwnServices?: boolean }) {
    return asResult(() => this.repository.write(actorId, [userId], async writer => {
      const actor = await writer.getUser(actorId), target = await writer.getUser(userId);
      if (!actor?.active || actor.role !== "ADMIN") throw new AdminError("FORBIDDEN", "Keine Berechtigung.");
      if (!target) throw new AdminError("NOT_FOUND", "Benutzer nicht gefunden.");
      const next = { ...data, ...(data.name === undefined ? {} : { name: cleanName(data.name) }) };
      const removesAdmin = target.active && target.role === "ADMIN" && (data.active === false || data.role === "ADVISOR");
      if (removesAdmin && await writer.countActiveAdmins() <= 1) throw new AdminError("CONFLICT", "Der letzte aktive Administrator kann nicht deaktiviert oder herabgestuft werden.");
      const changed = Object.keys(next).filter(key => next[key as keyof typeof next] !== target[key as keyof ManagedUser]);
      if (!changed.length) return target;
      const securityChange = data.active === false || (data.role !== undefined && data.role !== target.role);
      const updated = await writer.updateUser(userId, securityChange ? { ...next, securityGeneration: target.securityGeneration + 1 } : next);
      if (securityChange) await writer.revokeSessions(userId);
      await writer.audit(actorId, userId, changed);
      return updated;
    }));
  }
}
