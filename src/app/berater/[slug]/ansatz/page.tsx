import Link from "next/link";
import { AdvisorShell } from "../advisor-shell";
import { loadPublicAdvisor } from "../public-advisor";
import styles from "../public-subpage.module.css";

export const dynamic = "force-dynamic";
const steps = [
  ["Verstehen","Ziele, Prioritäten und die aktuelle Situation zuerst erfassen."],
  ["Ordnen","Themen und Abhängigkeiten strukturiert zusammenführen."],
  ["Erklären","Optionen, Annahmen und offene Fragen verständlich darstellen."],
  ["Planen","Konkrete nächste Schritte und passende Gesprächsschwerpunkte festlegen."],
  ["Anpassen","Bei Veränderungen erneut prüfen, statt mit veralteten Annahmen weiterzuarbeiten."],
] as const;

export default async function ApproachPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const advisor = await loadPublicAdvisor(slug);
  return <AdvisorShell advisor={advisor} slug={slug} current="ansatz">
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>Ansatz</p><h1>Erst Klarheit, dann der nächste Schritt.</h1><p className={styles.lead}>Ein strukturiertes Gespräch beginnt nicht mit einem Produkt, sondern mit der Frage, was erreicht werden soll und welche Informationen dafür relevant sind.</p>
      <div className={styles.actions}><Link className={styles.primary} href={"/book?advisor="+encodeURIComponent(advisor.profile.id)}>Gespräch planen</Link></div></div>
      <aside className={styles.heroAside}><strong>Transparent vorbereitet</strong><p>Die öffentliche Terminbuchung fragt nur die Informationen ab, die für Auswahl und Organisation des Termins erforderlich sind.</p></aside>
    </section>
    <section className={styles.section}>
      <div className={styles.sectionIntro}><p className={styles.eyebrow}>Ablauf</p><h2>Fünf Schritte für ein strukturiertes Gespräch</h2></div>
      <div className={styles.grid}>{steps.map(([title,text],i)=><article className={styles.card} key={title}><span className={styles.number}>{String(i+1).padStart(2,"0")}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
  </AdvisorShell>;
}
