import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getInternalSession } from "@/shared/web/internal-session";
import { LogoutButton } from "./logout-button";

export default async function InternalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const identity = await getInternalSession(await headers(), true);
  if (!identity) redirect("/login");
  return <><header><strong>Interner Bereich</strong><span> {identity.role}</span><LogoutButton /></header>{children}</>;
}
