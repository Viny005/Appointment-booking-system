import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getInternalSession } from "@/shared/web/internal-session";
import { internalAdminService } from "@/shared/web/internal-admin";
import { updateUserAction } from "./actions";
import styles from "../internal.module.css";
export const dynamic="force-dynamic";
export default async function AdminHome({searchParams}:{searchParams:Promise<{updated?:string,error?:string}>}) {
 const identity=await getInternalSession(await headers()); if(!identity)redirect("/login"); if(identity.role!=="ADMIN")redirect("/internal/advisor");
 const q=await searchParams,result=await internalAdminService().list(identity.id);
 return <main id="main" className={styles.main}><section className={styles.hero}><h1>Administration</h1><p>Interne Konten und Verwaltungszugänge. Sicherheitskritische Änderungen widerrufen bestehende Sitzungen.</p>
 {q.updated&&<p role="status" className={styles.success}>Änderung gespeichert.</p>}{q.error&&<p role="alert" className={styles.error}>{q.error}</p>}</section>
 <section className={styles.panel}><h2>Schnellzugriff</h2><div className={styles.grid}><Link className={styles.card} href="/internal/appointments"><strong>Termine verwalten</strong><p>Tag, Woche, Monat, Details und Aktionen.</p></Link>
 <Link className={styles.card} href="/internal/admin/catalog"><strong>Profile und Leistungen</strong><p>Katalog, Beziehungen und Verfügbarkeiten.</p></Link></div></section>
 <section className={styles.panel}><h2>Interne Konten</h2>{!result.ok?<p role="alert" className={styles.error}>{result.error.message}</p>:<div className={styles.grid}>{result.value.map(u=><article className={styles.card} key={u.id}><h3>{u.name}</h3><p>{u.email}</p><div className={styles.meta}><span>{u.role}</span><span>{u.active?"Aktiv":"Inaktiv"}</span></div>
 <form action={updateUserAction} className={styles.toolbar}><input type="hidden" name="id" value={u.id}/><button className={styles.button} name="operation" value={u.active?"deactivate":"activate"}>{u.active?"Deaktivieren":"Aktivieren"}</button><button className={styles.button} name="operation" value={u.role==="ADMIN"?"advisor":"admin"}>Rolle: {u.role==="ADMIN"?"ADVISOR":"ADMIN"}</button></form></article>)}</div>}</section></main>
}
