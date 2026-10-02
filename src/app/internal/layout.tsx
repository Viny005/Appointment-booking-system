import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getInternalSession } from "@/shared/web/internal-session";
import { LogoutButton } from "./logout-button";
import styles from "./internal.module.css";

export default async function InternalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const identity = await getInternalSession(await headers(), true);
  if (!identity) redirect("/login");
  return <div className={styles.shell}>
    <header className={styles.header}>
      <Link className={styles.brand} href="/internal">Terminverwaltung</Link>
      <nav aria-label="Interne Navigation" className={styles.nav}>
        <Link href="/internal/appointments">Termine</Link>
        {identity.role === "ADMIN" && <Link href="/internal/admin">Administration</Link>}
        {identity.role === "ADVISOR" && <Link href="/internal/advisor">Beraterbereich</Link>}
      </nav>
      <div className={styles.account}><span>{identity.role}</span><LogoutButton /></div>
    </header>
    {children}
  </div>;
}
