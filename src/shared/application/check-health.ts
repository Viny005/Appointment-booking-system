export interface DatabaseProbe { check(): Promise<void> }

export async function checkHealth(database: DatabaseProbe): Promise<boolean> {
  try { await database.check(); return true; } catch { return false; }
}
