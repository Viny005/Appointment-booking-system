import { checkHealth } from "@/shared/application/check-health";
import { getDatabase } from "@/shared/infrastructure/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const healthy = await checkHealth({ check: async () => { await getDatabase().$queryRaw`SELECT 1`; } });
  return Response.json({ status: healthy ? "ok" : "unavailable" }, {
    status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" },
  });
}
