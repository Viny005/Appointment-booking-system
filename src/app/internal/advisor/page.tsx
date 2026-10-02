import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getInternalSession } from "@/shared/web/internal-session";
import styles from "../internal.module.css";
export default async function AdvisorHome(){
 const identity=await getInternalSession(await headers());if(!identity)redirect("/login");
 return <main id="main" className={styles.main}><section className={styles.hero}><h1>Beraterbereich</h1><p>Ihre autorisierten Termine und Verwaltungsfunktionen.</p></section><div className={styles.grid}><Link className={styles.card} href="/internal/appointments"><strong>Termine</strong><p>Tages-, Wochen- und Monatsansicht öffnen.</p></Link></div></main>
}
