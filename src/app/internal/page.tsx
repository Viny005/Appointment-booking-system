import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getInternalSession } from "@/shared/web/internal-session";
export default async function InternalPage() {
  const identity = await getInternalSession(await headers());
  if (!identity) redirect("/login");
  redirect(identity.role === "ADMIN" ? "/internal/admin" : "/internal/advisor");
}
