import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getInternalSession } from "@/shared/web/internal-session";
import styles from "../internal.module.css";

export default async function AdvisorHome(){
  const identity=await getInternalSession(await headers());
  if(!identity)redirect("/login");
  if(identity.role==="ADMIN")redirect("/internal/admin");

  return <main id="main" className={styles.main}>
    <section className={styles.hero}>
      <h1>Beraterbereich</h1>
      <p>Ihre autorisierten Termine, Leistungen und Verfügbarkeiten.</p>
      {!identity.profileId&&<p role="status" className={styles.error}>Ihr Konto ist noch keinem Beraterprofil zugeordnet. Bis zur Zuordnung stehen keine profilbezogenen Funktionen zur Verfügung.</p>}
    </section>
    {identity.profileId&&<div className={styles.grid}>
      <Link className={styles.card} href="/internal/appointments"><strong>Termine</strong><p>Tages-, Wochen- und Monatsansicht Ihrer tatsächlichen Termine öffnen.</p></Link>
      <Link className={styles.card} href="/internal/advisor/services"><strong>Leistungen und Verfügbarkeit</strong><p>{identity.canManageOwnServices?"Eigene Leistungen und Zeiten verwalten.":"Verfügbarkeit verwalten; Leistungen sind schreibgeschützt."}</p></Link>
    </div>}
  </main>;
}
