import "server-only";
import { getAuth } from "@/modules/identity/infrastructure/auth";
import { checkSession } from "@/modules/identity/application/check-session";
import { prismaSessionStore } from "@/modules/identity/infrastructure/session-store";
import { getDatabase } from "@/shared/infrastructure/database";

// Server callers decide whether this is an explicit user action. Polling must use false.
export async function getInternalSession(headers: Headers, explicitUserAction = false) {
  const session = await getAuth().api.getSession({ headers });
  if (!session) return null;
  return checkSession(prismaSessionStore(getDatabase()), session.session.id, new Date(), explicitUserAction);
}
