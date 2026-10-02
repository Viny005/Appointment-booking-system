import type { RetentionPolicy } from "../domain/retention";
export function retentionConfiguration(env: Record<string, string | undefined> = process.env): RetentionPolicy & { auditMonths: number; denialDays: number } {
  const number = (key: string, fallback: number, max: number) => {
    const raw = env[key] ?? String(fallback);
    if (!/^[1-9][0-9]*$/.test(raw) || Number(raw) > max) throw new Error("Invalid retention configuration");
    return Number(raw);
  };
  return { endedMonths: number("RETENTION_ENDED_MONTHS", 12, 120), cancelledMonths: number("RETENTION_CANCELLED_MONTHS", 6, 120),
    auditMonths: number("RETENTION_AUDIT_MONTHS", 12, 120), denialDays: number("RETENTION_DENIAL_DAYS", 30, 365) };
}
