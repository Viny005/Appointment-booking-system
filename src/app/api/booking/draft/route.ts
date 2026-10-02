import { bookingDrafts } from "@/shared/web/booking-draft";
import { draftHttp } from "@/modules/booking/infrastructure/draft-http";
import { secureRequest } from "@/shared/web/security-boundary";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  const origin = process.env.BETTER_AUTH_URL;
  if (!origin) return Response.json({ error: "UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return secureRequest(request, "draft", guarded => draftHttp(bookingDrafts(), origin, process.env.NODE_ENV === "production")(guarded));
}
export const GET = handle;
export const POST = handle;
