import { createHash } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";

export type RatePolicy = { scope: string; limit: number; windowMilliseconds: number };
/** Shared database counter: no process-local bypass, no raw identifiers or forwarded IP headers. */
export async function consumeRateLimit(db: PrismaClient, policy: RatePolicy, identity: string, now = Date.now()) {
  const { scope, limit, windowMilliseconds } = policy;
  if (!/^[a-z-]{1,60}$/.test(scope) || !Number.isInteger(limit) || limit < 1 || limit > 1000000 ||
    !Number.isInteger(windowMilliseconds) || windowMilliseconds < 1000 || windowMilliseconds > 86400000 || !Number.isFinite(now)) throw new Error("Invalid rate policy");
  const key = createHash("sha256").update(JSON.stringify([scope, identity])).digest("hex");
  const start = new Date(Math.floor(now / windowMilliseconds) * windowMilliseconds);
  const expires = new Date(start.getTime() + windowMilliseconds);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket" (key, "windowStart", count, "expiresAt") VALUES (${key}, ${start}, 1, ${expires})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN "RateLimitBucket"."windowStart" < ${start} THEN 1 ELSE LEAST("RateLimitBucket".count + 1, ${limit + 1}) END,
      "windowStart" = GREATEST("RateLimitBucket"."windowStart", ${start}),
      "expiresAt" = GREATEST("RateLimitBucket"."expiresAt", ${expires})
    RETURNING count`;
  return { allowed: rows[0].count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((expires.getTime() - now) / 1000)) };
}
