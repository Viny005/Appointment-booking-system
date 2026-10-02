import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getInternalSession } from "@/shared/web/internal-session";
export default async function AdminHome() {
  const identity = await getInternalSession(await headers());
  if (!identity) redirect("/login");
  if (identity.role !== "ADMIN") redirect("/internal/advisor");
  return <main><h1>Administration</h1><p>Die Verwaltungsfunktionen werden im nächsten UI-Sprint bereitgestellt.</p></main>;
}
