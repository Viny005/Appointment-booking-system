import type { CustomerManagement } from "../application/customer-management";
import { AppointmentError } from "../domain/appointment";
import { CatalogError } from "@/modules/profiles/domain/errors";
import { AvailabilityError } from "@/modules/availability/domain/values";
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
export function customerHttp(api: CustomerManagement, origin: string) {
  return async (request: Request) => {
    const response = (body: unknown, status = 200) => Response.json(body, { status, headers });
    try {
      if (request.method !== "POST") return response({ error: "METHOD_NOT_ALLOWED" }, 405);
      if (request.headers.get("origin") !== new URL(origin).origin || request.headers.get("sec-fetch-site") === "cross-site") return response({ error: "FORBIDDEN" }, 403);
      if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return response({ error: "UNSUPPORTED_MEDIA_TYPE" }, 415);
      const reader = request.body?.getReader(), chunks: Uint8Array[] = []; let size = 0;
      if (reader) for (;;) { const part = await reader.read(); if (part.done) break; size += part.value.length;
        if (size > 8192) { await reader.cancel(); return response({ error: "PAYLOAD_TOO_LARGE" }, 413); } chunks.push(part.value); }
      const data = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }
      let body;
      try { body = JSON.parse(new TextDecoder().decode(data)); } catch { return response({ error: "INVALID_INPUT" }, 400); }
      if (!body || typeof body !== "object" || Array.isArray(body)) return response({ error: "INVALID_INPUT" }, 400);
      const value = body.action === "read" ? await api.read(body.token) : body.action === "slots" ? await api.slots(body.token, body.date) : body.action === "change" ? await api.change(body.token, body.commandKey, body.command) : undefined;
      return value === undefined ? response({ error: "INVALID_ACTION" }, 400) : response({ value });
    } catch (e) {
      if (e instanceof AppointmentError || e instanceof CatalogError || e instanceof AvailabilityError) return response({ error: e.code, message: e.message }, e.code === "NOT_FOUND" ? 404 : e.code === "FORBIDDEN" ? 403 : e.code === "CONFLICT" ? 409 : e.code === "UNAVAILABLE" ? 503 : 400);
      return response({ error: "UNAVAILABLE", message: "Terminverwaltung derzeit nicht verfügbar." }, 503);
    }
  };
}
