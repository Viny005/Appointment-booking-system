import Link from "next/link";
import { PUBLIC_RESOURCES } from "@/content/public-resources";
import { AdvisorShell } from "../advisor-shell";
import { advisorPath, loadPublicAdvisor } from "../public-advisor";
import styles from "../public-subpage.module.css";

export const dynamic = "force-dynamic";

export default async function ClientAreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const advisor = await loadPublicAdvisor(slug);
  return <AdvisorShell advisor={advisor} slug={slug} current="kundenbereich">
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>Kundenbereich</p><h1>Termin, Vorbereitung und externe Kundenservices.</h1><p className={styles.lead}>Diese Seite bündelt die nächsten Schritte, ohne Zugangsdaten zu externen Systemen in unserer Anwendung zu speichern.</p></div>
      <aside className={styles.heroAside}><strong>Datensparsam</strong><p>Das DVAG Kundenportal öffnet sich als externer Dienst. Zugangsdaten werden ausschließlich dort eingegeben.</p></aside>
    </section>
    <section className={styles.section}>
      <div className={styles.grid}>
        <article className={styles.card}><span className={styles.number}>01</span><h3>Neuen Termin planen</h3><p>Eine veröffentlichte Leistung auswählen und einen tatsächlich freien Zeitpunkt buchen.</p><Link href={"/book?advisor="+encodeURIComponent(advisor.profile.id)}>Termin buchen →</Link></article>
        <article className={styles.card}><span className={styles.number}>02</span><h3>Bestehenden Termin verwalten</h3><p>Ändern oder stornieren Sie über den persönlichen Verwaltungslink aus der Bestätigungs-E-Mail.</p><p className={styles.small}>Der sichere Token wird absichtlich nicht über eine öffentliche Suche abgefragt.</p></article>
        <article className={styles.card}><span className={styles.number}>03</span><h3>Gespräch vorbereiten</h3><p>Fragen und Ziele vorab notieren. Sensible Dokumente werden nicht über die öffentliche Terminseite hochgeladen.</p><Link href={advisorPath(slug,"vorbereitung")}>Vorbereitung öffnen →</Link></article>
        <article className={styles.card}><span className={styles.number}>04</span><h3>{PUBLIC_RESOURCES.dvagCustomerPortal.label}</h3><p>{PUBLIC_RESOURCES.dvagCustomerPortal.description}</p><a href={PUBLIC_RESOURCES.dvagCustomerPortal.url} target="_blank" rel="noreferrer">Kundenportal öffnen →</a></article>
        <article className={styles.card}><span className={styles.number}>05</span><h3>Service & Hilfe</h3><p>Verifizierte Links zu offiziellen externen Serviceangeboten.</p><Link href={advisorPath(slug,"service-hilfe")}>Serviceübersicht →</Link></article>
      </div>
    </section>
  </AdvisorShell>;
}
