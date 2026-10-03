import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { internalCatalog } from "@/shared/web/profile-catalog";
import { createProfileAction } from "./actions";
import styles from "../../internal.module.css";
export const dynamic="force-dynamic";
export default async function CatalogPage({searchParams}:{searchParams:Promise<{created?:string,error?:string}>}){
 const api=await internalCatalog(await headers()); if(!api)redirect("/login"); const q=await searchParams,result=await api.queries.listProfiles();
 return <main id="main" className={styles.main}><section className={styles.hero}><h1>Profile und Leistungen</h1><p>Interner Katalog mit aktiven, inaktiven und Entwurfsprofilen.</p>{q.created&&<p role="status" className={styles.success}>Profil angelegt.</p>}{q.error&&<p role="alert" className={styles.error}>{q.error}</p>}</section>
 {api.role==="ADMIN"&&<section className={styles.panel}><h2>Profil anlegen</h2><form action={createProfileAction} className={styles.toolbar}><label className={styles.field}>Name<input name="name" required maxLength={200}/></label><label className={styles.field}>Titel<input name="title" required maxLength={200}/></label><label className={styles.field}>Beschreibung<input name="description" required maxLength={1000}/></label><label className={styles.field}>Benachrichtigungs-E-Mail<input name="email" type="email" required/></label><button className={styles.button}>Anlegen</button></form></section>}
 <section className={styles.panel}><h2>Profile</h2>{!result.ok?<p role="alert" className={styles.error}>{result.error.message}</p>:<div className={styles.grid}>{result.value.map(({profile,services})=><Link className={styles.card} key={profile.id} href={"/internal/admin/catalog/"+encodeURIComponent(profile.id)} aria-label={`${profile.name} verwalten`}><h3>{profile.name}</h3><p>{profile.title}</p><div className={styles.meta}><span>{profile.status}</span><span>{services.length} Leistungen</span></div><strong>Verwalten →</strong></Link>)}</div>}</section></main>
}
