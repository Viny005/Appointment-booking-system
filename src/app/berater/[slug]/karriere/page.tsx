import Link from "next/link";
import { PUBLIC_RESOURCES } from "@/content/public-resources";
import { AdvisorShell } from "../advisor-shell";
import { loadPublicAdvisor } from "../public-advisor";
import styles from "../public-subpage.module.css";

export const dynamic = "force-dynamic";

export default async function CareerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const advisor = await loadPublicAdvisor(slug);
  return <AdvisorShell advisor={advisor} slug={slug} current="karriere">
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>Karriere</p><h1>Mehr über Einstiegsmöglichkeiten bei der DVAG erfahren.</h1><p className={styles.lead}>Diese Seite leitet bewusst auf die offiziellen DVAG-Karriereseiten weiter. Sie behauptet keine persönliche Arbeitgeber- oder Recruitingrolle des veröffentlichten Beraterprofils.</p></div>
      <aside className={styles.heroAside}><strong>Externe Informationen</strong><p>Berufsbild, Ausbildung, Nebenberuf und Bewerbung werden von der DVAG auf ihren offiziellen Karriereseiten beschrieben.</p></aside>
    </section>
    <section className={styles.section}>
      <div className={styles.linkList}>
        {[PUBLIC_RESOURCES.dvagCareer,PUBLIC_RESOURCES.dvagCareerProfession,PUBLIC_RESOURCES.dvagCareerPartTime,PUBLIC_RESOURCES.dvagCareerApply].map(item=><a className={styles.linkRow} key={item.url} href={item.url} target="_blank" rel="noreferrer"><strong>{item.label}</strong><span>{item.description} →</span></a>)}
      </div>
      <div className={styles.actions}><Link className={styles.secondary} href={"/book?advisor="+encodeURIComponent(advisor.profile.id)}>Stattdessen Termin buchen</Link></div>
    </section>
  </AdvisorShell>;
}
