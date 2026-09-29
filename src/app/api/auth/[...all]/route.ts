import { getAuth } from "@/modules/identity/infrastructure/auth";
import { getInternalSession } from "@/shared/web/internal-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (new URL(request.url).pathname !== "/api/auth/get-session") return new Response(null, { status: 404 });
  const identity = await getInternalSession(request.headers);
  return Response.json(identity, { status: identity ? 200 : 401, headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  if (!["/api/auth/sign-in/email", "/api/auth/sign-out"].includes(new URL(request.url).pathname)) return new Response(null, { status: 404 });
  const response = await getAuth().handler(request);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
