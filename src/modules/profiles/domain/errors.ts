export type CatalogErrorCode = "INVALID_INPUT" | "PROFILE_INCOMPLETE" | "LAST_ACTIVE_SERVICE"
  | "INVALID_TRANSITION" | "NOT_FOUND" | "FORBIDDEN" | "CONFLICT"
  | "REQUIRED_PARTICIPANT_UNAVAILABLE" | "PERSISTENCE_UNAVAILABLE";
export class CatalogError extends Error {
  constructor(public readonly code: CatalogErrorCode, message: string, public readonly field?: string) {
    super(message);
    this.name = "CatalogError";
  }
}
export type Result<T> = { ok: true; value: T } | { ok: false; error: { code: CatalogErrorCode; message: string; field?: string } };
export function requireRule(condition: unknown, message: string, field?: string): asserts condition {
  if (!condition) throw new CatalogError("INVALID_INPUT", message, field);
}
