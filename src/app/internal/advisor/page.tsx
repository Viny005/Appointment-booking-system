import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getInternalSession } from "@/shared/web/internal-session";
export default async function AdvisorHome() {
  const identity = await getInternalSession(await headers());
  if (!identity) redirect("/login");
  return <main><h1>Beraterbereich</h1><p>Kalender und Terminoberfläche folgen im nächsten UI-Sprint.</p></main>;
}
