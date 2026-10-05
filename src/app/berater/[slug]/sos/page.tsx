import Link from "next/link";
import { PUBLIC_RESOURCES, PUBLIC_RESOURCE_VERIFICATION } from "@/content/public-resources";
import { AdvisorShell } from "../advisor-shell";
import { loadPublicAdvisor } from "../public-advisor";
import styles from "../public-subpage.module.css";

export const dynamic = "force-dynamic";

export default async function SosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const advisor = await loadPublicAdvisor(slug);
  return <AdvisorShell advisor={advisor} slug={slug} current="sos">
    <section className={styles.hero}>
      <div>
        <p className={styles.eyebrow}>SOS & Assistance</p>
        <h1>Bei Gefahr zuerst die richtige Hilfe erreichen.</h1>
        <p className={styles.lead}>Diese Seite trennt echte Notfälle von vertraglichen Assistance- und Servicefällen. Warten Sie bei akuter Gefahr nicht auf eine Rückmeldung des Beraters.</p>
        <div className={styles.actions}>
          <a className={styles.primary} href="tel:112">112 anrufen</a>
          <a className={styles.secondary} href={PUBLIC_RESOURCES.generaliProtectionService.url} target="_blank" rel="noreferrer">Generali Schutzbrief-Service</a>
        </div>
      </div>
      <aside className={styles.heroAside}>
        <strong>112 nur bei echten Notfällen</strong>
        <p>Die 112 verbindet in der EU kostenlos mit Polizei, Rettungsdienst oder Feuerwehr. Für Vertrags- oder Servicefragen verwenden Sie die jeweilige offizielle Assistance-Seite.</p>
      </aside>
    </section>

    <section className={styles.section}>
      <div className={styles.grid}>
        <article className={styles.card}><span className={styles.number}>01</span><h3>Akute Gefahr</h3><p>Bei unmittelbarer Gefahr für Menschen oder einem echten medizinischen, polizeilichen oder Brand-Notfall: 112.</p><a href={PUBLIC_RESOURCES.euEmergency112.url} target="_blank" rel="noreferrer">EU-Information zu 112 →</a></article>
        <article className={styles.card}><span className={styles.number}>02</span><h3>Panne, Unfall oder Schutzbrief</h3><p>Aktuelle Assistance-Wege, Leistungen und Kontaktdaten direkt bei Generali prüfen. Die konkrete Leistung hängt vom Vertrag ab.</p><a href={PUBLIC_RESOURCES.generaliProtectionService.url} target="_blank" rel="noreferrer">Schutzbrief-Service öffnen →</a></article>
        <article className={styles.card}><span className={styles.number}>03</span><h3>Allgemeiner Kundenservice</h3><p>Für nicht akute Fragen zu Kontakt, Schaden und Service die aktuelle Generali-Kontaktübersicht verwenden.</p><a href={PUBLIC_RESOURCES.generaliContact.url} target="_blank" rel="noreferrer">Generali Kontakt öffnen →</a></article>
        <article className={styles.card}><span className={styles.number}>04</span><h3>Terminfrage</h3><p>Für Beratungstermine ist weiterhin diese Terminplattform zuständig. Änderungen an bestehenden Terminen erfolgen über den sicheren Link aus der Bestätigung.</p><Link href={"/book?advisor="+encodeURIComponent(advisor.profile.id)}>Neuen Termin buchen →</Link></article>
      </div>
      <p className={styles.small}>Quellen und externe Links geprüft am {PUBLIC_RESOURCE_VERIFICATION.verifiedAt}. Vertragsbedingungen und aktuelle Kontaktdaten des jeweiligen Betreibers bleiben maßgeblich.</p>
    </section>
  </AdvisorShell>;
}
