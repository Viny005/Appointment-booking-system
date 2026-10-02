import "server-only";
import { getDatabase } from "@/shared/infrastructure/database";
import { consumeRateLimit } from "@/modules/security/infrastructure/rate-limit";
import { recordDenied } from "@/modules/audit/infrastructure/audit";
import { secureHttp } from "@/modules/security/infrastructure/http";
export async function secureRequest(request: Request, scope: "auth" | "draft" | "customer", next: (request: Request) => Promise<Response>) {
  return secureHttp(request, scope, next, {
    consume: (policy, identity) => consumeRateLimit(getDatabase(), policy, identity),
    denied: reason => recordDenied(getDatabase(), null, null, reason),
  }, process.env);
}
