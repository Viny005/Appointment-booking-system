import Link from "next/link";
import { PUBLIC_RESOURCES } from "@/content/public-resources";
import { AdvisorShell } from "../advisor-shell";
import { loadPublicAdvisor } from "../public-advisor";
import styles from "../public-subpage.module.css";

export const dynamic = "force-dynamic";

export default async function TopicsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const advisor = await loadPublicAdvisor(slug);
  const booking = "/book?advisor="+encodeURIComponent(advisor.profile.id);
  return <AdvisorShell advisor={advisor} slug={slug} current="themen">
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>Themen & Leistungen</p><h1>Das Gespräch passend zum Anliegen auswählen.</h1><p className={styles.lead}>Hier erscheinen ausschließlich Leistungen, die für dieses Profil aktuell freigeschaltet und öffentlich buchbar sind.</p></div>
      <aside className={styles.heroAside}><strong>{advisor.services.length} buchbare {advisor.services.length===1?"Leistung":"Leistungen"}</strong><p>Freie Tage und Uhrzeiten werden erst nach der Auswahl live berechnet.</p></aside>
    </section>
    <section className={styles.section}>
      <div className={styles.grid}>{advisor.services.map(service=><article className={styles.card} key={service.id}><span className={styles.number}>{service.durationMinutes}</span><h3>{service.name}</h3><p>{service.description}</p><p className={styles.small}>Dauer: {service.durationMinutes} Minuten</p><Link href={booking}>Termin auswählen →</Link></article>)}</div>
    </section>
    <section className={styles.section}>
      <div className={styles.notice}>Weitere allgemeine Informationen zu Themen der Deutschen Vermögensberatung finden Sie auf der offiziellen DVAG-Seite. Welche konkrete Leistung dieses Profil anbietet, richtet sich ausschließlich nach der oben veröffentlichten Liste.</div>
      <div className={styles.actions}><a className={styles.secondary} href={PUBLIC_RESOURCES.dvagPrivateClients.url} target="_blank" rel="noreferrer">{PUBLIC_RESOURCES.dvagPrivateClients.label}</a></div>
    </section>
  </AdvisorShell>;
}
