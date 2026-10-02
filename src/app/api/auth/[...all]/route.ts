import { getAuth } from "@/modules/identity/infrastructure/auth";
import { getInternalSession } from "@/shared/web/internal-session";
import { secureRequest } from "@/shared/web/security-boundary";
import { preparePasswordResetMutation } from "@/modules/identity/infrastructure/password-reset";
import { getDatabase } from "@/shared/infrastructure/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const path = new URL(request.url).pathname;
  if (path === "/api/auth/get-session") {
    const identity = await getInternalSession(request.headers);
    return Response.json(identity, { status: identity ? 200 : 401, headers: { "Cache-Control": "no-store" } });
  }
  if (/^\/api\/auth\/reset-password\/[^/]+$/.test(path)) {
    const response = await getAuth().handler(request); response.headers.set("Cache-Control", "no-store"); return response;
  }
  return new Response(null, { status: 404 });
}
export async function POST(request: Request) {
  if (!["/api/auth/sign-in/email", "/api/auth/sign-out", "/api/auth/request-password-reset", "/api/auth/reset-password"].includes(new URL(request.url).pathname)) return new Response(null, { status: 404 });
  const reset = new URL(request.url).pathname === "/api/auth/reset-password";
  const response = await secureRequest(request, "auth", async guarded => {
    if (reset) await preparePasswordResetMutation(getDatabase(), guarded.clone());
    return getAuth().handler(guarded);
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
