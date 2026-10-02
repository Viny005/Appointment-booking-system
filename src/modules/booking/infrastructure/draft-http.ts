import type { BookingDrafts } from "../application/drafts";
import type { DraftCommand } from "../domain/draft";
export const draftCookieName = (production: boolean) => production ? "__Host-booking-draft" : "booking-draft";
export function draftCookie(raw: string, production: boolean) {
  return `${draftCookieName(production)}=${raw}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${production ? "; Secure" : ""}`;
}
export function readDraftCookie(request: Request, production: boolean) {
  const name = draftCookieName(production), cookies = (request.headers.get("cookie") ?? "").split(";").map(c => c.trim());
  const matches = cookies.filter(c => c.startsWith(name + "="));
  return matches.length === 1 ? matches[0].slice(name.length + 1) : "";
}
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
function response(body: unknown, status = 200, cookie?: string) { return Response.json(body, { status, headers: { ...headers, ...(cookie ? { "Set-Cookie": cookie } : {}) } }); }
// Explicit server-configured origin; never trust a request Host header as the allowlist.
export function draftHttp(api: BookingDrafts, origin: string, production: boolean) {
  return async (request: Request): Promise<Response> => {
    try {
      const cookie = readDraftCookie(request, production);
      if (request.method === "GET") {
        const result = await api.read(cookie); return response(result, result.ok ? 200 : 404);
      }
      if (request.method !== "POST") return response({ error: "METHOD_NOT_ALLOWED" }, 405);
      if (request.headers.get("origin") !== new URL(origin).origin || request.headers.get("sec-fetch-site") === "cross-site") return response({ error: "FORBIDDEN" }, 403);
      if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return response({ error: "UNSUPPORTED_MEDIA_TYPE" }, 415);
      if (Number(request.headers.get("content-length") ?? 0) > 32768) return response({ error: "PAYLOAD_TOO_LARGE" }, 413);
      const reader = request.body?.getReader(); let size = 0; const parts: Uint8Array[] = [];
      if (reader) for (;;) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.length; if (size > 32768) { await reader.cancel(); return response({ error: "PAYLOAD_TOO_LARGE" }, 413); } parts.push(chunk.value); }
      const buffer = new Uint8Array(size); let offset = 0; for (const part of parts) { buffer.set(part, offset); offset += part.length; }
      const body = JSON.parse(new TextDecoder().decode(buffer));
      if (!body || typeof body !== "object" || Array.isArray(body)) return response({ error: "INVALID_INPUT" }, 400);
      if (body.action === "create") {
        const created = await api.create();
        if (!created.ok) return response(created, 503);
        const { cookie: raw, ...value } = created.value; return response({ ok: true, value }, 201, draftCookie(raw, production));
      }
      const result = body.action === "review" ? await api.review(cookie) : body.action === "change" ? await api.change(cookie, body.version, body.command as DraftCommand) : null;
      // Confirm intentionally unavailable until the outbox sprint makes delivery atomic.
      if (!result) return response({ error: "INVALID_ACTION" }, 400);
      return response(result, result.ok ? 200 : result.error.code === "CONFLICT" ? 409 : result.error.code === "NOT_FOUND" ? 404 : 400);
    } catch { return response({ error: "INVALID_REQUEST" }, 400); }
  };
}
