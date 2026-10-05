import Link from "next/link";
import { AdvisorShell } from "../advisor-shell";
import { loadPublicAdvisor } from "../public-advisor";
import styles from "../public-subpage.module.css";
import { Calculators } from "./calculators";

export const dynamic = "force-dynamic";

export default async function CalculatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const advisor = await loadPublicAdvisor(slug);
  return <AdvisorShell advisor={advisor} slug={slug} current="rechner">
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>Rechner</p><h1>Zahlen zuerst selbst einordnen.</h1><p className={styles.lead}>Vier datensparsame Rechenhilfen für Budget, Sparentwicklung, Zielrate und Reserve. Die Eingaben bleiben im Browser.</p>
      <div className={styles.actions}><Link className={styles.primary} href={"/book?advisor="+encodeURIComponent(advisor.profile.id)}>Ergebnis im Gespräch einordnen</Link></div></div>
      <aside className={styles.heroAside}><strong>Keine automatische Übertragung</strong><p>Die eingegebenen Beträge werden nicht gespeichert und nicht an den Berater übermittelt.</p></aside>
    </section>
    <section className={styles.section}>
      <div className={styles.sectionIntro}><p className={styles.eyebrow}>Simulatoren</p><h2>Unverbindlich rechnen</h2><p>Die Ergebnisse sind mathematische Modellwerte. Sie ersetzen keine individuelle Prüfung von Produkten, Steuern, Inflation, Kosten oder Risiken.</p></div>
      <Calculators />
    </section>
  </AdvisorShell>;
}
