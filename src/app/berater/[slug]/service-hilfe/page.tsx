import Link from "next/link";
import { PUBLIC_RESOURCES, PUBLIC_RESOURCE_VERIFICATION } from "@/content/public-resources";
import { AdvisorShell } from "../advisor-shell";
import { loadPublicAdvisor } from "../public-advisor";
import styles from "../public-subpage.module.css";

export const dynamic = "force-dynamic";

export default async function ServiceHelpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const advisor = await loadPublicAdvisor(slug);
  return <AdvisorShell advisor={advisor} slug={slug} current="service-hilfe">
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>Service & Hilfe</p><h1>Für jedes Anliegen die richtige Anlaufstelle.</h1><p className={styles.lead}>Terminfragen bleiben in dieser Anwendung. Vertrags-, Schaden- und Kundenportalthemen führen direkt zu den offiziellen Diensten ihrer jeweiligen Betreiber.</p></div>
      <aside className={styles.heroAside}><strong>Aktuelle statt kopierte Nummern</strong><p>Service-Telefonnummern werden hier nicht statisch nachgebaut. So vermeiden wir, dass später veraltete Rufnummern angezeigt werden.</p></aside>
    </section>
    <section className={styles.section}>
      <div className={styles.linkList}>
        <Link className={styles.linkRow} href={"/book?advisor="+encodeURIComponent(advisor.profile.id)}><strong>Neuen Termin buchen</strong><span>Freie Zeiten dieses Profils →</span></Link>
        {[PUBLIC_RESOURCES.dvagCustomerPortal,PUBLIC_RESOURCES.generaliContact,PUBLIC_RESOURCES.dvagPrivateClients].map(item=><a className={styles.linkRow} key={item.url} href={item.url} target="_blank" rel="noreferrer"><strong>{item.label}</strong><span>{item.description} →</span></a>)}
      </div>
      <p className={styles.notice}>Bei einem bestehenden Termin verwenden Sie für Änderungen oder eine Absage den persönlichen Verwaltungslink aus Ihrer Bestätigungs-E-Mail. Dadurch wird kein Management-Token über eine öffentliche Suchmaske übertragen.</p>
      <p className={styles.small}>Externe Links geprüft am {PUBLIC_RESOURCE_VERIFICATION.verifiedAt}. {PUBLIC_RESOURCE_VERIFICATION.note}</p>
    </section>
  </AdvisorShell>;
}
