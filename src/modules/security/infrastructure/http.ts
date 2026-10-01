import { createHmac } from "node:crypto";
import type { RatePolicy } from "./rate-limit";
import { securityConfiguration } from "./config";
import { isIP } from "node:net";
import { readDraftCookie } from "@/modules/booking/infrastructure/draft-http";

export type SecurityDependencies = { consume(policy: RatePolicy, identity: string): Promise<{ allowed: boolean; retryAfterSeconds: number }>; denied(reason: "ORIGIN" | "RATE_LIMIT" | "INVALID_CAPABILITY"): Promise<void> };
export async function secureHttp(request: Request, scope: "auth" | "draft" | "customer", next: (request: Request) => Promise<Response>, dependencies: SecurityDependencies, env: Record<string, string | undefined>) {
  const reply = (error: string, status: number, retry?: number) => Response.json({ error }, { status, headers: {
    "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", ...(retry ? { "Retry-After": String(retry) } : {}),
  } });
  try {
    const origin = new URL(env.BETTER_AUTH_URL ?? "").origin, config = securityConfiguration(env);
    const global = await dependencies.consume({ scope: `${scope}-global`, limit: scope === "auth" ? config.authGlobal : config.publicGlobal, windowMilliseconds: 60000 }, "global");
    if (!global.allowed) { await dependencies.denied("RATE_LIMIT"); return reply("RATE_LIMIT", 429, global.retryAfterSeconds); }
    if (request.method !== "GET" && (request.headers.get("origin") !== origin || request.headers.get("sec-fetch-site") === "cross-site")) {
      await dependencies.denied("ORIGIN"); return reply("FORBIDDEN", 403);
    }
    if (config.trustedIpHeader) {
      const raw = request.headers.get(config.trustedIpHeader), secret = env.BETTER_AUTH_SECRET;
      if (!raw || !isIP(raw) || !secret || secret.length < 32) return reply("UNAVAILABLE", 503);
      const canonical = isIP(raw) === 6 ? new URL(`http://[${raw}]/`).hostname : raw;
      const identity = createHmac("sha256", secret).update(`ip-rate:${canonical}`).digest("hex");
      const ip = await dependencies.consume({ scope: `${scope}-ip`, limit: scope === "auth" ? config.authIp : config.publicIp, windowMilliseconds: 60000 }, identity);
      if (!ip.allowed) { await dependencies.denied("RATE_LIMIT"); return reply("RATE_LIMIT", 429, ip.retryAfterSeconds); }
    }
    let forwarded = request, body: Record<string, unknown> = {};
    if (request.method !== "GET") {
      if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return reply("UNSUPPORTED_MEDIA_TYPE", 415);
      const reader = request.body?.getReader(), parts: Uint8Array[] = []; let length = 0;
      if (reader) for (;;) { const part = await reader.read(); if (part.done) break; length += part.value.length;
        if (length > (scope === "draft" ? 32768 : 8192)) { await reader.cancel(); return reply("PAYLOAD_TOO_LARGE", 413); } parts.push(part.value); }
      const bytes = new Uint8Array(length); let offset = 0; for (const part of parts) { bytes.set(part, offset); offset += part.length; }
      try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { return reply("INVALID_INPUT", 400); }
      if (!body || typeof body !== "object" || Array.isArray(body)) return reply("INVALID_INPUT", 400);
      const headers = new Headers(request.headers); headers.set("content-length", String(length));
      forwarded = new Request(request.url, { method: request.method, headers, body: bytes });
    }
    let identity = scope === "customer" ? body.token : scope === "draft" ? readDraftCookie(request, env.NODE_ENV === "production") : null;
    if (scope === "auth" && typeof body.email === "string") {
      const secret = env.BETTER_AUTH_SECRET;
      if (!secret || secret.length < 32) return reply("UNAVAILABLE", 503);
      identity = createHmac("sha256", secret).update(`auth-rate:${body.email.trim().toLowerCase()}`).digest("hex");
    }
    if (typeof identity === "string" && identity.length > 0 && identity.length <= 256) {
      const bucket = await dependencies.consume({ scope: `${scope}-identity`, limit: scope === "auth" ? config.authIdentity : config.publicIdentity, windowMilliseconds: 60000 }, identity);
      if (!bucket.allowed) { await dependencies.denied("RATE_LIMIT"); return reply("RATE_LIMIT", 429, bucket.retryAfterSeconds); }
    }
    const response = await next(forwarded);
    if (scope === "customer" && response.status === 404) await dependencies.denied("INVALID_CAPABILITY");
    response.headers.set("Cache-Control", "no-store"); response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch { return reply("UNAVAILABLE", 503); }
}
